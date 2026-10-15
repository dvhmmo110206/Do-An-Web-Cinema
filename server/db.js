// CineStream Backend Database Client
// Uses Node.js v22+ built-in node:sqlite module to query prisma/dev.db

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
const db = new DatabaseSync(dbPath);

console.log('[DB] Connected to SQLite database at:', dbPath);

// Helper to safely parse JSON strings or return array
function parseJsonArray(str) {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return str.split(',').map((s) => s.trim());
  }
}

// Format movie record from SQLite to Frontend API format
function formatMovie(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    type: row.type || 'movie',
    synopsis: row.synopsis || '',
    releaseYear: row.releaseYear || 2024,
    year: row.releaseYear || 2024,
    duration: row.duration || '2h',
    rating: row.rating || '8.5',
    matchRate: '98%',
    genres: parseJsonArray(row.genres),
    poster: row.posterUrl || '',
    backdrop: row.backdropUrl || '',
    trailerUrl: row.trailerUrl || `/api/stream/trailer-${row.id}`,
    videoUrl: `/api/stream/${row.id}`,
    isFeatured: Boolean(row.isFeatured),
    isTrending: Boolean(row.isTrending),
    isImax: Boolean(row.isImax),
    director: row.director || '',
    cast: parseJsonArray(row.cast)
  };
}

// Format episode record
function formatEpisode(row) {
  if (!row) return null;
  return {
    id: row.id,
    seriesId: row.seriesId,
    season: row.season || 1,
    episodeNumber: row.episodeNumber || 1,
    title: row.title,
    synopsis: row.synopsis || '',
    duration: row.duration || '55m',
    videoUrl: `/api/stream/${row.id}`,
    stillUrl: row.stillUrl || ''
  };
}

// ----------------- Database Queries -----------------

function getAllMovies() {
  const stmt = db.prepare('SELECT * FROM Movie ORDER BY isFeatured DESC, isTrending DESC');
  const rows = stmt.all();
  return rows.map(formatMovie);
}

function getMovieById(id) {
  const stmt = db.prepare('SELECT * FROM Movie WHERE id = ? OR slug = ? LIMIT 1');
  const row = stmt.get(id, id);
  if (!row) return null;
  const movie = formatMovie(row);
  if (movie.type === 'series') {
    movie.episodes = getEpisodesBySeriesId(movie.id);
  }
  return movie;
}

function getEpisodesBySeriesId(seriesId) {
  const stmt = db.prepare('SELECT * FROM Episode WHERE seriesId = ? ORDER BY season ASC, episodeNumber ASC');
  const rows = stmt.all(seriesId);
  return rows.map(formatEpisode);
}

function searchCatalog(query = '', type = 'all', genre = 'all') {
  let movies = getAllMovies();
  const q = query.trim().toLowerCase();

  if (q) {
    movies = movies.filter((m) => {
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSynopsis = m.synopsis.toLowerCase().includes(q);
      const matchDirector = m.director.toLowerCase().includes(q);
      const matchGenre = m.genres.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchSynopsis || matchDirector || matchGenre;
    });
  }

  if (type && type !== 'all') {
    movies = movies.filter((m) => m.type === type);
  }

  if (genre && genre !== 'all') {
    const target = genre.toLowerCase();
    movies = movies.filter((m) => m.genres.some((g) => g.toLowerCase() === target));
  }

  return movies;
}

function getWatchlist(profileId = 'profile-alex') {
  const stmt = db.prepare(`
    SELECT m.*, w.createdAt as addedAt 
    FROM WatchlistItem w
    JOIN Movie m ON w.movieId = m.id
    WHERE w.profileId = ?
    ORDER BY w.createdAt DESC
  `);
  const rows = stmt.all(profileId);
  return rows.map(formatMovie);
}

function isInWatchlist(profileId = 'profile-alex', movieId) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM WatchlistItem WHERE profileId = ? AND movieId = ?');
  const res = stmt.get(profileId, movieId);
  return (res?.count || 0) > 0;
}

function toggleWatchlist(profileId = 'profile-alex', movieId) {
  const inList = isInWatchlist(profileId, movieId);
  if (inList) {
    const del = db.prepare('DELETE FROM WatchlistItem WHERE profileId = ? AND movieId = ?');
    del.run(profileId, movieId);
    return { inWatchlist: false, movieId };
  } else {
    const id = `wl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const ins = db.prepare('INSERT INTO WatchlistItem (id, profileId, movieId, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
    ins.run(id, profileId, movieId);
    return { inWatchlist: true, movieId };
  }
}

function getWatchProgressList(profileId = 'profile-alex') {
  const stmt = db.prepare(`
    SELECT p.*, m.title as movieTitle, m.backdropUrl, m.type as movieType
    FROM WatchProgress p
    JOIN Movie m ON p.movieId = m.id
    WHERE p.profileId = ?
    ORDER BY p.updatedAt DESC
  `);
  return stmt.all(profileId);
}

function saveWatchProgress(profileId = 'profile-alex', movieId, episodeId = null, currentTime = 0, duration = 0) {
  const progress = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  const existing = db.prepare('SELECT id FROM WatchProgress WHERE profileId = ? AND movieId = ?').get(profileId, movieId);
  
  if (existing) {
    const upd = db.prepare(`
      UPDATE WatchProgress 
      SET episodeId = ?, currentTime = ?, duration = ?, progress = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    upd.run(episodeId, currentTime, duration, progress, existing.id);
  } else {
    const id = `prog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const ins = db.prepare(`
      INSERT INTO WatchProgress (id, profileId, movieId, episodeId, currentTime, duration, progress, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    ins.run(id, profileId, movieId, episodeId, currentTime, duration, progress);
  }
  return { movieId, currentTime, duration, progress };
}

function getAllProfiles() {
  return db.prepare('SELECT * FROM Profile').all();
}

module.exports = {
  db,
  getAllMovies,
  getMovieById,
  getEpisodesBySeriesId,
  searchCatalog,
  getWatchlist,
  isInWatchlist,
  toggleWatchlist,
  getWatchProgressList,
  saveWatchProgress,
  getAllProfiles
};
