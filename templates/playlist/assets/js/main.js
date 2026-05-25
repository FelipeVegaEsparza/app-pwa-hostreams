/**
 * Template Playlist - Refactorizado usando TemplateBase
 * Este template tiene una interfaz tipo playlist con sidebar
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class PlaylistTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-stream',
      playButtonId: 'main-play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['sidebar-social'],
      customDomIds: {
        radioLogo: 'sidebar-logo',
        trackTitle: 'player-title',
        trackArtist: 'player-artist',
        trackArtwork: 'player-artwork',
        defaultArtwork: 'default-player-artwork',
        programsList: 'programs-list',
        newsList: 'news-list',
        podcastsList: 'podcasts-list',
        videocastsList: 'videocasts-list',
        sponsorsList: 'sponsors-list'
      }
    });
    
    this.currentView = 'now-playing';
    this.navigationSetup = false;
    this.videoStreamUrl = null;
  }

  async init() {
    // Setup navigation FIRST - before loading content
    this.setupNavigation();
    
    await super.init();
    
    try {
      await this.checkTVAvailability();
      await this.loadAllContent();
      this.setupModalEventListeners();
      
      console.log('PlaylistTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('PlaylistTemplate: Error in template-specific init:', error);
    }
  }

  async checkTVAvailability() {
    try {
      const dataManager = getDataManager();
      this.videoStreamUrl = await dataManager.loadVideoStreamUrl();
      
      const tvMenuItem = document.querySelector('.menu-item[data-section="tv-online"]');
      const tvView = document.getElementById('tv-online-view');
      
      if (this.videoStreamUrl) {
        if (tvMenuItem) {
          tvMenuItem.closest('li').style.display = '';
          tvMenuItem.closest('li').removeAttribute('data-hidden');
        }
        if (tvView) tvView.style.display = '';
      } else {
        if (tvMenuItem) tvMenuItem.closest('li').style.display = 'none';
        if (tvMenuItem) tvMenuItem.closest('li').setAttribute('data-hidden', 'true');
        if (tvView) tvView.style.display = 'none';
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error checking TV availability:', error);
    }
  }

  // Sobrescribir: Actualizar display de canción actual
  updateCurrentSongDisplay(songData) {
    super.updateCurrentSongDisplay(songData);
    
    const listeners = songData.listeners || '0';
    const bitrate = songData.bitrate || 'N/A';
    
    // Actualizar texto del reproductor inferior
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    if (playerTitle) playerTitle.textContent = songData.title || 'Radio';
    if (playerArtist) playerArtist.textContent = songData.artist || 'En Vivo';
    
    // Oyentes y calidad del reproductor inferior
    const playerListenerCount = document.getElementById('player-listener-count');
    const playerBitrateValue = document.getElementById('player-bitrate-value');
    if (playerListenerCount) playerListenerCount.textContent = listeners;
    if (playerBitrateValue) playerBitrateValue.textContent = bitrate;
    
    // Actualizar artwork del reproductor inferior
    const playerArtwork = document.getElementById('player-artwork');
    const defaultPlayerArtwork = document.querySelector('.default-player-artwork');
    if (songData.art && playerArtwork) {
      playerArtwork.src = songData.art;
      playerArtwork.style.display = 'block';
      if (defaultPlayerArtwork) defaultPlayerArtwork.style.display = 'none';
    }
    
    // Actualizar título del reproductor principal (arriba)
    const mainSongTitle = document.getElementById('main-song-title');
    if (mainSongTitle) {
      mainSongTitle.textContent = songData.title || 'Radio';
    }
    
    // Actualizar artista del reproductor principal (arriba)
    const mainSongArtist = document.getElementById('main-song-artist');
    if (mainSongArtist) {
      mainSongArtist.textContent = songData.artist || 'En Vivo';
    }
    
    // Oyentes y bitrate del reproductor principal (arriba)
    const mainListeners = document.getElementById('main-listeners');
    const mainBitrate = document.getElementById('main-bitrate');
    if (mainListeners) mainListeners.innerHTML = `<i class="fas fa-users"></i> ${listeners} oyentes`;
    if (mainBitrate) mainBitrate.innerHTML = `<i class="fas fa-signal"></i> ${bitrate} kbps`;
    
    // Actualizar artwork del reproductor principal (arriba)
    const mainArtwork = document.getElementById('main-artwork');
    const defaultArtwork = document.querySelector('.default-artwork-large');
    if (songData.art && mainArtwork) {
      mainArtwork.src = songData.art;
      mainArtwork.style.display = 'block';
      if (defaultArtwork) defaultArtwork.style.display = 'none';
    }
  }

  // Cargar todo el contenido
  async loadAllContent() {
    try {
      const dataManager = getDataManager();
      
      await Promise.all([
        this.loadPrograms(),
        this.loadNews(),
        this.loadPodcasts(),
        this.loadVideocasts(),
        this.loadSponsors(),
        this.loadRecentTracks()
      ]);
    } catch (error) {
      console.error('PlaylistTemplate: Error loading content:', error);
    }
  }
  
  // Cargar tracks recientes
  async loadRecentTracks() {
    try {
      const dataManager = getDataManager();
      const songData = await dataManager.loadCurrentSong();
      
      if (songData && songData.history && songData.history.length > 0) {
        this.renderRecentTracks(songData.history);
      } else {
        this.renderRecentTracksEmpty();
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading recent tracks:', error);
      this.renderRecentTracksEmpty();
    }
  }
  
  renderRecentTracks(history) {
    const container = document.getElementById('recent-tracks');
    if (!container) return;
    
    if (!history || history.length === 0) {
      this.renderRecentTracksEmpty();
      return;
    }
    
    const defaultArt = '/assets/icons/icon-96x96.png';
    const maxTracks = 5;
    const recentHistory = history.slice(0, maxTracks);
    
    const tracksHtml = recentHistory.map((track) => {
      let artist = '';
      let title = 'Sin título';
      
      // El historial viene como strings: "1.) Chayanne - Fuiste un trozo..."
      // Primero quitar el número y punto inicial (ej: "1.) ")
      const cleanTrack = typeof track === 'string' ? track.replace(/^\d+\.\)\s*/, '') : String(track);
      
      // Quitar tags HTML como <br>
      const rawTitle = cleanTrack.replace(/<[^>]*>/g, '').trim();
      
      // Separar artista y título por " - "
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else if (rawTitle) {
        title = rawTitle;
      }
      
      return `
        <div class="track-item">
          <img src="${defaultArt}" alt="${title}" class="track-cover" onerror="this.src='${defaultArt}'">
          <div class="track-info">
            <span class="track-name">${title}</span>
            <span class="track-artist">${artist || 'Unknown'}</span>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = tracksHtml;
  }
  
  renderRecentTracksEmpty() {
    const container = document.getElementById('recent-tracks');
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-history">
        <i class="fas fa-music"></i>
        <span>No hay historial de reproducciones</span>
      </div>
    `;
  }

  // Cargar programas
  async loadPrograms() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs && programs.length > 0) {
        this.renderPrograms(programs);
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading programs:', error);
    }
  }

  renderPrograms(programs) {
    const container = document.getElementById('programs-list');
    if (!container) return;

    const programsHtml = programs.map(program => `
      <div class="program-item">
        <span class="program-time">${program.startTime}</span>
        <span class="program-name">${program.name}</span>
      </div>
    `).join('');

    container.innerHTML = programsHtml;
  }

  // Cargar noticias
  async loadNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 10);
      
      if (news.data) {
        for (const item of news.data) {
          if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
        }
        this.renderNews(news.data);
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading news:', error);
    }
  }

  renderNews(news) {
    const container = document.getElementById('news-list');
    if (!container) return;

    const newsHtml = news.map(item => `
      <article class="news-item" data-slug="${item.slug}" style="cursor:pointer;">
        <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <div class="news-content">
          <h4>${item.name}</h4>
          <p>${item.shortText || ''}</p>
        </div>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar podcasts
  async loadPodcasts() {
    try {
      const dataManager = getDataManager();
      const podcasts = await dataManager.loadPodcasts(1, 10);
      
      if (podcasts.data) {
        for (const item of podcasts.data) {
          if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
        }
        this.renderPodcasts(podcasts.data);
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading podcasts:', error);
    }
  }

  renderPodcasts(podcasts) {
    const container = document.getElementById('podcasts-list');
    if (!container) return;

    const podcastsHtml = podcasts.map(podcast => `
      <div class="podcast-item" data-podcast-id="${podcast.id}" style="cursor:pointer;">
        <img src="${podcast.imageUrl || '/assets/images/default-podcast.jpg'}" alt="${podcast.title}" loading="lazy">
        <div class="podcast-info">
          <h4>${podcast.title}</h4>
          <span class="podcast-duration">${podcast.duration || ''}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = podcastsHtml;
  }

  // Cargar videocasts
  async loadVideocasts() {
    try {
      const dataManager = getDataManager();
      const videocasts = await dataManager.loadVideocasts(1, 10);
      
      if (videocasts.data) {
        for (const item of videocasts.data) {
          if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
        }
        this.renderVideocasts(videocasts.data);
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading videocasts:', error);
    }
  }

  renderVideocasts(videocasts) {
    const container = document.getElementById('videocasts-list');
    if (!container) return;

    const videocastsHtml = videocasts.map(videocast => `
      <div class="videocast-item" data-videocast-id="${videocast.id}" style="cursor:pointer;">
        <img src="${videocast.imageUrl || '/assets/images/default-video.jpg'}" alt="${videocast.title}" loading="lazy">
        <div class="videocast-info">
          <h4>${videocast.title}</h4>
          ${videocast.description ? `<p style="margin:0.25rem 0;font-size:0.8rem;color:#888;line-height:1.4;">${videocast.description.substring(0, 80)}${videocast.description.length > 80 ? '…' : ''}</p>` : ''}
          <span class="videocast-duration">${videocast.duration || ''}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = videocastsHtml;
  }

  // Cargar sponsors
  async loadSponsors() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      
      if (sponsors && sponsors.length > 0) {
        for (const item of sponsors) {
          if (item.logoUrl) item.logoUrl = await dataManager.getImageUrl(item.logoUrl);
        }
        this.renderSponsors(sponsors);
      }
    } catch (error) {
      console.error('PlaylistTemplate: Error loading sponsors:', error);
    }
  }

  renderSponsors(sponsors) {
    const container = document.getElementById('sponsors-list');
    if (!container) return;

    const sponsorsHtml = sponsors.map(sponsor => `
      <div class="sponsor-item">
        <img src="${sponsor.logoUrl || ''}" alt="${sponsor.name}" loading="lazy">
        <span>${sponsor.name}</span>
      </div>
    `).join('');

    container.innerHTML = sponsorsHtml;
  }

  // Setup de navegación
  setupNavigation() {
    if (this.navigationSetup) return;
    this.navigationSetup = true;

    // Ensure sidebar starts closed on mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      console.log('PlaylistTemplate: Sidebar reset to closed');
    }
    
    const menuToggle = document.querySelector('.nav-toggle');
    
    console.log('PlaylistTemplate: setupNavigation - menuToggle:', !!menuToggle, 'sidebar:', !!sidebar, 'overlay:', !!overlay);
    
    // Toggle button
    if (menuToggle) {
      menuToggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Force sidebar OPEN - add active class unconditionally
        sidebar.classList.add('active');
        overlay.classList.add('active');
        
        // Also force via direct style as backup
        sidebar.style.left = '0px';
        sidebar.style.transition = 'left 0.3s ease';
        
        // Force make menu content visible
        const sidebarMenu = sidebar.querySelector('.sidebar-menu');
        if (sidebarMenu) {
          sidebarMenu.style.display = 'block';
          sidebarMenu.style.visibility = 'visible';
          sidebarMenu.style.opacity = '1';
        }
        
        console.log('PlaylistTemplate: Toggle clicked, sidebar forced active');
      };
    }
    
    // Close on overlay click
    if (overlay) {
      overlay.onclick = (e) => {
        e.preventDefault();
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      };
    }

    // Menu items
    const menuItems = document.querySelectorAll('.menu-item');
    console.log('PlaylistTemplate: Found menu items:', menuItems.length);
    
    menuItems.forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section = item.dataset.section;
        console.log('PlaylistTemplate: Menu item clicked:', section);
        
        if (section === 'tv-online' && !this.videoStreamUrl) return;
        
        // Show the section
        this.showSection(section).then(() => {
          console.log('PlaylistTemplate: Section loaded:', section);
        });
        
        // Close sidebar
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        
        // Update active class
        menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');
      };
    });
  }
  
  // Mostrar sección
  async showSection(sectionName) {
    this.currentView = sectionName;
    
    // Cerrar modales al cambiar de sección
    this.closePodcastModal();
    this.closeVideocastModal();
    this.closeVideoModal();
    this.closeNewsModal();
    
    // Hide all content views first
    document.querySelectorAll('.content-view').forEach(view => {
      view.classList.remove('active');
    });
    
    // Show the selected section's view
    const targetView = document.getElementById(`${sectionName}-view`);
    if (targetView) {
      targetView.classList.add('active');
    }
    
    // Close sidebar after selection (only on mobile)
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) {
        sidebar.classList.remove('active');
        sidebar.style.left = '-280px';
      }
      if (overlay) {
        overlay.classList.remove('active');
      }
    }
    
    // Update active menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(mi => mi.classList.remove('active'));
    const activeItem = document.querySelector(`.menu-item[data-section="${sectionName}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = this.getSectionTitle(sectionName);
    
    // Load content for the selected section
    await this.loadSectionContent(sectionName);
    
    console.log('PlaylistTemplate: Showing section:', sectionName);
  }
  
  async loadSectionContent(sectionName) {
    const dataManager = getDataManager();
    
    switch (sectionName) {
      case 'programs':
        await this.loadProgramsForAllDays();
        break;
      case 'news':
        await this.loadAllNews();
        break;
      case 'podcasts':
        await this.loadAllPodcasts();
        break;
      case 'videocasts':
        await this.loadAllVideocasts();
        break;
      case 'sponsors':
        await this.loadAllSponsors();
        break;
      case 'promotions':
        await this.loadAllPromotions();
        break;
      case 'social':
        await this.loadSocialNetworks();
        break;
      case 'videos':
        await this.loadAllVideos();
        break;
      case 'tv-online':
        console.log('TV Online section');
        break;
      default:
        console.log('No content to load for:', sectionName);
    }
  }
  
  async loadProgramsForAllDays() {
    const container = document.querySelector('#programs-view .programs-content');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (!programs || programs.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay programación disponible</div>';
        return;
      }
      
      // Resolver URLs de imágenes
      for (const program of programs) {
        if (program.imageUrl) {
          program.imageUrl = await dataManager.getImageUrl(program.imageUrl);
        }
      }
      
      const dayMapping = {
        'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
        'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
      };
      
      const getSpanishDay = (englishDay) => {
        if (!englishDay) return null;
        return dayMapping[englishDay.toLowerCase()] || englishDay;
      };
      
      const days = [
        { id: 'monday', name: 'Lunes' },
        { id: 'tuesday', name: 'Martes' },
        { id: 'wednesday', name: 'Miércoles' },
        { id: 'thursday', name: 'Jueves' },
        { id: 'friday', name: 'Viernes' },
        { id: 'saturday', name: 'Sábado' },
        { id: 'sunday', name: 'Domingo' }
      ];
      
      days.forEach(day => {
        const dayPrograms = programs.filter(p => p.weekDays && p.weekDays.some(d => getSpanishDay(d) === day.name));
        const dayContainer = document.getElementById(`${day.id}-programs`);
        
        if (dayContainer) {
          const timeline = dayContainer.querySelector('.programs-timeline');
          if (timeline) {
            if (dayPrograms.length === 0) {
              timeline.innerHTML = '<div class="empty-day">No hay programas para este día</div>';
            } else {
              timeline.innerHTML = dayPrograms.map(program => `
                <div class="program-card">
                  ${program.imageUrl ? `<img src="${program.imageUrl}" alt="${program.name}" loading="lazy">` : ''}
                  <div class="program-info">
                    <h3>${program.name}</h3>
                    ${program.description ? `<p>${program.description}</p>` : ''}
                    <div class="program-schedule">
                      <i class="fas fa-clock"></i>
                      <span>${program.startTime} - ${program.endTime || ''}</span>
                    </div>
                  </div>
                </div>
              `).join('');
            }
          }
        }
      });
      
      // Activar primer día por defecto
      const firstTab = document.querySelector('.programs-tab-btn');
      if (firstTab) this.showProgramsDay(firstTab.dataset.day);
      
    } catch (error) {
      console.error('PlaylistTemplate: Error loading programs:', error);
      container.innerHTML = '<div class="error-message">Error al cargar la programación</div>';
    }
  }
  
  showProgramsDay(dayId) {
    document.querySelectorAll('.programs-day-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.programs-tab-btn').forEach(el => el.classList.remove('active'));
    const dayContent = document.getElementById(`${dayId}-programs`);
    if (dayContent) dayContent.classList.add('active');
    const tabBtn = document.querySelector(`.programs-tab-btn[data-day="${dayId}"]`);
    if (tabBtn) tabBtn.classList.add('active');
  }
  
  async loadAllNews() {
    const container = document.getElementById('news-feed');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 20);
      
      if (!news.data || news.data.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay noticias disponibles</div>';
        return;
      }
      
      for (const item of news.data) {
        if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
      }
      
      const newsHtml = news.data.map(item => `
        <article class="news-item" data-slug="${item.slug}" style="cursor:pointer;">
          <img src="${item.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${item.name}" loading="lazy">
          <div class="news-content">
            <h3>${item.name}</h3>
            <p>${item.shortText || ''}</p>
            <span class="news-date">${new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
        </article>
      `).join('');
      
      container.innerHTML = newsHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading news:', error);
      container.innerHTML = '<div class="error-message">Error al cargar las noticias</div>';
    }
  }
  
  async loadAllPodcasts() {
    const container = document.getElementById('podcast-library');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const podcasts = await dataManager.loadPodcasts(1, 20);
      
      if (!podcasts.data || podcasts.data.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay podcasts disponibles</div>';
        return;
      }
      
      for (const item of podcasts.data) {
        if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
      }
      
      const podcastsHtml = podcasts.data.map(podcast => `
        <div class="podcast-card" data-podcast-id="${podcast.id}" style="cursor:pointer;">
          <img src="${podcast.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${podcast.title}" loading="lazy">
          <div class="podcast-info">
            <h3>${podcast.title}</h3>
            <span class="podcast-duration">${podcast.duration || ''}</span>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = podcastsHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading podcasts:', error);
      container.innerHTML = '<div class="error-message">Error al cargar los podcasts</div>';
    }
  }
  
  async loadAllVideocasts() {
    const container = document.getElementById('videocast-library');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const videocasts = await dataManager.loadVideocasts(1, 20);
      
      if (!videocasts.data || videocasts.data.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay videocasts disponibles</div>';
        return;
      }
      
      for (const item of videocasts.data) {
        if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
      }
      
      const videocastsHtml = videocasts.data.map(videocast => `
        <div class="videocast-card" data-videocast-id="${videocast.id}" style="cursor:pointer;">
          <img src="${videocast.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${videocast.title}" loading="lazy">
          <div class="videocast-info">
            <h3>${videocast.title}</h3>
            ${videocast.description ? `<p style="margin:0.25rem 0 0.5rem;color:#b3b3b3;font-size:0.85rem;line-height:1.5;">${videocast.description}</p>` : ''}
            <span class="videocast-duration">${videocast.duration || ''}</span>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = videocastsHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading videocasts:', error);
      container.innerHTML = '<div class="error-message">Error al cargar los videocasts</div>';
    }
  }
  
  async loadAllSponsors() {
    const container = document.getElementById('sponsors-showcase');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      
      if (!sponsors || sponsors.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay patrocinadores disponibles</div>';
        return;
      }
      
      for (const item of sponsors) {
        if (item.logoUrl) item.logoUrl = await dataManager.getImageUrl(item.logoUrl);
      }
      
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
    } catch (error) {
      console.error('PlaylistTemplate: Error loading sponsors:', error);
      container.innerHTML = '<div class="error-message">Error al cargar los patrocinadores</div>';
    }
  }
  
  async loadAllPromotions() {
    const container = document.getElementById('promotions-grid');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const promotions = await dataManager.loadPromotions();
      
      if (!promotions || promotions.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay anuncios disponibles</div>';
        return;
      }
      
      for (const item of promotions) {
        if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
      }
      
      const promotionsHtml = promotions.map(promo => `
        <div class="promotion-card">
          <img src="${promo.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${promo.title}">
          <div class="promotion-info">
            <h3>${promo.title}</h3>
            <p>${promo.description || ''}</p>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = promotionsHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading promotions:', error);
      container.innerHTML = '<div class="error-message">Error al cargar los anuncios</div>';
    }
  }
  
  async loadAllVideos() {
    const container = document.getElementById('video-ranking');
    if (!container) return;

    try {
      const dataManager = getDataManager();
      const videos = await dataManager.loadVideos();

      const items = videos.data || videos;
      if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay videos disponibles</div>';
        return;
      }

      const youtubeThumb = (url) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '/assets/icons/icon-96x96.png';
      };

      const videosHtml = items.map((video, i) => `
        <a href="${video.videoUrl}" target="_blank" rel="noopener" class="video-ranking-card" style="display:flex;gap:1rem;padding:1rem;background:#282828;border-radius:12px;align-items:center;cursor:pointer;text-decoration:none;color:inherit;margin-bottom:0.75rem;">
          <span style="font-size:1.2rem;font-weight:700;color:#1db954;min-width:30px;">#${video.order || i + 1}</span>
          <img src="${youtubeThumb(video.videoUrl)}" alt="${video.name}" style="width:100px;height:75px;object-fit:cover;border-radius:8px;flex-shrink:0;">
          <div style="flex:1;">
            <h4 style="margin:0 0 0.25rem;">${video.name}</h4>
            <p style="margin:0;color:#b3b3b3;font-size:0.85rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${video.description || ''}</p>
          </div>
          <i class="fas fa-play-circle" style="font-size:2rem;color:#1db954;flex-shrink:0;"></i>
        </a>
      `).join('');

      container.innerHTML = videosHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading videos:', error);
      container.innerHTML = '<div class="error-message">Error al cargar el ranking</div>';
    }
  }

  async openVideoModal(video) {
    const modal = document.getElementById('video-modal');
    const titleEl = document.getElementById('video-modal-title');
    const rankEl = document.getElementById('video-modal-rank');
    const descEl = document.getElementById('video-modal-description');
    const container = document.getElementById('video-container');

    if (titleEl) titleEl.textContent = video.name || '';
    if (rankEl) rankEl.textContent = `#${video.order || ''}`;
    if (descEl) descEl.textContent = video.description || '';
    if (container) {
      const videoId = (video.videoUrl || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
      container.innerHTML = videoId
        ? `<iframe src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;"></iframe>`
        : '<p style="color:#b3b3b3;">Video no disponible</p>';
    }
    if (modal) modal.classList.add('active');
  }

  async loadSocialNetworks() {
    const container = document.getElementById('social-hub');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const socialData = await dataManager.loadSocialNetworks();
      
      if (!socialData || Object.keys(socialData).length === 0) {
        container.innerHTML = '<div class="empty-message">No hay redes sociales configuradas</div>';
        return;
      }
      
      const iconMap = {
        facebook: 'fab fa-facebook-f',
        x: 'fab fa-x-twitter',
        twitter: 'fab fa-twitter',
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        tiktok: 'fab fa-tiktok',
        whatsapp: 'fab fa-whatsapp',
        telegram: 'fab fa-telegram',
        linkedin: 'fab fa-linkedin-in'
      };
      
      const entries = [
        { name: 'facebook', url: socialData.facebook },
        { name: 'instagram', url: socialData.instagram },
        { name: 'twitter', url: socialData.x || socialData.twitter },
        { name: 'youtube', url: socialData.youtube },
        { name: 'tiktok', url: socialData.tiktok },
        { name: 'whatsapp', url: socialData.whatsapp?.startsWith('http') ? socialData.whatsapp : `https://wa.me/${(socialData.whatsapp || '').replace(/[^0-9]/g, '')}` },
        { name: 'telegram', url: socialData.telegram },
        { name: 'linkedin', url: socialData.linkedin }
      ].filter(e => e.url);
      
      if (entries.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay redes sociales configuradas</div>';
        return;
      }
      
      const socialHtml = entries.map(item => `
        <a href="${item.url}" target="_blank" rel="noopener" class="social-link-item">
          <i class="${iconMap[item.name] || 'fas fa-link'}"></i>
          <span>${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
        </a>
      `).join('');
      
      container.innerHTML = socialHtml;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading social networks:', error);
      container.innerHTML = '<div class="error-message">Error al cargar las redes sociales</div>';
    }
  }
  
  async openNewsModal(slug) {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNewsBySlug(slug);
      if (!news) return;

      const modal = document.getElementById('news-modal');
      const titleEl = document.getElementById('news-modal-title');
      const dateEl = document.getElementById('news-modal-date');
      const contentEl = document.getElementById('news-modal-content');
      const imageEl = document.getElementById('news-modal-image');

      if (titleEl) titleEl.textContent = news.name || '';
      if (dateEl) {
        const span = dateEl.querySelector('span');
        if (span) span.textContent = news.createdAt ? new Date(news.createdAt).toLocaleDateString('es-ES') : '';
      }
      const body = news.longText || news.shortText || '';
      if (contentEl) contentEl.innerHTML = body.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('');
      if (imageEl && news.imageUrl) {
        const fullUrl = await dataManager.getImageUrl(news.imageUrl);
        imageEl.src = fullUrl;
        imageEl.style.display = 'block';
      } else if (imageEl) {
        imageEl.style.display = 'none';
      }
      if (modal) modal.classList.add('active');
    } catch (error) {
      console.error('PlaylistTemplate: Error opening news modal:', error);
    }
  }

  closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) modal.classList.remove('active');
  }

  async openPodcastModal(id) {
    try {
      const dataManager = getDataManager();
      const data = await dataManager.loadPodcastById(id);
      if (!data) return;

      console.log('PlaylistTemplate: Podcast data:', data);

      const modal = document.getElementById('podcast-modal');
      const imgEl = document.getElementById('podcast-modal-image');
      const titleEl = document.getElementById('podcast-modal-title');
      const descEl = document.getElementById('podcast-modal-description');
      const audioEl = document.getElementById('podcast-audio');
      const durationEl = document.getElementById('podcast-modal-duration');

      if (imgEl && data.imageUrl) {
        const resolved = await dataManager.getImageUrl(data.imageUrl);
        imgEl.src = resolved;
        imgEl.parentElement.style.display = 'flex';
      } else if (imgEl) {
        imgEl.parentElement.style.display = 'none';
      }
      if (titleEl) titleEl.textContent = data.title || '';
      if (descEl) descEl.textContent = data.description || data.shortText || '';
      const audioUrl = data.audioUrl || data.fileUrl || data.url || data.audio || '';
      console.log('PlaylistTemplate: Podcast audioUrl:', audioUrl);
      if (audioEl && audioUrl) {
        const resolvedAudio = audioUrl.startsWith('http') ? audioUrl : await dataManager.getImageUrl(audioUrl);
        audioEl.src = resolvedAudio;
        audioEl.load();
      }
      if (durationEl) {
        const span = durationEl.querySelector('span');
        if (span) span.textContent = data.duration || 'Duración';
      }
      if (modal) modal.classList.add('active');
    } catch (error) {
      console.error('PlaylistTemplate: Error opening podcast modal:', error);
    }
  }

  closePodcastModal() {
    const modal = document.getElementById('podcast-modal');
    if (modal) modal.classList.remove('active');
    const audio = document.getElementById('podcast-audio');
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
  }

  async openVideocastModal(id) {
    try {
      const dataManager = getDataManager();
      const data = await dataManager.loadVideocastById(id);
      if (!data || !data.videoUrl) return;
      window.open(data.videoUrl, '_blank', 'noopener');
    } catch (error) {
      console.error('PlaylistTemplate: Error opening videocast:', error);
    }
  }

  closeVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    if (modal) modal.classList.remove('active');
    const container = document.getElementById('videocast-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) modal.classList.remove('active');
    const container = document.getElementById('video-container');
    if (container) container.innerHTML = '';
  }

  closeAnuncioModal() {
    const modal = document.getElementById('anuncio-modal');
    if (modal) modal.classList.remove('active');
  }

  getSectionTitle(section) {
    const titles = {
      'now-playing': 'Ahora Suena',
      'programs': 'Programas',
      'news': 'Noticias',
      'podcasts': 'Podcasts',
      'videocasts': 'Videocasts',
      'videos': 'Ranking Musical',
      'sponsors': 'Patrocinadores',
      'promotions': 'Anuncios',
      'social': 'Redes Sociales',
      'tv-online': 'TV Online'
    };
    return titles[section] || section;
  }

  // Setup de modales
  setupModalEventListeners() {
    const modalIds = {
      'news-modal': 'closeNewsModal',
      'podcast-modal': 'closePodcastModal',
      'videocast-modal': 'closeVideocastModal',
      'video-modal': 'closeVideoModal'
    };
    
    Object.entries(modalIds).forEach(([id, method]) => {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this[method]();
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Object.keys(modalIds).forEach(id => {
          const modal = document.getElementById(id);
          if (modal && modal.classList.contains('active')) {
            this[modalIds[id]]();
          }
        });
      }
    });
    
    document.addEventListener('click', (e) => {
      const newsLink = e.target.closest('[data-slug]');
      if (newsLink) {
        e.preventDefault();
        const slug = newsLink.getAttribute('data-slug');
        this.openNewsModal(slug);
        return;
      }
      const podcastLink = e.target.closest('[data-podcast-id]');
      if (podcastLink) {
        e.preventDefault();
        const id = podcastLink.getAttribute('data-podcast-id');
        this.openPodcastModal(id);
        return;
      }
      const videocastLink = e.target.closest('[data-videocast-id]');
      if (videocastLink) {
        e.preventDefault();
        const id = videocastLink.getAttribute('data-videocast-id');
        this.openVideocastModal(id);
        return;
      }
    });
    
    document.querySelector('.programs-tabs')?.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.programs-tab-btn');
      if (tabBtn) {
        this.showProgramsDay(tabBtn.dataset.day);
      }
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new PlaylistTemplate();
    window.playlistTemplate = app;
    window.streamApp = app;
    await app.init();
  } catch (error) {
    console.error('PlaylistTemplate: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.playlistTemplate) {
    window.playlistTemplate.destroy();
  }
});

export default PlaylistTemplate;
