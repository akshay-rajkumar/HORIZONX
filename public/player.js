/* ═══════════════════════════════════════════════════════
   HorizonX — Player Page JavaScript
   Reads URL params, builds VidKing embed, handles TV episodes,
   watch-progress via postMessage + localStorage
═══════════════════════════════════════════════════════ */

'use strict';

/* ── CONFIG ─────────────────────────────────────────── */
const BACKEND = (typeof window !== 'undefined' && window.location.port === '3001') ? 'http://localhost:3001' : '';
const VIDKING = 'https://www.vidking.net/embed'; // VidKing base
const GOLD_HEX = 'C9A84C';                        // accent color (no #)

/* ── READ URL PARAMS ─────────────────────────────────── */
const params = new URLSearchParams(window.location.search);
const MEDIA_ID = params.get('id') || '';
const MEDIA_TYPE = params.get('type') || 'movie'; // 'movie' | 'tv'
let currentSeason = parseInt(params.get('season')) || 1;
let currentEpisode = parseInt(params.get('episode')) || 1;
let totalSeasons = 1;
let episodeCounts = {};   // { season: epCount }

/* ── STORAGE KEY ─────────────────────────────────────── */
const storageKey = () => `cv_progress_${MEDIA_TYPE}_${MEDIA_ID}`;

/* ── ELEMENTS ────────────────────────────────────────── */
const iframe = document.getElementById('vidking-iframe');
const frameWrap = document.getElementById('player-frame-wrap');
const loader = document.getElementById('player-loader');
const infoPanel = document.getElementById('info-panel');
const infoBtn = document.getElementById('info-btn');
const infoClose = document.getElementById('info-close');
const epPanel = document.getElementById('ep-panel');
const epBtn = document.getElementById('ep-btn');
const epClose = document.getElementById('ep-close');
const epSeasonRow = document.getElementById('ep-season-row');
const epGrid = document.getElementById('ep-grid');
const toolbarCenterTV = document.getElementById('toolbar-center-tv');
const toolbarTitle = document.getElementById('toolbar-title');
const toolbarSub = document.getElementById('toolbar-sub');
const toolbarEpLabel = document.getElementById('toolbar-ep-label');
const prevEpBtn = document.getElementById('prev-ep-btn');
const nextEpBtn = document.getElementById('next-ep-btn');
const wishlistBtn = document.getElementById('wishlist-btn');
const toast = document.getElementById('progress-toast');

/* ════════════════════════════════════════════════════
   VIDKING EMBED URL BUILDER
════════════════════════════════════════════════════ */
function buildEmbedUrl(id, type, season, episode, progressSeconds = 0) {
    let url;
    if (type === 'tv') {
        url = `${VIDKING}/tv/${id}/${season}/${episode}`;
    } else {
        url = `${VIDKING}/movie/${id}`;
    }

    const p = new URLSearchParams({
        color: GOLD_HEX,
        autoPlay: 'true',
        nextEpisode: type === 'tv' ? 'true' : 'false',
        episodeSelector: type === 'tv' ? 'true' : 'false',
    });

    if (progressSeconds > 0) p.set('progress', progressSeconds);

    return `${url}?${p.toString()}`;
}

/* ════════════════════════════════════════════════════
   LOAD IFRAME
════════════════════════════════════════════════════ */
function loadPlayer(season, episode) {
    // Get saved progress
    let progress = 0;
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey()) || '{}');
        if (MEDIA_TYPE === 'tv') {
            const epKey = `s${season}e${episode}`;
            progress = saved[epKey] || 0;
        } else {
            progress = saved.time || 0;
        }
    } catch (_) { }

    const url = buildEmbedUrl(MEDIA_ID, MEDIA_TYPE, season, episode, progress);
    iframe.src = url;

    // Show loader, hide frame until ready
    loader.classList.remove('hidden');
    frameWrap.classList.remove('visible');
    frameWrap.setAttribute('aria-hidden', 'true');

    // Listen for iframe to become interactive (best effort via load event)
    iframe.onload = () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            frameWrap.classList.add('visible');
            frameWrap.removeAttribute('aria-hidden');
        }, 600);
    };

    // Update toolbar
    if (MEDIA_TYPE === 'tv') {
        toolbarEpLabel.textContent = `S${season} E${episode}`;
    }
}

/* ════════════════════════════════════════════════════
   FETCH METADATA FROM BACKEND
════════════════════════════════════════════════════ */
async function fetchMeta() {
    if (!MEDIA_ID) return null;
    try {
        const res = await fetch(`${BACKEND}/api/${MEDIA_TYPE}/${MEDIA_ID}`);
        if (!res.ok) throw new Error('Backend unavailable');
        return res.json();
    } catch {
        // If backend is down, return minimal info
        return null;
    }
}

async function fetchTvSeasons(id) {
    try {
        const res = await fetch(`${BACKEND}/api/tv/${id}`);
        if (!res.ok) throw new Error();
        return res.json();
    } catch {
        return null;
    }
}

/* ════════════════════════════════════════════════════
   POPULATE INFO PANEL
════════════════════════════════════════════════════ */
function populateInfoPanel(meta) {
    if (!meta) {
        document.getElementById('info-title').textContent = `Movie #${MEDIA_ID}`;
        document.getElementById('info-type').textContent = MEDIA_TYPE.toUpperCase();
        document.getElementById('info-desc').textContent = 'Connect the backend to display metadata.';
        return;
    }

    // Poster
    const posterImg = document.getElementById('info-poster');
    const posterPh = document.getElementById('info-poster-placeholder');
    if (meta.posterUrl) {
        posterImg.src = meta.posterUrl;
        posterImg.alt = meta.title;
        posterImg.onload = () => posterImg.classList.add('loaded');
        posterPh.style.display = 'none';
    } else {
        posterPh.textContent = meta.title;
    }

    document.getElementById('info-type').textContent = meta.type === 'tv' ? 'TV Series' : 'Movie';
    document.getElementById('info-title').textContent = meta.title;
    document.getElementById('info-desc').textContent = meta.description || 'No overview available.';

    // Meta chips
    const chips = [
        meta.year && `<span>${meta.year}</span>`,
        meta.rating && `<span>⭑ ${meta.rating}</span>`,
        meta.seasons && `<span>${meta.seasons} Seasons</span>`,
    ].filter(Boolean).join('');
    document.getElementById('info-meta').innerHTML = chips;

    // Genre chips
    document.getElementById('info-genres').innerHTML =
        (meta.genres || []).map(g => `<span class="info-genre-chip">${g}</span>`).join('');

    // Toolbar title
    toolbarTitle.textContent = meta.title;
    document.title = `Watch ${meta.title} — HorizonX`;
}

/* ════════════════════════════════════════════════════
   TV — EPISODE SELECTOR
════════════════════════════════════════════════════ */
function buildSeasonTabs(seasons) {
    epSeasonRow.innerHTML = '';
    for (let s = 1; s <= seasons; s++) {
        const tab = document.createElement('button');
        tab.className = `season-tab${s === currentSeason ? ' active' : ''}`;
        tab.textContent = `Season ${s}`;
        tab.setAttribute('role', 'listitem');
        tab.dataset.season = s;
        tab.addEventListener('click', () => switchSeason(s));
        epSeasonRow.appendChild(tab);
    }
}

async function switchSeason(season) {
    currentSeason = season;
    // Update active tab
    epSeasonRow.querySelectorAll('.season-tab').forEach(t =>
        t.classList.toggle('active', parseInt(t.dataset.season) === season)
    );

    // Fetch episode count for season if not cached
    if (!episodeCounts[season]) {
        try {
            const res = await fetch(`${BACKEND}/api/tv/${MEDIA_ID}/season/${season}`);
            if (res.ok) {
                const data = await res.json();
                episodeCounts[season] = data.episodes || 20;
            }
        } catch { episodeCounts[season] = 20; }
    }
    buildEpisodeGrid(season, episodeCounts[season]);
}

function buildEpisodeGrid(season, count) {
    epGrid.innerHTML = '';
    for (let e = 1; e <= count; e++) {
        const card = document.createElement('div');
        card.className = `ep-card${(season === currentSeason && e === currentEpisode) ? ' active' : ''}`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `Episode ${e}`);
        card.innerHTML = `<span class="ep-num">${e}</span><span class="ep-label">EP</span>`;
        card.addEventListener('click', () => {
            currentEpisode = e;
            loadPlayer(currentSeason, currentEpisode);
            closeEpPanel();

            // Update active
            epGrid.querySelectorAll('.ep-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
        epGrid.appendChild(card);
    }
}

function openEpPanel() {
    epPanel.classList.add('open');
    epPanel.setAttribute('aria-hidden', 'false');
}
function closeEpPanel() {
    epPanel.classList.remove('open');
    epPanel.setAttribute('aria-hidden', 'true');
}

/* ════════════════════════════════════════════════════
   PREV / NEXT EPISODE
════════════════════════════════════════════════════ */
prevEpBtn?.addEventListener('click', () => {
    if (currentEpisode > 1) {
        currentEpisode--;
    } else if (currentSeason > 1) {
        currentSeason--;
        currentEpisode = episodeCounts[currentSeason] || 1;
    }
    loadPlayer(currentSeason, currentEpisode);
});

nextEpBtn?.addEventListener('click', () => {
    const maxEp = episodeCounts[currentSeason] || 999;
    if (currentEpisode < maxEp) {
        currentEpisode++;
    } else if (currentSeason < totalSeasons) {
        currentSeason++;
        currentEpisode = 1;
    }
    loadPlayer(currentSeason, currentEpisode);
});

/* ════════════════════════════════════════════════════
   WATCH PROGRESS — postMessage listener
════════════════════════════════════════════════════ */
let saveDebounce;
window.addEventListener('message', (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }
    if (!payload || payload.type !== 'PLAYER_EVENT') return;

    const { event: evtName, currentTime } = payload.data || {};

    if (evtName === 'timeupdate' && currentTime > 5) {
        // Debounce to save at most every 10s
        clearTimeout(saveDebounce);
        saveDebounce = setTimeout(() => {
            try {
                const existing = JSON.parse(localStorage.getItem(storageKey()) || '{}');
                if (MEDIA_TYPE === 'tv') {
                    existing[`s${currentSeason}e${currentEpisode}`] = Math.floor(currentTime);
                } else {
                    existing.time = Math.floor(currentTime);
                }
                localStorage.setItem(storageKey(), JSON.stringify(existing));
                showToast();
            } catch (_) { }
        }, 10_000);
    }

    if (evtName === 'ended' && MEDIA_TYPE === 'tv') {
        // Auto-advance to next episode
        const maxEp = episodeCounts[currentSeason] || 999;
        if (currentEpisode < maxEp) {
            currentEpisode++;
            loadPlayer(currentSeason, currentEpisode);
        } else if (currentSeason < totalSeasons) {
            currentSeason++;
            currentEpisode = 1;
            loadPlayer(currentSeason, currentEpisode);
        }
    }
});

/* ════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════ */
let toastTimer;
function showToast() {
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        toast.setAttribute('aria-hidden', 'true');
    }, 2000);
}

/* ════════════════════════════════════════════════════
   INFO PANEL TOGGLE
════════════════════════════════════════════════════ */
infoBtn?.addEventListener('click', () => {
    const isOpen = infoPanel.classList.toggle('open');
    infoPanel.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) closeEpPanel();
});
infoClose?.addEventListener('click', () => {
    infoPanel.classList.remove('open');
    infoPanel.setAttribute('aria-hidden', 'true');
});

epBtn?.addEventListener('click', () => {
    openEpPanel();
    infoPanel.classList.remove('open');
    infoPanel.setAttribute('aria-hidden', 'true');
});
epClose?.addEventListener('click', closeEpPanel);

/* ════════════════════════════════════════════════════
   WATCHLIST (localStorage)
════════════════════════════════════════════════════ */
wishlistBtn?.addEventListener('click', () => {
    const list = JSON.parse(localStorage.getItem('cv_watchlist') || '[]');
    const key = `${MEDIA_TYPE}:${MEDIA_ID}`;
    const inList = list.includes(key);
    if (inList) {
        const updated = list.filter(k => k !== key);
        localStorage.setItem('cv_watchlist', JSON.stringify(updated));
        wishlistBtn.style.color = '';
        wishlistBtn.querySelector('svg').innerHTML =
            '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    } else {
        list.push(key);
        localStorage.setItem('cv_watchlist', JSON.stringify(list));
        wishlistBtn.style.color = 'var(--gold)';
        wishlistBtn.querySelector('svg').innerHTML =
            '<polyline points="20 6 9 17 4 12"/>';
    }
});

/* ════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════ */
(async () => {
    if (!MEDIA_ID) {
        loader.querySelector('.loader-text').textContent = 'No media ID provided.';
        return;
    }

    // 1. Load the iframe immediately (don't wait for metadata)
    loadPlayer(currentSeason, currentEpisode);

    // 2. Fetch metadata async to populate panels
    const meta = await fetchMeta();
    populateInfoPanel(meta);

    // 3. TV-specific setup
    if (MEDIA_TYPE === 'tv') {
        epBtn.style.display = 'inline-flex';
        toolbarCenterTV.setAttribute('aria-hidden', 'false');
        toolbarSub.textContent = `Season ${currentSeason} · Episode ${currentEpisode}`;

        totalSeasons = meta?.seasons || 1;
        episodeCounts[currentSeason] = meta?.episodes || 24;

        buildSeasonTabs(totalSeasons);
        buildEpisodeGrid(currentSeason, episodeCounts[currentSeason]);

        // Add backend route for season details if available
        toolbarSub.textContent = 'TV Series';
    } else {
        toolbarSub.textContent = meta?.year ? `${meta.year} · HorizonX` : 'HorizonX';
    }

    // 4. Check watchlist state
    const list = JSON.parse(localStorage.getItem('cv_watchlist') || '[]');
    if (list.includes(`${MEDIA_TYPE}:${MEDIA_ID}`)) {
        wishlistBtn.style.color = 'var(--gold)';
    }
})();
