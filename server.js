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
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  next();
});

app.use(helmet({
  contentSecurityPolicy:     false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
  frameguard:                false
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
    if (!TMDB_KEY || TMDB_KEY === 'YOUR_TMDB_API_KEY_HERE') throw new Error('TMDB_API_KEY not set in .env');
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

async function fetchMultiplePages(path, params = {}, pages = 5) {
  const all = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const data = await tmdb(path, { ...params, page: p });
      if (data.results) all.push(...data.results);
    } catch (_) { break; }
  }
  return all;
}

/* ── MOVIES category routes ───────────────────────── */
app.get('/api/movies/latest', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/movie', {
            sort_by: 'primary_release_date.desc',
            'vote_count.gte': 50,
            'vote_average.gte': 5
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movies/top-rated', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/movie', {
            sort_by: 'vote_average.desc',
            'vote_count.gte': 500
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movies/featured', async (req, res) => {
    try {
        const data = await tmdb('/movie/popular');
        const results = data.results.slice(0, 5);
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── TV SHOWS category routes ─────────────────────── */
app.get('/api/tv/latest', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            sort_by: 'first_air_date.desc',
            'vote_count.gte': 20,
            'vote_average.gte': 5
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tv/top-rated', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            sort_by: 'vote_average.desc',
            'vote_count.gte': 200
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tv/featured', async (req, res) => {
    try {
        const data = await tmdb('/tv/popular');
        const results = data.results.slice(0, 5);
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── ANIME category routes (Japanese animation) ───── */
app.get('/api/anime/latest', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_genres: '16',
            with_origin_country: 'JP',
            sort_by: 'first_air_date.desc',
            'vote_count.gte': 10
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/anime/top-rated', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_genres: '16',
            with_origin_country: 'JP',
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/anime/featured', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_genres: '16',
            with_origin_country: 'JP',
            sort_by: 'popularity.desc',
            'vote_count.gte': 200
        }, 1);
        res.json({ results: results.slice(0, 5).map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── K-DRAMA category routes (Korean TV) ──────────── */
app.get('/api/kdrama/latest', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_origin_country: 'KR',
            sort_by: 'first_air_date.desc',
            'vote_count.gte': 10
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/kdrama/top-rated', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_origin_country: 'KR',
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100
        });
        res.json({ results: results.map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/kdrama/featured', async (req, res) => {
    try {
        const results = await fetchMultiplePages('/discover/tv', {
            with_origin_country: 'KR',
            sort_by: 'popularity.desc',
            'vote_count.gte': 100
        }, 1);
        res.json({ results: results.slice(0, 5).map(normalise) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── EXISTING ROUTES ──────────────────────────────── */

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

// --- Route 1: Get all seasons for a TV show ---
app.get('/api/tv/:id/seasons', async (req, res) => {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });
    const data = await tmdb(`/tv/${id}`);
    const seasons = (data.seasons || [])
      .filter(s => s.season_number > 0)
      .map(s => ({
        id:            s.id,
        season_number: s.season_number,
        name:          s.name,
        episode_count: s.episode_count,
        poster:        s.poster_path,
        air_date:      s.air_date
      }));
    res.json({ seasons });
  } catch (err) {
    console.error('Error fetching seasons:', err.message);
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

// --- Route 2: Get all episodes for a specific season ---
app.get('/api/tv/:id/season/:season', async (req, res) => {
  try {
    const { id, season } = req.params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(season)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    const data = await tmdb(`/tv/${id}/season/${season}`);
    const episodes = (data.episodes || []).map(ep => ({
      id:             ep.id,
      episode_number: ep.episode_number,
      season_number:  ep.season_number,
      name:           ep.name,
      overview:       ep.overview,
      still:          ep.still_path,
      air_date:       ep.air_date,
      runtime:        ep.runtime,
      rating:         ep.vote_average ? parseFloat(ep.vote_average.toFixed(1)) : null
    }));
    res.json({ season_number: parseInt(season), episodes });
  } catch (err) {
    console.error('Error fetching episodes:', err.message);
    res.status(500).json({ error: 'Failed to fetch episodes' });
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
        tmdbKeySet: !!TMDB_KEY && TMDB_KEY !== 'YOUR_TMDB_API_KEY_HERE',
        time: new Date().toISOString(),
    });
});

/* ── Static frontend: only public/ (never .env, server.js, node_modules) ── */
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

/* ── Start ───────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`◈ HorizonX Backend running → http://localhost:${PORT}`);
    if (!TMDB_KEY || TMDB_KEY === 'YOUR_TMDB_API_KEY_HERE') {
        console.error('\x1b[31m❌ ERROR: TMDB_API_KEY is not set in .env — movie posters and data will not load. Get your free key at https://www.themoviedb.org/settings/api\x1b[0m');
    }
});
