/**
 * Template Blue - Refactorizado usando TemplateBase
 * Este template solo se encarga del renderizado visual
 * Toda la lógica de datos y audio está en TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class BlueTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'news-audio',
      playButtonId: 'main-play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['header-social-main', 'footer-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'player-song-title',
        trackArtist: 'player-song-artist',
        listenersCount: 'player-listeners',
        bitrate: 'player-bitrate',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        audioQuality: 'sidebar-quality',
        currentDate: 'current-date',
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-news',
        featuredNews: 'featured-news',
        allNews: 'all-news',
        programsTimeline: 'programs-timeline',
        sponsorsCarousel: 'sponsors-carousel',
        podcastsTab: 'podcasts-tab',
        videocastsTab: 'videocasts-tab',
        quickNews: 'quick-news',
        recentTracks: 'recent-tracks'
      }
    });
    
    this.currentSection = 'home';
    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
    this.currentFilter = 'all';
    this.currentTab = 'podcasts';
    this.currentScheduleDay = 'today';
    this.heroSwiper = null;
    this.sponsorsSwiper = null;

    this.dayMapping = {
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
      'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };
  }

  getSpanishDay(englishDay) {
    if (!englishDay) return null;
    return this.dayMapping[englishDay.toLowerCase()] || englishDay;
  }

  async init() {
    // Llamar a la inicialización base
    await super.init();
    
    // Inicializar funcionalidades específicas del template blue
    try {
      this.setupCarousels();
      await this.loadAllContent();
      
      console.log('BlueTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('BlueTemplate: Error in template-specific init:', error);
    }
  }

  // Sobrescribir: Cargar datos básicos con funcionalidad adicional
  async loadBasicData() {
    await super.loadBasicData();
    // El template base ya carga los datos básicos, aquí solo agregamos lo específico
  }

  // Sobrescribir: Cuando se cargan datos básicos
  onBasicDataLoaded(data) {
    // Actualizar elementos específicos del template blue
    this.updateHeader(data);
    this.updateFooter(data);
  }

  // Sobrescribir: Cuando se carga la canción actual
  onCurrentSongLoaded(songData) {
    console.log('BlueTemplate: onCurrentSongLoaded called', songData);
    
    // Let base template handle the player display update
    // It will extract artist from fullTitle properly
    
    this.updateRecentTracks(songData);
    this.updateSidebarStats(songData);
    
    // Setup news click handlers
    this.setupNewsClickHandlers();
    this.setupModalHandlers();
  }

  // Setup click handlers for news items
  setupNewsClickHandlers() {
    document.addEventListener('click', async (e) => {
      const newsLink = e.target.closest('[data-slug]');
      if (newsLink) {
        e.preventDefault();
        const slug = newsLink.getAttribute('data-slug');
        await this.openNewsModal(slug);
      }
    });
  }

  // Open news modal
  async openNewsModal(slug) {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNewsBySlug(slug);
      
      if (news) {
        const titleEl = document.getElementById('news-modal-title');
        const dateEl = document.getElementById('news-modal-date');
        const contentEl = document.getElementById('news-modal-content');
        const imageEl = document.getElementById('news-modal-image');
        
        if (titleEl) titleEl.textContent = news.name || '';
        if (dateEl) dateEl.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(news.createdAt).toLocaleDateString('es-ES')}`;
        if (contentEl) contentEl.innerHTML = news.description || news.shortText || '';
        
        if (imageEl && news.imageUrl) {
          const fullImageUrl = await dataManager.getImageUrl(news.imageUrl);
          imageEl.src = fullImageUrl;
          imageEl.parentElement.style.display = 'block';
        } else if (imageEl) {
          imageEl.parentElement.style.display = 'none';
        }
        
        const modal = document.getElementById('news-modal');
        if (modal) modal.classList.add('active');
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading news details:', error);
    }
  }

  // Setup modal close handlers
  setupModalHandlers() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.remove('active');
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
      }
    });

    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.share) {
          navigator.share({ url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Enlace copiado');
        }
      });
    });
  }

  // Actualizar estadísticas de la sidebar
  updateSidebarStats(songData) {
    const listenersEl = document.getElementById('sidebar-listeners');
    const songsEl = document.getElementById('sidebar-songs');
    
    if (listenersEl) {
      listenersEl.textContent = songData.listeners || '0';
    }
    
    if (songsEl && songData.history) {
      songsEl.textContent = songData.history.length || '0';
    }
  }

  // Métodos específicos del template blue
  updateHeader(data) {
    // Actualizar elementos del header si es necesario
  }

  updateFooter(data) {
    const footerDesc = document.getElementById('footer-description');
    if (footerDesc && data.projectDescription) {
      footerDesc.textContent = data.projectDescription;
    }
  }

  updateRecentTracks(songData) {
    // Actualizar tracks recientes
    const recentTracksEl = document.getElementById('recent-tracks');
    if (recentTracksEl && songData.history) {
      // Renderizar historial de canciones
    }
  }

  // Cargar todo el contenido
  async loadAllContent() {
    try {
      const dataManager = getDataManager();
      
      await this.loadHeroCarousel();
      await this.loadBreakingNews();
      await this.loadFeaturedNews();
      await this.loadProgramsTimeline();
      await this.loadRecentTracks();
      await this.loadQuickNews();
      await this.loadSponsorsCarousel();
      await this.loadAllNews();
      await this.loadProgramsByDay();
      
    } catch (error) {
      console.error('BlueTemplate: Error loading content:', error);
    }
  }

  // Cargar hero carousel
  async loadHeroCarousel() {
    try {
      console.log('BlueTemplate: Loading hero carousel...');
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      console.log('BlueTemplate: News loaded:', news);
      
      if (news && news.data && news.data.length > 0) {
        console.log('BlueTemplate: Has', news.data.length, 'news items');
        // Construir URLs de imágenes
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderHeroCarousel(news.data);
      } else {
        console.warn('BlueTemplate: No news data returned');
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading hero carousel:', error);
    }
  }

  // Renderizar hero carousel
  renderHeroCarousel(news) {
    console.log('BlueTemplate: renderHeroCarousel called with', news?.length, 'items');
    const container = document.getElementById('hero-carousel');
    if (!container) {
      console.error('BlueTemplate: hero-carousel container not found!');
      return;
    }

    // Fallback: si no hay noticias, mostrar contenido de ejemplo
    if (!news || news.length === 0) {
      console.warn('BlueTemplate: No news, showing placeholder');
      container.innerHTML = `
        <div class="swiper-slide">
          <div class="hero-slide" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <span class="hero-category">Bienvenido</span>
              <h2 class="hero-title">Radio Pulse</h2>
              <p class="hero-description">Tu radio online las 24 horas</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const slidesHtml = news.map((item, index) => `
      <div class="swiper-slide" data-index="${index}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-category">Noticia</span>
            <h2 class="hero-title">${item.name}</h2>
            <p class="hero-description">${item.shortText || ''}</p>
            <a href="#" class="hero-link" data-slug="${item.slug}">Leer más <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = slidesHtml;
  }

// Cargar breaking news
  async loadBreakingNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 3);
      
      if (news && news.data && news.data.length > 0) {
        this.renderBreakingNews(news.data);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading breaking news:', error);
    }
  }

  // Renderizar breaking news
  renderBreakingNews(news) {
    const container = document.getElementById('breaking-ticker');
    if (!container) return;

    if (!news || news.length === 0) {
      container.innerHTML = '<p style="padding:15px;color:#ccc;">No hay noticias disponibles</p>';
      return;
    }

    container.innerHTML = news.map(item => `
      <div style="display:flex;align-items:center;gap:15px;padding:10px;">
        <span style="background:#e74c3c;padding:5px 10px;border-radius:3px;font-size:11px;font-weight:bold;">ÚLTIMA HORA</span>
        <span style="color:#fff;">${item.name}</span>
      </div>
    `).join('');
  }

// Cargar featured news
  async loadFeaturedNews() {
    try {
      console.log('BlueTemplate: Loading featured news...');
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 6);
      console.log('BlueTemplate: Featured news data:', news);
      
      if (news && news.data && news.data.length > 0) {
        // Construir URLs de imágenes
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderFeaturedNews(news.data);
      } else {
        console.warn('BlueTemplate: No featured news data');
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading featured news:', error);
    }
  }

  // Renderizar featured news
  renderFeaturedNews(news) {
    console.log('BlueTemplate: renderFeaturedNews called with', news?.length, 'items');
    const container = document.getElementById('featured-news-grid');
    console.log('BlueTemplate: featured-news-grid container:', !!container);
    if (!container) {
      console.error('BlueTemplate: container not found!');
      return;
    }

    if (!news || news.length === 0) {
      container.innerHTML = '<p style="padding:20px;text-align:center;color:#ccc;">No hay noticias destacadas</p>';
      return;
    }

    const newsHtml = news.map(item => `
      <article class="news-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <div class="news-image" style="height:200px;overflow:hidden;">
          <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="news-content" style="padding:15px;">
          <h3 class="news-title" style="color:#fff;margin:0 0 10px 0;"><a href="#" data-slug="${item.slug}" style="color:#fff;text-decoration:none;">${item.name}</a></h3>
          <p class="news-excerpt" style="color:#ccc;font-size:14px;">${item.shortText || ''}</p>
          <span class="news-date" style="color:#888;font-size:12px;">${new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar timeline de programas
  async loadProgramsTimeline() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs && programs.length > 0) {
        this.renderProgramsTimeline(programs);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading programs timeline:', error);
    }
  }

  // Renderizar timeline de programas
  renderProgramsTimeline(programs) {
    const container = document.getElementById('programs-timeline');
    if (!container) return;

    const todaySpanish = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const todayPrograms = programs.filter(p => {
      const programDay = this.getSpanishDay(p.day);
      return programDay && programDay.toLowerCase() === todaySpanish.toLowerCase();
    });

    if (todayPrograms.length === 0) {
      container.innerHTML = `
        <div class="no-programs-today">
          <i class="fas fa-calendar-day"></i>
          <p>No hay programas para hoy (${todaySpanish})</p>
        </div>
      `;
      return;
    }

    // Ordenar por hora de inicio
    todayPrograms.sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });

    const timelineHtml = todayPrograms.map(program => `
      <div class="timeline-item">
        <div class="timeline-time">
          <span>${program.startTime || '00:00'}</span>
        </div>
        <div class="timeline-content">
          <h4>${program.name}</h4>
          <p>${program.description || ''}</p>
        </div>
      </div>
    `).join('');

    container.innerHTML = timelineHtml;
  }

  // Organizar programas por día
  organizeProgramsByDay(programs) {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const organized = {};
    
    days.forEach(day => {
      organized[day] = programs.filter(p => p.day === day);
    });
    
    return organized;
  }

  // Cargar sponsors
  async loadSponsorsCarousel() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      
      if (sponsors && sponsors.length > 0) {
        // Construir URLs de logos
        for (const sponsor of sponsors) {
          if (sponsor.logoUrl) {
            sponsor.logoUrl = await dataManager.getImageUrl(sponsor.logoUrl);
          }
        }
        this.renderSponsorsCarousel(sponsors);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading sponsors:', error);
    }
  }

  // Renderizar sponsors
  renderSponsorsCarousel(sponsors) {
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;

    const sponsorsHtml = sponsors.map(sponsor => `
      <div class="swiper-slide">
        <div class="sponsor-card">
          <img src="${sponsor.logoUrl || ''}" alt="${sponsor.name}" loading="lazy">
          <h4>${sponsor.name}</h4>
        </div>
      </div>
    `).join('');

    container.innerHTML = sponsorsHtml;
  }

  // Cargar todas las noticias
  async loadAllNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(this.currentPage.news, 10);
      
      if (news.data) {
        // Construir URLs de imágenes
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderAllNews(news.data);
        this.setupPagination('news', news.pagination);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading all news:', error);
    }
  }

  // Renderizar todas las noticias
  renderAllNews(news) {
    const container = document.getElementById('all-news-grid');
    if (!container) return;

    const newsHtml = news.map(item => `
      <article class="news-grid-item">
        <div class="news-grid-image">
          <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="news-grid-content">
          <h3>${item.name}</h3>
          <p>${item.shortText || ''}</p>
          <span class="news-date">${new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar programas por día
  async loadProgramsByDay() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs) {
        this.renderProgramsByDay(programs);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading programs by day:', error);
    }
  }

  // Renderizar programas por día
  renderProgramsByDay(programs) {
    const days = [
      { id: 'lunes', name: 'Lunes' },
      { id: 'martes', name: 'Martes' },
      { id: 'miercoles', name: 'Miércoles' },
      { id: 'jueves', name: 'Jueves' },
      { id: 'viernes', name: 'Viernes' },
      { id: 'sabado', name: 'Sábado' },
      { id: 'domingo', name: 'Domingo' }
    ];

    days.forEach(day => {
      const container = document.getElementById(`${day.id}-grid`);
      if (!container) return;

      const dayPrograms = programs.filter(p => {
        const programDay = this.getSpanishDay(p.day);
        return programDay && programDay.toLowerCase() === day.name.toLowerCase();
      });

      if (dayPrograms.length === 0) {
        container.innerHTML = `
          <div class="no-programs">
            <i class="fas fa-calendar-times"></i>
            <p>No hay programas para ${day.name}</p>
          </div>
        `;
        return;
      }

      const programsHtml = dayPrograms.map(program => `
        <div class="program-card">
          <div class="program-time">
            <span class="time-start">${program.startTime || '00:00'}</span>
            <span class="time-separator">-</span>
            <span class="time-end">${program.endTime || '00:00'}</span>
          </div>
          <div class="program-info">
            <h4>${program.name}</h4>
            <p>${program.description || ''}</p>
          </div>
          <div class="program-host">
            <span>${program.host || ''}</span>
          </div>
        </div>
      `).join('');

      container.innerHTML = programsHtml;
    });
  }

  // Cargar tracks recientes
  async loadRecentTracks() {
    const container = document.getElementById('recent-tracks');
    if (!container || !this.currentSongData || !this.currentSongData.history) {
      container.innerHTML = `
        <div class="no-tracks">
          <i class="fas fa-music"></i>
          <p>No hay canciones recientes</p>
        </div>
      `;
      return;
    }

    // Only show last 5 tracks
    const history = this.currentSongData.history.slice(-5);
    const tracksHtml = history.map((track, index) => {
      const cleanTrack = track.replace(/^\d+\.\s*/, '');
      
      return `
        <div class="track-item">
          <span class="track-number">${index + 1}</span>
          <span class="track-name">${cleanTrack}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = tracksHtml;
  }

  // Cargar quick news
  async loadQuickNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 4);
      
      if (news.data) {
        this.renderQuickNews(news.data);
      }
    } catch (error) {
      console.error('BlueTemplate: Error loading quick news:', error);
    }
  }

  // Renderizar quick news
  renderQuickNews(news) {
    const container = document.getElementById('quick-news');
    if (!container) return;

    if (!news || news.length === 0) {
      container.innerHTML = `
        <div class="no-news">
          <i class="fas fa-newspaper"></i>
          <p>No hay noticias</p>
        </div>
      `;
      return;
    }

    const newsHtml = news.map(item => `
      <div class="quick-news-item">
        <span class="quick-news-date">${new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
        <a href="#" class="quick-news-link" data-slug="${item.slug}">${item.name}</a>
      </div>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Setup de navegación
  setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
      
      // Cerrar menú al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }
  }

// Setup de carouseles
  setupCarousels() {
    // Verificar que Swiper esté disponible
    if (typeof Swiper === 'undefined') {
      console.warn('BlueTemplate: Swiper not available');
      return;
    }
    
    // Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      // Inicializar Swiper para hero solo si hay slides
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      const heroSwiperEl = document.querySelector('.hero-swiper');
      if (heroSwiperEl && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
              delay: 5000,
              disableOnInteraction: false
            },
            pagination: {
              el: '.swiper-pagination',
              clickable: true
            },
            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev'
            }
          });
        } catch (error) {
          console.warn('BlueTemplate: Error initializing hero carousel:', error.message);
        }
      }

      // Inicializar Swiper para sponsors solo si hay slides
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      const sponsorsSwiperEl = document.querySelector('.sponsors-swiper');
      if (sponsorsSwiperEl && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: true,
            autoplay: {
              delay: 3000,
              disableOnInteraction: false
            },
            slidesPerView: 'auto',
            spaceBetween: 30,
            pagination: {
              el: '.swiper-pagination',
              clickable: true
            }
          });
        } catch (error) {
          console.warn('BlueTemplate: Error initializing sponsors carousel:', error.message);
        }
      }
    }, 1000);
  }

  // Setup de paginación
  setupPagination(type, pagination) {
    if (!pagination || !pagination.hasMore) return;
    
    const loadMoreBtn = document.getElementById('load-more-news');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'block';
      loadMoreBtn.addEventListener('click', () => {
        this.currentPage.news++;
        this.loadAllNews();
      });
    }
  }

  // Mostrar sección
  showSection(sectionName) {
    this.currentSection = sectionName;
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.remove('active'));
    
    // Mostrar sección seleccionada
    const activeSection = document.getElementById(`${sectionName}-section`);
    if (activeSection) {
      activeSection.classList.add('active');
    }
    
    // Actualizar navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionName);
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BlueTemplate: DOMContentLoaded fired');
  try {
    window.blueTemplate = new BlueTemplate();
    await window.blueTemplate.init();
    console.log('BlueTemplate: init completed');
  } catch (error) {
    console.error('BlueTemplate: Error:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.blueTemplate) {
    window.blueTemplate.destroy();
  }
});

export default BlueTemplate;
