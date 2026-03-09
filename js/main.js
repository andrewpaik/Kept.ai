/**
 * Kept.ai Showcase — Main JavaScript
 * Minimal JS. CSS handles visuals. JS handles behavior.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Signal that JS is active so CSS can safely hide [data-animate] elements.
  // Without this class, all content remains visible (no-JS fallback).
  document.documentElement.classList.add('js-ready');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');

  // ----- 1. Scroll-triggered fade-in animations -----

  const animated = document.querySelectorAll('[data-animate]');
  if (animated.length) {
    if (reducedMotion) {
      animated.forEach(el => el.classList.add('is-visible'));
    } else {
      const animObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const parent = el.parentElement;
          const siblings = parent ? [...parent.querySelectorAll(':scope > [data-animate]')] : [];
          const idx = siblings.indexOf(el);
          const delay = idx > 0 ? idx * 100 : 0;
          if (delay) {
            setTimeout(() => el.classList.add('is-visible'), delay);
          } else {
            el.classList.add('is-visible');
          }
          animObs.unobserve(el);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      animated.forEach(el => animObs.observe(el));
    }
  }

  // ----- 2. Animated number counters -----

  const counters = document.querySelectorAll('[data-count-target]');
  if (counters.length) {
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const duration = 1500;

    const runCounter = (el) => {
      const target = parseFloat(el.dataset.countTarget);
      const decimals = parseInt(el.dataset.countDecimals || '0', 10);
      const prefix = el.dataset.countPrefix || '';
      const suffix = el.dataset.countSuffix || '';

      if (reducedMotion) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const value = easeOutExpo(progress) * target;
        el.textContent = prefix + value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObs.observe(el));
  }

  // ----- 3. Sticky nav -----

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----- 4. Smooth scroll for anchor links -----

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = nav ? nav.offsetHeight + 16 : 16;
    window.scrollTo({
      top: Math.max(0, target.offsetTop - offset),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    history.pushState(null, '', id);
  });

  // ----- 5. Mobile nav toggle -----

  const toggle = document.querySelector('[data-nav-toggle]');
  const navLinks = nav ? nav.querySelector('.nav__links') : null;
  if (toggle && nav && navLinks) {
    const close = () => {
      navLinks.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close on link click
    nav.querySelectorAll('.nav__link, .nav__cta').forEach(l => l.addEventListener('click', close));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('is-open') && !nav.contains(e.target)) close();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
  }

  // ----- 6. FAQ accordion -----

  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item');
      if (!item) return;
      const isOpen = item.classList.contains('is-open');

      // Close all siblings
      item.parentElement.querySelectorAll('.is-open').forEach(el => {
        el.classList.remove('is-open');
      });

      // Toggle clicked (open if it was closed)
      if (!isOpen) item.classList.add('is-open');
    });
  });

  // ----- 7. Form handling -----

  const form = document.getElementById('demo-form');
  const successEl = document.getElementById('form-success');

  if (form && successEl) {
    const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const showError = (input, msg) => {
      clearError(input);
      const err = document.createElement('span');
      err.className = 'cta__form-error';
      err.textContent = msg;
      err.setAttribute('role', 'alert');
      input.classList.add('cta__form-input--error');
      input.parentElement.appendChild(err);
    };

    const clearError = (input) => {
      input.classList.remove('cta__form-input--error');
      const err = input.parentElement.querySelector('.cta__form-error');
      if (err) err.remove();
    };

    form.querySelectorAll('input').forEach(f => {
      f.addEventListener('input', () => clearError(f));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('demo-name');
      const email = document.getElementById('demo-email');
      let valid = true;

      if (!name.value.trim()) { showError(name, 'Please enter your name.'); valid = false; }
      if (!email.value.trim()) { showError(email, 'Please enter your email.'); valid = false; }
      else if (!isValidEmail(email.value.trim())) { showError(email, 'Please enter a valid email.'); valid = false; }

      if (!valid) return;

      form.setAttribute('hidden', '');
      successEl.removeAttribute('hidden');
    });
  }
});
