// CineStream Database Service
// Provides normalized query helpers across movies and TV series

let _moviesCache = null;

export async function loadMovies() {
  if (_moviesCache) return _moviesCache;

  // 1. Try Backend API first
  try {
    const apiRes = await fetch('/api/movies');
    if (apiRes.ok) {
      const contentType = apiRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await apiRes.json();
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.movies) ? data.movies : null);
        if (list && list.length > 0) {
          _moviesCache = list;
          return _moviesCache;
        }
      }
    }
  } catch {
    // Backend API not reachable or offline, fallback smoothly
  }

  // 2. Fallback to static catalog JSON
  try {
    const res = await fetch('/data/movies.json');
    if (!res.ok) throw new Error('Failed to load catalog');
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('Not JSON response');
    const staticData = await res.json();
    const list = Array.isArray(staticData) ? staticData : (staticData && Array.isArray(staticData.movies) ? staticData.movies : null);
    if (list && list.length > 0) {
      _moviesCache = list;
      return _moviesCache;
    }
  } catch (err) {
    if (window.__CINESTREAM_EMBEDDED_DATA__) {
      _moviesCache = window.__CINESTREAM_EMBEDDED_DATA__;
      return _moviesCache;
    }
    return [];
  }
}

export async function getItemById(id) {
  // Try Backend API directly for single item (includes DB episodes)
  try {
    const apiRes = await fetch(`/api/movies/${encodeURIComponent(id)}`);
    if (apiRes.ok) {
      const contentType = apiRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const item = await apiRes.json();
        if (item && (item.id || item.title)) return item;
      }
    }
  } catch {
    // fallback
  }

  const items = await loadMovies();
  return items.find((item) => item.id === id || item.slug === id) || items[0];
}

export async function getFeaturedHero() {
  const items = await loadMovies();
  return items.filter((item) => item.isFeatured);
}

export async function getTrending() {
  const items = await loadMovies();
  return items.filter((item) => item.isTrending);
}

export async function getMoviesOnly() {
  const items = await loadMovies();
  return items.filter((item) => item.type === 'movie');
}

export async function getSeriesOnly() {
  const items = await loadMovies();
  return items.filter((item) => item.type === 'series');
}

export async function getItemsByGenre(genre) {
  const items = await loadMovies();
  if (!genre || genre.toLowerCase() === 'all') return items;
  const target = genre.toLowerCase();
  return items.filter((item) =>
    item.genres.some((g) => g.toLowerCase() === target)
  );
}

export async function searchCatalog(query = '', filters = {}) {
  let items = await loadMovies();
  const q = query.trim().toLowerCase();

  if (q) {
    items = items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSynopsis = item.synopsis?.toLowerCase().includes(q);
      const matchDirector = item.director?.toLowerCase().includes(q);
      const matchCast = item.cast?.some((c) => c.name.toLowerCase().includes(q));
      const matchGenre = item.genres?.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchSynopsis || matchDirector || matchCast || matchGenre;
    });
  }

  if (filters.genre && filters.genre !== 'all') {
    const g = filters.genre.toLowerCase();
    items = items.filter((item) =>
      item.genres.some((itemGenre) => itemGenre.toLowerCase() === g)
    );
  }

  if (filters.type && filters.type !== 'all') {
    items = items.filter((item) => item.type === filters.type);
  }

  if (filters.isImax) {
    items = items.filter((item) => item.isImax);
  }

  if (filters.minRating) {
    items = items.filter((item) => parseFloat(item.rating) >= filters.minRating);
  }

  return items;
}

export async function getSimilarItems(currentId, limit = 6) {
  const items = await loadMovies();
  const current = items.find((item) => item.id === currentId);
  if (!current) return items.slice(0, limit);

  return items
    .filter((item) => item.id !== currentId)
    .sort((a, b) => {
      const commonA = a.genres.filter((g) => current.genres.includes(g)).length;
      const commonB = b.genres.filter((g) => current.genres.includes(g)).length;
      return commonB - commonA;
    })
    .slice(0, limit);
}
