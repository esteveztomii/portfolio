/* HERO · Game Boy 3D (three.js r128 + GLTFLoader)
   La pantallita del Game Boy replica la interfaz de la 3DS: menú de secciones, ventana de diálogo
   y un mini Tomás en pixel art. Editá SEC para cambiar los textos.
   Se maneja tocando la pantalla, con la cruz / A / B / SELECT / START del modelo, o con el teclado. */
(function () {
  'use strict';
  var root = document.getElementById('home');
  if (!root) return;
  var visor = document.getElementById('visor'), srEl = document.getElementById('gb-sr'), loadEl = document.getElementById('gb-load');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, A = reduce ? 0 : 1;
  var dirty = true;
  function markDirty() { dirty = true; }

  /* ---------- contenido ---------- */
  var SEC = [
    { k: 'Sobre mí', id: 'sobre-mi', t: 'Estudiante de Diseño Multimedial en la UNLP, dando mis primeros pasos en proyectos digitales. Edición de video, motion graphics y diseño.' },
    { k: 'Educación', id: 'educacion', t: 'Licenciatura en Diseño Multimedial, Facultad de Artes, UNLP (2023 a la actualidad). Photoshop, Figma, Illustrator, Canva, After Effects y CapCut.' },
    { k: 'Proyectos', id: 'proyectos', t: 'Rediseño Filo News (UI/UX), Vagari (identidad y experiencia VR), edición de video y reels, y animación.' },
    { k: 'Contacto', id: 'contacto', t: 'Disponible para proyectos. esteveztomii@gmail.com · +54 9 11 3564-1671' }
  ];
  var TAB = ['#ffb3c6', '#a9e0ff', '#c3f0a4', '#ffd27a'], ICO = ['#e8605a', '#29c5f6', '#6bbf3a', '#ff8c4a'];

  /* ---------- pantalla (canvas lógico 160×144, dibujado a 2x) ---------- */
  var LW = 160, LH = 144, K = 2;
  var scr = document.createElement('canvas'); scr.width = LW * K; scr.height = LH * K;
  var g = scr.getContext('2d');
  var P = { cream: '#fff8e5', line: '#c9a090', ink: '#5a3a2a', red: '#e8605a', cyan: '#29c5f6', org: '#ff8c4a', yel: '#ffe45e', grn: '#6bbf3a' };
  var FONT = 'VT323, monospace';
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function ell(cx, cy, rx, ry, c) { // elipse en píxeles
    g.fillStyle = c;
    for (var dy = -ry; dy <= ry; dy++) { var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + .01)))); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
  }
  function txt(s, x, y, col, px, al) { g.font = px + 'px ' + FONT; g.fillStyle = col; g.textAlign = al || 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); }
  function box(x, y, w, h, fill) { R(x - 1, y - 1, w + 2, h + 2, P.line); R(x, y, w, h, fill); }
  function wrap(s, w, px) {
    g.font = px + 'px ' + FONT; var out = [], l = '';
    s.split(' ').forEach(function (wd) { var t = l ? l + ' ' + wd : wd; if (g.measureText(t).width > w && l) { out.push(l); l = wd; } else l = t; });
    out.push(l); return out;
  }

  /* ---------- mini Tomás (pixel art 40×55) ---------- */
  var C = { hair: '#16110f', hair2: '#2e2622', skin: '#c98f5f', skinS: '#b57a4c', cheek: '#dc8a72', eye: '#1b1210', brow: '#2b1a12', gold: '#ffc933', silver: '#d3dbe6',
    shirt: '#f6bd0f', shirtS: '#d99a00', shirtL: '#ffd84a', jean: '#4d78ac', jeanS: '#3b6196', jeanL: '#7ea3cf', thread: '#e8f0f8', shoe: '#18181f', sole: '#f4f4f4' };
  var HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  function heart(x, y, c, s) { s = s || 1; HEART.forEach(function (r, j) { for (var i = 0; i < 7; i++) if (r[i] === 'X') R(x + i * s, y + j * s, s, s, c); }); }
  function arm(sx, sy, dirx, th) { // brazo en bloques: manga, puño doblado, antebrazo y mano
    var s = Math.sin(th), c = Math.cos(th);
    for (var i = 0; i <= 11; i++) {
      var px = sx + dirx * s * i, py = sy + c * i, col = i < 6 ? C.shirt : (i < 8 ? C.shirtS : C.skin), z = i < 8 ? 4 : (i < 11 ? 3 : 4);
      R(Math.round(px - z / 2), Math.round(py - z / 2), z, z, col);
    }
  }
  function drawTomas(ox, oy, p, blink, happy) {
    g.save(); g.translate(Math.round(ox), Math.round(oy));
    // pelo (atrás)
    ell(20, 14, 13, 12, C.hair);
    for (var k = 0; k < 16; k++) { var a = k * Math.PI / 8, sn = Math.sin(a); if (sn < .6) ell(20 + Math.round(13.5 * Math.cos(a)), 14 + Math.round(12.5 * sn), 3, 3, C.hair); }
    [[14, 0, 3, 3], [19, -1, 3, 4], [25, 0, 3, 3], [10, 3, 2, 3], [30, 3, 2, 3]].forEach(function (t) { R(t[0], t[1], t[2], t[3], C.hair); });
    ell(9, 22, 3, 4, C.hair); ell(32, 22, 3, 4, C.hair);
    // piernas y zapatillas
    R(13, 41, 15, 2, C.jean); R(13, 43, 7, 6, C.jean); R(21, 43, 7, 6, C.jean); R(18, 43, 1, 6, C.jeanS); R(27, 43, 1, 6, C.jeanS);
    R(14, 45, 4, 2, C.skin); R(14, 44, 1, 1, C.thread); R(17, 47, 1, 1, C.thread); R(22, 46, 4, 2, C.skin); R(24, 45, 1, 1, C.thread); R(22, 48, 1, 1, C.thread);
    R(12, 49, 8, 2, C.jeanL); R(21, 49, 8, 2, C.jeanL); R(12, 50, 8, 1, C.jeanS); R(21, 50, 8, 1, C.jeanS);
    R(11, 51, 9, 3, C.shoe); R(21, 51, 9, 3, C.shoe); R(12, 52, 2, 1, '#3a3a46'); R(22, 52, 2, 1, '#3a3a46'); R(11, 54, 9, 1, C.sole); R(21, 54, 9, 1, C.sole);
    // camisa
    R(12, 29, 17, 12, C.shirt); R(11, 38, 19, 3, C.shirt); R(13, 31, 2, 8, C.shirtL); R(25, 31, 4, 9, C.shirtS); R(11, 40, 19, 1, C.shirtS);
    R(16, 29, 3, 2, C.shirtS); R(22, 29, 3, 2, C.shirtS); R(20, 30, 1, 11, C.shirtS); R(20, 33, 1, 1, '#fff6c9'); R(20, 36, 1, 1, '#fff6c9'); R(20, 39, 1, 1, '#fff6c9');
    // brazos (respiración profunda)
    var th = .22 + 2.6 * p; arm(13, 31, -1, th); arm(28, 31, 1, th);
    // cuello y cabeza
    R(18, 26, 5, 4, C.skinS); ell(20, 19, 10, 8, C.skin);
    R(9, 18, 2, 4, C.skinS); R(31, 18, 2, 4, C.skinS); R(9, 22, 1, 2, C.silver); R(32, 22, 1, 2, C.silver);
    R(13, 22, 3, 2, C.cheek); R(26, 22, 3, 2, C.cheek);
    if (blink) { R(14, 19, 3, 1, C.eye); R(25, 19, 3, 1, C.eye); }
    else { R(14, 17, 3, 4, C.eye); R(25, 17, 3, 4, C.eye); R(14, 17, 1, 1, '#fff'); R(25, 17, 1, 1, '#fff'); }
    R(13, 14, 5, 1, C.brow); R(14, 15, 3, 1, C.brow); R(24, 14, 5, 1, C.brow); R(25, 15, 3, 1, C.brow);
    R(20, 21, 2, 1, C.skinS); R(22, 22, 1, 1, C.gold);
    if (happy) { R(18, 24, 6, 2, '#7a2e2e'); R(20, 25, 2, 1, '#e0707a'); R(17, 23, 1, 1, '#7a3f2a'); R(24, 23, 1, 1, '#7a3f2a'); }
    else { R(18, 24, 1, 1, '#7a3f2a'); R(19, 25, 4, 1, '#7a3f2a'); R(23, 24, 1, 1, '#7a3f2a'); }
    // flequillo rizado
    ell(14, 11, 5, 3, C.hair); ell(22, 10, 6, 3, C.hair); ell(28, 12, 4, 3, C.hair);
    R(19, 12, 2, 3, C.hair); R(20, 14, 1, 2, C.hair); R(16, 13, 2, 2, C.hair); R(26, 13, 2, 2, C.hair);
    [[13, 6], [18, 4], [24, 5], [28, 8], [11, 11], [31, 12], [20, 8]].forEach(function (h) { R(h[0], h[1], 2, 1, C.hair2); R(h[0] + 1, h[1] + 1, 1, 1, C.hair2); });
    g.restore();
  }

  /* ---------- escena superior y UI inferior ---------- */
  var ST = { page: 'home', sel: 0, i: 0, f: 1, pages: [], pg: 0, tStart: 0, heart: false, jumpT: -9, happyT: -9 };
  var GROUND = 48, FEET = 60;
  function scene(now) {
    var t = now / 1000, i, j;
    var gr = g.createLinearGradient(0, 0, 0, GROUND); gr.addColorStop(0, '#8fd3ff'); gr.addColorStop(1, '#d9f3ff'); g.fillStyle = gr; g.fillRect(0, 0, LW, GROUND);
    [[20, 10, 1], [78, 22, .8], [120, 6, 1.1]].forEach(function (c, n) { // nubes
      var x = Math.round(((c[0] + t * 2.2 * A * (n + 1) * .6) % (LW + 50)) - 25), y = c[1];
      ell(x, y, 11 * c[2], 3, '#ffffff'); ell(x - 6, y - 2, 6 * c[2], 3, '#ffffff'); ell(x + 5, y - 3, 7 * c[2], 3, '#ffffff');
    });
    var gg = g.createLinearGradient(0, GROUND, 0, 62); gg.addColorStop(0, '#9fd66b'); gg.addColorStop(1, '#78bb4f'); g.fillStyle = gg; g.fillRect(0, GROUND, LW, 62 - GROUND);
    R(0, GROUND, LW, 1, '#b9e68d');
    [[8, 55, '#ffb3c6'], [30, 58, '#fff'], [66, 56, '#ffe45e'], [96, 59, '#ffb3c6'], [140, 56, '#fff'], [152, 59, '#ffe45e']].forEach(function (f) { R(f[0], f[1], 2, 2, f[2]); R(f[0], f[1] + 2, 1, 1, '#4f9a2f'); });
    // personaje
    var pq = reduce ? .4 : Math.round(((1 - Math.cos(t * 2 * Math.PI / 6.5)) / 2) * 8) / 8;
    var jt = t - ST.jumpT, jh = 0; if (jt >= 0 && jt < .6) jh = Math.round(Math.sin(jt / .6 * Math.PI) * 16);
    var blink = !reduce && (t % 3.4) > 3.28, happy = jh > 0 || (t - ST.happyT) < 1.4 || ST.heart;
    var bob = (pq > .5 && !reduce) ? -1 : 0;
    ell(46, FEET - 1, 12 - Math.round(jh / 3), 2, 'rgba(40,90,20,.35)');
    drawTomas(26, FEET - 55 + bob - jh, pq, blink, happy);
    if (ST.heart) heart(70, 12 + Math.round(Math.sin(t * 3) * 2 * A), P.red, 2);
    // panel de nombre (como la ventana de la 3DS)
    box(86, 6, 69, 38, P.cream);
    if (ST.page === 'home') { txt('Tomás Estévez', 91, 20, P.ink, 12); txt('Diseñador', 91, 30, P.line, 10); txt('Multimedial', 91, 39, P.line, 10); }
    else { R(87, 7, 67, 4, TAB[ST.i]); txt(SEC[ST.i].k, 120, 28, P.ink, 15, 'center'); txt('Tomás E.', 120, 39, P.line, 10, 'center'); }
  }
  function icon(k, cx, cy) {
    g.fillStyle = '#fff';
    if (k === 0) { ell(cx, cy - 3, 2, 2, '#fff'); ell(cx, cy + 4, 4, 2, '#fff'); }
    else if (k === 1) { R(cx - 5, cy - 4, 10, 8, '#fff'); R(cx, cy - 4, 1, 8, ICO[1]); R(cx - 4, cy - 2, 3, 1, ICO[1]); R(cx + 2, cy - 2, 3, 1, ICO[1]); }
    else if (k === 2) { R(cx - 5, cy - 3, 11, 8, '#fff'); R(cx - 5, cy - 5, 5, 2, '#fff'); }
    else { R(cx - 5, cy - 4, 11, 8, '#fff'); for (var i = 0; i < 5; i++) { R(cx - 5 + i, cy - 4 + i, 1, 1, ICO[3]); R(cx + 5 - i, cy - 4 + i, 1, 1, ICO[3]); } }
  }
  var BOX = function (i) { return { x: 5 + (i % 2) * 76, y: 68 + Math.floor(i / 2) * 37, w: 74, h: 34 }; };
  var BTNS = [{ x: 10 }, { x: 46 }, { x: 82 }, { x: 118 }], BY = 120, BH = 16, BW = 32;
  function ui(now) {
    R(0, 62, LW, LH - 62, P.yel); R(0, 62, LW, 1, P.line);
    for (var y = 0; y < LH - 62; y += 16) for (var x = 0; x < LW; x += 16) { var ox = (y / 16) % 2 ? 8 : 0; R(x + ox + 4, 66 + y + 2, 1, 3, '#f7a8c4'); R(x + ox + 3, 66 + y + 3, 3, 1, '#f7a8c4'); }
    if (ST.page === 'home') {
      SEC.forEach(function (s, i) {
        var b = BOX(i), on = i === ST.sel;
        if (on) R(b.x - 3, b.y - 3, b.w + 6, b.h + 6, P.org);
        box(b.x, b.y, b.w, b.h, P.cream); R(b.x + 2, b.y + 2, b.w - 4, 4, TAB[i]);
        R(b.x + 6, b.y + 12, 18, 18, ICO[i]); icon(i, b.x + 15, b.y + 21);
        txt(s.k, b.x + 28, b.y + 24, P.ink, 13);
      });
    } else {
      box(4, 66, 152, 75, P.cream);
      var pgl = ST.pages[ST.pg] || [], n = reduce ? 9999 : Math.floor((now - ST.tStart) / 26), shown = 0, more = ST.pg < ST.pages.length - 1;
      pgl.forEach(function (l, k) { var s = l.slice(0, Math.max(0, n - shown)); shown += l.length; txt(s, 9, 79 + k * 10, P.ink, 12); });
      ST.done = n >= pageLen();
      if (ST.done && more && Math.floor(now / 350) % 2) { g.fillStyle = P.org; g.beginPath(); g.moveTo(144, 109); g.lineTo(150, 109); g.lineTo(147, 113); g.fill(); }
      BTNS.forEach(function (b, i) {
        var on = i === ST.f && ST.done && !more; if (on) R(b.x - 2, BY - 2, BW + 4, BH + 4, P.org);
        box(b.x, BY, BW, BH, '#f6e7df'); var cx = b.x + 16, cy = BY + 8;
        if (i === 0) heart(cx - 3, cy - 3, ST.heart ? P.red : '#e9a9a5');
        else if (i === 1) { g.fillStyle = P.red; g.beginPath(); g.moveTo(cx - 3, cy - 4); g.lineTo(cx + 4, cy); g.lineTo(cx - 3, cy + 4); g.fill(); }
        else if (i === 2) txt(':)', cx, cy + 4, P.red, 13, 'center');
        else { for (var q = -3; q <= 3; q++) { R(cx + q, cy + q, 2, 2, P.red); R(cx + q, cy - q, 2, 2, P.red); } }
      });
    }
  }
  function pageLen() { return (ST.pages[ST.pg] || []).join('').length; }
  function paint(now) { g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false; scene(now); ui(now); }

  /* ---------- navegación ---------- */
  function announce() {
    srEl.textContent = ST.page === 'home' ? 'Menú. Sección ' + SEC[ST.sel].k + ', ' + (ST.sel + 1) + ' de ' + SEC.length : SEC[ST.i].k + '. ' + SEC[ST.i].t;
  }
  function goSec(i) { var el = document.getElementById(SEC[i].id); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  function open(i) {
    ST.page = 'win'; ST.i = i; ST.f = 1; ST.pg = 0; ST.tStart = performance.now(); ST.done = reduce;
    var ls = wrap(SEC[i].t, 138, 12); ST.pages = []; for (var k = 0; k < ls.length; k += 4) ST.pages.push(ls.slice(k, k + 4));
    markDirty(); announce();
  }
  function home() { ST.page = 'home'; markDirty(); announce(); }
  function activate(b) {
    if (b === 0) { ST.heart = !ST.heart; ST.happyT = performance.now() / 1000; }
    else if (b === 1) goSec(ST.i);
    else if (b === 2) { if (performance.now() / 1000 - ST.jumpT > .7) ST.jumpT = performance.now() / 1000; }
    else home();
    markDirty();
  }
  function advance() { // A / tocar el texto
    var now = performance.now();
    if (!reduce && !ST.done) { ST.tStart = now - pageLen() * 26 - 1; ST.done = true; }
    else if (ST.pg < ST.pages.length - 1) { ST.pg++; ST.tStart = now; ST.done = false; }
    else activate(ST.f);
    markDirty();
  }
  function press(b) {
    if (b === 'start') { goSec(2); }
    else if (b === 'select') { if (ST.page !== 'home') home(); }
    else if (ST.page === 'home') {
      var r = Math.floor(ST.sel / 2), c = ST.sel % 2;
      if (b === 'left' || b === 'right') c = 1 - c; else if (b === 'up' || b === 'down') r = 1 - r;
      if (b === 'a') open(ST.sel); else { ST.sel = r * 2 + c; markDirty(); announce(); }
    } else {
      if (b === 'b') home();
      else if (b === 'a') advance();
      else if (b === 'left') { ST.f = (ST.f + 3) % 4; markDirty(); } else if (b === 'right') { ST.f = (ST.f + 1) % 4; markDirty(); }
    }
    nudge = 1;
  }
  function tap(x, y) { // toque directo sobre la pantallita (coordenadas 0..160 × 0..144)
    var i;
    if (ST.page === 'home') { for (i = 0; i < 4; i++) { var b = BOX(i); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { ST.sel = i; open(i); return true; } } return false; }
    if (y >= BY && y <= BY + BH) { for (i = 0; i < 4; i++) if (x >= BTNS[i].x && x <= BTNS[i].x + BW) { ST.f = i; if (ST.done && ST.pg >= ST.pages.length - 1) activate(i); else advance(); return true; } }
    if (y >= 66 && y < BY) { advance(); return true; }
    return false;
  }

  /* ---------- textura: foto del Game Boy + pantalla en vivo ---------- */
  var S = 2, TS = 1024 * S, baseCv, texCv, tx, tex, nudge = 0;
  // botones (coordenadas del modelo: x derecha, y arriba, z frente)
  var BTN = {
    dpad: { x: -0.229, y: -0.066, z: 0.209, r: 0.098 }, a: { x: 0.32, y: -0.049, z: 0.213, r: 0.058 }, b: { x: 0.183, y: -0.112, z: 0.213, r: 0.058 },
    select: { x: -0.061, y: -0.302, z: 0.199, w: 0.11, h: 0.06 }, start: { x: 0.066, y: -0.296, z: 0.199, w: 0.11, h: 0.06 }
  };
  function hitTest(p) {
    if (p.z < 0.1) return null;
    var k, o, dx, dy;
    for (k in BTN) {
      o = BTN[k]; dx = p.x - o.x; dy = p.y - o.y;
      if (o.r ? (dx * dx + dy * dy <= o.r * o.r) : (Math.abs(dx) <= o.w / 2 && Math.abs(dy) <= o.h / 2)) {
        if (k === 'dpad') return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'down' : 'up');
        return k;
      }
    }
    return null;
  }
  function screenUV(u, v) { // textura (rotada 90° y espejada) → coordenadas de la pantallita
    var tx_ = u * 1024, ty_ = v * 1024;
    if (tx_ < 70 || tx_ > 233 || ty_ < 475 || ty_ > 659) return null;
    return { x: -(ty_ - 567) / (182 / 160) + 80, y: -(tx_ - 151.5) / (161 / 144) + 72 };
  }
  var fx, fxUntil = 0;
  function flash(id) {
    if (!fx) return;
    var o = BTN[(id === 'left' || id === 'right' || id === 'up' || id === 'down') ? 'dpad' : id], x = o.x, y = o.y, w, h;
    if (o === BTN.dpad) { var vert = id === 'up' || id === 'down', sg = (id === 'right' || id === 'up') ? 1 : -1; w = vert ? 0.052 : 0.09; h = vert ? 0.09 : 0.052; x += vert ? 0 : sg * 0.052; y += vert ? sg * 0.052 : 0; fx.geometry = fx.userData.box; }
    else if (o.r) { w = h = o.r * 1.5; fx.geometry = fx.userData.disc; }
    else { w = 0.09; h = 0.042; fx.geometry = fx.userData.box; }
    fx.position.set(x, y, o.z + 0.012); fx.scale.set(w, h, 1); fx.visible = true; fxUntil = performance.now() + 150;
  }
  function blit() {
    tx.save(); tx.translate(151.5 * S, 567 * S); tx.rotate(Math.PI / 2); tx.scale(-1, 1);
    tx.scale(182 * S / (LW * K), 161 * S / (LH * K)); tx.imageSmoothingEnabled = false; tx.drawImage(scr, -LW * K / 2, -LH * K / 2); tx.restore();
    tex.needsUpdate = true;
  }

  /* ---------- escena 3D ---------- */
  var T = window.THREE, r, scene3, cam, rootG, model, mesh, SIZE, ray, ready = false, vis = true;
  var px = 0, py = 0, spin = 0, spinV = 0, drag = false, moved = 0, lastX = 0, last = performance.now(), lastPaint = 0;

  function fail(msg) { root.classList.add('no3d'); if (loadEl) { loadEl.hidden = false; loadEl.textContent = msg; } }
  function b64buf(b64) { var s = atob(b64), n = s.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  function size() {
    if (!r || !SIZE) return;
    var w = visor.clientWidth, h = visor.clientHeight; if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    var tn = Math.tan(cam.fov * Math.PI / 360), dH = (SIZE.y * 1.12 / 2) / tn, dW = (SIZE.x * 1.15 / 2) / (tn * cam.aspect);
    cam.position.z = Math.max(dH, dW) + SIZE.z / 2;
  }
  function pointerNDC(e) { var b = r.domElement.getBoundingClientRect(); return new T.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); }
  function hitAt(e) { // {b:'a'} botón físico · {s:{x,y}} pantallita · null
    if (!ready) return null;
    scene3.updateMatrixWorld(true); ray.setFromCamera(pointerNDC(e), cam);
    var h = ray.intersectObject(mesh, false)[0]; if (!h) return null;
    var b = hitTest(model.worldToLocal(h.point.clone())); if (b) return { b: b };
    var s = h.uv && model.worldToLocal(h.point.clone()).z > 0.1 ? screenUV(h.uv.x, h.uv.y) : null; return s ? { s: s } : null;
  }

  function init() {
    if (!T) return fail('Falta js/three.min.js (revisá el nombre y la carpeta).');
    if (!T.GLTFLoader) return fail('Falta js/GLTFLoader.js (subilo a la carpeta js).');
    if (!window.GB_GLB_B64) return fail('Falta js/gameboy-model.js (subilo a la carpeta js).');
    try { r = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return fail('Tu navegador no soporta WebGL. Usá la barra de abajo para moverte por la página.'); }
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding;
    visor.appendChild(r.domElement); r.domElement.setAttribute('aria-hidden', 'true');
    scene3 = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, 0.1, 60); ray = new T.Raycaster();
    rootG = new T.Group(); scene3.add(rootG);
    new T.GLTFLoader().parse(b64buf(window.GB_GLB_B64), '', function (gltf) {
      model = gltf.scene;
      model.traverse(function (o) { if (o.name === 'GameBoy') { o.matrix.identity(); o.matrixAutoUpdate = false; } if (o.isMesh) mesh = o; });
      model.updateMatrixWorld(true);
      var bb = new T.Box3().setFromObject(model); SIZE = bb.getSize(new T.Vector3()); model.position.sub(bb.getCenter(new T.Vector3()));
      rootG.add(model);
      fx = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      fx.userData.box = fx.geometry; fx.userData.disc = new T.CircleGeometry(0.5, 28); fx.visible = false; model.add(fx);
      var img = mesh.material.map.image;
      baseCv = document.createElement('canvas'); baseCv.width = baseCv.height = TS;
      var b = baseCv.getContext('2d'); b.imageSmoothingQuality = 'high'; b.drawImage(img, 0, 0, TS, TS);
      var lg = b.createRadialGradient(184 * S, 691 * S, 0, 184 * S, 691 * S, 14 * S); // LED de encendido
      lg.addColorStop(0, 'rgba(255,60,60,1)'); lg.addColorStop(0.3, 'rgba(255,40,40,.8)'); lg.addColorStop(1, 'rgba(255,0,0,0)');
      b.fillStyle = lg; b.fillRect(160 * S, 667 * S, 48 * S, 48 * S);
      texCv = document.createElement('canvas'); texCv.width = texCv.height = TS; tx = texCv.getContext('2d'); tx.drawImage(baseCv, 0, 0);
      tex = new T.CanvasTexture(texCv); tex.flipY = false; tex.encoding = T.sRGBEncoding; tex.anisotropy = r.capabilities.getMaxAnisotropy();
      mesh.material.map = tex; mesh.material.needsUpdate = true;
      size(); ready = true; if (loadEl) loadEl.hidden = true; announce();
    }, function (err) { console.error(err); fail('Error al leer el modelo: ' + (err && err.message ? err.message : err)); });

    addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(visor);
    addEventListener('pointermove', function (e) {
      var b = visor.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / 350));
      py = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / 260));
      if (drag) { spinV = (e.clientX - lastX) * 0.012; spin += spinV; moved += Math.abs(e.clientX - lastX); lastX = e.clientX; }
      else if (ready && e.target === r.domElement) {
        var h = hitAt(e), over = h && (h.b || (h.s && (ST.page === 'win' ? h.s.y > 62 : h.s.y > 62))); visor.style.cursor = over ? 'pointer' : 'grab';
      }
    });
    visor.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; try { visor.setPointerCapture(e.pointerId); } catch (x) {} });
    addEventListener('pointerup', function (e) {
      if (drag && moved < 6) { var h = hitAt(e); if (h && h.b) { press(h.b); flash(h.b); } else if (h && h.s && tap(h.s.x, h.s.y)) nudge = .6; }
      drag = false;
    });
    visor.addEventListener('keydown', function (e) {
      if (e.key >= '1' && e.key <= '4') { e.preventDefault(); open(+e.key - 1); return; }
      var m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a', ' ': 'a', z: 'a', Z: 'a', Escape: 'b', Backspace: 'b', x: 'b', X: 'b' }[e.key];
      if (!m) return; e.preventDefault(); press(m); flash(m);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(visor);
    if (document.fonts) { document.fonts.load('16px VT323').then(markDirty, function () {}); document.fonts.ready.then(markDirty); }
    requestAnimationFrame(loop);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready || !vis || document.hidden) return;
    var t = now / 1000;
    var typing = ST.page === 'win' && !ST.done;
    if (dirty || (!reduce && now - lastPaint > 80) || (typing && now - lastPaint > 36)) { paint(now); blit(); dirty = false; lastPaint = now; }
    if (!drag) { spinV *= 0.92; spin += spinV; spin *= 0.95; }
    rootG.rotation.y += (spin + px * 0.35 * A - rootG.rotation.y) * 0.12;
    rootG.rotation.x += (py * 0.16 * A - rootG.rotation.x) * 0.12;
    rootG.position.y = Math.sin(t * 1.6) * 0.02 * A;
    if (fx && fx.visible && now > fxUntil) fx.visible = false;
    nudge *= 0.85; rootG.scale.setScalar(1 - nudge * 0.02);
    r.render(scene3, cam);
  }
  init();
})();
