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

    /* ── 2) Cursor: Standard-Browser-Zeiger ── */

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

    /* ── 5) BASEL Easter Egg — tippe B-A-S-E-L ── */
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
