/**
 * Template Minimalista - Refactorizado usando TemplateBase
 * Este template solo se encarga del renderizado visual minimalista
 * Toda la lógica de datos y audio está en TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class MinimalistaTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links']
    });
    
    this.videoStreamUrl = null;
  }

  async init() {
    await super.init();
    
    try {
      await this.checkTVAvailability();
      console.log('MinimalistaTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('MinimalistaTemplate: Error in template-specific init:', error);
    }
  }

  async checkTVAvailability() {
    try {
      const dataManager = getDataManager();
      this.videoStreamUrl = await dataManager.loadVideoStreamUrl();
      
      const tvBtn = document.getElementById('tv-online-btn');
      if (tvBtn) {
        tvBtn.style.display = this.videoStreamUrl ? 'flex' : 'none';
      }
    } catch (error) {
      console.error('MinimalistaTemplate: Error checking TV availability:', error);
    }
  }

  // Sobrescribir: Actualizar display de canción actual con estilo minimalista
  updateCurrentSongDisplay(songData) {
    // Llamar al método base primero
    super.updateCurrentSongDisplay(songData);
    
    // Actualizar fondo con artwork si existe
    const bgCover = document.getElementById('bg-cover');
    if (bgCover && songData.art) {
      bgCover.style.backgroundImage = `url(${songData.art})`;
    }
  }

  // Sobrescribir: Cuando se reproduce audio
  onAudioPlay() {
    super.onAudioPlay();
    
    // Iniciar animaciones específicas del template minimalista
    const visualizer = document.getElementById('audio-visualizer');
    if (visualizer) {
      visualizer.classList.add('playing');
    }
    
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.add('playing');
    }
  }

  // Sobrescribir: Cuando se pausa audio
  onAudioPause() {
    super.onAudioPause();
    
    // Detener animaciones
    const visualizer = document.getElementById('audio-visualizer');
    if (visualizer) {
      visualizer.classList.remove('playing');
    }
    
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.remove('playing');
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.minimalistaTemplate = new MinimalistaTemplate();
    await window.minimalistaTemplate.init();
  } catch (error) {
    console.error('MinimalistaTemplate: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.minimalistaTemplate) {
    window.minimalistaTemplate.destroy();
  }
});

export default MinimalistaTemplate;
