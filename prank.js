/* ═══════════════════════════════════════════════════════════
   PRANK WEB — JavaScript
   "Cantik atau Jelek?" — tombol Cantik selalu kabur!
═══════════════════════════════════════════════════════════ */
'use strict';

/* ─── DOM REFS ─── */
const screenIntro    = document.getElementById('screenIntro');
const screenQuestion = document.getElementById('screenQuestion');
const screenJelek    = document.getElementById('screenJelek');
const screenCantik   = document.getElementById('screenCantik');

const nameInput      = document.getElementById('nameInput');
const btnStart       = document.getElementById('btnStart');

const questionGif    = document.getElementById('questionGif');
const questionText   = document.getElementById('questionText');
const questionHint   = document.getElementById('questionHint');
const attemptCounter = document.getElementById('attemptCounter');
const escapeHint     = document.getElementById('escapeHint');

const btnCantik      = document.getElementById('btnCantik');
const btnJelek       = document.getElementById('btnJelek');

const jelekGif       = document.getElementById('jelekGif');
const jelekTitle     = document.getElementById('jelekTitle');
const jelekMsg       = document.getElementById('jelekMsg');
const jelekSummary   = document.getElementById('jelekSummary');
const btnRetryFromJelek = document.getElementById('btnRetryFromJelek');

const cantikGif      = document.getElementById('cantikGif');
const cantikTitle    = document.getElementById('cantikTitle');
const cantikMsg      = document.getElementById('cantikMsg');
const cantikName     = document.getElementById('cantikName');
const cantikAttempts = document.getElementById('cantikAttempts');
const revealMsg      = document.getElementById('revealMsg');
const btnPlayAgain   = document.getElementById('btnPlayAgain');

/* ─── STATE ─── */
let playerName    = '';
let missCount     = 0;   // times "Cantik" escaped
let jelekClicked  = false;

/* Cantik button — roaming state */
let cantikFixed   = false;   // true once we detach from flow
const SAFE_MARGIN = 16;      // px from viewport edge

/* ════════════════════════════════════════════════════════════
   SCREEN MANAGEMENT
════════════════════════════════════════════════════════════ */
function showScreen(screen) {
    [screenIntro, screenQuestion, screenJelek, screenCantik].forEach(s => {
        s.classList.add('hidden');
    });
    screen.classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/** Random position for Cantik btn inside viewport (with margin) */
function randomCantikPos() {
    const bw = btnCantik.offsetWidth  || 140;
    const bh = btnCantik.offsetHeight || 52;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return {
        x: clamp(Math.random() * (vw - bw - SAFE_MARGIN * 2) + SAFE_MARGIN, SAFE_MARGIN, vw - bw - SAFE_MARGIN),
        y: clamp(Math.random() * (vh - bh - SAFE_MARGIN * 2) + SAFE_MARGIN, SAFE_MARGIN, vh - bh - SAFE_MARGIN),
    };
}

/** Snap Cantik button away from the cursor/touch point */
function snapAway(cursorX, cursorY) {
    const bw = btnCantik.offsetWidth  || 140;
    const bh = btnCantik.offsetHeight || 52;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Current center of the button
    const btnX = parseFloat(btnCantik.style.left) + bw / 2;
    const btnY = parseFloat(btnCantik.style.top)  + bh / 2;

    // Direction AWAY from cursor
    let dx = btnX - cursorX;
    let dy = btnY - cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dist;
    dy /= dist;

    // How far to jump: 30–55% of viewport diagonal
    const diagonal = Math.sqrt(vw * vw + vh * vh);
    const jumpDist  = diagonal * (0.30 + Math.random() * 0.25);

    let nx = btnX + dx * jumpDist - bw / 2;
    let ny = btnY + dy * jumpDist - bh / 2;

    // Clamp inside viewport
    nx = clamp(nx, SAFE_MARGIN, vw - bw - SAFE_MARGIN);
    ny = clamp(ny, SAFE_MARGIN, vh - bh - SAFE_MARGIN);

    setCantikPos(nx, ny);
}

function setCantikPos(x, y, instantly = false) {
    btnCantik.style.transition = instantly
        ? 'none'
        : 'left 0.22s cubic-bezier(0.34,1.56,0.64,1), top 0.22s cubic-bezier(0.34,1.56,0.64,1)';
    btnCantik.style.left = `${x}px`;
    btnCantik.style.top  = `${y}px`;
}

/* Make the Cantik button roam freely in the viewport */
function detachCantik() {
    if (cantikFixed) return;
    cantikFixed = true;

    // Get current position relative to viewport before detaching
    const rect = btnCantik.getBoundingClientRect();

    // Convert to fixed positioning
    btnCantik.style.position   = 'fixed';
    btnCantik.style.left       = `${rect.left}px`;
    btnCantik.style.top        = `${rect.top}px`;
    btnCantik.style.width      = `${rect.width}px`;
    btnCantik.style.zIndex     = '9999';
    btnCantik.style.margin     = '0';
    btnCantik.style.flex       = 'none';

    // Move to first random position
    setTimeout(() => {
        const { x, y } = randomCantikPos();
        setCantikPos(x, y, false);
    }, 80);
}

/* Wiggle animation */
function wiggleCantik() {
    btnCantik.classList.remove('wiggling');
    void btnCantik.offsetWidth;
    btnCantik.classList.add('wiggling');
    setTimeout(() => btnCantik.classList.remove('wiggling'), 380);
}

/* ════════════════════════════════════════════════════════════
   QUESTION SCREEN LOGIC
════════════════════════════════════════════════════════════ */
function startQuestion() {
    missCount   = 0;
    jelekClicked = false;
    cantikFixed  = false;

    // Reset Cantik btn style
    btnCantik.style.position   = '';
    btnCantik.style.left       = '';
    btnCantik.style.top        = '';
    btnCantik.style.width      = '';
    btnCantik.style.zIndex     = '';
    btnCantik.style.margin     = '';
    btnCantik.style.flex       = '';
    btnCantik.style.transition = '';

    attemptCounter.textContent = '';
    escapeHint.classList.add('hidden');

    // Reset gif to hallo
    questionGif.src = 'gif/mochi-hallo.gif';

    showScreen(screenQuestion);

    // Detach after a brief moment so user sees it first
    setTimeout(detachCantik, 900);
}

/* ─── Cantik button ESCAPE (pointerenter + pointerdown) ─── */
function onCantikEscape(e) {
    if (!cantikFixed) {
        detachCantik();
        return;
    }

    const x = e.clientX ?? (e.touches?.[0]?.clientX ?? window.innerWidth / 2);
    const y = e.clientY ?? (e.touches?.[0]?.clientY ?? window.innerHeight / 2);

    missCount++;
    updateMissUI();
    snapAway(x, y);
    wiggleCantik();
}

function updateMissUI() {
    if (missCount === 0) {
        attemptCounter.textContent = '';
        return;
    }
    attemptCounter.textContent = `${missCount}× Kucing kabur! 🙀`;

    // Update gif based on miss count
    if (missCount >= 10) {
        questionGif.src = 'gif/mochi-laugh.gif';
        questionText.textContent = 'Kamu itu cantik atau jelek? 😹';
        questionHint.textContent = 'Kucingnya udah ketawa tuh liat kamu susah payah 😂';
    } else if (missCount >= 5) {
        questionGif.src = 'gif/mochi-sad.gif';
        questionText.textContent = 'Ayo dong, pilih salah satu~';
        questionHint.textContent = 'Tombol cantiknya pemalu kali ya 🙈';
    }

    if (missCount >= 3) {
        escapeHint.classList.remove('hidden');
    }
}

/* ─── "Jelek" button click ─── */
function onJelekClick() {
    jelekClicked = true;
    showJelekResult();
}

/* ════════════════════════════════════════════════════════════
   RESULT SCREENS
════════════════════════════════════════════════════════════ */
function showJelekResult() {
    // Reset Cantik btn position before hiding screen
    btnCantik.style.position = '';
    cantikFixed = false;

    const missText = missCount > 0
        ? `Sebelum nyerah, kamu udah bikin si Kucing kabur ${missCount}× 😂`
        : 'Kamu bahkan nggak nyoba ngejar dulu! 😑';

    if (jelekSummary) {
        jelekSummary.textContent = missText;
    }

    // Fun title based on miss count
    if (missCount >= 10) {
        jelekTitle.textContent = 'GIVE UP??? 😹😹';
        jelekMsg.innerHTML = `
            Masa iya kamu nyerah dan milih <strong>"Jelek"</strong>?! 😂<br>
            Padahal tombol <strong>"Cantik"</strong> tinggal di-klik aja lho~<br>
            <em>(walaupun emang susah sih, hehe 😈)</em>
        `;
    } else {
        jelekTitle.textContent = 'HAHAHAHA! 😹';
        jelekMsg.innerHTML = `
            Masa iya kamu milih <strong>"Jelek"</strong>?! 😂<br>
            Padahal tombol <strong>"Cantik"</strong>-nya ada lho…<br>
            kalau kamu lebih gesit! 😏
        `;
    }

    showScreen(screenJelek);
}

function showCantikResult() {
    // This is hard to trigger — user actually caught the button!
    cantikName.textContent = playerName || 'Kamu';
    cantikAttempts.textContent = `${missCount} percobaan`;
    revealMsg.classList.add('hidden');

    showScreen(screenCantik);

    // Reveal attempt count after 2s
    setTimeout(() => {
        revealMsg.classList.remove('hidden');
    }, 2000);
}

/* ════════════════════════════════════════════════════════════
   INTRO — START
════════════════════════════════════════════════════════════ */
function startGame() {
    playerName = nameInput.value.trim() || 'Cantik';
    startQuestion();
}

/* ════════════════════════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════════════════════════ */

/* Intro: Start button */
btnStart.addEventListener('click', startGame);
btnStart.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startGame();
}, { passive: false });

/* Intro: Enter key */
nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startGame();
});

/* Cantik button — escape on ANY approach */
btnCantik.addEventListener('pointerenter', onCantikEscape);

btnCantik.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Barely impossible to reach, but if they DO click it — reward them!
    onCantikEscape(e);
}, { passive: false });

btnCantik.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCantikEscape(e);
}, { passive: false });

/* Jelek button */
btnJelek.addEventListener('click', onJelekClick);
btnJelek.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onJelekClick();
}, { passive: false });

/* Retry from Jelek screen */
btnRetryFromJelek.addEventListener('click', startQuestion);
btnRetryFromJelek.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startQuestion();
}, { passive: false });

/* Play again from Cantik win screen */
btnPlayAgain.addEventListener('click', () => showScreen(screenIntro));
btnPlayAgain.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showScreen(screenIntro);
}, { passive: false });

/* ─── Initial screen ─── */
showScreen(screenIntro);
