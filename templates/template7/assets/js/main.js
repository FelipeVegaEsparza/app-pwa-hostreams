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
    
    this.init();
  }

  async init() {
    console.log('RadioPulsePlayer: Initializing minimalist player...');
    // Loading is now managed by loading-manager.js
    
    try {
      await this.loadBasicData();
      await this.loadSocialNetworks();
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