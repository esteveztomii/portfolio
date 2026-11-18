/* HERO · Nintendo 3DS con el villager (three.js r128 + GLTFLoader). Editá SEC para cambiar los textos. */
(function () {
  'use strict';
  var root = document.getElementById('home'), el = document.getElementById('visor');
  if (!root || !el || !window.THREE || !THREE.GLTFLoader) { if (root) root.classList.add('no3d'); return; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, sr = document.getElementById('gb-sr'), loadMsg = document.getElementById('gb-load');
  var SEC = [
    { k: 'Sobre mí', id: 'sobre-mi', t: 'Estudiante de Diseño Multimedial en la UNLP, dando mis primeros pasos en proyectos digitales. Edición de video, motion graphics y diseño.' },
    { k: 'Educación', id: 'educacion', t: 'Licenciatura en Diseño Multimedial, Facultad de Artes, UNLP (2023 a la actualidad). Photoshop, Figma, Illustrator, Canva, After Effects y CapCut.' },
    { k: 'Proyectos', id: 'proyectos', t: 'Rediseño Filo News (UI/UX), Vagari (identidad y experiencia VR), edición de video y reels, y animación.' },
    { k: 'Contacto', id: 'contacto', t: 'Disponible para proyectos. esteveztomii@gmail.com · +54 9 11 3564-1671' }];
  var R;
  try { R = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { root.classList.add('no3d'); if (loadMsg) loadMsg.textContent = 'Tu navegador no pudo abrir la 3DS. Usá los botones de arriba.'; return; }
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.outputEncoding = THREE.sRGBEncoding; el.appendChild(R.domElement);
  var S = new THREE.Scene(), C = new THREE.PerspectiveCamera(34, 1, .1, 200);
  S.add(new THREE.AmbientLight(0xffffff, .6)); var dl = new THREE.DirectionalLight(0xffffff, .65); dl.position.set(6, 14, 10); S.add(dl);
  var BODY = new THREE.MeshStandardMaterial({ color: 0x5ec4e6, roughness: .45 }), DARK = new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: .3 }), CREAM = new THREE.MeshStandardMaterial({ color: 0xf3ecd8, roughness: .5 });
  function rbox(w, h, d, r, mat) {
    var s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    var g = new THREE.ExtrudeGeometry(s, { depth: h - .3, bevelEnabled: true, bevelThickness: .15, bevelSize: .15, bevelSegments: 3, curveSegments: 8 }); g.rotateX(Math.PI / 2); g.translate(0, h / 2 - .15, 0); return new THREE.Mesh(g, mat);
  }
  function cyl(r, h, mat, x, y, z) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat); m.position.set(x, y, z); return m; }
  var con = new THREE.Group(); S.add(con);
  con.add(rbox(13.5, .9, 7.4, .9, BODY));
  var hinge = new THREE.Group(); hinge.position.set(0, .8, -3.5); con.add(hinge);
  var hc = cyl(.45, 7, BODY, 0, 0, 0); hc.rotation.z = Math.PI / 2; hinge.add(hc);
  var topg = new THREE.Group(); topg.rotation.x = -1.92; hinge.add(topg);
  var shell = rbox(13.5, .7, 7.4, .9, BODY); shell.position.set(0, 0, 3.7); topg.add(shell);
  var tb = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.3), DARK); tb.rotation.x = Math.PI / 2; tb.position.set(0, -.37, 3.7); topg.add(tb);
  var rt = new THREE.WebGLRenderTarget(800, 480, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); rt.texture.encoding = THREE.sRGBEncoding;
  var ts = new THREE.Mesh(new THREE.PlaneGeometry(7.7, 4.6), new THREE.MeshBasicMaterial({ map: rt.texture })); ts.rotation.x = Math.PI / 2; ts.position.set(0, -.38, 3.7); topg.add(ts);
  [-.8, 0, .8].forEach(function (x) { topg.add(cyl(.12, .05, DARK, x, -.37, .9)); });
  var bb = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 5.3), DARK); bb.rotation.x = -Math.PI / 2; bb.position.set(0, .47, 0); con.add(bb);
  var uc = document.createElement('canvas'); uc.width = 960; uc.height = 720; var ux = uc.getContext('2d');
  var ut = new THREE.CanvasTexture(uc); ut.encoding = THREE.sRGBEncoding; ut.magFilter = THREE.NearestFilter; ut.anisotropy = 4;
  var bs = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 4.6), new THREE.MeshBasicMaterial({ map: ut })); bs.rotation.x = -Math.PI / 2; bs.position.set(0, .48, 0); con.add(bs);
  con.add(cyl(.75, .25, CREAM, -5.2, .55, -1.2)); con.add(cyl(.5, .1, DARK, -5.2, .7, -1.2));
  var dp = new THREE.Group(); dp.position.set(-5.2, .5, 1.5); [[1.4, .4], [.4, 1.4]].forEach(function (a) { dp.add(new THREE.Mesh(new THREE.BoxGeometry(a[0], .25, a[1]), CREAM)); }); con.add(dp);
  [[5.2, -1.9], [5.9, -1.1], [4.5, -1.1], [5.2, -.3]].forEach(function (p) { con.add(cyl(.32, .22, CREAM, p[0], .52, p[1])); });
  [[4.5, 1.7], [5.2, 1.7], [5.9, 1.7]].forEach(function (p) { con.add(cyl(.2, .16, CREAM, p[0], .5, p[1])); });
  con.add(cyl(.28, .16, CREAM, 0, .5, 3.05));
  /* ---- pantalla superior: villager ---- */
  var VS = new THREE.Scene(), VC = new THREE.PerspectiveCamera(30, 5 / 3, .1, 50); VC.position.set(0, .6, 2.35); VC.lookAt(0, .5, 0);
  (function () { var g = document.createElement('canvas'); g.width = 2; g.height = 256; var x = g.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#8fd3ff'); gr.addColorStop(.62, '#d9f3ff'); gr.addColorStop(.63, '#9fd66b'); gr.addColorStop(1, '#78bb4f'); x.fillStyle = gr; x.fillRect(0, 0, 2, 256); var t = new THREE.CanvasTexture(g); t.encoding = THREE.sRGBEncoding; VS.background = t; })();
  VS.add(new THREE.AmbientLight(0xffffff, .95)); var vl = new THREE.DirectionalLight(0xffffff, .7); vl.position.set(1, 2, 3); VS.add(vl);
  var arm = {}, body = null, jy = 0, jv = 0;
  new THREE.GLTFLoader().load('assets/villager.glb', function (g) {
    body = new THREE.Group(); VS.add(body); var nodes = {}; g.scene.traverse(function (o) { if (o.isMesh) nodes[o.name] = o; });
    var px = 5 / 21, py = 10.1 / 21;
    Object.keys(nodes).forEach(function (n) {
      var m = nodes[n];
      if (/^(arm|hand)[LR]$/.test(n)) { var s = n.slice(-1); if (!arm[s]) { arm[s] = new THREE.Group(); arm[s].position.set(s === 'L' ? -px : px, py, 0); body.add(arm[s]); }
        var hold = new THREE.Group(); hold.add(m); hold.position.set(s === 'L' ? px : -px, -py, 0); arm[s].add(hold); } else body.add(m);
    });
    if (loadMsg) loadMsg.hidden = true; dirty = true;
  }, undefined, function () { if (loadMsg) loadMsg.textContent = 'No se pudo cargar el villager. Usá los botones de arriba.'; });
  /* ---- pantalla táctil ---- */
  var st = { s: 'home', i: 0, n: 0, heart: false }, dirty = true, W = 320, H = 240;
  var P = { cream: '#fff8e5', line: '#c9a090', ink: '#5a3a2a', red: '#e8605a', cyan: '#29c5f6', org: '#ff8c4a', yel: '#ffe45e', grn: '#6bbf3a' };
  function F(x, y, w, h, c) { ux.fillStyle = c; ux.fillRect(x * 3, y * 3, w * 3, h * 3); }
  function T(s, x, y, sz, c, al) { ux.font = (sz * 3.4) + 'px VT323, monospace'; ux.fillStyle = c; ux.textAlign = al || 'left'; ux.textBaseline = 'top'; ux.fillText(s, x * 3, y * 3); }
  function box(x, y, w, h, fill) { F(x - 1, y - 1, w + 2, h + 2, P.line); F(x, y, w, h, fill); }
  function wrap(t, mw, sz) { ux.font = (sz * 3.4) + 'px VT323, monospace'; var out = [], l = ''; t.split(' ').forEach(function (w) { var tt = l ? l + ' ' + w : w; if (ux.measureText(tt).width > mw * 3 && l) { out.push(l); l = w; } else l = tt; }); out.push(l); return out; }
  function face(x, y, s, bg) { F(x, y, s, s, '#111'); F(x + 1, y + 1, s - 2, s - 2, bg); var u = s / 16; F(x + 3 * u, y + 3 * u, 10 * u, 4 * u, '#4a2f14'); F(x + 3 * u, y + 6 * u, 10 * u, 6 * u, '#f1d3a6'); F(x + 5 * u, y + 8 * u, 2 * u, u, '#4a2f14'); F(x + 9 * u, y + 8 * u, 2 * u, u, '#4a2f14'); F(x + 7 * u, y + 10 * u, 2 * u, u, '#c0392b'); F(x + 4 * u, y + 12 * u, 8 * u, 3 * u, P.red); }
  var HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  function icon(k, x, y) {
    var cx = x + 15, cy = y + 15;
    if (k === 0) { var c = st.heart ? P.red : '#e9a9a5'; HEART.forEach(function (r, j) { for (var i = 0; i < 7; i++) if (r[i] === 'X') F(cx - 10.5 + i * 3, cy - 9 + j * 3, 3, 3, c); }); }
    else if (k === 1) { ux.fillStyle = P.red; ux.beginPath(); ux.moveTo((cx - 5) * 3, (cy - 8) * 3); ux.lineTo((cx + 8) * 3, cy * 3); ux.lineTo((cx - 5) * 3, (cy + 8) * 3); ux.fill(); }
    else if (k === 2) T(':)', cx, cy - 7, 11, P.red, 'center');
    else { ux.strokeStyle = P.red; ux.lineWidth = 12; ux.beginPath(); ux.moveTo((cx - 7) * 3, (cy - 7) * 3); ux.lineTo((cx + 7) * 3, (cy + 7) * 3); ux.moveTo((cx + 7) * 3, (cy - 7) * 3); ux.lineTo((cx - 7) * 3, (cy + 7) * 3); ux.stroke(); }
  }
  function draw() {
    if (st.s === 'home') {
      F(0, 0, W, H, P.yel);
      for (var y = 0; y < H; y += 24) for (var x = 0; x < W; x += 24) { var ox = (y / 24) % 2 ? 12 : 0; F(x + ox + 4, y + 8, 4, 4, '#f7a8c4'); F(x + ox + 5, y + 7, 2, 6, '#f7a8c4'); F(x + ox + 3, y + 9, 6, 2, '#f7a8c4'); }
      box(14, 8, 292, 28, P.cream); T('Tomás Estévez', 24, 9, 13, P.ink); T('Diseñador Multimedial', 24, 24, 9, P.line);
      SEC.forEach(function (s, i) { var bx = 16 + (i % 2) * 148, by = 46 + Math.floor(i / 2) * 90; box(bx, by, 140, 80, P.cream); F(bx + 4, by + 4, 132, 8, ['#ffb3c6', '#a9e0ff', '#c3f0a4', '#ffd27a'][i]); F(bx + 50, by + 22, 40, 30, ['#e8605a', '#29c5f6', '#6bbf3a', '#ff8c4a'][i]); T(s.k, bx + 70, by + 56, 13, P.ink, 'center'); });
    } else {
      var s = SEC[st.i]; F(0, 0, W, H, P.yel); box(8, 6, 304, 228, P.cream); box(16, 14, 204, 130, '#fff');
      wrap(s.t.slice(0, st.n), 192, 11).forEach(function (l, k) { T(l, 22, 18 + k * 13, 11, P.ink); });
      box(230, 14, 70, 64, P.cyan); face(236, 20, 52, P.cyan);
      for (var k = 0; k < 4; k++) { var bx = 232 + (k % 2) * 35, by = 86 + Math.floor(k / 2) * 34; box(bx, by, 31, 30, '#f6e7df'); icon(k, bx, by); }
      box(16, 152, 56, 56, P.org); face(20, 156, 48, P.org); box(80, 152, 222, 56, '#fff4dc'); T(s.k, 90, 158, 16, P.ink); box(90, 182, 130, 20, P.grn); T('Ir a la sección', 155, 183, 13, '#fff', 'center');
    }
    ut.needsUpdate = true;
  }
  function say(t) { if (sr) sr.textContent = t; }
  function go(i) { var t = document.getElementById(SEC[i].id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  function open(i) { st.s = 'win'; st.i = i; st.n = reduce ? 999 : 0; dirty = true; say(SEC[i].k + '. ' + SEC[i].t); }
  function tap(x, y) {
    if (st.s === 'home') { SEC.forEach(function (s, i) { var bx = 16 + (i % 2) * 148, by = 46 + Math.floor(i / 2) * 90; if (x > bx && x < bx + 140 && y > by && y < by + 80) open(i); }); return; }
    if (x > 80 && x < 302 && y > 152 && y < 208) { go(st.i); return; }
    [[232, 86, 0], [267, 86, 1], [232, 120, 2], [267, 120, 3]].forEach(function (b) {
      if (x > b[0] && x < b[0] + 31 && y > b[1] && y < b[1] + 30) { if (b[2] === 3) { st.s = 'home'; say('Menú'); } else if (b[2] === 0) st.heart = !st.heart; else if (b[2] === 1) go(st.i); else if (!jy) jv = .045; dirty = true; }
    });
  }
  var rc = new THREE.Raycaster(), mp = new THREE.Vector2(), d0 = null, drag = false, yaw = 0, tyaw = 0;
  el.addEventListener('pointerdown', function (e) { d0 = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX }; drag = false; });
  addEventListener('pointermove', function (e) { if (!d0) return; if (!drag && Math.abs(e.clientX - d0.x) > 7) { drag = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} } if (drag) { tyaw = Math.max(-1, Math.min(1, tyaw + (e.clientX - d0.lx) * .008)); d0.lx = e.clientX; } });
  addEventListener('pointerup', function (e) {
    if (!d0) return; var b = el.getBoundingClientRect(), moved = Math.hypot(e.clientX - d0.x, e.clientY - d0.y);
    if (!drag && moved < 8 && performance.now() - d0.t < 600) { mp.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); rc.setFromCamera(mp, C); var h = rc.intersectObject(bs)[0]; if (h) tap(h.uv.x * W, (1 - h.uv.y) * H); }
    d0 = null; drag = false;
  });
  addEventListener('pointercancel', function () { d0 = null; drag = false; });
  el.addEventListener('keydown', function (e) {
    if (e.key >= '1' && e.key <= '4') open(+e.key - 1);
    else if (e.key === 'Enter' && st.s === 'win') go(st.i);
    else if (e.key === 'Escape' || e.key === 'Backspace') { st.s = 'home'; dirty = true; say('Menú'); }
  });
  if (document.fonts && document.fonts.load) document.fonts.load('20px VT323').then(function () { dirty = true; });
  /* ---- tamaño ---- */
  function size() {
    var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix();
    var t = Math.tan(17 * Math.PI / 180), d = Math.max(10.4 / (2 * t), 14.6 / (2 * t * C.aspect)); C.position.set(0, 8.6, d); C.lookAt(0, 3.9, 0);
  }
  addEventListener('resize', size); size(); if (window.ResizeObserver) new ResizeObserver(size).observe(el);
  var vis = true; if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(el);
  var t0 = performance.now(), lastTy = 0;
  (function loop(now) {
    requestAnimationFrame(loop); if (!vis || document.hidden) return;
    var t = (now - t0) / 1000;
    var p = reduce ? .4 : (1 - Math.cos(t * 2 * Math.PI / 6.5)) / 2;
    if (arm.L) { var a = -.5 + 3.05 * p; arm.L.rotation.z = -a; arm.R.rotation.z = a; }
    if (body) {
      body.scale.set(1 + .03 * p, 1 + .025 * p, 1 + .03 * p);
      if (jy > 0 || jv > 0) { jy += jv; jv -= .004; if (jy <= 0) { jy = 0; jv = 0; } } body.position.y = jy;
    }
    if (st.s === 'win' && st.n < SEC[st.i].t.length && t - lastTy > .025) { st.n++; lastTy = t; dirty = true; }
    if (dirty) { draw(); dirty = false; }
    if (!drag) tyaw *= .995; yaw += (tyaw - yaw) * .12; con.rotation.y = yaw + (reduce ? 0 : Math.sin(t * .6) * .03);
    con.position.y = reduce ? 0 : Math.sin(t * 1.2) * .12;
    R.setRenderTarget(rt); R.render(VS, VC); R.setRenderTarget(null); R.render(S, C);
  })(performance.now());
})();
