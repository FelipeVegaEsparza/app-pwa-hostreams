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

class NewsHub {
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
    } catch (error) {
      console.error('NewsHub: Error initializing:', error);
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
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
    document.getElementById('loading-overlay').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
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
      console.error('NewsHub: Error loading basic data:', error);
    }
  }

  async loadAllContent() {
    try {
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
    } catch (error) {
      console.error('NewsHub: Error loading content:', error);
    }
  }

  async loadHeroCarousel() {
    try {
      const news = await getNews(1, 5);
      const container = document.getElementById('hero-carousel');
      
      if (!container) return;
      
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
      console.error('NewsHub: Error loading hero carousel:', error);
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
      console.error('NewsHub: Error loading breaking news:', error);
    }
  }

  async loadFeaturedNews() {
    try {
      const news = await getNews(1, 6);
      const container = document.getElementById('featured-news-grid');
      
      if (!container) return;
      
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
                <a href="#" class="read-more" onclick="newsHub.openNewsModal(${index})">Leer más</a>
              </div>
            </div>
          </article>
        `).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>No hay noticias disponibles</p>';
      }
    } catch (error) {
      console.error('NewsHub: Error loading featured news:', error);
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
      console.error('NewsHub: Error loading programs timeline:', error);
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
        // El historial viene como array de strings, necesitamos parsearlo
        recentTracks = songData.history.slice(0, 5).map((trackString, index) => {
          // Intentar separar artista y título si están separados por " - "
          const parts = trackString.split(' - ');
          let title, artist;
          
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          } else {
            title = trackString.trim();
            artist = 'Artista desconocido';
          }
          
          // Generar tiempo aproximado (cada canción ~3-4 minutos atrás)
          const minutesAgo = (index + 1) * 3;
          const timeAgo = new Date(Date.now() - minutesAgo * 60000);
          
          return {
            title: title || 'Sin título',
            artist: artist || 'Artista desconocido',
            time: this.formatTime(timeAgo)
          };
        });
      } else {
        // Fallback con datos simulados si no hay historial
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
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No hay historial disponible</p>';
      }
    } catch (error) {
      console.error('NewsHub: Error loading recent tracks:', error);
      const container = document.getElementById('recent-tracks');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 2rem;">Error cargando historial</p>';
      }
    }
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
      console.error('NewsHub: Error loading quick news:', error);
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
                ${sponsor.imageUrl ? `<img src="https://dashboard.ipstream.cl${sponsor.imageUrl}" alt="${sponsor.name}">` : ''}
              </div>
              <div class="sponsor-name">${sponsor.name}</div>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Reinitialize Swiper
        if (this.sponsorsSwiper) {
          this.sponsorsSwiper.destroy();
        }
        this.initSponsorsSwiper();
      }
    } catch (error) {
      console.error('NewsHub: Error loading sponsors carousel:', error);
    }
  }

  async loadAllNews() {
    try {
      const news = await getNews(this.currentPage.news, 12);
      const container = document.getElementById('all-news-grid');
      
      if (!container) return;
      
      if (news && news.data && news.data.length > 0) {
        // Store all news data for modal
        this.allNewsData = news.data;
        
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
                <a href="#" class="read-more" onclick="newsHub.openAllNewsModal(${index})">Leer más</a>
              </div>
            </div>
          </article>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('NewsHub: Error loading all news:', error);
    }
  }

  async loadProgramsByDay() {
    try {
      const programs = await getPrograms();
      
      if (!programs || programs.length === 0) {
        this.showEmptyDayMessage();
        return;
      }
      
      // Organizar programas por día de la semana
      const programsByDay = this.organizeProgramsByDay(programs);
      
      // Cargar programas para cada día
      const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      
      days.forEach(day => {
        this.loadDayPrograms(day, programsByDay[day] || []);
      });
      
      // Establecer el día actual como activo después de cargar todos los programas
      this.setCurrentDayAsActive();
      
    } catch (error) {
      console.error('NewsHub: Error loading programs by day:', error);
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
      // Si el programa tiene días específicos, usarlos
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
    
    // Ordenar programas por hora de inicio
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
                      ${status === 'live' ? `onclick="newsHub.playLiveProgram('${program.id}')"` : ''}>
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
    
    // Actualizar los botones de navegación
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.day === currentDay) {
        btn.classList.add('active');
      }
    });
    
    // Mostrar la sección del día actual
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





  async loadPodcasts() {
    try {
      const podcasts = await getPodcasts(this.currentPage.podcasts, 12);
      const container = document.getElementById('podcasts-grid');
      
      if (!container) return;
      
      if (podcasts && podcasts.data && podcasts.data.length > 0) {
        // Store podcasts data for modal
        this.podcastsData = podcasts.data;
        
        const html = podcasts.data.map((podcast, index) => `
          <div class="media-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${podcast.imageUrl ? `<img src="https://dashboard.ipstream.cl${podcast.imageUrl}" alt="${podcast.title || podcast.name || 'Podcast'}">` : ''}
              <div class="media-overlay">
                <button class="play-btn" onclick="newsHub.openPodcastModal(${index})">
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
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('NewsHub: Error loading podcasts:', error);
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
          <div class="media-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="media-thumbnail">
              ${videocast.imageUrl ? `<img src="https://dashboard.ipstream.cl${videocast.imageUrl}" alt="${videocast.title || videocast.name || 'Videocast'}">` : ''}
              <div class="media-overlay">
                <button class="play-btn" onclick="newsHub.openVideocastModal(${index})">
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
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('NewsHub: Error loading videocasts:', error);
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
      console.error('NewsHub: Error loading all sponsors:', error);
    }
  }

  async loadSocialNetworks() {
    try {
      const socialData = await getSocialNetworks();

      
      if (socialData && typeof socialData === 'object') {
        // Convertir el objeto a array de redes sociales válidas
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
          
          // Para footer-social, usar la estructura con .social-links
          const socialLinksHtml = `<div class="social-links">${socialHtml}</div>`;
          
          document.getElementById('footer-social').innerHTML = socialLinksHtml;
          
          // Para header-social-main, usar la estructura específica
          const headerMainHtml = `<div class="social-links">${socialHtml}</div>`;
          const headerMainElement = document.getElementById('header-social-main');
          if (headerMainElement) {
            headerMainElement.innerHTML = headerMainHtml;
          }
          
          // Para mobile-menu-social, usar la estructura específica
          const mobileMenuHtml = `<div class="social-links">${socialHtml}</div>`;
          const mobileMenuElement = document.getElementById('mobile-menu-social');
          if (mobileMenuElement) {
            mobileMenuElement.innerHTML = mobileMenuHtml;
          }
        } else {

        }
      }
    } catch (error) {
      console.error('NewsHub: Error loading social networks:', error);
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
        // Solo actualizar el historial si hay datos nuevos
        if (songData.history && songData.history.length > 0) {
          this.updateRecentTracksFromSonicPanel(songData.history);
        }
      }
    } catch (error) {
      console.error('NewsHub: Error loading SonicPanel data:', error);
    }
  }

  updateCurrentSongDisplay(songData) {
    // Update player
    document.getElementById('player-song-title').textContent = songData.title || 'Radio News Hub';
    document.getElementById('player-song-artist').textContent = songData.artist || 'En Vivo';
    document.getElementById('player-listeners').textContent = songData.listeners || '0';
    document.getElementById('player-bitrate').textContent = songData.bitrate || 'N/A';
    
    // Update footer
    document.getElementById('footer-listeners').textContent = songData.listeners || '0';
    
    // Update artwork if available
    if (songData.art) {
      const playerArtwork = document.getElementById('player-artwork');
      if (playerArtwork) {
        playerArtwork.src = songData.art;
        playerArtwork.style.display = 'block';
      }
    }
  }

  updateStats(songData) {
    // Update sidebar stats
    document.getElementById('sidebar-listeners').textContent = songData.listeners || '0';
    document.getElementById('sidebar-songs').textContent = Math.floor(Math.random() * 50) + 20;
    document.getElementById('sidebar-quality').textContent = songData.bitrate ? `${songData.bitrate}k` : 'HD';
  }

  startSonicPanelUpdates() {
    // Update current song every 30 seconds
    this.sonicPanelInterval = setInterval(() => {
      this.loadSonicPanelData();
      this.loadRecentTracks(); // También actualizar el historial
    }, 30000);
  }

  formatTime(date) {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  updateRecentTracksFromSonicPanel(history) {
    const container = document.getElementById('recent-tracks');
    if (!container) return;
    
    const recentTracks = history.slice(0, 5).map((trackString, index) => {
      // Intentar separar artista y título si están separados por " - "
      const parts = trackString.split(' - ');
      let title, artist;
      
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        title = trackString.trim();
        artist = 'Artista desconocido';
      }
      
      // Generar tiempo aproximado (cada canción ~3-4 minutos atrás)
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
    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const mobileMenuSocial = document.querySelector('.mobile-menu-social');
    
    // IMPORTANT: Ensure menu starts closed on mobile
    if (navMenu) {
      navMenu.classList.remove('active');
    }
    if (menuToggle) {
      menuToggle.classList.remove('active');
    }
    if (mobileMenuSocial) {
      mobileMenuSocial.classList.remove('active');
    }
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
        
        // Close mobile menu after selection
        if (window.innerWidth <= 768) {
          if (navMenu) {
            navMenu.classList.remove('active');
          }
          if (menuToggle) {
            menuToggle.classList.remove('active');
          }
        }
      });
    });
    
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
          const header = document.querySelector('.news-header');
          const headerHeight = header ? header.offsetHeight : 169;
          
          // Force all styles via JavaScript with fixed position
          navMenu.style.cssText = `
            position: fixed !important;
            top: ${headerHeight}px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: #2c3e50 !important;
            display: block !important;
            height: auto !important;
            opacity: 1 !important;
            z-index: 999 !important;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
            overflow-y: auto !important;
            max-height: calc(100vh - ${headerHeight}px) !important;
            padding: 0 !important;
            margin: 0 !important;
            visibility: visible !important;
          `;
        }
      });
      
      // Close menu when clicking outside - with delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (navMenu.classList.contains('active') && 
              !navMenu.contains(e.target) && 
              !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
          }
        });
      }, 100);
      
      // Close menu on window resize if screen becomes large
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          navMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        }
      });
    } else {
      console.error('Template4: Menu toggle or nav menu not found!');
    }
  }

  setupAudioPlayer() {
    this.audioPlayer = document.getElementById('news-audio');
    
    // Play button
    document.getElementById('main-play-btn').addEventListener('click', () => {
      this.toggleAudio();
    });
    
    // Volume control
    document.querySelector('.volume-slider').addEventListener('input', (e) => {
      this.setVolume(e.target.value);
    });
    
    // Player toggle
    document.getElementById('player-toggle').addEventListener('click', () => {
      this.togglePlayer();
    });
    
    // Audio events
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('error', (e) => {
        console.error('NewsHub: Audio error:', e);
        this.handleAudioError();
      });
    }
  }

  setupCarousels() {
    // Initialize all Swiper carousels
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
    // Weekly day filters
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        this.showDayPrograms(day);
        
        // Update active button
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
        if (e.target.id === 'news-modal') {
          this.closeNewsModal();
        } else if (e.target.id === 'podcast-modal') {
          this.closePodcastModal();
        } else if (e.target.id === 'videocast-modal') {
          this.closeVideocastModal();
        }
      }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeNewsModal();
        this.closePodcastModal();
        this.closeVideocastModal();
      }
    });
  }

  setupAnimations() {
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
        disable: 'mobile' // Disable on mobile for better performance
      });
    }
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.news-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    this.currentSection = sectionName;
    
    // Refresh AOS animations
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }



  showDayPrograms(day) {
    // Hide all day programs
    document.querySelectorAll('.day-programs').forEach(dayProgram => {
      dayProgram.classList.remove('active');
    });
    
    // Show selected day programs
    const targetDay = document.getElementById(`${day}-programs`);
    if (targetDay) {
      targetDay.classList.add('active');
    }
    
    // Refresh AOS animations
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show target tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
    
    this.currentTab = tabName;
    
    // Refresh AOS animations
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  toggleAudio() {
    if (!this.audioPlayer || !this.streamUrl) {
      console.error('NewsHub: Audio player or stream URL not available');
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
    }).catch(error => {
      console.error('NewsHub: Error playing audio:', error);
      this.handleAudioError();
    });
  }

  pauseAudio() {
    if (!this.audioPlayer) return;
    
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.updatePlayButton(false);
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
  }



  // Modal methods
  openNewsModal(index) {
    const newsData = this.featuredNewsData || this.allNewsData;
    if (!newsData || !newsData[index]) {
      console.error('News data not found for index:', index);
      return;
    }

    const article = newsData[index];
    const modal = document.getElementById('news-modal');
    
    if (!modal) {
      console.error('News modal not found');
      return;
    }

    // Update modal content
    document.getElementById('news-modal-title').textContent = article.name;
    document.getElementById('news-modal-date').innerHTML = `<i class="fas fa-calendar"></i> ${new Date(article.createdAt).toLocaleDateString()}`;
    
    if (article.author) {
      document.getElementById('news-modal-author').innerHTML = `<i class="fas fa-user"></i> ${article.author}`;
      document.getElementById('news-modal-author').style.display = 'block';
    } else {
      document.getElementById('news-modal-author').style.display = 'none';
    }

    if (article.imageUrl) {
      document.getElementById('news-modal-image').src = `https://dashboard.ipstream.cl${article.imageUrl}`;
      document.getElementById('news-modal-image').style.display = 'block';
    } else {
      document.getElementById('news-modal-image').style.display = 'none';
    }

    document.getElementById('news-modal-content').innerHTML = article.content || article.shortText || 'Sin contenido disponible';

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  openAllNewsModal(index) {
    this.openNewsModal(index);
  }

  closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  openPodcastModal(index) {
    if (!this.podcastsData || !this.podcastsData[index]) {
      console.error('Podcast data not found for index:', index);
      return;
    }

    const podcast = this.podcastsData[index];
    const modal = document.getElementById('podcast-modal');
    
    if (!modal) {
      console.error('Podcast modal not found');
      return;
    }

    // Update modal content
    document.getElementById('podcast-modal-title').textContent = podcast.title || podcast.name;
    document.getElementById('podcast-modal-episode').textContent = `Episodio #${podcast.episodeNumber || 'N/A'}`;
    document.getElementById('podcast-modal-description').textContent = podcast.description || 'Sin descripción disponible';
    
    if (podcast.duration) {
      document.getElementById('podcast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${podcast.duration}`;
    }

    if (podcast.imageUrl) {
      document.getElementById('podcast-modal-image').src = `https://dashboard.ipstream.cl${podcast.imageUrl}`;
      document.getElementById('podcast-modal-image').style.display = 'block';
    } else {
      document.getElementById('podcast-modal-image').style.display = 'none';
    }

    // Setup audio player
    const audioPlayer = document.getElementById('podcast-audio');
    if (podcast.audioUrl) {
      audioPlayer.src = `https://dashboard.ipstream.cl${podcast.audioUrl}`;
      audioPlayer.style.display = 'block';
    } else {
      audioPlayer.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closePodcastModal() {
    const modal = document.getElementById('podcast-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Pause audio if playing
      const audio = document.getElementById('podcast-audio');
      if (audio) {
        audio.pause();
      }
    }
  }

  openVideocastModal(index) {
    if (!this.videocastsData || !this.videocastsData[index]) {
      console.error('Videocast data not found for index:', index);
      return;
    }

    const videocast = this.videocastsData[index];
    const modal = document.getElementById('videocast-modal');
    
    if (!modal) {
      console.error('Videocast modal not found');
      return;
    }

    // Update modal content
    document.getElementById('videocast-modal-title').textContent = videocast.title || videocast.name;
    document.getElementById('videocast-modal-episode').textContent = `Episodio #${videocast.episodeNumber || 'N/A'}`;
    document.getElementById('videocast-modal-description').textContent = videocast.description || 'Sin descripción disponible';
    
    if (videocast.duration) {
      document.getElementById('videocast-modal-duration').innerHTML = `<i class="fas fa-clock"></i> ${videocast.duration}`;
    }

    // Setup video player
    const videoContainer = document.getElementById('videocast-container');
    if (videocast.videoUrl) {
      const embedUrl = this.getEmbedUrl(videocast.videoUrl);
      
      if (embedUrl) {
        videoContainer.innerHTML = `
          <iframe 
            src="${embedUrl}" 
            title="${videocast.title || videocast.name}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            style="width: 100%; height: 400px; border-radius: 8px;">
          </iframe>
        `;
      } else {
        videoContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #1a1a1a; color: white; border-radius: 8px;">
            <div style="text-align: center;">
              <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <p>No se puede reproducir este video</p>
              <a href="${videocast.videoUrl}" target="_blank" style="color: #1db954; text-decoration: none; margin-top: 1rem; display: inline-block;">
                Ver en sitio original
              </a>
            </div>
          </div>
        `;
      }
    } else {
      videoContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">No hay video disponible</p>';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Clear video container to stop playback
      document.getElementById('videocast-container').innerHTML = '';
    }
  }

  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  // Legacy methods for backward compatibility
  viewNews(slug) {
    console.log('NewsHub: Legacy viewNews called with slug:', slug);
    // This method is kept for backward compatibility but should use modal instead
  }

  playPodcast(audioUrl) {
    console.log('NewsHub: Legacy playPodcast called with audioUrl:', audioUrl);
    // This method is kept for backward compatibility but should use modal instead
  }

  playVideocast(videoUrl) {
    console.log('NewsHub: Legacy playVideocast called with videoUrl:', videoUrl);
    // This method is kept for backward compatibility but should use modal instead
  }
  
  playLiveProgram(programId) {
    console.log('NewsHub: Playing live program:', programId);
    // Si hay un stream URL disponible, reproducir la radio
    if (this.streamUrl) {
      this.playAudio();
    } else {
      console.warn('NewsHub: No stream URL available for live program');
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

// Initialize the news hub when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.newsHub = new NewsHub();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.newsHub) {
    window.newsHub.destroy();
  }
});