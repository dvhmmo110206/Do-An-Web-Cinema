// CineStream Movies & Series REST API Routes

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/movies - Get catalog with optional filters
router.get('/', (req, res) => {
  const { type, genre, search } = req.query;
  if (search || type || genre) {
    const results = db.searchCatalog(search || '', type || 'all', genre || 'all');
    return res.json(results);
  }
  const movies = db.getAllMovies();
  res.json(movies);
});

// GET /api/movies/featured - Featured hero movies
router.get('/featured', (req, res) => {
  const movies = db.getAllMovies().filter((m) => m.isFeatured);
  res.json(movies);
});

// GET /api/movies/trending - Trending carousel movies
router.get('/trending', (req, res) => {
  const movies = db.getAllMovies().filter((m) => m.isTrending);
  res.json(movies);
});

// GET /api/movies/search - Search catalog
router.get('/search', (req, res) => {
  const { q, type, genre } = req.query;
  const results = db.searchCatalog(q || '', type || 'all', genre || 'all');
  res.json(results);
});

// GET /api/movies/:id - Get movie or series details by ID or Slug
router.get('/:id', (req, res) => {
  const movie = db.getMovieById(req.params.id);
  if (!movie) {
    return res.status(404).json({ error: 'Movie or series not found', id: req.params.id });
  }
  res.json(movie);
});

module.exports = router;
