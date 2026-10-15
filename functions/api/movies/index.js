// Cloudflare Pages Function: /api/movies
// Queries Cloudflare D1 SQL Database (binding: env.DB) with graceful fallback

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').toLowerCase().trim();
  const genre = url.searchParams.get('genre');
  const type = url.searchParams.get('type');

  // If Cloudflare D1 is bound as env.DB
  if (env && env.DB) {
    try {
      let sql = 'SELECT * FROM Movie WHERE 1=1';
      const params = [];

      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }
      if (genre) {
        sql += ' AND genres LIKE ?';
        params.push(`%${genre}%`);
      }
      if (query) {
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(synopsis) LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      sql += ' ORDER BY isFeatured DESC, isTrending DESC, rating DESC';

      const stmt = env.DB.prepare(sql).bind(...params);
      const { results } = await stmt.all();

      const movies = results.map((row) => ({
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
        cast: typeof row.cast === 'string' ? JSON.parse(row.cast || '[]') : (row.cast || [])
      }));

      return new Response(JSON.stringify(movies), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      console.error('D1 Query Error:', err);
    }
  }

  // Graceful fallback if D1 is not configured yet
  return new Response(JSON.stringify([]), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
