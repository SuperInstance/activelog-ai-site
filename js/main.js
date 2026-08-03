/* ========================================
   ActiveLog — activelog.ai
   Hero canvas, scroll reveal, interactions
   ======================================== */

(function () {
  'use strict';

  /* ============ NAV ============ */
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  let lastScroll = 0;
  function handleScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    lastScroll = y;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* ============ HERO CANVAS — Neural Data Viz ============ */
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let nodes = [];
  let pulses = [];
  let mouse = { x: -9999, y: -9999, active: false };

  const NODE_COUNT = window.innerWidth < 600 ? 30 : 55;
  const MAX_DIST = window.innerWidth < 600 ? 120 : 160;
  const COLORS = [
    [99, 102, 241],   // indigo
    [168, 85, 247],   // purple
    [139, 92, 246],   // violet
    [59, 130, 246],   // blue
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        color: c,
        baseAlpha: Math.random() * 0.4 + 0.3,
      });
    }
  }

  function spawnPulse(fromIdx, toIdx) {
    pulses.push({
      fromIdx,
      toIdx,
      progress: 0,
      speed: Math.random() * 0.015 + 0.01,
      color: nodes[fromIdx].color,
    });
  }

  function update() {
    // Move nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += n.speed;

      // Wrap
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;

      // Mouse repulsion
      if (mouse.active) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          n.x += (dx / dist) * force * 0.8;
          n.y += (dy / dist) * force * 0.8;
        }
      }
    }

    // Random pulses
    if (Math.random() < 0.02 && pulses.length < 8) {
      // Find a nearby pair
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            spawnPulse(i, j);
            return;
          }
        }
      }
    }

    // Update pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].progress += pulses[i].speed;
      if (pulses[i].progress >= 1) {
        pulses.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.12;
          const c = nodes[i].color;
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw pulses
    for (const p of pulses) {
      const a = nodes[p.fromIdx];
      const b = nodes[p.toIdx];
      if (!a || !b) continue;
      const t = p.progress;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const c = p.color;

      // Glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.6)`);
      grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw nodes
    for (const n of nodes) {
      const breath = Math.sin(n.pulse) * 0.3 + 0.7;
      const alpha = n.baseAlpha * breath;
      const c = n.color;

      // Outer glow
      if (breath > 0.85) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.2})`);
        grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let rafId = null;
  function animate() {
    update();
    draw();
    rafId = requestAnimationFrame(animate);
  }

  function startCanvas() {
    resize();
    initNodes();
    if (rafId) cancelAnimationFrame(rafId);
    animate();
  }

  function stopCanvas() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Intersection observer — pause when hero is offscreen
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) startCanvas();
      else stopCanvas();
    },
    { threshold: 0 }
  );
  heroObserver.observe(canvas.parentElement);

  // Mouse tracking
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Touch
  canvas.parentElement.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = t.clientX - rect.left;
    mouse.y = t.clientY - rect.top;
    mouse.active = true;
  }, { passive: true });
  canvas.parentElement.addEventListener('touchend', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', () => {
    resize();
    initNodes();
  });

  startCanvas();

  /* ============ SCROLL REVEAL ============ */
  const revealTargets = [
    '.problem-card',
    '.solution-step',
    '.mode-card',
    '.arch-node',
    '.arch-output-item',
    '.dev-feature',
    '.code-block',
    '.dev-block',
    '.cta-card',
    '.section-title',
    '.section-sub',
    '.section-label',
  ];

  const els = document.querySelectorAll(revealTargets.join(','));
  els.forEach((el) => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => revealObserver.observe(el));

  /* ============ COPY BUTTON ============ */
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = 'npx @activelog/create';
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        const svg = copyBtn.querySelector('svg');
        const original = svg.innerHTML;
        svg.innerHTML =
          '<path d="M4 8l3 3L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          svg.innerHTML = original;
        }, 2000);
      } catch (e) {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
      }
    });
  }

  /* ============ MODE CARD INTERACTION ============ */
  const modeCards = document.querySelectorAll('.mode-card');
  modeCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const icon = card.querySelector('.mode-icon');
      if (icon) {
        icon.style.transform = 'scale(1.08) rotate(-3deg)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const icon = card.querySelector('.mode-icon');
      if (icon) {
        icon.style.transform = '';
      }
    });
  });

  /* ============ SMOOTH ANCHOR SCROLL ============ */
  // Already handled by scroll-smooth on <html>, but add offset for fixed nav
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
        ) || 64;
        const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();
