import { 
  getBasicData, 
  buildImageUrl, 
  getPrograms, 
  getNews, 
  getPodcasts, 
  getVideocasts, 
  getSponsors, 
  getSocialNetworks,
  getCurrentSong
} from '/assets/js/api.js';

class RadioNexus {
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
    console.log('RadioNexus: Initializing modern radio experience...');
    console.log('RadioNexus: DOM ready, starting initialization');
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
      await this.loadSonicPanelData();
      this.startSonicPanelUpdates();
      
      console.log('RadioNexus: Modern radio experience is live! 🚀');
    } catch (error) {
      console.error('RadioNexus: Error initializing:', error);
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        console.log('Template5: Fallback - Ocultando loading');
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
    console.log('RadioNexus: Showing loading overlay');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    } else {
      console.warn('RadioNexus: Loading overlay not found');
    }
  }

  hideLoading() {
    console.log('RadioNexus: Hiding loading overlay');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    } else {
      console.warn('RadioNexus: Loading overlay not found');
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
      console.error('RadioNexus: Error loading basic data:', error);
    }
  }

  async loadAllContent() {
    console.log('RadioNexus: Loading all content...');
    
    try {
      console.log('RadioNexus: Starting content loading...');
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
      console.log('RadioNexus: All content loaded successfully');
    } catch (error) {
      console.error('RadioNexus: Error loading content:', error);
      console.error('RadioNexus: Error details:', error.stack);
    }
  }

  async loadHeroCarousel() {
    try {
      console.log('RadioNexus: Loading hero carousel...');
      const news = await getNews(1, 5);
      console.log('RadioNexus: Hero carousel news data:', news);
      const container = document.getElementById('hero-carousel');
      
      if (!container) {
        console.warn('RadioNexus: Hero carousel container not found');
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
      console.error('RadioNexus: Error loading hero carousel:', error);
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
      console.error('RadioNexus: Error loading breaking news:', error);
    }
  }

  async loadFeaturedNews() {
    try {
      console.log('RadioNexus: Loading featured news...');
      const news = await getNews(1, 6);
      console.log('RadioNexus: Featured news data:', news);
      const container = document.getElementById('featured-news-grid');
      
      if (!container) {
        console.warn('RadioNexus: Featured news container not found');
        return;
      }
      
      if (news && news.data && news.data.length > 0) {
        // Store news data for modal
        this.featuredNewsData = news.data;
        
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
                <button class="read-more-btn glass-btn" onclick="radioNexus.openNewsModal(${index})">
                  <i class="fas fa-book-open"></i>
                  <span>Leer más</span>
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
      console.error('RadioNexus: Error loading featured news:', error);
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
      console.error('RadioNexus: Error loading programs timeline:', error);
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
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); padding: 2rem;">No hay historial disponible</p>';
      }
    } catch (error) {
      console.error('RadioNexus: Error loading recent tracks:', error);
      const container = document.getElementById('recent-tracks');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">Error cargando historial</p>';
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
      console.error('RadioNexus: Error loading quick news:', error);
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
      console.error('RadioNexus: Error loading sponsors carousel:', error);
    }
  }

  async loadAllNews() {
    try {
      const news = await getNews(this.currentPage.news, 12);
      const container = document.getElementById('all-news-grid');
      
      if (!container) return;
      
      if (news && news.data && news.data.length > 0) {
        // Store all news data for modal access
        if (!this.allNewsData) {
          this.allNewsData = [];
        }
        
        // Add new news to the array
        const startIndex = this.allNewsData.length;
        this.allNewsData = this.allNewsData.concat(news.data);
        
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
                <button class="read-more-btn glass-btn" onclick="radioNexus.openAllNewsModal(${startIndex + index})">
                  <i class="fas fa-book-open"></i>
                  <span>Leer más</span>
                </button>
              </div>
            </div>
          </article>
        `).join('');
        
        if (this.currentPage.news === 1) {
          container.innerHTML = html;
        } else {
          container.insertAdjacentHTML('beforeend', html);
        }
      }
    } catch (error) {
      console.error('RadioNexus: Error loading all news:', error);
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
      console.error('RadioNexus: Error loading programs by day:', error);
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
                      ${status === 'live' ? `onclick="radioNexus.playLiveProgram('${program.id}')"` : ''}>
                <i class="fas fa-${status === 'live' ? 'play' : 'clock'}"></i>
                ${status === 'live' ? 'Escuchar' : 'Programado'}
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
    console.log('RadioNexus: Setting current day as active:', currentDay);
    
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
    console.log('RadioNexus: Showing programs for:', day);
    
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
        // Store podcasts data for modal
        this.podcastsData = podcasts.data;
        
        const html = podcasts.data.map((podcast, index) => `
          <div class="media-card podcast-card glass-effect" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${podcast.imageUrl ? `<img src="https://dashboard.ipstream.cl${podcast.imageUrl}" alt="${podcast.title || podcast.name || 'Podcast'}">` : '<div class="default-thumbnail"><i class="fas fa-podcast"></i></div>'}
              <div class="media-overlay">
                <button class="play-btn glass-btn" onclick="radioNexus.openPodcastModal(${index})">
                  <i class="fas fa-play"></i>
                </button>
              </div>
              <div class="media-duration">${podcast.duration || '45:00'}</div>
            </div>
            <div class="media-info">
              <h4 class="media-title">${podcast.title || podcast.name || 'Podcast sin título'}</h4>
              <p class="media-description">${podcast.description || 'Podcast sin descripción'}</p>
              <div class="media-meta">
                <span>${new Date(podcast.createdAt).toLocaleDateString()}</span>
                <span><i class="fas fa-download"></i> ${Math.floor(Math.random() * 500) + 50}</span>
              </div>
              <button class="media-action-btn glass-btn" onclick="radioNexus.openPodcastModal(${index})">
                <i class="fas fa-headphones"></i>
                <span>Escuchar</span>
              </button>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('RadioNexus: Error loading podcasts:', error);
    }
  }

  async loadVideocasts() {
    try {
      const videocasts = await getVideocasts(this.currentPage.videocasts, 12);
      const container = document.getElementById('videocasts-grid');
      
      if (!container) return;
      
      if (videocasts && videocasts.data && videocasts.data.length > 0) {
        // Store videocasts data for modal
        this.videocastsData = videocasts.data;
        
        const html = videocasts.data.map((videocast, index) => `
          <div class="media-card videocast-card glass-effect" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${videocast.imageUrl ? `<img src="https://dashboard.ipstream.cl${videocast.imageUrl}" alt="${videocast.title || videocast.name || 'Videocast'}">` : '<div class="default-thumbnail"><i class="fas fa-video"></i></div>'}
              <div class="media-overlay">
                <button class="play-btn glass-btn" onclick="radioNexus.openVideocastModal(${index})">
                  <i class="fas fa-play"></i>
                </button>
              </div>
              <div class="media-duration">${videocast.duration || '30:00'}</div>
            </div>
            <div class="media-info">
              <h4 class="media-title">${videocast.title || videocast.name || 'Videocast sin título'}</h4>
              <p class="media-description">${videocast.description || 'Videocast sin descripción'}</p>
              <div class="media-meta">
                <span>${new Date(videocast.createdAt).toLocaleDateString()}</span>
                <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 800) + 100}</span>
              </div>
              <button class="media-action-btn glass-btn" onclick="radioNexus.openVideocastModal(${index})">
                <i class="fas fa-play"></i>
                <span>Ver Video</span>
              </button>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('RadioNexus: Error loading videocasts:', error);
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
      console.error('RadioNexus: Error loading all sponsors:', error);
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
      console.error('RadioNexus: Error loading social networks:', error);
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
      console.error('RadioNexus: Error loading SonicPanel data:', error);
    }
  }

  updateCurrentSongDisplay(songData) {
    document.getElementById('player-song-title').textContent = songData.title || 'Radio Nexus';
    document.getElementById('player-song-artist').textContent = songData.artist || 'En Vivo';
    document.getElementById('player-listeners').textContent = songData.listeners || '0';
    document.getElementById('player-bitrate').textContent = songData.bitrate || 'N/A';
    
    document.getElementById('footer-listeners').textContent = songData.listeners || '0';
    
    const playerArtwork = document.getElementById('player-artwork');
    const defaultArtwork = document.querySelector('.default-artwork');
    
    if (songData.art && songData.art.trim() !== '') {
      if (playerArtwork) {
        playerArtwork.src = songData.art;
        playerArtwork.style.display = 'block';
        playerArtwork.onerror = () => {
          playerArtwork.style.display = 'none';
          if (defaultArtwork) defaultArtwork.style.display = 'flex';
        };
        if (defaultArtwork) defaultArtwork.style.display = 'none';
      }
    } else {
      if (playerArtwork) playerArtwork.style.display = 'none';
      if (defaultArtwork) defaultArtwork.style.display = 'flex';
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
        
        // Close mobile menu after selection
        if (window.innerWidth <= 768) {
          const navMenu = document.querySelector('.nav-menu');
          const menuToggle = document.querySelector('.mobile-menu-toggle');
          if (navMenu) navMenu.classList.remove('active');
          if (menuToggle) menuToggle.classList.remove('active');
        }
      });
    });
    
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = navMenu.classList.contains('active');
        
        if (isOpen) {
          navMenu.classList.remove('active');
          menuToggle.classList.remove('active');
          navMenu.style.cssText = '';
        } else {
          navMenu.classList.add('active');
          menuToggle.classList.add('active');
          
          // Get the header height dynamically
          const header = document.querySelector('.modern-header');
          const headerHeight = header ? header.offsetHeight : 80;
          
          // Force styles with fixed position
          navMenu.style.cssText = `
            position: fixed !important;
            top: ${headerHeight}px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(20px) !important;
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            opacity: 1 !important;
            z-index: 999 !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
            overflow-y: auto !important;
            max-height: calc(100vh - ${headerHeight}px) !important;
            padding: 0 !important;
            margin: 0 !important;
            visibility: visible !important;
            border-radius: 0 0 20px 20px !important;
          `;
        }
      });
      
      // Close menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (navMenu.classList.contains('active') && 
              !navMenu.contains(e.target) && 
              !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            navMenu.style.cssText = '';
          }
        });
      }, 100);
      
      // Close menu on window resize if screen becomes large
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          navMenu.classList.remove('active');
          menuToggle.classList.remove('active');
          navMenu.style.cssText = '';
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
        console.log('RadioNexus: Audio loading started');
      });
      
      this.audioPlayer.addEventListener('canplay', () => {
        console.log('RadioNexus: Audio can play');
      });
      
      this.audioPlayer.addEventListener('error', (e) => {
        console.error('RadioNexus: Audio error:', e);
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
    
    // Setup load more news button
    const loadMoreBtn = document.getElementById('load-more-news');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreNews();
      });
    }
  }

  async loadMoreNews() {
    try {
      this.currentPage.news++;
      const loadMoreBtn = document.getElementById('load-more-news');
      const originalText = loadMoreBtn.innerHTML;
      
      // Show loading state
      loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Cargando...</span>';
      loadMoreBtn.disabled = true;
      
      const news = await getNews(this.currentPage.news, 12);
      const container = document.getElementById('all-news-grid');
      
      if (news && news.data && news.data.length > 0) {
        // Add new news to the array
        const startIndex = this.allNewsData.length;
        this.allNewsData = this.allNewsData.concat(news.data);
        
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
                <button class="read-more-btn glass-btn" onclick="radioNexus.openAllNewsModal(${startIndex + index})">
                  <i class="fas fa-book-open"></i>
                  <span>Leer más</span>
                </button>
              </div>
            </div>
          </article>
        `).join('');
        
        container.insertAdjacentHTML('beforeend', html);
        
        // Refresh AOS animations
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
        
        // Hide button if no more news
        if (news.data.length < 12) {
          loadMoreBtn.style.display = 'none';
        }
      } else {
        // No more news available
        loadMoreBtn.style.display = 'none';
      }
      
      // Restore button state
      loadMoreBtn.innerHTML = originalText;
      loadMoreBtn.disabled = false;
      
    } catch (error) {
      console.error('RadioNexus: Error loading more news:', error);
      
      // Restore button state
      const loadMoreBtn = document.getElementById('load-more-news');
      loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i><span>Cargar Más Noticias</span>';
      loadMoreBtn.disabled = false;
      
      // Revert page counter
      this.currentPage.news--;
    }
  }

  setupModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = 'auto';
          
          // Pause any playing media
          const audio = modal.querySelector('audio');
          const video = modal.querySelector('video');
          
          if (audio && !audio.paused) {
            audio.pause();
          }
          
          if (video && !video.paused) {
            video.pause();
          }
        }
      });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          activeModal.classList.remove('active');
          document.body.style.overflow = 'auto';
          
          // Pause any playing media
          const audio = activeModal.querySelector('audio');
          const video = activeModal.querySelector('video');
          
          if (audio && !audio.paused) {
            audio.pause();
          }
          
          if (video && !video.paused) {
            video.pause();
          }
        }
      }
    });
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

  showSection(sectionName) {
    document.querySelectorAll('.modern-section').forEach(section => {
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
      console.error('RadioNexus: Audio player or stream URL not available');
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
      console.log('RadioNexus: Audio playing');
    }).catch(error => {
      console.error('RadioNexus: Error playing audio:', error);
      this.handleAudioError();
    });
  }

  pauseAudio() {
    if (!this.audioPlayer) return;
    
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.updatePlayButton(false);
    console.log('RadioNexus: Audio paused');
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
    console.error('RadioNexus: Audio playback error');
  }

  // Modal methods
  openNewsModal(index) {
    if (!this.featuredNewsData || !this.featuredNewsData[index]) {
      console.error('RadioNexus: News data not available for index:', index);
      return;
    }
    
    const article = this.featuredNewsData[index];
    this.showNewsModal(article);
  }

  openAllNewsModal(index) {
    if (!this.allNewsData || !this.allNewsData[index]) {
      console.error('RadioNexus: All news data not available for index:', index);
      return;
    }
    
    const article = this.allNewsData[index];
    this.showNewsModal(article);
  }

  showNewsModal(article) {
    const modal = document.getElementById('news-modal');
    
    // Populate modal content
    document.getElementById('news-modal-title').textContent = article.name;
    document.getElementById('news-modal-date').textContent = new Date(article.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('news-modal-views').innerHTML = `<i class="fas fa-eye"></i> ${Math.floor(Math.random() * 1000) + 100} vistas`;
    
    // Set image
    const imageContainer = document.getElementById('news-modal-image-container');
    if (article.imageUrl) {
      imageContainer.innerHTML = `<img src="https://dashboard.ipstream.cl${article.imageUrl}" alt="${article.name}">`;
    } else {
      imageContainer.innerHTML = '';
    }
    
    // Set content
    const contentContainer = document.getElementById('news-modal-content');
    contentContainer.innerHTML = `
      <p>${article.shortText || 'Resumen de la noticia no disponible'}</p>
      <p>${article.content || article.longText || 'Esta es una noticia importante que merece tu atención. Nuestro equipo de periodistas ha trabajado para traerte la información más relevante y actualizada sobre este tema que impacta a nuestra comunidad.'}</p>
      <p>Mantente informado con las últimas noticias y actualizaciones. Nuestro compromiso es brindarte información veraz y oportuna las 24 horas del día.</p>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeNewsModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  openPodcastModal(index) {
    if (!this.podcastsData || !this.podcastsData[index]) {
      console.error('RadioNexus: Podcast data not available for index:', index);
      return;
    }
    
    const podcast = this.podcastsData[index];
    const modal = document.getElementById('podcast-modal');
    
    // Populate modal content
    document.getElementById('podcast-modal-title').textContent = podcast.title || podcast.name || 'Podcast sin título';
    document.getElementById('podcast-modal-date').textContent = new Date(podcast.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('podcast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${podcast.duration || '45:00'}`;
    document.getElementById('podcast-modal-downloads').innerHTML = `<i class="fas fa-download"></i> ${Math.floor(Math.random() * 500) + 50} descargas`;
    
    // Set image
    const imageContainer = document.getElementById('podcast-modal-image-container');
    if (podcast.imageUrl) {
      imageContainer.innerHTML = `<img src="https://dashboard.ipstream.cl${podcast.imageUrl}" alt="${podcast.title || podcast.name}">`;
    } else {
      imageContainer.innerHTML = '<div class="default-thumbnail"><i class="fas fa-podcast"></i></div>';
    }
    
    // Set audio source
    const audioPlayer = document.getElementById('podcast-audio');
    if (podcast.audioUrl) {
      audioPlayer.src = `https://dashboard.ipstream.cl${podcast.audioUrl}`;
    } else {
      audioPlayer.src = '';
    }
    
    // Set description
    const descriptionContainer = document.getElementById('podcast-modal-description');
    descriptionContainer.innerHTML = `
      <p>${podcast.description || 'Descripción del podcast no disponible'}</p>
      <p>Disfruta de este episodio completo de nuestro podcast. Contenido de calidad con los mejores invitados y temas de actualidad.</p>
    `;
    
    // Set download button
    const downloadBtn = document.getElementById('podcast-download-btn');
    if (podcast.audioUrl) {
      downloadBtn.onclick = () => this.downloadPodcast(podcast.audioUrl, podcast.title || podcast.name);
    } else {
      downloadBtn.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closePodcastModal() {
    const modal = document.getElementById('podcast-modal');
    const audioPlayer = document.getElementById('podcast-audio');
    
    // Pause audio if playing
    if (!audioPlayer.paused) {
      audioPlayer.pause();
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  openVideocastModal(index) {
    if (!this.videocastsData || !this.videocastsData[index]) {
      console.error('RadioNexus: Videocast data not available for index:', index);
      return;
    }
    
    const videocast = this.videocastsData[index];
    const modal = document.getElementById('videocast-modal');
    
    // Populate modal content
    document.getElementById('videocast-modal-title').textContent = videocast.title || videocast.name || 'Videocast sin título';
    document.getElementById('videocast-modal-date').textContent = new Date(videocast.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('videocast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${videocast.duration || '30:00'}`;
    document.getElementById('videocast-modal-views').innerHTML = `<i class="fas fa-eye"></i> ${Math.floor(Math.random() * 800) + 100} vistas`;
    
    // Setup video player
    const videoContainer = document.querySelector('.videocast-modal-player');
    if (videocast.videoUrl) {
      const embedUrl = this.getEmbedUrl(videocast.videoUrl);
      
      if (embedUrl) {
        // Use iframe for YouTube/Vimeo
        videoContainer.innerHTML = `
          <iframe 
            src="${embedUrl}" 
            title="${videocast.title || videocast.name}"
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
    
    // Set description
    const descriptionContainer = document.getElementById('videocast-modal-description');
    descriptionContainer.innerHTML = `
      <p>${videocast.description || 'Descripción del videocast no disponible'}</p>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    const videoContainer = document.querySelector('.videocast-modal-player');
    
    // Clear video container to stop playback
    if (videoContainer) {
      videoContainer.innerHTML = `
        <video id="videocast-video" controls preload="none" poster="">
          Tu navegador no soporta el elemento de video.
        </video>
      `;
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  toggleVideoFullscreen() {
    const videoPlayer = document.getElementById('videocast-video');
    
    if (videoPlayer.requestFullscreen) {
      videoPlayer.requestFullscreen();
    } else if (videoPlayer.webkitRequestFullscreen) {
      videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) {
      videoPlayer.msRequestFullscreen();
    }
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

  downloadPodcast(audioUrl, title) {
    const link = document.createElement('a');
    link.href = `https://dashboard.ipstream.cl${audioUrl}`;
    link.download = `${title || 'podcast'}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Share functionality
  shareNews() {
    const shareOptions = document.getElementById('news-share-options');
    const isVisible = shareOptions.style.display !== 'none';
    
    // Hide all share options first
    document.querySelectorAll('.share-options').forEach(option => {
      option.style.display = 'none';
    });
    
    if (!isVisible) {
      shareOptions.style.display = 'flex';
    }
  }

  sharePodcast() {
    const shareOptions = document.getElementById('podcast-share-options');
    const isVisible = shareOptions.style.display !== 'none';
    
    // Hide all share options first
    document.querySelectorAll('.share-options').forEach(option => {
      option.style.display = 'none';
    });
    
    if (!isVisible) {
      shareOptions.style.display = 'flex';
    }
  }

  shareVideocast() {
    const shareOptions = document.getElementById('videocast-share-options');
    const isVisible = shareOptions.style.display !== 'none';
    
    // Hide all share options first
    document.querySelectorAll('.share-options').forEach(option => {
      option.style.display = 'none';
    });
    
    if (!isVisible) {
      shareOptions.style.display = 'flex';
    }
  }

  shareToFacebook(type) {
    const content = this.getCurrentShareContent(type);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.text)}`;
    this.openShareWindow(url);
  }

  shareToTwitter(type) {
    const content = this.getCurrentShareContent(type);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.text)}&url=${encodeURIComponent(content.url)}`;
    this.openShareWindow(url);
  }

  shareToWhatsApp(type) {
    const content = this.getCurrentShareContent(type);
    const text = `${content.text} ${content.url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    this.openShareWindow(url);
  }

  copyNewsLink() {
    this.copyToClipboard('news');
  }

  copyPodcastLink() {
    this.copyToClipboard('podcast');
  }

  copyVideocastLink() {
    this.copyToClipboard('videocast');
  }

  getCurrentShareContent(type) {
    const baseUrl = window.location.origin;
    let title, url, text;

    switch (type) {
      case 'news':
        title = document.getElementById('news-modal-title').textContent;
        url = `${baseUrl}#noticia-${this.slugify(title)}`;
        text = `📰 ${title} - Mantente informado con Radio Nexus`;
        break;
      case 'podcast':
        title = document.getElementById('podcast-modal-title').textContent;
        url = `${baseUrl}#podcast-${this.slugify(title)}`;
        text = `🎧 Escucha: ${title} - Radio Nexus Podcast`;
        break;
      case 'videocast':
        title = document.getElementById('videocast-modal-title').textContent;
        url = `${baseUrl}#video-${this.slugify(title)}`;
        text = `📹 Mira: ${title} - Radio Nexus Video`;
        break;
      default:
        title = 'Radio Nexus';
        url = baseUrl;
        text = '🎵 Escucha Radio Nexus - Tu radio moderna las 24 horas';
    }

    return { title, url, text };
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  openShareWindow(url) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  async copyToClipboard(type) {
    const content = this.getCurrentShareContent(type);
    const textToCopy = `${content.text} ${content.url}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showShareNotification('¡Enlace copiado al portapapeles!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showShareNotification('¡Enlace copiado al portapapeles!', 'success');
    }
  }

  showShareNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.share-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `share-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4ecdc4, #44a08d);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 10002;
      animation: slideInRight 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  // Media player methods
  viewNews(slug) {
    console.log('RadioNexus: Viewing news:', slug);
  }

  playPodcast(audioUrl) {
    console.log('RadioNexus: Playing podcast:', audioUrl);
  }

  playVideocast(videoUrl) {
    console.log('RadioNexus: Playing videocast:', videoUrl);
  }

  playLiveProgram(programId) {
    console.log('RadioNexus: Playing live program:', programId);
    if (this.streamUrl) {
      this.playAudio();
    } else {
      console.warn('RadioNexus: No stream URL available for live program');
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

// Initialize the radio nexus when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('RadioNexus: DOM loaded, creating instance...');
  try {
    window.radioNexus = new RadioNexus();
    console.log('RadioNexus: Instance created successfully');
  } catch (error) {
    console.error('RadioNexus: Error creating instance:', error);
    console.error('RadioNexus: Error stack:', error.stack);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.radioNexus) {
    window.radioNexus.destroy();
  }
});