const BACKEND_URL = typeof window !== 'undefined' && window.location.port === '3001'
    ? 'http://localhost:3001' : ''; // same origin when hosted

// Navigate to the VidKing player page
function watchNow(movie) {
    const type = movie.type || 'movie';
    const params = new URLSearchParams({
        id: movie.id,
        type: type,
        ...(type === 'tv' && { season: 1, episode: 1 }),
    });
    window.location.href = `player.html?${params.toString()}`;
}

const API = {
    // Generic GET to our backend
    async get(path) {
        const res = await fetch(`${BACKEND_URL}${path}`);
        if (!res.ok) throw new Error(`Backend ${res.status}: ${path}`);
        return res.json();
    },

    async fetchFeatured() {
        try {
            const data = await this.get('/api/featured');
            // Backend returns normalised objects with posterUrl/backdropUrl
            return data.map(m => ({
                ...m,
                gradient: 'linear-gradient(135deg,#0d1a2a,#0a0a1a)',
            })).slice(0, 3);
        } catch {
            return PLACEHOLDER_FEATURED;
        }
    },

    async fetchTrending() {
        try { return await this.get('/api/trending'); }
        catch { return PLACEHOLDER_MOVIES.slice(0, 10); }
    },

    async fetchNewReleases() {
        try { return await this.get('/api/new-releases'); }
        catch { return PLACEHOLDER_MOVIES.slice(2, 12); }
    },

    async fetchTopRated() {
        try { return await this.get('/api/top-rated'); }
        catch { return PLACEHOLDER_MOVIES.slice(4, 14); }
    },

    async fetchSeries() {
        try { return await this.get('/api/series'); }
        catch { return []; }
    },

    async fetchPopularTvSeries() {
        try { return await this.get('/api/tv/popular'); }
        catch { return []; }
    },

    async fetchGenres() {
        try {
            const genres = await this.get('/api/genres');
            // genres = [{id, name}] — map to our placeholder-shaped counts
            return PLACEHOLDER_GENRE_COUNTS;
        } catch {
            return PLACEHOLDER_GENRE_COUNTS;
        }
    },

    async fetchTrailer(id, type = 'movie') {
        try {
            const data = await this.get(`/api/${type}/${id}/trailer`);
            return data.key || null;
        } catch { return null; }
    },

    async fetchGenreMovies(genreId) {
        try { return await this.get(`/api/genre/${genreId}/movies`); }
        catch { return []; }
    },

    async search(query) {
        try { return await this.get(`/api/search?q=${encodeURIComponent(query)}`); }
        catch { return []; }
    },
};


/* ════════════════════════════════════════════════════
   DATA NORMALISER
   Map your API's response shape to CineVault's internal shape.
   Modify this function to match your API's field names.
════════════════════════════════════════════════════ */
function normaliseMovie(raw) {
    return {
        id: raw.id,
        title: raw.title || raw.name || 'Untitled',
        year: (raw.release_date || raw.first_air_date || '').slice(0, 4),
        rating: raw.vote_average ? raw.vote_average.toFixed(1) : '—',
        duration: raw.runtime ? `${Math.floor(raw.runtime / 60)}h ${raw.runtime % 60}m` : '',
        description: raw.overview || '',
        posterPath: raw.poster_path || null,
        backdropPath: raw.backdrop_path || null,
        genres: (raw.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id] || ''),
    };
}

/* ════════════════════════════════════════════════════
   PLACEHOLDER DATA
   Shown until a real API is connected.
████████████████████████████████████████████████████ */
const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 18: 'Drama', 27: 'Horror', 10749: 'Romance',
    878: 'Sci-Fi', 9648: 'Mystery', 53: 'Thriller', 99: 'Documentary',
};

const PLACEHOLDER_FEATURED = [
    {
        id: 1, title: 'Oppenheimer',
        year: '2023', rating: '8.9', duration: '3h 1m',
        description: 'The story of J. Robert Oppenheimer, the physicist who led the Manhattan Project — the program that developed the world\'s first nuclear weapons.',
        posterPath: null, backdropPath: null,
        genres: ['Biography', 'Drama', 'History'],
        gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1a1030 50%, #0a0a1a 100%)',
    },
    {
        id: 2, title: 'Dune: Part Two',
        year: '2024', rating: '8.6', duration: '2h 46m',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        posterPath: null, backdropPath: null,
        genres: ['Adventure', 'Drama', 'Sci-Fi'],
        gradient: 'linear-gradient(135deg, #1a100a 0%, #2a1a08 40%, #0a0a1a 100%)',
    },
    {
        id: 3, title: 'Poor Things',
        year: '2023', rating: '8.0', duration: '2h 21m',
        description: 'The fantastical story of the incredible journey of a young woman Bella Baxter, brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.',
        posterPath: null, backdropPath: null,
        genres: ['Comedy', 'Drama', 'Romance'],
        gradient: 'linear-gradient(135deg, #0a1a10 0%, #0d1a20 50%, #0a0a1a 100%)',
    },
];

const PLACEHOLDER_MOVIES = [
    { id: 10, title: 'Killers of the Flower Moon', year: '2023', rating: '7.7', duration: '3h 26m', description: '', posterPath: null, backdropPath: null, genres: ['Crime', 'Drama', 'History'] },
    { id: 11, title: 'The Zone of Interest', year: '2023', rating: '7.4', duration: '1h 45m', description: '', posterPath: null, backdropPath: null, genres: ['Drama', 'History', 'War'] },
    { id: 12, title: 'Past Lives', year: '2023', rating: '7.9', duration: '1h 46m', description: '', posterPath: null, backdropPath: null, genres: ['Drama', 'Romance'] },
    { id: 13, title: 'All of Us Strangers', year: '2023', rating: '7.7', duration: '1h 45m', description: '', posterPath: null, backdropPath: null, genres: ['Drama', 'Fantasy', 'Romance'] },
    { id: 14, title: 'Maestro', year: '2023', rating: '6.8', duration: '2h 9m', description: '', posterPath: null, backdropPath: null, genres: ['Biography', 'Drama', 'Music'] },
    { id: 15, title: 'Saltburn', year: '2023', rating: '7.0', duration: '2h 7m', description: '', posterPath: null, backdropPath: null, genres: ['Drama', 'Mystery', 'Thriller'] },
    { id: 16, title: 'Priscilla', year: '2023', rating: '6.6', duration: '1h 53m', description: '', posterPath: null, backdropPath: null, genres: ['Biography', 'Drama'] },
    { id: 17, title: 'Io Capitano', year: '2023', rating: '7.4', duration: '2h 1m', description: '', posterPath: null, backdropPath: null, genres: ['Adventure', 'Drama'] },
    { id: 18, title: 'La Bête', year: '2023', rating: '6.8', duration: '2h 26m', description: '', posterPath: null, backdropPath: null, genres: ['Drama', 'Romance', 'Thriller'] },
    { id: 19, title: 'Society of the Snow', year: '2023', rating: '7.9', duration: '2h 24m', description: '', posterPath: null, backdropPath: null, genres: ['Biography', 'Drama', 'Thriller'] },
    { id: 20, title: 'The Holdovers', year: '2023', rating: '7.9', duration: '2h 13m', description: '', posterPath: null, backdropPath: null, genres: ['Comedy', 'Drama'] },
    { id: 21, title: 'American Fiction', year: '2023', rating: '7.3', duration: '1h 55m', description: '', posterPath: null, backdropPath: null, genres: ['Comedy', 'Drama'] },
    { id: 22, title: 'May December', year: '2023', rating: '7.0', duration: '1h 53m', description: '', posterPath: null, backdropPath: null, genres: ['Drama'] },
    { id: 23, title: 'Nyad', year: '2023', rating: '7.1', duration: '2h 1m', description: '', posterPath: null, backdropPath: null, genres: ['Biography', 'Drama', 'Sport'] },
];

const PLACEHOLDER_GENRE_COUNTS = {
    action: '1,240 titles', drama: '2,890 titles', thriller: '980 titles',
    'sci-fi': '740 titles', romance: '1,120 titles', horror: '890 titles',
    comedy: '1,560 titles', documentary: '2,100 titles',
};

/* ════════════════════════════════════════════════════
   CARD BUILDER — Landscape style with red glow
════════════════════════════════════════════════════ */
function buildCard(movie, rank = null) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', movie.title);
    card.dataset.id = movie.id;

    // Prefer backdrop for landscape cards, fall back to poster
    const imgUrl = movie.backdropUrl || movie.posterUrl || null;
    const rating = movie.rating || '—';

    card.innerHTML = `
    ${rank !== null ? `<div class="card-rank" aria-hidden="true">${String(rank).padStart(2, '0')}</div>` : ''}
    ${imgUrl
            ? `<img class="card-poster" src="${imgUrl}" alt="${movie.title}" loading="lazy" />`
            : `<div class="card-poster-placeholder">${movie.title}</div>`
        }
    <div class="card-play-btn" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </div>
    ${rating !== '—' ? `<div class="card-score" aria-label="Rating ${rating}">★ ${rating}</div>` : ''}
    <div class="card-overlay">
      <p class="card-title">${movie.title}</p>
      <p class="card-meta">${[movie.year, movie.duration].filter(Boolean).join(' · ')}</p>
    </div>
  `;

    // Direct playback when clicking the "Play" icon overlay
    const playBtn = card.querySelector('.card-play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent modal
            watchNow(movie);
        });
    }

    // Modal when clicking the rest of the card
    card.addEventListener('click', () => openModal(movie));
    return card;
}

function buildSkeletons(count = 8) {
    return Array.from({ length: count }, () => {
        const el = document.createElement('div');
        el.className = 'skeleton-card';
        return el;
    });
}

async function populateRow(rowId, fetchFn, ranked = false) {
    const row = document.getElementById(rowId);
    if (!row) return;

    // Show skeletons
    buildSkeletons(8).forEach(s => row.appendChild(s));

    try {
        const movies = await fetchFn();
        row.innerHTML = '';
        movies.forEach((m, i) => row.appendChild(buildCard(m, ranked ? i + 1 : null)));
    } catch (err) {
        row.innerHTML = `<p style="color:var(--text-muted);padding:20px;font-size:13px;">Could not load content. Connect your API to display titles.</p>`;
        console.warn(`[CineVault] Failed to load row #${rowId}:`, err);
    }
}

/* ════════════════════════════════════════════════════
   HERO CAROUSEL
════════════════════════════════════════════════════ */
class HeroCarousel {
    constructor(films) {
        this.films = films;
        this.current = 0;
        this.timer = null;

        this.bg = document.getElementById('hero-bg-img');
        this.badge = document.getElementById('hero-badge');
        this.title = document.getElementById('hero-title');
        this.meta = document.getElementById('hero-meta');
        this.desc = document.getElementById('hero-desc');
        this.genreEl = document.getElementById('hero-genres');
        this.indics = document.querySelectorAll('.indicator');
    }

    init() {
        this.render(0);
        this.indics.forEach(btn => {
            btn.addEventListener('click', () => {
                this.show(parseInt(btn.dataset.index, 10));
                this.resetTimer();
            });
        });
        this.startTimer();
    }

    render(index) {
        const f = this.films[index];

        // Hero background — backend returns full backdropUrl
        const bgUrl = f.backdropUrl || (f.backdropPath ? API.poster(f.backdropPath, 'original') : null);
        if (bgUrl) {
            this.bg.style.backgroundImage = `url(${bgUrl})`;
            this.bg.classList.remove('placeholder');
        } else {
            this.bg.style.backgroundImage = '';
            this.bg.style.background = f.gradient || 'linear-gradient(135deg,#0d0508,#060308)';
            this.bg.classList.add('placeholder');
        }

        this.title.textContent = f.title;
        this.desc.textContent = f.description;

        this.meta.innerHTML = `
      <span class="meta-year">${f.year}</span>
      <span class="meta-dot">·</span>
      <span class="meta-duration">${f.duration}</span>
      <span class="meta-dot">·</span>
      <span class="meta-rating">★ ${f.rating}</span>
    `;

        this.genreEl.innerHTML = f.genres.map(g => `<span class="genre-chip">${g}</span>`).join('');

        // Expose current movie for hero Play button
        window._heroCurrentMovie = f;

        // Indicators
        this.indics.forEach((btn, i) => btn.classList.toggle('active', i === index));
        this.current = index;
    }

    show(index) {
        // Fade out content, swap, fade in
        const content = document.querySelector('.hero-content');
        content.style.transition = 'opacity 0.3s ease';
        content.style.opacity = '0';
        setTimeout(() => {
            this.render(index);
            content.style.opacity = '1';
        }, 300);
    }

    startTimer() {
        this.timer = setInterval(() => {
            const next = (this.current + 1) % this.films.length;
            this.show(next);
        }, 7000);
    }

    resetTimer() {
        clearInterval(this.timer);
        this.startTimer();
    }
}

/* ════════════════════════════════════════════════════
   MODAL
   Play button → player.html?id=&type= (VidKing embed)
════════════════════════════════════════════════════ */
let _modalMovie = null;

function openModal(movie) {
    _modalMovie = movie;
    const overlay = document.getElementById('modal-overlay');
    const poster = document.getElementById('modal-poster');
    const title = document.getElementById('modal-title');
    const meta = document.getElementById('modal-meta');
    const desc = document.getElementById('modal-desc');

    // Backend returns full posterUrl; placeholder data has null
    const posterUrl = movie.posterUrl || null;
    const rating = movie.rating || '—';

    poster.innerHTML = posterUrl
        ? `<img src="${posterUrl}" alt="${movie.title} poster" style="width:100%;height:100%;object-fit:cover;" />`
        : `<div style="width:100%;height:100%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;padding:24px;font-family:var(--font-display);color:var(--text-muted);font-size:18px;text-align:center;">${movie.title}</div>`;

    title.textContent = movie.title;
    meta.innerHTML = [
        movie.year && `<span>${movie.year}</span>`,
        movie.duration && `<span>${movie.duration}</span>`,
        rating !== '—' && `<span style="color:var(--gold)">⭑ ${rating}</span>`,
        ...(movie.genres || []).map(g =>
            `<span style="border:1px solid var(--border-subtle);padding:1px 8px;border-radius:4px;font-size:11px;">${g}</span>`
        ),
    ].filter(Boolean).join('<span style="color:var(--text-muted)">·</span>');

    desc.textContent = movie.description || 'No description available.';

    // Wire Play button → player.html
    const playBtn = document.getElementById('modal-play');
    if (playBtn) {
        playBtn.onclick = () => watchNow(movie);
    }

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    _modalMovie = null;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* ════════════════════════════════════════════════════
   TRAILER MODAL (YouTube)
   Uses backend /api/{type}/{id}/trailer → key, then
   embeds https://www.youtube.com/embed/{key}
════════════════════════════════════════════════════ */
async function openTrailerModal(id, type = 'movie') {
    // Fetch trailer key from backend
    const key = await API.fetchTrailer(id, type);
    if (!key) {
        console.warn('[CineVault] No trailer available for', type, id);
        alert('Trailer not available for this title yet. Configure TMDB_API_KEY on the server to enable trailers.');
        return;
    }

    // Open directly on YouTube to avoid embed restrictions (error 153)
    const url = `https://www.youtube.com/watch?v=${key}`;
    window.open(url, '_blank', 'noopener');
}

function closeTrailerModal() {
    const overlay = document.getElementById('trailer-overlay');
    const iframe = document.getElementById('trailer-iframe');
    if (!overlay || !iframe) return;

    // Stop playback by clearing src
    iframe.src = '';
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* ════════════════════════════════════════════════════
   GENRE COUNTS
════════════════════════════════════════════════════ */
async function loadGenreCounts() {
    try {
        const counts = await API.fetchGenres();
        Object.entries(counts).forEach(([genre, count]) => {
            const el = document.getElementById(`genre-${genre.replace(/[^a-z]/g, '')}-count`);
            if (el) el.textContent = count;
        });
    } catch (err) {
        console.warn('[CineVault] Genre counts unavailable:', err);
    }
}

/* ════════════════════════════════════════════════════
   HORIZONTAL ROW SCROLL BUTTONS
════════════════════════════════════════════════════ */
function setupRowScroll(rowId, leftBtnId, rightBtnId) {
    const row = document.getElementById(rowId);
    const left = document.getElementById(leftBtnId);
    const right = document.getElementById(rightBtnId);
    if (!row || !left || !right) return;

    const SCROLL = 640;

    left.addEventListener('click', () => row.scrollBy({ left: -SCROLL, behavior: 'smooth' }));
    right.addEventListener('click', () => row.scrollBy({ left: SCROLL, behavior: 'smooth' }));

    // Show/hide arrows based on scroll position
    const update = () => {
        left.style.opacity = row.scrollLeft > 10 ? '0.8' : '0.25';
        right.style.opacity = (row.scrollLeft + row.clientWidth < row.scrollWidth - 10) ? '0.8' : '0.25';
    };
    row.addEventListener('scroll', update, { passive: true });
    update();
}

/* ════════════════════════════════════════════════════
   SEE ALL & EXPANDABLE ROWS
════════════════════════════════════════════════════ */
function initSeeAll() {
    document.querySelectorAll('.see-all-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('.row-section');
            if (section) {
                const isExpanded = section.classList.toggle('expanded-view');
                e.target.textContent = isExpanded ? 'Show Less ←' : 'See All →';
                // Trigger lazily loaded images or anything out of view
                window.dispatchEvent(new Event('scroll'));
            }
        });
    });
}

/* ════════════════════════════════════════════════════
   NAVBAR SCROLL STATE
════════════════════════════════════════════════════ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    hamburger?.addEventListener('click', () => {
        const open = hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('active', open);
        mobileMenu.setAttribute('aria-hidden', String(!open));
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(a => {
        a.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-hidden', 'true');
        });
    });

    // Active nav link on scroll
    const sections = ['trending', 'new-releases', 'series', 'popular-tv', 'genres'];
    const navLinks = document.querySelectorAll('.nav-link');

    const observerCb = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                const link = document.getElementById(`nav-${entry.target.id}`);
                if (link) link.classList.add('active');
                else document.getElementById('nav-home')?.classList.add('active');
            }
        });
    };

    const observer = new IntersectionObserver(observerCb, { threshold: 0.3 });
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

/* ════════════════════════════════════════════════════
   SEARCH OVERLAY
════════════════════════════════════════════════════ */
function initSearch() {
    const btn = document.getElementById('search-btn');
    const overlay = document.getElementById('search-overlay');
    const close = document.getElementById('search-close');
    const input = document.getElementById('search-input');

    const open = () => { overlay.classList.add('active'); overlay.setAttribute('aria-hidden', 'false'); input.focus(); };
    const shut = () => { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); input.value = ''; };

    btn?.addEventListener('click', open);
    close?.addEventListener('click', shut);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') shut();
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
    });

    // Live search via backend
    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    Object.assign(searchResults.style, {
        position: 'absolute', top: '100%', left: 0, right: 0,
        background: 'rgba(9,9,16,0.96)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(224,16,42,0.12)',
        maxHeight: '320px', overflowY: 'auto',
        zIndex: 200, display: 'none',
        scrollbarWidth: 'thin',
    });
    document.getElementById('search-overlay')?.appendChild(searchResults);

    let searchTimer;
    input?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = input.value.trim();
        if (q.length < 2) { searchResults.style.display = 'none'; return; }
        searchTimer = setTimeout(async () => {
            const results = await API.search(q);
            if (!results.length) { searchResults.style.display = 'none'; return; }
            searchResults.style.display = 'block';
            searchResults.innerHTML = results.slice(0, 8).map(m => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 40px;cursor:pointer;border-bottom:1px solid rgba(201,168,76,0.07);transition:background 0.2s;"
                   onmouseenter="this.style.background='rgba(224,16,42,0.06)'"
                   onmouseleave="this.style.background=''"
                   onclick="watchNow(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                ${m.posterUrl
                    ? `<img src="${m.posterUrl}" style="width:36px;height:54px;object-fit:cover;border-radius:4px;flex-shrink:0;"/>`
                    : `<div style="width:36px;height:54px;background:#1a1a2e;border-radius:4px;flex-shrink:0;"></div>`
                }
                <div>
                  <p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#F2EDE4;">${m.title}</p>
                  <p style="font-size:11px;color:#584850;letter-spacing:0.06em;">${[m.year, m.type?.toUpperCase()].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            `).join('');
        }, 380);
    });
}

/* ════════════════════════════════════════════════════
   GENRE FILTER
════════════════════════════════════════════════════ */
function initGenreFilter() {
    const resultsSection = document.getElementById('genre-results');
    const resultsRow = document.getElementById('genre-results-row');
    const resultsTitle = document.getElementById('genre-results-title');
    const resultsLabel = document.getElementById('genre-results-label');
    const closeBtn = document.getElementById('genre-results-close');

    // Track active genre card
    let activeCard = null;

    document.querySelectorAll('.genre-card[data-genre-id]').forEach(card => {
        card.addEventListener('click', async (e) => {
            e.preventDefault();
            const genreId = card.dataset.genreId;
            const genreName = card.dataset.genreName;

            // Toggle off if same genre clicked again
            if (activeCard === card) {
                closeGenreResults();
                return;
            }

            // Visual selection
            document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('genre-active'));
            card.classList.add('genre-active');
            activeCard = card;

            // Show section with skeleton while loading
            resultsTitle.textContent = genreName;
            resultsLabel.textContent = 'Genre Filter';
            resultsRow.innerHTML = '';
            buildSkeletons(8).forEach(s => resultsRow.appendChild(s));
            resultsSection.style.display = '';
            resultsSection.classList.add('revealed');

            // Smooth scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Fetch & render
            const movies = await API.fetchGenreMovies(genreId);
            resultsRow.innerHTML = '';
            if (movies.length) {
                movies.forEach(m => resultsRow.appendChild(buildCard(m)));
            } else {
                resultsRow.innerHTML = `<p style="color:var(--text-muted);padding:20px;font-size:13px;">No results found for ${genreName}.</p>`;
            }
            setupRowScroll('genre-results-row', 'genre-results-left', 'genre-results-right');
        });
    });

    function closeGenreResults() {
        document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('genre-active'));
        activeCard = null;
        resultsSection.style.display = 'none';
        resultsRow.innerHTML = '';
        document.getElementById('genres')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    closeBtn?.addEventListener('click', closeGenreResults);
}

/* ════════════════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════════════════ */
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '200px 0px 0px 0px' });

    document.querySelectorAll('.reveal-element').forEach(el => observer.observe(el));
    // Expose so rows can re-trigger after async data loads
    window._revealObserver = observer;
}

function revealAll() {
    document.querySelectorAll('.reveal-element:not(.revealed)').forEach(el => el.classList.add('revealed'));
}

/* ════════════════════════════════════════════════════
   NEWSLETTER FORM
════════════════════════════════════════════════════ */
function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    const btn = document.getElementById('newsletter-submit');
    const input = document.getElementById('email-input');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email) return;

        btn.textContent = 'Subscribing…';
        btn.disabled = true;

        // ← Replace with your newsletter API call
        await new Promise(r => setTimeout(r, 1000));

        btn.textContent = '✓ Subscribed';
        btn.style.background = '#2d7a4f';
        input.value = '';

        setTimeout(() => {
            btn.textContent = 'Subscribe';
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    });
}

/* ════════════════════════════════════════════════════
   CURSOR GLOW (optional luxury touch)
════════════════════════════════════════════════════ */
function initCursorGlow() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch

    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    Object.assign(glow.style, {
        position: 'fixed', top: 0, left: 0,
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,16,42,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: '1',
        transform: 'translate(-50%,-50%)',
        transition: 'transform 0.12s ease',
    });
    document.body.appendChild(glow);

    document.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }, { passive: true });
}

/* ════════════════════════════════════════════════════
   PAGE ENTER ANIMATION
════════════════════════════════════════════════════ */
function initPageTransition() {
    // When returning via browser back button, ensure visibility
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            document.body.style.opacity = '1';
        }
    });

    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });
}

/* ════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    initPageTransition();
    initNavbar();
    initSearch();
    initSeeAll();
    initReveal();
    initNewsletter();
    initCursorGlow();
    initGenreFilter();

    // ── HERO CAROUSEL
    try {
        const featured = await API.fetchFeatured();
        const carousel = new HeroCarousel(featured);
        carousel.init();
    } catch (err) {
        console.warn('[CineVault] Hero load failed:', err);
    }

    // ── CONTENT ROWS (all fire in parallel)
    await Promise.allSettled([
        populateRow('trending-row', API.fetchTrending.bind(API), false),
        populateRow('new-releases-row', API.fetchNewReleases.bind(API), false),
        populateRow('series-row', API.fetchSeries.bind(API), false),
        populateRow('popular-tv-row', API.fetchPopularTvSeries.bind(API), false),
        populateRow('top-rated-row', API.fetchTopRated.bind(API), true),
        loadGenreCounts(),
    ]);
    // Ensure all sections visible after async data loads
    revealAll();

    // ── ROW SCROLL ARROWS
    setupRowScroll('trending-row', 'trending-left', 'trending-right');
    setupRowScroll('new-releases-row', 'new-releases-left', 'new-releases-right');
    setupRowScroll('series-row', 'series-left', 'series-right');
    setupRowScroll('popular-tv-row', 'popular-tv-left', 'popular-tv-right');
    setupRowScroll('top-rated-row', 'top-rated-left', 'top-rated-right');

    // Modal close
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

    // Trailer close
    document.getElementById('trailer-close')?.addEventListener('click', closeTrailerModal);
    document.getElementById('trailer-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeTrailerModal(); });

    // Keyboard
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeTrailerModal(); } });

    // Hero buttons
    document.getElementById('hero-play')?.addEventListener('click', () => { if (window._heroCurrentMovie) watchNow(window._heroCurrentMovie); });
    document.getElementById('hero-trailer')?.addEventListener('click', async () => { if (window._heroCurrentMovie) await openTrailerModal(window._heroCurrentMovie.id, window._heroCurrentMovie.type || 'movie'); });
    document.getElementById('hero-wishlist')?.addEventListener('click', () => {
        const list = JSON.parse(localStorage.getItem('cv_watchlist') || '[]');
        const key = 'movie:' + window._heroCurrentMovie.id;
    });

    console.log('%c◈ HorizonX — Premium Cinema', 'color:#E0102A;font-weight:bold;font-size:18px;');
    console.log('%cBackend: http://localhost:3001 | Player: player.html', 'color:#584850;font-size:12px;');
});
