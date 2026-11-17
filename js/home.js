/* HOME · Game Boy 3D (three.js r128 + GLTFLoader)
   La pantalla del Game Boy ES la interfaz: perfil, stats, música, rave/vj y juegos viven adentro.
   Botones: cruz, A, B, SELECT y START (clic/toque sobre el modelo o teclado). */
(function () {
  'use strict';
  var root = document.getElementById('home');
  if (!root) return;
  var visor = document.getElementById('visor'), srEl = document.getElementById('gb-sr'), loadEl = document.getElementById('gb-load');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, A = reduce ? 0 : 1;
  var dirty = true;
  function markDirty() { dirty = true; }

  /* ---------- audio: sintetizador propio (sin archivos, sin copyright) ---------- */
  var TRACKS = [
    { n: 'Disco Pulse', a: 'Inspirado en pop disco · original', bpm: 116, root: 45, prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']], lead: 'triangle' },
    { n: 'Neon Idol', a: 'Inspirado en K-pop dance · original', bpm: 128, root: 50, prog: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], lead: 'square' },
    { n: 'Night Drive', a: 'Synthwave suave · original', bpm: 100, root: 52, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], lead: 'sawtooth' }
  ];
  var AU = { ctx: null, an: null, data: null, buf: null, bassF: null, out: null, playing: false, idx: 0, step: 0, next: 0, timer: 0, lvl: 0 };
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function osc(type, f, t0, dur, vol, dest) {
    var c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || AU.out); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function kick(t0) {
    var c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.12);
    g.gain.setValueAtTime(0.9, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.26);
    o.connect(g); g.connect(AU.out); o.start(t0); o.stop(t0 + 0.3);
  }
  function noise(t0, dur, vol, type, f) {
    var c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = AU.buf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(AU.out); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }
  var ARP = [0, 1, 2, 1, 3, 2, 1, 2];
  function playStep(tr, s, t0) {
    var bar = (s >> 4) & 3, st = s & 15, ch = tr.prog[bar], q = ch[1] === 'm' ? 3 : 4, base = tr.root + ch[0], sp = 60 / tr.bpm / 4;
    if (st % 4 === 0) kick(t0);
    if (st === 4 || st === 12) noise(t0, 0.14, 0.35, 'bandpass', 1800);
    if (st % 4 === 2) noise(t0, 0.06, 0.18, 'highpass', 7000); else if (st % 2) noise(t0, 0.03, 0.06, 'highpass', 8000);
    if (st === 0 || st === 3 || st === 6 || st === 10 || st === 14) osc('sawtooth', hz(base), t0, sp * 2.2, 0.32, AU.bassF);
    if (st % 2 === 0) { var iv = [0, q, 7, 12][ARP[(st >> 1) % 8] % 4]; osc(tr.lead, hz(base + 24 + iv), t0, sp * 1.8, 0.09); }
    if (st === 0) [0, q, 7].forEach(function (i) { osc('sine', hz(base + 12 + i), t0, sp * 15, 0.05); });
  }
  function sched() {
    if (!AU.playing) return;
    var tr = TRACKS[AU.idx], sp = 60 / tr.bpm / 4;
    while (AU.next < AU.ctx.currentTime + 0.15) {
      playStep(tr, AU.step, AU.next); AU.next += sp; AU.step++;
      if (AU.step >= 256) { AU.step = 0; AU.idx = (AU.idx + 1) % TRACKS.length; tr = TRACKS[AU.idx]; sp = 60 / tr.bpm / 4; markDirty(); announce(); }
    }
  }
  function initAudio() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    var c = AU.ctx = new AC();
    AU.buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    var d = AU.buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var master = c.createGain(); master.gain.value = 0.3;
    AU.an = c.createAnalyser(); AU.an.fftSize = 128; AU.data = new Uint8Array(AU.an.frequencyBinCount);
    master.connect(AU.an); AU.an.connect(c.destination);
    AU.out = master;
    AU.bassF = c.createBiquadFilter(); AU.bassF.type = 'lowpass'; AU.bassF.frequency.value = 420; AU.bassF.connect(master);
    AU.timer = setInterval(sched, 25);
    return true;
  }
  function play() {
    if (!AU.ctx && !initAudio()) return;
    AU.ctx.resume(); if (!AU.playing) { AU.playing = true; AU.next = AU.ctx.currentTime + 0.06; }
    markDirty();
  }
  function pause() { if (!AU.ctx) return; AU.playing = false; AU.ctx.suspend(); markDirty(); }
  function go(d) {
    AU.idx = (AU.idx + d + TRACKS.length) % TRACKS.length; AU.step = 0;
    if (AU.ctx) AU.next = AU.ctx.currentTime + 0.06;
    markDirty(); if (!AU.playing) play();
  }
  var fmt = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

  /* ---------- contenido ---------- */
  var GAMES = [
    ['Resident Evil', 'Atmósfera, tensión y diseño sonoro.'],
    ['Marvel Rivals', 'Dinamismo, diseño de personajes y ritmo visual.'],
    ['The Walking Dead (Telltale)', 'Narrativa interactiva y peso de las decisiones.'],
    ['Life is Strange', 'Estética indie, nostalgia y banda sonora.']
  ];
  var STATS = [['Motion & Visual', 90], ['Edición & Video', 85], ['Diseño UX/UI', 80], ['Código Creativo', 75]];
  var MENU = [['PERFIL', 'perfil'], ['STATS', 'stats'], ['MÚSICA', 'musica'], ['RAVE / VJ', 'rave'], ['JUEGOS', 'juegos'], ['PROYECTOS', 'proyectos']];
  var NAMES = { menu: 'MENÚ', perfil: 'PERFIL', stats: 'STATS', musica: 'SOUND', rave: 'RAVE / VJ', juegos: 'FAVORITOS' };
  var T_PERFIL = ['Estudiante de Diseño Multimedial en la UNLP.', 'UI/UX, edición de video, motion graphics y animación.'];
  var T_RAVE = 'Me gustan las raves y la electrónica, y los visuales en vivo que respiran con el sonido. Los armo con TouchDesigner.';
  var ST = { page: 'menu', sel: 0, game: 0, t0: 0 };

  /* ---------- pantalla (canvas lógico 160×144, dibujado a 2x) ---------- */
  var LW = 160, LH = 144, K = 2;
  var scr = document.createElement('canvas'); scr.width = LW * K; scr.height = LH * K;
  var g = scr.getContext('2d');
  var C = { bg: '#0b1030', bar: '#1a00d4', txt: '#d6e8fb', dim: '#8fa4d8', cy: '#38b6ff', yl: '#fff94a', pk: '#ff6bff', gr: '#16d93a', ink: '#14121f', foot: '#161a48', track: '#1b2260' };
  var FONT = 'VT323, monospace';
  function font(px) { g.font = px + 'px ' + FONT; }
  function txt(s, x, y, col, px, al) { font(px || 16); g.fillStyle = col || C.txt; g.textAlign = al || 'left'; g.fillText(s, x, y); }
  function wrap(s, w, px) {
    font(px); var words = s.split(' '), lines = [], cur = '';
    words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > w && cur) { lines.push(cur); cur = wd; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function fit(s, w, px) { while (px > 9) { font(px); if (g.measureText(s).width <= w) break; px--; } return px; }
  function tri(x, y, w, h, dir, col) {
    g.fillStyle = col; g.beginPath();
    if (dir === 'r') { g.moveTo(x, y); g.lineTo(x, y + h); g.lineTo(x + w, y + h / 2); }
    else if (dir === 'l') { g.moveTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h / 2); }
    else { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w / 2, y + h); }
    g.closePath(); g.fill();
  }
  function chrome() {
    g.setTransform(K, 0, 0, K, 0, 0); g.textBaseline = 'alphabetic';
    g.fillStyle = C.bg; g.fillRect(0, 0, LW, LH);
    g.fillStyle = C.bar; g.fillRect(0, 0, LW, 16); g.fillStyle = C.cy; g.fillRect(0, 16, LW, 1);
    txt(NAMES[ST.page], 5, 12, '#fff', 16);
    var d = new Date(); txt(('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2), LW - 5, 12, '#fff', 16, 'right');
    if (AU.playing) { // nota musical
      g.fillStyle = C.yl; g.beginPath(); g.ellipse(LW - 47, 11, 2.3, 1.7, 0, 0, 7); g.fill(); g.fillRect(LW - 45.5, 3, 1.2, 8); g.fillRect(LW - 45.5, 3, 4, 1.6);
    }
  }
  function foot(s) { g.fillStyle = C.foot; g.fillRect(0, 132, LW, 12); txt(s, 5, 141, C.dim, 12); }

  function pMenu() {
    MENU.forEach(function (it, i) {
      var y = 21 + i * 17, on = i === ST.sel;
      if (on) { g.fillStyle = C.yl; g.fillRect(5, y, 150, 15); tri(10, y + 3.5, 5, 8, 'r', C.ink); }
      else { g.fillStyle = C.cy; g.fillRect(11, y + 6, 3, 3); }
      txt(it[0], 22, y + 12, on ? C.ink : C.txt, 16);
      if (it[1] === 'proyectos') tri(143, y + 5, 7, 5, 'd', on ? C.ink : C.cy);
    });
    foot('A: ELEGIR   CRUZ: MOVER');
  }
  function pPerfil() {
    txt('TOMÁS ESTÉVEZ', 6, 38, C.cy, 22);
    var y = 52;
    T_PERFIL.forEach(function (p, k) { wrap(p, 148, 14).forEach(function (l) { txt(l, 6, y, C.txt, 14); y += 12; }); y += 4; });
    var chips = [['UI/UX', C.pk], ['VIDEO', C.yl], ['MOTION', C.gr], ['ANIM', C.cy]], x = 6;
    chips.forEach(function (c) { font(12); var w = g.measureText(c[0]).width + 8; g.fillStyle = c[1]; g.fillRect(x, 113, w, 12); txt(c[0], x + 4, 122, C.ink, 12); x += w + 4; });
    foot('B: ATRÁS');
  }
  function pStats(now) {
    txt('TOMÁS E. - TIPO MULTIMEDIA', 6, 30, C.pk, 14);
    var e = Math.min(1, (now - ST.t0) / 700); e = 1 - Math.pow(1 - e, 3);
    STATS.forEach(function (s, i) {
      var y = 36 + i * 23;
      txt(s[0].toUpperCase(), 6, y + 10, C.txt, 14); txt(String(s[1]), 154, y + 10, C.yl, 14, 'right');
      g.fillStyle = C.cy; g.fillRect(6, y + 13, 148, 7); g.fillStyle = C.track; g.fillRect(7, y + 14, 146, 5);
      g.fillStyle = C.cy; g.fillRect(7, y + 14, 146 * s[1] / 100 * e, 5);
    });
    foot('PASIVA: MODO NOCTURNO');
  }
  function pMusica(t) {
    var tr = TRACKS[AU.idx];
    var s1 = tr.n.toUpperCase(); txt(s1, 6, 36, C.yl, fit(s1, 148, 18));
    txt(tr.a, 6, 47, C.dim, fit(tr.a, 148, 11));
    if (AU.playing) AU.an.getByteFrequencyData(AU.data);
    var n = 24, bw = 148 / n, i;
    for (i = 0; i < n; i++) {
      var v = AU.playing ? AU.data[i + 1] / 255 : 0.08 + 0.04 * Math.sin(t * 2 + i) * A, bh = Math.max(2, v * 42);
      var gr = g.createLinearGradient(0, 96 - bh, 0, 96); gr.addColorStop(0, C.cy); gr.addColorStop(1, '#3a2cff');
      g.fillStyle = gr; g.fillRect(6 + i * bw, 96 - bh, bw - 1.5, bh);
    }
    var dur = 256 * 60 / tr.bpm / 4, pos = AU.step / 256;
    g.fillStyle = C.cy; g.fillRect(6, 101, 148, 7); g.fillStyle = C.track; g.fillRect(7, 102, 146, 5);
    g.fillStyle = C.yl; g.fillRect(7, 102, 146 * pos, 5);
    txt(fmt(pos * dur) + ' / ' + fmt(dur), 6, 124, C.txt, 14);
    tri(100, 114, 8, 10, 'l', C.cy);
    if (AU.playing) { g.fillStyle = C.yl; g.fillRect(118, 113, 3.5, 12); g.fillRect(124, 113, 3.5, 12); } else tri(118, 113, 10, 12, 'r', C.yl);
    tri(137, 114, 8, 10, 'r', C.cy);
    foot('IZQ/DER: TEMA   A: PLAY/PAUSA');
  }
  function pRave(t) {
    var y = 30; wrap(T_RAVE, 148, 13).forEach(function (l) { txt(l, 6, y, C.txt, 13); y += 12; });
    var lv = 0, i, j;
    if (AU.playing) { AU.an.getByteFrequencyData(AU.data); for (i = 1; i < 11; i++) lv += AU.data[i]; lv /= 2550; }
    var amp = 4 + lv * 16;
    for (j = 0; j < 4; j++) for (i = 0; i < 37; i++) {
      var x = 6 + i * 4, h = Math.sin(i * 0.5 + t * 2.4 * A + j * 0.9) * amp * (1 - j * 0.15), yy = 100 + j * 8 + h * 0.5;
      var u = Math.max(0, Math.min(1, (h + amp) / (2 * amp)));
      g.fillStyle = u < 0.5 ? C.bar : (u < 0.8 ? C.cy : '#ffffff'); g.globalAlpha = 1 - j * 0.18; g.fillRect(x, yy, 2.5, 2.5);
    }
    g.globalAlpha = 1;
    foot('ACTIVÁ EL SONIDO EN MÚSICA');
  }
  function pJuegos() {
    var gm = GAMES[ST.game];
    g.textAlign = 'center';
    var y = 40; wrap(gm[0].toUpperCase(), 118, 16).forEach(function (l) { txt(l, 80, y, C.yl, 16, 'center'); y += 14; });
    y = Math.max(y + 8, 66);
    wrap(gm[1], 136, 13).forEach(function (l) { txt(l, 80, y, C.txt, 13, 'center'); y += 12; });
    tri(6, 34, 6, 10, 'l', C.cy); tri(148, 34, 6, 10, 'r', C.cy);
    GAMES.forEach(function (_, i) { g.fillStyle = i === ST.game ? C.yl : C.track; g.fillRect(80 + (i - 1.5) * 10 - 3, 120, 6, 6); });
    foot('IZQ/DER: CAMBIAR   B: ATRÁS');
  }
  function paint(now) {
    chrome(); var t = now / 1000;
    ({ menu: pMenu, perfil: pPerfil, stats: pStats, musica: pMusica, rave: pRave, juegos: pJuegos })[ST.page](ST.page === 'stats' ? now : t);
  }

  /* ---------- navegación ---------- */
  function announce() {
    var s = '';
    if (ST.page === 'menu') s = 'Menú: ' + MENU[ST.sel][0] + ', opción ' + (ST.sel + 1) + ' de ' + MENU.length;
    else if (ST.page === 'perfil') s = 'Perfil. Tomás Estévez. ' + T_PERFIL.join(' ');
    else if (ST.page === 'stats') s = 'Stats. ' + STATS.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ');
    else if (ST.page === 'musica') s = 'Música: ' + TRACKS[AU.idx].n + ', ' + (AU.playing ? 'reproduciendo' : 'en pausa');
    else if (ST.page === 'rave') s = 'Rave y VJ. ' + T_RAVE;
    else if (ST.page === 'juegos') s = 'Juego favorito ' + (ST.game + 1) + ' de ' + GAMES.length + ': ' + GAMES[ST.game][0] + '. ' + GAMES[ST.game][1];
    srEl.textContent = s;
  }
  function open(p) {
    if (p === 'proyectos') { var el = document.getElementById('proyectos'); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    ST.page = p; ST.t0 = performance.now(); markDirty(); announce();
  }
  function back() { if (ST.page !== 'menu') open('menu'); }
  function press(b) {
    var p = ST.page;
    if (b === 'select') back();
    else if (b === 'start') open('proyectos');
    else if (b === 'b') back();
    else if (p === 'menu') {
      if (b === 'up') ST.sel = (ST.sel + MENU.length - 1) % MENU.length;
      else if (b === 'down') ST.sel = (ST.sel + 1) % MENU.length;
      else if (b === 'a' || b === 'right') open(MENU[ST.sel][1]);
      markDirty(); announce();
    } else if (p === 'musica') {
      if (b === 'a') { AU.playing ? pause() : play(); } else if (b === 'right') go(1); else if (b === 'left') go(-1);
      announce();
    } else if (p === 'juegos') {
      if (b === 'right' || b === 'a') ST.game = (ST.game + 1) % GAMES.length; else if (b === 'left') ST.game = (ST.game + GAMES.length - 1) % GAMES.length;
      markDirty(); announce();
    } else if (b === 'left') back();
    nudge = 1;
  }

  /* ---------- textura: foto del Game Boy + pantalla en vivo ---------- */
  var S = 2, TS = 1024 * S, baseCv, texCv, tx, tex, nudge = 0;
  // zonas de los botones en coordenadas del modelo (x derecha, y arriba, z frente)
  var BTN = {
    dpad: { x: -0.229, y: -0.066, z: 0.209, r: 0.098 }, a: { x: 0.32, y: -0.049, z: 0.213, r: 0.058 }, b: { x: 0.183, y: -0.112, z: 0.213, r: 0.058 },
    select: { x: -0.061, y: -0.302, z: 0.199, w: 0.11, h: 0.06 }, start: { x: 0.066, y: -0.296, z: 0.199, w: 0.11, h: 0.06 }
  };
  function hitTest(p) {
    if (p.z < 0.1) return null; // sólo el frente
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
  var fx, fxUntil = 0;
  function flash(id) { // resaltado 3D del botón apretado
    if (!fx) return;
    var o = BTN[(id === 'left' || id === 'right' || id === 'up' || id === 'down') ? 'dpad' : id], x = o.x, y = o.y, w, h;
    if (o === BTN.dpad) {
      var vert = id === 'up' || id === 'down', sg = (id === 'right' || id === 'up') ? 1 : -1;
      w = vert ? 0.052 : 0.09; h = vert ? 0.09 : 0.052; x += vert ? 0 : sg * 0.052; y += vert ? sg * 0.052 : 0; fx.geometry = fx.userData.box;
    } else if (o.r) { w = h = o.r * 1.5; fx.geometry = fx.userData.disc; }
    else { w = 0.09; h = 0.042; fx.geometry = fx.userData.box; }
    fx.position.set(x, y, o.z + 0.012); fx.scale.set(w, h, 1); fx.visible = true; fxUntil = performance.now() + 150;
  }
  function blit() {
    tx.save(); tx.translate(151.5 * S, 567 * S); tx.rotate(Math.PI / 2); tx.scale(-1, 1);
    tx.scale(182 * S / (LW * K), 161 * S / (LH * K)); tx.drawImage(scr, -LW * K / 2, -LH * K / 2); tx.restore();
    tex.needsUpdate = true;
  }

  /* ---------- escena 3D ---------- */
  var T = window.THREE, r, scene, cam, rootG, model, mesh, SIZE, ray, ready = false, vis = true;
  var px = 0, py = 0, spin = 0, spinV = 0, drag = false, moved = 0, lastX = 0, cx = 0, cy = 0, last = performance.now(), lastPaint = 0, lastMin = -1;

  function fail(msg) { root.classList.add('no3d'); if (loadEl) { loadEl.textContent = msg; } }
  function b64buf(b64) { var s = atob(b64), n = s.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = s.charCodeAt(i); return u.buffer; }

  function size() {
    if (!r || !SIZE) return;
    var w = visor.clientWidth, h = visor.clientHeight; if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    var tn = Math.tan(cam.fov * Math.PI / 360), dH = (SIZE.y * 1.12 / 2) / tn, dW = (SIZE.x * 1.15 / 2) / (tn * cam.aspect);
    cam.position.z = Math.max(dH, dW) + SIZE.z / 2;
  }
  function pointerNDC(e) { var b = r.domElement.getBoundingClientRect(); return new T.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); }
  function hitAt(e) {
    if (!ready) return null;
    scene.updateMatrixWorld(true); ray.setFromCamera(pointerNDC(e), cam);
    var h = ray.intersectObject(mesh, false)[0]; return h ? hitTest(model.worldToLocal(h.point.clone())) : null;
  }

  function init() {
    if (!T || !T.GLTFLoader || !window.GB_GLB_B64) return fail('No se pudo cargar el Game Boy 3D.');
    try { r = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return fail('Tu navegador no soporta WebGL.'); }
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding;
    visor.appendChild(r.domElement); r.domElement.setAttribute('aria-hidden', 'true');
    scene = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, 0.1, 60); ray = new T.Raycaster();
    rootG = new T.Group(); scene.add(rootG);
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
    }, function () { fail('No se pudo cargar el Game Boy 3D.'); });

    addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(visor);
    addEventListener('pointermove', function (e) {
      var b = visor.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / 350));
      py = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / 260));
      if (drag) { spinV = (e.clientX - lastX) * 0.012; spin += spinV; moved += Math.abs(e.clientX - lastX); lastX = e.clientX; }
      else if (ready && e.target === r.domElement) visor.style.cursor = hitAt(e) ? 'pointer' : 'grab';
    });
    visor.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; try { visor.setPointerCapture(e.pointerId); } catch (x) {} });
    addEventListener('pointerup', function (e) {
      if (drag && moved < 6) { var h = hitAt(e); if (h) { press(h); flash(h); } }
      drag = false;
    });
    visor.addEventListener('keydown', function (e) {
      var m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a', ' ': 'a', z: 'a', Z: 'a', Escape: 'b', Backspace: 'b', x: 'b', X: 'b' }[e.key];
      if (!m) return; e.preventDefault(); press(m); flash(m);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (!vis && AU.playing) pause(); }).observe(visor);
    document.addEventListener('visibilitychange', function () { if (document.hidden && AU.playing) pause(); });
    if (document.fonts) { document.fonts.load('16px VT323').then(markDirty, function () {}); document.fonts.ready.then(markDirty); }
    requestAnimationFrame(loop);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready || !vis) return;
    var t = now / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    var mn = new Date().getMinutes(); if (mn !== lastMin) { lastMin = mn; dirty = true; }
    var anim = ST.page === 'musica' || ST.page === 'rave' || (ST.page === 'stats' && now - ST.t0 < 800);
    if (dirty || (anim && now - lastPaint > 40)) { paint(now); blit(); dirty = false; lastPaint = now; }
    var beat = AU.playing ? Math.sin(t * (TRACKS[AU.idx].bpm / 60) * Math.PI * 2) : 0;
    if (!drag) { spinV *= 0.92; spin += spinV; spin *= 0.95; }
    rootG.rotation.y += (spin + px * 0.35 * A - rootG.rotation.y) * 0.12;
    rootG.rotation.x += (py * 0.16 * A - rootG.rotation.x) * 0.12;
    rootG.position.y = Math.sin(t * 1.6) * 0.02 * A;
    if (fx && fx.visible && now > fxUntil) fx.visible = false;
    nudge *= 0.85;
    rootG.scale.setScalar(1 - nudge * 0.02 + Math.abs(beat) * 0.01 * A);
    r.render(scene, cam);
  }
  init();
})();
