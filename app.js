/**
 * A.R. Rahman Live Concert — Immersive Scroll Experience
 * Complete interactive engine + preserved booking flow
 */

/* ============================================================
   0.  GLOBAL DOM REFS (shared between new engine & booking flow)
   ============================================================ */
const panel   = document.getElementById('side-panel');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menu-btn');

/* ============================================================
   1.  LENIS — Buttery smooth scrolling
   ============================================================ */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
});

// Pipe Lenis into GSAP's ticker so ScrollTrigger stays in sync
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ============================================================
   2.  GSAP + SCROLLTRIGGER — Section reveal animations
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

// --- 2a. Hero entrance ---
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
heroTl
  .from('.ad-tag', { y: 30, opacity: 0, duration: 0.8, delay: 0.3 })
  .from('.hero-title', { y: 60, opacity: 0, duration: 1, scale: 0.92 }, '-=0.5')
  .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
  .from('.hero-desc', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
  .from('.hero-actions', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
  .from('.scroll-prompt', { opacity: 0, duration: 1 }, '-=0.2');

// --- 2b. Parallax hero background ---
gsap.to('.hero-bg-parallax img', {
  yPercent: 25,
  ease: 'none',
  scrollTrigger: {
    trigger: '#sec-hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

// --- 2c. Generic section reveals ---
document.querySelectorAll('.sec:not(.sec--hero)').forEach((sec) => {
  // Section header elements
  const header = sec.querySelector('.sec-header, .sec-left, .venue-info-box, .cta-inner');
  if (header) {
    gsap.from(header, {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sec,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Right-side media / content
  const right = sec.querySelector('.sec-right, .dining-cards-grid, .responsibility-grid');
  if (right) {
    gsap.from(right, {
      y: 60,
      opacity: 0,
      duration: 1,
      delay: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sec,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }
});

// --- 2d. Parallax images inside sections ---
document.querySelectorAll('.parallax-img').forEach((img) => {
  gsap.fromTo(img,
    { yPercent: -8, scale: 1.15 },
    {
      yPercent: 8,
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.sec'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }
  );
});

// --- 2e. Dining cards staggered reveal ---
gsap.from('.dining-card', {
  y: 80,
  opacity: 0,
  duration: 0.8,
  stagger: 0.2,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#sec-dining',
    start: 'top 65%',
    toggleActions: 'play none none reverse',
  },
});

// --- 2f. Responsibility cards staggered reveal ---
gsap.from('.resp-card', {
  y: 60,
  opacity: 0,
  duration: 0.7,
  stagger: 0.15,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#sec-sustainability',
    start: 'top 65%',
    toggleActions: 'play none none reverse',
  },
});

// --- 2g. Venue stats counter animation ---
ScrollTrigger.create({
  trigger: '#sec-sec-venue',
  start: 'top 60%',
  once: true,
  onEnter: () => {
    document.querySelectorAll('.stat-number').forEach((el) => {
      const text = el.textContent;
      const num = parseInt(text.replace(/[^0-9]/g, ''));
      const suffix = text.replace(/[0-9]/g, '');
      const obj = { val: 0 };
      gsap.to(obj, {
        val: num,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.floor(obj.val) + suffix;
        },
      });
    });
  },
});

// --- 2h. CTA section final guide ---
ScrollTrigger.create({
  trigger: '#sec-cta',
  start: 'top 50%',
  onEnter: () => {
    const guide = document.querySelector('.final-booking-guide');
    const menuGuide = document.getElementById('menu-guide');
    if (guide) guide.classList.add('is-active');
    if (menuGuide) {
      menuGuide.classList.add('is-visible');
      menuGuide.setAttribute('aria-hidden', 'false');
    }
    if (menuBtn) menuBtn.classList.add('menu-btn--highlighted');
  },
  onLeaveBack: () => {
    const guide = document.querySelector('.final-booking-guide');
    const menuGuide = document.getElementById('menu-guide');
    if (guide) guide.classList.remove('is-active');
    if (menuGuide) {
      menuGuide.classList.remove('is-visible');
      menuGuide.setAttribute('aria-hidden', 'true');
    }
    if (menuBtn) menuBtn.classList.remove('menu-btn--highlighted');
  },
});

/* ============================================================
   3.  HORIZONTAL SCROLL GALLERY (Fan Engagement)
   ============================================================ */
const horizGallery = document.getElementById('horiz-gallery');
if (horizGallery) {
  const totalScroll = horizGallery.scrollWidth - horizGallery.parentElement.offsetWidth;
  gsap.to(horizGallery, {
    x: -totalScroll,
    ease: 'none',
    scrollTrigger: {
      trigger: '#sec-merch',
      start: 'top 20%',
      end: () => '+=' + totalScroll,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });
}

/* ============================================================
   4.  PARTICLE CANVAS — Floating golden dust
   ============================================================ */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 60;
  const particles = [];

  class Particle {
    constructor() { this.reset(true); }
    reset(randomY) {
      this.x = Math.random() * W;
      this.y = randomY ? Math.random() * H : -10;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = Math.random() * 0.3 + 0.08;
      this.speedX = (Math.random() - 0.5) * 0.15;
      this.opacity = Math.random() * 0.5 + 0.15;
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.pulse) * 0.05;
      this.pulse += 0.015;
      if (this.y > H + 10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      const alpha = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.fillStyle = `rgba(201, 162, 39, ${alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ============================================================
   5.  AUDIO WAVEFORM VISUALIZER (Section 3)
   ============================================================ */
(function initWaveform() {
  const canvas = document.getElementById('waveform-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  let scrollProgress = 0;
  let mouseX = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // Track scroll progress through section 3
  ScrollTrigger.create({
    trigger: '#sec-sound',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => { scrollProgress = self.progress; },
  });

  canvas.parentElement.addEventListener('pointermove', (e) => {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
  });

  let time = 0;

  function drawWave(yOffset, amplitude, frequency, color, lineWidth, phase) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    for (let x = 0; x <= W; x++) {
      const xNorm = x / W;
      const envelope = Math.sin(xNorm * Math.PI);
      const mouseInfluence = 1 + 0.8 * Math.exp(-Math.pow((xNorm - mouseX) * 4, 2));
      const y = yOffset + envelope * mouseInfluence * amplitude *
        Math.sin(xNorm * frequency + time * 2 + phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function animateWaveform() {
    ctx.clearRect(0, 0, W, H);
    time += 0.02;

    const baseAmp = 20 + scrollProgress * 40;
    const midY = H * 0.5;

    // Multiple layered waves for richness
    drawWave(midY, baseAmp * 1.0, 8,  'rgba(201, 162, 39, 0.12)', 1.5, 0);
    drawWave(midY, baseAmp * 0.8, 12, 'rgba(212, 175, 55, 0.18)', 2,   1);
    drawWave(midY, baseAmp * 1.2, 6,  'rgba(201, 162, 39, 0.25)', 2.5, 2);
    drawWave(midY, baseAmp * 0.6, 16, 'rgba(230, 194, 128, 0.15)', 1,   3);
    drawWave(midY, baseAmp * 1.4, 4,  'rgba(201, 162, 39, 0.35)', 3,   0.5);

    requestAnimationFrame(animateWaveform);
  }
  animateWaveform();
})();

/* ============================================================
   6.  MASCOT — MetaMask-style canvas mascot with scroll-scrubbed
       3D body lean, mouse-tracking pupils, impact animation
   ============================================================ */
(function initMascot() {
  const wrap    = document.getElementById('mascot-wrap');
  const canvas  = document.getElementById('mascot-canvas');
  const bubble  = document.getElementById('mascot-bubble');
  const flash   = document.getElementById('mascot-flash');
  const ripple  = document.getElementById('mascot-ripple');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = 140, H = 200;
  canvas.width = W; canvas.height = H;

  // ---- State ----
  let mouseX = window.innerWidth * 0.85;
  let mouseY = window.innerHeight * 0.8;
  let scrollY = 0;
  let prevSection = -1;
  let breathPhase = 0;
  let isImpact = false;
  let excitedLevel = 0; // 0–1, how excited from fast scroll
  let mouthOpen = 0;    // 0–1
  let isDancing = false;

  // Smooth interpolation targets
  const target = { leanX: 0, leanY: 0, pupilX: 0, pupilY: 0 };
  const current = { leanX: 0, leanY: 0, pupilX: 0, pupilY: 0 };

  // Track mouse
  document.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Track scroll for lean + excitement
  let lastScrollY = 0;
  lenis.on('scroll', ({ scroll }) => {
    const delta = scroll - lastScrollY;
    lastScrollY = scroll;
    scrollY = scroll;
    // Excite from fast scrolling
    excitedLevel = Math.min(1, excitedLevel + Math.abs(delta) / 500);
    if (excitedLevel > 0.4) mouthOpen = Math.min(1, mouthOpen + 0.15);
  });

  setInterval(() => {
    excitedLevel *= 0.88;
    mouthOpen *= 0.9;
  }, 80);

  // ---- Per-section data ----
  const sections = [
    { id: 'sec-hero',         label: 'Hey! Scroll to explore the concert! 🎵' },
    { id: 'sec-experience',   label: 'A.R. Rahman — legend, maestro, icon! ✨' },
    { id: 'sec-sound',        label: '120dB of pure musical magic! 🎶' },
    { id: 'sec-seating',      label: 'Every seat has a perfect view! 👑' },
    { id: 'sec-dining',       label: 'Gourmet food all night long! 🍽️' },
    { id: 'sec-mobile',       label: 'Your personal concert companion! 📱' },
    { id: 'sec-sec-venue',    label: 'Island Grounds — iconic Chennai! 🌙' },
    { id: 'sec-merch',        label: 'Grab exclusive tour merch! 🎁' },
    { id: 'sec-sustainability', label: 'Green, safe and unforgettable! 🌿' },
    { id: 'sec-cta',          label: '👆 Click the menu to book tickets!' },
  ];

  sections.forEach((sec, i) => {
    const el = document.getElementById(sec.id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      onEnter:     () => enterSection(i),
      onEnterBack: () => enterSection(i),
    });
  });

  function enterSection(i) {
    if (i === prevSection) return;
    prevSection = i;
    triggerImpact();
    // Show section-specific bubble
    if (bubble) {
      bubble.textContent = sections[i].label;
      bubble.classList.add('is-visible');
      clearTimeout(bubble._timer);
      bubble._timer = setTimeout(() => bubble.classList.remove('is-visible'), 3200);
    }
  }

  // ---- Impact animation: mascot smashes into camera ----
  function triggerImpact() {
    if (isImpact) return;
    isImpact = true;

    // 1. Zoom toward camera using GSAP 3D
    gsap.timeline({
      onComplete: () => { isImpact = false; }
    })
      .to(canvas, {
        duration: 0.18,
        scaleX: 1.55, scaleY: 1.55,
        rotationX: -18,
        translateZ: 120,
        ease: 'power3.in',
      }, 0)
      .to(canvas, {
        duration: 0.28,
        scaleX: 0.92, scaleY: 1.05,
        rotationX: 5,
        translateZ: 0,
        ease: 'elastic.out(1, 0.5)',
      }, 0.18)
      .to(canvas, {
        duration: 0.3,
        scaleX: 1, scaleY: 1,
        rotationX: 0,
        ease: 'power2.out',
      }, 0.46);

    // 2. Screen flash
    if (flash) {
      gsap.timeline()
        .to(flash, { duration: 0.08, opacity: 0.55, ease: 'none' })
        .to(flash, { duration: 0.35, opacity: 0, ease: 'power2.out' });
    }

    // 3. Ripple ring from mascot corner
    if (ripple) {
      gsap.timeline()
        .set(ripple, { opacity: 1, scale: 1 })
        .to(ripple, {
          duration: 0.8,
          scale: 12,
          opacity: 0,
          ease: 'power2.out',
        });
    }

    // 4. Canvas glow class
    canvas.classList.add('is-impact');
    setTimeout(() => canvas.classList.remove('is-impact'), 400);
  }

  // Expose trigger for CTA button and wrap click
  if (wrap) {
    wrap.addEventListener('click', triggerImpact);
  }

  // ---- Canvas drawing ----
  const GOLD       = '#c9a227';
  const GOLD_B     = '#d4af37';
  const DARK       = '#0a0908';
  const BODY_DARK  = '#1a1510';
  const BODY_MID   = '#221e1a';
  const WHITE      = '#f5f0e8';

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw(ts) {
    requestAnimationFrame(draw);
    breathPhase = ts * 0.001;

    // Smooth interpolation
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + W / 2;
    const cy = rect.top + H * 0.25; // eye level

    // Where cursor is relative to mascot center (normalized -1..1)
    const dx = (mouseX - cx) / (window.innerWidth * 0.5);
    const dy = (mouseY - cy) / (window.innerHeight * 0.5);

    if (isDancing) {
      // Move pupils in a happy circle during dance
      target.pupilX = Math.sin(ts * 0.006) * 0.6;
      target.pupilY = Math.cos(ts * 0.006) * 0.4;
      excitedLevel = 1.0;
      mouthOpen = 0.6 + Math.sin(ts * 0.02) * 0.4;
    } else {
      target.pupilX = Math.max(-1, Math.min(1, dx));
      target.pupilY = Math.max(-1, Math.min(1, dy));
    }
    // Lean follows mouse but more subtly
    target.leanX = target.pupilX * 0.12;
    target.leanY = target.pupilY * 0.07;

    const lerpSpeed = 0.08;
    current.pupilX = lerp(current.pupilX, target.pupilX, lerpSpeed);
    current.pupilY = lerp(current.pupilY, target.pupilY, lerpSpeed);
    current.leanX  = lerp(current.leanX,  target.leanX,  lerpSpeed);
    current.leanY  = lerp(current.leanY,  target.leanY,  lerpSpeed);

    // Breathe offset
    const breathY = Math.sin(breathPhase * 1.4) * 2.5;
    const breathScale = 1 + Math.sin(breathPhase * 1.4) * 0.012;
    const exciteWobble = excitedLevel * Math.sin(breathPhase * 8) * 3;

    ctx.clearRect(0, 0, W, H);
    ctx.save();

    // Apply lean (body tilt toward mouse) + breathe + excite wobble
    ctx.translate(W / 2, H);
    
    let rot = current.leanX * 0.18 + exciteWobble * 0.03;
    let scaleS = breathScale;
    let transX = current.leanX * 8;
    let transY = breathY + current.leanY * 6;
    
    if (isDancing) {
      // Custom dance motions (wobble tilt, side sway, jump bounce, squash & stretch)
      rot = Math.sin(ts * 0.01) * 0.22;
      transX = Math.sin(ts * 0.008) * 12;
      transY = -Math.abs(Math.sin(ts * 0.012)) * 22; // jumping up
      scaleS = 1.06 + Math.sin(ts * 0.015) * 0.06; // stretch/squash
    }
    
    ctx.rotate(rot);
    ctx.scale(scaleS, scaleS);
    ctx.translate(-W / 2, -H);
    ctx.translate(transX, transY);

    drawMascot(ctx, current.pupilX, current.pupilY, excitedLevel, mouthOpen, isDancing, ts);

    ctx.restore();
  }

  requestAnimationFrame(draw);

  // ---- Mascot drawing routine ----
  function drawMascot(c, px, py, excited, mOpen, dancing, timeStamp) {
    const cx = W / 2;

    // Shadow under base
    c.beginPath();
    c.ellipse(cx, H - 8, 22, 5, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fill();

    // ---- Stand ----
    c.beginPath();
    c.moveTo(cx, 122); c.lineTo(cx, H - 12);
    c.strokeStyle = GOLD; c.lineWidth = 6; c.lineCap = 'round';
    c.stroke();

    // Base feet
    c.beginPath();
    c.moveTo(cx - 22, H - 12); c.lineTo(cx + 22, H - 12);
    c.strokeStyle = GOLD; c.lineWidth = 8; c.lineCap = 'round';
    c.stroke();

    // Connector ring
    roundRect(c, cx - 9, 116, 18, 9, 3);
    c.fillStyle = GOLD_B; c.fill();

    // ---- Handle/body ----
    c.beginPath();
    c.moveTo(cx - 18, 74);
    c.lineTo(cx - 12, 120); c.lineTo(cx + 12, 120); c.lineTo(cx + 18, 74);
    c.closePath();
    c.fillStyle = BODY_MID; c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.5; c.stroke();

    // Gold accent band
    c.beginPath();
    c.rect(cx - 19, 76, 38, 7);
    c.fillStyle = GOLD_B; c.fill();

    // ---- Left arm ----
    c.beginPath();
    if (dancing) {
      const waveL = Math.sin(timeStamp * 0.015) * 15;
      c.moveTo(cx - 18, 88);
      c.quadraticCurveTo(cx - 36, 68 + waveL, cx - 42, 52 + waveL);
    } else {
      c.moveTo(cx - 18, 92);
      c.quadraticCurveTo(cx - 32, 100, cx - 20, 110);
    }
    c.strokeStyle = GOLD_B; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();

    // ---- Right arm ---- (points up when excited/CTA)
    c.beginPath();
    if (dancing) {
      const waveR = Math.cos(timeStamp * 0.015) * 15;
      c.moveTo(cx + 18, 88);
      c.quadraticCurveTo(cx + 36, 68 + waveR, cx + 42, 52 + waveR);
    } else if (excited > 0.6) {
      c.moveTo(cx + 18, 88);
      c.quadraticCurveTo(cx + 36, 68, cx + 42, 52);
    } else {
      c.moveTo(cx + 18, 92);
      c.quadraticCurveTo(cx + 32, 100, cx + 20, 110);
    }
    c.strokeStyle = GOLD_B; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();

    // ---- Mic head / grill ----
    // Outer circle
    c.beginPath();
    c.arc(cx, 46, 30, 0, Math.PI * 2);
    c.fillStyle = BODY_DARK; c.fill();
    c.strokeStyle = GOLD_B; c.lineWidth = 3; c.stroke();

    // Grill horizontal lines
    const grillLines = [30, 38, 46, 54, 60];
    grillLines.forEach(y => {
      const halfW = Math.sqrt(Math.max(0, 900 - (y - 46) ** 2)) * 0.85;
      c.beginPath();
      c.moveTo(cx - halfW, y);
      c.lineTo(cx + halfW, y);
      c.strokeStyle = `rgba(212,175,55,0.22)`;
      c.lineWidth = 1; c.stroke();
    });
    // Vertical lines
    [cx - 12, cx, cx + 12].forEach(x => {
      c.beginPath(); c.moveTo(x, 18); c.lineTo(x, 74);
      c.strokeStyle = `rgba(212,175,55,0.18)`; c.lineWidth = 1; c.stroke();
    });

    // ---- Face: eyes ----
    // Left eye white
    c.beginPath(); c.arc(cx - 11, 42, 7.5, 0, Math.PI * 2);
    c.fillStyle = WHITE; c.fill();
    // Left pupil — tracks mouse
    const lpx = (cx - 11) + px * 2.8;
    const lpy = 42 + py * 2.8;
    c.beginPath(); c.arc(lpx, lpy, 3.5, 0, Math.PI * 2);
    c.fillStyle = DARK; c.fill();
    // Left pupil shine
    c.beginPath(); c.arc(lpx - 1, lpy - 1, 1, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();

    // Right eye white
    c.beginPath(); c.arc(cx + 11, 42, 7.5, 0, Math.PI * 2);
    c.fillStyle = WHITE; c.fill();
    // Right pupil
    const rpx = (cx + 11) + px * 2.8;
    const rpy = 42 + py * 2.8;
    c.beginPath(); c.arc(rpx, rpy, 3.5, 0, Math.PI * 2);
    c.fillStyle = DARK; c.fill();
    // Right pupil shine
    c.beginPath(); c.arc(rpx - 1, rpy - 1, 1, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();

    // Eyebrows: raise with excitement
    const browLift = excited * 4;
    [cx - 11, cx + 11].forEach(bx => {
      c.beginPath();
      c.moveTo(bx - 5, 33 - browLift);
      c.lineTo(bx + 5, 31 - browLift);
      c.strokeStyle = WHITE; c.lineWidth = 1.8; c.lineCap = 'round'; c.stroke();
    });

    // ---- Mouth ----
    const mouthY = 57;
    c.beginPath();
    if (mOpen > 0.3) {
      // Open mouth (excited)
      c.arc(cx, mouthY, 5 + mOpen * 3, 0.1 * Math.PI, 0.9 * Math.PI);
      c.fillStyle = DARK; c.fill();
    }
    c.beginPath();
    c.moveTo(cx - 7, mouthY - mOpen * 2);
    c.quadraticCurveTo(cx, mouthY + 4 + mOpen * 6, cx + 7, mouthY - mOpen * 2);
    c.strokeStyle = WHITE; c.lineWidth = 2; c.lineCap = 'round'; c.stroke();

    // ---- Blush cheeks when excited ----
    if (excited > 0.3) {
      const blushAlpha = (excited - 0.3) / 0.7;
      c.beginPath(); c.ellipse(cx - 17, 52, 7, 4, 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(255,100,100,${blushAlpha * 0.3})`; c.fill();
      c.beginPath(); c.ellipse(cx + 17, 52, 7, 4, 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(255,100,100,${blushAlpha * 0.3})`; c.fill();
    }

    // Glow halo when excited
    if (excited > 0.5) {
      const grd = c.createRadialGradient(cx, 46, 28, cx, 46, 46);
      grd.addColorStop(0, `rgba(201,162,39,${(excited - 0.5) * 0.3})`);
      grd.addColorStop(1, 'rgba(201,162,39,0)');
      c.beginPath(); c.arc(cx, 46, 46, 0, Math.PI * 2);
      c.fillStyle = grd; c.fill();
    }
  }

  // Helper: rounded rect
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  // Show welcome bubble
  setTimeout(() => {
    if (bubble) bubble.classList.add('is-visible');
    setTimeout(() => bubble && bubble.classList.remove('is-visible'), 4000);
  }, 1500);

  // Click on mascot → impact + bubble
  if (wrap) {
    wrap.addEventListener('click', () => {
      if (isDancing) return; // ignore clicks during celebration dance
      triggerImpact();
      if (bubble) {
        bubble.textContent = '🎵 Let\'s go!';
        bubble.classList.add('is-visible');
        clearTimeout(bubble._timer);
        bubble._timer = setTimeout(() => bubble.classList.remove('is-visible'), 2000);
      }
    });
  }

  // Global triggers for celebration dance
  window.triggerMascotCelebration = function() {
    isDancing = true;
    excitedLevel = 1.0;
    mouthOpen = 1.0;
    
    if (wrap) {
      wrap.classList.add('is-celebrating');
    }
    
    if (bubble) {
      bubble.textContent = 'Thank you for applying! 💖🎵';
      bubble.classList.add('is-visible');
      clearTimeout(bubble._timer);
    }
    
    triggerImpact();
    
    // Auto-stop after 6 seconds
    clearTimeout(window._celebrationTimer);
    window._celebrationTimer = setTimeout(() => {
      window.stopMascotCelebration();
    }, 6000);
  };

  window.stopMascotCelebration = function() {
    isDancing = false;
    if (wrap) {
      wrap.classList.remove('is-celebrating');
    }
    if (bubble) {
      bubble.classList.remove('is-visible');
    }
    clearTimeout(window._celebrationTimer);
  };
})();

/* ============================================================
   7.  BUTTON WIRING — Explore CTA + Book trigger
   ============================================================ */
const exploreCta = document.getElementById('explore-cta');
if (exploreCta) {
  exploreCta.addEventListener('click', () => {
    lenis.scrollTo('#sec-experience', { duration: 1.4 });
  });
}

const ctaBookTrigger = document.getElementById('cta-book-trigger');
if (ctaBookTrigger) {
  ctaBookTrigger.addEventListener('click', () => {
    openPanel();
  });
}


/* ============================================================
   8.  PRESERVED BOOKING FLOW — Side panel multi-step forms
   ============================================================ */

// ---- Side panel elements ----
const closeBtn       = document.querySelector('.close-btn');
const form           = document.getElementById('interest-form');
const interestedRadios = form.querySelectorAll('input[name="interested"]');
const companionsFieldset = document.getElementById('companions-fieldset');
const seatingFieldset    = document.getElementById('seating-fieldset');
const companionsInput    = document.getElementById('companions-input');
const companionsValue    = document.getElementById('companions-value');
const minusBtn  = form.querySelector('.stepper-btn[data-action="minus"]');
const plusBtn   = form.querySelector('.stepper-btn[data-action="plus"]');
const submitBtn = document.getElementById('submit-btn');
const btnNext   = document.getElementById('btn-next');
const btnBack   = document.getElementById('btn-back');
const formSteps = document.querySelectorAll('.form-step');
const stepDots  = document.querySelectorAll('.step-dot');
const totalSteps = 4;
let currentStep  = 0;

// Onboarding elements
const interestBtnYes  = document.getElementById('interest-btn-yes');
const interestBtnNo   = document.getElementById('interest-btn-no');
const persuasionModal = document.getElementById('persuasion-modal');
const popoverBtnYes   = document.getElementById('popover-btn-yes');
const popoverBtnNo    = document.getElementById('popover-btn-no');

// Celebration Modal elements
const successOverlay  = document.getElementById('success-overlay');
const successModal    = document.getElementById('success-modal');
const successBtnDone  = document.getElementById('success-btn-done');
const successBtnHome  = document.getElementById('success-btn-home');

function openPanel() {
  panel.classList.add('is-open');
  overlay.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  overlay.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  goToFormStep(0);
  const firstFocusable = panel.querySelector('button, [href], input, select, textarea');
  if (firstFocusable) firstFocusable.focus();
}

function closePanel() {
  panel.classList.remove('is-open');
  overlay.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  if (persuasionModal) {
    persuasionModal.classList.remove('is-active');
    persuasionModal.setAttribute('aria-hidden', 'true');
  }
  menuBtn.focus();
}

function goToFormStep(step) {
  currentStep = Math.max(0, Math.min(step, totalSteps - 1));
  formSteps.forEach((el, i) => {
    el.classList.toggle('active', i === currentStep);
    el.hidden = i !== currentStep;
  });
  stepDots.forEach((el, i) => {
    el.classList.toggle('active', i === currentStep);
    el.setAttribute('aria-current', i === currentStep ? 'step' : null);
  });
  btnBack.hidden  = currentStep === 0;
  btnNext.hidden  = currentStep === 0 || currentStep === totalSteps - 1;
  submitBtn.hidden = currentStep !== totalSteps - 1;
  if (currentStep === 1) {
    updateSubmitState();
  } else {
    btnNext.disabled = false;
  }
}

function updateCompanionsUI() {
  const n = Number(companionsInput.value);
  companionsValue.textContent = n;
  companionsInput.setAttribute('aria-valuenow', n);
}

function showCompanionsAndSeating() {
  companionsFieldset.hidden = false;
  seatingFieldset.hidden = false;
  updateCompanionsUI();
  updateSubmitState();
}

function hideCompanionsAndSeating() {
  companionsFieldset.hidden = true;
  seatingFieldset.hidden = true;
  companionsInput.value = 0;
  const seatingSelect = document.getElementById('seating-select');
  if (seatingSelect) seatingSelect.value = '';
  updateCompanionsUI();
  updateSubmitState();
}

function canProceedStep1() {
  const interested = form.querySelector('input[name="interested"]:checked')?.value;
  if (!interested) return false;
  if (interested === 'no') return true;
  const seatingSelect = document.getElementById('seating-select');
  return !!(seatingSelect && seatingSelect.value);
}

function canProceedStep2() {
  const name  = document.getElementById('input-name').value.trim();
  const email = document.getElementById('input-email').value.trim();
  return name.length > 0 && email.length > 0;
}

function updateSubmitState() {
  if (currentStep !== 1) return;
  const interested = form.querySelector('input[name="interested"]:checked')?.value;
  if (!interested) { btnNext.disabled = true; return; }
  if (interested === 'no') { btnNext.disabled = false; return; }
  const seatingSelect = document.getElementById('seating-select');
  btnNext.disabled = !(seatingSelect && seatingSelect.value);
}

// Menu button: open panel
menuBtn.addEventListener('click', openPanel);

// Close: button and overlay
closeBtn.addEventListener('click', closePanel);
overlay.addEventListener('click', closePanel);

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (panel.classList.contains('is-open')) closePanel();
    if (successModal && successModal.classList.contains('is-active')) closeSuccessModal();
  }
});

// Step dots: click to jump
stepDots.forEach((dot, i) => {
  dot.addEventListener('click', () => goToFormStep(i));
});

// Onboarding page button event listeners
if (interestBtnYes) {
  interestBtnYes.addEventListener('click', () => {
    const yesRadio = form.querySelector('input[name="interested"][value="yes"]');
    if (yesRadio) {
      yesRadio.checked = true;
      showCompanionsAndSeating();
    }
    goToFormStep(1);
  });
}

if (interestBtnNo) {
  interestBtnNo.addEventListener('click', () => {
    if (persuasionModal) {
      persuasionModal.classList.add('is-active');
      persuasionModal.setAttribute('aria-hidden', 'false');
    }
  });
}

if (popoverBtnYes) {
  popoverBtnYes.addEventListener('click', () => {
    if (persuasionModal) {
      persuasionModal.classList.remove('is-active');
      persuasionModal.setAttribute('aria-hidden', 'true');
    }
    const yesRadio = form.querySelector('input[name="interested"][value="yes"]');
    if (yesRadio) {
      yesRadio.checked = true;
      showCompanionsAndSeating();
    }
    goToFormStep(1);
  });
}

if (popoverBtnNo) {
  popoverBtnNo.addEventListener('click', () => {
    if (persuasionModal) {
      persuasionModal.classList.remove('is-active');
      persuasionModal.setAttribute('aria-hidden', 'true');
    }
    closePanel();
  });
}

// Next / Back
btnNext.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (currentStep === 1 && !canProceedStep1()) {
    const interested = form.querySelector('input[name="interested"]:checked')?.value;
    if (!interested) { alert('Please choose Yes or No for interest.'); return; }
    const seatingSelect = document.getElementById('seating-select');
    if (interested === 'yes' && !(seatingSelect && seatingSelect.value)) {
      alert('Please select a seating arrangement.');
      return;
    }
    return;
  }
  if (currentStep === 2 && !canProceedStep2()) {
    alert('Please enter your name and email.');
    return;
  }
  goToFormStep(currentStep + 1);
});

btnBack.addEventListener('click', () => goToFormStep(currentStep - 1));

// Interest: show/hide companions & seating
interestedRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (radio.value === 'yes') showCompanionsAndSeating();
    else hideCompanionsAndSeating();
  });
});

// Companions stepper and range
minusBtn.addEventListener('click', () => {
  const v = Math.max(0, Number(companionsInput.value) - 1);
  companionsInput.value = v;
  updateCompanionsUI();
  updateSubmitState();
});

plusBtn.addEventListener('click', () => {
  const v = Math.min(10, Number(companionsInput.value) + 1);
  companionsInput.value = v;
  updateCompanionsUI();
  updateSubmitState();
});

companionsInput.addEventListener('input', () => {
  updateCompanionsUI();
  updateSubmitState();
});

const seatingSelectEl = document.getElementById('seating-select');
if (seatingSelectEl) {
  seatingSelectEl.addEventListener('change', updateSubmitState);
}

/* ============================================================
   9.  CONFETTI CELEBRATION ENGINE
   ============================================================ */
function launchConfetti() {
  const existingCanvas = document.getElementById('confetti-canvas');
  if (existingCanvas) existingCanvas.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width  = canvas.width  = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#c9a227', '#d4af37', '#f5f0e8', '#e6c280', '#b38600'];
  const particleCount = 150;
  const particles = [];

  class ConfettiPiece {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height - height;
      this.r = Math.random() * 6 + 4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.tilt = Math.random() * 10 - 5;
      this.tiltInc = Math.random() * 0.07 + 0.02;
      this.tiltAngle = 0;
      this.speedY = Math.random() * 3 + 4;
      this.speedX = Math.random() * 2 - 1;
    }
    update() {
      this.tiltAngle += this.tiltInc;
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.tiltAngle) * 0.5;
      this.tilt = Math.sin(this.tiltAngle - this.r / 2) * 15;
    }
  }

  for (let i = 0; i < particleCount; i++) particles.push(new ConfettiPiece());

  let animId;
  const startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, width, height);
    let active = 0;
    particles.forEach(p => {
      p.update();
      if (p.y <= height) active++;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });
    if (active > 0 && Date.now() - startTime < 6000) {
      animId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animId);
      canvas.remove();
    }
  }
  draw();
}

/* ============================================================
   10.  SUCCESS MODAL & FORM SUBMIT
   ============================================================ */
function closeSuccessModal() {
  if (successOverlay) successOverlay.classList.remove('is-active');
  if (successModal) successModal.classList.remove('is-active');
  form.reset();
  hideCompanionsAndSeating();
  goToFormStep(0);
  closePanel();
  
  if (typeof window.stopMascotCelebration === 'function') {
    window.stopMascotCelebration();
  }
}

if (successBtnDone) {
  successBtnDone.addEventListener('click', closeSuccessModal);
}

if (successBtnHome) {
  successBtnHome.addEventListener('click', () => {
    closeSuccessModal();
    lenis.scrollTo(0, { duration: 1.5 });
  });
}

// Form submit (final step)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const interested = form.querySelector('input[name="interested"]:checked')?.value;
  if (!interested) {
    alert('Please select whether you are interested in attending.');
    goToFormStep(1);
    return;
  }
  if (!canProceedStep2()) {
    alert('Please enter your name and email.');
    goToFormStep(2);
    return;
  }

  const data = {
    ticket: {
      interested,
      companions: interested === 'yes' ? Number(companionsInput.value) : null,
      seating: (document.getElementById('seating-select')?.value) || null,
    },
    personal: {
      name:  document.getElementById('input-name').value.trim(),
      dob:   document.getElementById('input-dob').value || null,
      phone: document.getElementById('input-phone').value.trim() || null,
      email: document.getElementById('input-email').value.trim(),
    },
    food: {
      diet:       document.getElementById('input-diet').value || null,
      allergies:  document.getElementById('input-allergies').value.trim() || null,
      food_notes: document.getElementById('input-food-notes').value.trim() || null,
    },
  };

  console.log('Booking submitted:', data);

  // Close form panel
  closePanel();

  // Show Success Celebration Modal and Overlay
  if (successOverlay) successOverlay.classList.add('is-active');
  if (successModal) successModal.classList.add('is-active');

  // Trigger gold confetti burst!
  launchConfetti();

  // Trigger mascot celebration dance and thank you speech bubble!
  if (typeof window.triggerMascotCelebration === 'function') {
    window.triggerMascotCelebration();
  }
});

// End of app.js
