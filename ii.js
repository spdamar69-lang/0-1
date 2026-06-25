/* ─────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────── */

/**
 * Lightweight debounce — delays fn until after `wait`ms
 * of inactivity. Reduces scroll / resize handler load.
 */
function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * requestAnimationFrame-based RAF throttle.
 * Ensures a function runs at most once per frame.
 */
function rafThrottle(fn) {
    let pending = false;
    return function (...args) {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            fn.apply(this, args);
            pending = false;
        });
    };
}

/* ─────────────────────────────────────────────────────
   CANVAS STARFIELD  (GPU-friendly, density-capped)
───────────────────────────────────────────────────── */
const canvas = document.getElementById('partikel-bg');
const ctx    = canvas.getContext('2d', { alpha: true });

function resizeCanvas() {
    // Use devicePixelRatio for crisp stars on HiDPI / Retina
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
}
resizeCanvas();

class Star {
    constructor(randomY = false) {
        this.reset(randomY);
    }
    reset(randomY = false) {
        this.x       = Math.random() * window.innerWidth;
        this.y       = randomY ? Math.random() * window.innerHeight : window.innerHeight + 5;
        this.radius  = Math.random() * 1.4 + 0.3;
        this.speedY  = Math.random() * 0.14 + 0.04;
        this.speedX  = (Math.random() - 0.5) * 0.05;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fade    = Math.random() * 0.004 + 0.001;
        this.dir     = Math.random() > 0.5 ? 1 : -1;
        this.hue     = Math.random() > 0.6 ? 'rgba(168,200,248,' : 'rgba(255,255,255,';
    }
    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.opacity += this.fade * this.dir;
        if (this.opacity > 0.7 || this.opacity < 0.08) this.dir *= -1;
        if (this.y < -8) this.reset(false);
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hue + this.opacity.toFixed(2) + ')';
        ctx.fill();
    }
}

let stars = [];
function initStars() {
    stars = [];
    // Cap star count: ~1 star per 10 000 px² — max 100 on desktop, 50 on mobile
    const isMobile = window.innerWidth < 768;
    const area  = window.innerWidth * window.innerHeight;
    const count = Math.min(isMobile ? 50 : 100, Math.floor(area / 10000));
    for (let i = 0; i < count; i++) stars.push(new Star(true));
}

let animId;
function animateStars() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = 0, n = stars.length; i < n; i++) {
        stars[i].update();
        stars[i].draw();
    }
    animId = requestAnimationFrame(animateStars);
}

initStars();
animateStars();

// Debounced resize: avoid thrashing on window resize
window.addEventListener('resize', debounce(() => {
    resizeCanvas();
    initStars();
}, 200));

/* ─────────────────────────────────────────────────────
   PAGE VISIBILITY — pause animation when hidden
   (saves battery on mobile)
───────────────────────────────────────────────────── */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animId);
    } else {
        animateStars();
    }
});

/* ─────────────────────────────────────────────────────
   ELEMENT REFS
───────────────────────────────────────────────────── */
const albumCard       = document.getElementById('albumCard');
const videoContainer  = document.getElementById('videoContainer');
const mainVideo       = document.getElementById('mainVideo');
const dividerToKepoin = document.getElementById('dividerToKepoin');
const btnToKepoin     = document.getElementById('btnToKepoin');
const sectionKepoin   = document.getElementById('section-kepoin');
const sectionAlbum    = document.getElementById('section-album');
const audioMusic      = document.getElementById('audioMusic');
const playPauseBtn    = document.getElementById('playPauseBtn');

const endingCard           = document.getElementById('endingCard');
const endingVideoContainer = document.getElementById('endingVideoContainer');
const endingVideo          = document.getElementById('endingVideo');
const endingMessage        = document.getElementById('endingMessage');
const sectionEnding        = document.getElementById('section-ending');


/* ─────────────────────────────────────────────────────
   SECTION 1 — Cover card → Video
───────────────────────────────────────────────────── */
albumCard.addEventListener('click', () => {
    albumCard.classList.add('hidden');

    setTimeout(() => {
        videoContainer.classList.add('active');
        mainVideo.currentTime = 0;
        mainVideo.muted = true;

        mainVideo.play()
            .then(() => setTimeout(() => { mainVideo.muted = false; }, 120))
            .catch(err => console.warn('Video play error:', err));
    }, 350);
});

// Video ends → restore cover + show "Kepoin Yuk" button
mainVideo.addEventListener('ended', () => {
    mainVideo.pause();
    mainVideo.currentTime = 0;
    videoContainer.classList.remove('active');

    setTimeout(() => {
        albumCard.classList.remove('hidden');
        dividerToKepoin.classList.add('visible');
        mainVideo.load();
    }, 400);
});

// FIX BUG 3: Tambahkan mainVideo.load() di error handler juga
mainVideo.addEventListener('error', () => {
    videoContainer.classList.remove('active');
    setTimeout(() => {
        albumCard.classList.remove('hidden');
        dividerToKepoin.classList.add('visible');
        mainVideo.load(); // ← TAMBAHAN: reload video agar bisa diputar ulang
    }, 400);
});

/* ─────────────────────────────────────────────────────
   Tombol "Kepoin Yuk" → Section 2
───────────────────────────────────────────────────── */
btnToKepoin.addEventListener('click', () => {
    dividerToKepoin.style.display = 'none';
    sectionKepoin.classList.add('visible');

    requestAnimationFrame(() => requestAnimationFrame(() => {
        sectionKepoin.classList.add('animated');

        // FIX BUG 1: Ganti scrollIntoView dengan window.scrollTo + offset navbar
        setTimeout(() => {
            const navbarHeight = document.querySelector('.navbar').offsetHeight || 70;
            const sectionTop = sectionKepoin.getBoundingClientRect().top + window.scrollY;
            const offset = navbarHeight + 20; // 20px extra padding

            window.scrollTo({
                top: sectionTop - offset,
                behavior: 'smooth'
            });
        }, 150); // ← delay naik dari 80ms ke 150ms
    }));
});

/* ─────────────────────────────────────────────────────
   Music toggle — also jumps to Album Slide
───────────────────────────────────────────────────── */
playPauseBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    if (audioMusic.paused) {
        audioMusic.play()
            .then(() => { playPauseBtn.textContent = '⏸ Jeda Musik'; })
            .catch(err => console.warn('Audio play error:', err));
    } else {
        audioMusic.pause();
        playPauseBtn.textContent = '▶ Putar Musik';
    }

    // FIX BUG 2: Hanya scroll ke album jika belum pernah dibuka
    // atau user bisa memilih untuk scroll manual
    if (!sectionAlbum.classList.contains('visible')) {
        showAlbumSlide();
    }
});

audioMusic.addEventListener('ended', () => {
    playPauseBtn.textContent = '▶ Putar Musik';
});

/* ═════════════════════════════════════════════════════
   ALBUM KENANGAN SLIDE
   ─ GPU-accelerated transitions
   ─ Touch swipe with velocity detection
   ─ Keyboard navigation
═════════════════════════════════════════════════════ */
const albumData = [
    {
        title: "Pertama Kali Bertemu",
        quote: "Setiap kisah besar dimulai dari satu pertemuan kecil.",
        image: "7.jpeg"
    },
    {
        title: "Ngak tau kenapa tapi lucu",
        quote: "Waktu berhenti berdetak saat aku bersamamu.",
        image: "2.jpeg"
    },
    {
        title: "anjaay depan umum",
        quote: "Cinta sejati adalah hadiah terindah yang tak bisa dibeli.",
        image: "3.jpeg"
    },
    {
        title: "jujur kita keren",
        quote: "Bukan tempatnya yang penting, tapi siapa yang menemanimu.",
        image: "4.jpeg"
    },
    {
        title: "yang ada bregsek-bregsek nyaa",
        quote: "Di antara ribuan wajah, aku menemukanmu. Dan itu cukup.",
        image: "5.jpeg"
    },
    {
        title: "si bocil",
        quote: "Sejak hari itu, duniamu menjadi duniamu juga.",
        image: "v.jpeg"
    },
    {
        title: "monyet",
        quote: "Aku memilihmu. Hari ini, besok, dan seterusnya.",
        image: "m.jpeg"
    },
    {
        title: "anjaay makan depan umum",
        quote: "Waktu berhenti berdetak saat aku bersamamu.",
        image: "9.jpeg"
    },
    {
        title: "ngak tau mau apa",
        quote: "Cinta sejati adalah hadiah terindah yang tak bisa dibeli.",
        image: "10.jpeg"
    },
    {
        title: "kita keren",
        quote: "Cintaku padamu bukan karena sempurna, tapi karena kamu.",
        image: "11.jpeg"
    },
    {
        title: "huhhhh keren",
        quote: "Aku tidak tahu masa depan, tapi aku yakin ingin menghadapinya bersamamu.",
        image: "12.jpeg"
    },
    {
        title: "umum e wees",
        quote: "Selamanya bukan cukup lama untuk mencintaimu.",
        image: "13.jpeg"
    },
    {
        title: "sekali lagi kita keren",
        quote: "Cintaku padamu seperti ombak—terus kembali meski terbentur karang.",
        image: "14.jpeg"
    },
    {
        title: "anjaaay",
        quote: "Kamu adalah lagu favorit yang tak pernah kulelah dengar.",
        image: "15.jpeg"
    },
    {
        title: "pokok e kita weesss",
        quote: "Jika bisa menghentikan waktu, aku akan memilih momen bersamamu.",
        image: "16.jpeg"
    },
    {
        title: "When yaaaaaaaa",
        quote: "Tak Perlu Sempurna, cukup kita .",
        image: "17.jpeg"
    },
    {
        title: "anjaay gamtek",
        quote: "semesta baik karena mempertemukan kita",
        image: "8.jpeg"
    },
  
];

let currentSlide = 0;
let isAnimating  = false;

const slideStage  = document.getElementById('slideStage');
const indicators  = document.getElementById('indicators');
const pageCounter = document.getElementById('pageCounter');
const progressBar = document.getElementById('progressBar');
const btnPrev     = document.getElementById('btnPrev');
const btnNext     = document.getElementById('btnNext');

// Music state
let musicWasPlaying  = false;
let musicSavedTime   = 0;

/* ── Build all slides (lazy-load images) ── */
function buildSlides() {
    albumData.forEach((data, idx) => {
        const slide = document.createElement('div');
        slide.className = `slide${idx === 0 ? ' active' : ''}`;
        slide.dataset.index = idx;

        const isPhotoLeft = idx % 2 === 0;

        // Use loading="lazy" on non-first images to defer decode
        const imgLoading = idx === 0 ? 'eager' : 'lazy';

        slide.innerHTML = `
          <div class="photo-side" style="order:${isPhotoLeft ? 0 : 1}">
            <div class="photo-frame">
              <img
                src="${data.image}"
                alt="${data.title}"
                loading="${imgLoading}"
                decoding="async"
              >
            </div>
          </div>
          <div class="text-side" style="order:${isPhotoLeft ? 1 : 0}">
            <div class="slide-number">Kenangan ${idx + 1}</div>
            <h2 class="slide-title">${data.title}</h2>
            <div class="slide-quote">"${data.quote}"</div>
          </div>
        `;

        slideStage.appendChild(slide);

        // Dot indicator
        const dot = document.createElement('button');
        dot.className = `indicator${idx === 0 ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Slide ${idx + 1}`);
        dot.addEventListener('click', () => goToSlide(idx));
        indicators.appendChild(dot);
    });

    updateNavState();
}

/* ── Update UI state ── */
function updateNavState() {
    btnPrev.disabled = currentSlide === 0;
    const isLast = currentSlide === albumData.length - 1;

    // Update Next button label
    const nextLabel = btnNext.querySelector('.btn-label');
    if (nextLabel) nextLabel.textContent = isLast ? 'Selesai' : 'Selanjutnya';

    pageCounter.textContent = `${currentSlide + 1} / ${albumData.length}`;
    progressBar.style.width = `${((currentSlide + 1) / albumData.length) * 100}%`;

    document.querySelectorAll('.indicator').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

/* ── Core slide transition ── */
function goToSlide(nextIdx, direction = 'next') {
    if (isAnimating) return;
    if (nextIdx === currentSlide) return;
    if (nextIdx < 0 || nextIdx >= albumData.length) return;

    isAnimating = true;

    const slides = slideStage.querySelectorAll('.slide');
    const outSlide = slides[currentSlide];
    const inSlide  = slides[nextIdx];

    // Set incoming slide starting position
    inSlide.style.transform = direction === 'next'
        ? 'translate3d(60px,0,0)'
        : 'translate3d(-60px,0,0)';
    inSlide.style.opacity = '0';
    inSlide.style.transition = 'none';

    // Force repaint so starting transform is applied before transition
    void inSlide.offsetHeight;

    // Remove transition override, then add .active
    inSlide.style.transform = '';
    inSlide.style.opacity   = '';
    inSlide.style.transition = '';

    outSlide.classList.remove('active');
    outSlide.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');

    // Small delay so exit animation reads before swap
    requestAnimationFrame(() => {
        inSlide.classList.add('active');

        setTimeout(() => {
            outSlide.classList.remove('exit-left', 'exit-right', 'active');
            currentSlide = nextIdx;
            updateNavState();
            isAnimating = false;
        }, 700);
    });
}

function nextSlide() {
    if (currentSlide === albumData.length - 1) {
        showEndingSection();
    } else {
        goToSlide(currentSlide + 1, 'next');
    }
}

function prevSlide() {
    goToSlide(currentSlide - 1, 'prev');
}

btnPrev.addEventListener('click', prevSlide);
btnNext.addEventListener('click', nextSlide);

/* ── Keyboard navigation ── */
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
    }
    if (e.key === 'ArrowLeft') prevSlide();
});

/* ── Touch / Swipe gesture for album slide ── */
(function initSwipe() {
    const frame = document.querySelector('.slide-frame');
    if (!frame) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isDragging = false;

    frame.addEventListener('touchstart', e => {
        const t = e.touches[0];
        touchStartX    = t.clientX;
        touchStartY    = t.clientY;
        touchStartTime = Date.now();
        isDragging     = true;
    }, { passive: true });

    frame.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        // If primarily horizontal swipe, prevent page scroll
        if (Math.abs(dx) > Math.abs(dy)) {
            e.preventDefault();
        }
    }, { passive: false });

    frame.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;

        const t        = e.changedTouches[0];
        const dx       = t.clientX - touchStartX;
        const dy       = t.clientY - touchStartY;
        const dt       = Date.now() - touchStartTime;
        const velocity = Math.abs(dx) / dt; // px/ms

        // Swipe threshold: >50px or velocity >0.3px/ms, and mostly horizontal
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        const isSwipe      = (Math.abs(dx) > 50 || velocity > 0.3) && isHorizontal;

        if (!isSwipe) return;

        if (dx < 0) {
            nextSlide(); // swipe left → next
        } else {
            prevSlide(); // swipe right → prev
        }
    }, { passive: true });
})();

/* ── Show album section ── */
function showAlbumSlide() {
    sectionAlbum.classList.add('visible');
    void sectionAlbum.offsetHeight; // force reflow so transition fires

    requestAnimationFrame(() => {
        sectionAlbum.classList.add('animated');
        setTimeout(() => sectionAlbum.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    });
}

/* ═════════════════════════════════════════════════════
   SECTION 4 — ENDING
═════════════════════════════════════════════════════ */
function showEndingSection() {
    sectionEnding.classList.add('visible');
    void sectionEnding.offsetHeight;

    requestAnimationFrame(() => {
        sectionEnding.classList.add('animated');
        setTimeout(() => sectionEnding.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    });
}

function pauseMusic() {
    if (!audioMusic.paused) {
        musicWasPlaying = true;
        musicSavedTime  = audioMusic.currentTime;
        audioMusic.pause();
        playPauseBtn.textContent = '▶ Putar Musik';
    } else {
        musicWasPlaying = false;
    }
}

function resumeMusic() {
    if (musicWasPlaying) {
        audioMusic.currentTime = musicSavedTime;
        audioMusic.play()
            .then(() => { playPauseBtn.textContent = '⏸ Jeda Musik'; })
            .catch(err => console.warn('Resume music error:', err));
    }
}

endingCard.addEventListener('click', () => {
    pauseMusic();
    endingCard.classList.add('hidden');

    setTimeout(() => {
        endingVideoContainer.classList.add('active');
        endingVideo.currentTime = 0;
        endingVideo.muted = true;

        endingVideo.play()
            .then(() => setTimeout(() => { endingVideo.muted = false; }, 120))
            .catch(err => console.warn('Ending video error:', err));
    }, 400);
});

endingVideo.addEventListener('ended', () => {
    endingVideo.pause();
    endingVideo.currentTime = 0;
    endingVideoContainer.classList.remove('active');
    endingMessage.classList.add('visible');
    resumeMusic();

    setTimeout(() => {
        endingCard.classList.remove('hidden');
        endingMessage.classList.remove('visible');
    }, 500);

    setTimeout(() => {
        endingMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
});

endingVideo.addEventListener('error', () => {
    endingVideoContainer.classList.remove('active');
    resumeMusic();
    setTimeout(() => { endingCard.classList.remove('hidden'); }, 400);
});

/* ── Boot ── */
window.addEventListener('load', () => {
    buildSlides();
});