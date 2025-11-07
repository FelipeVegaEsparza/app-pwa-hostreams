/**
 * Loading Manager - Sistema de precarga profesional
 * Actualiza la pantalla de carga con datos dinámicos de la API
 */

class LoadingManager {
  constructor() {
    this.loadingOverlay = null;
    this.loadingTitle = null;
    this.loadingSubtitle = null;
    this.loadingLogo = null;
    this.progressBar = null;
    this.currentProgress = 0;
    this.isInitialized = false;
  }

  /**
   * Inicializar el loading manager
   */
  init() {
    try {
      this.loadingOverlay = document.getElementById('loading-overlay');
      this.loadingTitle = document.getElementById('loading-title');
      this.loadingSubtitle = document.getElementById('loading-subtitle');
      this.loadingLogo = document.getElementById('loading-logo-img');
      this.progressBar = document.querySelector('.progress-bar');
      
      console.log('LoadingManager: Elementos encontrados:', {
        overlay: !!this.loadingOverlay,
        title: !!this.loadingTitle,
        subtitle: !!this.loadingSubtitle,
        logo: !!this.loadingLogo,
        progressBar: !!this.progressBar
      });
      
      if (this.loadingOverlay) {
        this.isInitialized = true;
        console.log('LoadingManager: Inicializado correctamente');
        this.startLoading();
      } else {
        console.warn('LoadingManager: No se encontró loading-overlay, ocultando inmediatamente');
        // Si no hay loading overlay, no hacer nada (el sitio se carga normalmente)
      }
    } catch (error) {
      console.error('LoadingManager: Error en inicialización:', error);
      // En caso de error, ocultar cualquier loading que pueda existir
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  /**
   * Iniciar el proceso de carga
   */
  async startLoading() {
    try {
      console.log('LoadingManager: Iniciando carga...');
      
      // Mostrar loading overlay
      this.show();
      
      // Cargar datos básicos de la API
      await this.loadBasicData();
      
      // Simular progreso de carga
      await this.simulateProgress();
    } catch (error) {
      console.error('LoadingManager: Error en startLoading:', error);
      // En caso de error, ocultar el loading después de un breve delay
      setTimeout(() => {
        this.hide();
      }, 1000);
    }
  }

  /**
   * Cargar datos básicos de la API
   */
  async loadBasicData() {
    try {
      // Actualizar progreso con pausa para lectura
      this.updateProgress(10, 'Iniciando aplicación...');
      await this.delay(900);
      
      this.updateProgress(25, 'Conectando con IPStream...');
      await this.delay(1100);
      
      // Cargar configuración
      const configResponse = await fetch('/config/config.json');
      const config = await configResponse.json();
      
      this.updateProgress(45, 'Cargando datos de la radio...');
      await this.delay(1300);
      
      // Cargar datos básicos
      const apiUrl = `${config.ipstream_base_url}/${config.clientId}/basic-data`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      this.updateProgress(65, 'Personalizando experiencia...');
      await this.delay(900);
      
      // Actualizar información en la pantalla de carga
      if (data.projectName) {
        this.updateTitle(`Cargando ${data.projectName}`);
        await this.delay(600);
      }
      
      if (data.projectDescription) {
        this.updateSubtitle(data.projectDescription);
        await this.delay(800);
      }
      
      // Actualizar logo si está disponible
      if (data.logoUrl) {
        this.updateLogo(`https://dashboard.ipstream.cl${data.logoUrl}`);
        await this.delay(600);
      }
      
      this.updateProgress(85, 'Aplicando configuración...');
      await this.delay(1100);
      
      console.log('LoadingManager: Datos básicos cargados:', data);
      
    } catch (error) {
      console.error('LoadingManager: Error cargando datos básicos:', error);
      this.updateSubtitle('Preparando la experiencia...');
      await this.delay(1000);
    }
  }

  /**
   * Simular progreso de carga
   */
  async simulateProgress() {
    // Completar la barra de progreso
    this.updateProgress(95, 'Preparando interfaz...');
    await this.delay(800);
    
    this.updateProgress(100, '¡Listo para comenzar!');
    await this.delay(1200);
    
    // Ocultar loading
    this.hide();
  }

  /**
   * Actualizar el progreso de carga
   */
  updateProgress(percentage, message = null) {
    this.currentProgress = percentage;
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
      console.log(`LoadingManager: Barra actualizada a ${percentage}%`);
    } else {
      console.warn('LoadingManager: progressBar no encontrado');
    }
    
    if (message && this.loadingSubtitle) {
      this.loadingSubtitle.textContent = message;
      console.log(`LoadingManager: Mensaje actualizado: "${message}"`);
    } else if (message) {
      console.warn('LoadingManager: loadingSubtitle no encontrado, mensaje:', message);
    }
    
    console.log(`LoadingManager: Progreso ${percentage}% - ${message}`);
  }

  /**
   * Actualizar el título
   */
  updateTitle(title) {
    if (this.loadingTitle) {
      this.loadingTitle.textContent = title;
      console.log(`LoadingManager: Título actualizado: "${title}"`);
    } else {
      console.warn('LoadingManager: loadingTitle no encontrado, título:', title);
    }
  }

  /**
   * Actualizar el subtítulo
   */
  updateSubtitle(subtitle) {
    if (this.loadingSubtitle) {
      this.loadingSubtitle.textContent = subtitle;
      console.log(`LoadingManager: Subtítulo actualizado: "${subtitle}"`);
    } else {
      console.warn('LoadingManager: loadingSubtitle no encontrado, subtítulo:', subtitle);
    }
  }

  /**
   * Actualizar el logo
   */
  updateLogo(logoUrl) {
    if (this.loadingLogo) {
      // Crear una nueva imagen para precargar
      const img = new Image();
      img.onload = () => {
        this.loadingLogo.src = logoUrl;
        this.loadingLogo.alt = 'Logo de la radio';
      };
      img.onerror = () => {
        console.warn('LoadingManager: Error cargando logo, usando icono por defecto');
        // Mantener el icono por defecto
      };
      img.src = logoUrl;
    }
  }

  /**
   * Mostrar loading overlay
   */
  show() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
      this.loadingOverlay.style.display = 'flex';
    }
  }

  /**
   * Ocultar loading overlay
   */
  hide() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
      
      // Ocultar completamente después de la animación
      setTimeout(() => {
        this.loadingOverlay.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Función de delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Forzar ocultación del loading (para casos de error)
   */
  forceHide() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    } else {
      // Buscar cualquier loading overlay que pueda existir
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  /**
   * Método de emergencia para ocultar loading desde templates
   */
  static emergencyHide() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 500);
    }
  }
}

// Crear instancia global
window.loadingManager = new LoadingManager();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.loadingManager.init();
    }, 100);
  });
} else {
  // DOM ya está listo
  setTimeout(() => {
    window.loadingManager.init();
  }, 100);
}

// Fallback de emergencia - ocultar loading después de 10 segundos
setTimeout(() => {
  if (window.loadingManager && window.loadingManager.loadingOverlay) {
    const overlay = window.loadingManager.loadingOverlay;
    if (overlay && !overlay.classList.contains('hidden')) {
      console.warn('LoadingManager: Fallback - Ocultando loading por timeout');
      window.loadingManager.forceHide();
    }
  }
}, 10000);

// Exportar para uso en módulos
export default LoadingManager;