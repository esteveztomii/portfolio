/* Mejoras visuales y de reproducción sin tocar la lógica central */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console && console.warn) console.warn('[extra:' + name + ']', err); }
  }

  /* ---------- barra de progreso de lectura arriba ---------- */
  safe('progress', function () {
    var bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var doc = document.documentElement;
    var ticking = false;
    function update() {
      ticking = false;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var pct = Math.max(0, Math.min(100, (window.scrollY / max) * 100));
      bar.style.width = pct.toFixed(2) + '%';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

  /* ---------- resaltar enlace activo del menú según la sección visible ---------- */
  safe('scrollspy', function () {
    var links = $$('.site nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[sec.id] = a;
    });
    var secs = Object.keys(map).map(function (id) { return document.getElementById(id); });
    if (!secs.length) return;
    var current = null;
    function setActive(a) {
      if (current === a) return;
      links.forEach(function (x) { x.classList.remove('on'); });
      if (a) a.classList.add('on');
      current = a;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(map[e.target.id]);
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    secs.forEach(function (s) { io.observe(s); });
  });

  /* ---------- tarjetas de proyectos: inclinación leve + vista previa al pasar el mouse ---------- */
  safe('cards', function () {
    var cards = $$('.caso, .vg-item');
    cards.forEach(function (f) {
      if (!reduce) {
        f.addEventListener('pointermove', function (e) {
          var r = f.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          f.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
          f.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
        });
        f.addEventListener('pointerleave', function () {
          f.style.setProperty('--rx', '0deg');
          f.style.setProperty('--ry', '0deg');
        });
      }
      var v = $('video', f); if (!v) return;
      if (!v.classList.contains('vg-bg') && !v.classList.contains('vg-gif')) {
        f.addEventListener('pointerenter', function () {
          if (v.dataset.user) return;
          v.muted = true;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        });
        v.addEventListener('click', function () { v.dataset.user = '1'; });
        v.addEventListener('volumechange', function () { if (!v.muted) v.dataset.user = '1'; });
      }
    });
  });

  /* ---------- videos tipo GIF (final, símbolos y branding): reproducción continua en bucle ---------- */
  safe('gifVideos', function () {
    var gifVids = $$('video.vg-bg, video.fondo, video.vg-gif');
    gifVids.forEach(function (v) {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
    document.addEventListener('pointerdown', function () {
      gifVids.forEach(function (v) {
        if (!reduce && v.paused) {
          v.muted = true;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    }, { once: true });
  });

  /* ---------- videos de secciones (reels, edición, visuales, animación): inician desde 00:00 al entrar en pantalla ---------- */
  safe('sectionVideosStartAtZero', function () {
    var secVids = $$('video').filter(function (v) {
      return !v.classList.contains('vg-bg') && !v.classList.contains('fondo') && !v.classList.contains('vg-gif');
    });
    if (!secVids.length) return;

    function startFromZero(v) {
      if (reduce) return;
      try { v.currentTime = 0; } catch (e) {}
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    function resetAndPause(v) {
      if (v.dataset.userPlaying === '1') return;
      try { v.pause(); v.currentTime = 0; } catch (e) {}
    }

    secVids.forEach(function (v) {
      v.addEventListener('play', function () { v.dataset.userPlaying = '1'; });
      v.addEventListener('pause', function () {
        if (v.ended) {
          try { v.currentTime = 0; v.play(); } catch (e) {}
        }
      });
    });

    if ('IntersectionObserver' in window) {
      var vidIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) {
            startFromZero(v);
          } else {
            v.dataset.userPlaying = '0';
            resetAndPause(v);
          }
        });
      }, { threshold: 0.25 });

      secVids.forEach(function (v) { vidIo.observe(v); });
    } else {
      secVids.forEach(startFromZero);
    }
  });
})();
