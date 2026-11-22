/* FILO NEWS · mini computadora 3D dentro de la ventana: entra, se centra de frente sin doblarse al costado y muestra todo el mockup. */
(function () {
  'use strict';
  var box = document.getElementById('pc-scroll'); if (!box) return;
  var pc = box.querySelector('.pc-3d'), view = box.querySelector('.pc-view'), img = view.querySelector('img');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pc.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)';
    view.style.overflow = 'auto';
    img.style.position = 'static';
    img.style.width = '100%';
    img.style.height = 'auto';
    return;
  }
  var raf = 0, vis = true;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  function fitMockup() {
    img.style.position = 'relative';
    img.style.left = '0';
    img.style.top = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.transform = 'translate3d(0,0,0)';
  }

  function update() {
    raf = 0;
    if (!vis) return;
    fitMockup();
    var r = box.getBoundingClientRect(), vh = innerHeight;
    var p = clamp((vh * .92 - r.top) / (vh * .92 - vh * .25 + r.height * .25), 0, 1);
    var settled = ease(clamp(p / .55, 0, 1));
    // Al bajar, se queda recta y centrada de frente (0deg) sin seguir girando ni doblarse al costado
    var ry = -(1 - settled) * 140;
    var rx = (1 - settled) * 6;
    var s = .85 + .15 * settled;
    pc.style.transform = 'scale(' + s.toFixed(3) + ') rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }

  function req() { if (vis && !raf) raf = requestAnimationFrame(update); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      vis = en[0].isIntersecting;
      if (vis) req();
    }, { rootMargin: '150px 0px 150px 0px' }).observe(box);
  }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  img.addEventListener('load', req);
  req();
})();
