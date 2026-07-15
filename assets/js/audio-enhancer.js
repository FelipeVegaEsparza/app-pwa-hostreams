/**
 * AudioEnhancer - Mejora de calidad del stream de radio en vivo.
 *
 * Inserta una cadena de procesamiento (EQ 4 bandas -> Compressor ->
 * Limiter -> Output Gain) en el grafo de Web Audio API que arma
 * el VU meter. Sin recargar ni re-buferar el stream.
 *
 * Pipeline:
 *   source -> stereoWidener -> lowShelf -> midPeak -> presPeak -> highShelf
 *          -> [multiband: 3 bandas con compressor independiente]
 *          -> [limiter] -> outGain -> userGain -> analyser -> destination
 *
 * El stereoWidener es siempre passthrough (width=1.0) a menos que
 * el preset defina `width`. El multiband es opcional: si el preset
 * lo define, se usa un sub-grafo de 3 bandas con crossover L-R 4°
 * orden y DynamicsCompressor por banda. Si no, un solo compressor.
 * Persistencia: la configuracion (enabled, preset) vive en
 * config.json bajo la clave `audio_enhancer`. No usa localStorage.
 *
 * Si el VU meter no logro `createMediaElementSource` (audio sin
 * `crossorigin="anonymous"` y el servidor no manda CORS), el
 * enhancer queda inactivo y el audio pasa intacto.
 */
import { config } from './config.js';

const PRESETS = {
  enhanced: {
    width: 1.15,
    low:    { type: 'lowshelf',  freq: 80,   gain:  5.0 },
    mid:    { type: 'peaking',   freq: 250,  gain: -3.0, Q: 0.7 },
    pres:   { type: 'peaking',   freq: 3200, gain:  2.5, Q: 0.8 },
    high:   { type: 'highshelf', freq: 8000, gain:  1.5 },
    multiband: {
      bands: [
        { type: 'lowpass',  freq: 200, comp: { threshold: -28, ratio: 3.5, attack: 0.010, release: 0.100, knee: 10 } },
        { type: 'bandpass', lowFreq: 200, highFreq: 3500, comp: { threshold: -23, ratio: 2.5, attack: 0.008, release: 0.120, knee: 10 } },
        { type: 'highpass', freq: 3500, comp: { threshold: -22, ratio: 4.0, attack: 0.005, release: 0.060, knee: 8 } }
      ]
    },
    limit:  { threshold: -0.5, ratio: 20.0,  attack: 0.001, release: 0.050, knee: 0 },
    outGain: 2.0
  },
  flat: {
    low:    { type: 'lowshelf',  freq: 80,   gain:  0.0 },
    mid:    { type: 'peaking',   freq: 250,  gain:  0.0, Q: 0.7 },
    pres:   { type: 'peaking',   freq: 3200, gain:  0.0, Q: 0.8 },
    high:   { type: 'highshelf', freq: 8000, gain:  0.0 },
    comp:   { threshold: -22, ratio: 2.0,   attack: 0.020, release: 0.200, knee: 12 },
    limit:  null,
    outGain: 0.0
  },
  vocal: {
    low:    { type: 'lowshelf',  freq: 80,   gain: -6.0 },
    mid:    { type: 'peaking',   freq: 250,  gain: -4.0, Q: 0.9 },
    pres:   { type: 'peaking',   freq: 2500, gain:  3.0, Q: 0.9 },
    high:   { type: 'highshelf', freq: 5000, gain:  2.0 },
    comp:   { threshold: -22, ratio: 2.5,   attack: 0.015, release: 0.180, knee: 8 },
    limit:  { threshold: -1.0, ratio: 20.0,  attack: 0.001, release: 0.050, knee: 0 },
    outGain: 0.0
  },
  bass: {
    low:    { type: 'lowshelf',  freq: 60,   gain:  9.0 },
    mid:    { type: 'peaking',   freq: 150,  gain:  3.0, Q: 0.7 },
    pres:   { type: 'peaking',   freq: 3200, gain: -2.0, Q: 0.8 },
    high:   { type: 'highshelf', freq: 8000, gain:  0.0 },
    comp:   { threshold: -20, ratio: 2.0,   attack: 0.015, release: 0.200, knee: 8 },
    limit:  { threshold: -1.0, ratio: 20.0,  attack: 0.001, release: 0.050, knee: 0 },
    outGain: 0.0
  },
  soft: {
    low:    { type: 'lowshelf',  freq: 80,   gain: -2.0 },
    mid:    { type: 'peaking',   freq: 250,  gain:  0.0, Q: 0.7 },
    pres:   { type: 'peaking',   freq: 3200, gain: -3.0, Q: 0.8 },
    high:   { type: 'highshelf', freq: 8000, gain:  0.0 },
    comp:   { threshold: -28, ratio: 1.5,   attack: 0.025, release: 0.250, knee: 12 },
    limit:  { threshold: -3.0, ratio: 20.0,  attack: 0.001, release: 0.050, knee: 0 },
    outGain: -3.0
  }
};

class AudioEnhancer {
  constructor() {
    this._inited = false;
    this._audioElement = null;
    this._vuMeter = null;
    this._config = { enabled: true, preset: 'enhanced' };
    this._state = {
      enabled: true,
      preset: 'enhanced',
      active: false,
      reason: null
    };
    this._nodes = null;
    this._crossfadeMs = 50;
    this._mySourceCreated = false;
    this._sourceOwnedElsewhere = false;
  }

  async init({ audioElement, vuMeter = null } = {}) {
    if (this._inited) return this;
    if (!audioElement) {
      this._state.reason = 'no-audio-element';
      return this;
    }

    this._audioElement = audioElement;
    this._vuMeter = vuMeter;

    try {
      const cfg = (await config) || {};
      const enh = (cfg && cfg.audio_enhancer) || {};
      this._config = {
        enabled: enh.enabled !== false,
        preset: PRESETS[enh.preset] ? enh.preset : 'enhanced'
      };
    } catch (e) {
      console.warn('AudioEnhancer: no se pudo leer config, uso defaults', e);
    }

    this._state.enabled = this._config.enabled;
    this._state.preset = this._config.preset;

    if (!this._state.enabled) {
      this._state.reason = 'disabled-by-config';
      this._inited = true;
      return this;
    }

    this._installListeners();
    this._inited = true;
    return this;
  }

  _installListeners() {
    window.addEventListener('vumeter:realanalysis', (e) => {
      if (this._state.active) return;
      const vu = (e && e.detail && e.detail.vuMeter) || this._vuMeter;
      if (!vu) return;
      this._vuMeter = vu;
      this._wireIntoGraph(vu);
    });

    window.addEventListener('vumeter:realaudiofallback', () => {
      if (this._mySourceCreated) return;
      this._state.reason = 'no-cors';
      this._state.active = false;
      this._emit('change');
    });

    if (this._audioElement) {
      this._audioElement.addEventListener('play', () => this._onFirstPlay());
      this._audioElement.addEventListener('volumechange', () => this._onVolumeChange());
    }
  }

  _onFirstPlay() {
    if (this._state.active) return;
    if (!this._state.enabled) return;
    if (this._sourceOwnedElsewhere) return;
    console.info('AudioEnhancer: play detectado, cableando standalone...');
    this._wireStandalone();
  }

  _onVolumeChange() {
    if (!this._nodes || !this._nodes.userGain) return;
    this._nodes.userGain.gain.value = this._audioElement.volume;
  }

  _wireIntoGraph(vu) {
    try {
      const ctx = vu.getAudioContext && vu.getAudioContext();
      const source = vu.getSourceNode && vu.getSourceNode();
      const analyser = vu.getAnalyserNode && vu.getAnalyserNode();
      if (!ctx || !source || !analyser) {
        this._state.reason = 'vu-no-graph';
        this._emit('change');
        return;
      }

      const chain = this._buildChain(ctx);
      if (!chain) return;

      try { source.disconnect(); } catch (e) { /* ignore */ }
      try { analyser.disconnect(); } catch (e) { /* ignore */ }

      let prev = source;
      for (const step of chain.steps) {
        prev.connect(step.in);
        prev = step.out;
      }
      prev.connect(analyser);
      analyser.connect(ctx.destination);

      // El AudioContext del VU meter se crea durante init (sin gesto
      // del usuario) y queda en 'suspended'. Lo reanudamos aca para
      // que el audio sea audible. Si el VU meter ya lo reanudo (caso
      // vu-meter.js compartido), este llamado es un no-op.
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('AudioEnhancer: no se pudo reanudar el AudioContext', err);
        });
      }

      this._nodes = {
        mode: 'vu',
        ctx,
        source,
        analyser,
        ...chain,
        presetName: this._config.preset
      };

      this._onVolumeChange();
      this._state.active = true;
      this._state.reason = null;
      this._emit('change');
      console.info(`AudioEnhancer: activo (preset=${this._config.preset}, mode=vu)`);
    } catch (e) {
      console.warn('AudioEnhancer: no se pudo cablear el grafo', e);
      this._state.active = false;
      this._state.reason = 'wire-error';
      this._emit('change');
    }
  }

  _wireStandalone() {
    if (this._state.active) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      this._state.reason = 'no-web-audio';
      this._emit('change');
      return;
    }
    try {
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(this._audioElement);
      const chain = this._buildChain(ctx);
      if (!chain) {
        try { ctx.close(); } catch (e) { /* ignore */ }
        return;
      }

      let prev = source;
      for (const step of chain.steps) {
        prev.connect(step.in);
        prev = step.out;
      }
      prev.connect(ctx.destination);

      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('AudioEnhancer: no se pudo reanudar el AudioContext', err);
        });
      }

      this._nodes = {
        mode: 'standalone',
        ctx,
        source,
        analyser: null,
        ...chain,
        presetName: this._config.preset
      };

      this._mySourceCreated = true;
      this._onVolumeChange();
      this._state.active = true;
      this._state.reason = null;
      this._emit('change');
      console.info(`AudioEnhancer: activo (preset=${this._config.preset}, mode=standalone)`);
    } catch (e) {
      const isOwned = e && e.name === 'InvalidStateError';
      this._state.reason = isOwned ? 'source-owned' : 'wire-error';
      this._state.active = false;
      if (isOwned) this._sourceOwnedElsewhere = true;
      console.warn(`AudioEnhancer: no se pudo cablear standalone (${this._state.reason})`, e);
      this._emit('change');
    }
  }

  _buildChain(ctx) {
    try {
      const preset = PRESETS[this._config.preset] || PRESETS.enhanced;

      const lowShelf = ctx.createBiquadFilter();
      this._applyBiquad(lowShelf, preset.low);

      const midPeak = ctx.createBiquadFilter();
      this._applyBiquad(midPeak, preset.mid);

      const presPeak = ctx.createBiquadFilter();
      this._applyBiquad(presPeak, preset.pres);

      const highShelf = ctx.createBiquadFilter();
      this._applyBiquad(highShelf, preset.high);

      let compressorStep, compressors, multibandNodes;
      if (preset.multiband) {
        const mb = this._buildMultibandCompressor(ctx, preset.multiband);
        compressorStep = { in: mb.input, out: mb.output };
        compressors = mb.compressors;
        multibandNodes = mb.nodes;
      } else {
        const comp = ctx.createDynamicsCompressor();
        this._applyCompressor(comp, preset.comp);
        compressorStep = { in: comp, out: comp };
        compressors = [comp];
        multibandNodes = [];
      }

      let limiter = null;
      if (preset.limit) {
        limiter = ctx.createDynamicsCompressor();
        this._applyCompressor(limiter, preset.limit);
      }

      const outGain = ctx.createGain();
      outGain.gain.value = this._dbToLinear(preset.outGain);

      const userGain = ctx.createGain();
      userGain.gain.value = this._audioElement ? this._audioElement.volume : 1;

      // Widener siempre presente; cuando width=1.0 queda en passthrough
      // (L_out=L, R_out=R) y no afecta la señal. Esto simplifica
      // setPreset: solo hay que actualizar 4 gain values.
      // Si falla la construccion (ej: environment con quirks), cae
      // a un GainNode passthrough y la cadena sigue funcionando.
      const width = (typeof preset.width === 'number') ? preset.width : 1.0;
      let widener;
      try {
        widener = this._buildStereoWidener(ctx, width);
      } catch (e) {
        console.warn('AudioEnhancer: widener no disponible, usando passthrough', e);
        widener = {
          input: ctx.createGain(),
          output: null, // se setea abajo
          nodes: [],
          lToL: null, rToL: null, lToR: null, rToR: null,
          width: 1.0
        };
        widener.output = widener.input;
      }

      const steps = [
        { in: widener.input, out: widener.output || widener.input },
        { in: lowShelf, out: lowShelf },
        { in: midPeak, out: midPeak },
        { in: presPeak, out: presPeak },
        { in: highShelf, out: highShelf },
        compressorStep
      ];
      if (limiter) steps.push({ in: limiter, out: limiter });
      steps.push({ in: outGain, out: outGain });
      steps.push({ in: userGain, out: userGain });

      return {
        widener, widenerNodes: widener.nodes,
        lowShelf, midPeak, presPeak, highShelf,
        compressors, multibandNodes,
        limiter, outGain, userGain, steps
      };
    } catch (e) {
      console.warn('AudioEnhancer: no se pudo construir la cadena', e);
      this._state.reason = 'build-error';
      this._emit('change');
      return null;
    }
  }

  // Crea un sub-grafo de compresion multibanda con crossover
  // Linkwitz-Riley de 4to orden (dos Butterworth Q=0.707 cascados).
  // L-R 4to orden suma plano en el dominio de la potencia: 0 dB
  // exacto en los puntos de cruce, sin bultos ni valles.
  // 3 bandas:
  //   low  (lowpass  <fc1)
  //   mid  (bandpass fc1-fc2)
  //   high (highpass >fc2)
  // Cada banda tiene su propio DynamicsCompressor con settings
  // independientes. Retorna { input, output, compressors, nodes }.
  // El chain externo se conecta a `input` y sale de `output`.
  _buildMultibandCompressor(ctx, spec) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const compressors = [];
    const nodes = [];

    const lrLowpass = (freq) => {
      const f1 = ctx.createBiquadFilter();
      f1.type = 'lowpass';
      f1.frequency.value = freq;
      f1.Q.value = 0.707;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = freq;
      f2.Q.value = 0.707;
      f1.connect(f2);
      nodes.push(f1, f2);
      return { in: f1, out: f2 };
    };

    const lrHighpass = (freq) => {
      const f1 = ctx.createBiquadFilter();
      f1.type = 'highpass';
      f1.frequency.value = freq;
      f1.Q.value = 0.707;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'highpass';
      f2.frequency.value = freq;
      f2.Q.value = 0.707;
      f1.connect(f2);
      nodes.push(f1, f2);
      return { in: f1, out: f2 };
    };

    for (const band of spec.bands) {
      let bandStart;

      if (band.type === 'lowpass') {
        const lr = lrLowpass(band.freq);
        input.connect(lr.in);
        bandStart = lr.out;
      } else if (band.type === 'highpass') {
        const lr = lrHighpass(band.freq);
        input.connect(lr.in);
        bandStart = lr.out;
      } else if (band.type === 'bandpass') {
        const hp = lrHighpass(band.lowFreq);
        const lp = lrLowpass(band.highFreq);
        input.connect(hp.in);
        hp.out.connect(lp.in);
        bandStart = lp.out;
      }

      const comp = ctx.createDynamicsCompressor();
      this._applyCompressor(comp, band.comp);
      bandStart.connect(comp);
      comp.connect(output);
      nodes.push(comp);
      compressors.push(comp);
    }

    nodes.push(input, output);
    return { input, output, compressors, nodes };
  }

  // Stereo widener por matriz crossfeed (Haas-style).
  // width: 0.0 = mono (L=R), 1.0 = passthrough, 1.3 = mas ancho, 1.5+ = muy ancho.
  // Implementacion:
  //   L_out = L * a + R * b
  //   R_out = L * b + R * a
  // donde a = (1+width)/2 y b = (1-width)/2.
  // Cuando width=1: a=1, b=0 → passthrough.
  // Cuando width=1.3: a=1.15, b=-0.15 → ensancha.
  // Cuando width=0: a=b=0.5 → mono.
  // Devuelve los 4 GainNodes para poder actualizar el width en runtime.
  _buildStereoWidener(ctx, width) {
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const nodes = [splitter, merger];

    const a = (1 + width) / 2;
    const b = (1 - width) / 2;

    const lToL = ctx.createGain(); lToL.gain.value = a;
    const rToL = ctx.createGain(); rToL.gain.value = b;
    const lToR = ctx.createGain(); lToR.gain.value = b;
    const rToR = ctx.createGain(); rToR.gain.value = a;
    nodes.push(lToL, rToL, lToR, rToR);

    // connect(source, dest, outputIndex, inputIndex):
    // outputIndex = output del SOURCE (GainNode tiene solo output 0).
    // inputIndex  = input del DEST (ChannelMerger tiene inputs 0 y 1).
    splitter.connect(lToL, 0); lToL.connect(merger, 0, 0);
    splitter.connect(rToL, 1); rToL.connect(merger, 0, 0);
    splitter.connect(lToR, 0); lToR.connect(merger, 0, 1);
    splitter.connect(rToR, 1); rToR.connect(merger, 0, 1);

    return {
      input: splitter, output: merger, nodes,
      lToL, rToL, lToR, rToR,
      width
    };
  }

  _setStereoWidth(widener, width) {
    if (!widener) return;
    const a = (1 + width) / 2;
    const b = (1 - width) / 2;
    widener.lToL.gain.value = a;
    widener.rToL.gain.value = b;
    widener.lToR.gain.value = b;
    widener.rToR.gain.value = a;
    widener.width = width;
  }

  _applyBiquad(node, spec) {
    node.type = spec.type;
    node.frequency.value = spec.freq;
    node.gain.value = spec.gain || 0;
    if (typeof spec.Q === 'number') node.Q.value = spec.Q;
  }

  _dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  _applyCompressor(node, spec) {
    node.threshold.value = spec.threshold;
    node.ratio.value = spec.ratio;
    node.attack.value = spec.attack;
    node.release.value = spec.release;
    if (typeof spec.knee === 'number') node.knee.value = spec.knee;
  }

  setEnabled(enabled) {
    this._state.enabled = !!enabled;
    this._config.enabled = this._state.enabled;
    this._applyBypass();
    this._emit('change');
  }

  setPreset(name) {
    if (!PRESETS[name]) return;
    this._config.preset = name;
    this._state.preset = name;
    if (this._nodes) {
      const preset = PRESETS[name];
      this._applyBiquad(this._nodes.lowShelf, preset.low);
      this._applyBiquad(this._nodes.midPeak, preset.mid);
      this._applyBiquad(this._nodes.presPeak, preset.pres);
      this._applyBiquad(this._nodes.highShelf, preset.high);
      this._updateCompressors(preset);
      if (preset.limit && this._nodes.limiter) {
        this._applyCompressor(this._nodes.limiter, preset.limit);
      }
      const width = (typeof preset.width === 'number') ? preset.width : 1.0;
      this._setStereoWidth(this._nodes.widener, width);
      this._nodes.presetName = name;
      this._applyBypass();
    }
    this._emit('change');
  }

  // Actualiza todos los compressors del grafo: si el preset tiene
  // multiband, son 3 compressors; si no, es uno solo.
  _updateCompressors(preset) {
    if (preset.multiband && this._nodes.compressors) {
      for (let i = 0; i < this._nodes.compressors.length; i++) {
        const bandSpec = preset.multiband.bands[i];
        if (bandSpec) {
          this._applyCompressor(this._nodes.compressors[i], bandSpec.comp);
        }
      }
    } else if (this._nodes.compressors && this._nodes.compressors[0] && preset.comp) {
      this._applyCompressor(this._nodes.compressors[0], preset.comp);
    }
  }

  _applyBypass() {
    if (!this._nodes) return;
    const preset = PRESETS[this._config.preset] || PRESETS.enhanced;
    const transparent = { threshold: 0, ratio: 1, attack: 0.001, release: 0.050, knee: 0 };
    if (this._state.enabled) {
      this._applyBiquad(this._nodes.lowShelf, preset.low);
      this._applyBiquad(this._nodes.midPeak, preset.mid);
      this._applyBiquad(this._nodes.presPeak, preset.pres);
      this._applyBiquad(this._nodes.highShelf, preset.high);
      this._updateCompressors(preset);
      if (preset.limit && this._nodes.limiter) {
        this._applyCompressor(this._nodes.limiter, preset.limit);
      } else if (this._nodes.limiter) {
        this._applyCompressor(this._nodes.limiter, transparent);
      }
      const target = this._dbToLinear(preset.outGain);
      this._smoothGain(this._nodes.outGain.gain, target);
    } else {
      this._applyBiquad(this._nodes.lowShelf, { type: 'lowshelf', freq: 80, gain: 0 });
      this._applyBiquad(this._nodes.midPeak, { type: 'peaking', freq: 250, gain: 0, Q: 0.7 });
      this._applyBiquad(this._nodes.presPeak, { type: 'peaking', freq: 3200, gain: 0, Q: 0.8 });
      this._applyBiquad(this._nodes.highShelf, { type: 'highshelf', freq: 8000, gain: 0 });
      for (const comp of this._nodes.compressors) {
        this._applyCompressor(comp, transparent);
      }
      if (this._nodes.limiter) {
        this._applyCompressor(this._nodes.limiter, transparent);
      }
      this._smoothGain(this._nodes.outGain.gain, 1.0);
    }
  }

  _smoothGain(param, target) {
    const now = this._nodes.ctx.currentTime;
    const seconds = this._crossfadeMs / 1000;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(target, now, seconds / 3);
  }

  getState() {
    return { ...this._state };
  }

  _emit(name) {
    window.dispatchEvent(new CustomEvent(`audioenhancer:${name}`, { detail: { state: this._state } }));
    window.dispatchEvent(new CustomEvent('audioenhancer:change', { detail: { state: this._state } }));
  }

  destroy() {
    if (this._nodes) {
      try {
        this._nodes.source.disconnect();
        if (this._nodes.analyser) this._nodes.analyser.disconnect();
        for (const k of ['lowShelf','midPeak','presPeak','highShelf','limiter','outGain','userGain']) {
          if (this._nodes[k]) this._nodes[k].disconnect();
        }
        if (this._nodes.multibandNodes) {
          for (const n of this._nodes.multibandNodes) {
            try { n.disconnect(); } catch (e) { /* ignore */ }
          }
        }
        if (this._nodes.widenerNodes) {
          for (const n of this._nodes.widenerNodes) {
            try { n.disconnect(); } catch (e) { /* ignore */ }
          }
        }
        if (this._nodes.ctx && this._nodes.ctx.state !== 'closed') {
          this._nodes.ctx.close();
        }
      } catch (e) { /* ignore */ }
      this._nodes = null;
    }
    this._state.active = false;
    this._inited = false;
    this._mySourceCreated = false;
    this._sourceOwnedElsewhere = false;
  }
}

let _instance = null;

export function getAudioEnhancer() {
  if (!_instance) {
    _instance = new AudioEnhancer();
    if (typeof window !== 'undefined') {
      window.__audioEnhancer = _instance;
    }
  }
  return _instance;
}

export default AudioEnhancer;
