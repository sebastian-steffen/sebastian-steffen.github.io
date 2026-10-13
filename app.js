/* =========================================================
   Sebastian Steffen — Portfolio «Kartendeck»
   Ein Script für alle Seiten. Vanilla JS, keine Libraries.
   ========================================================= */
(function () {
  'use strict';
  var P = window.PROJEKTE || [];
  var page = document.body.getAttribute('data-page');

  /* ---------- Helfer ---------- */
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function thumb(p) { return 'https://img.youtube.com/vi/' + p.yt + '/maxresdefault.jpg'; }
  function fallback(img) {
    function toHq() {
      if (img.src.indexOf('maxresdefault') < 0) return;
      img.src = img.src.replace('maxresdefault', 'hqdefault');
      if (!img.classList.contains('hoch')) img.classList.add('is-hq');
    }
    img.addEventListener('error', toHq);
    /* YouTube liefert bei fehlendem maxres ein 120px-Platzhalterbild statt eines Fehlers */
    img.addEventListener('load', function () { if (img.naturalWidth <= 120) toHq(); });
  }
  function url(p) { return 'projekt.html?id=' + encodeURIComponent(p.id); }
  function short(p) {
    var s = p.titel.split(' – ')[0];
    /* Gleicher Kurztitel bei mehreren Projekten (z.B. Fitpass)? Dann den ganzen Titel zeigen */
    var dup = P.filter(function (q) { return q.titel.split(' – ')[0] === s; }).length > 1;
    return dup ? p.titel : s;
  }
  function yr(p) { return '’' + String(p.jahr).slice(2); }
  var ORDER = P.filter(function (p) { return p.highlight; }).concat(P.filter(function (p) { return !p.highlight; }));
  function nr(p) { return String(ORDER.indexOf(p) + 1); }
  var KIND = { video: ['Video', 'var(--red)'], animation: ['Animation', 'var(--mint)'], installation: ['Installation', 'var(--gold)'], spiel: ['Spiel', 'var(--violet)'] };
  function kind(p) { return (KIND[p.kategorie] || KIND.installation)[0]; }
  function kindColor(p) { return (KIND[p.kategorie] || KIND.installation)[1]; }
  var IMG = 'images/', VID = 'video/web/';
  /* Eigenes Bild (Feld "bild") hat Vorrang vor dem YouTube-Vorschaubild */
  function cover(p) { return p.bild ? IMG + p.bild : thumb(p); }
  function random(except) { var pool = P.filter(function (p) { return p.id !== except; }); return pool[Math.floor(Math.random() * pool.length)]; }
  function find(id) { return P.filter(function (p) { return p.id === id; })[0]; }

  /* ---------- Karte als HTML ---------- */
  function card(p, opts) {
    opts = opts || {};
    var big = opts.big;
    return '<a class="card' + (big ? ' big' : '') + '" href="' + url(p) + '" data-kat="' + p.kategorie + '"' + (p.spielen ? ' data-spielbar="1"' : '') + '>' +
      '<div class="face">' +
        '<span class="idx tl">' + yr(p) + '</span>' +
        (p.spielen ? '<span class="playable">Spielbar</span>' : '') +
        '<div class="photo' + (p.bild && !p.spielen ? ' whole' : '') + '"><img class="' + (p.format === 'hoch' && !p.bild ? 'hoch' : '') + '" src="' + cover(p) + '" alt="" loading="lazy"></div>' +
        '<div class="name">' + esc(short(p)) + '</div>' +
        '<div class="sub">' + esc(p.tagline) + '</div>' +
        (big ? '<p class="kurz">' + esc(p.kurz) + '</p>' : '') +
        '<div class="kind" style="--c:' + kindColor(p) + '">' + kind(p) + '</div>' +
        '<span class="idx br">' + yr(p) + '</span>' +
      '</div></a>';
  }
  function fill(el, html) { el.innerHTML = html; el.querySelectorAll('img').forEach(fallback); }

  /* ---------- Karten auf dem Tisch: ziehen & umdrehen ---------- */
  function initTable(table) {
    var cards = [].slice.call(table.querySelectorAll('.pcard'));
    var z = 10;
    function scale() { return window.innerWidth < 620 ? .5 : window.innerWidth < 900 ? .8 : 1; }
    function place(c) {
      c.style.transform = 'translate(calc(-50% + ' + c.dataset.x + 'px), calc(-50% + ' + c.dataset.y + 'px)) rotate(' + c.dataset.r + 'deg)';
    }
    cards.forEach(function (c) {
      c.dataset.x0 = c.dataset.x; c.dataset.y0 = c.dataset.y; c.dataset.r0 = c.dataset.r;
      c.dataset.x = c.dataset.x0 * scale(); c.dataset.y = c.dataset.y0 * scale();
      place(c);
      var sx, sy, ox, oy, moved;
      /* Bilder nicht als Datei ziehen lassen (sonst erscheint das Browser-Drag-Symbol) */
      c.querySelectorAll('img').forEach(function (im) { im.draggable = false; });
      c.addEventListener('dragstart', function (e) { e.preventDefault(); });
      c.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a') || e.button !== 0) return;
        e.preventDefault();
        sx = e.clientX; sy = e.clientY; ox = +c.dataset.x; oy = +c.dataset.y; moved = false;
        c.setPointerCapture(e.pointerId); c.classList.add('dragging'); c.style.zIndex = ++z;
      });
      c.addEventListener('pointermove', function (e) {
        if (!c.classList.contains('dragging')) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        c.dataset.x = ox + dx; c.dataset.y = oy + dy;
        c.dataset.r = Math.max(-18, Math.min(18, dx / 12));
        place(c);
      });
      c.addEventListener('pointerup', function () {
        if (!c.classList.contains('dragging')) return;
        c.classList.remove('dragging');
        if (!moved) c.classList.toggle('flipped');
      });
      /* Falls der Browser den Zeiger verliert: Karte sofort loslassen */
      ['pointercancel', 'lostpointercapture'].forEach(function (ev) {
        c.addEventListener(ev, function () { c.classList.remove('dragging'); });
      });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('flipped'); }
      });
    });
    return {
      shuffle: function () {
        cards.forEach(function (c) {
          c.classList.remove('flipped');
          c.dataset.x = (Math.random() * 260 - 130) * scale();
          c.dataset.y = (Math.random() * 80 - 40) * scale();
          c.dataset.r = Math.random() * 30 - 15; place(c);
        });
      }
    };
  }

  /* ---------- Bilder mit data-yt füllen ---------- */
  document.querySelectorAll('img[data-project]').forEach(function (img) {
    var p = find(img.getAttribute('data-project')); if (!p) return;
    fallback(img); img.src = thumb(p);
    if (p.format === 'hoch') img.classList.add('hoch');
  });

  /* ---------- Startseite ---------- */
  if (page === 'start') {
    var t = initTable(document.getElementById('table'));
    document.getElementById('draw').addEventListener('click', function () {
      t.shuffle();
      var p = random();
      setTimeout(function () { location.href = url(p); }, 900);
    });
    fill(document.getElementById('top3'), P.filter(function (p) { return p.highlight; }).map(function (p) { return card(p); }).join(''));
  }

  /* ---------- Projekte ---------- */
  if (page === 'projekte') {
    var deck = document.getElementById('deck');
    var tops = P.filter(function (p) { return p.highlight; });
    var rest = P.filter(function (p) { return !p.highlight; });
    var html = tops.map(function (p) { return card(p, { big: true }); }).concat(rest.map(function (p) { return card(p); }));
    html.push('<a class="card joker" href="mailto:sebastian.steffen@hyperwerk.ch"><div class="face"><span class="idx tl">J</span><p class="big-q">Dein<br>Projekt?</p><p class="sub">Schreib mir</p><span class="idx br">J</span></div></a>');
    fill(deck, html.join(''));

    var counts = { alle: P.length, installation: 0, video: 0, animation: 0, spiel: 0, spielbar: 0 };
    P.forEach(function (p) { counts[p.kategorie]++; if (p.spielen) counts.spielbar++; });
    document.querySelectorAll('.chip[data-filter]').forEach(function (c) {
      c.querySelector('small').textContent = counts[c.dataset.filter];
      c.addEventListener('click', function () {
        document.querySelectorAll('.chip[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
        deck.querySelectorAll('.card[data-kat]').forEach(function (k) {
          var f = c.dataset.filter;
          k.classList.toggle('is-hidden', f !== 'alle' && (f === 'spielbar' ? !k.dataset.spielbar : k.dataset.kat !== f));
        });
      });
    });
    document.getElementById('draw').addEventListener('click', function () {
      var vis = [].slice.call(deck.querySelectorAll('.card[data-kat]:not(.is-hidden)'));
      var k = vis[Math.floor(Math.random() * vis.length)];
      k.scrollIntoView({ behavior: 'smooth', block: 'center' });
      k.querySelector('.face').animate(
        [{ transform: 'none' }, { transform: 'translateY(-24px) rotate(-4deg)' }, { transform: 'translateY(-24px) rotate(4deg)' }, { transform: 'translateY(-14px)' }],
        { duration: 900, easing: 'ease-out', fill: 'forwards' });
      setTimeout(function () { location.href = k.getAttribute('href'); }, 1100);
    });
  }

  /* ---------- Postkarten (z.B. Chill Mol) ---------- */
  function postcard(k, back) {
    return '<button class="pc' + (k.meine ? ' mine-pc' : '') + '" type="button" aria-pressed="false" aria-label="Postkarte ' + esc(k.titel) + ' umdrehen">' +
      '<span class="pc-inner">' +
        '<img class="pc-face" src="' + IMG + k.bild + '" alt="Postkarte ' + esc(k.titel) + '" loading="lazy">' +
        '<img class="pc-face pc-back" src="' + IMG + back + '" alt="Rückseite der Postkarte" loading="lazy">' +
      '</span></button>';
  }

  /* Grossansicht für Bilder (Klick = gross, Pfeile/Tasten = blättern, Esc = schliessen) */
  var lb, lbList = [], lbIndex = 0;
  function lightbox(list, index) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Grossansicht');
      lb.innerHTML = '<button class="lb-close" aria-label="Schliessen">×</button>' +
        '<button class="lb-nav prev" aria-label="Vorherige">←</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button class="lb-nav next" aria-label="Nächste">→</button>';
      document.body.appendChild(lb);
      lb.addEventListener('click', function (e) {
        if (e.target.closest('.prev')) return show(lbIndex - 1);
        if (e.target.closest('.next')) return show(lbIndex + 1);
        if (!e.target.closest('img')) close();
      });
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') show(lbIndex + 1);
        if (e.key === 'ArrowLeft') show(lbIndex - 1);
      });
    }
    function show(i) {
      lbIndex = (i + lbList.length) % lbList.length;
      lb.querySelector('img').src = lbList[lbIndex].src;
      lb.querySelector('img').alt = lbList[lbIndex].alt;
      lb.querySelector('figcaption').textContent = lbList[lbIndex].alt;
    }
    function close() { lb.hidden = true; document.body.style.overflow = ''; }
    lbList = list; show(index);
    lb.hidden = false; document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }

  /* Von mehreren Videos spielt nur das, das gerade in der Bildschirmmitte ist */
  function centerPlay(videos) {
    if (!videos.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function check() {
      ticking = false;
      var mid = window.innerHeight / 2, zone = window.innerHeight * .22, best = null, bestDist = Infinity;
      videos.forEach(function (v) {
        var r = v.getBoundingClientRect(), c = r.top + r.height / 2, dist = Math.abs(c - mid);
        if (dist < zone + r.height / 4 && dist < bestDist) { best = v; bestDist = dist; }
      });
      videos.forEach(function (v) {
        if (v === best) { if (v.paused && !v.dataset.userPaused) v.play().catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    videos.forEach(function (v) {
      v.preload = 'metadata';
      /* Wer selbst auf Pause drückt, dem startet das Video nicht wieder von allein */
      v.addEventListener('pause', function () { if (v.dataset.auto !== '1') v.dataset.userPaused = '1'; v.dataset.auto = ''; });
      v.addEventListener('play', function () { delete v.dataset.userPaused; });
      var origPause = v.pause.bind(v);
      v.pause = function () { v.dataset.auto = '1'; origPause(); };
    });
    check();
  }

  function renderPostkarten(p) {
    var box = document.getElementById('extra'); if (!box) return;
    var mine = p.postkarten.filter(function (k) { return k.meine; });
    box.innerHTML =
      '<section class="section lhf">' +
        '<div class="section-head"><div><h2 class="h2">Postkarten aus der Zukunft</h2>' +
        '<p class="lead">Acht Ideen, acht Postkarten. Vier davon habe ich visualisiert und animiert.</p></div></div>' +
        '<div class="mine">' + mine.map(function (k) {
          return '<article class="mine-row">' +
            '<div class="mine-video"><video src="' + VID + k.video + '.mp4" poster="' + VID + k.video + '.jpg" muted loop playsinline controls preload="none"></video></div>' +
            '<div class="mine-side">' + postcard(k, p.rueckseite) +
              '<h3>' + esc(k.titel) + '</h3><p class="idee">Eingabe: ' + esc(k.idee) + '</p>' +
              (k.beschrieb ? '<p class="beschrieb">' + esc(k.beschrieb) + '</p>' : '') +
            '</div></article>';
        }).join('') + '</div>' +
        '<h3 class="about-h2" style="margin-top:72px">Alle acht Postkarten</h3>' +
        '<div class="pcs">' + p.postkarten.map(function (k, n) {
          return '<figure><button class="zoom' + (k.meine ? ' mine-pc' : '') + '" type="button" data-n="' + n + '" aria-label="Postkarte ' + esc(k.titel) + ' gross anzeigen">' +
            '<img src="' + IMG + k.bild + '" alt="' + esc(k.titel) + '" loading="lazy"></button>' +
            '<figcaption>' + esc(k.titel) + '</figcaption></figure>';
        }).join('') + '</div>' +
      '</section>';
    box.querySelectorAll('.pc').forEach(function (b) {
      b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.classList.toggle('flipped')); });
    });
    var list = p.postkarten.map(function (k) { return { src: IMG + k.bild, alt: k.titel }; });
    box.querySelectorAll('.zoom').forEach(function (b) {
      b.addEventListener('click', function () { lightbox(list, +b.dataset.n); });
    });
    centerPlay([].slice.call(box.querySelectorAll('video')));
  }

  /* Karussell: immer nur ganze Karten; Pfeile, Mausrad und gedrücktes Mausrad blättern */
  function rail(el, prev, next) {
    var GAP = 20, MIN = 200;
    /* eigener Balken: Handys blenden die normale Scrollleiste aus */
    var bar = document.createElement('div'); bar.className = 'rail-bar';
    bar.innerHTML = '<button class="rail-mini" type="button" aria-label="Zurück">←</button><span class="rail-track"><span class="rail-thumb"></span></span><button class="rail-mini" type="button" aria-label="Weiter">→</button>';
    el.parentNode.parentNode.insertBefore(bar, el.parentNode.nextSibling);
    var thumb = bar.querySelector('.rail-thumb'), mini = bar.querySelectorAll('.rail-mini');
    function layout() {
      var w = el.clientWidth;
      var gapMin = innerWidth <= 620 ? 140 : MIN;
      var n = Math.max(1, Math.floor((w + GAP) / (gapMin + GAP)));
      el.style.setProperty('--cw', ((w - GAP * (n - 1)) / n) + 'px');
      sync();
    }
    function step() { var c = el.querySelector('.card'); return c ? c.getBoundingClientRect().width + GAP : 260; }
    function go(dir) { el.scrollBy({ left: dir * step(), behavior: 'smooth' }); }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    mini[0].addEventListener('click', function () { go(-1); });
    mini[1].addEventListener('click', function () { go(1); });

    /* Mausrad drehen: eine Karte pro Raste */
    var lock = 0;
    el.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 1) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      var now = Date.now(); if (now - lock < 220) return; lock = now;
      go(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* Mausrad gedrückt halten und bewegen: Karten seitwärts schieben */
    var mid = null;
    el.addEventListener('mousedown', function (e) {
      if (e.button !== 1) return;
      e.preventDefault();
      mid = { x: e.clientX, left: el.scrollLeft, moved: false };
      el.classList.add('panning');
    });
    window.addEventListener('mousemove', function (e) {
      if (!mid) return;
      var dx = e.clientX - mid.x;
      if (Math.abs(dx) > 3) mid.moved = true;
      el.style.scrollSnapType = 'none';
      el.scrollLeft = mid.left - dx * 1.5;
    });
    window.addEventListener('mouseup', function (e) {
      if (!mid || e.button !== 1) return;
      var moved = mid.moved; mid = null;
      el.classList.remove('panning'); el.style.scrollSnapType = '';
      /* nach dem Schieben nicht zusätzlich den Link in neuem Tab öffnen */
      if (moved) el.addEventListener('auxclick', function stop(ev) { ev.preventDefault(); el.removeEventListener('auxclick', stop, true); }, true);
    });

    function sync() {
      prev.disabled = mini[0].disabled = el.scrollLeft <= 2;
      next.disabled = mini[1].disabled = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      var vis = el.clientWidth / Math.max(el.scrollWidth, 1), max = el.scrollWidth - el.clientWidth;
      thumb.style.width = (vis * 100) + '%';
      thumb.style.left = (max > 0 ? (el.scrollLeft / max) * (1 - vis) * 100 : 0) + '%';
    }
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', layout);
    layout(); setTimeout(layout, 300);
  }

  /* ---------- Projekt-Detail ---------- */
  if (page === 'projekt') {
    var id = new URLSearchParams(location.search).get('id');
    var i = Math.max(0, P.findIndex(function (p) { return p.id === id; }));
    var p = P[i];
    document.title = short(p) + ' — Sebastian Steffen';
    var facts = [['Jahr', p.jahr], ['Kunde', p.kunde], ['Rolle', p.rolle], ['Werkzeug', p.tools]]
      .filter(function (f) { return f[1]; })
      .map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('');
    var d = document.getElementById('detail');
    var hochFormat = p.spielen ? p.spielFormat === 'hoch' : p.format === 'hoch';
    if (!hochFormat) d.classList.add('wide');
    d.innerHTML =
      '<div class="video-card"><div class="face">' +
        '<span class="idx tl">' + yr(p) + '</span>' +
        (p.yt
          ? '<div class="frame"><iframe src="https://www.youtube.com/embed/' + p.yt + '?autoplay=1&mute=1&playsinline=1&rel=0" title="' + esc(p.titel) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
          : '<div class="frame game' + (hochFormat ? ' game-hoch' : '') + '" id="game">' +
              '<button class="play-cover" type="button" id="playBtn"><img src="' + cover(p) + '" alt=""><span class="btn">Hier spielen</span></button>' +
            '</div>' +
            '<div class="game-bar"><button class="game-link" type="button" id="fsBtn">Vollbild</button>' +
            '<a class="game-link" href="' + p.spielen + '" target="_blank" rel="noopener">In neuem Tab ↗</a></div>') +
        '<span class="idx br">' + yr(p) + '</span>' +
      '</div></div>' +
      '<div>' +
        '<a class="back-link" href="projekte.html">← Alle Projekte</a>' +
        '<h1>' + esc(p.titel) + '</h1>' +
        '<p class="tagline">' + esc(p.tagline) + '</p>' +
        '<dl class="facts">' + facts + '</dl>' +
        (p.spielHinweis ? '<p class="play-hint">' + esc(p.spielHinweis) + '</p>' : '') +
        '<div class="text"><p class="kurz">' + esc(p.kurz) + '</p><p>' + p.lang + '</p></div>' +
      '</div>';
    if (p.postkarten) renderPostkarten(p);
    /* Spiel direkt im Portfolio: erst beim Klick laden (kein Ton, keine Last vorher) */
    if (p.spielen) {
      var game = document.getElementById('game');
      function load() {
        if (game.querySelector('iframe')) return game.querySelector('iframe');
        game.innerHTML = '<iframe src="' + p.spielen + '" title="' + esc(p.titel) + '" allow="autoplay; fullscreen; screen-wake-lock" allowfullscreen></iframe>';
        var f = game.querySelector('iframe'); f.addEventListener('load', function () { try { f.focus(); } catch (e) {} });
        return f;
      }
      document.getElementById('playBtn').addEventListener('click', load);
      document.getElementById('fsBtn').addEventListener('click', function () {
        load();
        var el = game;
        (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      });
    }
    /* Weitere Karten: vorheriges, nächstes und zwei passende */
    var pick = P.slice(i + 1).concat(P.slice(0, i));
    var more = document.getElementById('more');
    fill(more, pick.map(function (q) { return card(q); }).join(''));
    rail(more, document.getElementById('railPrev'), document.getElementById('railNext'));
    document.getElementById('draw').addEventListener('click', function () { location.href = url(random(p.id)); });
  }

  /* ---------- Über mich ---------- */
  if (page === 'ueber') {
    initTable(document.getElementById('table'));
    /* Werkzeuge aus allen Projekten sammeln */
    var seen = {}, tools = [];
    P.forEach(function (p) {
      String(p.tools).split(',').forEach(function (t) {
        t = t.trim(); var k = t.toLowerCase();
        if (t && !seen[k]) { seen[k] = 1; tools.push(t); }
      });
    });
    document.querySelectorAll('.flip').forEach(function (f) {
      f.addEventListener('click', function () {
        var on = f.classList.toggle('flipped');
        f.setAttribute('aria-pressed', on);
      });
    });
    document.getElementById('tools').innerHTML = tools.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  }
  /* =========================================================
     Plotter-Kunst: Harmonograph-Linien (wie vom Stiftplotter)
     ========================================================= */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function harmono(seed, steps) {
    var r = rng(seed), f = [2, 3, 3.01, 2.01, 4, 1.5, 5, 1];
    var a = [], i;
    for (i = 0; i < 4; i++) a.push({ f: f[Math.floor(r() * f.length)] + r() * .02, p: r() * Math.PI * 2, d: .0015 + r() * .003, A: .5 + r() * .5 });
    var pts = [], t, x, y;
    for (i = 0; i < steps; i++) {
      t = i * .06;
      x = a[0].A * Math.sin(a[0].f * t + a[0].p) * Math.exp(-a[0].d * t) + a[1].A * Math.sin(a[1].f * t + a[1].p) * Math.exp(-a[1].d * t);
      y = a[2].A * Math.sin(a[2].f * t + a[2].p) * Math.exp(-a[2].d * t) + a[3].A * Math.sin(a[3].f * t + a[3].p) * Math.exp(-a[3].d * t);
      pts.push((50 + x * 24).toFixed(2) + ' ' + (50 + y * 24).toFixed(2));
    }
    return 'M' + pts.join('L');
  }
  function artSvg(seed, steps) {
    return '<svg class="art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="' + harmono(seed, steps || 2600) + '"/></svg>';
  }
  /* Rückseiten, Joker, Info-Karten bekommen je ein eigenes Bild */
  var seed = 7;
  document.querySelectorAll('.pcard .back .pattern, .joker .face, .flip .front').forEach(function (el) {
    el.insertAdjacentHTML('afterbegin', artSvg(seed += 13));
  });
  /* Grosse Linie im Hero, die sich einmal selbst zeichnet */
  var plot = document.getElementById('plot');
  if (plot) {
    plot.setAttribute('viewBox', '0 0 100 100');
    plot.setAttribute('preserveAspectRatio', 'none');
    plot.innerHTML = '<path d="' + harmono(20261008, 5200) + '"/>';
    var path = plot.querySelector('path');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && path.getTotalLength) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 6s cubic-bezier(.4, 0, .2, 1)';
      requestAnimationFrame(function () { path.style.strokeDashoffset = 0; });
    }
  }


  /* ---------- Kontakt: hinscrollen und kurz aufleuchten ---------- */
  document.querySelectorAll('a[href="#kontakt"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var f = document.getElementById('kontakt'); if (!f) return;
      e.preventDefault();
      f.scrollIntoView({ behavior: 'smooth', block: 'end' });
      f.classList.remove('kontakt-ping'); void f.offsetWidth; f.classList.add('kontakt-ping');
    });
  });
})();
