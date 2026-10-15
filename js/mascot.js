// CineStream Interactive Mascot & Support Widget Engine
// Based on 3x3 directional & reaction sprite sheets
import { showToast } from './store.js';

export class MascotController {
    constructor(element, options = {}) {
        this.container = element;
        this.directions = options.directions || '/mascots/pug-directions.webp';
        this.reactions = options.reactions || '/mascots/pug-reactions.webp';
        this.size = options.size || 120;
        this.deadZone = options.deadZone || 60;
        this.direction = 'center';
        this.reaction = null;
        this.timers = [];
        this.boops = { count: 0, at: 0 };
        this.pointer = null;
        this.sector = -1;

        this.DIRECTIONS = [
            'up-left', 'up', 'up-right',
            'left', 'center', 'right',
            'down-left', 'down', 'down-right',
        ];
        this.REACTIONS = [
            'blink', 'heart', 'sparkle',
            'surprised', 'wink', 'bashful',
            'sleepy', 'dizzy', 'delighted',
        ];
        this.CLOCKWISE = [
            'right', 'down-right', 'down', 'down-left',
            'left', 'up-left', 'up', 'up-right',
        ];
        this.SECTOR = (Math.PI * 2) / this.CLOCKWISE.length;
        this.HYSTERESIS = 0.12;

        this.initDOM();
        this.bindEvents();
    }

    cell(index) {
        return `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
    }

    wrap(angle) {
        return Math.atan2(Math.sin(angle), Math.cos(angle));
    }

    initDOM() {
        this.container.style.position = 'relative';
        this.container.style.display = 'block';
        this.container.style.width = `${this.size}px`;
        this.container.style.height = `${this.size}px`;
        this.container.style.padding = '0';
        this.container.style.border = '0';
        this.container.style.background = 'transparent';
        this.container.style.cursor = 'pointer';
        this.container.style.userSelect = 'none';

        // Reuse pre-rendered sprite layers if already present in HTML
        const existingSquash = this.container.querySelector('[data-mascot-squash]');
        const existingDirections = this.container.querySelector('[data-mascot-directions]');
        const existingReactions = this.container.querySelector('[data-mascot-reactions]');

        if (existingSquash && existingDirections && existingReactions) {
            this.squashEl = existingSquash;
            this.directionsLayer = existingDirections;
            this.reactionsLayer = existingReactions;
            return;
        }

        this.squashEl = document.createElement('span');
        this.squashEl.setAttribute('data-mascot-squash', '');
        this.squashEl.style.position = 'relative';
        this.squashEl.style.display = 'block';
        this.squashEl.style.width = '100%';
        this.squashEl.style.height = '100%';
        this.squashEl.style.transformOrigin = '50% 78%';

        const layerStyle = {
            position: 'absolute',
            inset: '0',
            backgroundSize: '300% 300%',
            backgroundRepeat: 'no-repeat',
        };

        // Directions Layer (tracks mouse)
        this.directionsLayer = document.createElement('span');
        this.directionsLayer.setAttribute('data-mascot-directions', '');
        Object.assign(this.directionsLayer.style, layerStyle);
        this.directionsLayer.style.backgroundImage = `url("${this.directions}")`;
        this.directionsLayer.style.backgroundPosition = this.cell(this.DIRECTIONS.indexOf('center'));
        this.directionsLayer.style.opacity = '1';
        this.directionsLayer.style.transition = 'opacity 0.08s ease';

        // Reactions Layer (blinks, hearts, sparkles)
        this.reactionsLayer = document.createElement('span');
        this.reactionsLayer.setAttribute('data-mascot-reactions', '');
        Object.assign(this.reactionsLayer.style, layerStyle);
        this.reactionsLayer.style.backgroundImage = `url("${this.reactions}")`;
        this.reactionsLayer.style.backgroundPosition = this.cell(this.REACTIONS.indexOf('blink'));
        this.reactionsLayer.style.opacity = '0';
        this.reactionsLayer.style.transition = 'opacity 0.08s ease';

        this.squashEl.appendChild(this.directionsLayer);
        this.squashEl.appendChild(this.reactionsLayer);
        this.container.innerHTML = '';
        this.container.appendChild(this.squashEl);
    }

    setDirection(dir) {
        if (this.direction === dir) return;
        this.direction = dir;
        const idx = this.DIRECTIONS.indexOf(dir);
        if (idx !== -1) {
            this.directionsLayer.style.backgroundPosition = this.cell(idx);
        }
    }

    setReaction(react) {
        this.reaction = react;
        if (react) {
            const idx = this.REACTIONS.indexOf(react);
            if (idx !== -1) {
                this.reactionsLayer.style.backgroundPosition = this.cell(idx);
            }
            this.directionsLayer.style.opacity = '0';
            this.reactionsLayer.style.opacity = '1';
        } else {
            this.directionsLayer.style.opacity = '1';
            this.reactionsLayer.style.opacity = '0';
        }
    }

    aim() {
        if (!this.container || !this.pointer) return;
        const box = this.container.getBoundingClientRect();
        const dx = this.pointer.x - (box.left + box.width / 2);
        const dy = this.pointer.y - (box.top + box.height / 2);

        if (Math.hypot(dx, dy) < this.deadZone) {
            this.sector = -1;
            this.setDirection('center');
            return;
        }

        const angle = Math.atan2(dy, dx);
        if (this.sector !== -1 && Math.abs(this.wrap(angle - this.sector * this.SECTOR)) < this.SECTOR / 2 + this.HYSTERESIS) {
            return;
        }
        this.sector = (Math.round(angle / this.SECTOR) + this.CLOCKWISE.length) % this.CLOCKWISE.length;
        this.setDirection(this.CLOCKWISE[this.sector]);
    }

    boop(customReaction) {
        this.timers.forEach(clearTimeout);
        this.timers = [];

        const later = (ms, next) => {
            this.timers.push(setTimeout(() => this.setReaction(next), ms));
        };

        const now = Date.now();
        this.boops.count = now - this.boops.at < 1600 ? this.boops.count + 1 : 1;
        this.boops.at = now;

        if (customReaction) {
            this.setReaction(customReaction);
            later(1200, null);
        } else if (this.boops.count >= 4) {
            this.boops.count = 0;
            this.setReaction('dizzy');
            later(1200, null);
        } else {
            const payoffs = ['heart', 'sparkle', 'delighted', 'wink', 'bashful'];
            this.setReaction('blink');
            later(130, payoffs[(this.boops.count - 1) % payoffs.length]);
            later(650, null);
        }

        const SQUASH = [
            { transform: 'scale(1, 1)', easing: 'ease-in' },
            { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
            { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
            { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
            { transform: 'scale(1, 1)' },
        ];
        if (this.squashEl && typeof this.squashEl.animate === 'function') {
            this.squashEl.animate(SQUASH, { duration: 420, easing: 'linear' });
        }
    }

    bindEvents() {
        const onPointerMove = (e) => {
            this.pointer = { x: e.clientX, y: e.clientY };
            this.aim();
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('scroll', () => this.aim(), { passive: true });
        this.container.addEventListener('click', () => this.boop());
    }
}

export function initPugMascotWidget() {
    const widget = document.getElementById('cinepug-widget');
    const popupCard = document.getElementById('cinepug-popup');
    const popupHeader = document.getElementById('cinepug-popup-header');
    const closeBtn = document.getElementById('cinepug-close-btn');
    const launcherContainer = document.getElementById('cinepug-launcher-container');
    const launcherCloseBtn = document.getElementById('cinepug-launcher-close-btn');
    const mascotTarget = document.getElementById('cinepug-mascot-element');
    const hintBubble = document.getElementById('cinepug-hint-bubble');
    const hintText = document.getElementById('cinepug-hint-text');
    const chatForm = document.getElementById('cinepug-chat-form');
    const chatInput = document.getElementById('cinepug-chat-input');
    const chatMessages = document.getElementById('cinepug-chat-messages');
    const quickChips = document.querySelectorAll('#cinepug-quick-chips .chip-btn');

    if (!mascotTarget) return;

    // Initialize Mascot Controller (Visible outside by default)
    const mascot = new MascotController(mascotTarget, {
        directions: '/mascots/pug-directions.webp',
        reactions: '/mascots/pug-reactions.webp',
        size: 110,
        deadZone: 45,
    });

    const CHAT_STORAGE_KEY = 'cinestream_chat_history';
    const CHAT_STATE_KEY = 'cinestream_chat_open';
    const DEFAULT_GREETING = {
        sender: 'CinePug',
        text: 'Gâu gâu! 🐾 Chào bạn, tôi là CinePug! Bạn muốn tìm phim gì hay hoặc cần tôi hỗ trợ gì không?',
        isUser: false
    };

    let isOpen = false;

    function openPopup(saveState = true, animate = true) {
        if (!popupCard) return;
        isOpen = true;
        if (saveState) {
            try {
                sessionStorage.setItem(CHAT_STATE_KEY, 'true');
            } catch {}
        }
        popupCard.style.display = 'flex';
        if (!animate) {
            popupCard.classList.remove('opacity-0', 'pointer-events-none', 'scale-95', 'translate-y-3');
            popupCard.classList.add('opacity-100', 'scale-100', 'translate-y-0');
        } else {
            // Force reflow for CSS transition
            void popupCard.offsetWidth;
            popupCard.classList.remove('opacity-0', 'pointer-events-none', 'scale-95', 'translate-y-3');
            popupCard.classList.add('opacity-100', 'scale-100', 'translate-y-0');
            mascot.boop('wink');
        }
        if (hintText) {
            hintText.textContent = 'Đang trò chuyện 🐾';
        }
        setTimeout(() => {
            mascot.aim();
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        }, animate ? 100 : 0);
    }

    function closePopup(saveState = true) {
        if (!popupCard) return;
        isOpen = false;
        if (saveState) {
            try {
                sessionStorage.setItem(CHAT_STATE_KEY, 'false');
            } catch {}
        }
        popupCard.classList.add('opacity-0', 'pointer-events-none', 'scale-95', 'translate-y-3');
        popupCard.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
        if (hintText) {
            hintText.textContent = 'Chat với CinePug 💬';
        }
        setTimeout(() => {
            if (!isOpen) popupCard.style.display = 'none';
        }, 300);
    }

    function togglePopup() {
        if (isOpen) closePopup();
        else openPopup();
    }

    // -------------------------------------------------------------
    // DRAGGABLE CHAT WIDGET & SMART POSITIONING
    // -------------------------------------------------------------
    let isPointerDown = false;
    let hasDragged = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let initialWidgetLeft = 0;
    let initialWidgetTop = 0;

    function applyWidgetPosition(left, top) {
        if (!widget) return;
        const launcher = launcherContainer || widget;
        const width = launcher.offsetWidth || 120;
        const height = launcher.offsetHeight || 140;
        const maxLeft = Math.max(8, window.innerWidth - width - 8);
        const maxTop = Math.max(8, window.innerHeight - height - 8);

        const clampedLeft = Math.max(8, Math.min(maxLeft, left));
        const clampedTop = Math.max(8, Math.min(maxTop, top));

        widget.style.left = `${clampedLeft}px`;
        widget.style.top = `${clampedTop}px`;
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';

        // Adapt horizontal alignment of popup relative to the dog
        if (popupCard) {
            if (clampedLeft < window.innerWidth / 2) {
                popupCard.classList.remove('right-0');
                popupCard.classList.add('left-0');
            } else {
                popupCard.classList.remove('left-0');
                popupCard.classList.add('right-0');
            }

            // Always keep popup comfortably fitted ABOVE the dog
            const availableHeightAbove = clampedTop - 20;
            if (availableHeightAbove >= 200) {
                popupCard.style.maxHeight = `${Math.min(440, availableHeightAbove)}px`;
            } else {
                popupCard.style.maxHeight = '80vh';
            }
        }
    }

    function onDragStart(e) {
        if (
            e.target.closest('#cinepug-launcher-close-btn') ||
            e.target.closest('#cinepug-close-btn') ||
            e.target.closest('input') ||
            e.target.closest('button:not(#cinepug-mascot-element)') ||
            e.target.closest('#cinepug-quick-chips') ||
            e.target.closest('#cinepug-chat-messages')
        ) {
            return;
        }

        const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;

        const rect = widget.getBoundingClientRect();
        initialWidgetLeft = rect.left;
        initialWidgetTop = rect.top;
        startPointerX = clientX;
        startPointerY = clientY;
        isPointerDown = true;
        hasDragged = false;
    }

    function onDragMove(e) {
        if (!isPointerDown || !widget) return;

        const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startPointerX;
        const dy = clientY - startPointerY;

        if (!hasDragged && Math.hypot(dx, dy) > 6) {
            hasDragged = true;
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
            widget.style.transition = 'none';
            mascot.boop('surprised');
        }

        if (hasDragged) {
            if (e.cancelable) e.preventDefault();
            applyWidgetPosition(initialWidgetLeft + dx, initialWidgetTop + dy);
        }
    }

    function onDragEnd() {
        if (!isPointerDown) return;
        isPointerDown = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        if (widget) widget.style.transition = '';

        if (hasDragged) {
            // Suppress follow-up click event
            const suppressClick = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
            };
            window.addEventListener('click', suppressClick, true);
            setTimeout(() => {
                window.removeEventListener('click', suppressClick, true);
                hasDragged = false;
            }, 80);
        }
    }

    if (launcherContainer) {
        launcherContainer.addEventListener('mousedown', onDragStart);
        launcherContainer.addEventListener('touchstart', onDragStart, { passive: false });
    }
    if (popupHeader) {
        popupHeader.addEventListener('mousedown', onDragStart);
        popupHeader.addEventListener('touchstart', onDragStart, { passive: false });
    }

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    // Keep within bounds on window resize
    window.addEventListener('resize', () => {
        if (widget && widget.style.left && widget.style.left !== 'auto') {
            const curL = parseInt(widget.style.left, 10) || 0;
            const curT = parseInt(widget.style.top, 10) || 0;
            applyWidgetPosition(curL, curT);
        }
    });

    // Không ghi nhớ vị trí di chuyển qua các lần tải lại trang (luôn về vị trí mặc định ban đầu)
    try {
        localStorage.removeItem('cinestream_chat_pos');
    } catch {}

    // -------------------------------------------------------------
    // CLOSE BUTTONS (X) - CLEAN DISMISSAL WITHOUT TOAST OR RESTORE PILL
    // -------------------------------------------------------------
    function dismissChatWidget() {
        closePopup();
        if (!widget) return;
        widget.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
        setTimeout(() => {
            widget.style.display = 'none';
        }, 200);
        // Không lưu trạng thái đóng: khi reload lại trang (F5) linh vật vẫn hiển thị bình thường
        try {
            sessionStorage.removeItem('cinestream_chat_dismissed');
        } catch {}
    }

    if (launcherCloseBtn) {
        launcherCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissChatWidget();
        });
    }

    // Luôn hiển thị mascot khi tải lại trang, dọn dẹp cờ cũ nếu có
    try {
        sessionStorage.removeItem('cinestream_chat_dismissed');
    } catch {}

    // Clicking the dog mascot opens the chat if closed, or boops if already open
    mascotTarget.addEventListener('click', () => {
        if (!hasDragged && !isOpen) {
            openPopup();
        }
    });

    // Clicking the hint bubble toggles the chat
    if (hintBubble) {
        hintBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!hasDragged) {
                togglePopup();
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePopup);

    // Close when clicking outside widget
    document.addEventListener('click', (e) => {
        if (!isOpen) return;
        const widgetEl = document.getElementById('cinepug-widget');
        if (widgetEl && !widgetEl.contains(e.target)) {
            closePopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closePopup();
        }
    });

    // -------------------------------------------------------------
    // CHAT MESSAGE PERSISTENCE & HISTORY MANAGEMENT
    // -------------------------------------------------------------
    function getStoredMessages() {
        try {
            const raw = localStorage.getItem(CHAT_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to read chat history:', e);
        }
        return [DEFAULT_GREETING];
    }

    function saveMessagesToStorage(messages) {
        try {
            // Keep recent 50 messages to avoid unbounded storage
            const trimmed = messages.slice(-50);
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }

    function renderMessageItem(sender, text, isUser = false) {
        if (!chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`;

        if (!isUser) {
            const avatar = document.createElement('span');
            avatar.className = 'w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[12px] flex-shrink-0';
            avatar.textContent = '🐶';
            msgDiv.appendChild(avatar);
        }

        const bubble = document.createElement('div');
        bubble.className = isUser
            ? 'bg-primary-container text-on-primary-container p-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-sm text-right break-words'
            : 'bg-surface-container-high text-on-surface p-2.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed shadow-sm break-words';
        bubble.textContent = text;
        msgDiv.appendChild(bubble);

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendMessage(sender, text, isUser = false, persist = true) {
        renderMessageItem(sender, text, isUser);
        if (persist) {
            const history = getStoredMessages();
            history.push({ sender, text, isUser, timestamp: Date.now() });
            saveMessagesToStorage(history);
        }
    }

    function loadChatHistory() {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        const history = getStoredMessages();
        history.forEach((msg) => {
            renderMessageItem(msg.sender, msg.text, msg.isUser);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load initial chat history from localStorage
    loadChatHistory();

    // Restore chat open state across navigation in current session
    try {
        const wasOpen = sessionStorage.getItem(CHAT_STATE_KEY) === 'true';
        if (wasOpen) {
            openPopup(false, false);
        }
    } catch {}

    // Clear chat history button handler
    const clearChatBtn = document.getElementById('cinepug-clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                localStorage.removeItem(CHAT_STORAGE_KEY);
            } catch {}
            loadChatHistory();
            showToast('Đã làm mới đoạn chat!', 'info');
            mascot.boop('blink');
        });
    }

    function handleUserInput(query) {
        const text = query.trim();
        if (!text) return;
        appendMessage('Bạn', text, true, true);

        const lower = text.toLowerCase();
        let reply = 'Gâu gâu! 🐾 CinePug nghe bạn rồi nè! Chúc bạn xem phim thật vui trên CineStream nhé! 🍿';
        let reaction = 'delighted';

        if (lower.includes('gợi ý') || lower.includes('phim hay') || lower.includes('xem gì')) {
            reply = 'Gâu gâu! 🎬 Tôi cực kỳ mê "Cyber Drift: 2099" và "Dune: Part Two", bạn vào xem ngay đi bao cuốn luôn! ✨';
            reaction = 'sparkle';
        } else if (lower.includes('thịnh hành') || lower.includes('hot') || lower.includes('top')) {
            reply = '🔥 "Shadows of 2049" và series "Neural Drift: Reckoning" đang leo đỉnh bảng xếp hạng tuần này đấy gâu! 🚀';
            reaction = 'heart';
        } else if (lower.includes('tim') || lower.includes('yêu') || lower.includes('thương') || lower.includes('ngoan')) {
            reply = 'Gâu! *Vẫy đuôi tít mù* Yêu bạn nhiều lắm luôn! Moah moah! ❤️🐶';
            reaction = 'heart';
        } else if (lower.includes('trò') || lower.includes('lăn') || lower.includes('boop')) {
            reply = '*Lăn qua một vòng, ngoáy mông và nháy mắt với bạn* 😉 Chạm vào mũi tôi thêm lần nữa đi nè!';
            reaction = 'wink';
        } else if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) {
            reply = 'Gâu! Chào người bạn yêu điện ảnh! Hôm nay bạn khỏe không? Cần CinePug gợi ý gì cứ bảo nhé! 🐾';
            reaction = 'delighted';
        }

        // Show typing animation indicator
        setTimeout(() => {
            appendMessage('CinePug', reply, false, true);
            mascot.boop(reaction);
        }, 400);
    }

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = chatInput.value;
            chatInput.value = '';
            handleUserInput(val);
        });
    }

    quickChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            handleUserInput(chip.textContent.trim());
        });
    });
}
