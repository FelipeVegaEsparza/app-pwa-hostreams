import { 
  getBasicData, 
  buildImageUrl, 
  getSocialNetworks,
  getCurrentSong
} from '/assets/js/api.js';

class RadioPulsePlayer {
  constructor() {
    this.audioPlayer = null;
    this.isPlaying = false;
    this.currentVolume = 50;
    this.sonicPanelInterval = null;
    this.currentSongData = null;
    this.visualizerInterval = null;
    this.tvPlayer = null;
    this.currentMode = 'radio';
    this.videoStreamUrl = null;
    
    this.init();
  }

  async init() {
    console.log('RadioPulsePlayer: Initializing minimalist player...');
    // Loading is now managed by loading-manager.js
    
    try {
      await this.loadBasicData();
      await this.loadSocialNetworks();
      await this.checkTVAvailability();
      
      // Setup media toggle with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupMediaToggle();
      }, 100);
      
      this.setupAudioPlayer();
      this.setupVolumeControl();
      this.setupRippleEffects();
      await this.loadSonicPanelData();
      this.startSonicPanelUpdates();
      this.startVisualizer();
      
      console.log('RadioPulsePlayer: Player ready! 🎵');
    } catch (error) {
      console.error('RadioPulsePlayer: Error initializing:', error);
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        console.log('Template7: Fallback - Ocultando loading');
        if (window.loadingManager) {
          window.loadingManager.forceHide();
        } else {
          overlay.style.display = 'none';
        }
      }
    }, 8000);
  }

  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  async loadBasicData() {
    try {
      const data = await getBasicData();
      const logoUrl = await buildImageUrl(data.logoUrl);
      
      // Update branding
      const elements = {
        'radio-logo': logoUrl,
        'footer-radio-name': data.projectName
      };
      
      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          if (id.includes('logo')) {
            element.src = value;
            element.style.display = 'block';
          } else {
            element.textContent = value;
          }
        }
      });
      
      // Store streaming URL
      this.streamUrl = data.radioStreamingUrl;
      
    } catch (error) {
      console.error('RadioPulsePlayer: Error loading basic data:', error);
    }
  }

  async loadSocialNetworks() {
    try {
      const socialData = await getSocialNetworks();
      
      if (socialData && typeof socialData === 'object') {
        const socialNetworks = [];
        
        if (socialData.facebook) {
          socialNetworks.push({ name: 'facebook', url: socialData.facebook });
        }
        if (socialData.instagram) {
          socialNetworks.push({ name: 'instagram', url: socialData.instagram });
        }
        if (socialData.x) {
          socialNetworks.push({ name: 'twitter', url: socialData.x });
        }
        if (socialData.youtube) {
          socialNetworks.push({ name: 'youtube', url: socialData.youtube });
        }
        if (socialData.tiktok) {
          socialNetworks.push({ name: 'tiktok', url: socialData.tiktok });
        }
        if (socialData.whatsapp) {
          const whatsappUrl = socialData.whatsapp.startsWith('http') 
            ? socialData.whatsapp 
            : `https://wa.me/${socialData.whatsapp.replace(/[^0-9]/g, '')}`;
          socialNetworks.push({ name: 'whatsapp', url: whatsappUrl });
        }
        
        if (socialNetworks.length > 0) {
          const socialHtml = socialNetworks.map(social => `
            <a href="${social.url}" target="_blank" title="${social.name}">
              <i class="${this.getSocialIcon(social.name)}"></i>
            </a>
          `).join('');
          
          document.getElementById('social-links').innerHTML = socialHtml;
        }
      }
    } catch (error) {
      console.error('RadioPulsePlayer: Error loading social networks:', error);
    }
  }

  getSocialIcon(socialName) {
    const icons = {
      'facebook': 'fab fa-facebook-f',
      'twitter': 'fab fa-twitter',
      'instagram': 'fab fa-instagram',
      'youtube': 'fab fa-youtube',
      'tiktok': 'fab fa-tiktok',
      'whatsapp': 'fab fa-whatsapp',
      'telegram': 'fab fa-telegram',
      'linkedin': 'fab fa-linkedin-in'
    };
    
    return icons[socialName.toLowerCase()] || 'fas fa-link';
  }

  async loadSonicPanelData() {
    try {
      const songData = await getCurrentSong();
      
      if (songData) {
        this.currentSongData = songData;
        this.updateCurrentSongDisplay(songData);
        this.updateBackgroundCover(songData);
      }
    } catch (error) {
      console.error('RadioPulsePlayer: Error loading SonicPanel data:', error);
    }
  }

  updateCurrentSongDisplay(songData) {
    document.getElementById('track-title').textContent = songData.title || 'Radio Pulse';
    document.getElementById('track-artist').textContent = songData.artist || 'En Vivo';
    document.getElementById('listeners-count').textContent = songData.listeners || '0';
    document.getElementById('audio-quality').textContent = songData.bitrate ? `${songData.bitrate}k` : 'HD';
    document.getElementById('bitrate').textContent = songData.bitrate || 'N/A';
    
    // Update artwork
    if (songData.art) {
      const trackArtwork = document.getElementById('track-artwork');
      const defaultArtwork = document.getElementById('default-artwork');
      
      if (trackArtwork && defaultArtwork) {
        trackArtwork.src = songData.art;
        trackArtwork.style.display = 'block';
        defaultArtwork.style.display = 'none';
      }
    }
  }

  updateBackgroundCover(songData) {
    const bgCover = document.getElementById('bg-cover');
    
    if (songData.art && bgCover) {
      bgCover.style.backgroundImage = `url(${songData.art})`;
    }
  }

  startSonicPanelUpdates() {
    this.sonicPanelInterval = setInterval(() => {
      this.loadSonicPanelData();
    }, 30000);
  }

  setupAudioPlayer() {
    this.audioPlayer = document.getElementById('radio-audio');
    
    // Play button
    document.getElementById('play-btn').addEventListener('click', () => {
      this.toggleAudio();
    });
    
    // Previous button (for future use)
    document.getElementById('prev-btn').addEventListener('click', () => {
      console.log('Previous track - Feature coming soon');
    });
    
    // Next button (for future use)
    document.getElementById('next-btn').addEventListener('click', () => {
      console.log('Next track - Feature coming soon');
    });
    
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('loadstart', () => {
        console.log('RadioPulsePlayer: Audio loading started');
      });
      
      this.audioPlayer.addEventListener('canplay', () => {
        console.log('RadioPulsePlayer: Audio can play');
      });
      
      this.audioPlayer.addEventListener('error', (e) => {
        console.error('RadioPulsePlayer: Audio error:', e);
        this.handleAudioError();
      });
    }
  }

  setupVolumeControl() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeFill = document.querySelector('.volume-fill');
    
    if (volumeSlider && volumeFill) {
      volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        this.setVolume(value);
        volumeFill.style.width = `${value}%`;
      });
      
      // Initialize volume fill
      volumeFill.style.width = `${this.currentVolume}%`;
    }
  }

  setupRippleEffects() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.control-btn')) {
        const btn = e.target.closest('.control-btn');
        const ripple = btn.querySelector('.btn-ripple');
        
        if (ripple) {
          ripple.style.width = '0';
          ripple.style.height = '0';
          
          setTimeout(() => {
            ripple.style.width = '200px';
            ripple.style.height = '200px';
          }, 10);
          
          setTimeout(() => {
            ripple.style.width = '0';
            ripple.style.height = '0';
          }, 600);
        }
      }
    });
  }

  startVisualizer() {
    const bars = document.querySelectorAll('.bar');
    const visualizer = document.getElementById('audio-visualizer');
    
    // Enhanced visualizer when playing
    this.visualizerInterval = setInterval(() => {
      if (this.isPlaying) {
        // Add playing class to enable CSS animations
        visualizer.classList.add('playing');
        
        // Add random variations for more dynamic effect with slower changes
        bars.forEach((bar, index) => {
          const baseHeight = Math.random() * 60 + 15; // Random height between 15-75px
          const opacity = Math.random() * 0.3 + 0.7; // Random opacity between 0.7-1
          
          bar.style.height = `${baseHeight}px`;
          bar.style.opacity = opacity;
        });
      } else {
        // Remove playing class to stop CSS animations
        visualizer.classList.remove('playing');
        
        // Reset to static state
        bars.forEach(bar => {
          bar.style.height = '8px';
          bar.style.opacity = '0.3';
        });
      }
    }, 300);
  }

  toggleAudio() {
    if (!this.audioPlayer || !this.streamUrl) {
      console.error('RadioPulsePlayer: Audio player or stream URL not available');
      return;
    }
    
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    if (!this.audioPlayer || !this.streamUrl) return;
    
    this.audioPlayer.src = this.streamUrl;
    this.audioPlayer.volume = this.currentVolume / 100;
    
    this.audioPlayer.play().then(() => {
      this.isPlaying = true;
      this.updatePlayButton(true);
      this.startVisualizerAnimation();
      this.startArtworkAnimation();
      console.log('RadioPulsePlayer: Audio playing');
    }).catch(error => {
      console.error('RadioPulsePlayer: Error playing audio:', error);
      this.handleAudioError();
    });
  }

  pauseAudio() {
    if (!this.audioPlayer) return;
    
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.updatePlayButton(false);
    this.stopVisualizerAnimation();
    this.stopArtworkAnimation();
    console.log('RadioPulsePlayer: Audio paused');
  }

  setVolume(volume) {
    this.currentVolume = volume;
    if (this.audioPlayer) {
      this.audioPlayer.volume = volume / 100;
    }
  }

  updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('play-btn');
    const icon = playBtn.querySelector('i');
    
    if (isPlaying) {
      icon.className = 'fas fa-pause';
    } else {
      icon.className = 'fas fa-play';
    }
  }

  startVisualizerAnimation() {
    // El visualizador se maneja en startVisualizer()
    console.log('RadioPulsePlayer: Visualizer animation started');
  }

  stopVisualizerAnimation() {
    // El visualizador se maneja en startVisualizer()
    console.log('RadioPulsePlayer: Visualizer animation stopped');
  }

  startArtworkAnimation() {
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.add('playing');
    }
  }

  stopArtworkAnimation() {
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.remove('playing');
    }
  }

  handleAudioError() {
    this.isPlaying = false;
    this.updatePlayButton(false);
    this.stopVisualizerAnimation();
    this.stopArtworkAnimation();
    console.error('RadioPulsePlayer: Audio playback error');
  }

  destroy() {
    if (this.sonicPanelInterval) {
      clearInterval(this.sonicPanelInterval);
    }
    
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
    }
    
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.src = '';
    }

    if (this.tvPlayer) {
      this.tvPlayer.destroy();
    }
  }

  async checkTVAvailability() {
    try {
      const { getVideoStreamingUrl } = await import('/assets/js/api.js');
      this.videoStreamUrl = await getVideoStreamingUrl();
      
      console.log('RadioPulsePlayer: Video URL obtenida:', this.videoStreamUrl);
      
      if (this.videoStreamUrl && this.videoStreamUrl.trim() !== '') {
        const tvButton = document.getElementById('tv-online-btn');
        if (tvButton) {
          tvButton.style.display = 'flex';
        }
        console.log('RadioPulsePlayer: TV Online available with URL:', this.videoStreamUrl);
      } else {
        console.log('RadioPulsePlayer: TV Online not available - no video URL');
        console.log('RadioPulsePlayer: Para habilitar TV Online, configura videoStreamingUrl en el panel de IPStream');
      }
    } catch (error) {
      console.error('RadioPulsePlayer: Error checking TV availability:', error);
    }
  }

  setupMediaToggle() {
    const tvButton = document.getElementById('tv-online-btn');
    const popupOverlay = document.getElementById('tv-popup-overlay');
    const closeButton = document.getElementById('tv-popup-close');
    
    console.log('RadioPulsePlayer: Setting up media toggle');
    console.log('TV Button found:', !!tvButton);
    console.log('Popup Overlay found:', !!popupOverlay);
    console.log('Close Button found:', !!closeButton);
    
    // Open TV popup
    if (tvButton) {
      tvButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('RadioPulsePlayer: TV button clicked');
        this.openTVPopup();
      });
    } else {
      console.error('RadioPulsePlayer: TV button not found');
    }
    
    // Close TV popup
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeTVPopup();
      });
    }
    
    // Close popup when clicking overlay
    if (popupOverlay) {
      popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
          this.closeTVPopup();
        }
      });
    }
    
    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popupOverlay && popupOverlay.classList.contains('active')) {
        this.closeTVPopup();
      }
    });
  }

  openTVPopup() {
    console.log('RadioPulsePlayer: Opening TV popup');
    const popupOverlay = document.getElementById('tv-popup-overlay');
    console.log('Popup overlay element:', popupOverlay);
    
    if (popupOverlay) {
      console.log('RadioPulsePlayer: Adding active class to popup');
      popupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Initialize TV player if not already done
      if (!this.tvPlayer) {
        console.log('RadioPulsePlayer: Initializing TV player');
        this.initializeTVPlayer();
      }
    } else {
      console.error('RadioPulsePlayer: Popup overlay not found');
    }
  }

  closeTVPopup() {
    const popupOverlay = document.getElementById('tv-popup-overlay');
    if (popupOverlay) {
      popupOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      
      // Pause TV player when closing popup
      this.pauseTVPlayer();
    }
  }

  switchMode(mode) {
    // This method is no longer needed since we use popup
    console.log('RadioPulsePlayer: switchMode deprecated - using popup instead');
  }

  async initializeTVPlayer() {
    const container = document.getElementById('tv-player-container');
    if (!container) return;

    console.log('RadioPulsePlayer: Inicializando TV Player...');
    console.log('RadioPulsePlayer: Video URL:', this.videoStreamUrl);

    // Si no hay URL de video, mostrar mensaje y opción de prueba
    if (!this.videoStreamUrl || this.videoStreamUrl.trim() === '') {
      container.innerHTML = `
        <div class="tv-mode">
          <div class="tv-unavailable">
            <i class="fas fa-tv"></i>
            <h3>TV Online no configurada</h3>
            <p>Esta radio no tiene señal de televisión configurada en el panel de IPStream.</p>
            <p><small>Para habilitar TV Online, agrega una URL en el campo "videoStreamingUrl" en tu panel de IPStream.</small></p>
            <br>
            <button onclick="window.radioPulsePlayer.testWithSampleVideo()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              🧪 Probar con video de ejemplo
            </button>
          </div>
        </div>
      `;
      return;
    }

    try {
      // Crear un reproductor de video simple y funcional
      container.innerHTML = `
        <div class="tv-mode">
          <div style="position: relative; width: 100%; height: 500px; background: #000;">
            <video 
              id="tv-video-simple" 
              controls 
              muted
              style="width: 100%; height: 100%; background: #000; object-fit: contain;"
            >
              <source src="${this.videoStreamUrl}" type="application/x-mpegURL">
              <source src="${this.videoStreamUrl}" type="video/mp4">
              Tu navegador no soporta la reproducción de video.
            </video>
            <div class="tv-status">
              <div class="status-dot"></div>
              <span>Cargando señal...</span>
            </div>
          </div>
        </div>
      `;

      // Configurar el reproductor
      setTimeout(async () => {
        const video = document.getElementById('tv-video-simple');
        const statusElement = container.querySelector('.tv-status span');
        
        if (video && this.videoStreamUrl) {
          console.log('RadioPulsePlayer: Configurando video con URL:', this.videoStreamUrl);
          
          // Event listeners para debug
          video.addEventListener('loadstart', () => {
            console.log('RadioPulsePlayer: Video - loadstart');
            if (statusElement) statusElement.textContent = 'Conectando...';
          });
          
          video.addEventListener('loadedmetadata', () => {
            console.log('RadioPulsePlayer: Video - loadedmetadata');
            if (statusElement) statusElement.textContent = 'Señal cargada';
          });
          
          video.addEventListener('canplay', () => {
            console.log('RadioPulsePlayer: Video - canplay');
            if (statusElement) statusElement.textContent = 'Señal en vivo disponible';
          });
          
          video.addEventListener('error', (e) => {
            console.error('RadioPulsePlayer: Video error:', e);
            console.error('RadioPulsePlayer: Video error details:', video.error);
            if (statusElement) statusElement.textContent = 'Error al cargar señal';
            
            // Mostrar error detallado
            container.innerHTML = `
              <div class="tv-mode">
                <div class="tv-unavailable">
                  <i class="fas fa-exclamation-triangle"></i>
                  <h3>Error al cargar video</h3>
                  <p>No se pudo cargar la señal de video.</p>
                  <p><small>URL: ${this.videoStreamUrl}</small></p>
                  <p><small>Error: ${video.error ? video.error.message : 'Desconocido'}</small></p>
                  <br>
                  <button onclick="window.radioPulsePlayer.testWithSampleVideo()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    🧪 Probar con video de ejemplo
                  </button>
                </div>
              </div>
            `;
          });
          
          // Si es un stream HLS (.m3u8), intentar usar HLS.js
          if (this.videoStreamUrl.includes('.m3u8')) {
            try {
              console.log('RadioPulsePlayer: Detectado stream HLS, cargando HLS.js...');
              
              // Cargar HLS.js si no está cargado
              if (!window.Hls) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
                document.head.appendChild(script);
                
                await new Promise((resolve, reject) => {
                  script.onload = resolve;
                  script.onerror = reject;
                });
              }

              if (window.Hls && window.Hls.isSupported()) {
                console.log('RadioPulsePlayer: Usando HLS.js para reproducción');
                const hls = new window.Hls({
                  enableWorker: true,
                  lowLatencyMode: true,
                  backBufferLength: 90
                });
                
                hls.loadSource(this.videoStreamUrl);
                hls.attachMedia(video);
                
                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                  console.log('RadioPulsePlayer: HLS manifest cargado correctamente');
                  if (statusElement) statusElement.textContent = 'Señal en vivo disponible';
                  video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                
                hls.on(window.Hls.Events.ERROR, (event, data) => {
                  console.error('RadioPulsePlayer: HLS error:', data);
                  if (statusElement) statusElement.textContent = 'Error en stream HLS';
                });
                
                this.tvPlayer = { hls, video };
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Soporte nativo HLS (Safari)
                console.log('RadioPulsePlayer: Usando soporte nativo HLS');
                video.src = this.videoStreamUrl;
                video.play().catch(e => console.log('Autoplay prevented:', e));
                this.tvPlayer = { video };
              } else {
                console.error('RadioPulsePlayer: HLS no soportado en este navegador');
                if (statusElement) statusElement.textContent = 'HLS no soportado';
              }
            } catch (error) {
              console.error('RadioPulsePlayer: Error configurando HLS:', error);
              // Fallback simple
              video.src = this.videoStreamUrl;
              this.tvPlayer = { video };
            }
          } else {
            // Para otros tipos de video
            console.log('RadioPulsePlayer: Usando reproductor estándar');
            video.src = this.videoStreamUrl;
            video.play().catch(e => console.log('Autoplay prevented:', e));
            this.tvPlayer = { video };
          }
        }
      }, 500);

    } catch (error) {
      console.error('RadioPulsePlayer: Error inicializando TV player:', error);
      container.innerHTML = `
        <div class="tv-mode">
          <div class="tv-unavailable">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al inicializar reproductor</h3>
            <p>Hubo un problema técnico al inicializar el reproductor de video.</p>
            <p><small>Error: ${error.message}</small></p>
          </div>
        </div>
      `;
    }
  }

  pauseTVPlayer() {
    if (this.tvPlayer) {
      if (this.tvPlayer.video) {
        this.tvPlayer.video.pause();
      }
      if (this.tvPlayer.hls) {
        this.tvPlayer.hls.destroy();
      }
    }
  }

  // Test function for debugging
  testTVPopup() {
    console.log('Testing TV popup...');
    const tvButton = document.getElementById('tv-online-btn');
    const popupOverlay = document.getElementById('tv-popup-overlay');
    
    console.log('TV Button:', tvButton);
    console.log('Popup Overlay:', popupOverlay);
    
    if (tvButton) {
      console.log('TV Button display:', window.getComputedStyle(tvButton).display);
      console.log('TV Button visibility:', window.getComputedStyle(tvButton).visibility);
    }
    
    if (popupOverlay) {
      console.log('Popup classes:', popupOverlay.classList.toString());
      console.log('Popup display:', window.getComputedStyle(popupOverlay).display);
      console.log('Popup visibility:', window.getComputedStyle(popupOverlay).visibility);
      console.log('Popup opacity:', window.getComputedStyle(popupOverlay).opacity);
    }
    
    // Try to open popup manually
    this.openTVPopup();
  }

  // Simple debug popup
  showDebugPopup() {
    // Remove any existing debug popup
    const existing = document.querySelector('.debug-popup');
    if (existing) existing.remove();
    
    // Create debug popup
    const debugPopup = document.createElement('div');
    debugPopup.className = 'debug-popup';
    debugPopup.innerHTML = `
      <h3>Debug TV Popup</h3>
      <p>Video URL: ${this.videoStreamUrl || 'No configurada'}</p>
      <p>TV Player: ${this.tvPlayer ? 'Inicializado' : 'No inicializado'}</p>
      <button onclick="this.parentElement.remove()">Close</button>
      <button onclick="window.radioPulsePlayer.testVideoURL()">Test Video</button>
    `;
    
    document.body.appendChild(debugPopup);
    console.log('Debug popup created');
  }

  // Test video URL
  testVideoURL() {
    console.log('Testing video URL:', this.videoStreamUrl);
    
    if (!this.videoStreamUrl) {
      alert('No hay URL de video configurada. Verifica que el cliente tenga videoStreamingUrl en la API de IPStream.');
      return;
    }
    
    // Test if URL is accessible
    fetch(this.videoStreamUrl, { method: 'HEAD' })
      .then(response => {
        console.log('Video URL response:', response.status);
        if (response.ok) {
          alert('URL de video accesible: ' + response.status);
        } else {
          alert('URL de video no accesible: ' + response.status);
        }
      })
      .catch(error => {
        console.error('Error testing video URL:', error);
        alert('Error al probar URL: ' + error.message);
      });
  }

  // Test with sample video
  testWithSampleVideo() {
    console.log('RadioPulsePlayer: Probando con video de ejemplo...');
    
    // URL de video de prueba (stream HLS público)
    const sampleVideoURL = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
    
    const container = document.getElementById('tv-player-container');
    if (!container) return;

    container.innerHTML = `
      <div class="tv-mode">
        <div style="position: relative; width: 100%; height: 500px; background: #000;">
          <video 
            id="tv-video-test" 
            controls 
            muted
            autoplay
            style="width: 100%; height: 100%; background: #000; object-fit: contain;"
          >
            <source src="${sampleVideoURL}" type="application/x-mpegURL">
            Tu navegador no soporta la reproducción de video.
          </video>
          <div class="tv-status">
            <div class="status-dot"></div>
            <span>Video de prueba - Tears of Steel</span>
          </div>
        </div>
      </div>
    `;

    // Configurar video de prueba
    setTimeout(async () => {
      const video = document.getElementById('tv-video-test');
      if (video) {
        console.log('RadioPulsePlayer: Configurando video de prueba...');
        
        video.addEventListener('loadstart', () => console.log('Test video: loadstart'));
        video.addEventListener('canplay', () => console.log('Test video: canplay'));
        video.addEventListener('error', (e) => console.error('Test video error:', e));
        
        // Usar HLS.js para el video de prueba
        try {
          if (!window.Hls) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls();
            hls.loadSource(sampleVideoURL);
            hls.attachMedia(video);
            
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              console.log('RadioPulsePlayer: Video de prueba cargado');
              video.play().catch(e => console.log('Autoplay prevented:', e));
            });
          } else {
            video.src = sampleVideoURL;
            video.play().catch(e => console.log('Autoplay prevented:', e));
          }
        } catch (error) {
          console.error('Error con video de prueba:', error);
          video.src = sampleVideoURL;
        }
      }
    }, 500);
  }
}

// Initialize the radio pulse player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('RadioPulsePlayer: DOM loaded, creating player instance...');
  try {
    window.radioPulsePlayer = new RadioPulsePlayer();
    console.log('RadioPulsePlayer: Player instance created successfully');
  } catch (error) {
    console.error('RadioPulsePlayer: Error creating player instance:', error);
    console.error('RadioPulsePlayer: Error stack:', error.stack);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.radioPulsePlayer) {
    window.radioPulsePlayer.destroy();
  }
});

// Handle visibility change to pause/resume visualizer
document.addEventListener('visibilitychange', () => {
  if (window.radioPulsePlayer) {
    if (document.hidden) {
      // Page is hidden, reduce animations
      console.log('RadioPulsePlayer: Page hidden, reducing animations');
    } else {
      // Page is visible, resume animations
      console.log('RadioPulsePlayer: Page visible, resuming animations');
    }
  }
});