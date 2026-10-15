// CineStream Store & State Manager (LocalStorage based)

// Global Playlist Rotation Sequence
// Sequence: 1. xeee.mp4 -> 2. xe_dui_trang.mp4 -> 3. audi_girl.mp4 -> 4. map_rong_lon.mp4 -> 5. map_tu_tien.mp4 -> 6. myself.mp4 -> loop
export const PLAYLIST_SEQUENCE = [
  'xeee.mp4',
  'xe_dui_trang.mp4',
  'audi_girl.mp4',
  'map_rong_lon.mp4',
  'map_tu_tien.mp4',
  'myself.mp4'
];

export const LAST_PLAYED_KEY = 'cinestream_last_played_video';

export function getNextVideoToPlay() {
  let lastPlayed = null;
  try {
    lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  } catch {}

  let nextIndex = 0;
  if (lastPlayed) {
    const lastIdx = PLAYLIST_SEQUENCE.indexOf(lastPlayed);
    if (lastIdx !== -1) {
      nextIndex = (lastIdx + 1) % PLAYLIST_SEQUENCE.length;
    } else {
      nextIndex = 0;
    }
  } else {
    nextIndex = 0;
  }

  const nextVideo = PLAYLIST_SEQUENCE[nextIndex];
  try {
    localStorage.setItem(LAST_PLAYED_KEY, nextVideo);
  } catch {}

  return nextVideo;
}

export function peekCurrentVideo() {
  let lastPlayed = null;
  try {
    lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  } catch {}
  return lastPlayed || PLAYLIST_SEQUENCE[0];
}

// Global attachment
if (typeof window !== 'undefined') {
  window.CineStreamPlaylist = {
    PLAYLIST_SEQUENCE,
    LAST_PLAYED_KEY,
    getNextVideoToPlay,
    peekCurrentVideo
  };
  window.getNextVideoToPlay = getNextVideoToPlay;
}

const KEYS = {
  WATCHLIST: 'cinestream_watchlist',
  CONTINUE_WATCHING: 'cinestream_continue_watching',
  PROFILE: 'cinestream_active_profile',
  USER: 'cinestream_current_user',
};

// Default seed data for immediate demonstration if empty
const DEFAULT_WATCHLIST = ['cyber-drift-2099', 'dune-part-two'];
const DEFAULT_CONTINUE = [
  {
    id: 'cyber-drift-2099',
    title: 'Cyber Drift: 2099',
    currentTime: 5040,
    duration: 9525,
    progress: 53,
    lastWatched: Date.now() - 3600000,
  },
  {
    id: 'neural-drift-reckoning',
    title: 'Neural Drift: Reckoning',
    currentTime: 2400,
    duration: 3600,
    progress: 67,
    lastWatched: Date.now() - 7200000,
  }
];

const DEFAULT_PROFILE = {
  id: 'profile-alex',
  name: 'Alex',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  isKids: false,
};

// Watchlist operations
export function getWatchlist() {
  try {
    const raw = localStorage.getItem(KEYS.WATCHLIST);
    if (!raw) {
      localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(DEFAULT_WATCHLIST));
      return DEFAULT_WATCHLIST;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

export function isInWatchlist(id) {
  const list = getWatchlist();
  return list.includes(id);
}

export function toggleWatchlist(id, title = 'Title') {
  let list = getWatchlist();
  const exists = list.includes(id);
  if (exists) {
    list = list.filter((item) => item !== id);
    showToast(`Removed "${title}" from My List`);
  } else {
    list.unshift(id);
    showToast(`Added "${title}" to My List!`, 'success');
  }
  localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('cinestream:watchlist-changed', { detail: { list, id, added: !exists } }));
  
  // Async sync with backend
  fetch('/api/user/watchlist/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movieId: id })
  }).catch(() => {});

  return !exists;
}

// Continue Watching operations
export function getContinueWatching() {
  try {
    const raw = localStorage.getItem(KEYS.CONTINUE_WATCHING);
    if (!raw) {
      localStorage.setItem(KEYS.CONTINUE_WATCHING, JSON.stringify(DEFAULT_CONTINUE));
      return DEFAULT_CONTINUE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONTINUE;
  }
}

export function updateWatchProgress(id, title, currentTime, duration) {
  if (!id || !duration) return;
  const progress = Math.min(100, Math.round((currentTime / duration) * 100));
  let items = getContinueWatching();
  items = items.filter((item) => item.id !== id);

  const roundedCurrent = Math.round(currentTime);
  const roundedDuration = Math.round(duration);

  if (progress < 95) {
    items.unshift({
      id,
      title,
      currentTime: roundedCurrent,
      duration: roundedDuration,
      progress,
      lastWatched: Date.now(),
    });
  }
  localStorage.setItem(KEYS.CONTINUE_WATCHING, JSON.stringify(items.slice(0, 10)));
  window.dispatchEvent(new CustomEvent('cinestream:continue-changed', { detail: { items } }));
}

// Active Profile operations
export function getActiveProfile() {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setActiveProfile(profile) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('cinestream:profile-changed', { detail: { profile } }));
}

// User Auth operations
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loginUser(email = 'alex.cinema@cinestream.com') {
  const user = {
    email,
    plan: 'Ultra 4K CineVIP',
    memberSince: 2024,
  };
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  return user;
}

export function logoutUser() {
  localStorage.removeItem(KEYS.USER);
  window.location.href = '/pages/login.html';
}

// Toast Notification Widget (Single active toast at a time, no vertical stacking)
export function showToast(message, type = 'info') {
  if (!message) return;
  let container = document.getElementById('cinestream-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cinestream-toast-container';
    container.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center';
    document.body.appendChild(container);
  }

  // Clear existing toasts to prevent stacking column
  container.innerHTML = '';

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-[#e50914] text-white shadow-[0_0_25px_rgba(229,9,20,0.6)]' : 'bg-[#201f21] text-[#e5e1e4] border border-white/10 shadow-2xl';
  toast.className = `pointer-events-auto px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 backdrop-blur-xl transition-all duration-200 transform translate-y-3 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px]">${type === 'success' ? 'check_circle' : 'info'}</span>
    <span class="whitespace-nowrap">${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 250);
    }
  }, 1800);
}
