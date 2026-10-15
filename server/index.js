// CineStream Backend API & Video Streaming Server
// Port: 5000 (proxied through Vite in development)

const path = require('path');
const express = require('express');
const cors = require('cors');

const streamRoutes = require('./routes/stream');
const moviesRoutes = require('./routes/movies');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/stream/')) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CineStream Backend API & Video Streamer',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Mount modular routes
app.use('/api/stream', streamRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/user', userRoutes);

// Root fallback for direct backend visits
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>CineStream Backend API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0d12; color: #fff; padding: 40px; }
        h1 { color: #e50914; }
        code { background: #1c1d24; padding: 3px 8px; border-radius: 4px; color: #ff5252; }
        ul { line-height: 1.8; }
        a { color: #4fc3f7; }
      </style>
    </head>
    <body>
      <h1>🎬 CineStream Backend & Streaming Engine</h1>
      <p>Server is running actively on port <strong>${PORT}</strong>.</p>
      <h3>Available Endpoints:</h3>
      <ul>
        <li><code>GET <a href="/api/health">/api/health</a></code> - Health status check</li>
        <li><code>GET <a href="/api/movies">/api/movies</a></code> - Full movie & series catalog</li>
        <li><code>GET <a href="/api/movies/featured">/api/movies/featured</a></code> - Featured hero catalog</li>
        <li><code>GET <a href="/api/stream/meta">/api/stream/meta</a></code> - Video rotation pool metadata (6 demo clips)</li>
        <li><code>GET <a href="/api/stream/0">/api/stream/:id</a></code> - HTTP 206 Partial Content Video Streamer</li>
        <li><code>GET <a href="/api/user/watchlist">/api/user/watchlist</a></code> - Current user watchlist</li>
        <li><code>GET <a href="/api/user/progress">/api/user/progress</a></code> - Continue watching records</li>
      </ul>
    </body>
    </html>
  `);
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎬 CineStream Backend API & Streaming Server Started`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🎥 Video Streaming Engine: http://localhost:${PORT}/api/stream/:id`);
  console.log(`🗄️  Database: prisma/dev.db (SQLite)`);
  console.log(`====================================================`);
});

module.exports = { app, server };
