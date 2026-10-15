// CineStream Unified Cinema Video Player Engine
import { getNextVideoToPlay } from './store.js';

export function formatPlayerTime(sec) {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function createCinemaPlayer(prefix, options = {}) {
  const container = document.getElementById(`${prefix}-video-container`);
  const video = document.getElementById(`${prefix}-video-player`) || document.getElementById(`${prefix}-modal-player`);
  const flashBox = document.getElementById(`${prefix}-center-flash-box`);
  const flashIcon = document.getElementById(`${prefix}-center-flash-icon`);
  const controlDock = document.getElementById(`${prefix}-player-control-dock`);
  const scrubberTimeline = document.getElementById(`${prefix}-scrubber-timeline`);
  const scrubberFill = document.getElementById(`${prefix}-scrubber-fill`);
  const scrubberThumb = document.getElementById(`${prefix}-scrubber-thumb`);
  const bufferedBar = document.getElementById(`${prefix}-buffered-bar`);
  const scrubberTooltip = document.getElementById(`${prefix}-scrubber-tooltip`);
  const playBtn = document.getElementById(`${prefix}-ctrl-play-btn`);
  const playIcon = document.getElementById(`${prefix}-ctrl-play-icon`);
  const replayBtn = document.getElementById(`${prefix}-ctrl-replay-btn`);
  const forwardBtn = document.getElementById(`${prefix}-ctrl-forward-btn`);
  const timeDisplay = document.getElementById(`${prefix}-ctrl-time`);
  const volBtn = document.getElementById(`${prefix}-ctrl-volume-btn`);
  const volIcon = document.getElementById(`${prefix}-ctrl-volume-icon`);
  const volBar = document.getElementById(`${prefix}-ctrl-volume-bar`);
  const volFill = document.getElementById(`${prefix}-ctrl-volume-fill`);
  const volThumb = document.getElementById(`${prefix}-ctrl-volume-thumb`);
  const fullscreenBtn = document.getElementById(`${prefix}-ctrl-fullscreen-btn`);
  const fullscreenIcon = document.getElementById(`${prefix}-ctrl-fullscreen-icon`);
  const topActions = document.getElementById(`${prefix}-player-top-actions`) || document.getElementById(`${prefix}-top-actions`);
  const closeBtn = document.getElementById(`${prefix}-modal-close-btn`) || document.getElementById(`${prefix}-close-btn`);

  let isScrubbing = false;
  let isVolDragging = false;
  let dockHideTimer = null;

  function isPlayerFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function triggerCenterFlash(iconName) {
    if (!flashBox || !flashIcon) return;
    flashIcon.textContent = iconName;
    if (iconName === 'play_arrow') {
      flashIcon.classList.add('ml-1');
    } else {
      flashIcon.classList.remove('ml-1');
    }
    flashBox.classList.remove('player-flash-active');
    void flashBox.offsetWidth; // Force CSS reflow
    flashBox.classList.add('player-flash-active');
  }

  function updatePlayUI(isPlaying) {
    if (playIcon) playIcon.innerText = isPlaying ? 'pause' : 'play_arrow';
  }

  function showControls() {
    const isFs = isPlayerFullscreen();
    if (controlDock) {
      controlDock.classList.remove('opacity-0', 'pointer-events-none');
      controlDock.classList.add('opacity-100');
    }
    if (topActions) {
      if (isFs) {
        // Khi phóng to toàn màn hình, bỏ hẳn nút đóng X
        topActions.classList.add('hidden', '!opacity-0', '!pointer-events-none');
        topActions.classList.remove('opacity-100');
      } else {
        topActions.classList.remove('hidden', '!opacity-0', '!pointer-events-none', 'opacity-0', 'pointer-events-none');
        topActions.classList.add('opacity-100');
      }
    }
    if (container) {
      container.classList.remove('cursor-none');
    }
  }

  function hideControls() {
    if (controlDock) {
      controlDock.classList.remove('opacity-100');
      controlDock.classList.add('opacity-0', 'pointer-events-none');
    }
    if (topActions) {
      topActions.classList.remove('opacity-100');
      topActions.classList.add('opacity-0', 'pointer-events-none');
    }
    if (container && video && !video.paused) {
      container.classList.add('cursor-none');
    }
  }

  function togglePlayback() {
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      updatePlayUI(true);
      triggerCenterFlash('play_arrow');
    } else {
      video.pause();
      updatePlayUI(false);
      triggerCenterFlash('pause');
    }
    resetDockTimer();
  }

  function resetDockTimer() {
    showControls();
    if (dockHideTimer) clearTimeout(dockHideTimer);
    if (video && !video.paused && !isScrubbing && !isVolDragging) {
      dockHideTimer = setTimeout(() => {
        if (video && !video.paused && !isScrubbing && !isVolDragging) {
          hideControls();
        }
      }, 3500);
    }
  }

  function updateScrubber(cur, dur) {
    if (!dur || dur <= 0) return;
    const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
    if (scrubberFill) scrubberFill.style.width = `${pct}%`;
    if (scrubberThumb) scrubberThumb.style.left = `${pct}%`;
    if (timeDisplay) timeDisplay.innerText = `${formatPlayerTime(cur)} / ${formatPlayerTime(dur)}`;
  }

  function updateBuffered() {
    if (!video || !video.buffered || video.buffered.length === 0 || !video.duration) return;
    try {
      const end = video.buffered.end(video.buffered.length - 1);
      const bPct = Math.min(100, (end / video.duration) * 100);
      if (bufferedBar) bufferedBar.style.width = `${bPct}%`;
    } catch (e) {}
  }

  function seekFromEvent(e) {
    if (!video || !video.duration || !scrubberTimeline) return;
    const rect = scrubberTimeline.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
    updateScrubber(video.currentTime, video.duration);
  }

  function updateVolumeUI(vol, muted) {
    const effectiveVol = (muted || vol === 0) ? 0 : vol;
    if (volFill) volFill.style.width = `${effectiveVol * 100}%`;
    if (volThumb) volThumb.style.left = `${effectiveVol * 100}%`;
    if (volIcon) {
      if (effectiveVol === 0) {
        volIcon.innerText = "volume_off";
      } else if (effectiveVol < 0.5) {
        volIcon.innerText = "volume_down";
      } else {
        volIcon.innerText = "volume_up";
      }
    }
  }

  function setVolumeFromEvent(e) {
    if (!video || !volBar) return;
    const rect = volBar.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const vol = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.muted = false;
    video.volume = vol;
    try {
      localStorage.setItem('cinestream_player_volume', vol.toString());
    } catch (err) {}
    updateVolumeUI(vol, false);
  }

  // Bind video element events
  if (video) {
    video.addEventListener('timeupdate', () => {
      if (isScrubbing || !video.duration) return;
      updateScrubber(video.currentTime || 0, video.duration || 0);
    });
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('loadedmetadata', () => {
      updateScrubber(video.currentTime || 0, video.duration || 0);
      updateBuffered();
    });
    video.addEventListener('play', () => updatePlayUI(true));
    video.addEventListener('pause', () => updatePlayUI(false));
    video.addEventListener('ended', () => {
      const nextVideo = typeof window.getNextVideoToPlay === 'function' ? window.getNextVideoToPlay() : getNextVideoToPlay();
      video.src = `/api/stream/${nextVideo}`;
      video.currentTime = 0;
      video.play().catch(() => {});
      updatePlayUI(true);
      triggerCenterFlash('play_arrow');
      if (typeof options.onEnded === 'function') options.onEnded(nextVideo);
    });
    video.addEventListener('error', () => {
      if (video.src && video.src.includes('/api/stream/')) {
        const parts = video.src.split('/api/stream/');
        if (parts[1]) {
          video.src = `/videos/${parts[1]}`;
          video.play().catch(() => {});
        }
      }
    });
  }

  // Click center of screen to toggle play/pause & ripple flash
  if (container) {
    container.addEventListener('click', (e) => {
      if (isScrubbing || isVolDragging) return;
      if (
        e.target.closest(`#${prefix}-player-control-dock`) ||
        e.target.closest('button') ||
        e.target.closest('a')
      ) {
        return;
      }
      togglePlayback();
    });
    container.addEventListener('mousemove', resetDockTimer);
    container.addEventListener('mouseenter', resetDockTimer);
  }

  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayback();
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!video) return;
      video.currentTime = Math.max(0, video.currentTime - 10);
      updateScrubber(video.currentTime, video.duration);
      triggerCenterFlash('replay_10');
      resetDockTimer();
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!video) return;
      video.currentTime = Math.min(video.duration || 99999, video.currentTime + 10);
      updateScrubber(video.currentTime, video.duration);
      triggerCenterFlash('forward_10');
      resetDockTimer();
    });
  }

  // Scrubber timeline interactions: hover pure red thumb, tooltip, click & drag
  if (scrubberTimeline) {
    scrubberTimeline.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isScrubbing = true;
      if (scrubberThumb) scrubberThumb.classList.add('!scale-100');
      seekFromEvent(e);
    });
    scrubberTimeline.addEventListener('mousemove', (e) => {
      if (!video || !video.duration || !scrubberTooltip) return;
      const rect = scrubberTimeline.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const hoverTime = (x / rect.width) * video.duration;
      scrubberTooltip.style.left = `${x}px`;
      scrubberTooltip.textContent = formatPlayerTime(hoverTime);
      scrubberTooltip.classList.remove('opacity-0');
    });
    scrubberTimeline.addEventListener('mouseleave', () => {
      if (scrubberTooltip) scrubberTooltip.classList.add('opacity-0');
    });
    scrubberTimeline.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        isScrubbing = true;
        if (scrubberThumb) scrubberThumb.classList.add('!scale-100');
        seekFromEvent(e.touches[0]);
      }
    }, { passive: true });
  }

  window.addEventListener('mousemove', (e) => {
    if (isScrubbing) seekFromEvent(e);
    if (isVolDragging) setVolumeFromEvent(e);
  });

  window.addEventListener('mouseup', () => {
    if (isScrubbing) {
      isScrubbing = false;
      if (scrubberThumb) scrubberThumb.classList.remove('!scale-100');
      resetDockTimer();
    }
    if (isVolDragging) {
      isVolDragging = false;
      resetDockTimer();
    }
  });

  // Volume slider & mute
  if (volBar) {
    volBar.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isVolDragging = true;
      setVolumeFromEvent(e);
    });
  }

  if (volBtn) {
    volBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!video) return;
      video.muted = !video.muted;
      updateVolumeUI(video.volume, video.muted);
      resetDockTimer();
    });
  }

  function handleFullscreenState() {
    const isFs = isPlayerFullscreen();
    if (fullscreenIcon) {
      fullscreenIcon.textContent = isFs ? 'fullscreen_exit' : 'fullscreen';
    }
    if (topActions) {
      if (isFs) {
        topActions.classList.add('hidden', '!opacity-0', '!pointer-events-none');
        topActions.classList.remove('opacity-100');
      } else {
        topActions.classList.remove('hidden', '!opacity-0', '!pointer-events-none');
        topActions.classList.add('opacity-100');
      }
    }
    if (container) {
      if (isFs) {
        container.classList.add('is-fullscreen');
      } else {
        container.classList.remove('is-fullscreen');
      }
    }
    resetDockTimer();
  }

  document.addEventListener('fullscreenchange', handleFullscreenState);
  document.addEventListener('webkitfullscreenchange', handleFullscreenState);

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = container || video;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if (target && target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    });
  }

  if (closeBtn && typeof options.onClose === 'function') {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      options.onClose();
    });
  }

  // Restore saved volume
  const savedVol = localStorage.getItem('cinestream_player_volume');
  const initialVol = savedVol !== null && !isNaN(parseFloat(savedVol)) ? Math.max(0, Math.min(1, parseFloat(savedVol))) : 0.5;
  if (video) video.volume = initialVol;
  updateVolumeUI(initialVol, false);

  return {
    video,
    container,
    play: () => {
      if (!video) return;
      video.play().catch(() => {});
      updatePlayUI(true);
      resetDockTimer();
    },
    pause: () => {
      if (!video) return;
      video.pause();
      updatePlayUI(false);
      resetDockTimer();
    },
    toggle: togglePlayback,
    triggerCenterFlash,
    resetDockTimer,
    updateScrubber,
    updateBuffered,
    updateVolumeUI,
    loadVideo: (src, startTime = 0) => {
      if (!video) return;
      video.src = src;
      video.currentTime = startTime;
      video.play().catch(() => {});
      updatePlayUI(true);
      resetDockTimer();
    },
    destroy: () => {
      if (dockHideTimer) clearTimeout(dockHideTimer);
      document.removeEventListener('fullscreenchange', handleFullscreenState);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenState);
    }
  };
}

// Global attachment for easy access from inline scripts or modules
if (typeof window !== 'undefined') {
  window.createCinemaPlayer = createCinemaPlayer;
  window.formatPlayerTime = formatPlayerTime;
}
