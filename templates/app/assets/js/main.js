import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class AppTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'main-play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'about-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'track-title-main',
        trackArtist: 'track-artist-main',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date'
      }
    });

    this.heroSwiper = null;
    this.currentPage = { news: 1, podcasts: 1 };
    this._newsTotalPages = 1;
    this._newsPerPage = 4;
    this._programs = null;
    this._programDayMap = {};
    this._selectedDay = 'Lunes';
    this.videoStreamUrl = null;
    this._tvPlayer = null;
    this._tvMode = null;
  }

  async init() {
    console.log('AppTemplate: init started');
    await super.init();
    console.log('AppTemplate: super.init completed');
    try {
      await this.checkTVAvailability();
      await this.loadAllContent();
      this.setupBottomNav();
      this.setupModalHandlers();
      this.setupContactForm();
      console.log('AppTemplate: Template fully initialized!');
    } catch (error) {
      console.error('AppTemplate: Error in init:', error);
    }
  }

  async checkTVAvailability() {
    try {
      const dm = getDataManager();
      this.videoStreamUrl = await dm.loadVideoStreamUrl();
      let hasRadio = false;
      try {
        const basicData = await dm.loadBasicData();
        if (basicData) {
          hasRadio = !!(basicData.radioStreamingUrl || basicData.radioStreamUrl);
        }
      } catch (e) { hasRadio = false; }
      const hasTV = !!this.videoStreamUrl;
      if (hasTV && hasRadio) this._tvMode = 'both';
      else if (hasTV) this._tvMode = 'tv';
      else this._tvMode = 'radio';
    } catch (error) {
      this._tvMode = 'radio';
    }
  }

  async loadAllContent() {
    await Promise.allSettled([
      this.loadAllNews(),
      this.loadProgramsByDay(),
      this.loadPodcastsList(),
      this.loadPolls(),
      this.loadEventsTimeline()
    ]);
    this._populateAbout();
  }

  async loadAllNews(page) {
    const dm = getDataManager();
    const pg = page || 1;
    const result = await dm.loadNews(pg, this._newsPerPage);
    if (!result.data || !result.data.length) {
      this._toggleSection('all-news-grid', false);
      return;
    }
    this._toggleSection('all-news-grid', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('all-news-grid');
    if (!container) return;
    container.innerHTML = result.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${item.name}" loading="lazy">
        <div class="news-body">
          <h3>${item.name}</h3>
          <p>${item.shortText || ''}</p>
          <small>${new Date(item.createdAt).toLocaleDateString('es-ES')}</small>
        </div>
      </article>
    `).join('');
    this._newsTotalPages = result.pagination?.totalPages || 1;
    this._renderPagination(pg);
  }

  _renderPagination(current) {
    const container = document.getElementById('news-pagination');
    if (!container) return;
    if (this._newsTotalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= this._newsTotalPages; i++) {
      html += '<button class="page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => this.loadAllNews(parseInt(btn.dataset.page)));
    });
  }

  async loadProgramsByDay() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) {
      this._toggleSection('day-nav', false);
      return;
    }
    this._toggleSection('day-nav', true);
    for (const p of programs) {
      if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);
    }
    this._programs = programs;

    const dayMap = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
    this._programDayMap = {};
    for (const p of programs) {
      const days = p.weekDays || [];
      for (const d of days) {
        const esDay = dayMap[d.toLowerCase()] || d;
        if (!this._programDayMap[esDay]) this._programDayMap[esDay] = [];
        this._programDayMap[esDay].push(p);
      }
    }
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    this._selectedDay = Object.keys(this._programDayMap).find(d => d.toLowerCase() === today.toLowerCase()) || 'Lunes';
    this._renderDayPrograms();
    this._setupDayNav();
  }

  _setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayNames = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
          jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
        const dayName = dayNames[btn.dataset.day];
        if (!dayName || dayName === this._selectedDay) return;
        nav.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedDay = dayName;
        this._renderDayPrograms();
      });
    });
    const dayKeys = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const activeKey = Object.keys(dayKeys).find(k => dayKeys[k] === this._selectedDay);
    const activeBtn = nav.querySelector('[data-day="' + activeKey + '"]');
    if (activeBtn) activeBtn.classList.add('active');
  }

  _renderDayPrograms() {
    const container = document.getElementById('programs-list');
    if (!container) return;
    const dayPrograms = (this._programDayMap[this._selectedDay] || []).sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || ''));
    if (!dayPrograms.length) {
      container.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:30px 0;">Sin programación</p>';
      return;
    }
    container.innerHTML = dayPrograms.map(p => `
      <div class="program-card">
        ${p.imageUrl ? '<div class="program-card-img"><img src="' + p.imageUrl + '" alt="' + p.name + '" loading="lazy"></div>' : ''}
        <div class="program-card-body">
          <div class="program-card-time">${p.startTime || ''}${p.endTime ? ' - ' + p.endTime : ''}</div>
          <div class="program-card-name">${p.name}</div>
          ${p.host ? '<div class="program-card-host"><i class="fas fa-user"></i> ' + p.host + '</div>' : ''}
        </div>
      </div>
    `).join('');
  }

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(1, 10);
    if (!result.data || !result.data.length) {
      this._toggleSection('podcasts-list', false);
      return;
    }
    this._toggleSection('podcasts-list', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('podcasts-list');
    if (!container) return;
    container.innerHTML = result.data.map(p => `
      <div class="podcast-card" data-id="${p.id}">
        <div class="card-thumb">
          <img src="${p.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${p.title}" loading="lazy">
          <div class="card-overlay"><i class="fas fa-play"></i></div>
          ${p.duration ? '<span class="card-badge">' + p.duration + '</span>' : ''}
        </div>
        <div class="card-body">
          <h3>${p.title}</h3>
        </div>
      </div>
    `).join('');
  }

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) {
      this._toggleSection('polls-grid', false);
      return;
    }
    this._toggleSection('polls-grid', true);
    const container = document.getElementById('polls-grid');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll => {
      const question = poll.question || poll.title || poll.name || '';
      return `
      <div class="poll-card-modern" data-id="${poll.id}">
        <div class="poll-card-header">
          <div class="poll-icon"><i class="fas fa-chart-bar"></i></div>
          <h3 class="poll-question-modern">${question}</h3>
        </div>
        <div class="poll-options-modern">
          ${(poll.options || []).map(opt => `
            <button class="poll-option-modern" data-poll-id="${poll.id}" data-option-id="${opt.id}">
              <span class="poll-option-label">${opt.text || ''}</span>
              <span class="poll-bar-modern" style="width:0%"></span>
              <span class="poll-count-modern">${opt.votes || 0}</span>
            </button>
          `).join('')}
        </div>
        <p class="poll-voted-msg" style="display:none;"><i class="fas fa-check-circle"></i> Gracias por votar</p>
      </div>`;
    }).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      const polls = await dm.loadPolls();
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      const card = document.querySelector('.poll-card-modern[data-id="' + pollId + '"]');
      if (!card) return;
      card.querySelectorAll('.poll-option-modern').forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-bar-modern').style.width = pct + '%';
        btn.querySelector('.poll-count-modern').textContent = opt.votes + ' (' + pct + '%)';
        btn.disabled = true;
      });
      const msg = card.querySelector('.poll-voted-msg');
      if (msg) msg.style.display = 'flex';
    } catch (error) {
      console.error('AppTemplate: Error voting:', error);
    }
  }

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) {
      this._toggleSection('events-timeline', false);
      return;
    }
    this._toggleSection('events-timeline', true);
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(e => `
      <div class="event-item">
        <div><span class="event-day">${new Date(e.date).getDate()}</span><span class="event-month">${new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</span></div>
        <div class="event-info">
          <h3>${e.name}</h3>
          <p>${e.description || ''}${e.time ? ' · ' + e.time : ''}</p>
        </div>
      </div>
    `).join('');
  }

  _populateAbout() {
    const img = document.getElementById('about-radio-img');
    const titleEl = document.getElementById('about-radio-title');
    const descEl = document.getElementById('about-radio-desc');
    if (!img && !titleEl) return;
    const dm = getDataManager();
    import('/assets/js/api.js').then(({ getBasicData }) => {
      getBasicData().then(async data => {
        const dm2 = getDataManager();
        if (img && data.coverUrl) img.src = await dm2.getImageUrl(data.coverUrl);
        else if (img && data.logoUrl) img.src = await dm2.getImageUrl(data.logoUrl);
        if (titleEl) titleEl.textContent = data.projectName || data.name || 'Nuestra Radio';
        if (descEl) descEl.textContent = data.projectDescription || data.description || '';
      }).catch(() => {});
    }).catch(() => {});
  }

  setupBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const moreBtn = document.getElementById('nav-more-btn');
    const overflow = document.getElementById('nav-overflow');
    const overflowContent = document.getElementById('nav-overflow-content');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        this._navClick(item.dataset.tab, item);
      });
    });

    this._updateNavOverflow();

    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const isOpen = overflow.style.display !== 'none';
        overflow.style.display = isOpen ? 'none' : 'block';
      });
    }

    document.addEventListener('click', (e) => {
      if (overflow && overflow.style.display !== 'none') {
        if (!e.target.closest('#nav-overflow') && !e.target.closest('#nav-more-btn')) {
          overflow.style.display = 'none';
        }
      }
    });

    if (overflowContent) {
      overflowContent.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (item) {
          item.click();
        }
      });
    }

    this._updateNavOverflow();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this._updateNavOverflow(), 200);
    });
  }

  _updateNavOverflow() {
    const nav = document.getElementById('bottom-nav');
    const moreBtn = document.getElementById('nav-more-btn');
    const overflowContent = document.getElementById('nav-overflow-content');
    if (!nav || !moreBtn || !overflowContent) return;

    // Only consider items that have data (not hidden by _toggleSection)
    const visibleItems = Array.from(nav.querySelectorAll('.nav-item')).filter(
      item => item.style.display !== 'none'
    );

    // Items hidden by _toggleSection (no data) stay hidden and are excluded
    const hiddenItems = Array.from(nav.querySelectorAll('.nav-item')).filter(
      item => item.style.display === 'none'
    );
    hiddenItems.forEach(item => { item.style.display = 'none'; });

    // Measure which visible items fit on screen
    const navW = nav.clientWidth;
    const moreW = 50;
    let totalW = 0;
    let fits = [];
    let overflow = [];

    visibleItems.forEach(item => {
      const w = item.offsetWidth || 50;
      const gap = 2;
      if (totalW + w + gap + moreW <= navW) {
        fits.push(item);
        totalW += w + gap;
      } else {
        overflow.push(item);
      }
    });

    if (overflow.length > 0) {
      moreBtn.style.display = 'flex';
      overflow.forEach(item => { item.style.display = 'none'; });
      overflowContent.innerHTML = '';
      overflow.forEach(item => {
        const clone = item.cloneNode(true);
        clone.style.display = 'flex';
        clone.addEventListener('click', () => this._navClick(clone.dataset.tab, item));
        overflowContent.appendChild(clone);
      });
    } else {
      moreBtn.style.display = 'none';
      overflowContent.innerHTML = '';
    }
  }

  _navClick(tab, originalItem) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    originalItem.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.add('active');
    document.getElementById('nav-overflow').style.display = 'none';
  }

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.contact-submit-btn');
      const feedback = document.getElementById('contact-feedback');
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      try {
        const resp = await fetch('/config/config.json');
        const config = await resp.json();
        const mailTo = config.contact_email || 'contacto@radio.cl';
        const mailBody = 'Nombre: ' + name + '%0D%0A' + 'Email: ' + email + '%0D%0A' + 'Asunto: ' + subject + '%0D%0A' + 'Mensaje: ' + message;
        window.location.href = 'mailto:' + mailTo + '?subject=' + encodeURIComponent('Contacto: ' + subject) + '&body=' + mailBody;
        if (feedback) { feedback.className = 'contact-feedback success'; feedback.textContent = 'Mensaje enviado'; feedback.style.display = 'block'; }
        form.reset();
      } catch (err) {
        if (feedback) { feedback.className = 'contact-feedback error'; feedback.textContent = 'Error al enviar'; feedback.style.display = 'block'; }
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar</span>';
      }
    });
  }

  setupModalHandlers() {
    document.querySelectorAll('.modal').forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    document.addEventListener('click', (e) => {
      const slug = e.target.closest('[data-slug]');
      if (slug) {
        e.preventDefault();
        this.loadNewsDetail(slug.dataset.slug);
        return;
      }
      const pollOpt = e.target.closest('.poll-option-modern');
      if (pollOpt && !pollOpt.disabled) {
        this.handleVote(pollOpt.dataset.pollId, pollOpt.dataset.optionId);
        return;
      }
    });
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = '<h2>' + news.name + '</h2>' + (news.imageUrl ? '<img src="' + news.imageUrl + '" alt="' + news.name + '">' : '') + '<div class="news-content">' + (news.longText || news.description || news.shortText || '') + '</div><small>' + new Date(news.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '</small>';
    this.openModal('news-modal');
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  _toggleSection(containerId, hasData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const section = container.closest('.section');
    if (section) section.style.display = hasData ? '' : 'none';

    const navMap = {
      'all-news-grid': 'news',
      'day-nav': 'programs',
      'podcasts-list': 'podcasts',
      'polls-grid': 'polls',
      'events-timeline': 'events'
    };
    const tabName = navMap[containerId];
    if (tabName) {
      const navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
      if (navItem) navItem.style.display = hasData ? '' : 'none';
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
    const cover = document.getElementById('cover-card');
    if (cover) {
      cover.classList.add('playing');
      cover.classList.remove('paused');
    }
    const playBtn = document.getElementById('main-play-btn');
    if (playBtn) {
      const span = playBtn.querySelector('span');
      if (span) span.textContent = 'EN VIVO';
    }
  }

  onAudioPause() {
    super.onAudioPause();
    const cover = document.getElementById('cover-card');
    if (cover) {
      cover.classList.remove('playing');
      cover.classList.add('paused');
    }
    const playBtn = document.getElementById('main-play-btn');
    if (playBtn) {
      const span = playBtn.querySelector('span');
      if (span) span.textContent = 'ESCUCHAR EN VIVO';
    }
  }

  onCurrentSongLoaded(songData) {
    const cover = document.getElementById('cover-card');
    if (cover) cover.classList.remove('paused');
    const titleEl = document.getElementById('track-title-main');
    const artistEl = document.getElementById('track-artist-main');
    const coverImg = document.getElementById('cover-artwork');
    const coverDefault = document.getElementById('cover-card-default');
    const heroBg = document.getElementById('hero-player-bg');
    const artUrl = songData.art || '';
    if (titleEl) titleEl.textContent = songData.title || 'Radio';
    if (artistEl) artistEl.textContent = songData.artist || 'En Vivo';
    if (artUrl && artUrl !== coverImg?.src) {
      const img = new Image();
      img.onload = () => {
        if (coverImg) { coverImg.src = artUrl; coverImg.style.display = 'block'; if (coverDefault) coverDefault.style.display = 'none'; }
        if (heroBg) { heroBg.style.backgroundImage = 'url(' + artUrl + ')'; heroBg.classList.add('loaded'); }
      };
      img.src = artUrl;
    } else if (!artUrl) {
      if (coverImg) coverImg.style.display = 'none';
      if (coverDefault) coverDefault.style.display = 'flex';
      if (heroBg) { heroBg.style.backgroundImage = ''; heroBg.classList.remove('loaded'); }
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.appTemplate = new AppTemplate();
    await window.appTemplate.init();
  } catch (error) {
    console.error('AppTemplate: Error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.appTemplate) window.appTemplate.destroy();
});

export default AppTemplate;
