/**
 * activelog-ai-site — Test suite for main.js
 *
 * Uses jest's built-in jsdom environment.
 */

const fs = require('fs');
const path = require('path');

const sourceCode = fs.readFileSync(
  path.resolve(__dirname, '..', 'js', 'main.js'),
  'utf-8'
);

// Polyfill IntersectionObserver (jsdom doesn't have it)
window.IntersectionObserver = class IntersectionObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

function setupDOM() {
  document.body.innerHTML = `
    <nav id="nav">
      <button id="menuToggle">Menu</button>
      <div id="mobileMenu">
        <a href="#section1">Section 1</a>
        <a href="#section2">Section 2</a>
      </div>
    </nav>
    <div id="hero" style="height: 400px; position: relative;">
      <canvas id="hero-canvas"></canvas>
    </div>
    <div id="section1" style="height: 200px;">Section 1 Content</div>
    <div id="section2" style="height: 200px;">Section 2 Content</div>
    <div class="problem-card">Card 1</div>
    <div class="solution-step">Step 1</div>
    <div class="mode-card">
      <div class="mode-icon">Icon</div>
    </div>
    <button id="copyBtn">
      <svg><path d="M0 0"></path></svg>
    </button>
  `;
  document.documentElement.style.setProperty('--nav-h', '64px');

  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    canvas.getContext = () => ({
      clearRect: () => {}, setTransform: () => {}, beginPath: () => {},
      moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
      arc: () => {}, createRadialGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
    });
  }
}

function loadScript() {
  window.eval(sourceCode);
}

describe('activelog-ai-site main.js', () => {

  describe('Module Loading', () => {
    beforeEach(() => setupDOM());

    test('loads and executes without throwing', () => {
      expect(() => loadScript()).not.toThrow();
    });

    test('does not pollute global scope', () => {
      loadScript();
      expect(window.handleScroll).toBeUndefined();
      expect(window.initNodes).toBeUndefined();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => { setupDOM(); loadScript(); });

    test('nav starts without scrolled class', () => {
      const nav = document.getElementById('nav');
      expect(nav.classList.contains('scrolled')).toBe(false);
    });

    test('nav gets scrolled class on scroll', () => {
      const nav = document.getElementById('nav');
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
      expect(nav.classList.contains('scrolled')).toBe(true);
    });

    test('nav loses scrolled class back at top', () => {
      const nav = document.getElementById('nav');
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
      expect(nav.classList.contains('scrolled')).toBe(false);
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => { setupDOM(); loadScript(); });

    test('toggles open class on click', () => {
      const toggle = document.getElementById('menuToggle');
      const menu = document.getElementById('mobileMenu');
      toggle.dispatchEvent(new Event('click'));
      expect(toggle.classList.contains('open')).toBe(true);
      expect(menu.classList.contains('open')).toBe(true);
      toggle.dispatchEvent(new Event('click'));
      expect(toggle.classList.contains('open')).toBe(false);
    });

    test('closes menu on link click', () => {
      const toggle = document.getElementById('menuToggle');
      const menu = document.getElementById('mobileMenu');
      toggle.dispatchEvent(new Event('click'));
      menu.querySelector('a').dispatchEvent(new Event('click', { bubbles: true }));
      expect(toggle.classList.contains('open')).toBe(false);
    });
  });

  describe('Canvas', () => {
    test('hero-canvas initializes', () => {
      setupDOM(); loadScript();
      expect(document.getElementById('hero-canvas')).toBeTruthy();
    });
  });

  describe('Scroll Reveal', () => {
    beforeEach(() => { setupDOM(); loadScript(); });

    test('adds reveal class to targets', () => {
      expect(document.querySelector('.problem-card').classList.contains('reveal')).toBe(true);
      expect(document.querySelector('.solution-step').classList.contains('reveal')).toBe(true);
    });
  });

  describe('Copy Button', () => {
    beforeEach(() => { setupDOM(); loadScript(); });

    test('adds copied class on click', async () => {
      const btn = document.getElementById('copyBtn');
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async () => {} }, configurable: true,
      });
      btn.dispatchEvent(new Event('click'));
      await new Promise(r => setTimeout(r, 10));
      expect(btn.classList.contains('copied')).toBe(true);
    });
  });

  describe('Mode Card', () => {
    beforeEach(() => { setupDOM(); loadScript(); });

    test('scales icon on mouseenter', () => {
      const card = document.querySelector('.mode-card');
      const icon = card.querySelector('.mode-icon');
      card.dispatchEvent(new Event('mouseenter'));
      expect(icon.style.transform).toContain('scale');
    });

    test('resets icon on mouseleave', () => {
      const card = document.querySelector('.mode-card');
      const icon = card.querySelector('.mode-icon');
      card.dispatchEvent(new Event('mouseenter'));
      card.dispatchEvent(new Event('mouseleave'));
      expect(icon.style.transform).toBe('');
    });
  });

  describe('Code Quality', () => {
    test('uses strict mode', () => {
      expect(sourceCode).toContain("'use strict'");
    });

    test('is wrapped in IIFE', () => {
      expect(sourceCode.indexOf('(function')).toBeGreaterThan(-1);
      expect(sourceCode.indexOf('(function')).toBeLessThan(200);
      expect(sourceCode.trim().endsWith(')();')).toBe(true);
    });

    test('uses passive scroll listener', () => {
      expect(sourceCode).toContain('passive: true');
    });

    test('uses IntersectionObserver', () => {
      expect(sourceCode).toContain('IntersectionObserver');
    });

    test('caps DPR at 2', () => {
      expect(sourceCode).toContain('Math.min');
      expect(sourceCode).toContain('devicePixelRatio');
    });

    test('has expected color palette', () => {
      expect(sourceCode).toContain('99, 102, 241');
      expect(sourceCode).toContain('168, 85, 247');
      expect(sourceCode).toContain('59, 130, 246');
    });
  });

  describe('Performance', () => {
    test('pauses canvas when offscreen', () => {
      expect(sourceCode).toContain('stopCanvas');
      expect(sourceCode).toContain('cancelAnimationFrame');
    });

    test('has mobile responsive adjustments', () => {
      expect(sourceCode).toContain('window.innerWidth < 600');
    });
  });
});
