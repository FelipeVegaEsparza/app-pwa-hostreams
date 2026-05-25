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
      socialContainerIds: ['header-social-main', 'footer-social'],
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
      
      const tvSection = document.getElementById('tv-online-section');
      if (tvSection) {
        tvSection.style.display = this.videoStreamUrl ? 'block' : 'none';
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
        this.loadBreakingNews(),
        this.loadFeaturedNews(),
        this.loadProgramsTimeline(),
        this.loadProgramsByDay(),
        this.loadSponsorsCarousel(),
        this.loadAllSponsors()
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

  // Cargar breaking news
  async loadBreakingNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      if (news && news.data && news.data.length > 0) {
        this.renderBreakingNews(news.data);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading breaking news:', error);
    }
  }

  renderBreakingNews(news) {
    const container = document.getElementById('breaking-ticker');
    if (!container) return;
    if (!news || news.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = news.map(item => `
      <span class="ticker-item">
        <span class="ticker-badge">ÚLTIMA HORA</span>
        <span class="ticker-text">${item.name}</span>
      </span>
    `).join('');
  }

  // Cargar timeline de programas
  async loadProgramsTimeline() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs && programs.length > 0) {
        for (const program of programs) {
          if (program.imageUrl) {
            program.imageUrl = await dataManager.getImageUrl(program.imageUrl);
          }
        }
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
    const todayPrograms = programs.filter(p => p.weekDays && p.weekDays.some(d => {
      const programDay = getSpanishDay(d);
      return programDay && programDay.toLowerCase() === today.toLowerCase();
    }));

    if (todayPrograms.length === 0) {
      container.innerHTML = `<p style="padding:20px;color:#ccc;">No hay programas para hoy (${today})</p>`;
      return;
    }

    const html = todayPrograms.map(program => `
      <div class="program-card-day" style="padding:15px;margin:8px 0;background:rgba(255,255,255,0.08);border-radius:8px;border-left:3px solid #e74c3c;display:flex;gap:15px;align-items:flex-start;">
        ${program.imageUrl ? `<div class="program-image" style="flex-shrink:0;width:60px;height:60px;border-radius:8px;overflow:hidden;"><img src="${program.imageUrl}" alt="${program.name}" style="width:100%;height:100%;object-fit:cover;"></div>` : ''}
        <div style="flex:1;">
          <div class="program-time">
            <span style="color:#e74c3c;font-weight:bold;font-size:0.9rem;">${program.startTime || ''} ${program.endTime ? '- ' + program.endTime : ''}</span>
          </div>
          <div style="color:#fff;font-weight:600;margin-top:4px;">${program.name}</div>
          ${program.description ? `<div style="color:#aaa;font-size:0.85rem;margin-top:4px;">${program.description}</div>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    console.log('PetroleoTemplate: programs-timeline rendered');
  }

  async loadProgramsByDay() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      if (programs && programs.length > 0) {
        for (const program of programs) {
          if (program.imageUrl) {
            program.imageUrl = await dataManager.getImageUrl(program.imageUrl);
          }
        }
        this.renderProgramsByDay(programs);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading programs by day:', error);
    }
  }

  renderProgramsByDay(programs) {
    const dayMapping = {
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
      'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };

    const getSpanishDay = (englishDay) => {
      if (!englishDay) return null;
      return dayMapping[englishDay.toLowerCase()] || englishDay;
    };

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
      const grid = document.getElementById(`${day.id}-grid`);
      if (!grid) return;

      const dayPrograms = programs.filter(p => p.weekDays && p.weekDays.some(d => getSpanishDay(d) === day.name));
      dayPrograms.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      if (dayPrograms.length === 0) {
        grid.innerHTML = `<p style="padding:20px;color:#ccc;">No hay programas para ${day.name}</p>`;
      } else {
        grid.innerHTML = dayPrograms.map(program => `
          <div class="program-card-day" style="padding:15px;margin:12px 0;background:rgba(255,255,255,0.05);border-radius:10px;border-left:3px solid #e74c3c;display:flex;gap:15px;align-items:flex-start;">
            ${program.imageUrl ? `<div class="program-image" style="flex-shrink:0;width:80px;height:80px;border-radius:8px;overflow:hidden;"><img src="${program.imageUrl}" alt="${program.name}" style="width:100%;height:100%;object-fit:cover;"></div>` : ''}
            <div style="flex:1;">
              <div style="color:#e74c3c;font-weight:bold;font-size:0.9rem;">${program.startTime || ''} ${program.endTime ? '- ' + program.endTime : ''}</div>
              <div style="color:#fff;font-weight:600;margin-top:6px;font-size:1.1rem;">${program.name}</div>
              ${program.description ? `<div style="color:#aaa;font-size:0.85rem;margin-top:6px;line-height:1.5;">${program.description}</div>` : ''}
              ${program.host ? `<div style="color:#888;font-size:0.8rem;margin-top:4px;"><i class="fas fa-user"></i> ${program.host}</div>` : ''}
            </div>
          </div>
        `).join('');
      }
    });
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
    if (!container) return;

    const socialIcons = { facebook: 'fab fa-facebook-f', youtube: 'fab fa-youtube', instagram: 'fab fa-instagram', tiktok: 'fab fa-tiktok', whatsapp: 'fab fa-whatsapp', x: 'fab fa-x-twitter' };

    const sponsorsHtml = sponsors.map(sponsor => {
      const socialLinks = Object.entries(socialIcons)
        .filter(([key]) => sponsor[key])
        .map(([key, icon]) => `<a href="${sponsor[key]}" target="_blank" rel="noopener" class="sponsor-social-link"><i class="${icon}"></i></a>`)
        .join('');

      return `
      <div class="swiper-slide">
        <div class="sponsor-card">
          <div class="sponsor-card-header">
            <img src="${sponsor.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${sponsor.name}">
            <h3>${sponsor.name}</h3>
          </div>
          ${sponsor.description ? `<p class="sponsor-description">${sponsor.description}</p>` : ''}
          ${sponsor.address ? `<p class="sponsor-address"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</p>` : ''}
          ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" rel="noopener" class="sponsor-website"><i class="fas fa-globe"></i> ${sponsor.website}</a>` : ''}
          ${socialLinks ? `<div class="sponsor-social-links">${socialLinks}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = sponsorsHtml;
  }

  async loadAllSponsors() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      if (sponsors && sponsors.length > 0) {
        for (const item of sponsors) {
          if (item.logoUrl) item.logoUrl = await dataManager.getImageUrl(item.logoUrl);
        }
        this.renderAllSponsors(sponsors);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading all sponsors:', error);
    }
  }

  renderAllSponsors(sponsors) {
    const container = document.getElementById('all-sponsors-grid');
    if (!container) return;

    const socialIcons = { facebook: 'fab fa-facebook-f', youtube: 'fab fa-youtube', instagram: 'fab fa-instagram', tiktok: 'fab fa-tiktok', whatsapp: 'fab fa-whatsapp', x: 'fab fa-x-twitter' };

    const sponsorsHtml = sponsors.map(sponsor => {
      const socialLinks = Object.entries(socialIcons)
        .filter(([key]) => sponsor[key])
        .map(([key, icon]) => `<a href="${sponsor[key]}" target="_blank" rel="noopener" class="sponsor-social-link"><i class="${icon}"></i></a>`)
        .join('');

      return `
      <div class="sponsor-card">
        <div class="sponsor-card-header">
          <img src="${sponsor.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${sponsor.name}">
          <h3>${sponsor.name}</h3>
        </div>
        ${sponsor.description ? `<p class="sponsor-description">${sponsor.description}</p>` : ''}
        ${sponsor.address ? `<p class="sponsor-address"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</p>` : ''}
        ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" rel="noopener" class="sponsor-website"><i class="fas fa-globe"></i> ${sponsor.website}</a>` : ''}
        ${socialLinks ? `<div class="sponsor-social-links">${socialLinks}</div>` : ''}
      </div>`;
    }).join('');

    container.innerHTML = sponsorsHtml;
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

    // Day buttons for programs schedule
    document.querySelector('.weekly-schedule-nav')?.addEventListener('click', (e) => {
      const dayBtn = e.target.closest('.day-btn');
      if (!dayBtn) return;

      document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
      dayBtn.classList.add('active');

      document.querySelectorAll('.day-programs').forEach(el => el.classList.remove('active'));
      const target = document.getElementById(`${dayBtn.dataset.day}-programs`);
      if (target) target.classList.add('active');
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