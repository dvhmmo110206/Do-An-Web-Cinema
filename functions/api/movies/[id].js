// Cloudflare Pages Function: GET /api/movies/:id
// Fetches single movie/series details including episodes from Cloudflare D1

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Movie ID required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 1. Try D1 SQL
  if (env && env.DB) {
    try {
      const stmt = env.DB.prepare('SELECT * FROM Movie WHERE id = ? OR slug = ? LIMIT 1').bind(id, id);
      const row = await stmt.first();

      if (row) {
        // Fetch episodes if series
        let episodes = [];
        try {
          const epStmt = env.DB.prepare('SELECT * FROM Episode WHERE seriesId = ? ORDER BY season ASC, episodeNumber ASC').bind(row.id);
          const { results } = await epStmt.all();
          episodes = results || [];
        } catch {}

        const movie = {
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
          genres: typeof row.genres === 'string' ? row.genres.split(',').map((g) => g.trim()) : (row.genres || []),
          poster: row.posterUrl || '',
          backdrop: row.backdropUrl || '',
          videoUrl: `/api/stream/${row.id}`,
          isFeatured: Boolean(row.isFeatured),
          isTrending: Boolean(row.isTrending),
          isImax: Boolean(row.isImax),
          director: row.director || '',
          cast: typeof row.cast === 'string' ? JSON.parse(row.cast || '[]') : (row.cast || []),
          episodes: episodes.map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            season: ep.season || 1,
            title: ep.title,
            synopsis: ep.synopsis,
            duration: ep.duration,
            thumbnail: ep.thumbnailUrl || row.backdropUrl,
            videoUrl: ep.videoUrl || `/api/stream/${ep.id}`
          }))
        };

        return new Response(JSON.stringify(movie), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (err) {
      console.error('D1 GetMovie Error:', err);
    }
  }

  // 2. Fallback to embedded/static check
  return new Response(JSON.stringify({ error: 'Movie not found', id }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
