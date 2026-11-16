/* Mascota 3D original — three.js r128. Interacción: ojos siguen el cursor, arrastrar para girar, clic/Enter para saltar. */
(function () {
  var box = document.getElementById('mascota');
  var msg = document.getElementById('mascota-msg');
  if (!box || !window.THREE) return;
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); }
  catch (e) { box.hidden = true; return; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  box.appendChild(renderer.domElement);
  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(35, 1, 0.1, 50);
  cam.position.set(0, 0.35, 8);
  scene.add(new T.HemisphereLight(0xffffff, 0xffc6ee, 0.95));
  var sun = new T.DirectionalLight(0xffffff, 0.75); sun.position.set(3, 5, 5); scene.add(sun);

  var M = function (c, r) { return new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.55 : r }); };
  var root = new T.Group(); scene.add(root);
  var body = new T.Group(); root.add(body);
  var add = function (g, m, x, y, z, parent) { var o = new T.Mesh(g, m); o.position.set(x, y, z); (parent || body).add(o); return o; };

  // cuerpo blob
  var blob = add(new T.SphereGeometry(1.2, 40, 32), M(0xfff4fb, 0.7), 0, 0, 0); blob.scale.set(1, 0.92, 0.95);
  // mejillas, boca
  [-1, 1].forEach(function (s) {
    var c = add(new T.SphereGeometry(0.2, 20, 16), M(0xff9ad5, 0.9), s * 0.78, -0.18, 0.88); c.scale.set(1, 0.6, 0.35); c.rotation.y = s * 0.5;
  });
  var mouth = add(new T.TorusGeometry(0.11, 0.028, 8, 20, Math.PI), M(0x5b2a4e), 0, -0.2, 1.1); mouth.rotation.z = Math.PI;
  // ojos (grupo que sigue al cursor)
  var eyes = new T.Group(); body.add(eyes);
  [-1, 1].forEach(function (s) {
    add(new T.SphereGeometry(0.15, 20, 16), M(0x1c1530, 0.3), s * 0.45, 0.12, 1.06, eyes);
    add(new T.SphereGeometry(0.05, 12, 10), M(0xffffff, 0.2), s * 0.45 + 0.05, 0.19, 1.19, eyes);
  });
  // auriculares
  var band = add(new T.TorusGeometry(1.32, 0.07, 12, 48, Math.PI), M(0x39d6c8, 0.4), 0, 0, 0); band.rotation.z = 0;
  [-1, 1].forEach(function (s) {
    var cup = add(new T.CylinderGeometry(0.36, 0.36, 0.22, 28), M(0xff6bff, 0.4), s * 1.3, 0, 0); cup.rotation.z = Math.PI / 2;
    var cap = add(new T.CylinderGeometry(0.2, 0.2, 0.05, 24), M(0xfff94a, 0.4), s * 1.42, 0, 0); cap.rotation.z = Math.PI / 2;
  });
  // antena con estrella
  function starGeo(r, ri) {
    var sh = new T.Shape(), i, a, rr;
    for (i = 0; i < 10; i++) { a = Math.PI / 2 + i * Math.PI / 5; rr = i % 2 ? ri : r; var x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    sh.closePath();
    var g = new T.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    g.center(); return g;
  }
  add(new T.CylinderGeometry(0.03, 0.03, 0.5, 8), M(0x39d6c8), 0, 1.35, 0);
  var star = add(starGeo(0.26, 0.12), M(0xfff94a, 0.35), 0, 1.78, 0);
  // patitas
  [-1, 1].forEach(function (s) { var f = add(new T.SphereGeometry(0.3, 16, 12), M(0xff9ad5, 0.8), s * 0.5, -1.05, 0.35); f.scale.set(1, 0.6, 1.2); });

  // partículas
  var parts = [], pg = [starGeo(0.12, 0.055), new T.SphereGeometry(0.07, 10, 8)], pc = [0xfff94a, 0xff6bff, 0x39d6c8, 0xff5a1f];
  function burst(n) {
    for (var i = 0; i < n; i++) {
      var m = new T.Mesh(pg[i % 2], M(pc[i % pc.length], 0.4));
      m.position.set((Math.random() - 0.5) * 0.8, 0.4, 0.8);
      scene.add(m);
      parts.push({ m: m, vx: (Math.random() - 0.5) * 0.09, vy: 0.05 + Math.random() * 0.06, life: 1 });
    }
  }

  // estado
  var px = 0, py = 0, spin = 0, spinV = 0, drag = false, moved = 0, lastX = 0, hover = false;
  var yv = 0, yo = 0, squash = 0, clicks = 0, t = 0;
  var lines = ['¡Hola! Soy la mascota del portfolio ✨', '¡Jiji! Eso hizo cosquillas', '¡Más estrellas!', 'Geek y cute, todo junto 💖', '¡Ahora hacé scroll y mirá mis proyectos!'];
  function say() { if (msg) msg.textContent = lines[clicks % lines.length]; }
  function jump() { if (yo > 0.02) return; yv = 0.17; squash = 1; burst(10); clicks++; say(); if (reduce) frame(); }

  var cv = renderer.domElement;
  cv.style.touchAction = 'pan-y';
  addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 400));
    py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 300));
    if (drag) { spinV = (e.clientX - lastX) * 0.012; spin += spinV; moved += Math.abs(e.clientX - lastX); lastX = e.clientX; }
  });
  cv.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
  addEventListener('pointerup', function () { if (drag && moved < 6) jump(); drag = false; });
  cv.addEventListener('pointerenter', function () { hover = true; });
  cv.addEventListener('pointerleave', function () { hover = false; });
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); } });

  function size() {
    var w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  function frame() {
    t += 0.016;
    if (!drag) { spinV *= 0.92; spin += spinV; spin *= 0.97; }          // vuelve a mirar al frente
    var tx = reduce ? 0 : px * 0.5, ty = reduce ? 0 : py * 0.25;
    root.rotation.y += (tx + spin - root.rotation.y) * 0.12;
    root.rotation.x += (ty - root.rotation.x) * 0.12;
    eyes.position.x += (px * 0.1 - eyes.position.x) * 0.2;
    eyes.position.y += (-py * 0.06 - eyes.position.y) * 0.2;
    // salto
    if (yo > 0 || yv > 0) { yo += yv; yv -= 0.011; if (yo <= 0) { yo = 0; yv = 0; squash = -0.8; } }
    squash *= 0.88;
    var bob = reduce ? 0 : Math.sin(t * 2) * 0.05;
    var hv = hover ? 0.05 : 0;
    root.position.y = yo + bob;
    body.scale.set(1 + squash * 0.18 + hv, 1 - squash * 0.2 - hv * 0.6, 1 + squash * 0.18 + hv);
    star.rotation.y += reduce ? 0 : 0.04;
    star.position.y = 1.78 + (reduce ? 0 : Math.sin(t * 3) * 0.05);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= 0.02; p.vy -= 0.0015;
      p.m.position.x += p.vx; p.m.position.y += p.vy; p.m.rotation.y += 0.1;
      p.m.scale.setScalar(Math.max(p.life, 0.01));
      if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
    }
    renderer.render(scene, cam);
  }

  var visible = true, raf;
  function loop() { if (visible) frame(); raf = requestAnimationFrame(loop); }
  if (reduce) { frame(); addEventListener('resize', frame); }
  else {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(box);
    loop();
  }
})();
