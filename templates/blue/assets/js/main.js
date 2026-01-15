import { 
  getBasicData, 
  buildImageUrl, 
  getPrograms, 
  getNews, 
  getNewsBySlug,
  getPodcasts, 
  getPodcastById,
  getVideocasts, 
  getVideocastById,
  getSponsors, 
  getSocialNetworks,
  getCurrentSong
} from '/assets/js/api.js';

class RadioPulse {
  constructor() {
    this.currentSection = 'home';
    this.audioPlayer = null;
    this.isPlaying = false;
    this.currentVolume = 50;
    this.sonicPanelInterval = null;
    this.currentSongData = null;
    this.currentPage = {
      news: 1,
      podcasts: 1,
      videocasts: 1
    };
    this.currentFilter = 'all';
    this.currentTab = 'podcasts';
    this.currentScheduleDay = 'today';
    
    // Swiper instances
    this.heroSwiper = null;
    this.sponsorsSwiper = null;
    
    this.init();
  }

  async init() {
    console.log('RadioPulse: Initializing dynamic radio experience...');
    console.log('RadioPulse: DOM ready, starting initialization');
    // Loading is now managed by loading-manager.js
    
    try {
      this.setCurrentDate();
      await this.loadBasicData();
      await this.loadAllContent();
      this.setupNavigation();
      this.setupAudioPlayer();
      this.setupCarousels();
      this.setupFilters();
      this.setupTabs();
      this.setupModals();
      this.setupAnimations();
      this.setupRippleEffects();
      await this.loadSonicPanelData();
      this.startSonicPanelUpdates();
      
      console.log('RadioPulse: Dynamic radio experience is live! 🚀');
    } catch (error) {
      console.error('RadioPulse: Error initializing:', error);
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        console.log('RadioPulse: Fallback - Ocultando loading');
        if (window.loadingManager) {
          window.loadingManager.forceHide();
        } else {
          overlay.style.display = 'none';
        }
      }
    }, 8000);
  }

  setCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('es-ES', options);
    document.getElementById('current-date').textContent = dateString;
  }

  showLoading() {
    console.log('RadioPulse: Showing loading overlay');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    } else {
      console.warn('RadioPulse: Loading overlay not found');
    }
  }

  hideLoading() {
    console.log('RadioPulse: Hiding loading overlay');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    } else {
      console.warn('RadioPulse: Loading overlay not found');
    }
  }

  async loadBasicData() {
    try {
      const data = await getBasicData();
      const logoUrl = await buildImageUrl(data.logoUrl);
      
      // Update branding
      const elements = {
        'news-logo': logoUrl,
        'footer-logo': logoUrl,
        'footer-title': data.projectName,
        'footer-description': data.projectDescription,
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
      
      // Load social networks
      await this.loadSocialNetworks();
      
    } catch (error) {
      console.error('RadioPulse: Error loading basic data:', error);
    }
  }

  async loadAllContent() {
    console.log('RadioPulse: Loading all content...');
    
    try {
      console.log('RadioPulse: Starting content loading...');
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadBreakingNews(),
        this.loadFeaturedNews(),
        this.loadProgramsTimeline(),
        this.loadRecentTracks(),
        this.loadQuickNews(),
        this.loadSponsorsCarousel(),
        this.loadAllNews(),
        this.loadProgramsByDay(),
        this.loadPodcasts(),
        this.loadVideocasts(),
        this.loadAllSponsors()
      ]);
      console.log('RadioPulse: All content loaded successfully');
    } catch (error) {
      console.error('RadioPulse: Error loading content:', error);
      console.error('RadioPulse: Error details:', error.stack);
    }
  }

  async loadHeroCarousel() {
    try {
      console.log('RadioPulse: Loading hero carousel...');
      const news = await getNews(1, 5);
      console.log('RadioPulse: Hero carousel news data:', news);
      const container = document.getElementById('hero-carousel');
      
      if (!container) {
        console.warn('RadioPulse: Hero carousel container not found');
        return;
      }
      
      if (news && news.data && news.data.length > 0) {
        const html = news.data.map(article => `
          <div class="swiper-slide">
            <div class="hero-slide">
              ${article.imageUrl ? `<img src="https://dashboard.ipstream.cl${article.imageUrl}" alt="${article.name}">` : ''}
              <div class="hero-content">
                <div class="hero-category">Destacado</div>
                <h2 class="hero-title">${article.name}</h2>
                <p class="hero-excerpt">${article.shortText || 'Noticia destacada del día'}</p>
                <div class="hero-meta">
                  <span><i class="fas fa-calendar"></i> ${new Date(article.createdAt).toLocaleDateString()}</span>
                  <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 1000) + 100} vistas</span>
                </div>
              </div>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Reinitialize Swiper
        if (this.heroSwiper) {
          this.heroSwiper.destroy();
        }
        this.initHeroSwiper();
      }
    } catch (error) {
      console.error('RadioPulse: Error loading hero carousel:', error);
    }
  }

  async loadBreakingNews() {
    try {
      const news = await getNews(1, 10);
      const container = document.getElementById('breaking-ticker');
      
      if (!container) return;
      
      if (news && news.data && news.data.length > 0) {
        const tickerItems = news.data.map(article => 
          `<span class="ticker-item">${article.name}</span>`
        ).join(' • ');
        
        container.innerHTML = tickerItems;
      }
    } catch (error) {
      console.error('RadioPulse: Error loading breaking news:', error);
    }
  }

  async loadFeaturedNews() {
    try {
      console.log('RadioPulse: Loading featured news...');
      const news = await getNews(1, 6);
      console.log('RadioPulse: Featured news data:', news);
      const container = document.getElementById('featured-news-grid');
      
      if (!container) {
        console.warn('RadioPulse: Featured news container not found');
        return;
      }
      
      if (news && news.data && news.data.length > 0) {
        const html = news.data.map((article, index) => `
          <article class="news-card ${index === 0 ? 'featured' : ''}" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="news-image">
              ${article.imageUrl ? `<img src="https://dashboard.ipstream.cl${article.imageUrl}" alt="${article.name}">` : ''}
              <div class="news-category">Noticias</div>
            </div>
            <div class="news-content">
              <h3 class="news-title">${article.name}</h3>
              <p class="news-excerpt">${article.shortText || 'Resumen de la noticia no disponible'}</p>
              <div class="news-meta">
                <span class="news-date">
                  <i class="fas fa-calendar"></i>
                  ${new Date(article.createdAt).toLocaleDateString()}
                </span>
                <button class="read-more" onclick="radioPulse.openNewsModal('${article.slug}')">
                  <i class="fas fa-book-open"></i>
                  Leer más
                </button>
              </div>
            </div>
          </article>
        `).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>No hay noticias disponibles</p>';
      }
    } catch (error) {
      console.error('RadioPulse: Error loading featured news:', error);
    }
  }

  async loadProgramsTimeline() {
    try {
      const programs = await getPrograms();
      const container = document.getElementById('programs-timeline');
      
      if (!container) return;
      
      if (programs && programs.length > 0) {
        const now = new Date();
        const currentHour = now.getHours();
        
        const html = programs.slice(0, 8).map(program => {
          const programHour = parseInt(program.startTime.split(':')[0]);
          let status = 'upcoming';
          
          if (programHour === currentHour) {
            status = 'live';
          } else if (programHour === currentHour + 1) {
            status = 'next';
          }
          
          return `
            <div class="timeline-item" data-aos="fade-right">
              <div class="timeline-time">${program.startTime}</div>
              <div class="timeline-content">
                <h4 class="timeline-title">${program.name}</h4>
                <p class="timeline-description">${program.description || 'Programa de radio'}</p>
                ${program.host ? `<div class="timeline-host"><i class="fas fa-microphone"></i> ${program.host}</div>` : ''}
              </div>
              <div class="timeline-status ${status}">
                ${status === 'live' ? 'EN VIVO' : status === 'next' ? 'PRÓXIMO' : 'PROGRAMADO'}
              </div>
            </div>
          `;
        }).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>No hay programas disponibles</p>';
      }
    } catch (error) {
      console.error('RadioPulse: Error loading programs timeline:', error);
    }
  }

  async loadRecentTracks() {
    try {
      const songData = await getCurrentSong();
      const container = document.getElementById('recent-tracks');
      
      if (!container) return;
      
      // Usar el historial de SonicPanel si está disponible
      let recentTracks = [];
      
      if (songData && songData.history && songData.history.length > 0) {
        recentTracks = songData.history.slice(0, 5).map((trackString, index) => {
          const parts = trackString.split(' - ');
          let title, artist;
          
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          } else {
            title = trackString.trim();
            artist = 'Artista desconocido';
          }
          
          const minutesAgo = (index + 1) * 3;
          const timeAgo = new Date(Date.now() - minutesAgo * 60000);
          
          return {
            title: title || 'Sin título',
            artist: artist || 'Artista desconocido',
            time: this.formatTime(timeAgo)
          };
        });
      } else {
        recentTracks = [
          { title: 'Canción Actual', artist: 'Artista 1', time: this.formatTime(new Date()) },
          { title: 'Canción Anterior', artist: 'Artista 2', time: this.formatTime(new Date(Date.now() - 3 * 60000)) },
          { title: 'Hace 5 minutos', artist: 'Artista 3', time: this.formatTime(new Date(Date.now() - 5 * 60000)) },
          { title: 'Hace 8 minutos', artist: 'Artista 4', time: this.formatTime(new Date(Date.now() - 8 * 60000)) },
          { title: 'Hace 12 minutos', artist: 'Artista 5', time: this.formatTime(new Date(Date.now() - 12 * 60000)) }
        ];
      }
      
      if (recentTracks.length > 0) {
        const html = recentTracks.map((track, index) => `
          <div class="track-item" data-aos="fade-left" data-aos-delay="${index * 50}">
            <div class="track-number">${index + 1}</div>
            <div class="track-details">
              <div class="track-name">${track.title}</div>
              <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-time">${track.time}</div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">No hay historial disponible</p>';
      }
    } catch (error) {
      console.error('RadioPulse: Error loading recent tracks:', error);
      const container = document.getElementById('recent-tracks');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 2rem;">Error cargando historial</p>';
      }
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  async loadQuickNews() {
    try {
      const news = await getNews(1, 5);
      const container = document.getElementById('quick-news');
      
      if (!container) return;
      
      if (news && news.data && news.data.length > 0) {
        const html = news.data.map((article, index) => `
          <div class="quick-news-item" data-aos="fade-left" data-aos-delay="${index * 50}">
            <div class="quick-news-title">${article.name}</div>
            <div class="quick-news-time">${new Date(article.createdAt).toLocaleDateString()}</div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('RadioPulse: Error loading quick news:', error);
    }
  }

  async loadSponsorsCarousel() {
    try {
      const sponsors = await getSponsors();
      const container = document.getElementById('sponsors-carousel');
      
      if (!container) return;
      
      if (sponsors && sponsors.length > 0) {
        const html = sponsors.map(sponsor => `
          <div class="swiper-slide">
            <div class="sponsor-item">
              <div class="sponsor-logo">
                ${sponsor.logoUrl ? `<img src="https://dashboard.ipstream.cl${sponsor.logoUrl}" alt="${sponsor.name}">` : ''}
              </div>
              <div class="sponsor-name">${sponsor.name}</div>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        
        if (this.sponsorsSwiper) {
          this.sponsorsSwiper.destroy();
        }
        this.initSponsorsSwiper();
      }
    } catch (error) {
      console.error('RadioPulse: Error loading sponsors carousel:', error);
    }
  }

  async loadAllNews() {
    try {
      const news = await getNews(this.currentPage.news, 12);
      const container = document.getElementById('all-news-grid');
      
      if (!container) return;
      
      if (news && news.data && news.data.length > 0) {
        const html = news.data.map((article, index) => `
          <article class="news-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="news-image">
              ${article.imageUrl ? `<img src="https://dashboard.ipstream.cl${article.imageUrl}" alt="${article.name}">` : ''}
              <div class="news-category">Noticias</div>
            </div>
            <div class="news-content">
              <h3 class="news-title">${article.name}</h3>
              <p class="news-excerpt">${article.shortText || 'Resumen no disponible'}</p>
              <div class="news-meta">
                <span class="news-date">
                  <i class="fas fa-calendar"></i>
                  ${new Date(article.createdAt).toLocaleDateString()}
                </span>
                <button class="read-more" onclick="radioPulse.openNewsModal('${article.slug}')">
                  <i class="fas fa-book-open"></i>
                  Leer más
                </button>
              </div>
            </div>
          </article>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('RadioPulse: Error loading all news:', error);
    }
  }

  async loadProgramsByDay() {
    try {
      const programs = await getPrograms();
      
      if (!programs || programs.length === 0) {
        this.showEmptyDayMessage();
        return;
      }
      
      const programsByDay = this.organizeProgramsByDay(programs);
      const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      
      days.forEach(day => {
        this.loadDayPrograms(day, programsByDay[day] || []);
      });
      
      this.setCurrentDayAsActive();
      
    } catch (error) {
      console.error('RadioPulse: Error loading programs by day:', error);
    }
  }

  organizeProgramsByDay(programs) {
    const programsByDay = {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
      domingo: []
    };
    
    programs.forEach(program => {
      if (program.weekDays && Array.isArray(program.weekDays)) {
        program.weekDays.forEach(day => {
          const dayKey = this.normalizeDayName(day);
          if (programsByDay[dayKey]) {
            programsByDay[dayKey].push(program);
          }
        });
      } else if (program.days && Array.isArray(program.days)) {
        program.days.forEach(day => {
          const dayKey = this.normalizeDayName(day);
          if (programsByDay[dayKey]) {
            programsByDay[dayKey].push(program);
          }
        });
      }
    });
    
    Object.keys(programsByDay).forEach(day => {
      programsByDay[day].sort((a, b) => {
        const timeA = this.parseTime(a.startTime);
        const timeB = this.parseTime(b.startTime);
        return timeA - timeB;
      });
    });
    
    return programsByDay;
  }

  normalizeDayName(day) {
    const dayMap = {
      'monday': 'lunes',
      'tuesday': 'martes', 
      'wednesday': 'miercoles',
      'thursday': 'jueves',
      'friday': 'viernes',
      'saturday': 'sabado',
      'sunday': 'domingo',
      'lunes': 'lunes',
      'martes': 'martes',
      'miércoles': 'miercoles',
      'miercoles': 'miercoles',
      'jueves': 'jueves',
      'viernes': 'viernes',
      'sábado': 'sabado',
      'sabado': 'sabado',
      'domingo': 'domingo'
    };
    
    return dayMap[day.toLowerCase()] || 'lunes';
  }

  parseTime(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  loadDayPrograms(day, programs) {
    const container = document.getElementById(`${day}-grid`);
    
    if (!container) return;
    
    if (programs.length === 0) {
      container.innerHTML = `
        <div class="empty-day">
          <i class="fas fa-calendar-times"></i>
          <h3>Sin programación</h3>
          <p>No hay programas programados para este día</p>
        </div>
      `;
      return;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = this.getCurrentDayName();
    
    const html = programs.map((program, index) => {
      const programHour = parseInt(program.startTime.split(':')[0]);
      let status = 'upcoming';
      let statusText = 'PROGRAMADO';
      
      if (day === currentDay) {
        if (programHour === currentHour) {
          status = 'live';
          statusText = 'EN VIVO';
        } else if (programHour === currentHour + 1) {
          status = 'next';
          statusText = 'PRÓXIMO';
        } else if (programHour < currentHour) {
          status = 'finished';
          statusText = 'FINALIZADO';
        }
      }
      
      return `
        <div class="program-card-day ${status}" data-aos="fade-up" data-aos-delay="${index * 100}">
          <div class="program-image">
            ${program.imageUrl ? `
              <img src="https://dashboard.ipstream.cl${program.imageUrl}" alt="${program.name}" loading="lazy">
            ` : `
              <div class="program-image-placeholder">
                <i class="fas fa-microphone"></i>
              </div>
            `}
            <div class="program-status-overlay ${status}">
              ${status === 'live' ? '<i class="fas fa-circle"></i> EN VIVO' : ''}
            </div>
          </div>
          
          <div class="program-header">
            <div class="program-time">
              <i class="fas fa-clock"></i>
              ${program.startTime}${program.endTime ? ` - ${program.endTime}` : ''}
            </div>
            <div class="program-name">${program.name}</div>
            ${program.host ? `
              <div class="program-host">
                <i class="fas fa-microphone"></i>
                ${program.host}
              </div>
            ` : ''}
          </div>
          
          <div class="program-content">
            <p class="program-description">${program.description || 'Programa de radio con el mejor contenido y entretenimiento.'}</p>
            
            ${program.tags ? `
              <div class="program-tags">
                ${program.tags.map(tag => `<span class="program-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
            
            <div class="program-actions">
              <div class="program-status ${status}">${statusText}</div>
              <button class="program-listen-btn ${status !== 'live' ? 'disabled' : ''}" 
                      ${status === 'live' ? `onclick="radioPulse.playLiveProgram('${program.id}')"` : ''}>
                <i class="fas fa-${status === 'live' ? 'play' : 'clock'}"></i>
                ${status === 'live' ? 'Escuchar' : 'Programado'}
                <div class="btn-ripple"></div>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
  }

  getCurrentDayName() {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const today = new Date().getDay();
    return days[today];
  }

  setCurrentDayAsActive() {
    const currentDay = this.getCurrentDayName();
    console.log('RadioPulse: Setting current day as active:', currentDay);
    
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.day === currentDay) {
        btn.classList.add('active');
      }
    });
    
    this.showDayPrograms(currentDay);
  }

  showEmptyDayMessage() {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    days.forEach(day => {
      const container = document.getElementById(`${day}-grid`);
      if (container) {
        container.innerHTML = `
          <div class="empty-day">
            <i class="fas fa-calendar-times"></i>
            <h3>Sin programación</h3>
            <p>No hay programas disponibles en este momento</p>
          </div>
        `;
      }
    });
  }

  showDayPrograms(day) {
    console.log('RadioPulse: Showing programs for:', day);
    
    document.querySelectorAll('.day-programs').forEach(dayProgram => {
      dayProgram.classList.remove('active');
    });
    
    const targetDay = document.getElementById(`${day}-programs`);
    if (targetDay) {
      targetDay.classList.add('active');
    }
    
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  async loadPodcasts() {
    try {
      const podcasts = await getPodcasts(this.currentPage.podcasts, 12);
      const container = document.getElementById('podcasts-grid');
      
      if (!container) return;
      
      if (podcasts && podcasts.data && podcasts.data.length > 0) {
        const html = podcasts.data.map((podcast, index) => `
          <div class="media-card simple-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${podcast.imageUrl ? `<img src="https://dashboard.ipstream.cl${podcast.imageUrl}" alt="${podcast.title}">` : `
                <div class="media-placeholder">
                  <i class="fas fa-podcast"></i>
                </div>
              `}
              <div class="media-overlay">
                <button class="play-btn" onclick="radioPulse.openPodcastModal('${podcast.id}')">
                  <i class="fas fa-play"></i>
                </button>
              </div>
            </div>
            <div class="media-info simple-info">
              <h4 class="media-title">${podcast.title}</h4>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        container.classList.add('simple-grid');
      } else {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">No hay podcasts disponibles</p>';
      }
    } catch (error) {
      console.error('RadioPulse: Error loading podcasts:', error);
    }
  }

  async loadVideocasts() {
    try {
      const videocasts = await getVideocasts(this.currentPage.videocasts, 12);
      const container = document.getElementById('videocasts-grid');
      
      if (!container) return;
      
      if (videocasts && videocasts.data && videocasts.data.length > 0) {
        const html = videocasts.data.map((videocast, index) => `
          <div class="media-card simple-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${videocast.imageUrl ? `<img src="https://dashboard.ipstream.cl${videocast.imageUrl}" alt="${videocast.title}">` : `
                <div class="media-placeholder">
                  <i class="fas fa-video"></i>
                </div>
              `}
              <div class="media-overlay">
                <button class="play-btn" onclick="radioPulse.openVideocastModal('${videocast.id}')">
                  <i class="fas fa-play"></i>
                </button>
              </div>
            </div>
            <div class="media-info simple-info">
              <h4 class="media-title">${videocast.title}</h4>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        container.classList.add('simple-grid');
      } else {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">No hay videocasts disponibles</p>';
      }
    } catch (error) {
      console.error('RadioPulse: Error loading videocasts:', error);
    }
  }

  async loadAllSponsors() {
    try {
      const sponsors = await getSponsors();
      const container = document.getElementById('all-sponsors-grid');
      
      if (!container) return;
      
      if (sponsors && sponsors.length > 0) {
        const html = sponsors.map((sponsor, index) => `
          <div class="sponsor-card" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="sponsor-logo">
              ${sponsor.logoUrl ? `<img src="https://dashboard.ipstream.cl${sponsor.logoUrl}" alt="${sponsor.name}" loading="lazy">` : `
                <div class="sponsor-logo-placeholder">
                  <i class="fas fa-handshake"></i>
                </div>
              `}
            </div>
            <div class="sponsor-info">
              <div class="sponsor-name">${sponsor.name}</div>
              <p class="sponsor-description">${sponsor.description || 'Patrocinador oficial que confía en nosotros'}</p>
              
              ${sponsor.address ? `
                <div class="sponsor-contact">
                  <div class="contact-item"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</div>
                </div>
              ` : ''}
              
              <div class="sponsor-actions">
                ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" class="sponsor-link primary"><i class="fas fa-external-link-alt"></i> Visitar sitio</a>` : ''}
                
                <div class="sponsor-social">
                  ${sponsor.facebook ? `<a href="${sponsor.facebook}" target="_blank" class="social-btn facebook" title="Facebook"><i class="fab fa-facebook-f"></i></a>` : ''}
                  ${sponsor.instagram ? `<a href="${sponsor.instagram}" target="_blank" class="social-btn instagram" title="Instagram"><i class="fab fa-instagram"></i></a>` : ''}
                  ${sponsor.youtube ? `<a href="${sponsor.youtube}" target="_blank" class="social-btn youtube" title="YouTube"><i class="fab fa-youtube"></i></a>` : ''}
                  ${sponsor.tiktok ? `<a href="${sponsor.tiktok}" target="_blank" class="social-btn tiktok" title="TikTok"><i class="fab fa-tiktok"></i></a>` : ''}
                  ${sponsor.x ? `<a href="${sponsor.x}" target="_blank" class="social-btn twitter" title="X (Twitter)"><i class="fab fa-x-twitter"></i></a>` : ''}
                  ${sponsor.whatsapp ? `<a href="https://wa.me/${sponsor.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="social-btn whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('RadioPulse: Error loading all sponsors:', error);
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
          
          const socialLinksHtml = `<div class="social-links">${socialHtml}</div>`;
          
          document.getElementById('footer-social').innerHTML = socialLinksHtml;
          
          const headerMainHtml = `<div class="social-links">${socialHtml}</div>`;
          const headerMainElement = document.getElementById('header-social-main');
          if (headerMainElement) {
            headerMainElement.innerHTML = headerMainHtml;
          }
        }
      }
    } catch (error) {
      console.error('RadioPulse: Error loading social networks:', error);
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
        this.updateStats(songData);
        if (songData.history && songData.history.length > 0) {
          this.updateRecentTracksFromSonicPanel(songData.history);
        }
      }
    } catch (error) {
      console.error('RadioPulse: Error loading SonicPanel data:', error);
    }
  }

  updateCurrentSongDisplay(songData) {
    document.getElementById('player-song-title').textContent = songData.title || 'Radio Pulse';
    document.getElementById('player-song-artist').textContent = songData.artist || 'En Vivo';
    document.getElementById('player-listeners').textContent = songData.listeners || '0';
    document.getElementById('player-bitrate').textContent = songData.bitrate || 'N/A';
    
    document.getElementById('footer-listeners').textContent = songData.listeners || '0';
    
    if (songData.art) {
      const playerArtwork = document.getElementById('player-artwork');
      if (playerArtwork) {
        playerArtwork.src = songData.art;
        playerArtwork.style.display = 'block';
      }
    }
  }

  updateStats(songData) {
    document.getElementById('sidebar-listeners').textContent = songData.listeners || '0';
    document.getElementById('sidebar-songs').textContent = Math.floor(Math.random() * 50) + 20;
    document.getElementById('sidebar-quality').textContent = songData.bitrate ? `${songData.bitrate}k` : 'HD';
  }

  startSonicPanelUpdates() {
    this.sonicPanelInterval = setInterval(() => {
      this.loadSonicPanelData();
      this.loadRecentTracks();
    }, 30000);
  }

  updateRecentTracksFromSonicPanel(history) {
    const container = document.getElementById('recent-tracks');
    if (!container) return;
    
    const recentTracks = history.slice(0, 5).map((trackString, index) => {
      const parts = trackString.split(' - ');
      let title, artist;
      
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        title = trackString.trim();
        artist = 'Artista desconocido';
      }
      
      const minutesAgo = (index + 1) * 3;
      const timeAgo = new Date(Date.now() - minutesAgo * 60000);
      
      return {
        title: title || 'Sin título',
        artist: artist || 'Artista desconocido',
        time: this.formatTime(timeAgo)
      };
    });
    
    if (recentTracks.length > 0) {
      const html = recentTracks.map((track, index) => `
        <div class="track-item">
          <div class="track-number">${index + 1}</div>
          <div class="track-details">
            <div class="track-name">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
          </div>
          <div class="track-time">${track.time}</div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  }

  setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
        
        // Close mobile menu after selection with animation
        if (window.innerWidth <= 768) {
          const navMenu = document.querySelector('.nav-menu');
          const menuToggle = document.querySelector('.mobile-menu-toggle');
          if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            setTimeout(() => {
              navMenu.style.cssText = '';
            }, 300);
          }
        }
      });
    });
    
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
      const closeMenu = () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        // Wait for animation to complete before removing styles
        setTimeout(() => {
          navMenu.style.cssText = '';
        }, 300);
      };
      
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = navMenu.classList.contains('active');
        
        if (isOpen) {
          closeMenu();
        } else {
          navMenu.classList.add('active');
          menuToggle.classList.add('active');
          
          // Get the header height dynamically
          const header = document.querySelector('.dynamic-header');
          const headerHeight = header ? header.offsetHeight : 80;
          
          // Force styles with fixed position and more transparency
          navMenu.style.cssText = `
            position: fixed !important;
            top: ${headerHeight}px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: rgba(0, 0, 0, 0.75) !important;
            backdrop-filter: blur(25px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            opacity: 1 !important;
            z-index: 999 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
            overflow-y: auto !important;
            max-height: calc(100vh - ${headerHeight}px) !important;
            padding: 0 !important;
            margin: 0 !important;
            visibility: visible !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          `;
        }
      });
      
      // Close menu when clicking outside with animation
      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (navMenu.classList.contains('active') && 
              !navMenu.contains(e.target) && 
              !menuToggle.contains(e.target)) {
            closeMenu();
          }
        });
      }, 100);
      
      // Close menu on window resize if screen becomes large
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
          closeMenu();
        }
      });
    }
  }

  setupAudioPlayer() {
    this.audioPlayer = document.getElementById('news-audio');
    
    document.getElementById('main-play-btn').addEventListener('click', () => {
      this.toggleAudio();
    });
    
    document.querySelector('.glass-slider').addEventListener('input', (e) => {
      this.setVolume(e.target.value);
    });
    
    document.getElementById('player-toggle').addEventListener('click', () => {
      this.togglePlayer();
    });
    
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('loadstart', () => {
        console.log('RadioPulse: Audio loading started');
      });
      
      this.audioPlayer.addEventListener('canplay', () => {
        console.log('RadioPulse: Audio can play');
      });
      
      this.audioPlayer.addEventListener('error', (e) => {
        console.error('RadioPulse: Audio error:', e);
        this.handleAudioError();
      });
    }
  }

  setupCarousels() {
    this.initHeroSwiper();
    this.initSponsorsSwiper();
  }

  initHeroSwiper() {
    this.heroSwiper = new Swiper('.hero-swiper', {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }

  initSponsorsSwiper() {
    this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  setupFilters() {
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        this.showDayPrograms(day);
        
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.showTab(tab);
      });
    });
  }

  setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id;
        this.closeModal(modalId);
      }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    });
    
    // Newsletter modal functionality
    const newsletterForm = document.querySelector('.newsletter-form-modal');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        console.log('Newsletter subscription:', email);
        alert('¡Gracias por suscribirte a nuestro newsletter!');
        this.closeModal('newsletter-modal');
      });
    }
  }

  setupAnimations() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
        disable: 'mobile'
      });
    }
  }

  setupRippleEffects() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.glass-btn')) {
        const btn = e.target.closest('.glass-btn');
        const ripple = btn.querySelector('.btn-ripple');
        
        if (ripple) {
          ripple.style.width = '0';
          ripple.style.height = '0';
          
          setTimeout(() => {
            ripple.style.width = '300px';
            ripple.style.height = '300px';
          }, 10);
          
          setTimeout(() => {
            ripple.style.width = '0';
            ripple.style.height = '0';
          }, 600);
        }
      }
    });
  }

  showSection(sectionName) {
    document.querySelectorAll('.dynamic-section').forEach(section => {
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    this.currentSection = sectionName;
    
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
    
    this.currentTab = tabName;
    
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  toggleAudio() {
    if (!this.audioPlayer || !this.streamUrl) {
      console.error('RadioPulse: Audio player or stream URL not available');
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
      console.log('RadioPulse: Audio playing');
    }).catch(error => {
      console.error('RadioPulse: Error playing audio:', error);
      this.handleAudioError();
    });
  }

  pauseAudio() {
    if (!this.audioPlayer) return;
    
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.updatePlayButton(false);
    console.log('RadioPulse: Audio paused');
  }

  setVolume(volume) {
    this.currentVolume = volume;
    if (this.audioPlayer) {
      this.audioPlayer.volume = volume / 100;
    }
  }

  updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('main-play-btn');
    const icon = playBtn.querySelector('i');
    
    if (isPlaying) {
      icon.className = 'fas fa-pause';
    } else {
      icon.className = 'fas fa-play';
    }
  }

  togglePlayer() {
    const player = document.getElementById('fixed-player');
    const toggle = document.getElementById('player-toggle');
    const icon = toggle.querySelector('i');
    
    player.classList.toggle('collapsed');
    
    if (player.classList.contains('collapsed')) {
      icon.className = 'fas fa-chevron-down';
    } else {
      icon.className = 'fas fa-chevron-up';
    }
  }

  handleAudioError() {
    this.isPlaying = false;
    this.updatePlayButton(false);
    console.error('RadioPulse: Audio playback error');
  }

  // Modal Management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Stop any playing media
      if (modalId === 'podcast-modal') {
        const audio = document.getElementById('podcast-audio');
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      } else if (modalId === 'videocast-modal') {
        // Clear video container to stop playback
        const videoContainer = document.querySelector('.media-modal-player.video-player');
        if (videoContainer) {
          videoContainer.innerHTML = `
            <video id="videocast-video" controls preload="none" poster="">
              <source src="" type="video/mp4">
              Tu navegador no soporta el elemento de video.
            </video>
          `;
        }
      }
    }
  }

  // News Modal
  async openNewsModal(slug) {
    try {
      console.log('RadioPulse: Opening news modal for:', slug);
      const article = await getNewsBySlug(slug);
      
      if (article) {
        // Update modal content
        document.getElementById('news-modal-title').textContent = article.name;
        document.getElementById('news-modal-date').innerHTML = `<i class="fas fa-calendar"></i> ${new Date(article.createdAt).toLocaleDateString()}`;
        document.getElementById('news-modal-author').innerHTML = `<i class="fas fa-user"></i> ${article.author || 'Redacción'}`;
        document.getElementById('news-modal-content').innerHTML = article.content || article.shortText || 'Contenido no disponible';
        
        // Update image
        const imageContainer = document.getElementById('news-modal-image-container');
        const image = document.getElementById('news-modal-image');
        if (article.imageUrl) {
          image.src = `https://dashboard.ipstream.cl${article.imageUrl}`;
          image.alt = article.name;
          imageContainer.style.display = 'block';
        } else {
          imageContainer.style.display = 'none';
        }
        
        this.currentNewsData = article;
        this.openModal('news-modal');
      }
    } catch (error) {
      console.error('RadioPulse: Error loading news details:', error);
    }
  }

  // Podcast Modal
  async openPodcastModal(podcastId) {
    try {
      console.log('RadioPulse: Opening podcast modal for:', podcastId);
      const podcast = await getPodcastById(podcastId);
      
      if (podcast) {
        // Update modal content
        document.getElementById('podcast-modal-title').textContent = podcast.title;
        document.getElementById('podcast-modal-date').innerHTML = `<i class="fas fa-calendar"></i> ${new Date(podcast.createdAt).toLocaleDateString()}`;
        document.getElementById('podcast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${podcast.duration || '45:00'}`;
        document.getElementById('podcast-modal-description').innerHTML = podcast.description || 'Descripción no disponible';
        
        // Update image
        const image = document.getElementById('podcast-modal-image');
        if (podcast.imageUrl) {
          image.src = `https://dashboard.ipstream.cl${podcast.imageUrl}`;
          image.alt = podcast.title;
        }
        
        // Setup audio
        const audio = document.getElementById('podcast-audio');
        if (podcast.audioUrl) {
          audio.src = `https://dashboard.ipstream.cl${podcast.audioUrl}`;
        }
        
        this.currentPodcastData = podcast;
        this.setupPodcastPlayer();
        this.openModal('podcast-modal');
      }
    } catch (error) {
      console.error('RadioPulse: Error loading podcast details:', error);
    }
  }

  // Videocast Modal
  async openVideocastModal(videocastId) {
    try {
      console.log('RadioPulse: Opening videocast modal for:', videocastId);
      const videocast = await getVideocastById(videocastId);
      
      if (videocast) {
        // Update modal content
        document.getElementById('videocast-modal-title').textContent = videocast.title;
        document.getElementById('videocast-modal-date').innerHTML = `<i class="fas fa-calendar"></i> ${new Date(videocast.createdAt).toLocaleDateString()}`;
        document.getElementById('videocast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${videocast.duration || '30:00'}`;
        document.getElementById('videocast-modal-description').innerHTML = videocast.description || 'Descripción no disponible';
        
        // Setup video player
        const videoContainer = document.querySelector('.media-modal-player.video-player');
        if (videocast.videoUrl) {
          const embedUrl = this.getEmbedUrl(videocast.videoUrl);
          
          if (embedUrl) {
            // Use iframe for YouTube/Vimeo
            videoContainer.innerHTML = `
              <iframe 
                src="${embedUrl}" 
                title="${videocast.title}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                style="width: 100%; height: 100%; border-radius: 12px;">
              </iframe>
            `;
          } else {
            // Fallback message
            videoContainer.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: rgba(0,0,0,0.5); color: white; border-radius: 12px;">
                <div style="text-align: center; padding: 2rem;">
                  <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                  <p>No se puede reproducir este video</p>
                  <a href="${videocast.videoUrl}" target="_blank" style="color: #667eea; text-decoration: none; margin-top: 1rem; display: inline-block;">
                    Ver en sitio original
                  </a>
                </div>
              </div>
            `;
          }
        } else {
          videoContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: white;">No hay video disponible</p>';
        }
        
        this.currentVideocastData = videocast;
        this.openModal('videocast-modal');
      }
    } catch (error) {
      console.error('RadioPulse: Error loading videocast details:', error);
    }
  }

  // Podcast Player Setup
  setupPodcastPlayer() {
    const audio = document.getElementById('podcast-audio');
    const playBtn = document.getElementById('podcast-play-btn');
    const progressBar = document.getElementById('podcast-progress');
    const currentTimeSpan = document.getElementById('podcast-current-time');
    const totalTimeSpan = document.getElementById('podcast-total-time');
    
    let isPlaying = false;
    
    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
      } else {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        isPlaying = true;
      }
    });
    
    audio.addEventListener('loadedmetadata', () => {
      totalTimeSpan.textContent = this.formatTime(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      const progress = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${progress}%`;
      currentTimeSpan.textContent = this.formatTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      isPlaying = false;
      progressBar.style.width = '0%';
      currentTimeSpan.textContent = '0:00';
    });
    
    // Progress bar click
    const progressContainer = progressBar.parentElement;
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickTime = (clickX / width) * audio.duration;
      audio.currentTime = clickTime;
    });
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getEmbedUrl(videoUrl) {
    if (!videoUrl) return null;
    
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
    }
    
    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    // If it's already an embed URL, return as is
    if (videoUrl.includes('embed') || videoUrl.includes('player')) {
      return videoUrl;
    }
    
    // Return null if we can't create an embed URL
    return null;
  }

  // Share Functions
  shareNews() {
    if (this.currentNewsData) {
      const url = window.location.href;
      const text = `${this.currentNewsData.name} - ${this.currentNewsData.shortText || ''}`;
      
      if (navigator.share) {
        navigator.share({
          title: this.currentNewsData.name,
          text: text,
          url: url
        });
      } else {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`).then(() => {
          alert('Enlace copiado al portapapeles');
        });
      }
    }
  }

  sharePodcast() {
    if (this.currentPodcastData) {
      const url = window.location.href;
      const text = `Escucha este podcast: ${this.currentPodcastData.title}`;
      
      if (navigator.share) {
        navigator.share({
          title: this.currentPodcastData.title,
          text: text,
          url: url
        });
      } else {
        navigator.clipboard.writeText(`${text} ${url}`).then(() => {
          alert('Enlace copiado al portapapeles');
        });
      }
    }
  }

  shareVideocast() {
    if (this.currentVideocastData) {
      const url = window.location.href;
      const text = `Mira este videocast: ${this.currentVideocastData.title}`;
      
      if (navigator.share) {
        navigator.share({
          title: this.currentVideocastData.title,
          text: text,
          url: url
        });
      } else {
        navigator.clipboard.writeText(`${text} ${url}`).then(() => {
          alert('Enlace copiado al portapapeles');
        });
      }
    }
  }

  // Download Functions
  downloadPodcast() {
    if (this.currentPodcastData && this.currentPodcastData.audioUrl) {
      const link = document.createElement('a');
      link.href = `https://dashboard.ipstream.cl${this.currentPodcastData.audioUrl}`;
      link.download = `${this.currentPodcastData.title}.mp3`;
      link.click();
    }
  }

  downloadVideocast() {
    if (this.currentVideocastData && this.currentVideocastData.videoUrl) {
      const link = document.createElement('a');
      link.href = `https://dashboard.ipstream.cl${this.currentVideocastData.videoUrl}`;
      link.download = `${this.currentVideocastData.title}.mp4`;
      link.click();
    }
  }

  // Legacy methods for compatibility
  viewNews(slug) {
    this.openNewsModal(slug);
  }

  playPodcast(audioUrl) {
    console.log('RadioPulse: Playing podcast:', audioUrl);
  }

  playVideocast(videoUrl) {
    console.log('RadioPulse: Playing videocast:', videoUrl);
  }

  playLiveProgram(programId) {
    console.log('RadioPulse: Playing live program:', programId);
    if (this.streamUrl) {
      this.playAudio();
    } else {
      console.warn('RadioPulse: No stream URL available for live program');
    }
  }

  destroy() {
    if (this.sonicPanelInterval) {
      clearInterval(this.sonicPanelInterval);
    }
    
    if (this.heroSwiper) this.heroSwiper.destroy();
    if (this.sponsorsSwiper) this.sponsorsSwiper.destroy();
    
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.src = '';
    }
  }
}

// Initialize the radio pulse when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('RadioPulse: DOM loaded, creating instance...');
  try {
    window.radioPulse = new RadioPulse();
    console.log('RadioPulse: Instance created successfully');
  } catch (error) {
    console.error('RadioPulse: Error creating instance:', error);
    console.error('RadioPulse: Error stack:', error.stack);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.radioPulse) {
    window.radioPulse.destroy();
  }
});