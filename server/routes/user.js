// CineStream User State & Progress REST API Routes

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/user/watchlist - Get saved watchlist for profile
router.get('/watchlist', (req, res) => {
  const profileId = req.query.profileId || 'profile-alex';
  const list = db.getWatchlist(profileId);
  res.json(list);
});

// POST /api/user/watchlist/toggle - Add or remove item from watchlist
router.post('/watchlist/toggle', (req, res) => {
  const { movieId, profileId = 'profile-alex' } = req.body;
  if (!movieId) {
    return res.status(400).json({ error: 'movieId is required' });
  }
  const result = db.toggleWatchlist(profileId, movieId);
  res.json(result);
});

// GET /api/user/progress - Get continue watching list with timestamps
router.get('/progress', (req, res) => {
  const profileId = req.query.profileId || 'profile-alex';
  const list = db.getWatchProgressList(profileId);
  res.json(list);
});

// POST /api/user/progress - Update current playback position and percentage
router.post('/progress', (req, res) => {
  const { profileId = 'profile-alex', episodeId, currentTime, duration } = req.body;
  const movieId = req.body.movieId || req.body.contentId;
  if (!movieId) {
    return res.status(400).json({ error: 'movieId is required' });
  }
  const result = db.saveWatchProgress(
    profileId,
    movieId,
    episodeId || null,
    Math.round(currentTime || 0),
    Math.round(duration || 0)
  );
  res.json(result);
});

// GET /api/user/profiles - Get available profiles
router.get('/profiles', (req, res) => {
  const profiles = db.getAllProfiles();
  res.json(profiles);
});

module.exports = router;
