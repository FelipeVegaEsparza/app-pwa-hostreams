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
        sidebarLogo: 'sidebar-logo',
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
  }

  async init() {
    // Setup navigation FIRST - before loading content
    this.setupNavigation();
    
    await super.init();
    
    try {
      await this.loadAllContent();
      this.setupModalEventListeners();
      
      console.log('PlaylistTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('PlaylistTemplate: Error in template-specific init:', error);
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
      <article class="news-item">
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
      <div class="podcast-item">
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
      <div class="videocast-item">
        <img src="${videocast.imageUrl || '/assets/images/default-video.jpg'}" alt="${videocast.title}" loading="lazy">
        <div class="videocast-info">
          <h4>${videocast.title}</h4>
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
      case 'tv-online':
        console.log('TV Online section - to be implemented');
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
      
      const dayMapping = {
        'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
        'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
      };
      
      const getSpanishDay = (englishDay) => {
        if (!englishDay) return null;
        return dayMapping[englishDay.toLowerCase()] || englishDay;
      };
      
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      
      days.forEach(day => {
        const dayPrograms = programs.filter(p => getSpanishDay(p.day) === day);
        const dayContainer = document.getElementById(`${day.toLowerCase()}-programs`);
        
        if (dayContainer) {
          const timeline = dayContainer.querySelector('.programs-timeline');
          if (timeline) {
            if (dayPrograms.length === 0) {
              timeline.innerHTML = '<div class="empty-day">No hay programas para este día</div>';
            } else {
              timeline.innerHTML = dayPrograms.map(program => `
                <div class="program-item">
                  <span class="program-time">${program.startTime}</span>
                  <span class="program-name">${program.name}</span>
                </div>
              `).join('');
            }
          }
        }
      });
    } catch (error) {
      console.error('PlaylistTemplate: Error loading programs:', error);
      container.innerHTML = '<div class="error-message">Error al cargar la programación</div>';
    }
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
      
      const newsHtml = news.data.map(item => `
        <article class="news-item">
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
      
      const podcastsHtml = podcasts.data.map(podcast => `
        <div class="podcast-card">
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
      
      const videocastsHtml = videocasts.data.map(videocast => `
        <div class="videocast-card">
          <img src="${videocast.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${videocast.title}" loading="lazy">
          <div class="videocast-info">
            <h3>${videocast.title}</h3>
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
      
      const sponsorsHtml = sponsors.map(sponsor => `
        <div class="sponsor-card">
          <img src="${sponsor.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${sponsor.name}">
          <span>${sponsor.name}</span>
        </div>
      `).join('');
      
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
  
  async loadSocialNetworks() {
    const container = document.getElementById('social-view .view-content');
    if (!container) return;
    
    try {
      const dataManager = getDataManager();
      const social = await dataManager.loadSocialNetworks();
      
      if (!social || social.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay redes sociales configuradas</div>';
        return;
      }
      
      const socialHtml = social.map(item => `
        <a href="${item.url}" target="_blank" class="social-link-item">
          <i class="fab fa-${item.name}"></i>
          <span>${item.title || item.name}</span>
        </a>
      `).join('');
      
      container.innerHTML = `<div class="social-links-grid">${socialHtml}</div>`;
    } catch (error) {
      console.error('PlaylistTemplate: Error loading social networks:', error);
      container.innerHTML = '<div class="error-message">Error al cargar las redes sociales</div>';
    }
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
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modals.forEach(modal => modal.classList.remove('active'));
      }
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.playlistTemplate = new PlaylistTemplate();
    await window.playlistTemplate.init();
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
