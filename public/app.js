/* ════════════════════════════════════════════════════════
   app.js — HorizonX Redesign Logic
════════════════════════════════════════════════════════ */

/* Images are already full URLs from the normalised API response */

/* ── DOM ELEMENTS ─────────────────────────────────────── */
const navLinks       = document.querySelectorAll('.nav-item');
const homeView       = document.getElementById('homeView');
const categoryView   = document.getElementById('categoryView');
const mainContent    = document.getElementById('mainContent');

// Search
const searchToggle   = document.getElementById('searchToggle');
const searchOverlay  = document.getElementById('searchOverlay');
const searchClose    = document.getElementById('searchClose');
const searchInput    = document.getElementById('searchInput');
const searchResults  = document.getElementById('searchResults');

// Hero
const heroSlides     = document.getElementById('heroSlides');
const heroBackdrop   = document.getElementById('heroBackdrop');
const heroBadgeText  = document.getElementById('heroBadgeText');
const heroTitle      = document.getElementById('heroTitle');
const heroMeta       = document.getElementById('heroMeta');
const heroDescription= document.getElementById('heroDescription');
const heroGenres     = document.getElementById('heroGenres');
const heroIndicators = document.getElementById('heroIndicators');

// Hero Actions
const heroPlay       = document.getElementById('heroPlay');
const heroTrailer    = document.getElementById('heroTrailer');

// Category View
const catBannerTitle = document.getElementById('catBannerTitle');
const catBannerSub   = document.getElementById('catBannerSub');
const catFilterBtns  = document.querySelectorAll('.cat-filter-btn');
const categoryGridArea= document.getElementById('categoryGridArea');
const loadMoreBtn    = document.getElementById('loadMoreBtn');
const loadMoreBar    = document.getElementById('loadMoreBar');

// Modals (existing HTML)
const modalOverlay   = document.getElementById('modalOverlay');
const modalClose     = document.getElementById('modalClose');
const modalBackdropImg= document.getElementById('modalBackdropImg');
const modalTitle     = document.getElementById('modalTitle');
const modalYear      = document.getElementById('modalYear');
const modalRuntime   = document.getElementById('modalRuntime');
const modalRating    = document.getElementById('modalRating');
const modalGenres    = document.getElementById('modalGenres');
const modalDesc      = document.getElementById('modalDesc');
const modalPlay      = document.getElementById('modalPlay');
const modalTrailer   = document.getElementById('modalTrailer');

/* ── STATE ────────────────────────────────────────────── */
let currentSection = 'home'; // 'home', 'movies', 'tvshows', 'anime', 'kdrama'
let categoryFilter = 'latest'; // 'latest', 'top-rated'
let categoryPage   = 1;
let isFetchingCategory = false;

// Hero State
let heroItems = [];
let currentHeroIndex = 0;
let heroInterval;

/* ── DATA MAPPING ─────────────────────────────────────── */
const SECTION_META = {
  movies:  { title: 'MOVIES', sub: 'Explore cinematic masterpieces', type: 'movie' },
  tvshows: { title: 'TV SHOWS', sub: 'Binge-worthy television', type: 'tv' },
  anime:   { title: 'ANIME', sub: 'The best of Japanese animation', type: 'tv' },
  kdrama:  { title: 'K-DRAMA', sub: 'Captivating Korean dramas', type: 'tv' }
};

const API = {
  movies:  { latest: '/api/movies/latest', 'top-rated': '/api/movies/top-rated', featured: '/api/movies/featured' },
  tvshows: { latest: '/api/tv/latest', 'top-rated': '/api/tv/top-rated', featured: '/api/tv/featured' },
  anime:   { latest: '/api/anime/latest', 'top-rated': '/api/anime/top-rated', featured: '/api/anime/featured' },
  kdrama:  { latest: '/api/kdrama/latest', 'top-rated': '/api/kdrama/top-rated', featured: '/api/kdrama/featured' }
};

/* ── INIT ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupSearch();
  setupSliders();
  setupModals();
  
  // Load initial HOME data
  loadHomeData();
});

/* ── NAVIGATION & VIEWS ───────────────────────────────── */
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const section = link.dataset.section;
      switchSection(section);
      
      // Close mobile menu
      document.getElementById('navLinks').classList.remove('open');
      document.getElementById('hamburger').classList.remove('active');
    });
  });

  // Mobile hamburger
  document.getElementById('hamburger').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Browse All buttons in Home View
  document.querySelectorAll('.group-browse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sec = e.target.dataset.section;
      document.querySelector(`.nav-item[data-section="${sec}"]`).click();
    });
  });

  // Category Filter bar
  catFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      catFilterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      categoryFilter = e.target.dataset.filter;
      loadCategoryGrid(true); // reset grid
    });
  });

  // Load More btn
  loadMoreBtn.addEventListener('click', () => {
    categoryPage++;
    loadCategoryGrid(false);
  });
}

function switchSection(section) {
  currentSection = section;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (section === 'home') {
    categoryView.classList.add('hidden');
    homeView.classList.remove('hidden');
    loadHomeData();
  } else {
    homeView.classList.add('hidden');
    categoryView.classList.remove('hidden');
    
    // Update Banner
    catBannerTitle.textContent = SECTION_META[section].title;
    catBannerSub.textContent = SECTION_META[section].sub;
    
    // Reset category state
    categoryFilter = 'latest';
    categoryPage = 1;
    catFilterBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'latest');
    });

    loadCategoryHero(section);
    loadCategoryGrid(true);
  }
}

/* ── API HELPERS ──────────────────────────────────────── */
async function fetchApi(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    // Handle both { results: [...] } and plain array responses
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (data.results) items = data.results;
    // Filter out items with no image at all
    return items.filter(item => item.posterUrl || item.backdropUrl);
  } catch (e) {
    console.error(`Error fetching ${url}:`, e);
    return [];
  }
}

/* ── HOME VIEW LOGIC ──────────────────────────────────── */
async function loadHomeData() {
  // Load Hero with trending movies
  const trending = await fetchApi('/api/trending');
  initHero(trending.slice(0, 5), 'movie');

  // Load Rows
  loadRowGroup('movies', 'latest');
  loadRowGroup('tvshows', 'latest');
  loadRowGroup('anime', 'latest');
  loadRowGroup('kdrama', 'latest');
}

function setupSliders() {
  // Setup filter pills for home rows
  document.querySelectorAll('.filter-pills').forEach(group => {
    const section = group.dataset.group;
    group.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        loadRowGroup(section, e.target.dataset.filter);
      });
    });
  });

  // Slider Arrows
  document.querySelectorAll('.slider-arrow').forEach(arrow => {
    arrow.addEventListener('click', (e) => {
      const targetId = e.target.dataset.target;
      const track = document.getElementById(targetId);
      const isLeft = e.target.classList.contains('left');
      const scrollAmount = track.clientWidth * 0.8;
      track.scrollBy({ left: isLeft ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    });
  });
}

async function loadRowGroup(section, filter) {
  const track = document.getElementById(`slider${capitalize(section)}`);
  track.innerHTML = createSkeletons(6, 'slider-card');
  
  const url = API[section][filter];
  const items = await fetchApi(url);
  
  track.innerHTML = '';
  items.forEach(item => {
    track.appendChild(createSliderCard(item, SECTION_META[section].type));
  });
}

/* ── HERO CAROUSEL ────────────────────────────────────── */
function initHero(items, type) {
  heroItems = items;
  currentHeroIndex = 0;
  clearInterval(heroInterval);
  
  heroIndicators.innerHTML = '';
  items.forEach((_, i) => {
    const ind = document.createElement('div');
    ind.className = `indicator ${i === 0 ? 'active' : ''}`;
    ind.addEventListener('click', () => setHeroSlide(i, type));
    heroIndicators.appendChild(ind);
  });

  if (items.length > 0) setHeroSlide(0, type);

  heroInterval = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroItems.length;
    setHeroSlide(currentHeroIndex, type);
  }, 7000);
}

function setHeroSlide(index, type) {
  currentHeroIndex = index;
  const item = heroItems[index];
  if (!item) return;

  heroBackdrop.style.backgroundImage = item.backdropUrl ? `url(${item.backdropUrl})` : 'none';
  heroTitle.textContent = item.title;
  heroDescription.textContent = item.description || 'No synopsis available.';
  
  const year = item.year || '';
  const rating = item.rating || 'NR';
  
  heroMeta.innerHTML = `
    <span>${year}</span> <span class="meta-dot">·</span>
    <span class="meta-rating">★ ${rating}</span> <span class="meta-dot">·</span>
    <span class="meta-rating-badge">4K HDR</span>
  `;

  heroGenres.innerHTML = (item.genres || []).slice(0, 3).map(g => `<span class="hero-genre-tag">${g}</span>`).join('');

  document.querySelectorAll('.indicator').forEach((ind, i) => {
    ind.classList.toggle('active', i === index);
  });

  // Attach Play/Trailer actions
  heroPlay.onclick = () => window.location.href = `player.html?type=${item.type || type}&id=${item.id}`;
  heroTrailer.onclick = async () => {
    const ep = item.type || type;
    try {
      const res = await fetch(`/api/${ep}/${item.id}/trailer`);
      const data = await res.json();
      if (data.key) {
        openTrailerModal(data.key);
      } else {
        alert('No trailer found.');
      }
    } catch (e) {
      console.error(e);
      alert('Error loading trailer.');
    }
  };
}

async function loadCategoryHero(section) {
  const url = API[section].featured;
  const items = await fetchApi(url);
  initHero(items, SECTION_META[section].type);
}

/* ── CATEGORY GRID VIEW ───────────────────────────────── */
async function loadCategoryGrid(reset = false) {
  if (isFetchingCategory) return;
  isFetchingCategory = true;
  
  if (reset) {
    categoryPage = 1;
    categoryGridArea.innerHTML = createSkeletons(12, 'poster-card');
    loadMoreBar.style.display = 'flex';
  }
  
  loadMoreBtn.textContent = 'Loading...';
  loadMoreBtn.disabled = true;

  const url = `${API[currentSection][categoryFilter]}?page=${categoryPage}`;
  const items = await fetchApi(url);

  if (reset) categoryGridArea.innerHTML = '';
  
  items.forEach(item => {
    categoryGridArea.appendChild(createPosterCard(item, SECTION_META[currentSection].type));
  });

  loadMoreBtn.textContent = 'Load More';
  loadMoreBtn.disabled = false;
  isFetchingCategory = false;

  if (items.length === 0) loadMoreBar.style.display = 'none';
}

/* ── UI COMPONENTS ────────────────────────────────────── */
function createSliderCard(item, type) {
  const div = document.createElement('div');
  div.className = 'slider-card';
  const imgUrl = item.backdropUrl || item.posterUrl || '';
  
  div.innerHTML = `
    <img src="${imgUrl}" class="card-img" alt="${item.title}" loading="lazy"/>
    <div class="card-overlay">
      <h3 class="card-title">${item.title}</h3>
      <div class="card-meta">
        <span>${item.year || ''}</span>
        <span class="card-rating">★ ${item.rating || 'NR'}</span>
      </div>
    </div>
  `;
  div.addEventListener('click', () => openModal(item, item.type || type));
  return div;
}

function createPosterCard(item, type) {
  const div = document.createElement('div');
  div.className = 'poster-card';
  const imgUrl = item.posterUrl || item.backdropUrl || '';
  
  div.innerHTML = `
    <img src="${imgUrl}" class="card-img" alt="${item.title}" loading="lazy"/>
    <div class="poster-overlay">
      <div class="poster-play-btn">▶</div>
    </div>
  `;
  div.addEventListener('click', () => openModal(item, item.type || type));
  return div;
}

function createSkeletons(count, className) {
  return Array(count).fill(`<div class="${className} skeleton"></div>`).join('');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── MODALS ───────────────────────────────────────────── */
function setupModals() {
  modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
    modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
      modalOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  const trailerModalClose = document.getElementById('trailerModalClose');
  if (trailerModalClose) {
    trailerModalClose.addEventListener('click', closeTrailerModal);
  }

  const trailerModal = document.getElementById('trailerModal');
  if (trailerModal) {
    trailerModal.addEventListener('click', function(e) {
      if (e.target === this) closeTrailerModal();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeTrailerModal();
      modalOverlay.classList.remove('active');
      modalOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}

function openModal(item, type) {
  modalTitle.textContent = item.title;
  modalYear.textContent = item.year || '';
  modalRating.textContent = `★ ${item.rating || 'NR'}`;
  modalDesc.textContent = item.description || 'No description available.';
  
  if (item.backdropUrl) {
    modalBackdropImg.src = item.backdropUrl;
  } else {
    modalBackdropImg.src = '';
  }

  modalGenres.innerHTML = (item.genres || []).map(g => `<span>${g}</span>`).join('');
  
  modalPlay.onclick = () => window.location.href = `player.html?type=${item.type || type}&id=${item.id}`;
  modalTrailer.onclick = async () => {
    const ep = item.type || type;
    try {
      const res = await fetch(`/api/${ep}/${item.id}/trailer`);
      const data = await res.json();
      if (data.key) {
        openTrailerModal(data.key);
      } else {
        alert('No trailer found.');
      }
    } catch (e) {
      console.error(e);
      alert('Error loading trailer.');
    }
  };

  modalOverlay.style.display = 'flex';
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openTrailerModal(key) {
  const modal  = document.getElementById('trailerModal');
  const frame  = document.getElementById('trailerFrame');
  if (!modal || !frame || !key) return;
  frame.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTrailerModal() {
  const modal = document.getElementById('trailerModal');
  const frame = document.getElementById('trailerFrame');
  if (!modal || !frame) return;
  frame.src = '';
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* ── SEARCH ───────────────────────────────────────────── */
function setupSearch() {
  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
  });
  
  searchClose.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      searchOverlay.classList.add('active');
      searchInput.focus();
    }
    if (e.key === 'Escape') searchOverlay.classList.remove('active');
  });

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(e.target.value), 500);
  });
}

async function performSearch(query) {
  if (!query.trim()) {
    searchResults.innerHTML = '';
    return;
  }
  
  searchResults.innerHTML = createSkeletons(6, 'poster-card');
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  
  const items = (data || []).slice(0, 12);
  searchResults.innerHTML = '';
  
  if (items.length === 0) {
    searchResults.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1;">No results found.</p>';
    return;
  }
  
  items.forEach(item => {
    const el = createPosterCard(item, item.type || 'movie');
    searchResults.appendChild(el);
  });
}
