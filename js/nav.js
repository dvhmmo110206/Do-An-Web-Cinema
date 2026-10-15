// CineStream Global Navigation & Layout Engine
import * as db from './db.js';
import * as store from './store.js';
import { initPugMascotWidget } from './mascot.js';

// Expose globally for inline button handlers
window.CineStream = { db, store };

document.addEventListener('DOMContentLoaded', () => {
  initNavigationLinks();
  initHeaderSearch();
  initNotificationsDropdown();
  initProfileDisplay();
  initWatchlistCounter();
  initPugMascotWidget();
});

function getCurrentPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return path.toLowerCase();
}

function initNavigationLinks() {
  const current = getCurrentPage();

  // Highlight active menu items in header
  document.querySelectorAll('header nav a').forEach((link) => {
    const dataPath = link.getAttribute('data-path');
    const href = link.getAttribute('href') || '';

    let isActive = false;
    if (current === 'index.html' || current === '') {
      isActive = dataPath === 'home' || href.endsWith('index.html');
    } else if (current.includes('search')) {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      if (type === 'movie' && (dataPath === 'movies' || href.includes('type=movie'))) isActive = true;
      else if (type === 'series' && (dataPath === 'series' || href.includes('series'))) isActive = true;
    } else if (current.includes('series') && (dataPath === 'series' || href.includes('series'))) {
      isActive = true;
    } else if (current.includes('my_list') && (dataPath === 'my-list' || href.includes('my_list'))) {
      isActive = true;
    } else if (current.includes('pricing') && (dataPath === 'pricing' || href.includes('pricing'))) {
      isActive = true;
    } else if (current.includes('about') && (dataPath === 'about-us' || dataPath === 'about' || href.includes('about'))) {
      isActive = true;
    } else if (
      (current.includes('contact') || current.includes('help')) &&
      (dataPath === 'contact-help' || dataPath === 'contact' || dataPath === 'help' || dataPath === 'help-center' || href.includes('contact') || href.includes('help'))
    ) {
      isActive = true;
    }

    if (isActive) {
      link.classList.remove('text-on-surface-variant', 'border-transparent');
      link.classList.add('text-on-surface', 'font-semibold', 'border-primary-container');
    } else {
      link.classList.remove('border-primary-container');
      link.classList.add('border-transparent');
      if (!link.classList.contains('font-label-lg') && !link.classList.contains('text-white')) {
        link.classList.add('text-on-surface-variant');
      }
    }
  });

  // Intercept dummy links and connect to real pages
  document.querySelectorAll('a').forEach((link) => {
    const dataPath = link.getAttribute('data-path');
    const href = link.getAttribute('href');

    if (!href || href === '#' || href.startsWith('javascript:')) {
      if (dataPath) {
        switch (dataPath) {
          case 'home':
            link.href = '/index.html';
            break;
          case 'movies':
            link.href = '/pages/search_page.html?type=movie';
            break;
          case 'series':
            link.href = '/pages/series_detail.html';
            break;
          case 'my-list':
            link.href = '/pages/my_list.html';
            break;
          case 'pricing':
            link.href = '/pages/pricing.html';
            break;
          case 'about-us':
          case 'about':
            link.href = '/pages/about.html';
            break;
          case 'contact-help':
          case 'contact':
            link.href = '/pages/contact.html';
            break;
          case 'help-center':
          case 'help':
            link.href = '/pages/help.html';
            break;
          case 'profile-settings':
            link.href = '/pages/profile.html';
            break;
          case 'terms-of-use':
          case 'privacy':
          case 'legal-notices':
            link.href = '/pages/about.html#legal';
            break;
          default:
            if (dataPath.startsWith('browse-')) {
              const genre = dataPath.replace('browse-', '');
              link.href = `/pages/search_page.html?genre=${encodeURIComponent(genre)}`;
            }
            break;
        }
      }
    }
  });

  // Profile avatar header link
  const profileLinks = document.querySelectorAll('a[data-path="profile-settings"], header a.group[href*="profile"]');
  profileLinks.forEach((a) => {
    a.href = '/pages/select_profile.html';
    a.title = 'Switch Profile / Account';
  });
}

function initHeaderSearch() {
  const searchInputs = document.querySelectorAll('header input[type="search"], header input#catalogSearchInput');
  searchInputs.forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        const query = encodeURIComponent(input.value.trim());
        window.location.href = `/pages/search_page.html?q=${query}`;
      }
    });
  });

  // Connect Top Searches suggestions
  document.querySelectorAll('header [data-path="search-results"]').forEach((item) => {
    const text = item.querySelector('span.text-on-surface')?.textContent?.trim();
    if (text) {
      if (text.includes('Dune')) item.href = '/pages/watch_a_film_page.html?id=dune-part-two';
      else if (text.includes('Detective')) item.href = '/pages/series_detail.html?id=neural-drift-reckoning';
      else if (text.includes('Oppenheimer')) item.href = '/pages/watch_a_film_page.html?id=oppenheimer';
      else item.href = `/pages/search_page.html?q=${encodeURIComponent(text)}`;
    }
  });
}

function initProfileDisplay() {
  const activeProfile = store.getActiveProfile();
  if (activeProfile) {
    document.querySelectorAll('header img[alt="Profile"]').forEach((img) => {
      if (activeProfile.avatar) img.src = activeProfile.avatar;
      img.alt = activeProfile.name || 'Profile';
    });
  }
}

function initWatchlistCounter() {
  const updateBadge = () => {
    const list = store.getWatchlist();
    const myListLinks = document.querySelectorAll('a[data-path="my-list"]');
    myListLinks.forEach((link) => {
      let badge = link.querySelector('.watchlist-badge');
      if (!badge && list.length > 0) {
        badge = document.createElement('span');
        badge.className = 'watchlist-badge ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary-container text-white font-bold inline-block';
        link.appendChild(badge);
      }
      if (badge) {
        if (list.length === 0) {
          badge.remove();
        } else {
          badge.textContent = list.length;
        }
      }
    });
  };

  updateBadge();
  window.addEventListener('cinestream:watchlist-changed', updateBadge);
}

function initNotificationsDropdown() {
  const wrapper = document.getElementById('notifications-wrapper');
  const btn = document.getElementById('notifications-btn');
  const dropdown = document.getElementById('notifications-dropdown');
  const badge = document.getElementById('notifications-badge');
  const countBadge = document.getElementById('notifications-count-badge');
  const markReadBtn = document.getElementById('notifications-mark-read-btn');

  if (!btn || !dropdown) return;

  let isOpen = false;

  function openDropdown() {
    isOpen = true;
    btn.setAttribute('aria-expanded', 'true');
    dropdown.style.display = 'block';
    void dropdown.offsetWidth; // force reflow for smooth CSS transition
    dropdown.classList.remove('opacity-0', 'pointer-events-none', 'scale-95', 'translate-y-2');
    dropdown.classList.add('opacity-100', 'scale-100', 'translate-y-0');
  }

  function closeDropdown() {
    isOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    dropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95', 'translate-y-2');
    dropdown.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    setTimeout(() => {
      if (!isOpen) dropdown.style.display = 'none';
    }, 200);
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    if (isOpen) closeDropdown();
    else openDropdown();
  }

  btn.addEventListener('click', toggleDropdown);

  // Mark all as read button
  if (markReadBtn) {
    markReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (badge) badge.style.display = 'none';
      if (countBadge) {
        countBadge.textContent = 'Đã đọc';
        countBadge.className = 'px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium border border-white/5';
      }
      document.querySelectorAll('.notification-dot').forEach((dot) => {
        dot.style.display = 'none';
      });
      document.querySelectorAll('.notification-item').forEach((item) => {
        item.classList.add('opacity-70');
        item.classList.remove('bg-white/[0.02]');
      });
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (wrapper && !wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeDropdown();
    }
  });
}

