# Guía para Crear Nuevos Templates

Este documento describe cómo crear un nuevo template para la app de radio usando la estructura centralizada.

## Estructura de Archivos

```
templates/
├── [nombre-template]/
│   ├── index.html          # Estructura HTML del template
│   └── assets/
│       ├── css/
│       │   └── style.css   # Estilos específicos del template
│       └── js/
│           └── main.js     # Lógica específica del template
```

## Paso 1: Crear la Estructura HTML

El archivo `index.html` debe contener:

### Elementos Obligatorios del Reproductor

```html
<!-- Audio element (ID configurable) -->
<audio id="radio-audio" preload="none"></audio>

<!-- Botón de play (ID configurable) -->
<button id="play-btn">
  <i class="fas fa-play"></i>
</button>

<!-- Control de volumen (ID configurable) -->
<input type="range" id="volume-slider" min="0" max="100" value="50">

<!-- Elementos de metadata (IDs configurables) -->
<span id="track-title">Radio</span>
<span id="track-artist">En Vivo</span>
<span id="listeners-count">0</span>
<span id="bitrate">N/A</span>
<span id="audio-quality">HD</span>
<img id="track-artwork" src="" style="display: none;">
<div id="default-artwork"></div>

<!-- Logo y nombre -->
<img id="news-logo" src="" alt="Logo" style="display: none;">
<span id="footer-title">Radio</span>

<!-- Fecha actual -->
<span id="current-date"></span>

<!-- Redes sociales (IDs configurables) -->
<div id="social-links"></div>
<div id="footer-social"></div>
```

### Contenedores de Contenido (Opcionales)

```html
<!-- Hero Carousel -->
<div class="hero-swiper">
  <div class="swiper-wrapper" id="hero-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- Breaking News -->
<div id="breaking-ticker"></div>

<!-- Featured News -->
<div class="news-masonry" id="featured-news-grid"></div>

<!-- Programs Timeline -->
<div id="programs-timeline"></div>

<!-- Sponsors Carousel -->
<div class="sponsors-swiper">
  <div class="swiper-wrapper" id="sponsors-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- All News Grid -->
<div class="news-grid" id="all-news-grid"></div>

<!-- Quick News -->
<div id="quick-news"></div>

<!-- Recent Tracks -->
<div id="recent-tracks"></div>
```

### Loading Overlay

```html
<div class="loading-overlay" id="loading-overlay">
  <img id="loading-logo-img" src="/assets/icons/icon-512x512.png" alt="Logo">
  <h2 id="loading-title">Cargando...</h2>
  <p id="loading-subtitle">Preparando la experiencia...</p>
</div>
```

## Paso 2: Crear el Archivo main.js

### Estructura Básica

```javascript
/**
 * Template [Nombre] - Refactorizado usando TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class MiTemplate extends TemplateBase {
  constructor() {
    super({
      // IDs del reproductor de audio
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      
      // IDs de redes sociales
      socialContainerIds: ['social-links', 'footer-social'],
      
      // IDs de elementos del DOM
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'track-title',
        trackArtist: 'track-artist',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'audio-quality',
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
    
    // Propiedades específicas del template
    this.heroSwiper = null;
    this.sponsorsSwiper = null;
  }

  async init() {
    // Llamar a la inicialización base
    await super.init();
    
    // Inicializar funcionalidades específicas del template
    try {
      this.setupCarousels();
      await this.loadAllContent();
      
      console.log('MiTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('MiTemplate: Error in template-specific init:', error);
    }
  }

  // ==========================================
  // MÉTODOS DE CONTENIDO
  // ==========================================

  // Cargar todo el contenido
  async loadAllContent() {
    try {
      const dataManager = getDataManager();
      
      // Cargar solo lo que necesita el template
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadFeaturedNews(),
        this.loadProgramsTimeline(),
        this.loadSponsorsCarousel()
      ]);
    } catch (error) {
      console.error('MiTemplate: Error loading content:', error);
    }
  }

  // Cargar hero carousel
  async loadHeroCarousel() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      
      if (news.data && news.data.length > 0) {
        // Construir URLs de imágenes
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderHeroCarousel(news.data);
      }
    } catch (error) {
      console.error('MiTemplate: Error loading hero carousel:', error);
    }
  }

  // Renderizar hero carousel
  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;

    const slidesHtml = news.map((item, index) => `
      <div class="swiper-slide" data-index="${index}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h2 class="hero-title">${item.name}</h2>
            <p class="hero-description">${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="swiper-wrapper">${slidesHtml}</div>`;
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
      console.error('MiTemplate: Error loading featured news:', error);
    }
  }

  renderFeaturedNews(news) {
    const container = document.getElementById('featured-news-grid');
    if (!container) return;

    const newsHtml = news.map(item => `
      <article class="news-card">
        <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.shortText || ''}</p>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar programas
  async loadProgramsTimeline() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs && programs.length > 0) {
        this.renderProgramsTimeline(programs);
      }
    } catch (error) {
      console.error('MiTemplate: Error loading programs:', error);
    }
  }

  renderProgramsTimeline(programs) {
    const container = document.getElementById('programs-timeline');
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

    const html = todayPrograms.map(program => `
      <div class="program-item">
        <span>${program.startTime}</span>
        <span>${program.name}</span>
      </div>
    `).join('');

    container.innerHTML = html;
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
      console.error('MiTemplate: Error loading sponsors:', error);
    }
  }

  renderSponsorsCarousel(sponsors) {
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;

    const html = sponsors.map(sponsor => `
      <div class="swiper-slide">
        <img src="${sponsor.logoUrl}" alt="${sponsor.name}">
      </div>
    `).join('');

    container.innerHTML = `<div class="swiper-wrapper">${html}</div>`;
  }

  // ==========================================
  // SETUP DE CAROUSELES (Opcional)
  // ==========================================

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    
    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      const heroSwiperEl = document.querySelector('.hero-swiper');
      
      if (heroSwiperEl && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: heroSlides.length > 1,
            autoplay: { delay: 5000 },
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (error) {
          console.warn('MiTemplate: Error initializing hero carousel:', error.message);
        }
      }
    }, 1000);
  }

  // ==========================================
  // MÉTODOS PARA SOBRESCRIBIR (Opcional)
  // ==========================================

  // Cuando se cargan datos básicos
  onBasicDataLoaded(data) {
    // Custom logic después de cargar datos básicos
  }

  // Cuando se carga la canción actual
  onCurrentSongLoaded(songData) {
    // Custom logic después de cargar canción
    // Actualizar sidebar stats si es necesario
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) listenersEl.textContent = songData.listeners || '0';
  }

  // Cuando se reproduce audio
  onAudioPlay() {
    super.onAudioPlay();
    // Custom animation cuando reproduce
  }

  // Cuando se pausa audio
  onAudioPause() {
    super.onAudioPause();
    // Custom animation cuando pausa
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.miTemplate = new MiTemplate();
    await window.miTemplate.init();
  } catch (error) {
    console.error('MiTemplate: Error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.miTemplate) {
    window.miTemplate.destroy();
  }
});

export default MiTemplate;
```

## Métodos Disponibles en TemplateBase

### Métodos de Datos (heredados automáticamente)
- `dataManager.loadBasicData()` - Carga datos básicos
- `dataManager.loadSocialNetworks()` - Carga redes sociales
- `dataManager.loadPrograms()` - Carga programas
- `dataManager.loadNews(page, limit)` - Carga noticias
- `dataManager.loadPodcasts(page, limit)` - Carga podcasts
- `dataManager.loadVideocasts(page, limit)` - Carga videocasts
- `dataManager.loadSponsors()` - Carga patrocinadores
- `dataManager.loadCurrentSong()` - Carga canción actual
- `dataManager.loadPromotions()` - Carga promociones
- `dataManager.getImageUrl(path)` - Construye URL de imagen

### Métodos de Setup (heredados automáticamente)
- `setupNavigation()` - Menú hamburguesa
- `setupFilters()` - Filtros
- `setupTabs()` - Tabs
- `showTab(tabName)` - Mostrar tab
- `setupModales()` - Modales
- `setupAnimations()` - AOS
- `setupRippleEffects()` - Efectos ripple
- `setCurrentDate()` - Fecha actual
- `toggleAudio()` - Play/pause
- `audioPlayer.setVolume(value)` - Ajustar volumen
- `audioPlayer.setStreamUrl(url)` - Establecer URL de stream
- `audioPlayer.play()` - Reproducir
- `audioPlayer.pause()` - Pausar

### Métodos para Sobrescribir
- `onBasicDataLoaded(data)` - Después de cargar datos
- `onSocialNetworksLoaded(data)` - Después de cargar redes
- `onCurrentSongLoaded(songData)` - Después de cargar canción
- `onAudioPlay()` - Cuando reproduce
- `onAudioPause()` - Cuando pausa
- `onAudioError(error)` - Cuando hay error
- `onVolumeChange(value)` - Cuando cambia volumen
- `loadContent()` - Cargar contenido adicional
- `applyFilter(filter)` - Aplicar filtro

## IDs de Elementos Comunes

| Elemento | ID por defecto |
|---------|----------------|
| Audio | `radio-audio` |
| Play button | `play-btn` |
| Volume slider | `volume-slider` |
| Track title | `track-title` |
| Track artist | `track-artist` |
| Oyentes | `listeners-count` |
| Bitrate | `bitrate` |
| Calidad | `audio-quality` |
| Artwork | `track-artwork` |
| Default artwork | `default-artwork` |
| Logo | `radio-logo` |
| Footer name | `footer-radio-name` |
| Fecha actual | `current-date` |
| Social links | `social-links` |
| Footer social | `footer-social` |

## Notas Importantes

1. **No duplicar métodos**: Los métodos de setup ya están en TemplateBase, no es necesario reescribirlos a menos que tengas lógica diferente.

2. **Construir URLs de imágenes**: Siempre usar `dataManager.getImageUrl(path)` para las imágenes de noticias, programas y sponsors.

3. **IDs de contenedor correctos**: Verificar que los IDs en el HTML coincidan con los configurados en `customDomIds`.

4. **Inicialización asíncrona**: Siempre usar `await super.init()` al principio del método `init()`.

5. **Limpieza al salir**: Siempre agregar el event listener `beforeunload` para destruir la instancia.

## Ejemplo de Template Minimalista

```javascript
import TemplateBase from '/assets/js/template-base.js';

class MiTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      socialContainerIds: ['social-links']
    });
  }

  async init() {
    await super.init();
    console.log('MiTemplate: Listo!');
  }
  
  // Solo sobrescribir lo necesario para el diseño
}

document.addEventListener('DOMContentLoaded', async () => {
  window.miTemplate = new MiTemplate();
  await window.miTemplate.init();
});

export default MiTemplate;
```