/**
 * CineVault — Backend Proxy Server
 * Proxies TMDB API calls server-side so the API key is never exposed.
 * Run: node server.js
 * Public hosting: serve only public/ folder; secrets in .env (never committed).
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

const TMDB_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

/* ── Security: headers ───────────────────────────────── */
app.use(helmet({
    contentSecurityPolicy: false, // allow inline scripts/styles if needed; tighten for production
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/* ── Rate limiting (API abuse protection) ────────────── */
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: isProd ? 60 : 300,  // 60 req/min in prod, 300 in dev
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

/* ── CORS ─────────────────────────────────────────────── */
app.use(cors({ origin: isProd ? undefined : '*' })); // in prod, set CORS_ORIGIN if needed
app.use(express.json());

/* ── Param validation: numeric IDs only ───────────────── */
function validId(id) {
    const n = parseInt(id, 10);
    return Number.isInteger(n) && n > 0 && String(n) === String(id);
}

/* ── Utility: call TMDB ───────────────────────────────── */
async function tmdb(tmdbPath, params = {}) {
    if (!TMDB_KEY) throw new Error('TMDB_API_KEY not set in .env');
    const url = new URL(`${TMDB_BASE}${tmdbPath}`);
    url.searchParams.set('api_key', TMDB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB error ${res.status}: ${tmdbPath}`);
    return res.json();
}

/* ── Normalise a raw TMDB movie/TV object ─────────────── */
const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 18: 'Drama', 27: 'Horror', 10749: 'Romance',
    878: 'Sci-Fi', 9648: 'Mystery', 53: 'Thriller', 99: 'Documentary',
    10765: 'Sci-Fi & Fantasy', 10759: 'Action & Adventure',
};

function normalise(raw) {
    const isTV = raw.media_type === 'tv' || !!raw.first_air_date;
    const mins = raw.runtime || null;
    const duration = mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : null;
    return {
        id: raw.id,
        type: isTV ? 'tv' : 'movie',
        title: raw.title || raw.name || 'Untitled',
        year: (raw.release_date || raw.first_air_date || '').slice(0, 4),
        rating: raw.vote_average ? raw.vote_average.toFixed(1) : null,
        duration,
        description: raw.overview || '',
        posterUrl: raw.poster_path ? `${IMG_BASE}/w500${raw.poster_path}` : null,
        backdropUrl: raw.backdrop_path ? `${IMG_BASE}/original${raw.backdrop_path}` : null,
        genres: (raw.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean),
        seasons: raw.number_of_seasons || null,
        episodes: raw.number_of_episodes || null,
    };
}

/* ════════════════════════════════════════════════════════
   ROUTES
════════════════════════════════════════════════════════ */

/** GET /api/trending — weekly trending movies */
app.get('/api/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/movie/week');
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/new-releases — now playing */
app.get('/api/new-releases', async (req, res) => {
    try {
        const data = await tmdb('/movie/now_playing');
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/top-rated — top rated movies */
app.get('/api/top-rated', async (req, res) => {
    try {
        const data = await tmdb('/movie/top_rated');
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/featured — popular movies for hero carousel (first 3) */
app.get('/api/featured', async (req, res) => {
    try {
        const data = await tmdb('/movie/popular');
        // Fetch full details for runtime on the top 3
        const top3 = data.results.slice(0, 3);
        const detailed = await Promise.all(
            top3.map(m => tmdb(`/movie/${m.id}`).then(d => { d.genre_ids = (d.genres || []).map(g => g.id); return d; }).catch(() => m))
        );
        res.json(detailed.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/series — trending TV series */
app.get('/api/series', async (req, res) => {
    try {
        const data = await tmdb('/trending/tv/week');
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/tv/popular — popular TV series */
app.get('/api/tv/popular', async (req, res) => {
    try {
        const data = await tmdb('/tv/popular');
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/search?q=... — search movies and TV (multi) */
app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').trim().slice(0, 200);
    if (!q) return res.status(400).json({ error: 'Missing query param: q' });
    try {
        const data = await tmdb('/search/multi', { query: q });
        const filtered = (data.results || []).filter(
            (r) => r.media_type === 'movie' || r.media_type === 'tv'
        );
        res.json(filtered.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/movie/:id — single movie details */
app.get('/api/movie/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid movie id' });
    try {
        const raw = await tmdb(`/movie/${req.params.id}`);
        // Add genre_ids equivalent from genres array
        raw.genre_ids = (raw.genres || []).map(g => g.id);
        res.json(normalise(raw));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/tv/:id — single TV show details */
app.get('/api/tv/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid tv id' });
    try {
        const raw = await tmdb(`/tv/${req.params.id}`);
        raw.genre_ids = (raw.genres || []).map(g => g.id);
        res.json(normalise(raw));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/tv/:id/season/:season_number — TV season details for episode count */
app.get('/api/tv/:id/season/:season_number', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid tv id' });
    if (!validId(req.params.season_number)) return res.status(400).json({ error: 'Invalid season number' });
    try {
        const raw = await tmdb(`/tv/${req.params.id}/season/${req.params.season_number}`);
        // Return exactly what the player expects: { episodes: count }
        res.json({ episodes: raw.episodes ? raw.episodes.length : 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/genres — genre list with counts */
app.get('/api/genres', async (req, res) => {
    try {
        const data = await tmdb('/genre/movie/list');
        res.json(data.genres);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/genre/:id/movies — discover movies by TMDB genre ID */
app.get('/api/genre/:id/movies', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid genre id' });
    try {
        const data = await tmdb('/discover/movie', {
            with_genres: req.params.id,
            sort_by: 'popularity.desc',
            'vote_count.gte': 50,
        });
        res.json(data.results.map(normalise));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/movie/:id/trailer — YouTube trailer key */
app.get('/api/movie/:id/trailer', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid movie id' });
    try {
        const data = await tmdb(`/movie/${req.params.id}/videos`);
        const trailer = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
            || (data.results || []).find(v => v.site === 'YouTube');
        if (trailer) res.json({ key: trailer.key });
        else res.status(404).json({ error: 'No trailer found' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/tv/:id/trailer — YouTube trailer key for TV */
app.get('/api/tv/:id/trailer', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid tv id' });
    try {
        const data = await tmdb(`/tv/${req.params.id}/videos`);
        const trailer = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
            || (data.results || []).find(v => v.site === 'YouTube');
        if (trailer) res.json({ key: trailer.key });
        else res.status(404).json({ error: 'No trailer found' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** Health check */
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        tmdbKeySet: !!TMDB_KEY,
        time: new Date().toISOString(),
    });
});

/* ── Static frontend: only public/ (never .env, server.js, node_modules) ── */
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

/* ── Start ───────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`◈ CineVault Backend running → http://localhost:${PORT}`);
    if (!TMDB_KEY) {
        console.warn('⚠  TMDB_API_KEY not set. Add it to .env and restart.');
    }
});
