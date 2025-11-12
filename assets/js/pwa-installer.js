/**
 * PWA Installer - Sistema global de instalación de aplicaciones web progresivas
 * Maneja la instalación en diferentes dispositivos y navegadores
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isIOS = false;
    this.isStandalone = false;
    this.installButton = null;
    this.modal = null;
    this.floatingButton = null;
    
    this.init();
  }

  init() {
    this.detectDevice();
    this.createModal();
    this.createFloatingButton();
    this.setupEventListeners();
    this.checkInstallability();
  }

  detectDevice() {
    // Detectar iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Detectar si ya está instalada como PWA
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
  }

  createModal() {
    const modalHTML = `
      <div class="pwa-modal-overlay" id="pwa-modal">
        <div class="pwa-modal-content">
          <button class="pwa-modal-close" id="pwa-modal-close">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="pwa-modal-header">
            <div class="pwa-modal-icon">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <h3 id="pwa-modal-title">Instalar Aplicación</h3>
            <p id="pwa-modal-subtitle">Accede más rápido y disfruta de una mejor experiencia</p>
          </div>
          
          <div class="pwa-modal-body">
            <!-- Contenido para dispositivos normales -->
            <div class="pwa-install-normal" id="pwa-install-normal">
              <div class="pwa-benefits">
                <div class="pwa-benefit">
                  <i class="fas fa-bolt"></i>
                  <span>Acceso más rápido</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-wifi"></i>
                  <span>Funciona sin conexión</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-bell"></i>
                  <span>Notificaciones push</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-home"></i>
                  <span>En tu pantalla de inicio</span>
                </div>
              </div>
              <div class="pwa-modal-buttons">
                <button class="pwa-install-btn" id="pwa-install-btn">
                  <i class="fas fa-download"></i>
                  <span>Instalar Aplicación</span>
                </button>
                <button class="pwa-dismiss-btn" id="pwa-dismiss-btn">
                  <span>No, gracias</span>
                </button>
              </div>
            </div>
            
            <!-- Contenido para iOS -->
            <div class="pwa-install-ios" id="pwa-install-ios" style="display: none;">
              <div class="pwa-ios-steps">
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">1</div>
                  <div class="pwa-step-content">
                    <p>Toca el botón <strong>Compartir</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-share"></i>
                    </div>
                  </div>
                </div>
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">2</div>
                  <div class="pwa-step-content">
                    <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-plus-square"></i>
                    </div>
                  </div>
                </div>
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">3</div>
                  <div class="pwa-step-content">
                    <p>Confirma tocando <strong>"Añadir"</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-check"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('pwa-modal');
  }

  createFloatingButton() {
    const buttonHTML = `
      <div class="pwa-floating-button" id="pwa-floating-button">
        <div class="pwa-floating-icon">
          <i class="fas fa-download"></i>
        </div>
        <div class="pwa-floating-text">
          <span>Instalar App</span>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    this.floatingButton = document.getElementById('pwa-floating-button');
  }

  setupEventListeners() {
    // Event listener para el prompt de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showFloatingButton();
      
      // Mostrar modal automáticamente después de 10 segundos (dar tiempo a que cargue el sitio)
      setTimeout(() => {
        this.showModalAutomatically();
      }, 10000);
    });

    // Event listener para cuando la app se instala
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA: App installed successfully');
      this.hideFloatingButton();
      this.hideModal();
      this.showToast('¡Aplicación instalada correctamente!', 'success');
    });

    // Botón flotante
    if (this.floatingButton) {
      this.floatingButton.addEventListener('click', () => {
        this.showModal();
      });
    }

    // Botón de instalación en el modal
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.installApp();
      });
    }

    // Botón "No, gracias" en el modal
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissModal();
      });
    }

    // Botón de cerrar modal
    const closeBtn = document.getElementById('pwa-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dismissModal();
      });
    }

    // Cerrar modal al hacer clic fuera
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.dismissModal();
        }
      });
    }
  }

  checkInstallability() {
    // Si ya está instalada, no mostrar el botón ni el modal
    if (this.isStandalone) {
      console.log('PWA: App already installed');
      return;
    }

    // Si es iOS, mostrar el botón y modal después de un tiempo
    if (this.isIOS) {
      setTimeout(() => {
        this.showFloatingButton();
        // Mostrar modal automáticamente después de 10 segundos adicionales
        setTimeout(() => {
          this.showModalAutomatically();
        }, 10000);
      }, 5000);
    } else {
      // Para otros navegadores, mostrar modal automáticamente si no hay prompt nativo
      setTimeout(() => {
        if (!this.deferredPrompt) {
          this.showFloatingButton();
          // Mostrar modal automáticamente después de 10 segundos adicionales
          setTimeout(() => {
            this.showModalAutomatically();
          }, 10000);
        }
      }, 5000);
    }

    // Para otros navegadores, esperar al evento beforeinstallprompt
  }

  showModal() {
    if (!this.modal) return;

    // Configurar contenido según el dispositivo
    const normalContent = document.getElementById('pwa-install-normal');
    const iosContent = document.getElementById('pwa-install-ios');

    if (this.isIOS) {
      normalContent.style.display = 'none';
      iosContent.style.display = 'block';
      document.getElementById('pwa-modal-title').textContent = 'Añadir a Pantalla de Inicio';
      document.getElementById('pwa-modal-subtitle').textContent = 'Sigue estos pasos para instalar la aplicación';
    } else {
      normalContent.style.display = 'block';
      iosContent.style.display = 'none';
      document.getElementById('pwa-modal-title').textContent = 'Instalar Aplicación';
      document.getElementById('pwa-modal-subtitle').textContent = 'Accede más rápido y disfruta de una mejor experiencia';
    }

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hideModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  showModalAutomatically() {
    // Mostrar modal automáticamente
    this.showModal();
  }

  dismissModal() {
    // Cerrar modal sin recordar estado
    this.hideModal();
    console.log('PWA: Modal dismissed by user');
  }

  showFloatingButton() {
    if (!this.floatingButton || this.isStandalone) return;
    
    setTimeout(() => {
      this.floatingButton.classList.add('visible');
    }, 2000);
  }

  hideFloatingButton() {
    if (!this.floatingButton) return;
    
    this.floatingButton.classList.remove('visible');
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      return;
    }

    try {
      // Mostrar el prompt de instalación
      this.deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`PWA: User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Limpiar el prompt
      this.deferredPrompt = null;
      this.hideModal();
      
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      this.showToast('Error al instalar la aplicación', 'error');
    }
  }

  showToast(message, type = 'info') {
    // Crear toast notification
    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.innerHTML = `
      <div class="pwa-toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Mostrar toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // Ocultar toast después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Inicializar PWA Installer cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PWAInstaller();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAInstaller;
}