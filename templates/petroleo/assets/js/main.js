/**
 * Template Petroleo - Refactorizado usando TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class PetroleoTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'footer-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'player-song-title',
        trackArtist: 'player-song-artist',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'sidebar-quality',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date',
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-ticker',
        featuredNews: 'featured-news-grid',
        programsTimeline: 'programs-timeline',
        sponsorsCarousel: 'sponsors-carousel'
      }
    });
    
    this.tvPlayer = null;
    this.videoStreamUrl = null;
    this.heroSwiper = null;
    this.sponsorsSwiper = null;
  }

  async init() {
    await super.init();
    
    try {
      await this.checkTVAvailability();
      await this.loadAllContent();
      this.setupCarousels();
      this.setupModalHandlers();
      
      console.log('PetroleoTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('PetroleoTemplate: Error in template-specific init:', error);
    }
  }

  // Verificar disponibilidad de TV
  async checkTVAvailability() {
    try {
      const dataManager = getDataManager();
      this.videoStreamUrl = await dataManager.loadVideoStreamUrl();
      
      if (this.videoStreamUrl) {
        const tvButton = document.getElementById('tv-online-btn');
        if (tvButton) {
          tvButton.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error checking TV availability:', error);
    }
  }

  // Cargar todo el contenido
  async loadAllContent() {
    try {
      console.log('PetroleoTemplate: Loading all content...');
      
      // Debug: verificar contenedores
      const containers = [
        { name: 'hero-carousel', id: 'hero-carousel' },
        { name: 'breaking-ticker', id: 'breaking-ticker' },
        { name: 'featured-news-grid', id: 'featured-news-grid' },
        { name: 'programs-timeline', id: 'programs-timeline' },
        { name: 'sponsors-carousel', id: 'sponsors-carousel' },
        { name: 'recent-tracks', id: 'recent-tracks' },
        { name: 'sidebar-listeners', id: 'sidebar-listeners' }
      ];
      
      containers.forEach(c => {
        const el = document.getElementById(c.id);
        console.log(`PetroleoTemplate: Container "${c.name}" exists:`, !!el);
      });
      
      const dataManager = getDataManager();
      
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadFeaturedNews(),
        this.loadProgramsTimeline(),
        this.loadSponsorsCarousel()
      ]);
      
      console.log('PetroleoTemplate: All content loaded successfully');
    } catch (error) {
      console.error('PetroleoTemplate: Error loading content:', error);
    }
  }

  // Cargar hero carousel
  async loadHeroCarousel() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      
      if (news.data && news.data.length > 0) {
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderHeroCarousel(news.data);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading hero carousel:', error);
    }
  }

  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    console.log('PetroleoTemplate: renderHeroCarousel container:', container);
    if (!container) return;

    const slidesHtml = news.map((item, index) => `
      <div class="swiper-slide" data-index="${index}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-category">Noticia</span>
            <h2 class="hero-title">${item.name}</h2>
            <p class="hero-description">${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = slidesHtml;
    console.log('PetroleoTemplate: hero carousel rendered');
  }

  // Cargar noticias destacadas
  async loadFeaturedNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 6);
      
      if (news.data && news.data.length > 0) {
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderFeaturedNews(news.data);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading featured news:', error);
    }
  }

  renderFeaturedNews(news) {
    const container = document.getElementById('featured-news-grid');
    console.log('PetroleoTemplate: renderFeaturedNews container:', container);
    if (!container) return;

    console.log('PetroleoTemplate: rendering', news.length, 'news items');

    const newsHtml = news.map(item => `
      <article class="news-card" data-slug="${item.slug}" style="background: rgba(255,255,255,0.1); padding: 20px; margin: 10px 0; border-radius: 10px; cursor: pointer;">
        <div class="news-image">
          <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy" style="width:100%;height:200px;object-fit:cover;">
        </div>
        <div class="news-content">
          <h3 class="news-title" data-slug="${item.slug}">${item.name}</h3>
          <p class="news-excerpt">${item.shortText || ''}</p>
        </div>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
    console.log('PetroleoTemplate: featured-news-grid innerHTML set, length:', newsHtml.length);
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
      console.error('PetroleoTemplate: Error loading programs:', error);
    }
  }

  renderProgramsTimeline(programs) {
    const container = document.getElementById('programs-timeline');
    console.log('PetroleoTemplate: renderProgramsTimeline container:', container);
    if (!container) return;

    const dayMapping = {
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
      'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };

    const getSpanishDay = (englishDay) => {
      if (!englishDay) return null;
      return dayMapping[englishDay.toLowerCase()] || englishDay;
    };

    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const todayPrograms = programs.filter(p => getSpanishDay(p.day) === today);

    if (todayPrograms.length === 0) {
      container.innerHTML = `<p style="padding:20px;color:#ccc;">No hay programas para hoy (${today})</p>`;
      return;
    }

    const html = todayPrograms.map(program => `
      <div class="program-item" style="padding:10px;margin:5px 0;background:rgba(255,255,255,0.1);border-radius:5px;">
        <span style="color:#e74c3c;font-weight:bold;">${program.startTime}</span>
        <span>${program.name}</span>
      </div>
    `).join('');

    container.innerHTML = html;
    console.log('PetroleoTemplate: programs-timeline rendered');
  }

  // Cargar sponsors
  async loadSponsorsCarousel() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      
      if (sponsors && sponsors.length > 0) {
        for (const sponsor of sponsors) {
          if (sponsor.logoUrl) {
            sponsor.logoUrl = await dataManager.getImageUrl(sponsor.logoUrl);
          }
        }
        this.renderSponsorsCarousel(sponsors);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading sponsors:', error);
    }
  }

  renderSponsorsCarousel(sponsors) {
    const container = document.getElementById('sponsors-carousel');
    console.log('PetroleoTemplate: renderSponsorsCarousel container:', container);
    if (!container) return;

    const sponsorsHtml = sponsors.map(sponsor => `
      <div class="swiper-slide" style="padding:20px;">
        <div style="background:rgba(255,255,255,0.1);padding:15px;border-radius:10px;text-align:center;">
          <img src="${sponsor.logoUrl || ''}" alt="${sponsor.name}" loading="lazy" style="max-width:100px;">
          <h4>${sponsor.name}</h4>
        </div>
      </div>
    `).join('');

    container.innerHTML = sponsorsHtml;
    console.log('PetroleoTemplate: sponsors-carousel rendered');
  }

  // Sobrescribir: Cuando se carga la canción actual
  onCurrentSongLoaded(songData) {
    console.log('PetroleoTemplate: onCurrentSongLoaded called', songData);
    
    // Update sidebar listeners
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) {
      listenersEl.textContent = songData.listeners || '0';
    }
    
    // Update recent tracks
    const tracksEl = document.getElementById('recent-tracks');
    if (tracksEl && songData.history) {
      const tracksHtml = songData.history.slice(-5).map((track, i) => {
        const cleanTrack = track.replace(/^\d+\.\s*/, '').replace(/<br>$/, '');
        return `<div class="track-item" style="padding:8px;"><span style="color:#e74c3c;">${i+1}.</span> <span>${cleanTrack}</span></div>`;
      }).join('');
      tracksEl.innerHTML = tracksHtml;
    }

    // Setup news click handlers
    this.setupNewsClickHandlers();
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
        // Update modal content
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
        
        // Show modal
        const modal = document.getElementById('news-modal');
        if (modal) {
          modal.classList.add('active');
        }
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading news details:', error);
    }
  }

  // Open modal helper
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  // Close modal helper
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Setup modal close handlers
  setupModalHandlers() {
    // Close button handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.remove('active');
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
      }
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({ url });
        } else {
          navigator.clipboard.writeText(url);
          alert('Enlace copiado al portapapeles');
        }
      });
    });
  }

  // Setup de carouseles
  setupCarousels() {
    if (typeof Swiper === 'undefined') {
      console.warn('PetroleoTemplate: Swiper not available');
      return;
    }
    
    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      const heroSwiperEl = document.querySelector('.hero-swiper');
      if (heroSwiperEl && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (error) {
          console.warn('PetroleoTemplate: Error initializing hero carousel:', error.message);
        }
      }

      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      const sponsorsSwiperEl = document.querySelector('.sponsors-swiper');
      if (sponsorsSwiperEl && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: true,
            autoplay: { delay: 3000, disableOnInteraction: false },
            slidesPerView: 'auto',
            spaceBetween: 30,
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (error) {
          console.warn('PetroleoTemplate: Error initializing sponsors carousel:', error.message);
        }
      }
    }, 1000);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.petroleoTemplate = new PetroleoTemplate();
    await window.petroleoTemplate.init();
  } catch (error) {
    console.error('PetroleoTemplate: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.petroleoTemplate) {
    window.petroleoTemplate.destroy();
  }
});

export default PetroleoTemplate;