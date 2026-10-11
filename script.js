/* ============================================================
   BREW & BLOOM — script.js  v3
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── helpers ── */
  const isTouch = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ════════════════════════════════════════════════
     1.  NAVBAR — scroll tint
  ════════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const tick = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ════════════════════════════════════════════════
     2.  MOBILE MENU
     hamburger is now a <button> — no role/tabindex needed
  ════════════════════════════════════════════════ */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {

    /* inject a real backdrop element once */
    let backdrop = document.getElementById('navBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'navBackdrop';
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    /* open / close helper */
    const setOpen = (open) => {
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      navLinks.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
      /* lock scroll on <html> — locking <body> clips fixed children in Chrome */
      document.documentElement.classList.toggle('nav-open', open);
    };

    const close = () => setOpen(false);
    const toggle = () => setOpen(!navLinks.classList.contains('open'));

    /* button click */
    hamburger.addEventListener('click', toggle);

    /* close when a nav link is clicked */
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    /* close on backdrop tap */
    backdrop.addEventListener('click', close);

    /* close on outside click (desktop) */
    document.addEventListener('pointerdown', e => {
      if (navLinks.classList.contains('open') && !navbar.contains(e.target) && e.target !== backdrop) close();
    });

    /* close on Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        close();
        hamburger.focus();
      }
    });

    /* swipe-up on the overlay to close */
    let _sy = 0;
    navLinks.addEventListener('touchstart', e => { _sy = e.touches[0].clientY; }, { passive: true });
    navLinks.addEventListener('touchmove',  e => {
      if (e.touches[0].clientY - _sy < -60) close();
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════
     3.  HERO PARALLAX — desktop only
  ════════════════════════════════════════════════ */
  const heroBg = document.getElementById('heroBg');
  if (heroBg && !isTouch()) {
    window.addEventListener('scroll', () => {
      heroBg.style.transform = `scale(1.05) translateY(${window.scrollY * 0.3}px)`;
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════
     4.  MENU TABS + swipe
  ════════════════════════════════════════════════ */
  const tabBtns      = [...document.querySelectorAll('.tab-btn')];
  const menuSections = [...document.querySelectorAll('.menu-section')];

  const activateTab = (btn) => {
    if (!btn) return;

    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    menuSections.forEach(s => { s.classList.remove('active'); s.style.opacity = '0'; });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    /* scroll the tab strip so active tab is centred */
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    const panel = document.getElementById(btn.dataset.tab);
    if (!panel) return;

    panel.classList.add('active');
    /* re-run reveals for newly visible cards */
    panel.querySelectorAll('.reveal').forEach(el => el.classList.remove('visible'));
    requestAnimationFrame(() => {
      panel.style.opacity = '1';
      panel.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 55);
      });
    });
  };

  if (tabBtns.length) {
    tabBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn)));

    /* swipe left / right on menu content area */
    const swipeTarget = document.querySelector('.section-inner') || document.body;
    let _sx = 0, _sy2 = 0;
    swipeTarget.addEventListener('touchstart', e => {
      _sx  = e.touches[0].clientX;
      _sy2 = e.touches[0].clientY;
    }, { passive: true });
    swipeTarget.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _sx;
      const dy = e.changedTouches[0].clientY - _sy2;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const cur  = tabBtns.findIndex(b => b.classList.contains('active'));
        const next = dx < 0
          ? Math.min(cur + 1, tabBtns.length - 1)
          : Math.max(cur - 1, 0);
        if (next !== cur) activateTab(tabBtns[next]);
      }
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════
     5.  SCROLL REVEAL
  ════════════════════════════════════════════════ */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  /* ════════════════════════════════════════════════
     6.  STAGGER card delays
  ════════════════════════════════════════════════ */
  const delay = isTouch() ? 45 : 75;
  document.querySelectorAll(
    '.menu-grid, .values-grid, .team-grid, .menu-section.active, .featured-grid'
  ).forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${i * delay}ms`;
    });
  });

  /* ════════════════════════════════════════════════
     7.  ANIMATED COUNTERS
  ════════════════════════════════════════════════ */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.num').forEach(animCount);
        counterIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stats-bar').forEach(b => counterIO.observe(b));

  function animCount(el) {
    const raw    = el.textContent.trim();
    const num    = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const suffix = raw.replace(/[0-9.]/g, '');
    if (isNaN(num)) return;
    const dur = 1400, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const v = num * (1 - Math.pow(1 - p, 3));
      el.textContent = (Number.isInteger(num) ? Math.round(v) : v.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ════════════════════════════════════════════════
     8.  CONTACT FORM
  ════════════════════════════════════════════════ */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fname   = (document.getElementById('fname')?.value || '').trim();
      const email   = (document.getElementById('email')?.value || '').trim();
      const message = (document.getElementById('message')?.value || '').trim();

      if (!fname)                    { toast('Please enter your first name.', 'error');          return; }
      if (!email || !validEmail(email)) { toast('Please enter a valid email address.', 'error'); return; }
      if (!message)                  { toast('Please write your message before sending.', 'error'); return; }

      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      setTimeout(() => {
        toast('✦ Message sent! We\'ll be in touch soon.');
        form.reset();
        btn.textContent = orig;
        btn.disabled = false;
      }, 1200);
    });
  }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ════════════════════════════════════════════════
     9.  TOAST
  ════════════════════════════════════════════════ */
  function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.background = type === 'error'
      ? 'rgba(175,45,45,0.95)'
      : 'rgba(46,125,82,0.95)';
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 4200);
  }

  /* ════════════════════════════════════════════════
     10.  DESKTOP-ONLY: magnetic buttons
  ════════════════════════════════════════════════ */
  if (!isTouch()) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r  = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.2;
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.2;
        btn.style.transform = `translate(${dx}px,${dy}px) translateY(-3px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ════════════════════════════════════════════════
     11.  DESKTOP-ONLY: 3-D card tilt
  ════════════════════════════════════════════════ */
  if (!isTouch()) {
    document.querySelectorAll('.menu-card, .value-card, .team-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r   = card.getBoundingClientRect();
        const rx  = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -5;
        const ry  = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  5;
        const sh  = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        card.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.015)`;
        card.style.transition = 'transform 0.1s ease';
        card.style.background = `linear-gradient(${sh}deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.03) 100%),var(--glass-bg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform 0.5s ease, background 0.5s ease';
        card.style.background = '';
      });
    });
  }

  /* ════════════════════════════════════════════════
     12.  TOUCH-ONLY: press-scale feedback
  ════════════════════════════════════════════════ */
  if (isTouch()) {
    document.querySelectorAll('.menu-card,.value-card,.featured-card,.team-card').forEach(c => {
      const press   = () => { c.style.transform = 'scale(0.97)'; c.style.transition = 'transform 0.12s ease'; };
      const release = () => { c.style.transform = ''; };
      c.addEventListener('touchstart',  press,   { passive: true });
      c.addEventListener('touchend',    release, { passive: true });
      c.addEventListener('touchcancel', release, { passive: true });
    });
  }

  /* ════════════════════════════════════════════════
     13.  IMAGE FADE-IN on load
  ════════════════════════════════════════════════ */
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) { img.style.opacity = '1'; return; }
    img.style.opacity    = '0';
    img.style.transition = 'opacity 0.45s ease';
    img.addEventListener('load',  () => { img.style.opacity = '1'; });
    img.addEventListener('error', () => { img.style.opacity = '1'; });
  });

});
