// Cloudflare Pages Function: GET /api/stream/playlist
// Returns the active 6-video playlist in exact sequence

export async function onRequestGet(context) {
  const playlist = [
    {
      id: 0,
      filename: "xeee.mp4",
      title: "Cyber Speed: Trình Diễn Đua Xe",
      streamUrl: "/videos/xeee.mp4"
    },
    {
      id: 1,
      filename: "xe_dui_trang.mp4",
      title: "Xe Đùi Trắng: Siêu Xe Tốc Độ",
      streamUrl: "/videos/xe_dui_trang.mp4"
    },
    {
      id: 2,
      filename: "audi_girl.mp4",
      title: "Audi Girl: Neon Drift",
      streamUrl: "/videos/audi_girl.mp4"
    },
    {
      id: 3,
      filename: "map_rong_lon.mp4",
      title: "Map Rồng Lớn: Đại Chiến Long Tộc",
      streamUrl: "/videos/map_rong_lon.mp4"
    },
    {
      id: 4,
      filename: "map_tu_tien.mp4",
      title: "Map Tu Tiên: Phiêu Diêu Tam Giới",
      streamUrl: "/videos/map_tu_tien.mp4"
    },
    {
      id: 5,
      filename: "myself.mp4",
      title: "Myself: Identity Reflection",
      streamUrl: "/videos/myself.mp4"
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    total: playlist.length,
    playlist
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
