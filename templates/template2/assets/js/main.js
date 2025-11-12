import { 
  getBasicData, 
  buildImageUrl, 
  getPrograms, 
  getNews, 
  getVideos, 
  getPodcasts, 
  getVideocasts, 
  getSponsors, 
  getPromotions, 
  getSocialNetworks,
  getCurrentSong
} from '/assets/js/api.js';

class RadioLanding {
  constructor() {
    this.audioPlayer = null;
    this.isPlaying = false;
    this.currentPage = {
      news: 1,
      podcasts: 1,
      videocasts: 1
    };
    this.sonicPanelInterval = null;
    this.currentSongData = null;
    this.intersectionObserver = null;
    this.floatingBtn = null;
    
    this.init();
  }

  async init() {
    // Loading is now managed by loading-manager.js
    
    try {
      await this.loadBasicData();
      await this.loadAllContent();
      await this.loadVideos(); // Load videos for ranking section
      this.setupNavigation();
      this.setupAudioPlayer();
      this.setupMultimediaTabs();
      this.setupIntersectionObserver();
      this.setupFloatingPlayButton();
      this.setupScrollIndicator();
      this.setupRippleEffects();
      await this.loadSonicPanelData();
      this.startSonicPanelUpdates();
    } catch (error) {
      console.error('Error initializing landing page:', error);
      this.showToast('Error cargando la página', 'error');
    }
    
    // Fallback de emergencia: ocultar loading después de 8 segundos si aún está visible
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay && overlay.classList.contains('active')) {
        console.log('Template2: Fallback - Ocultando loading');
        if (window.loadingManager) {
          window.loadingManager.forceHide();
        } else {
          overlay.classList.remove('active');
        }
      }
    }, 8000);
  }

  showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
  }

  hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
  }

  async loadBasicData() {
    try {
      const data = await getBasicData();
      const logoUrl = await buildImageUrl(data.logoUrl);
      
      // Update navigation
      document.getElementById('nav-logo').src = logoUrl;
      document.getElementById('nav-logo').style.display = 'block';
      
      // Update hero section
      document.getElementById('hero-title').textContent = data.projectName;
      document.getElementById('hero-description').textContent = data.projectDescription;
      
      // Update footer
      document.getElementById('footer-logo').src = logoUrl;
      document.getElementById('footer-logo').style.display = 'block';
      
      // Store streaming URL
      this.streamUrl = data.radioStreamingUrl;
      
      // Load social networks
      await this.loadSocialNetworks();
      
    } catch (error) {
      console.error('Error loading basic data:', error);
    }
  }

  async loadAllContent() {
    // Load all content in parallel
    await Promise.all([
      this.loadPrograms(),
      this.loadNews(),
      this.loadPodcasts(),
      this.loadVideocasts(),
      this.loadSponsors(),
      this.loadPromotions()
    ]);
  }

  async loadPrograms() {
    try {
      const programs = await getPrograms();
      
      if (programs && programs.length > 0) {
        // Group programs by day
        const programsByDay = this.groupProgramsByDay(programs);
        
        // Load programs for each day
        this.loadProgramsForAllDays(programsByDay);
        
        // Setup tabs functionality
        this.setupProgramsTabs();
        
        // Set current day as active
        this.setCurrentDayActive();
        
        // Footer programs section removed - now using social networks instead
        
      } else {
        this.showNoProgramsMessage();
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      this.showProgramsError();
    }
  }

  groupProgramsByDay(programs) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const programsByDay = {};
    
    days.forEach(day => {
      programsByDay[day] = programs.filter(program => 
        program.weekDays && program.weekDays.includes(day)
      );
    });
    
    return programsByDay;
  }

  loadProgramsForAllDays(programsByDay) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const container = document.querySelector(`#${day}-programs .programs-timeline`);
      const dayPrograms = programsByDay[day];
      
      if (dayPrograms && dayPrograms.length > 0) {
        const html = dayPrograms.map(program => `
          <div class="program-card">
            ${program.imageUrl ? `<img src="https://dashboard.ipstream.cl${program.imageUrl}" alt="${program.name}">` : ''}
            <h3>${program.name}</h3>
            <p>${program.description || 'Sin descripción disponible'}</p>
            <div class="program-schedule">
              <span><i class="fas fa-clock"></i> ${program.startTime} - ${program.endTime}</span>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>No hay programas para este día</p>';
      }
    });
  }

  setupProgramsTabs() {
    document.querySelectorAll('.programs-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        this.showProgramsDay(day);
        
        // Update active tab
        document.querySelectorAll('.programs-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  showProgramsDay(day) {
    // Hide all day contents
    document.querySelectorAll('.programs-day-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Show selected day content
    document.getElementById(`${day}-programs`).classList.add('active');
  }

  setCurrentDayActive() {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];
    
    // Set active tab
    document.querySelector(`[data-day="${currentDay}"]`).classList.add('active');
    
    // Show current day programs
    this.showProgramsDay(currentDay);
  }

  showNoProgramsMessage() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const container = document.querySelector(`#${day}-programs .programs-timeline`);
      container.innerHTML = '<p>No hay programas disponibles</p>';
    });
  }

  showProgramsError() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const container = document.querySelector(`#${day}-programs .programs-timeline`);
      container.innerHTML = '<p>Error cargando programas</p>';
    });
  }

  async loadNews(page = 1) {
    const container = document.getElementById('news-grid');
    
    // Show skeleton loader for any page change
    this.createSkeletonLoader(container, 3);
    
    try {
      const news = await getNews(page, 3);
      
      if (news && news.data && news.data.length > 0) {
        // Always replace current news data with new page data
        this.currentNewsData = news.data;
        this.currentNewsPage = page;
        this.newsPagination = news.pagination;
        
        // Create a complete news data map for modal (all pages loaded so far)
        if (!this.allNewsData) {
          this.allNewsData = new Map();
        }
        
        // Store current page data in the map
        news.data.forEach((article, index) => {
          const globalIndex = (page - 1) * 3 + index;
          this.allNewsData.set(globalIndex, article);
        });
        
        const html = news.data.map((article, index) => {
          const globalIndex = (page - 1) * 3 + index;
          return `
            <article class="news-card">
              ${article.imageUrl ? `<img src="https://dashboard.ipstream.cl${article.imageUrl}" alt="${article.name}">` : ''}
              <div class="news-card-content">
                <h3>${article.name}</h3>
                <p>${article.shortText || 'Sin resumen disponible'}</p>
                <div class="news-card-footer">
                  <div class="news-card-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button class="read-more-btn" onclick="landing.openNewsModal(${globalIndex})">
                    <i class="fas fa-book-open"></i>
                    Leer más
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join('');
        
        // Always replace content
        container.innerHTML = html;
        
        // Setup modal functionality only once
        if (page === 1) {
          this.setupNewsModal();
        }
        
        // Update pagination
        this.updateNewsPagination(news.pagination);
        
      } else {
        container.innerHTML = '<p>No hay noticias disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading news:', error);
      container.innerHTML = '<p>Error cargando noticias</p>';
      this.showToast('Error cargando noticias', 'error');
    }
  }

  updateNewsPagination(pagination) {
    const paginationContainer = document.getElementById('news-pagination');
    
    if (!pagination || pagination.pages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    let paginationHtml = '<div class="pagination-info">';
    paginationHtml += `<span>Página ${currentPage} de ${totalPages}</span>`;
    paginationHtml += '</div><div class="pagination-buttons">';
    
    // Previous button
    if (currentPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToNewsPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
        <span>Anterior</span>
      </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToNewsPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? 'active' : '';
      paginationHtml += `<button class="pagination-btn ${activeClass}" onclick="landing.goToNewsPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToNewsPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToNewsPage(${currentPage + 1})">
        <span>Siguiente</span>
        <i class="fas fa-chevron-right"></i>
      </button>`;
    }
    
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
    paginationContainer.style.display = 'flex';
  }

  goToNewsPage(page) {
    // Scroll to news section
    this.scrollToSection('news');
    
    // Small delay to ensure smooth scroll, then load news
    setTimeout(() => {
      this.loadNews(page);
    }, 300);
  }

  async loadVideos() {
    try {
      const videos = await getVideos();
      const container = document.getElementById('videos-content');
      
      if (videos && videos.length > 0) {
        // Store videos data for modal
        this.videosData = videos;
        
        // Separate top 3 and rest
        const topThree = videos.slice(0, 3);
        const restVideos = videos.slice(3);
        
        const html = `
          <div class="ranking-container">
            <!-- Top 3 Podium -->
            <div class="ranking-podium">
              ${topThree.map((video, index) => {
                const position = video.order || index + 1;
                const podiumClass = position === 1 ? 'first' : position === 2 ? 'second' : 'third';
                return `
                  <div class="podium-item ${podiumClass}" onclick="landing.openVideoModal(${index})">
                    <div class="podium-rank">
                      <div class="rank-number">${position}</div>
                      <div class="rank-crown ${position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze'}">
                        <i class="fas fa-crown"></i>
                      </div>
                    </div>
                    <div class="podium-thumbnail" id="podium-thumbnail-${index}">
                      <div class="podium-overlay">
                        <div class="podium-play-btn">
                          <i class="fas fa-play"></i>
                        </div>
                      </div>
                    </div>
                    <div class="podium-info">
                      <h3>${video.name}</h3>
                      <div class="podium-stats">
                        <span><i class="fas fa-trophy"></i> Top ${position}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            
            <!-- Rest of Rankings -->
            ${restVideos.length > 0 ? `
              <div class="ranking-list">
                <h3 class="ranking-list-title">
                  <i class="fas fa-list-ol"></i>
                  Resto del Ranking
                </h3>
                <div class="ranking-items">
                  ${restVideos.map((video, index) => {
                    const globalIndex = index + 3;
                    const position = video.order || globalIndex + 1;
                    return `
                      <div class="ranking-item" onclick="landing.openVideoModal(${globalIndex})">
                        <div class="ranking-position">
                          <span class="position-number">${position}</span>
                        </div>
                        <div class="ranking-thumbnail" id="ranking-thumbnail-${globalIndex}">
                          <div class="ranking-overlay">
                            <i class="fas fa-play"></i>
                          </div>
                        </div>
                        <div class="ranking-details">
                          <h4>${video.name}</h4>
                          <p>${video.description || 'Sin descripción disponible'}</p>
                        </div>
                        <div class="ranking-action">
                          <button class="ranking-play-btn">
                            <i class="fas fa-play"></i>
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
        
        container.innerHTML = html;
        
        // Load thumbnails after DOM is ready
        this.loadVideoThumbnails(videos);
        
        // Setup video modal functionality
        this.setupVideoModal();
        
      } else {
        container.innerHTML = '<p>No hay videos disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      document.getElementById('videos-content').innerHTML = '<p>Error cargando videos</p>';
    }
  }

  async loadPodcasts(page = 1) {
    const container = document.getElementById('podcasts-content');
    
    // Show skeleton on page changes
    if (page === 1) {
      this.createSkeletonLoader(container, 3);
    }
    
    try {
      const podcasts = await getPodcasts(page, 3);
      
      if (podcasts && podcasts.data && podcasts.data.length > 0) {
        // Store podcasts data for modal
        this.currentPodcastsData = podcasts.data;
        this.currentPodcastsPage = page;
        this.podcastsPagination = podcasts.pagination;
        
        const html = `
          <div class="multimedia-grid">
            ${podcasts.data.map((podcast, index) => `
              <div class="podcast-card">
                <div class="podcast-image">
                  ${podcast.imageUrl ? `<img src="https://dashboard.ipstream.cl${podcast.imageUrl}" alt="${podcast.title}">` : '<div class="default-podcast-image"><i class="fas fa-podcast"></i></div>'}
                </div>
                <div class="podcast-info">
                  <h3>${podcast.title}</h3>
                  <button class="podcast-btn" onclick="landing.openPodcastModal(${index})">
                    <i class="fas fa-headphones"></i>
                    Escuchar
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="podcasts-pagination" id="podcasts-pagination" style="display: none;">
            <!-- Pagination will be loaded here -->
          </div>
        `;
        
        container.innerHTML = html;
        
        // Setup podcast modal functionality
        this.setupPodcastModal();
        
        // Update pagination
        this.updatePodcastsPagination(podcasts.pagination);
        
      } else {
        container.innerHTML = '<p>No hay podcasts disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading podcasts:', error);
      container.innerHTML = '<p>Error cargando podcasts</p>';
    }
  }

  async loadVideocasts(page = 1) {
    const container = document.getElementById('videocasts-content');
    
    // Show skeleton on page changes
    if (page === 1) {
      this.createSkeletonLoader(container, 3);
    }
    
    try {
      const videocasts = await getVideocasts(page, 3);
      
      if (videocasts && videocasts.data && videocasts.data.length > 0) {
        // Store videocasts data for modal
        this.currentVideocastsData = videocasts.data;
        this.currentVideocastsPage = page;
        this.videocastsPagination = videocasts.pagination;
        
        const html = `
          <div class="multimedia-grid">
            ${videocasts.data.map((videocast, index) => `
              <div class="videocast-card">
                <div class="videocast-image">
                  ${videocast.imageUrl ? `<img src="https://dashboard.ipstream.cl${videocast.imageUrl}" alt="${videocast.title}">` : '<div class="default-videocast-image"><i class="fas fa-video"></i></div>'}
                </div>
                <div class="videocast-info">
                  <h3>${videocast.title}</h3>
                  <button class="videocast-btn" onclick="landing.openVideocastModal(${index})">
                    <i class="fas fa-play"></i>
                    Ver Video
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="videocasts-pagination" id="videocasts-pagination" style="display: none;">
            <!-- Pagination will be loaded here -->
          </div>
        `;
        
        container.innerHTML = html;
        
        // Setup videocast modal functionality
        this.setupVideocastModal();
        
        // Update pagination
        this.updateVideocastsPagination(videocasts.pagination);
        
      } else {
        container.innerHTML = '<p>No hay videocasts disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading videocasts:', error);
      container.innerHTML = '<p>Error cargando videocasts</p>';
    }
  }

  async loadSponsors() {
    try {
      const sponsors = await getSponsors();
      const container = document.getElementById('sponsors-grid');
      
      if (sponsors && sponsors.length > 0) {
        const html = sponsors.map(sponsor => `
          <div class="sponsor-card">
            ${sponsor.logoUrl ? `<img src="https://dashboard.ipstream.cl${sponsor.logoUrl}" alt="${sponsor.name}">` : ''}
            <h3>${sponsor.name}</h3>
            <p>${sponsor.description || 'Sin descripción disponible'}</p>
            ${sponsor.address ? `<p style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin: 0.5rem 0;"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</p>` : ''}
            <div style="margin-top: 1rem;">
              ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" style="color: #d1d5db; text-decoration: none; font-weight: 500;">Visitar Sitio <i class="fas fa-external-link-alt"></i></a>` : ''}
            </div>
            <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
              ${sponsor.facebook ? `<a href="${sponsor.facebook}" target="_blank" class="social-link" title="Facebook"><i class="fab fa-facebook"></i></a>` : ''}
              ${sponsor.instagram ? `<a href="${sponsor.instagram}" target="_blank" class="social-link" title="Instagram"><i class="fab fa-instagram"></i></a>` : ''}
              ${sponsor.youtube ? `<a href="${sponsor.youtube}" target="_blank" class="social-link" title="YouTube"><i class="fab fa-youtube"></i></a>` : ''}
              ${sponsor.tiktok ? `<a href="${sponsor.tiktok}" target="_blank" class="social-link" title="TikTok"><i class="fab fa-tiktok"></i></a>` : ''}
              ${sponsor.x ? `<a href="${sponsor.x}" target="_blank" class="social-link" title="X (Twitter)"><i class="fab fa-x-twitter"></i></a>` : ''}
              ${sponsor.whatsapp ? `<a href="${sponsor.whatsapp}" target="_blank" class="social-link" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>` : ''}
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>No hay patrocinadores disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading sponsors:', error);
      document.getElementById('sponsors-grid').innerHTML = '<p>Error cargando patrocinadores</p>';
    }
  }

  async loadPromotions() {
    try {
      const promotions = await getPromotions();
      const container = document.getElementById('anuncios-grid');
      
      if (promotions && promotions.length > 0) {
        // Store promotions data for modal and limit to 3
        this.anunciosData = promotions.slice(0, 3);
        
        const html = this.anunciosData.map((promotion, index) => `
          <div class="anuncio-card">
            <div class="anuncio-image">
              ${promotion.imageUrl ? `<img src="https://dashboard.ipstream.cl${promotion.imageUrl}" alt="${promotion.title}">` : '<div class="default-anuncio-image"><i class="fas fa-bullhorn"></i></div>'}
            </div>
            <div class="anuncio-content">
              <h3>${promotion.title}</h3>
              <p>${this.truncateText(promotion.description || 'Sin descripción disponible', 20)}</p>
              <button class="anuncio-btn" onclick="landing.openAnuncioModal(${index})">
                <i class="fas fa-eye"></i>
                Ver Anuncio
              </button>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Setup anuncio modal functionality
        this.setupAnuncioModal();
        
      } else {
        container.innerHTML = '<p>No hay anuncios disponibles</p>';
      }
    } catch (error) {
      console.error('Error loading anuncios:', error);
      document.getElementById('anuncios-grid').innerHTML = '<p>Error cargando anuncios</p>';
    }
  }

  truncateText(text, wordLimit) {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  }

  async loadSocialNetworks() {
    try {
      const social = await getSocialNetworks();
      console.log('Social networks data:', social);
      
      if (social) {
        const networks = [
          { key: 'facebook', icon: 'fab fa-facebook', url: social.facebook },
          { key: 'instagram', icon: 'fab fa-instagram', url: social.instagram },
          { key: 'youtube', icon: 'fab fa-youtube', url: social.youtube },
          { key: 'tiktok', icon: 'fab fa-tiktok', url: social.tiktok },
          { key: 'x', icon: 'fab fa-x-twitter', url: social.x },
          { key: 'whatsapp', icon: 'fab fa-whatsapp', url: social.whatsapp }
        ];
        
        // Footer social links removed - only using footer-social-networks section
        
        // Footer social networks section - same logic as hero
        const footerNetworksHtml = networks
          .filter(network => network.url)
          .map(network => {
            const networkNames = {
              'facebook': 'Facebook',
              'instagram': 'Instagram', 
              'youtube': 'YouTube',
              'tiktok': 'TikTok',
              'x': 'X (Twitter)',
              'whatsapp': 'WhatsApp'
            };
            return `
              <a href="${network.url}" target="_blank" class="footer-social-item">
                <i class="${network.icon}"></i>
                <span>${networkNames[network.key]}</span>
              </a>
            `;
          }).join('');
        
        document.getElementById('footer-social-networks').innerHTML = footerNetworksHtml;
        
        // Hero social links
        const heroHtml = networks
          .filter(network => network.url)
          .map(network => `
            <a href="${network.url}" target="_blank" class="hero-social-link ${network.key}">
              <i class="${network.icon}"></i>
            </a>
          `).join('');
        
        document.getElementById('hero-social-links').innerHTML = heroHtml;
      }
    } catch (error) {
      console.error('Error loading social networks:', error);
    }
  }

  async loadSonicPanelData() {
    try {
      const songData = await getCurrentSong();
      this.currentSongData = songData;
      this.updateHeroPlayer(songData);
    } catch (error) {
      console.error('Error loading SonicPanel data:', error);
      this.updateHeroPlayer({
        title: 'Radio en Vivo',
        art: null,
        listeners: 0,
        uniqueListeners: 0,
        bitrate: 'N/A',
        djUsername: null,
        djProfile: null
      });
    }
  }

  updateHeroPlayer(songData) {
    // Update cover info
    document.getElementById('hero-song-title').textContent = songData.title;
    document.getElementById('hero-song-listeners').textContent = `${songData.listeners} oyentes`;
    
    // Update cover image
    const coverImg = document.getElementById('hero-cover-image');
    const defaultCover = document.querySelector('.default-cover');
    
    if (songData.art) {
      coverImg.src = songData.art;
      coverImg.style.display = 'block';
      defaultCover.style.display = 'none';
    } else {
      coverImg.style.display = 'none';
      defaultCover.style.display = 'flex';
    }

    // Update hero background with cover art
    this.updateHeroBackground(songData.art);

    // Update DJ info
    const djInfo = document.getElementById('hero-dj-info');
    if (songData.djUsername) {
      djInfo.innerHTML = `DJ: <strong>${songData.djUsername}</strong>`;
      djInfo.style.display = 'block';
    } else {
      djInfo.style.display = 'none';
    }
  }

  updateHeroBackground(coverArt) {
    const heroCoverBg = document.getElementById('hero-cover-bg');
    const heroOverlay = document.querySelector('.hero-overlay');
    const heroSection = document.getElementById('hero');
    
    if (coverArt) {
      // Preload the image to ensure smooth transition
      const img = new Image();
      img.onload = () => {
        heroCoverBg.style.backgroundImage = `url(${coverArt})`;
        heroCoverBg.classList.add('loaded');
        heroOverlay.classList.add('with-cover');
        heroSection.classList.add('with-cover');
      };
      img.onerror = () => {
        // If image fails to load, remove background
        heroCoverBg.style.backgroundImage = '';
        heroCoverBg.classList.remove('loaded');
        heroOverlay.classList.remove('with-cover');
        heroSection.classList.remove('with-cover');
      };
      img.src = coverArt;
    } else {
      // No cover art, remove background
      heroCoverBg.style.backgroundImage = '';
      heroCoverBg.classList.remove('loaded');
      heroOverlay.classList.remove('with-cover');
      heroSection.classList.remove('with-cover');
    }
  }

  startSonicPanelUpdates() {
    // Update every 30 seconds
    this.sonicPanelInterval = setInterval(async () => {
      try {
        const songData = await getCurrentSong();
        
        // Only update if the song has changed
        if (!this.currentSongData || this.currentSongData.title !== songData.title || this.currentSongData.art !== songData.art) {
          this.currentSongData = songData;
          this.updateHeroPlayer(songData);
        } else {
          // Just update listener count in cover
          document.getElementById('hero-song-listeners').textContent = `${songData.listeners} oyentes`;
        }
      } catch (error) {
        console.error('Error updating SonicPanel data:', error);
      }
    }, 30000);
  }

  setupNavigation() {
    // Smooth scroll navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        this.scrollToSection(targetId);
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-active');
      mobileToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('mobile-active');
        mobileToggle.classList.remove('active');
      }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-active');
        mobileToggle.classList.remove('active');
      });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 0.98)';
      } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
      }
    });
  }

  setupAudioPlayer() {
    // All play buttons
    const playButtons = [
      'hero-play-btn', 
      'hero-control-play',
      'footer-play-btn'
    ];

    playButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => {
          if (this.isPlaying) {
            this.stopAudio();
          } else {
            this.playAudio();
          }
        });
      }
    });

    // Volume control
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        if (this.audioPlayer) {
          this.audioPlayer.volume = volume;
        }
      });
    }
  }

  setupMultimediaTabs() {
    document.querySelectorAll('.multimedia-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.multimedia-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.multimedia-content .tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
      });
    });
  }

  playAudio() {
    if (this.streamUrl) {
      if (!this.audioPlayer) {
        this.audioPlayer = new Audio(this.streamUrl);
        this.audioPlayer.volume = document.querySelector('.volume-slider')?.value / 100 || 0.5;
      }
      
      this.audioPlayer.play().then(() => {
        this.isPlaying = true;
        this.updatePlayButtons(true);
        this.showToast('Reproduciendo radio en vivo', 'success');
      }).catch(error => {
        console.error('Error playing audio:', error);
        this.showToast('Error al reproducir audio', 'error');
      });
    }
  }

  stopAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      this.updatePlayButtons(false);
      this.showToast('Reproducción pausada', 'info');
    }
  }

  updatePlayButtons(isPlaying) {
    const playButtons = document.querySelectorAll('[id$="play-btn"], [id$="control-play"]');
    playButtons.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
      }
    });
    
    // Update floating button
    if (this.floatingBtn) {
      const floatingIcon = this.floatingBtn.querySelector('i');
      if (floatingIcon) {
        floatingIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
      }
    }
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offsetTop = section.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  formatWeekDays(days) {
    if (!days || !Array.isArray(days)) return 'No especificado';
    
    const dayNames = {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mié',
      thursday: 'Jue',
      friday: 'Vie',
      saturday: 'Sáb',
      sunday: 'Dom'
    };
    
    return days.map(day => dayNames[day] || day).join(', ');
  }

  viewNews(slug) {
    // This could open a modal or navigate to a detailed view
    console.log('View news:', slug);
  }

  // Modern UI Enhancements
  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    // Observe elements for animations
    document.querySelectorAll('.section-header, .program-card, .news-card, .media-card, .sponsor-card, .promotion-card').forEach(el => {
      el.classList.add('fade-in');
      this.intersectionObserver.observe(el);
    });
  }

  setupFloatingPlayButton() {
    // Create floating play button for mobile
    this.floatingBtn = document.createElement('button');
    this.floatingBtn.className = 'floating-play-btn';
    this.floatingBtn.innerHTML = '<i class="fas fa-play"></i>';
    this.floatingBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stopAudio();
      } else {
        this.playAudio();
      }
    });
    document.body.appendChild(this.floatingBtn);

    // Show/hide based on scroll position
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const heroHeight = document.querySelector('.hero').offsetHeight;
      
      if (currentScrollY > heroHeight && window.innerWidth <= 768) {
        this.floatingBtn.classList.add('show');
      } else {
        this.floatingBtn.classList.remove('show');
      }
      
      lastScrollY = currentScrollY;
    });
  }

  setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', () => {
        this.scrollToSection('programs');
      });
    }
  }

  setupRippleEffects() {
    document.querySelectorAll('.modern-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ripple = btn.querySelector('.btn-ripple');
        if (ripple) {
          ripple.style.width = '0';
          ripple.style.height = '0';
          
          setTimeout(() => {
            ripple.style.width = '300px';
            ripple.style.height = '300px';
          }, 10);
        }
      });
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  createSkeletonLoader(container, count = 3) {
    const skeletons = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text medium"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `).join('');
    
    container.innerHTML = skeletons;
  }

  // Enhanced audio player with progress tracking
  setupAudioProgress() {
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('timeupdate', () => {
        // This would work for regular audio files, not live streams
        // Live streams don't have duration/currentTime
      });
    }
  }

  // News Modal Functions
  setupNewsModal() {
    const modal = document.getElementById('news-modal');
    const closeBtn = document.getElementById('news-modal-close');
    
    // Close modal on close button click
    closeBtn.addEventListener('click', () => {
      this.closeNewsModal();
    });
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeNewsModal();
      }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeNewsModal();
      }
    });
  }

  openNewsModal(newsIndex) {
    // First try to get from allNewsData map, then fallback to current page data
    let article = null;
    
    if (this.allNewsData && this.allNewsData.has(newsIndex)) {
      article = this.allNewsData.get(newsIndex);
    } else if (this.currentNewsData) {
      // Calculate local index for current page
      const currentPageStart = (this.currentNewsPage - 1) * 3;
      const localIndex = newsIndex - currentPageStart;
      if (localIndex >= 0 && localIndex < this.currentNewsData.length) {
        article = this.currentNewsData[localIndex];
      }
    }
    
    if (!article) {
      this.showToast('Error cargando la noticia', 'error');
      return;
    }
    const modal = document.getElementById('news-modal');
    
    // Populate modal content
    document.getElementById('news-modal-title').textContent = article.name;
    document.getElementById('news-modal-date').querySelector('span').textContent = 
      new Date(article.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    // Set image
    const modalImage = document.getElementById('news-modal-image');
    if (article.imageUrl) {
      modalImage.src = `https://dashboard.ipstream.cl${article.imageUrl}`;
      modalImage.alt = article.name;
      modalImage.style.display = 'block';
    } else {
      modalImage.style.display = 'none';
    }
    
    // Set content
    const contentDiv = document.getElementById('news-modal-content');
    if (article.content) {
      // If there's full content, use it
      contentDiv.innerHTML = article.content;
    } else if (article.longText) {
      // If there's long text, use it with paragraphs
      const paragraphs = article.longText.split('\n').filter(p => p.trim());
      contentDiv.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    } else {
      // Fallback to short text
      contentDiv.innerHTML = `<p>${article.shortText || 'Contenido no disponible'}</p>`;
    }
    
    // Show author if available
    const authorElement = document.getElementById('news-modal-author');
    if (article.author) {
      authorElement.querySelector('span').textContent = article.author;
      authorElement.style.display = 'block';
    } else {
      authorElement.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeNewsModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  viewNews(slug) {
    // Legacy function - find news by slug and open modal
    // Search in all loaded news data
    if (this.allNewsData) {
      for (let [index, article] of this.allNewsData) {
        if (article.slug === slug) {
          this.openNewsModal(index);
          return;
        }
      }
    }
    
    // Fallback to current page data
    if (this.currentNewsData) {
      const localIndex = this.currentNewsData.findIndex(article => article.slug === slug);
      if (localIndex !== -1) {
        const globalIndex = (this.currentNewsPage - 1) * 3 + localIndex;
        this.openNewsModal(globalIndex);
        return;
      }
    }
    
    this.showToast('Noticia no encontrada', 'error');
  }

  // Podcast Functions
  updatePodcastsPagination(pagination) {
    const paginationContainer = document.getElementById('podcasts-pagination');
    
    if (!pagination || pagination.pages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    let paginationHtml = '<div class="pagination-info">';
    paginationHtml += `<span>Página ${currentPage} de ${totalPages}</span>`;
    paginationHtml += '</div><div class="pagination-buttons">';
    
    // Previous button
    if (currentPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToPodcastsPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
        <span>Anterior</span>
      </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToPodcastsPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? 'active' : '';
      paginationHtml += `<button class="pagination-btn ${activeClass}" onclick="landing.goToPodcastsPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToPodcastsPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToPodcastsPage(${currentPage + 1})">
        <span>Siguiente</span>
        <i class="fas fa-chevron-right"></i>
      </button>`;
    }
    
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
    paginationContainer.style.display = 'flex';
  }

  goToPodcastsPage(page) {
    this.scrollToSection('multimedia');
    setTimeout(() => {
      this.loadPodcasts(page);
    }, 300);
  }

  setupPodcastModal() {
    const modal = document.getElementById('podcast-modal');
    const closeBtn = document.getElementById('podcast-modal-close');
    
    closeBtn.addEventListener('click', () => {
      this.closePodcastModal();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closePodcastModal();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closePodcastModal();
      }
    });
  }

  openPodcastModal(podcastIndex) {
    if (!this.currentPodcastsData || !this.currentPodcastsData[podcastIndex]) {
      this.showToast('Error cargando el podcast', 'error');
      return;
    }
    
    const podcast = this.currentPodcastsData[podcastIndex];
    const modal = document.getElementById('podcast-modal');
    
    // Populate modal content
    document.getElementById('podcast-modal-title').textContent = podcast.title;
    document.getElementById('podcast-modal-episode').textContent = `Episodio #${podcast.episodeNumber || podcastIndex + 1}`;
    document.getElementById('podcast-modal-description').textContent = podcast.description || 'Sin descripción disponible';
    document.getElementById('podcast-modal-duration').querySelector('span').textContent = podcast.duration || 'N/A';
    
    // Set image
    const modalImage = document.getElementById('podcast-modal-image');
    if (podcast.imageUrl) {
      modalImage.src = `https://dashboard.ipstream.cl${podcast.imageUrl}`;
      modalImage.alt = podcast.title;
      modalImage.style.display = 'block';
    } else {
      modalImage.style.display = 'none';
    }
    
    // Set audio
    const audioElement = document.getElementById('podcast-audio');
    if (podcast.audioUrl) {
      audioElement.innerHTML = `<source src="https://dashboard.ipstream.cl${podcast.audioUrl}" type="audio/mpeg">`;
      audioElement.load();
    } else {
      audioElement.innerHTML = '';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closePodcastModal() {
    const modal = document.getElementById('podcast-modal');
    const audioElement = document.getElementById('podcast-audio');
    
    // Pause audio
    audioElement.pause();
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Videocast Functions
  updateVideocastsPagination(pagination) {
    const paginationContainer = document.getElementById('videocasts-pagination');
    
    if (!pagination || pagination.pages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    let paginationHtml = '<div class="pagination-info">';
    paginationHtml += `<span>Página ${currentPage} de ${totalPages}</span>`;
    paginationHtml += '</div><div class="pagination-buttons">';
    
    // Previous button
    if (currentPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToVideocastsPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
        <span>Anterior</span>
      </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToVideocastsPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? 'active' : '';
      paginationHtml += `<button class="pagination-btn ${activeClass}" onclick="landing.goToVideocastsPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += '<span class="pagination-dots">...</span>';
      }
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToVideocastsPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
      paginationHtml += `<button class="pagination-btn" onclick="landing.goToVideocastsPage(${currentPage + 1})">
        <span>Siguiente</span>
        <i class="fas fa-chevron-right"></i>
      </button>`;
    }
    
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
    paginationContainer.style.display = 'flex';
  }

  goToVideocastsPage(page) {
    this.scrollToSection('multimedia');
    setTimeout(() => {
      this.loadVideocasts(page);
    }, 300);
  }

  setupVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    const closeBtn = document.getElementById('videocast-modal-close');
    
    closeBtn.addEventListener('click', () => {
      this.closeVideocastModal();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeVideocastModal();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeVideocastModal();
      }
    });
  }

  openVideocastModal(videocastIndex) {
    if (!this.currentVideocastsData || !this.currentVideocastsData[videocastIndex]) {
      this.showToast('Error cargando el videocast', 'error');
      return;
    }
    
    const videocast = this.currentVideocastsData[videocastIndex];
    const modal = document.getElementById('videocast-modal');
    
    // Populate modal content
    document.getElementById('videocast-modal-title').textContent = videocast.title;
    document.getElementById('videocast-modal-episode').textContent = `Episodio #${videocast.episodeNumber || videocastIndex + 1}`;
    document.getElementById('videocast-modal-description').textContent = videocast.description || 'Sin descripción disponible';
    document.getElementById('videocast-modal-duration').querySelector('span').textContent = videocast.duration || 'N/A';
    
    // Create video iframe
    const videoContainer = document.getElementById('videocast-container');
    const videoUrl = this.getEmbedUrl(videocast.videoUrl);
    
    if (videoUrl) {
      videoContainer.innerHTML = `
        <iframe 
          src="${videoUrl}" 
          title="${videocast.title}"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else {
      videoContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #333; color: white; border-radius: 16px;">
          <div style="text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>No se puede reproducir este video</p>
            <a href="${videocast.videoUrl}" target="_blank" style="color: #667eea; text-decoration: none; margin-top: 1rem; display: inline-block;">
              Ver en sitio original
            </a>
          </div>
        </div>
      `;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    const videoContainer = document.getElementById('videocast-container');
    
    // Stop video by clearing container
    videoContainer.innerHTML = '';
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Video Modal Functions
  setupVideoModal() {
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('video-modal-close');
    
    // Close modal on close button click
    closeBtn.addEventListener('click', () => {
      this.closeVideoModal();
    });
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeVideoModal();
      }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeVideoModal();
      }
    });
  }

  openVideoModal(videoIndex) {
    if (!this.videosData || !this.videosData[videoIndex]) {
      this.showToast('Error cargando el video', 'error');
      return;
    }
    
    const video = this.videosData[videoIndex];
    const modal = document.getElementById('video-modal');
    
    // Populate modal content
    document.getElementById('video-modal-rank').textContent = `#${video.order || videoIndex + 1}`;
    document.getElementById('video-modal-title').textContent = video.name;
    document.getElementById('video-modal-description').textContent = video.description || 'Sin descripción disponible';
    
    // Create video iframe
    const videoContainer = document.getElementById('video-container');
    const videoUrl = this.getEmbedUrl(video.videoUrl);
    
    if (videoUrl) {
      videoContainer.innerHTML = `
        <iframe 
          src="${videoUrl}" 
          title="${video.name}"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else {
      videoContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #333; color: white; border-radius: 16px;">
          <div style="text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>No se puede reproducir este video</p>
            <a href="${video.videoUrl}" target="_blank" style="color: #7c77c6; text-decoration: none; margin-top: 1rem; display: inline-block;">
              Ver en sitio original
            </a>
          </div>
        </div>
      `;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const videoContainer = document.getElementById('video-container');
    
    // Stop video by clearing container
    videoContainer.innerHTML = '';
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
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

  getVideoThumbnail(video) {
    // First, check if the video object has a custom thumbnail/image
    if (video.imageUrl) {
      return `https://dashboard.ipstream.cl${video.imageUrl}`;
    }
    
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }
    
    // If no custom image, try to extract thumbnail from video URL
    if (video.videoUrl) {
      // YouTube thumbnail
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const youtubeMatch = video.videoUrl.match(youtubeRegex);
      
      if (youtubeMatch) {
        // Use high quality thumbnail (maxresdefault), fallback to hqdefault if not available
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
      }
      
      // Vimeo thumbnail (requires API call, so we'll use a placeholder for now)
      const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
      const vimeoMatch = video.videoUrl.match(vimeoRegex);
      
      if (vimeoMatch) {
        // For Vimeo, we could make an API call, but for now use a placeholder
        // In a real implementation, you might want to fetch this server-side
        return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
      }
    }
    
    // Fallback: create a gradient thumbnail with video info
    return this.createGradientThumbnail(video);
  }

  createGradientThumbnail(video) {
    // Create a data URL with a gradient background
    // This is a fallback when no thumbnail is available
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 480, 270);
    gradient.addColorStop(0, '#7c77c6');
    gradient.addColorStop(0.5, '#ff77c6');
    gradient.addColorStop(1, '#77dbff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 480, 270);
    
    // Add some pattern/texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 480, Math.random() * 270, Math.random() * 30, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    return canvas.toDataURL();
  }

  loadVideoThumbnails(videos) {
    videos.forEach((video, index) => {
      // Check for podium thumbnails (top 3)
      const podiumElement = document.getElementById(`podium-thumbnail-${index}`);
      // Check for ranking list thumbnails (rest)
      const rankingElement = document.getElementById(`ranking-thumbnail-${index}`);
      
      const thumbnailElement = podiumElement || rankingElement;
      if (!thumbnailElement) return;
      
      const thumbnailUrl = this.getVideoThumbnail(video);
      
      // If it's a generated gradient, apply it directly
      if (thumbnailUrl.startsWith('data:')) {
        thumbnailElement.style.backgroundImage = `url('${thumbnailUrl}')`;
        return;
      }
      
      // For external URLs, test if image loads
      const img = new Image();
      img.onload = () => {
        thumbnailElement.style.backgroundImage = `url('${thumbnailUrl}')`;
        thumbnailElement.classList.remove('loading');
      };
      
      img.onerror = () => {
        // If image fails to load, use gradient fallback
        const fallbackUrl = this.createGradientThumbnail(video);
        thumbnailElement.style.backgroundImage = `url('${fallbackUrl}')`;
        thumbnailElement.classList.remove('loading');
      };
      
      // Add loading class and start loading
      thumbnailElement.classList.add('loading');
      img.src = thumbnailUrl;
    });
  }

  // Anuncio Functions
  setupAnuncioModal() {
    const modal = document.getElementById('anuncio-modal');
    const closeBtn = document.getElementById('anuncio-modal-close');
    
    closeBtn.addEventListener('click', () => {
      this.closeAnuncioModal();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeAnuncioModal();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeAnuncioModal();
      }
    });
  }

  openAnuncioModal(anuncioIndex) {
    if (!this.anunciosData || !this.anunciosData[anuncioIndex]) {
      this.showToast('Error cargando el anuncio', 'error');
      return;
    }
    
    const anuncio = this.anunciosData[anuncioIndex];
    const modal = document.getElementById('anuncio-modal');
    
    // Populate modal content
    document.getElementById('anuncio-modal-title').textContent = anuncio.title;
    document.getElementById('anuncio-modal-description').textContent = anuncio.description || 'Sin descripción disponible';
    
    // Set image
    const modalImage = document.getElementById('anuncio-modal-image');
    if (anuncio.imageUrl) {
      modalImage.src = `https://dashboard.ipstream.cl${anuncio.imageUrl}`;
      modalImage.alt = anuncio.title;
      modalImage.style.display = 'block';
    } else {
      modalImage.style.display = 'none';
    }
    
    // Set link
    const actionsContainer = document.getElementById('anuncio-actions');
    const linkBtn = document.getElementById('anuncio-link');
    if (anuncio.link) {
      linkBtn.href = anuncio.link;
      actionsContainer.style.display = 'flex';
    } else {
      actionsContainer.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeAnuncioModal() {
    const modal = document.getElementById('anuncio-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Initialize landing page after loading is complete
let landing;

// Wait for LoadingManager to complete before initializing
window.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for LoadingManager to start
  setTimeout(() => {
    if (window.loadingManager) {
      // Override the hide method to initialize RadioLanding when loading is complete
      const originalHide = window.loadingManager.hide.bind(window.loadingManager);
      window.loadingManager.hide = function() {
        originalHide();
        // Initialize RadioLanding after loading is hidden
        setTimeout(() => {
          landing = new RadioLanding();
          window.radioLanding = landing;
          window.landing = landing; // Make available globally for onclick handlers
        }, 600);
      };
    } else {
      // Fallback if LoadingManager is not available
      landing = new RadioLanding();
      window.radioLanding = landing;
      window.landing = landing; // Make available globally for onclick handlers
    }
  }, 100);
});

// Helper function for onclick handlers
window.scrollToSection = (sectionId) => {
  if (window.landing) {
    window.landing.scrollToSection(sectionId);
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (landing.sonicPanelInterval) {
    clearInterval(landing.sonicPanelInterval);
  }
  if (landing.audioPlayer) {
    landing.audioPlayer.pause();
  }
});
