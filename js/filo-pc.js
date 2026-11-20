/* FILO NEWS · mini computadora 3D: gira y recorre el mockup mientras scrolleás.
   Editá los números de update() para cambiar cuánto gira, cuándo empieza a deslizarse el mockup, etc. */
(function () {
  'use strict';
  var sc = document.getElementById('pc-scroll'); if (!sc) return;
  var pc = sc.querySelector('.pc-3d'), view = sc.querySelector('.pc-view'), img = view.querySelector('img'), stage = sc.querySelector('.pc-stage');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sc.classList.add('pc-reduce'); pc.style.transform = 'rotateX(-4deg) rotateY(-14deg)'; return; } // sin animación: pantalla con scroll propio
  var raf = 0;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function update() {
    raf = 0;
    var r = sc.getBoundingClientRect(), span = r.height - stage.offsetHeight, p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    var spin = ease(p / .3),             // 0 → 30 %: la computadora da media vuelta y queda de frente
        q = ease((p - .28) / .58),       // 28 → 86 %: el mockup se desliza dentro de la pantalla
        out = ease((p - .88) / .12);     // 88 → 100 %: se gira un poco para despedirse
    var ry = -(1 - spin) * 210 + Math.sin(q * Math.PI * 2) * 7 + out * 24, rx = -5 + (1 - spin) * 14 - out * 6, s = .78 + .22 * spin;
    pc.style.transform = 'scale(' + s.toFixed(3) + ') rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    var pan = Math.max(0, img.offsetHeight - view.clientHeight);
    img.style.transform = 'translate3d(0,' + (-q * pan).toFixed(1) + 'px,0)';
  }
  function req() { if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); img.addEventListener('load', req); req();
})();
