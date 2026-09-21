/* ============================================================
   AARUSH BADRUKA — SITE SCRIPT
   ------------------------------------------------------------
   Shared by every page. Two rules hold this file together:

   1. Nothing here is allowed to leave the page blank. Every
      feature sits in its own try/catch, the reveal animation
      runs first, and a 3-second timer forces everything visible
      no matter what went wrong.
   2. Nothing essential depends on it. The menu, the read-more
      panels and all the content work with JavaScript switched
      off — this file only makes them nicer.
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables   = document.querySelectorAll('.reveal');

  var revealAll = function () {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  };

  /* Each block below is isolated. A failure in one can no longer stop
     the others from running, and none of them can leave the page blank. */
  var safely = function (label, fn) {
    try { fn(); } catch (err) { console.error('[' + label + '] ' + err.message); }
  };

  /* ---- 1. Entrance reveal — FIRST, so content shows no matter what -- */
  safely('reveal', function () {
    if (reducedMotion || !('IntersectionObserver' in window)) { revealAll(); return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { observer.observe(el); });
  });

  /* Failsafe: whatever happened above, nothing stays invisible past
     3 seconds. This is the net that stops a blank page, ever. */
  window.setTimeout(revealAll, 3000);
  window.addEventListener('error', revealAll);

  /* ---- 2. Nav: solidify once the page has moved ------------------ */
  var nav = document.getElementById('nav');
  safely('nav', function () {
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  /* ---- 3. Phone menu --------------------------------------------
     On a narrow screen the links collapse behind a Menu button.
     If this block never runs the links just wrap onto a second
     line instead, which is why the CSS scopes the drop-down to
     .js — nothing can hide the navigation. */
  safely('menu', function () {
    var toggle = document.getElementById('nav-toggle');
    var menu   = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    var setOpen = function (open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    /* tapping a link, pressing Escape, or tapping the page closes it */
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!nav || nav.contains(e.target)) return;
      setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) setOpen(false);
    });
  });

  /* ---- 4. Photos: show a labelled placeholder if the file is
            missing, so the page never renders a broken image ------ */
  safely('image-slots', function () {
    document.querySelectorAll('[data-frame]').forEach(function (frame) {
      var img = frame.querySelector('img');
      if (!img) return;

      var markEmpty = function () { frame.classList.add('is-empty'); };
      img.addEventListener('error', markEmpty);
      // catches the case where the error fired before this script ran
      if (img.complete && img.naturalWidth === 0) markEmpty();
    });
  });

  /* ---- 5. Smooth scrolling with a fixed-header offset ------------ */
  safely('smooth-scroll', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        var offset = nav ? nav.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });

        // move keyboard focus with the eye, then tidy up after
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', function once () {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', once);
        });

        history.replaceState(null, '', id);
      });
    });
  });

  /* ---- 6. Contact form: validate, then confirm -------------------
            Only on the home page. Everywhere else this block finds
            no form and stops here, which is fine. */
  var form = document.getElementById('enquiry');
  var sent = document.getElementById('sent');
  if (!form || !sent) return;

  var isValid = function (input) {
    if (!input.required) return true;
    if (!input.value.trim()) return false;
    if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    return true;
  };

  var mark = function (input) {
    var field = input.closest('[data-field]');
    /* the hidden _subject/_honey etc. inputs sit outside any
       [data-field] wrapper — skip them rather than crashing */
    if (!field) return true;
    var ok = isValid(input);
    field.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  };

  /* only the visible fields get live validation */
  var fields = form.querySelectorAll('[data-field] input, [data-field] select, [data-field] textarea');

  fields.forEach(function (input) {
    input.addEventListener('blur',   function () { mark(input); });
    input.addEventListener('change', function () { mark(input); });
    input.addEventListener('input',  function () {
      if (input.closest('[data-field]').classList.contains('is-invalid')) mark(input);
    });
  });

  var showSent = function () {
    form.hidden = true;
    sent.hidden = false;
    sent.setAttribute('tabindex', '-1');
    sent.focus({ preventScroll: true });
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;

    fields.forEach(function (input) {
      if (!mark(input) && !firstBad) firstBad = input;
    });

    if (firstBad) { firstBad.focus(); return; }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.childNodes[0];
    btn.disabled = true;
    label.nodeValue = ' Sending ';

    /* Post to FormSubmit, which forwards the message to my Gmail.
       This works once the site is live on GitHub Pages. */
    fetch('https://formsubmit.co/ajax/aarushbadruka@gmail.com', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Bad response: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      /* FormSubmit answers {"success":"true"} (a string) when it
         accepts the message; anything else counts as a failure */
      if (!data || String(data.success) !== 'true') throw new Error('Not accepted');
      showSent();
    })
    .catch(function () {
      btn.disabled = false;
      label.nodeValue = ' Send message ';
      var fallback = form.querySelector('.form__error');
      if (fallback) fallback.hidden = false;
    });
  });
})();
