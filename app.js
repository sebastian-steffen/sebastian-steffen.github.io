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
  var KIND = { video: ['Video', 'var(--red)'], animation: ['Animation', 'var(--mint)'], installation: ['Installation', 'var(--gold)'], spiel: ['Spiel', 'var(--violet)'], '3d': ['3D-Druck', 'var(--sky)'] };
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
        '<div class="photo' + (p.bild && !p.spielen && p.bildGanz !== false ? ' whole' : '') + '"><img class="' + (p.format === 'hoch' && !p.bild ? 'hoch' : '') + '"' + (p.bildFokus ? ' style="transform:translate(-50%,-' + p.bildFokus + '%)"' : '') + ' src="' + cover(p) + '" alt="" loading="lazy"></div>' +
        '<div class="name">' + esc(short(p)) + '</div>' +
        '<div class="sub">' + esc(p.tagline) + '</div>' +
        (big ? '<p class="kurz">' + esc(p.kurz) + '</p>' : '') +
        '<div class="kind" style="--c:' + kindColor(p) + '">' + kind(p) + '</div>' +
        '<span class="idx br">' + yr(p) + '</span>' +
      '</div></a>';
  }
  function fill(el, html) { el.innerHTML = html; el.querySelectorAll('img').forEach(fallback); }

  /* Karte umdrehen. Touch-Geräte: flach drehen (schmal, Seite wechseln, breit), weil Safari
     die 3D-Drehung fehlerhaft zeigt. Maus: Klasse direkt setzen, die 3D-Drehung macht das CSS. */
  var FLAT = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function turn(inner, apply) {
    if (!FLAT || !inner || !inner.animate) { apply(); return; }
    if (inner._turning) return;
    inner._turning = true;
    var a = inner.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = function () {
      apply();
      var b = inner.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 200, easing: 'ease-out' });
      a.cancel();
      b.onfinish = function () { inner._turning = false; };
    };
  }

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
        if (!moved) turn(c.querySelector('.inner'), function () { c.classList.toggle('flipped'); });
      });
      /* Falls der Browser den Zeiger verliert: Karte sofort loslassen */
      ['pointercancel', 'lostpointercapture'].forEach(function (ev) {
        c.addEventListener(ev, function () { c.classList.remove('dragging'); });
      });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(c.querySelector('.inner'), function () { c.classList.toggle('flipped'); }); }
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

    var counts = { alle: P.length, installation: 0, video: 0, animation: 0, spiel: 0, '3d': 0, spielbar: 0 };
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
      b.addEventListener('click', function () { turn(b.querySelector('.pc-inner'), function () { b.setAttribute('aria-pressed', b.classList.toggle('flipped')); }); });
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


  /* ---------- Galerie: Slideshow, Bildreihen, 3D-Modelle (Feld "galerie" in projekte.js) ---------- */
  var MOD = 'modelle/';
  function renderGalerie(p) {
    var box = document.getElementById('extra'); if (!box) return;
    var html = p.galerie.map(function (g, gi) {
      var head = g.titel ? '<div class="section-head"><div><h2 class="h2">' + esc(g.titel) + '</h2>' +
        (g.text ? '<p class="lead">' + esc(g.text) + '</p>' : '') + '</div></div>' : '';
      var inner = '';
      if (g.typ === 'slides') {
        inner = '<div class="slides" data-g="' + gi + '">' +
          '<button class="rail-btn slide-nav prev" type="button" aria-label="Vorheriges Bild">←</button>' +
          '<div class="slide-track">' + g.bilder.map(function (b, k) {
            return '<button class="slide" type="button" data-g="' + gi + '" data-k="' + k + '" aria-label="' + esc(b.alt) + ' gross anzeigen"><img src="' + IMG + b.src + '" alt="' + esc(b.alt) + '" loading="lazy"></button>';
          }).join('') + '</div>' +
          '<button class="rail-btn slide-nav next" type="button" aria-label="Nächstes Bild">→</button>' +
          '<div class="slide-dots">' + g.bilder.map(function (b, k) { return '<span' + (k ? '' : ' class="on"') + '></span>'; }).join('') + '</div>' +
        '</div>';
      } else if (g.typ === 'bilder') {
        inner = '<div class="gal-grid n' + g.bilder.length + (g.breit ? ' breit' : '') + '">' + g.bilder.map(function (b, k) {
          return '<figure><button class="gal-img' + (b.frei ? ' frei' : '') + (b.hover ? ' swap' : '') + '" type="button" data-g="' + gi + '" data-k="' + k + '" aria-label="' + esc(b.alt) + ' gross anzeigen">' +
            '<img src="' + IMG + b.src + '" alt="' + esc(b.alt) + '" loading="lazy">' +
            (b.hover ? '<img class="alt" src="' + IMG + b.hover + '" alt="" loading="lazy">' : '') + '</button>' +
            (b.text ? '<figcaption>' + esc(b.text) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div>';
      } else if (g.typ === 'modelle') {
        inner = '<div class="gal-grid n' + g.modelle.length + '">' + g.modelle.map(function (m) {
          return '<figure class="model"><div class="model-box"><canvas data-src="' + MOD + m.datei + '"' + (m.textur ? ' data-tex="' + MOD + m.textur + '"' : '') + ' data-col="' + m.farbe + '" data-flat="' + (m.flach ? 1 : 0) + '" aria-label="3D-Modell ' + esc(m.name) + '"></canvas></div>' +
            '<figcaption><b>' + esc(m.name) + '</b>' + (m.text ? '<br>' + esc(m.text) : '') + '</figcaption></figure>';
        }).join('') + '</div>';
      }
      return '<section class="section gal">' + head + inner + '</section>';
    }).join('');
    box.insertAdjacentHTML('beforeend', html);

    /* Klick auf ein Bild: Grossansicht, blättern innerhalb des Blocks */
    box.querySelectorAll('.gal-img, .slide').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) { b._touch = e.pointerType === 'touch'; });
      b.addEventListener('click', function () {
        /* Touch: Antippen wechselt das Bild, statt es gross zu öffnen */
        if (b.classList.contains('swap') && b._touch) { b.classList.toggle('on'); return; }
        var g = p.galerie[+b.dataset.g];
        lightbox(g.bilder.map(function (x) { return { src: IMG + x.src, alt: x.alt }; }), +b.dataset.k);
      });
    });
    box.querySelectorAll('.slides').forEach(slideshow);
    box.querySelectorAll('.model canvas').forEach(viewer);
  }

  function slideshow(s) {
    var track = s.querySelector('.slide-track'), dots = s.querySelectorAll('.slide-dots span');
    var prev = s.querySelector('.prev'), next = s.querySelector('.next');
    function at() { return Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)); }
    function go(i) { i = Math.max(0, Math.min(dots.length - 1, i)); track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); }
    function sync() {
      var i = at();
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      prev.disabled = i <= 0; next.disabled = i >= dots.length - 1;
    }
    prev.addEventListener('click', function () { go(at() - 1); });
    next.addEventListener('click', function () { go(at() + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    sync();
  }

  /* Kleiner eigener 3D-Betrachter (WebGL, ohne Bibliothek). Dreht von selbst, ziehen dreht von Hand.
     Zeigt Farben: entweder ein Farbbild (Scan) oder eine Farbe pro Bauteil (Druck). */
  function viewer(canvas) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) { canvas.parentNode.classList.add('no-gl'); return; }
    var VS = 'attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute vec2 t;uniform mat4 m;uniform mat4 pr;' +
      'varying vec3 vn;varying vec3 vp;varying vec3 vc;varying vec2 vt;' +
      'void main(){vec4 w=m*vec4(p,1.);vn=mat3(m)*n;vp=w.xyz;vc=c;vt=t;gl_Position=pr*w;}';
    var FS = 'precision mediump float;varying vec3 vn;varying vec3 vp;varying vec3 vc;varying vec2 vt;' +
      'uniform sampler2D tex;uniform float useTex;uniform float amb;uniform float dif;' +
      'void main(){vec3 N=normalize(vn);if(!gl_FrontFacing)N=-N;vec3 L=normalize(vec3(.45,.7,.9));vec3 V=normalize(-vp);' +
      'float d=max(dot(N,L),0.);float s=pow(max(dot(N,normalize(L+V)),0.),36.)*.22;float r=pow(1.-max(dot(N,V),0.),2.)*.18;' +
      'vec3 b=useTex>.5?texture2D(tex,vt).rgb:vc;' +
      'gl_FragColor=vec4(b*(amb+dif*d)+vec3(s)+r*vec3(.95,.9,.8),1.);}';
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    var loc = {}; ['p', 'n', 'c', 't'].forEach(function (k) { loc[k] = gl.getAttribLocation(prog, k); });
    var uM = gl.getUniformLocation(prog, 'm'), uPr = gl.getUniformLocation(prog, 'pr');
    gl.enable(gl.DEPTH_TEST);

    function buffer(name, data, size) {
      if (loc[name] < 0) return;
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc[name]); gl.vertexAttribPointer(loc[name], size, gl.FLOAT, false, 0, 0);
    }
    var count = 0, meshReady = false, texReady = true;
    var texSrc = canvas.dataset.tex;
    gl.uniform1f(gl.getUniformLocation(prog, 'useTex'), texSrc ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(prog, 'amb'), texSrc ? .62 : .34);
    gl.uniform1f(gl.getUniformLocation(prog, 'dif'), texSrc ? .48 : .74);
    if (texSrc) {
      texReady = false;
      var img = new Image();
      img.onload = function () {
        var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0);
        texReady = true; check();
      };
      img.src = texSrc;
    }
    function check() { if (meshReady && texReady) canvas.parentNode.classList.add('ready'); }

    fetch(canvas.dataset.src).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var dv = new DataView(buf), nv = dv.getUint32(4, true), nt = dv.getUint32(8, true), fl = dv.getUint32(12, true);
      var off = 16, idx = fl & 4 ? new Uint32Array(buf, off, nt * 3) : new Uint16Array(buf, off, nt * 3);
      off += nt * 3 * (fl & 4 ? 4 : 2);
      var q = new Int16Array(buf, off, nv * 3); off += nv * 6;
      var uv = null, col = null;
      if (fl & 2) { uv = new Uint16Array(buf, off, nv * 2); off += nv * 4; }
      if (fl & 1) { col = new Uint8Array(buf, off, nv * 3); }
      var flat = canvas.dataset.flat === '1', i, k;
      function fn(a, b, c) {
        var ux = q[b * 3] - q[a * 3], uy = q[b * 3 + 1] - q[a * 3 + 1], uz = q[b * 3 + 2] - q[a * 3 + 2];
        var vx = q[c * 3] - q[a * 3], vy = q[c * 3 + 1] - q[a * 3 + 1], vz = q[c * 3 + 2] - q[a * 3 + 2];
        return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      }
      /* weiche Schattierung: Normalen pro Ort sammeln (auch über Nähte im Farbbild hinweg) */
      var sm = null, slot = null;
      if (!flat) {
        var map = {}, nk = 0; slot = new Uint32Array(nv);
        for (i = 0; i < nv; i++) { var key = q[i * 3] + ',' + q[i * 3 + 1] + ',' + q[i * 3 + 2]; if (!(key in map)) map[key] = nk++; slot[i] = map[key]; }
        sm = new Float32Array(nk * 3);
        for (i = 0; i < nt; i++) {
          var g = fn(idx[i * 3], idx[i * 3 + 1], idx[i * 3 + 2]);
          for (k = 0; k < 3; k++) { var s = slot[idx[i * 3 + k]] * 3; sm[s] += g[0]; sm[s + 1] += g[1]; sm[s + 2] += g[2]; }
        }
      }
      var P = new Float32Array(nt * 9), N = new Float32Array(nt * 9), C = new Float32Array(nt * 9), T = new Float32Array(nt * 6);
      var base = (canvas.dataset.col || '#3a95e6').replace('#', '');
      var br = parseInt(base.slice(0, 2), 16) / 255, bg = parseInt(base.slice(2, 4), 16) / 255, bb = parseInt(base.slice(4, 6), 16) / 255;
      for (i = 0; i < nt; i++) {
        var f = flat ? fn(idx[i * 3], idx[i * 3 + 1], idx[i * 3 + 2]) : null;
        for (k = 0; k < 3; k++) {
          var v = idx[i * 3 + k], o = i * 9 + k * 3, nx, ny, nz;
          P[o] = q[v * 3] / 32767; P[o + 1] = q[v * 3 + 1] / 32767; P[o + 2] = q[v * 3 + 2] / 32767;
          if (flat) { nx = f[0]; ny = f[1]; nz = f[2]; } else { var z = slot[v] * 3; nx = sm[z]; ny = sm[z + 1]; nz = sm[z + 2]; }
          var l = Math.hypot(nx, ny, nz) || 1; N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l;
          if (col) { C[o] = col[v * 3] / 255; C[o + 1] = col[v * 3 + 1] / 255; C[o + 2] = col[v * 3 + 2] / 255; }
          else { C[o] = br; C[o + 1] = bg; C[o + 2] = bb; }
          if (uv) { T[i * 6 + k * 2] = uv[v * 2] / 65535; T[i * 6 + k * 2 + 1] = uv[v * 2 + 1] / 65535; }
        }
      }
      buffer('p', P, 3); buffer('n', N, 3); buffer('c', C, 3); buffer('t', T, 2);
      count = nt * 3; meshReady = true; check();
    });

    /* Drehen: von selbst, und mit Ziehen von Hand */
    var angle = -0.5, tilt = 0.18, drag = null, idle = 0, last = 0, visible = true;
    canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, a: angle, t: tilt }; canvas.setPointerCapture(e.pointerId); canvas.classList.add('grab');
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      angle = drag.a + (e.clientX - drag.x) * 0.012;
      tilt = Math.max(-0.6, Math.min(0.8, drag.t + (e.clientY - drag.y) * 0.006));
    });
    function up() { if (drag) { drag = null; idle = performance.now(); canvas.classList.remove('grab'); } }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);

    function mul(a, b) {
      var o = new Float32Array(16), r, c, k;
      for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) { var s = 0; for (k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
      return o;
    }
    function frame(t) {
      requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (!meshReady || !texReady || !visible) return;
      if (!drag && t - idle > 1200) angle += dt * 0.55;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var f = 1 / Math.tan(0.30), asp = w / h, nr = 0.1, fr = 20;
      gl.uniformMatrix4fv(uPr, false, new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, 2 * fr * nr / (nr - fr), 0]));
      var ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(tilt), st = Math.sin(tilt);
      var ry = new Float32Array([ca, 0, -sa, 0, 0, 1, 0, 0, sa, 0, ca, 0, 0, 0, 0, 1]);
      var rx = new Float32Array([1, 0, 0, 0, 0, ct, st, 0, 0, -st, ct, 0, 0, 0, -3.6, 1]);
      gl.uniformMatrix4fv(uM, false, mul(rx, ry));
      gl.drawArrays(gl.TRIANGLES, 0, count);
    }
    requestAnimationFrame(frame);
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
          : !p.spielen
            ? '<button class="frame bild" type="button" id="mainImg" aria-label="Bild gross anzeigen"><img src="' + cover(p) + '" alt="' + esc(p.titel) + '"></button>'
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
    if (p.galerie) renderGalerie(p);
    var h1 = d.querySelector('h1');
    function fitTitle() {
      h1.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(h1).fontSize);
      while (h1.scrollWidth > h1.clientWidth + 1 && fs > 22) { fs -= 2; h1.style.fontSize = fs + 'px'; }
    }
    fitTitle(); window.addEventListener('resize', fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    var mainImg = document.getElementById('mainImg');
    if (mainImg) mainImg.addEventListener('click', function () { lightbox([{ src: cover(p), alt: p.titel }], 0); });
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
        turn(f.querySelector('.inner'), function () { f.setAttribute('aria-pressed', f.classList.toggle('flipped')); });
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
  document.querySelectorAll('.joker .face, .flip .front').forEach(function (el) {
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
