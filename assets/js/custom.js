/* ═══════════════════════════════════════════════════════════
   custom.js — Iteration 1 + 2
   Scroll-Progress, Custom Cursor, Reveal-on-Scroll,
   Counter, BASEL Easter Egg
   ═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── 0) Nav-Reparatur: HTML5UP Massively verschiebt auf Mobile
       <ul class="links"> aus #nav in das #navPanel. Wir wollen unser
       Pill-Nav aber überall sichtbar — also zurückholen. ── */
    function restoreNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        if (nav.querySelector('ul.links')) return; // schon drin
        var panelLinks = document.querySelector('#navPanel ul.links');
        if (panelLinks) {
            nav.appendChild(panelLinks.cloneNode(true));
        }
    }
    restoreNav();
    // Falls Template den Move später nochmal macht (bei Resize), nachfassen
    window.addEventListener('resize', function () {
        clearTimeout(window.__navRestoreT);
        window.__navRestoreT = setTimeout(restoreNav, 100);
    });

    /* ── 1) Scroll-Progress-Linie ── */
    var progress = document.createElement('div');
    progress.id = 'scroll-progress';
    document.body.appendChild(progress);

    function updateProgress() {
        var h = document.documentElement;
        var scrolled = h.scrollTop;
        var max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? (scrolled / max) * 100 : 0;
        progress.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    /* ── 2) Custom Cursor — Schraubenzieher PNG ── */
    /* STELLSCHRAUBE: Grösse in px hier ändern.
       Gleicher Wert wie --cursor-size in custom.css setzen. */
    var CURSOR_SIZE = 82;

    var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (hasFinePointer) {
        /* Klasse sofort setzen → cursor:none gilt ab dem ersten JS-Tick */
        document.documentElement.classList.add('has-custom-cursor');

        var cur = document.createElement('img');
        cur.id  = 'cursor-screwdriver';
        cur.src = 'images/cursor-screwdriver.png';
        cur.alt = '';
        document.body.appendChild(cur);

        /* offX = halbe gerenderte Breite, damit Spitze mittig auf Mausposition liegt */
        var offX = Math.round(CURSOR_SIZE / 2); // Näherung bis load-Event
        cur.addEventListener('load', function () {
            offX = Math.round(cur.offsetWidth / 2);
        });

        function moveCursor(x, y) {
            cur.classList.add('is-visible');
            cur.style.transform =
                'translate(' + (x - offX) + 'px, ' + y + 'px) rotate(-22deg)';
        }

        document.addEventListener('mousemove', function (e) {
            /* elementFromPoint gibt <iframe> zurück wenn Cursor am Rand oder
               innerhalb eines cross-origin iframes liegt — auch bei langsamer
               Bewegung wo mousemove nach mouseenter noch kurz weiterläuft. */
            var el = document.elementFromPoint(e.clientX, e.clientY);
            if (el && el.tagName === 'IFRAME') {
                document.documentElement.classList.add('over-iframe');
                cur.classList.remove('is-visible');
                return;
            }
            /* mousemove feuert nur ausserhalb von cross-origin iframes →
               wenn wir hier ankommen, sind wir garantiert nicht im iframe.
               over-iframe entfernen, damit der rAF-Loop keine false positives
               (z.B. durch scale(1.012)-Hover) den Cursor dauerhaft verstecken. */
            document.documentElement.classList.remove('over-iframe');
            moveCursor(e.clientX, e.clientY);
        });

        /* mousedown: Position auch bei Klick ohne Bewegung aktualisieren */
        document.addEventListener('mousedown', function (e) {
            moveCursor(e.clientX, e.clientY);
        });

        /* Ausblenden wenn Maus das Fenster verlässt */
        document.addEventListener('mouseleave', function () {
            cur.classList.remove('is-visible');
        });
    }

    /* ── 3) Reveal-on-Scroll für Artikel ── */
    var articles = document.querySelectorAll('.posts > article');
    if ('IntersectionObserver' in window && articles.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        articles.forEach(function (a) { io.observe(a); });
    } else {
        articles.forEach(function (a) { a.classList.add('is-revealed'); });
    }

    /* ── 4) Gesamtzahl Projekte für CSS-Counter ── */
    if (articles.length) {
        var total = String(articles.length).padStart(2, '0');
        document.documentElement.style.setProperty('--total-projects', '"' + total + '"');
    }

    /* ── 5) Screw Pins — Schraube erscheint wenn man aus der Kachel herauszieht ── */
    (function screwPins() {
        if (!window.matchMedia('(pointer: fine)').matches) return;

        var imageFits = document.querySelectorAll('.posts article .image.fit');
        if (!imageFits.length) return;

        /* ── STELLSCHRAUBEN ──────────────────────────────────────────── */
        var SCREW_SIZE    = 52;  /* Breite der Schraube in Pixel          */
        var EXIT_DISTANCE = 43;  /* px ausserhalb Kachelrand → Schraube fixiert */
        /* ───────────────────────────────────────────────────────────── */

        /* Letzte bekannte Cursorposition — wird vom rAF-Loop gebraucht */
        var lastKnownX = -9999, lastKnownY = -9999;

        /* Easter-Egg-Zähler: jede Kante braucht ≥1 fixierte Schraube */
        var fixedEdgeCounts    = { top: 0, bottom: 0, left: 0, right: 0 };
        var easterEggTriggered = false;

        /* "You Fixed It!"-Sign vorbereiten */
        var fixedSign = document.createElement('div');
        fixedSign.id  = 'fixed-sign';
        fixedSign.innerHTML = '🔧 You Fixed It!<span class="sign-sub">all screws tightened</span>';
        document.body.appendChild(fixedSign);

        var pins = [];

        imageFits.forEach(function (wrap) {
            var iframe = wrap.querySelector('iframe');
            if (!iframe) return;

            var pin = {
                iframe: iframe, wrap: wrap,
                exitEdge: null,
                exitBorderX: 0, exitBorderY: 0,
                exitRefClientX: 0, exitRefClientY: 0
            };
            pins.push(pin);

            /* Cursor betritt iframe → YouTube-Hand, is-visible entfernen damit
               der Schraubenzieher nach dem Verlassen erst bei echter Bewegung
               wieder auftaucht (verhindert "hängen" an der Unterkante) */
            iframe.addEventListener('mouseenter', function () {
                document.documentElement.classList.add('over-iframe');
                if (typeof cur !== 'undefined' && cur) cur.classList.remove('is-visible');
                pins.forEach(function (p) { p.exitEdge = null; });
            });

            /* Cursor verlässt iframe → Exit-Kante + Grenzpunkt merken */
            iframe.addEventListener('mouseleave', function (e) {
                /* Position updaten damit der rAF-Loop nicht sofort wieder
                   "inside" erkennt (Cursor ist jetzt am Austrittsrand) */
                lastKnownX = e.clientX;
                lastKnownY = e.clientY;
                /* Kein moveCursor-Aufruf hier: Cursor wird erst beim nächsten
                   echten mousemove sichtbar → kein Hängen am Austrittsrand */
                document.documentElement.classList.remove('over-iframe');

                var r  = iframe.getBoundingClientRect();
                var rx = e.clientX - r.left;
                var ry = e.clientY - r.top;

                var dTop    = Math.abs(ry);
                var dBottom = Math.abs(ry - r.height);
                var dLeft   = Math.abs(rx);
                var dRight  = Math.abs(rx - r.width);
                var minD    = Math.min(dTop, dBottom, dLeft, dRight);

                var edge;
                if      (minD === dTop)    edge = 'top';
                else if (minD === dBottom) edge = 'bottom';
                else if (minD === dLeft)   edge = 'left';
                else                       edge = 'right';

                pin.exitEdge    = edge;
                pin.exitBorderX = Math.max(0, Math.min(r.width,  rx));
                pin.exitBorderY = Math.max(0, Math.min(r.height, ry));

                /* Referenzpunkt = exakter Kachelrand (für Distanz-Messung) */
                switch (edge) {
                    case 'top':    pin.exitRefClientY = r.top;            break;
                    case 'bottom': pin.exitRefClientY = r.top + r.height; break;
                    case 'left':   pin.exitRefClientX = r.left;           break;
                    case 'right':  pin.exitRefClientX = r.left + r.width; break;
                }
            });
        });

        /* ── rAF Bounds-Check ─────────────────────────────────────────
           Problem: article:hover hat transform:scale(1.012). Das lässt
           den iframe von seiner Mitte aus wachsen → Unterkante wandert
           Richtung Cursor. mouseenter feuert aber nur bei Cursorbewegung,
           nicht wenn das Element ZUM Cursor kommt.
           Fix: solange Cursor über einem Artikel ist, jeden Frame prüfen
           ob die (durch scale verschobene) iframe-BoundingBox den Cursor
           jetzt einschliesst. ──────────────────────────────────────── */
        var rafBoundsId  = null;
        var isScrolling  = false;
        var scrollEndTimer;

        function startBoundsCheck() {
            if (rafBoundsId) return;
            (function tick() {
                /* Während Scroll: rAF-Erkennung aussetzen damit iframes die am
                   Cursor vorbeiscrollen nicht fälschlicherweise over-iframe setzen */
                if (!isScrolling && lastKnownX >= 0 &&
                    !document.documentElement.classList.contains('over-iframe')) {
                    var inside = pins.some(function (p) {
                        var r = p.iframe.getBoundingClientRect();
                        return lastKnownX > r.left && lastKnownX < r.right &&
                               lastKnownY > r.top  && lastKnownY < r.bottom;
                    });
                    if (inside) {
                        document.documentElement.classList.add('over-iframe');
                        if (typeof cur !== 'undefined' && cur) cur.classList.remove('is-visible');
                    }
                }
                rafBoundsId = requestAnimationFrame(tick);
            })();
        }

        function stopBoundsCheck() {
            if (rafBoundsId) { cancelAnimationFrame(rafBoundsId); rafBoundsId = null; }
        }

        document.querySelectorAll('.posts article').forEach(function (article) {
            article.addEventListener('mouseenter', startBoundsCheck);
            article.addEventListener('mouseleave', stopBoundsCheck);
        });

        /* Scroll: Exit-Tracking abbrechen + rAF pausieren.
           Falls over-iframe durch den rAF gesetzt wurde bevor Scroll begann,
           hier sofort zurücksetzen — sonst bleibt Cursor bis zur nächsten
           Mausbewegung unsichtbar. */
        window.addEventListener('scroll', function () {
            pins.forEach(function (p) { p.exitEdge = null; });
            isScrolling = true;
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(function () { isScrolling = false; }, 200);
            if (document.documentElement.classList.contains('over-iframe')) {
                document.documentElement.classList.remove('over-iframe');
                /* Prüfen ob Cursor noch physisch über einem iframe liegt.
                   Wenn ja → Schraubenzieher bleibt weg (verhindert Flash).
                   Wenn nein → Schraubenzieher wieder zeigen (iframe hat weggescrollt). */
                var hit = (lastKnownX >= 0 && lastKnownY >= 0)
                    ? document.elementFromPoint(lastKnownX, lastKnownY)
                    : null;
                if ((!hit || hit.tagName !== 'IFRAME') && typeof cur !== 'undefined' && cur) {
                    cur.classList.add('is-visible');
                }
            }
        }, { passive: true });

        /* ── Permanente Schraube am Exit-Punkt platzieren ── */
        function placeScrew(pin) {
            var el       = document.createElement('img');
            el.className = 'screw-pin screw-pin--fixed';
            el.src       = 'images/screw.png';
            el.alt       = '';
            el.style.width   = SCREW_SIZE + 'px';
            el.style.opacity = '1';
            applyEdgeStyle(el, pin.exitEdge, pin.exitBorderX, pin.exitBorderY);
            pin.wrap.appendChild(el);

            fixedEdgeCounts[pin.exitEdge]++;
            pin.exitEdge = null;
            checkEasterEgg();
        }

        function applyEdgeStyle(el, edge, cx, cy) {
            el.style.top = el.style.bottom = el.style.left = el.style.right = '';
            switch (edge) {
                case 'top':
                    el.style.left      = cx + 'px';
                    el.style.top       = '0';
                    el.style.transform = 'translateX(-50%) translateY(-100%)';
                    break;
                case 'bottom':
                    el.style.left      = cx + 'px';
                    el.style.bottom    = '0';
                    el.style.transform = 'translateX(-50%) rotate(180deg)';
                    break;
                case 'left':
                    el.style.left      = '0';
                    el.style.top       = cy + 'px';
                    el.style.transform = 'translateX(-50%) translateY(-100%) rotate(-90deg)';
                    break;
                case 'right':
                    el.style.right     = '0';
                    el.style.top       = cy + 'px';
                    el.style.transform = 'translateX(50%) translateY(-100%) rotate(90deg)';
                    break;
            }
        }

        /* ── Mousemove: Position tracken + Exit-Distanz messen ── */
        document.addEventListener('mousemove', function (e) {
            lastKnownX = e.clientX;
            lastKnownY = e.clientY;
            pins.forEach(function (pin) {
                if (!pin.exitEdge) return;

                var dist;
                switch (pin.exitEdge) {
                    case 'top':    dist = pin.exitRefClientY - e.clientY; break;
                    case 'bottom': dist = e.clientY - pin.exitRefClientY; break;
                    case 'left':   dist = pin.exitRefClientX - e.clientX; break;
                    case 'right':  dist = e.clientX - pin.exitRefClientX; break;
                }

                if      (dist >= EXIT_DISTANCE) { placeScrew(pin); }
                else if (dist < 0)              { pin.exitEdge = null; }
            });
        }, { passive: true });

        function checkEasterEgg() {
            if (easterEggTriggered) return;
            if (fixedEdgeCounts.top > 0 && fixedEdgeCounts.bottom > 0 &&
                fixedEdgeCounts.left > 0 && fixedEdgeCounts.right > 0) {
                easterEggTriggered = true;
                triggerFixedEasterEgg();
            }
        }

        function triggerFixedEasterEgg() {
            fixedSign.classList.add('show');
            launchConfetti();
            setTimeout(function () { fixedSign.classList.remove('show'); }, 4500);
        }

        function launchConfetti() {
            var colors = ['#d9c19a', '#e8d5b0', '#c8a96e', '#f0e68c', '#fff8e1', '#b8966a'];
            for (var i = 0; i < 90; i++) {
                (function (delay) {
                    setTimeout(function () {
                        var c       = document.createElement('div');
                        c.className = 'confetti-piece';
                        c.style.left              = (Math.random() * 100) + 'vw';
                        c.style.background        = colors[Math.floor(Math.random() * colors.length)];
                        c.style.width             = (Math.random() * 6 + 5) + 'px';
                        c.style.height            = (Math.random() * 5 + 4) + 'px';
                        c.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
                        document.body.appendChild(c);
                        setTimeout(function () {
                            if (c.parentNode) c.parentNode.removeChild(c);
                        }, 5500);
                    }, delay);
                })(i * 28);
            }
        }
    })();

    /* ── 6) BASEL Easter Egg — tippe B-A-S-E-L ── */
    (function baselEgg() {
        var sequence = 'BASEL';
        var idx = 0;
        // Toast-Element vorbereiten
        var toast = document.createElement('div');
        toast.id = 'basel-toast';
        toast.innerHTML = 'Made <span class="heart">&#10084;</span> in Basel';
        document.body.appendChild(toast);

        document.addEventListener('keydown', function (e) {
            // Ignoriere wenn Eingabefeld fokussiert
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

            var k = (e.key || '').toUpperCase();
            if (k === sequence[idx]) {
                idx++;
                if (idx === sequence.length) {
                    idx = 0;
                    triggerBasel();
                }
            } else {
                idx = (k === sequence[0]) ? 1 : 0;
            }
        });

        function triggerBasel() {
            document.body.classList.add('basel-flash');
            toast.classList.add('show');
            setTimeout(function () { toast.classList.remove('show'); }, 2200);
            setTimeout(function () { document.body.classList.remove('basel-flash'); }, 1500);
        }
    })();
})();
