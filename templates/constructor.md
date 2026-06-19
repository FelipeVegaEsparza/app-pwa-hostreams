# Guía para Crear Nuevos Templates

Este documento describe cómo crear un nuevo template para la app de radio usando la estructura centralizada y consumiendo **todas las características** expuestas por la API del dashboard.

---

## Stack del Cliente

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `api.js` | `/assets/js/api.js` | Cliente HTTP con caché, rate limiting, retry y deduplicación |
| `data-manager.js` | `/assets/js/data-manager.js` | Singleton central con eventos para todos los datos |
| `template-base.js` | `/assets/js/template-base.js` | Clase base que deben extender todos los templates |
| `audio-player.js` | `/assets/js/audio-player.js` | Reproductor de audio (streaming) |
| `social-manager.js` | `/assets/js/social-manager.js` | Renderizado de redes sociales |
| `promotion-popup.js` | `/assets/js/promotion-popup.js` | Popup automático de promociones |
| `utils.js` | `/assets/js/utils.js` | Utilidades generales |

---

## Endpoints de la API Pública

La API base se construye como: `{ipstream_base_url}/{clientId}`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Datos completos del cliente |
| GET | `/basic-data` | Info básica (logo, nombre, URLs streaming) |
| GET | `/social-networks` | Redes sociales |
| GET | `/programs` | Programación |
| GET | `/news?page=&limit=` | Noticias paginadas |
| GET | `/news/{slug}` | Noticia por slug |
| GET | `/videos` | Ranking de videos |
| GET | `/sponsors` | Auspiciadores |
| GET | `/promotions` | Promociones |
| GET | `/podcasts?page=&limit=` | Podcasts paginados |
| GET | `/podcasts/{id}` | Podcast por ID |
| GET | `/videocasts?page=&limit=` | Videocasts paginados |
| GET | `/videocasts/{id}` | Videocast por ID |
| GET | `/galleries` | Galerías de imágenes |
| GET | `/announcers` | Locutores/conductores |
| GET | `/polls` | Encuestas activas |
| GET | `/events` | Eventos y transmisiones especiales |
| POST | `/polls/{id}/vote` | Votar en encuesta (`{ optionId }`) |
| POST | `/pwa/register` | Registrar instalación PWA (`{ deviceId }`) |

---

## Estructura de Archivos del Template

```
templates/
└── [nombre-template]/
    ├── index.html              # Estructura HTML
    └── assets/
        ├── css/
        │   └── style.css       # Estilos específicos
        └── js/
            └── main.js         # Lógica específica (extiende TemplateBase)
```

---

## Paso 1: Crear la Estructura HTML

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

<!-- Logo y nombre del proyecto -->
<img id="news-logo" src="" alt="Logo" style="display: none;">
<span id="footer-title">Radio</span>

<!-- Fecha actual -->
<span id="current-date"></span>

<!-- Redes sociales (IDs configurables) -->
<div id="social-links"></div>
<div id="footer-social"></div>

<!-- Botón de notificaciones push -->
<div id="notification-button-container"></div>
```

### Contenedores de Contenido (Opcionales)

```html
<!-- ============================================ -->
<!-- NOTICIAS                                     -->
<!-- ============================================ -->

<!-- Hero Carousel (slider principal) -->
<div class="hero-swiper">
  <div class="swiper-wrapper" id="hero-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- Breaking News (ticker) -->
<div id="breaking-ticker"></div>

<!-- Noticias destacadas (grilla) -->
<div class="news-masonry" id="featured-news-grid"></div>

<!-- Todas las noticias (grilla paginada) -->
<div class="news-grid" id="all-news-grid"></div>

<!-- Noticias rápidas -->
<div id="quick-news"></div>

<!-- Modal de detalle de noticia -->
<div id="news-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="news-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- PROGRAMACIÓN                                 -->
<!-- ============================================ -->

<!-- Timeline de programas de hoy -->
<div id="programs-timeline"></div>

<!-- Parrilla completa (7 días) -->
<div id="programs-grid"></div>

<!-- Modal de detalle de programa -->
<div id="program-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="program-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- PODCASTS                                     -->
<!-- ============================================ -->

<!-- Lista de podcasts -->
<div id="podcasts-list"></div>

<!-- Modal de reproductor de podcast -->
<div id="podcast-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="podcast-modal-body"></div>
    <audio id="podcast-audio" controls></audio>
  </div>
</div>


<!-- ============================================ -->
<!-- VIDECASTS                                    -->
<!-- ============================================ -->

<!-- Lista de videocasts -->
<div id="videocasts-list"></div>

<!-- Modal de reproductor de videocast (YouTube embed) -->
<div id="videocast-modal" class="modal">
  <div class="modal-content modal-lg">
    <button class="modal-close">&times;</button>
    <div id="videocast-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- VIDEOS / RANKING MUSICAL                     -->
<!-- ============================================ -->

<!-- Ranking de videos musicales -->
<div id="videos-ranking"></div>

<!-- Modal de video YouTube -->
<div id="video-modal" class="modal">
  <div class="modal-content modal-lg">
    <button class="modal-close">&times;</button>
    <div id="video-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- AUSPICIADORES                                -->
<!-- ============================================ -->

<!-- Carrusel de sponsors -->
<div class="sponsors-swiper">
  <div class="swiper-wrapper" id="sponsors-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- Grilla completa de sponsors -->
<div id="sponsors-grid"></div>


<!-- ============================================ -->
<!-- PROMOCIONES                                  -->
<!-- ============================================ -->

<!-- Popup automático (manejado por PromotionPopup) -->
<div id="promotion-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="promotion-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- GALERÍAS                                     -->
<!-- ============================================ -->

<!-- Lista de galerías -->
<div id="galleries-list"></div>

<!-- Galería de imágenes (lightbox) -->
<div id="gallery-modal" class="modal modal-lg">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="gallery-modal-body"></div>
    <div class="gallery-thumbnails" id="gallery-thumbnails"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- LOCUTORES                                    -->
<!-- ============================================ -->

<!-- Parrilla de locutores -->
<div id="announcers-grid"></div>


<!-- ============================================ -->
<!-- ENCUESTAS                                    -->
<!-- ============================================ -->

<!-- Lista de encuestas activas -->
<div id="polls-container"></div>

<!-- Plantilla de encuesta individual -->
<div class="poll-card" id="poll-template" style="display: none;">
  <h3 class="poll-question"></h3>
  <div class="poll-options"></div>
  <div class="poll-results" style="display: none;"></div>
  <p class="poll-voted-msg" style="display: none;">¡Gracias por votar!</p>
</div>


<!-- ============================================ -->
<!-- EVENTOS                                      -->
<!-- ============================================ -->

<!-- Timeline/lista de eventos -->
<div id="events-timeline"></div>


<!-- ============================================ -->
<!-- ÚLTIMOS TEMAS (SonicPanel)                   -->
<!-- ============================================ -->

<!-- Historial de canciones recientes -->
<div id="recent-tracks"></div>


<!-- ============================================ -->
<!-- PWA / NOTIFICACIONES                         -->
<!-- ============================================ -->

<!-- Botón de instalación PWA -->
<div id="pwa-install-button"></div>
```

### Loading Overlay

```html
<div class="loading-overlay" id="loading-overlay">
  <img id="loading-logo-img" src="/assets/icons/icon-512x512.png" alt="Logo">
  <h2 id="loading-title">Cargando...</h2>
  <p id="loading-subtitle">Preparando la experiencia...</p>
</div>
```

---

## Estructura de Datos de Cada Endpoint

### `GET /basic-data`
```json
{
  "projectName": "Radio Nombre",
  "projectDescription": "Descripción de la radio",
  "logoUrl": "/uploads/logo.png",
  "radioStreamingUrl": "https://stream.radio.cl/stream",
  "videoStreamingUrl": "https://video.radio.cl/hls/stream.m3u8"
}
```

### `GET /social-networks`
```json
{
  "facebook": "https://facebook.com/radio",
  "instagram": "https://instagram.com/radio",
  "youtube": "https://youtube.com/@radio",
  "tiktok": "https://tiktok.com/@radio",
  "whatsapp": "+56912345678",
  "x": "https://x.com/radio",
  "twitter": "https://twitter.com/radio",
  "telegram": "https://t.me/radio",
  "linkedin": "https://linkedin.com/company/radio"
}
```

### `GET /programs`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Programa",
    "description": "Descripción",
    "imageUrl": "/uploads/program.jpg",
    "startTime": "08:00",
    "endTime": "10:00",
    "weekDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "host": "Conductor Name"
  }
]
```

### `GET /news?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "name": "Título de la noticia",
      "slug": "titulo-de-la-noticia",
      "shortText": "Texto corto",
      "description": "Descripción completa (HTML)",
      "longText": "Texto largo (HTML)",
      "imageUrl": "/uploads/news.jpg",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "author": "Autor"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true,
    "totalPages": 5
  }
}
```

### `GET /news/{slug}`
Misma estructura que un item individual de `data[]`.

### `GET /videos`
```json
{
  "data": [
    {
      "id": "clxx...",
      "name": "Nombre del Video",
      "description": "Descripción",
      "videoUrl": "https://youtube.com/watch?v=...",
      "order": 1
    }
  ]
}
```

### `GET /sponsors`
```json
[
  {
    "id": "clxx...",
    "name": "Auspiciador",
    "description": "Descripción",
    "logoUrl": "/uploads/sponsor-logo.png",
    "website": "https://auspiciador.com",
    "address": "Dirección",
    "facebook": "https://facebook.com/auspiciador",
    "youtube": "https://youtube.com/@auspiciador",
    "instagram": "https://instagram.com/auspiciador",
    "tiktok": "https://tiktok.com/@auspiciador",
    "whatsapp": "https://wa.me/...",
    "x": "https://x.com/auspiciador"
  }
]
```

### `GET /promotions`
```json
[
  {
    "id": "clxx...",
    "title": "Título de la Promoción",
    "description": "Descripción",
    "imageUrl": "/uploads/promotion.jpg",
    "link": "https://ejemplo.com/oferta"
  }
]
```

### `GET /podcasts?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "title": "Título del Episodio",
      "description": "Descripción (HTML)",
      "shortText": "Texto corto",
      "imageUrl": "/uploads/podcast.jpg",
      "audioUrl": "/uploads/podcast.mp3",
      "duration": "15:30",
      "episodeNumber": 5,
      "season": 1,
      "createdAt": "2025-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "hasMore": true,
    "totalPages": 3
  }
}
```

### `GET /podcasts/{id}`
Misma estructura que un item individual de `data[]`.

### `GET /videocasts?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "title": "Título del Videocast",
      "description": "Descripción",
      "imageUrl": "/uploads/videocast.jpg",
      "videoUrl": "https://youtube.com/watch?v=...",
      "duration": "10:00",
      "createdAt": "2025-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "hasMore": true,
    "totalPages": 2
  }
}
```

### `GET /videocasts/{id}`
Misma estructura que un item individual de `data[]`.

### `GET /galleries`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre de la Galería",
    "description": "Descripción",
    "imageUrl": "/uploads/gallery-cover.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "images": [
      {
        "id": "clxx...",
        "imageUrl": "/uploads/gallery/img1.jpg",
        "order": 1
      }
    ]
  }
]
```

### `GET /announcers`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Locutor",
    "biography": "Biografía del locutor",
    "photoUrl": "/uploads/announcer.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
]
```

### `GET /polls`
```json
[
  {
    "id": "clxx...",
    "question": "¿Cuál es tu género musical favorito?",
    "active": true,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "options": [
      {
        "id": "clxx...",
        "text": "Rock",
        "votes": 42
      },
      {
        "id": "clxx...",
        "text": "Pop",
        "votes": 35
      }
    ]
  }
]
```

### `GET /events`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Evento",
    "description": "Descripción",
    "date": "2025-06-15",
    "time": "20:00",
    "location": "Teatro Municipal",
    "imageUrl": "/uploads/event.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
]
```

### `POST /polls/{id}/vote`
```json
// Request
{ "optionId": "clxx..." }

// Response
{ "success": true, "message": "Voto registrado" }
```

### `POST /pwa/register`
```json
// Request
{ "deviceId": "uuid-del-dispositivo" }

// Response
{ "success": true }
```

### SonicPanel (canción actual)

Endpoint externo configurado en `config.json` → `sonicpanel_api_url`. Transformado por `getCurrentSong()`:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "fullTitle": "Artist - Song Title",
  "art": "https://.../album-art.jpg",
  "listeners": 42,
  "uniqueListeners": 38,
  "bitrate": "128",
  "djUsername": "DJ Name",
  "djProfile": "https://...",
  "history": [
    "1.) Artist - Song<br>",
    "2.) Artist - Song<br>"
  ]
}
```

---

## Paso 2: Crear el Archivo `main.js`

### Estructura Completa (con todos los módulos)

```javascript
/**
 * Template [Nombre] - Usando todas las características de la API
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';
import { PromotionPopup } from '/assets/js/promotion-popup.js';

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

        // Noticias
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-ticker',
        featuredNews: 'featured-news-grid',
        allNewsGrid: 'all-news-grid',
        newsModal: 'news-modal',
        newsModalBody: 'news-modal-body',

        // Programación
        programsTimeline: 'programs-timeline',
        programsGrid: 'programs-grid',
        programModal: 'program-modal',
        programModalBody: 'program-modal-body',

        // Podcasts
        podcastsList: 'podcasts-list',
        podcastModal: 'podcast-modal',
        podcastModalBody: 'podcast-modal-body',
        podcastAudio: 'podcast-audio',

        // Videocasts
        videocastsList: 'videocasts-list',
        videocastModal: 'videocast-modal',
        videocastModalBody: 'videocast-modal-body',

        // Videos
        videosRanking: 'videos-ranking',
        videoModal: 'video-modal',
        videoModalBody: 'video-modal-body',

        // Sponsors
        sponsorsCarousel: 'sponsors-carousel',
        sponsorsGrid: 'sponsors-grid',

        // Promociones
        promotionModal: 'promotion-modal',
        promotionModalBody: 'promotion-modal-body',

        // Galerías
        galleriesList: 'galleries-list',
        galleryModal: 'gallery-modal',
        galleryModalBody: 'gallery-modal-body',
        galleryThumbnails: 'gallery-thumbnails',

        // Locutores
        announcersGrid: 'announcers-grid',

        // Encuestas
        pollsContainer: 'polls-container',

        // Eventos
        eventsTimeline: 'events-timeline',

        // Últimos temas
        recentTracks: 'recent-tracks'
      }
    });

    this.heroSwiper = null;
    this.sponsorsSwiper = null;
    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
  }

  async init() {
    await super.init();

    try {
      // Cargar todo el contenido disponible
      await this.loadAllContent();

      // Inicializar popup de promociones
      this.initPromotionPopup();

      // Configurar Swipers/carrousels
      this.setupCarousels();

      // Configurar manejadores de modales
      this.setupModalHandlers();

      console.log('MiTemplate: Template fully initialized!');
    } catch (error) {
      console.error('MiTemplate: Error in template-specific init:', error);
    }
  }

  // ==========================================
  // CARGA DE CONTENIDO
  // ==========================================

  async loadAllContent() {
    try {
      const dm = getDataManager();

      // Carga masiva de todos los contenidos
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadBreakingNews(),
        this.loadFeaturedNews(),
        this.loadAllNews(),
        this.loadProgramsTimeline(),
        this.loadProgramsGrid(),
        this.loadPodcastsList(),
        this.loadVideocastsList(),
        this.loadVideosRanking(),
        this.loadSponsorsCarousel(),
        this.loadSponsorsGrid(),
        this.loadGalleriesList(),
        this.loadAnnouncersGrid(),
        this.loadPolls(),
        this.loadEventsTimeline(),
        this.loadRecentTracks()
      ]);
    } catch (error) {
      console.error('MiTemplate: Error loading content:', error);
    }
  }

  // -------------------- NOTICIAS --------------------

  async loadHeroCarousel() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 5);
    if (!news.data || !news.data.length) return;
    for (const item of news.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    this.renderHeroCarousel(news.data);
  }

  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;
    container.innerHTML = `<div class="swiper-wrapper">${news.map((item, i) => `
      <div class="swiper-slide" data-slug="${item.slug}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h2>${item.name}</h2>
            <p>${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    `).join('')}</div>`;
  }

  async loadBreakingNews() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 3);
    if (!news.data || !news.data.length) return;
    const container = document.getElementById('breaking-ticker');
    if (!container) return;
    container.innerHTML = news.data.map(n => `
      <span class="breaking-item" data-slug="${n.slug}">${n.name}</span>
    `).join('');
  }

  async loadFeaturedNews() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 6);
    if (!news.data || !news.data.length) return;
    for (const item of news.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('featured-news-grid');
    if (!container) return;
    container.innerHTML = news.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <h3>${item.name}</h3>
        <p>${item.shortText || ''}</p>
      </article>
    `).join('');
  }

  async loadAllNews() {
    const dm = getDataManager();
    const result = await dm.loadNews(1, 10);
    this.renderNewsGrid(result);
  }

  renderNewsGrid(result) {
    const container = document.getElementById('all-news-grid');
    if (!container || !result.data) return;
    container.innerHTML = result.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl ? dm.getImageUrl(item.imageUrl) : '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <h3>${item.name}</h3>
        <p>${item.shortText || ''}</p>
        <small>${new Date(item.createdAt).toLocaleDateString('es-ES')}</small>
      </article>
    `).join('');
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = `
      <h2>${news.name}</h2>
      ${news.imageUrl ? `<img src="${news.imageUrl}" alt="${news.name}" class="news-detail-img">` : ''}
      <div class="news-content">${news.longText || news.description || news.shortText || ''}</div>
      <small>${new Date(news.createdAt).toLocaleDateString('es-ES')} ${news.author ? `— ${news.author}` : ''}</small>
    `;
    this.openModal('news-modal');
  }

  // -------------------- PROGRAMACIÓN --------------------

  async loadProgramsTimeline() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) return;
    const dayMap = { monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles',
      thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo' };
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const todayProgs = programs.filter(p =>
      (p.weekDays || []).some(d => dayMap[d.toLowerCase()] === today) ||
      (p.day && p.day.toLowerCase() === today)
    );
    const container = document.getElementById('programs-timeline');
    if (!container) return;
    container.innerHTML = todayProgs.length
      ? todayProgs.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
          .map(p => `<div class="program-item" data-id="${p.id}">
            <span class="program-time">${p.startTime}</span>
            <span class="program-name">${p.name}</span>
          </div>`).join('')
      : '<p class="empty-state">No hay programas para hoy</p>';
  }

  async loadProgramsGrid() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) return;
    const dayMap = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
    const grouped = {};
    for (const p of programs) {
      const days = p.weekDays || (p.day ? [p.day] : []);
      for (const d of days) {
        const esDay = dayMap[d.toLowerCase()] || d;
        if (!grouped[esDay]) grouped[esDay] = [];
        grouped[esDay].push(p);
      }
    }
    const container = document.getElementById('programs-grid');
    if (!container) return;
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    container.innerHTML = daysOrder.map(day => `
      <div class="program-day">
        <h4>${day}</h4>
        ${(grouped[day] || [])
          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
          .map(p => `<div class="program-item" data-id="${p.id}">
            <span>${p.startTime} - ${p.endTime || ''}</span>
            <strong>${p.name}</strong>
          </div>`).join('') || '<p class="empty-state">Sin programas</p>'}
      </div>
    `).join('');
  }

  // -------------------- PODCASTS --------------------

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(1, 10);
    const container = document.getElementById('podcasts-list');
    if (!container || !result.data) return;
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    container.innerHTML = result.data.map(p => `
      <div class="podcast-card" data-id="${p.id}">
        <img src="${p.imageUrl || '/assets/images/default-podcast.jpg'}" alt="${p.title}" loading="lazy">
        <h3>${p.title}</h3>
        <p>${p.shortText || ''}</p>
        <small>${p.duration || ''} · ${new Date(p.createdAt).toLocaleDateString('es-ES')}</small>
      </div>
    `).join('');
  }

  async loadPodcastDetail(id) {
    const dm = getDataManager();
    const podcast = await dm.loadPodcastById(id);
    if (!podcast) return;
    if (podcast.imageUrl) podcast.imageUrl = await dm.getImageUrl(podcast.imageUrl);
    const body = document.getElementById('podcast-modal-body');
    const audio = document.getElementById('podcast-audio');
    if (body) {
      body.innerHTML = `
        <h2>${podcast.title}</h2>
        ${podcast.imageUrl ? `<img src="${podcast.imageUrl}" alt="${podcast.title}">` : ''}
        <p>${podcast.description || podcast.shortText || ''}</p>
      `;
    }
    if (audio) {
      audio.src = podcast.audioUrl || podcast.fileUrl || podcast.url || podcast.audio || '';
      audio.load();
    }
    this.openModal('podcast-modal');
    if (audio) audio.play().catch(() => {});
  }

  // -------------------- VIDECASTS --------------------

  async loadVideocastsList() {
    const dm = getDataManager();
    const result = await dm.loadVideocasts(1, 10);
    const container = document.getElementById('videocasts-list');
    if (!container || !result.data) return;
    container.innerHTML = result.data.map(v => `
      <div class="videocast-card" data-id="${v.id}">
        <div class="videocast-thumb" style="background-image: url('${v.imageUrl || ''}')">
          <div class="play-icon">▶</div>
        </div>
        <h3>${v.title}</h3>
        <small>${v.duration || ''}</small>
      </div>
    `).join('');
  }

  async loadVideocastDetail(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const videoId = this.extractYouTubeId(vc.videoUrl);
    body.innerHTML = videoId
      ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>
         <h2>${vc.title}</h2>
         <p>${vc.description || ''}</p>`
      : `<p>Video no disponible</p>`;
    this.openModal('videocast-modal');
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // -------------------- VIDEOS (RANKING) --------------------

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    const videos = result.data || result || [];
    if (!videos.length) return;
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(v => `
        <div class="video-ranking-item" data-url="${v.videoUrl}">
          <span class="rank-num">${v.order || ''}</span>
          <div class="rank-info">
            <strong>${v.name}</strong>
            <p>${v.description || ''}</p>
          </div>
        </div>
      `).join('');
  }

  // -------------------- SPONSORS --------------------

  async loadSponsorsCarousel() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) return;
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;
    container.innerHTML = `<div class="swiper-wrapper">${sponsors.map(s => `
      <div class="swiper-slide">
        <a href="${s.website || '#'}" target="_blank" rel="noopener">
          <img src="${s.logoUrl}" alt="${s.name}" title="${s.name}">
        </a>
      </div>
    `).join('')}</div>`;
  }

  async loadSponsorsGrid() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) return;
    const container = document.getElementById('sponsors-grid');
    if (!container) return;
    container.innerHTML = sponsors.map(s => `
      <div class="sponsor-card">
        ${s.logoUrl ? `<img src="${dm.getImageUrl(s.logoUrl)}" alt="${s.name}" loading="lazy">` : ''}
        <h3>${s.name}</h3>
        <p>${s.description || ''}</p>
        ${s.website ? `<a href="${s.website}" target="_blank">Sitio web</a>` : ''}
      </div>
    `).join('');
  }

  // -------------------- PROMOCIONES --------------------

  initPromotionPopup() {
    try {
      window.promotionPopup = new PromotionPopup(getDataManager());
    } catch (error) {
      console.warn('MiTemplate: Promotion popup not available:', error);
    }
  }

  // -------------------- GALERÍAS --------------------

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    if (!galleries || !galleries.length) return;
    const container = document.getElementById('galleries-list');
    if (!container) return;
    for (const g of galleries) {
      if (g.imageUrl) g.imageUrl = await dm.getImageUrl(g.imageUrl);
    }
    container.innerHTML = galleries.map(g => `
      <div class="gallery-card" data-id="${g.id}">
        ${g.imageUrl ? `<img src="${g.imageUrl}" alt="${g.name}" loading="lazy">` : ''}
        <h3>${g.name}</h3>
        <p>${g.description || ''}</p>
        <small>${(g.images || []).length} imágenes</small>
      </div>
    `).join('');
  }

  async openGallery(id) {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    const gallery = (galleries || []).find(g => g.id === id);
    if (!gallery) return;
    const body = document.getElementById('gallery-modal-body');
    const thumbs = document.getElementById('gallery-thumbnails');
    if (body) {
      body.innerHTML = gallery.images && gallery.images.length
        ? `<img src="${dm.getImageUrl(gallery.images[0].imageUrl)}" class="gallery-main-img">`
        : '<p>Sin imágenes</p>';
    }
    if (thumbs && gallery.images) {
      thumbs.innerHTML = gallery.images
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(img => `<img src="${dm.getImageUrl(img.imageUrl)}" class="gallery-thumb" data-url="${dm.getImageUrl(img.imageUrl)}">`)
        .join('');
    }
    this.openModal('gallery-modal');
  }

  // -------------------- LOCUTORES --------------------

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) return;
    const container = document.getElementById('announcers-grid');
    if (!container) return;
    for (const a of announcers) {
      if (a.photoUrl) a.photoUrl = await dm.getImageUrl(a.photoUrl);
    }
    container.innerHTML = announcers.map(a => `
      <div class="announcer-card">
        <div class="announcer-photo">
          <img src="${a.photoUrl || '/assets/images/default-avatar.jpg'}" alt="${a.name}" loading="lazy">
        </div>
        <h3>${a.name}</h3>
        <p>${a.biography || ''}</p>
      </div>
    `).join('');
  }

  // -------------------- ENCUESTAS --------------------

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) return;
    const container = document.getElementById('polls-container');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll => `
      <div class="poll-card" data-id="${poll.id}">
        <h3 class="poll-question">${poll.question}</h3>
        <div class="poll-options">
          ${(poll.options || []).map(opt => `
            <button class="poll-option" data-poll-id="${poll.id}" data-option-id="${opt.id}">
              ${opt.text}
              <span class="poll-bar" style="width: 0%"></span>
              <span class="poll-count">${opt.votes || 0}</span>
            </button>
          `).join('')}
        </div>
        <p class="poll-voted-msg" style="display: none;">¡Gracias por votar!</p>
      </div>
    `).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      // Recargar encuestas para ver resultados actualizados
      const polls = await dm.loadPolls();
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
      const card = document.querySelector(`.poll-card[data-id="${pollId}"]`);
      if (!card) return;
      const options = card.querySelectorAll('.poll-option');
      options.forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-bar').style.width = `${pct}%`;
        btn.querySelector('.poll-count').textContent = `${opt.votes} (${pct}%)`;
        btn.disabled = true;
      });
      card.querySelector('.poll-voted-msg').style.display = 'block';
    } catch (error) {
      console.error('MiTemplate: Error voting:', error);
      alert('Error al registrar tu voto. Intenta de nuevo.');
    }
  }

  // -------------------- EVENTOS --------------------

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) return;
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(e => `
      <div class="event-item">
        <div class="event-date">
          <span class="event-day">${new Date(e.date).getDate()}</span>
          <span class="event-month">${new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
        </div>
        <div class="event-info">
          <h3>${e.name}</h3>
          <p>${e.description || ''}</p>
          <small>${e.time || ''}${e.location ? ` · ${e.location}` : ''}</small>
        </div>
      </div>
    `).join('');
  }

  // -------------------- ÚLTIMOS TEMAS --------------------

  async loadRecentTracks() {
    try {
      const dm = getDataManager();
      const song = await dm.loadCurrentSong();
      if (!song || !song.history) return;
      const container = document.getElementById('recent-tracks');
      if (!container) return;
      container.innerHTML = song.history.map(track => `
        <div class="track-item">${track}</div>
      `).join('');
    } catch (error) {
      // Silencioso — no crítico
    }
  }

  // ==========================================
  // CONFIGURACIÓN DE CAROUSELES
  // ==========================================

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      if (document.querySelector('.hero-swiper') && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: heroSlides.length > 1,
            autoplay: { delay: 5000 },
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (e) {
          console.warn('Error initializing hero carousel:', e.message);
        }
      }
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      if (document.querySelector('.sponsors-swiper') && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: sponsorSlides.length > 1,
            autoplay: { delay: 3000 },
            slidesPerView: 'auto',
            spaceBetween: 20
          });
        } catch (e) {
          console.warn('Error initializing sponsors carousel:', e.message);
        }
      }
    }, 1000);
  }

  // ==========================================
  // MANEJADORES DE MODALES Y EVENTOS
  // ==========================================

  setupModalHandlers() {
    // Cerrar modales al hacer clic en X o fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      }
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    // Delegación de eventos para contenido dinámico
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-slug]');
      if (target) {
        e.preventDefault();
        this.loadNewsDetail(target.dataset.slug);
        return;
      }

      const podcastCard = e.target.closest('[data-id]');
      if (podcastCard && podcastCard.closest('#podcasts-list')) {
        this.loadPodcastDetail(podcastCard.dataset.id);
        return;
      }

      const videocastCard = e.target.closest('[data-id]');
      if (videocastCard && videocastCard.closest('#videocasts-list')) {
        this.loadVideocastDetail(videocastCard.dataset.id);
        return;
      }

      const videoItem = e.target.closest('[data-url]');
      if (videoItem && videoItem.closest('#videos-ranking')) {
        e.preventDefault();
        const videoId = this.extractYouTubeId(videoItem.dataset.url);
        if (videoId) {
          const body = document.getElementById('video-modal-body');
          if (body) {
            body.innerHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
          }
          this.openModal('video-modal');
        }
        return;
      }

      const galleryCard = e.target.closest('[data-id]');
      if (galleryCard && galleryCard.closest('#galleries-list')) {
        this.openGallery(galleryCard.dataset.id);
        return;
      }

      const galleryThumb = e.target.closest('.gallery-thumb');
      if (galleryThumb) {
        const main = document.querySelector('.gallery-main-img');
        if (main) main.src = galleryThumb.dataset.url;
        return;
      }

      const pollOption = e.target.closest('.poll-option');
      if (pollOption && !pollOption.disabled) {
        this.handleVote(pollOption.dataset.pollId, pollOption.dataset.optionId);
        return;
      }
    });
  }

  // ==========================================
  // UTILIDADES DE MODAL
  // ==========================================

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
    // Pausar audio si se cierra el modal de podcast
    const audio = document.getElementById('podcast-audio');
    if (audio && !audio.paused) audio.pause();
  }

  // ==========================================
  // GESTIÓN DEL COVER ARTWORK
  // ==========================================
  //
  // TemplateBase ya gestiona el artwork automáticamente para los elementos
  // estándar (trackArtwork / defaultArtwork). Solo necesitas los helpers
  // _setHeroCover / _showHeroDefault si tu template tiene elementos
  // de cover personalizados (hero background, dual artworks, etc.).
  //
  // this._radioCoverUrl está disponible como fallback desde la carga
  // de datos básicos (lo resuelve TemplateBase.loadBasicData).
  //
  // Patrón recomendado cuando sobrescribes onCurrentSongLoaded:
  //
  // onCurrentSongLoaded(songData) {
  //   const artUrl = songData.art || '';
  //
  //   if (artUrl && artUrl !== coverImg?.src) {
  //     const img = new Image();
  //     img.onload = () => this._setHeroCover(artUrl);
  //     img.onerror = () => {
  //       if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
  //       else this._showHeroDefault();
  //     };
  //     img.src = artUrl;
  //   } else if (!artUrl) {
  //     if (this._radioCoverUrl && coverImg?.src !== this._radioCoverUrl) {
  //       this._setHeroCover(this._radioCoverUrl);
  //     } else if (!this._radioCoverUrl) {
  //       this._showHeroDefault();
  //     }
  //   }
  // }

  // ==========================================
  // HOOKS PARA SOBRESCRIBIR
  // ==========================================

  onBasicDataLoaded(data) {
    // Si tu template tiene elementos de cover personalizados (distintos
    // a trackArtwork / defaultArtwork), usa this._radioCoverUrl aquí:
    //
    // if (this._radioCoverUrl) {
    //   const coverImg = document.getElementById('mi-cover');
    //   const heroBg = document.getElementById('mi-hero-bg');
    //   coverImg.src = this._radioCoverUrl;
    //   coverImg.style.display = 'block';
    //   heroBg.style.backgroundImage = 'url(' + this._radioCoverUrl + ')';
    // }
  }

  onSocialNetworksLoaded(data) {
    // Custom logic después de cargar redes sociales
  }

  onCurrentSongLoaded(songData) {
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) listenersEl.textContent = songData.listeners || '0';
    const historyEl = document.getElementById('recent-tracks');
    if (historyEl && songData.history) {
      // Actualizar tracks recientes en vivo
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
  }

  onAudioPause() {
    super.onAudioPause();
  }

  onAudioError(error) {
    console.error('MiTemplate: Audio error:', error);
  }

  onVolumeChange(value) {
    // Custom logic al cambiar volumen
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

---

## Referencia Completa de la API

### Funciones de `api.js`

| Función | Descripción |
|---------|-------------|
| `getAllClientData()` | Datos completos del cliente |
| `getBasicData()` | Info básica (logo, nombre, URLs streaming) |
| `getVideoStreamingUrl()` | URL de video streaming (HLS) |
| `getPrograms()` | Programación completa |
| `getNews(page, limit)` | Noticias paginadas |
| `getNewsBySlug(slug)` | Noticia por slug |
| `getVideos()` | Ranking de videos musicales |
| `getSponsors()` | Auspiciadores |
| `getPromotions()` | Promociones |
| `getPodcasts(page, limit)` | Podcasts paginados |
| `getPodcastById(id)` | Podcast por ID |
| `getVideocasts(page, limit)` | Videocasts paginados |
| `getVideocastById(id)` | Videocast por ID |
| `getGalleries()` | Galerías de imágenes |
| `getAnnouncers()` | Locutores |
| `getPolls()` | Encuestas activas |
| `votePoll(pollId, optionId)` | Votar en encuesta |
| `getEvents()` | Eventos |
| `registerPwaInstall(deviceId)` | Registrar instalación PWA |
| `getSocialNetworks()` | Redes sociales |
| `getSonicPanelInfo()` | Estado del stream (SonicPanel) |
| `getCurrentSong()` | Canción actual (transformada) |
| `buildImageUrl(path)` | Construye URL absoluta de imagen |
| `clearAPICache()` | Limpia toda la caché |
| `invalidateAPICache(pattern)` | Invalida caché por patrón |
| `getCacheStats()` | Estadísticas de caché |

### Métodos de `DataManager`

| Método | Descripción | Evento emitido |
|--------|-------------|----------------|
| `loadBasicData()` | Carga datos básicos | `basicDataLoaded` |
| `loadSocialNetworks()` | Carga redes sociales | `socialNetworksLoaded` |
| `loadPrograms()` | Carga programas | `programsLoaded` |
| `loadNews(page, limit)` | Carga noticias | `newsLoaded` |
| `loadNewsBySlug(slug)` | Carga noticia por slug | `newsBySlugLoaded` |
| `loadPodcasts(page, limit)` | Carga podcasts | `podcastsLoaded` |
| `loadVideocasts(page, limit)` | Carga videocasts | `videocastsLoaded` |
| `loadPodcastById(id)` | Carga podcast por ID | `podcastLoaded` |
| `loadVideocastById(id)` | Carga videocast por ID | `videocastLoaded` |
| `loadVideos()` | Carga ranking de videos | `videosLoaded` |
| `loadSponsors()` | Carga auspiciadores | `sponsorsLoaded` |
| `loadPromotions()` | Carga promociones | `promotionsLoaded` |
| `loadGalleries()` | Carga galerías | `galleriesLoaded` |
| `loadAnnouncers()` | Carga locutores | `announcersLoaded` |
| `loadPolls()` | Carga encuestas activas | `pollsLoaded` |
| `loadEvents()` | Carga eventos | `eventsLoaded` |
| `votePoll(pollId, optionId)` | Vota en una encuesta | `pollVoted` |
| `registerPwaInstall(deviceId)` | Registra instalación PWA | — |
| `loadCurrentSong()` | Carga canción actual | `currentSongLoaded` |
| `loadVideoStreamUrl()` | Carga URL de video streaming | `videoStreamUrlLoaded` |
| `getImageUrl(path)` | Construye URL absoluta de imagen | — |
| `loadAllBasicData()` | Carga datos básicos + redes + canción | — |
| `loadAllContent()` | Carga **todos** los contenidos disponibles | — |
| `startSonicPanelUpdates(interval)` | Inicia polling cada N ms | — |
| `stopSonicPanelUpdates()` | Detiene polling | — |
| `clearCache()` | Limpia caché de API y datos internos | — |

### Getters de `DataManager`

```javascript
getBasicData()
getSocialNetworks()
getPrograms()
getNews()
getPodcasts()
getVideocasts()
getVideos()
getSponsors()
getPromotions()
getGalleries()
getAnnouncers()
getPolls()
getEvents()
getCurrentSong()
getVideoStreamUrl()
```

---

## Métodos Disponibles en `TemplateBase`

### Métodos de Setup (heredados automáticamente)

| Método | Descripción |
|--------|-------------|
| `setupNavigation()` | Menú hamburguesa responsive |
| `setupFilters()` | Filtros de contenido |
| `setupTabs()` | Sistema de tabs |
| `showTab(tabName)` | Mostrar tab específico |
| `setupModales()` | Inicialización de modales |
| `setupAnimations()` | Animaciones (AOS) |
| `setupRippleEffects()` | Efectos ripple en botones |
| `setCurrentDate()` | Renderiza fecha actual en español |
| `toggleAudio()` | Play/pause del stream |
| `audioPlayer.setVolume(value)` | Ajustar volumen |
| `audioPlayer.setStreamUrl(url)` | Establecer URL de stream |
| `audioPlayer.play()` | Iniciar reproducción |
| `audioPlayer.pause()` | Pausar reproducción |

---

## Gestión del Cover Artwork (Hero / Track)

### Comportamiento automático en `TemplateBase`

La clase base maneja el cover artwork de forma transparente:

1. **Carga inicial** (`loadBasicData`):
   - Resuelve `coverUrl` (o `logoUrl` como fallback) y lo almacena en `this._radioCoverUrl`
   - Si el template usa los IDs estándar (`trackArtwork` / `defaultArtwork`), asigna el cover de la radio como artwork inicial — sin imagen rota

2. **Actualización desde SonicPanel** (`updateCurrentSongDisplay`):
   - Si `songData.art` existe: precarga con `new Image()` + `onload` / `onerror`
   - Si `songData.art` falla: cae automáticamente a `this._radioCoverUrl`
   - Si no hay `songData.art`: mantiene el cover de la radio en lugar de ocultarlo

### Templates con elementos de cover personalizados

Si tu template tiene elementos de cover distintos a los IDs estándar (ej: `#cover-artwork` + `#hero-player-bg` como en los templates app, covered, moderno, tradicional), debes:

1. **Sobrescribir `onBasicDataLoaded`** — mostrar el cover de la radio como inicial:
```js
onBasicDataLoaded(data) {
  if (this._radioCoverUrl) {
    const coverImg = document.getElementById('mi-cover-img');
    const defaultEl = document.getElementById('mi-cover-default');
    const heroBg = document.getElementById('mi-hero-bg');
    if (coverImg) {
      coverImg.src = this._radioCoverUrl;
      coverImg.style.display = 'block';
      if (defaultEl) defaultEl.style.display = 'none';
    }
    if (heroBg) {
      heroBg.style.backgroundImage = 'url(' + this._radioCoverUrl + ')';
      heroBg.classList.add('loaded');
    }
  }
}
```

2. **Implementar helpers** `_setHeroCover(url)` y `_showHeroDefault()` para reutilizar la lógica.

3. **En `onCurrentSongLoaded`**, usar el patrón con `onerror`:
```js
onCurrentSongLoaded(songData) {
  const artUrl = songData.art || '';
  const coverImg = document.getElementById('mi-cover-img');

  if (artUrl && artUrl !== coverImg?.src) {
    const img = new Image();
    img.onload = () => this._setHeroCover(artUrl);
    img.onerror = () => {
      if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
      else this._showHeroDefault();
    };
    img.src = artUrl;
  } else if (!artUrl) {
    if (this._radioCoverUrl && coverImg?.src !== this._radioCoverUrl) {
      this._setHeroCover(this._radioCoverUrl);
    } else if (!this._radioCoverUrl) {
      this._showHeroDefault();
    }
  }
}
```

### Métodos para Sobrescribir en el Template

| Método | Cuándo se ejecuta |
|--------|-------------------|
| `onBasicDataLoaded(data)` | Después de cargar datos básicos |
| `onSocialNetworksLoaded(data)` | Después de cargar redes sociales |
| `onCurrentSongLoaded(songData)` | Cada 30s (polling SonicPanel) |
| `onAudioPlay()` | Cuando inicia la reproducción |
| `onAudioPause()` | Cuando se pausa |
| `onAudioError(error)` | Cuando hay un error de audio |
| `onVolumeChange(value)` | Cuando cambia el volumen |
| `loadContent()` | Cargar contenido adicional personalizado |
| `applyFilter(filter)` | Aplicar filtro personalizado |
| `destroy()` | Limpieza al cerrar/destruir el template |

---

## IDs de Elementos del DOM

| Elemento | ID por defecto | Requerido |
|----------|----------------|-----------|
| Audio | `radio-audio` | Sí |
| Play button | `play-btn` | Sí |
| Volume slider | `volume-slider` | Sí |
| Track title | `track-title` | Sí |
| Track artist | `track-artist` | Sí |
| Oyentes | `listeners-count` | No |
| Bitrate | `bitrate` | No |
| Calidad | `audio-quality` | No |
| Artwork | `track-artwork` | No |
| Default artwork | `default-artwork` | No |
| | | |
| Cover de radio | *(automático)* | — |
| | `this._radioCoverUrl` se asigna como artwork inicial y fallback ante errores de carga o ausencia de `songData.art` |
| Logo | `radio-logo` | No |
| Footer name | `footer-radio-name` | No |
| Fecha actual | `current-date` | No |
| Social links | `social-links` | No |
| Footer social | `footer-social` | No |
| Hero carousel | `hero-carousel` | No |
| Breaking news | `breaking-ticker` | No |
| Featured news | `featured-news-grid` | No |
| All news grid | `all-news-grid` | No |
| Quick news | `quick-news` | No |
| News modal body | `news-modal-body` | No |
| Programs timeline | `programs-timeline` | No |
| Programs grid | `programs-grid` | No |
| Podcasts list | `podcasts-list` | No |
| Podcast modal body | `podcast-modal-body` | No |
| Podcast audio | `podcast-audio` | No |
| Videocasts list | `videocasts-list` | No |
| Videocast modal body | `videocast-modal-body` | No |
| Videos ranking | `videos-ranking` | No |
| Video modal body | `video-modal-body` | No |
| Sponsors carousel | `sponsors-carousel` | No |
| Sponsors grid | `sponsors-grid` | No |
| Promotion modal body | `promotion-modal-body` | No |
| Galleries list | `galleries-list` | No |
| Gallery modal body | `gallery-modal-body` | No |
| Gallery thumbnails | `gallery-thumbnails` | No |
| Announcers grid | `announcers-grid` | No |
| Polls container | `polls-container` | No |
| Events timeline | `events-timeline` | No |
| Recent tracks | `recent-tracks` | No |
| Notification button | `notification-button-container` | No |
| PWA install button | `pwa-install-button` | No |
| Loading overlay | `loading-overlay` | No |
| Loading logo | `loading-logo-img` | No |
| Loading title | `loading-title` | No |
| Loading subtitle | `loading-subtitle` | No |

---

## Integración de Notificaciones Push (OneSignal)

Agregar en el `<head>` junto a los otros CSS compartidos:

```html
<link rel="stylesheet" href="/assets/css/notification-button.css">
```

Agregar un `<div>` con `id="notification-button-container"` en el lugar donde quieras que aparezca el botón.

```html
<div id="notification-button-container"></div>
```

Agregar antes del `main.js` del template:

```html
<script type="module" src="/assets/js/onesignal-init.js"></script>
```

### Comportamiento

- Si el cliente tiene `oneSignalAppId` configurado, el SDK se carga automáticamente y el botón se muestra.
- Si no está configurado, el botón no se renderiza (sin errores).
- El botón muestra "Activar notificaciones" y cambia a "Notificaciones activadas" tras aceptar.

### Ejemplo de integración completa en `index.html`

```html
<head>
  <link rel="stylesheet" href="/assets/css/notification-button.css">
  <link rel="stylesheet" href="/assets/css/promotion-popup.css">
  <link rel="stylesheet" href="/assets/css/pwa-installer.css">
</head>
<body>
  <header>
    <div class="header-actions">
      <div id="notification-button-container"></div>
      <div class="social-links" id="social-links"></div>
    </div>
  </header>

  <!-- Contenido del template aquí -->

  <script src="/assets/js/pwa-installer.js?v=3"></script>
  <script type="module" src="/assets/js/onesignal-init.js"></script>
  <script type="module" src="assets/js/main.js"></script>
</body>
```

> **Nota**: `OneSignalSDKWorker.js` ya existe en `public/` y es servido automáticamente.

---

## Ejemplo de Template Mínimo

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
}

document.addEventListener('DOMContentLoaded', async () => {
  window.miTemplate = new MiTemplate();
  await window.miTemplate.init();
});

export default MiTemplate;
```

---

## Notas Importantes

1. **No duplicar métodos**: Los métodos de setup ya están en `TemplateBase`. Solo sobrescribir si hay lógica diferente.

2. **Construir URLs de imágenes**: Siempre usar `dataManager.getImageUrl(path)` para todas las imágenes (noticias, programas, sponsors, galerías, locutores, eventos, podcasts, videocasts).

3. **IDs de contenedor correctos**: Verificar que los IDs en el HTML coincidan con los configurados en `customDomIds`.

4. **Inicialización asíncrona**: Siempre usar `await super.init()` al principio del método `init()`.

5. **Limpieza al salir**: Siempre agregar el event listener `beforeunload` para destruir la instancia.

6. **Ocultar secciones vacías**: Cada sección debe ocultar su vista y su item del menú si el endpoint devuelve datos vacíos. Usar `toggleSectionVisibility(sectionName, hasData)`. Las secciones de carga bajo demanda deben precargarse en `loadAllContent()` con `preloadSection()` para ocultar el menú desde el inicio, no solo después del primer clic.

7. **Manejo de errores silencioso**: Los errores de carga de contenido no deben romper la página. Capturar cada carga por separado y mostrar fallbacks.

8. **Paginación**: Para noticias, podcasts y videocasts, implementar botón "Cargar más" o scroll infinito usando `currentPage` y verificando `pagination.hasMore`.

9. **Modal de noticia**: Al hacer clic en una noticia (hero, breaking, featured, grid), llamar a `loadNewsDetail(slug)` que abre el modal con el contenido completo.

10. **Cache de API**: La API tiene caché en memoria con TTL configurable. Usar `clearAPICache()` si se necesita forzar recarga.
