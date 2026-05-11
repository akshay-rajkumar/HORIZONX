'use strict';

/* ── URL PARAMS ──────────────────────────────── */
const params     = new URLSearchParams(window.location.search);
const MEDIA_ID   = params.get('id');
const MEDIA_TYPE = params.get('type') || 'movie';
let   SEASON     = parseInt(params.get('season'))  || 1;
let   EPISODE    = parseInt(params.get('episode')) || 1;

/* ── DOM ─────────────────────────────────────── */
const playerFrame       = document.getElementById('playerFrame');
const loadingSpinner    = document.getElementById('loadingSpinner');
const btnEpisodes       = document.getElementById('btnEpisodes');
const btnInfo           = document.getElementById('btnInfo');
const btnPrev           = document.getElementById('btnPrev');
const btnNext           = document.getElementById('btnNext');
const episodePanel      = document.getElementById('episodePanel');
const episodePanelClose = document.getElementById('episodePanelClose');
const seasonTabs        = document.getElementById('seasonTabs');
const episodeGrid       = document.getElementById('episodeGrid');
const infoPanel         = document.getElementById('infoPanel');
const infoPanelClose    = document.getElementById('infoPanelClose');
const panelBackdrop     = document.getElementById('panelBackdrop');
const infoPoster        = document.getElementById('infoPoster');
const infoTitle         = document.getElementById('infoTitle');
const infoMeta          = document.getElementById('infoMeta');
const infoGenres        = document.getElementById('infoGenres');
const infoDesc          = document.getElementById('infoDesc');

/* ── STATE ───────────────────────────────────── */
let allSeasons   = [];
let episodeCache = {};
let activeSeason = SEASON;
const TMDB_IMG   = 'https://image.tmdb.org/t/p/';

/* ── BUILD EMBED URL ─────────────────────────── */
function buildEmbedURL(season, episode) {
  if (MEDIA_TYPE === 'tv') {
    return `https://vidsync.xyz/embed/tv/${MEDIA_ID}/${season}/${episode}?autoPlay=true&autoNext=true&nextButton=true`;
  }
  return `https://vidsync.xyz/embed/movie/${MEDIA_ID}?autoPlay=true`;
}

/* ── LOAD PLAYER ─────────────────────────────── */
function loadPlayer(season, episode) {
  SEASON  = season;
  EPISODE = episode;

  const newURL = new URL(window.location.href);
  newURL.searchParams.set('season',  season);
  newURL.searchParams.set('episode', episode);
  window.history.replaceState(null, '', newURL.toString());

  /* Show spinner */
  loadingSpinner.classList.remove('done');

  /* Set iframe src */
  const embedURL = buildEmbedURL(season, episode);
  playerFrame.setAttribute('src', embedURL);

  /* Hide spinner after load */
  playerFrame.onload = () => {
    setTimeout(() => loadingSpinner.classList.add('done'), 500);
  };

  /* Fallback: hide spinner after 8 seconds regardless */
  setTimeout(() => loadingSpinner.classList.add('done'), 8000);

  /* Save progress */
  if (MEDIA_TYPE === 'tv') {
    try {
      localStorage.setItem(
        `hx_progress_${MEDIA_ID}`,
        JSON.stringify({ season, episode, ts: Date.now() })
      );
    } catch (e) {}
  }

  /* Highlight active episode card */
  document.querySelectorAll('.ep-card').forEach(c => {
    c.classList.toggle('active',
      parseInt(c.dataset.season)   === season &&
      parseInt(c.dataset.episode)  === episode
    );
  });
}

/* ── FETCH METADATA ──────────────────────────── */
async function fetchMeta() {
  try {
    const endpoint = MEDIA_TYPE === 'tv'
      ? `/api/tv/${MEDIA_ID}`
      : `/api/movie/${MEDIA_ID}`;
    const res  = await fetch(endpoint);
    const data = await res.json();
    populateInfo(data);
  } catch (e) {
    console.warn('[Player] meta fetch failed', e);
  }
}

function populateInfo(data) {
  if (!data) return;
  if (infoPoster) {
    infoPoster.src = data.poster
      ? `${TMDB_IMG}w500${data.poster}` : '';
    infoPoster.alt = data.title || '';
  }
  if (infoTitle)  infoTitle.textContent = data.title || '';
  if (infoDesc)   infoDesc.textContent  = data.overview || data.description || '';
  if (infoMeta) {
    const r = data.rating ? `<span class="rating">★ ${parseFloat(data.rating).toFixed(1)}</span>` : '';
    infoMeta.innerHTML = `<span>${data.year||''}</span>${data.runtime?`<span>·</span><span>${data.runtime}</span>`:''} ${r}`;
  }
  if (infoGenres) {
    infoGenres.innerHTML = (data.genres||[]).slice(0,5)
      .map(g=>`<span class="info-genre-tag">${g.name||g}</span>`).join('');
  }
}

/* ── FETCH SEASONS ───────────────────────────── */
async function fetchSeasons() {
  try {
    const res  = await fetch(`/api/tv/${MEDIA_ID}/seasons`);
    const data = await res.json();
    allSeasons  = data.seasons || [];
    renderSeasonTabs();
    await fetchEpisodes(SEASON);
  } catch (e) {
    console.warn('[Player] seasons fetch failed', e);
  }
}

function renderSeasonTabs() {
  seasonTabs.innerHTML = '';
  allSeasons.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'season-tab' + (s.season_number === activeSeason ? ' active' : '');
    btn.textContent = s.name || `Season ${s.season_number}`;
    btn.dataset.season = s.season_number;
    btn.addEventListener('click', async () => {
      activeSeason = s.season_number;
      document.querySelectorAll('.season-tab')
        .forEach(t => t.classList.toggle('active', t === btn));
      await fetchEpisodes(s.season_number);
    });
    seasonTabs.appendChild(btn);
  });
}

/* ── FETCH EPISODES ──────────────────────────── */
async function fetchEpisodes(season) {
  const key = `S${season}`;
  if (episodeCache[key]) { renderEpisodes(episodeCache[key], season); return; }

  episodeGrid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const sk = document.createElement('div');
    sk.className = 'ep-skeleton';
    episodeGrid.appendChild(sk);
  }

  try {
    const res  = await fetch(`/api/tv/${MEDIA_ID}/season/${season}`);
    const data = await res.json();
    episodeCache[key] = data.episodes || [];
    renderEpisodes(episodeCache[key], season);
  } catch (e) {
    episodeGrid.innerHTML =
      '<p style="color:rgba(255,255,255,0.3);padding:1rem">Could not load episodes.</p>';
  }
}

function renderEpisodes(episodes, season) {
  episodeGrid.innerHTML = '';
  if (!episodes.length) {
    episodeGrid.innerHTML = '<p style="color:rgba(255,255,255,0.3);padding:1rem">No episodes found.</p>';
    return;
  }
  episodes.forEach(ep => {
    const isActive = season === SEASON && ep.episode_number === EPISODE;
    const thumbHTML = ep.still
      ? `<img class="ep-thumb" src="${TMDB_IMG}w300${ep.still}"
            loading="lazy" alt="Ep ${ep.episode_number}"
            onerror="this.style.display='none'">`
      : `<div class="ep-thumb-fallback">▶</div>`;

    const card = document.createElement('div');
    card.className = 'ep-card' + (isActive ? ' active' : '');
    card.dataset.season  = season;
    card.dataset.episode = ep.episode_number;
    card.innerHTML = `
      <div class="ep-thumb-wrap">
        ${thumbHTML}
        <div class="ep-play-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
      <div class="ep-info">
        <div class="ep-num">EP ${ep.episode_number}</div>
        <div class="ep-name">${ep.name || `Episode ${ep.episode_number}`}</div>
        <div class="ep-meta">${ep.runtime ? ep.runtime+'m' : ''}${ep.rating ? ' · ★'+ep.rating : ''}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      closeEpisodePanel();
      loadPlayer(season, ep.episode_number);
    });
    episodeGrid.appendChild(card);
  });

  const activeCard = episodeGrid.querySelector('.ep-card.active');
  if (activeCard && episodePanel.classList.contains('open')) {
    setTimeout(() => activeCard.scrollIntoView({ behavior:'smooth', block:'center' }), 80);
  }
}

/* ── PANELS ──────────────────────────────────── */
function openEpisodePanel() {
  closeInfoPanel();
  episodePanel.classList.add('open');
  panelBackdrop.classList.add('visible');
  btnEpisodes.classList.add('active');
  
  const activeCard = episodeGrid.querySelector('.ep-card.active');
  if (activeCard) setTimeout(() => activeCard.scrollIntoView({ behavior:'smooth', block:'center' }), 300);
}
function closeEpisodePanel() {
  episodePanel.classList.remove('open');
  if (!infoPanel.classList.contains('open')) panelBackdrop.classList.remove('visible');
  btnEpisodes.classList.remove('active');
}
function openInfoPanel() {
  closeEpisodePanel();
  infoPanel.classList.add('open');
  panelBackdrop.classList.add('visible');
  btnInfo.classList.add('active');
}
function closeInfoPanel() {
  infoPanel.classList.remove('open');
  if (!episodePanel.classList.contains('open')) panelBackdrop.classList.remove('visible');
  btnInfo.classList.remove('active');
}

/* ── PREV / NEXT ─────────────────────────────── */
async function goPrev() {
  if (EPISODE > 1) { loadPlayer(SEASON, EPISODE - 1); return; }
  if (SEASON  > 1) {
    const prevS = SEASON - 1;
    await fetchEpisodes(prevS);
    const eps = episodeCache[`S${prevS}`] || [];
    if (eps.length) {
      activeSeason = prevS;
      document.querySelectorAll('.season-tab')
        .forEach(t => t.classList.toggle('active', parseInt(t.dataset.season) === prevS));
      loadPlayer(prevS, eps[eps.length - 1].episode_number);
    }
  }
}
async function goNext() {
  const eps     = episodeCache[`S${SEASON}`] || [];
  const lastEp  = eps.length ? eps[eps.length - 1].episode_number : EPISODE;
  if (EPISODE < lastEp) { loadPlayer(SEASON, EPISODE + 1); return; }
  const nextS   = SEASON + 1;
  if (!allSeasons.some(s => s.season_number === nextS)) return;
  activeSeason  = nextS;
  document.querySelectorAll('.season-tab')
    .forEach(t => t.classList.toggle('active', parseInt(t.dataset.season) === nextS));
  await fetchEpisodes(nextS);
  loadPlayer(nextS, 1);
}

/* ── EVENT LISTENERS & INIT ───────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!MEDIA_ID) {
    document.body.innerHTML =
      '<p style="color:#fff;text-align:center;padding:5rem">No media ID provided.</p>';
    return;
  }

  /* Hide TV-only controls for movies */
  if (MEDIA_TYPE !== 'tv') {
    if (btnEpisodes) btnEpisodes.style.display = 'none';
    if (btnPrev)     btnPrev.style.display     = 'none';
    if (btnNext)     btnNext.style.display     = 'none';
  } else {
    /* Restore saved progress */
    try {
      const saved = JSON.parse(
        localStorage.getItem(`hx_progress_${MEDIA_ID}`)
      );
      if (saved?.season && saved?.episode) {
        SEASON  = saved.season;
        EPISODE = saved.episode;
      }
    } catch (e) {}

    /* Pre-fetch season data silently — do NOT open the panel */
    fetchSeasons();
  }

  /* Start playback immediately */
  fetchMeta();
  loadPlayer(SEASON, EPISODE);

  /* ── EPISODES button ── */
  if (btnEpisodes) {
    btnEpisodes.addEventListener('click', (e) => {
      e.stopPropagation();
      if (episodePanel.classList.contains('open')) {
        closeEpisodePanel();
      } else {
        openEpisodePanel();
      }
    });
  }

  /* ── Episode panel X button ── */
  if (episodePanelClose) {
    episodePanelClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEpisodePanel();
    });
  }

  /* ── INFO button ── */
  if (btnInfo) {
    btnInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      if (infoPanel.classList.contains('open')) {
        closeInfoPanel();
      } else {
        openInfoPanel();
      }
    });
  }

  /* ── Info panel X button ── */
  if (infoPanelClose) {
    infoPanelClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeInfoPanel();
    });
  }

  /* ── Backdrop closes both panels ── */
  if (panelBackdrop) {
    panelBackdrop.addEventListener('click', () => {
      closeEpisodePanel();
      closeInfoPanel();
    });
  }

  /* ── PREV / NEXT ── */
  if (btnPrev) btnPrev.addEventListener('click', goPrev);
  if (btnNext) btnNext.addEventListener('click', goNext);

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEpisodePanel();
      closeInfoPanel();
    }
  });

  /* ── iframe postMessage (auto next episode) ── */
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'PLAYER_EVENT' &&
        e.data?.event === 'ended' &&
        MEDIA_TYPE === 'tv') {
      goNext();
    }
  });
});
