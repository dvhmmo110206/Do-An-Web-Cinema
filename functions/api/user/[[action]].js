// Cloudflare Pages Function: /api/user/*
// Handles user watchlist and progress using Cloudflare D1

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // Handle Watchlist Toggle
  if (url.pathname.includes('/watchlist/toggle') && request.method === 'POST') {
    try {
      const body = await request.json();
      const movieId = body.movieId;

      if (env && env.DB && movieId) {
        // Toggle in D1
        const existing = await env.DB.prepare('SELECT id FROM WatchlistItem WHERE movieId = ?').bind(movieId).first();
        if (existing) {
          await env.DB.prepare('DELETE FROM WatchlistItem WHERE movieId = ?').bind(movieId).run();
          return new Response(JSON.stringify({ success: true, inList: false }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        } else {
          await env.DB.prepare('INSERT INTO WatchlistItem (id, movieId, addedAt) VALUES (?, ?, ?)').bind('wl-' + Date.now(), movieId, Date.now()).run();
          return new Response(JSON.stringify({ success: true, inList: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
      }
    } catch {}

    return new Response(JSON.stringify({ success: true, inList: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Handle Progress Sync
  if (url.pathname.includes('/progress') && request.method === 'POST') {
    try {
      const body = await request.json();
      if (env && env.DB && body.contentId) {
        await env.DB.prepare(`
          INSERT INTO WatchProgress (id, contentId, currentTime, duration, progress, lastWatched)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(contentId) DO UPDATE SET
            currentTime = excluded.currentTime,
            duration = excluded.duration,
            progress = excluded.progress,
            lastWatched = excluded.lastWatched
        `).bind(
          'prog-' + body.contentId,
          body.contentId,
          body.currentTime || 0,
          body.duration || 0,
          Math.round(((body.currentTime || 0) / (body.duration || 1)) * 100),
          Date.now()
        ).run();
      }
    } catch {}

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
