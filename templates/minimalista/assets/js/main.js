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
      
    } catch (error) {
      console.error('RadioPulsePlayer: Error initializing:', error);
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
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
      // Feature coming soon
    });
    
    // Next button (for future use)
    document.getElementById('next-btn').addEventListener('click', () => {
      // Feature coming soon
    });
    
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('loadstart', () => {
        // Audio loading started
      });
      
      this.audioPlayer.addEventListener('canplay', () => {
        // Audio can play
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
  }

  stopVisualizerAnimation() {
    // El visualizador se maneja en startVisualizer()
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
      
      if (this.videoStreamUrl && this.videoStreamUrl.trim() !== '') {
        const tvButton = document.getElementById('tv-online-btn');
        if (tvButton) {
          tvButton.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('RadioPulsePlayer: Error checking TV availability:', error);
    }
  }

  setupMediaToggle() {
    const tvButton = document.getElementById('tv-online-btn');
    const popupOverlay = document.getElementById('tv-popup-overlay');
    const closeButton = document.getElementById('tv-popup-close');
    
    // Open TV popup
    if (tvButton) {
      tvButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.openTVPopup();
      });
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
    const popupOverlay = document.getElementById('tv-popup-overlay');
    
    if (popupOverlay) {
      popupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Initialize TV player if not already done
      if (!this.tvPlayer) {
        this.initializeTVPlayer();
      }
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
  }

  async initializeTVPlayer() {
    const container = document.getElementById('tv-player-container');
    if (!container) return;

    // Si no hay URL de video, mostrar mensaje
    if (!this.videoStreamUrl || this.videoStreamUrl.trim() === '') {
      container.innerHTML = `
        <div class="tv-mode">
          <div class="tv-unavailable">
            <i class="fas fa-tv"></i>
            <h3>TV Online no configurada</h3>
            <p>Esta radio no tiene señal de televisión configurada en el panel de IPStream.</p>
            <p><small>Para habilitar TV Online, agrega una URL en el campo "videoStreamingUrl" en tu panel de IPStream.</small></p>
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
              <span>Señal en vivo disponible</span>
            </div>
          </div>
        </div>
      `;

      // Configurar el reproductor
      setTimeout(async () => {
        const video = document.getElementById('tv-video-simple');
        
        if (video && this.videoStreamUrl) {
          // Si es un stream HLS (.m3u8), intentar usar HLS.js
          if (this.videoStreamUrl.includes('.m3u8')) {
            try {
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
                const hls = new window.Hls({
                  enableWorker: true,
                  lowLatencyMode: true,
                  backBufferLength: 90
                });
                
                hls.loadSource(this.videoStreamUrl);
                hls.attachMedia(video);
                
                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                  video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                
                this.tvPlayer = { hls, video };
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Soporte nativo HLS (Safari)
                video.src = this.videoStreamUrl;
                video.play().catch(e => console.log('Autoplay prevented:', e));
                this.tvPlayer = { video };
              }
            } catch (error) {
              // Fallback simple
              video.src = this.videoStreamUrl;
              this.tvPlayer = { video };
            }
          } else {
            // Para otros tipos de video
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
}

// Initialize the radio pulse player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.radioPulsePlayer = new RadioPulsePlayer();
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
    } else {
      // Page is visible, resume animations
    }
  }
});