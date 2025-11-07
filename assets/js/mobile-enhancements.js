/**
 * Mobile Enhancements - Mejoras específicas para dispositivos móviles
 * Funcionalidades adicionales para mejorar la experiencia en pantallas pequeñas
 */

class MobileEnhancements {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.isTouch = 'ontouchstart' in window;
    this.init();
  }

  init() {
    this.setupMobileNavigation();
    this.setupTouchEnhancements();
    this.setupViewportHandler();
    this.setupAccessibilityEnhancements();
    this.setupPerformanceOptimizations();
  }

  setupMobileNavigation() {
    // Mejorar navegación móvil para todos los templates
    const mobileToggle = document.querySelector('.mobile-menu-toggle, .nav-toggle');
    const navMenu = document.querySelector('.nav-menu, .sidebar');
    
    // Skip if template4, template5, or template6 (they have their own menu handlers)
    if (document.querySelector('.news-header') || 
        document.querySelector('.modern-header') || 
        document.querySelector('.dynamic-header')) {
      console.log('MobileEnhancements: Skipping menu setup for template4/5/6');
      return;
    }
    
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu(mobileToggle, navMenu);
      });

      // Cerrar menú al hacer clic en un enlace
      const navLinks = navMenu.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (this.isMobile) {
            this.closeMobileMenu(mobileToggle, navMenu);
          }
        });
      });

      // Cerrar menú al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (this.isMobile && 
            !navMenu.contains(e.target) && 
            !mobileToggle.contains(e.target) &&
            navMenu.classList.contains('active')) {
          this.closeMobileMenu(mobileToggle, navMenu);
        }
      });
    }
  }

  toggleMobileMenu(toggle, menu) {
    const isActive = menu.classList.contains('active');
    
    if (isActive) {
      this.closeMobileMenu(toggle, menu);
    } else {
      this.openMobileMenu(toggle, menu);
    }
  }

  openMobileMenu(toggle, menu) {
    menu.classList.add('active');
    toggle.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Agregar overlay para template3 (sidebar)
    if (menu.classList.contains('sidebar')) {
      this.createSidebarOverlay();
    }
  }

  closeMobileMenu(toggle, menu) {
    menu.classList.remove('active');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
    
    // Remover overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  createSidebarOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay active';
    overlay.addEventListener('click', () => {
      const toggle = document.querySelector('.nav-toggle');
      const sidebar = document.querySelector('.sidebar');
      if (toggle && sidebar) {
        this.closeMobileMenu(toggle, sidebar);
      }
    });
    document.body.appendChild(overlay);
  }

  setupTouchEnhancements() {
    if (!this.isTouch) return;

    // Mejorar botones táctiles
    const buttons = document.querySelectorAll('button, .btn, .control-btn, .tab-btn');
    buttons.forEach(button => {
      // Asegurar tamaño mínimo táctil (44px)
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
      }

      // Agregar feedback táctil
      button.addEventListener('touchstart', () => {
        button.style.transform = 'scale(0.95)';
      });

      button.addEventListener('touchend', () => {
        button.style.transform = '';
      });
    });

    // Mejorar sliders para touch
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.style.height = '44px';
      slider.style.cursor = 'pointer';
    });
  }

  setupViewportHandler() {
    // Manejar cambios de orientación
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Manejar resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleOrientationChange() {
    // Cerrar menús móviles al cambiar orientación
    const activeMenus = document.querySelectorAll('.nav-menu.active, .sidebar.active');
    activeMenus.forEach(menu => {
      const toggle = document.querySelector('.mobile-menu-toggle.active, .nav-toggle.active');
      if (toggle) {
        this.closeMobileMenu(toggle, menu);
      }
    });

    // Recalcular viewport height para iOS
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  handleResize() {
    const newIsMobile = window.innerWidth <= 768;
    
    if (this.isMobile !== newIsMobile) {
      this.isMobile = newIsMobile;
      
      if (!this.isMobile) {
        // Limpiar estados móviles al cambiar a desktop
        document.body.style.overflow = '';
        const activeMenus = document.querySelectorAll('.nav-menu.active, .sidebar.active');
        const activeToggles = document.querySelectorAll('.mobile-menu-toggle.active, .nav-toggle.active');
        
        activeMenus.forEach(menu => menu.classList.remove('active'));
        activeToggles.forEach(toggle => toggle.classList.remove('active'));
        
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.remove();
      }
    }
  }

  setupAccessibilityEnhancements() {
    // Mejorar accesibilidad en móviles
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      // Mejorar indicadores de foco en móviles
      element.addEventListener('focus', () => {
        if (this.isMobile) {
          element.style.outline = '2px solid #007AFF';
          element.style.outlineOffset = '2px';
        }
      });

      element.addEventListener('blur', () => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      });
    });
  }

  setupPerformanceOptimizations() {
    if (!this.isMobile) return;

    // Lazy loading para imágenes en móviles
    const images = document.querySelectorAll('img[data-src]');
    if (images.length > 0 && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }

    // Reducir animaciones en móviles si el usuario lo prefiere
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Método público para otros scripts
  static isMobileDevice() {
    return window.innerWidth <= 768;
  }

  static isTouchDevice() {
    return 'ontouchstart' in window;
  }
}

// Inicializar mejoras móviles cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancements = new MobileEnhancements();
  });
} else {
  window.mobileEnhancements = new MobileEnhancements();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileEnhancements;
}