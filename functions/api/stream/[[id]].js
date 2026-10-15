// Cloudflare Pages Function: /api/stream/:id
// Seamlessly redirects Range requests to static /videos/*.mp4 on Cloudflare Pages CDN edge

const PLAYLIST_ORDER = [
  "xeee.mp4",
  "xe_dui_trang.mp4",
  "audi_girl.mp4",
  "map_rong_lon.mp4",
  "map_tu_tien.mp4",
  "myself.mp4"
];

export async function onRequest(context) {
  const { request, params } = context;
  const rawId = Array.isArray(params.id) ? params.id.join('/') : (params.id || 'xeee.mp4');

  let targetFilename = 'xeee.mp4';

  if (/^\d+$/.test(rawId)) {
    const idx = parseInt(rawId, 10) % PLAYLIST_ORDER.length;
    targetFilename = PLAYLIST_ORDER[idx];
  } else {
    const match = PLAYLIST_ORDER.find((v) => 
      v.toLowerCase() === rawId.toLowerCase() || 
      v.replace(/\.mp4$/i, '').toLowerCase() === rawId.toLowerCase()
    );
    if (match) {
      targetFilename = match;
    } else if (rawId.endsWith('.mp4')) {
      targetFilename = rawId;
    } else {
      let hash = 0;
      for (let i = 0; i < rawId.length; i++) {
        hash = (hash << 5) - hash + rawId.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % PLAYLIST_ORDER.length;
      targetFilename = PLAYLIST_ORDER[idx];
    }
  }

  // 307 Temporary Redirect preserves Range headers and streams directly from CDN edge
  const targetUrl = new URL(`/videos/${targetFilename}`, request.url);
  return Response.redirect(targetUrl.toString(), 307);
}
