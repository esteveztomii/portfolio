/* HERO · Game Boy Color 3D (three.js r128 + GLTFLoader)
   La pantallita funciona como una GBC de verdad: menú de íconos, páginas con tu foto "vista desde la consola",
   música (sintetizador propio), visuales, juegos favoritos y stats. Se maneja tocando la pantalla,
   con la cruz / A / B / SELECT / START del modelo, o con el teclado. */
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
  var AU = { ctx: null, an: null, data: null, buf: null, bassF: null, out: null, playing: false, idx: 0, step: 0, next: 0, timer: 0 };
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function osc(type, f, t0, dur, vol, dest) {
    var c = AU.ctx, o = c.createOscillator(), g2 = c.createGain();
    o.type = type; o.frequency.value = f;
    g2.gain.setValueAtTime(0.0001, t0); g2.gain.linearRampToValueAtTime(vol, t0 + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g2); g2.connect(dest || AU.out); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function kick(t0) {
    var c = AU.ctx, o = c.createOscillator(), g2 = c.createGain();
    o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.12);
    g2.gain.setValueAtTime(0.9, t0); g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.26);
    o.connect(g2); g2.connect(AU.out); o.start(t0); o.stop(t0 + 0.3);
  }
  function noise(t0, dur, vol, type, f) {
    var c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g2 = c.createGain();
    s.buffer = AU.buf; fl.type = type; fl.frequency.value = f;
    g2.gain.setValueAtTime(vol, t0); g2.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(fl); fl.connect(g2); g2.connect(AU.out); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
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
    master.connect(AU.an); AU.an.connect(c.destination); AU.out = master;
    AU.bassF = c.createBiquadFilter(); AU.bassF.type = 'lowpass'; AU.bassF.frequency.value = 420; AU.bassF.connect(master);
    AU.timer = setInterval(sched, 25);
    return true;
  }
  function play() { if (!AU.ctx && !initAudio()) return; AU.ctx.resume(); if (!AU.playing) { AU.playing = true; AU.next = AU.ctx.currentTime + 0.06; } markDirty(); }
  function pause() { if (!AU.ctx) return; AU.playing = false; AU.ctx.suspend(); markDirty(); }
  function go(d) { AU.idx = (AU.idx + d + TRACKS.length) % TRACKS.length; AU.step = 0; if (AU.ctx) AU.next = AU.ctx.currentTime + 0.06; markDirty(); if (!AU.playing) play(); }
  var fmt = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

  /* ---------- contenido ---------- */
  var MENU = [ // el nombre sólo lo lee el lector de pantalla: en pantalla van íconos
    ['Perfil', 'perfil'], ['Stats', 'stats'], ['Música', 'musica'], ['Visuales', 'rave'], ['Juegos', 'juegos'], ['Proyectos', 'proyectos']
  ];
  var GAMES = [
    ['Resident Evil', 'Atmósfera, tensión y diseño sonoro.'],
    ['Marvel Rivals', 'Dinamismo, diseño de personajes y ritmo visual.'],
    ['The Walking Dead (Telltale)', 'Narrativa interactiva y peso de las decisiones.'],
    ['Life is Strange', 'Estética indie, nostalgia y banda sonora.']
  ];
  var STATS = [['Motion & Visual', 90], ['Edición & Video', 85], ['Diseño UX/UI', 80], ['Código Creativo', 75]];
  var T_PERFIL = 'Estudiante de Diseño Multimedial en la UNLP, dando mis primeros pasos en proyectos digitales.';
  var T_RAVE = 'Me gustan las raves y la electrónica, y los visuales en vivo que respiran con el sonido. Los armo con TouchDesigner.';
  var ST = { page: 'home', sel: 0, game: 0, t0: 0 };

  /* ---------- pantalla (canvas lógico 160×144, dibujado a 2x) ---------- */
  var LW = 160, LH = 144, K = 2;
  var scr = document.createElement('canvas'); scr.width = LW * K; scr.height = LH * K;
  var g = scr.getContext('2d');
  var C = { bg: '#e9f1f7', ink: '#181830', mid: '#5b6b8c', lt: '#b9c8de', wh: '#ffffff', blue: '#2850c8', red: '#d83828', grn: '#28a038', yel: '#f8c820', pink: '#f878a8', cy: '#38c8f0', skin: '#d9a066', hair: '#1c1512' };
  var FONT = 'VT323, monospace';
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function ell(cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (var dy = -ry; dy <= ry; dy++) { var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + .01)))); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
  }
  function txt(s, x, y, col, px, al) { // texto "grueso" estilo GBC
    g.font = px + 'px ' + FONT; g.fillStyle = col; g.textAlign = al || 'left'; g.textBaseline = 'alphabetic';
    g.fillText(s, x, y); g.fillText(s, x + 0.5, y);
  }
  function panel(x, y, w, h, fill, bord) { // caja con borde de 2px y esquinas cortadas
    bord = bord || C.ink;
    R(x + 1, y, w - 2, h, bord); R(x, y + 1, w, h - 2, bord);
    R(x + 2, y + 1, w - 4, h - 2, fill); R(x + 1, y + 2, w - 2, h - 4, fill);
  }
  function wrap(s, w, px) {
    g.font = px + 'px ' + FONT; var out = [], l = '';
    s.split(' ').forEach(function (wd) { var t = l ? l + ' ' + wd : wd; if (g.measureText(t).width > w && l) { out.push(l); l = wd; } else l = t; });
    out.push(l); return out;
  }
  function fit(s, w, px) { while (px > 8) { g.font = px + 'px ' + FONT; if (g.measureText(s).width <= w) break; px--; } return px; }
  var HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  function heart(x, y, c) { HEART.forEach(function (r, j) { for (var i = 0; i < 7; i++) if (r[i] === 'X') R(x + i, y + j, 1, 1, c); }); }
  function tri(x, y, w, h, dir, col) {
    g.fillStyle = col; g.beginPath();
    if (dir === 'r') { g.moveTo(x, y); g.lineTo(x, y + h); g.lineTo(x + w, y + h / 2); }
    else if (dir === 'l') { g.moveTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h / 2); }
    else { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w / 2, y + h); }
    g.closePath(); g.fill();
  }

  /* ---------- tu foto, "vista desde la Game Boy Color" ---------- */
  var PH = new Image(); PH.onload = markDirty; if (window.GB_FOTO) PH.src = window.GB_FOTO;
  function photo(x, y) { panel(x - 2, y - 2, 88, 67, C.wh); if (PH.complete && PH.naturalWidth) g.drawImage(PH, x, y, 84, 63); }

  /* ---------- íconos (16×16) ---------- */
  function icon(k, cx, cy, t, on) {
    var i, dy;
    if (k === 0) { // carita con anteojos rojos
      ell(cx, cy - 1, 7, 6, C.hair); ell(cx, cy + 1, 5, 5, C.skin);
      R(cx - 6, cy - 1, 5, 3, C.red); R(cx + 2, cy - 1, 5, 3, C.red); R(cx - 1, cy - 1, 3, 1, C.red); R(cx - 5, cy, 3, 1, C.blue); R(cx + 3, cy, 3, 1, C.blue);
      R(cx - 1, cy + 4, 3, 1, '#7a3f2a'); R(cx - 6, cy - 7, 3, 2, C.hair); R(cx + 3, cy - 7, 3, 2, C.hair);
    } else if (k === 1) { // bola roja y blanca
      for (dy = -7; dy <= 7; dy++) { var hw = Math.round(Math.sqrt(49.5 - dy * dy)); R(cx - hw, cy + dy, hw * 2 + 1, 1, C.ink); }
      for (dy = -6; dy <= 6; dy++) { var h2 = Math.round(Math.sqrt(36.5 - dy * dy)); R(cx - h2, cy + dy, h2 * 2 + 1, 1, dy < -1 ? C.red : (dy > 1 ? C.wh : C.ink)); }
      ell(cx, cy, 3, 3, C.ink); ell(cx, cy, 2, 2, C.wh);
    } else if (k === 2) { // ♫
      var b = on ? Math.round(Math.sin(t * 8) * 1) : 0;
      R(cx - 2, cy - 6 + b, 1, 10, C.ink); R(cx + 5, cy - 8 + b, 1, 10, C.ink); R(cx - 2, cy - 7 + b, 8, 2, C.blue);
      ell(cx - 4, cy + 4 + b, 3, 2, C.ink); ell(cx + 3, cy + 2 + b, 3, 2, C.ink);
    } else if (k === 3) { // visuales: onda neón sobre fondo oscuro
      R(cx - 8, cy - 7, 16, 14, C.ink); R(cx - 7, cy - 6, 14, 12, '#10143a');
      var ph = on ? t * 4 : 0;
      for (i = -6; i <= 6; i++) { R(cx + i, cy + Math.round(Math.sin(i * .8 + ph) * 3) - 1, 1, 2, C.cy); R(cx + i, cy + Math.round(Math.sin(i * .8 + ph + 2.2) * 3) + 1, 1, 1, C.pink); }
    } else if (k === 4) { // joystick / control
      R(cx - 8, cy - 4, 16, 9, '#8a94a8'); R(cx - 7, cy - 5, 14, 11, '#8a94a8'); R(cx - 8, cy - 4, 16, 1, '#b9c1d0'); R(cx - 8, cy + 4, 16, 1, '#5a6478');
      R(cx - 6, cy, 5, 1, C.ink); R(cx - 4, cy - 2, 1, 5, C.ink); ell(cx + 3, cy + 1, 1, 1, C.red); ell(cx + 6, cy - 1, 1, 1, C.red);
    } else { // carpeta (baja a proyectos)
      R(cx - 8, cy - 6, 7, 3, '#e0a010'); R(cx - 8, cy - 4, 16, 11, C.yel); R(cx - 8, cy + 5, 16, 2, '#e0a010');
      tri(cx - 3, cy - 1, 6, 4, 'd', C.wh);
    }
  }
  var ICOBOX = function (i) { return { x: 5 + (i % 3) * 52, y: 83 + Math.floor(i / 3) * 30, w: 48, h: 28 }; };

  /* ---------- páginas ---------- */
  function clockStr() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function header(k, now) {
    R(0, 0, LW, 18, C.blue); R(0, 18, LW, 1, C.ink);
    if (k < 0) { for (var i = 0; i < 3; i++) heart(5 + i * 9, 5, C.red); R(0, 0, LW, 0, C.blue); }
    else { panel(3, 1, 20, 16, C.wh); icon(k, 13, 9, now / 1000, false); }
    txt(clockStr(), LW - 5, 13, C.wh, 14, 'right');
    if (AU.playing) { ell(LW - 44, 11, 2, 1, C.yel); R(LW - 43, 4, 1, 7, C.yel); R(LW - 43, 4, 3, 1, C.yel); }
  }
  function typed(s, now) { var n = reduce ? 9999 : Math.floor((now - ST.t0) / 28); return s.slice(0, Math.max(0, n)); }

  function pHome(now) {
    var t = now / 1000;
    R(0, 0, LW, 12, C.blue); R(0, 12, LW, 1, C.ink);
    for (var i = 0; i < 3; i++) heart(5 + i * 9, 3, C.red);
    txt(clockStr(), LW - 5, 10, C.wh, 12, 'right');
    if (AU.playing) { ell(LW - 38, 8, 2, 1, C.yel); R(LW - 37, 2, 1, 6, C.yel); R(LW - 37, 2, 3, 1, C.yel); }
    photo(6, 16);
    panel(96, 14, 60, 66, C.wh);
    txt('TOMÁS', 102, 31, C.ink, 16); txt('ESTÉVEZ', 102, 42, C.ink, 12); R(102, 46, 48, 1, C.lt);
    txt('Diseño', 102, 57, C.mid, 10); txt('Multimedial', 102, 66, C.mid, 10); txt('UNLP', 102, 76, C.red, 10);
    MENU.forEach(function (m, k) {
      var b = ICOBOX(k), on = k === ST.sel;
      if (on) { panel(b.x - 1, b.y - 1, b.w + 2, b.h + 2, C.red); panel(b.x + 1, b.y + 1, b.w - 2, b.h - 2, '#fff2b8'); }
      else panel(b.x, b.y, b.w, b.h, C.wh);
      icon(k, b.x + 24, b.y + 14 + (on && !reduce && Math.floor(t * 3) % 2 ? -1 : 0), t, on);
    });
  }
  function pPerfil(now) {
    header(0, now); photo(6, 24);
    panel(96, 22, 60, 66, C.wh);
    txt('TOMÁS', 102, 39, C.ink, 16); txt('ESTÉVEZ', 102, 50, C.ink, 12); R(102, 54, 48, 1, C.lt);
    txt('UI/UX', 102, 65, C.blue, 10); txt('Video', 102, 74, C.red, 10); txt('Motion', 102, 83, C.grn, 10);
    panel(4, 92, 152, 50, C.wh);
    var ls = wrap(T_PERFIL, 140, 11), s = typed(T_PERFIL, now), shown = 0;
    ls.forEach(function (l, k) { var part = s.slice(shown, shown + l.length + 1).slice(0, l.length); shown += l.length + 1; txt(part, 9, 104 + k * 9, C.ink, 11); });
  }
  function pStats(now) {
    header(1, now);
    panel(4, 22, 152, 22, C.wh); txt('TOMÁS E.', 10, 38, C.ink, 14); panel(88, 26, 64, 14, C.yel); txt('TIPO MULTIMEDIA', 120, 36, C.ink, 10, 'center');
    var e = Math.min(1, (now - ST.t0) / 700); e = 1 - Math.pow(1 - e, 3);
    STATS.forEach(function (s, i) {
      var y = 49 + i * 22;
      txt(s[0].toUpperCase(), 6, y + 8, C.ink, 11); txt(String(s[1]), 154, y + 8, C.blue, 11, 'right');
      R(5, y + 11, 150, 7, C.ink); R(6, y + 12, 148, 5, C.lt);
      var w = Math.round(148 * s[1] / 100 * e); R(6, y + 12, w, 5, s[1] >= 85 ? C.grn : C.yel); R(6, y + 12, w, 1, C.wh);
    });
    txt('PASIVA: MODO NOCTURNO', 80, 141, C.mid, 10, 'center');
  }
  function pMusica(now) {
    var t = now / 1000, tr = TRACKS[AU.idx], i;
    header(2, now);
    var s1 = tr.n.toUpperCase(); txt(s1, 6, 33, C.ink, fit(s1, 148, 16)); txt(tr.a, 6, 43, C.mid, fit(tr.a, 148, 10));
    panel(4, 47, 152, 42, C.ink); R(6, 49, 148, 38, '#0c1030');
    if (AU.playing) AU.an.getByteFrequencyData(AU.data);
    var n = 24, bw = 6;
    for (i = 0; i < n; i++) {
      var v = AU.playing ? AU.data[i + 1] / 255 : 0.1 + 0.05 * Math.sin(t * 2 + i) * A, bh = Math.max(2, Math.round(v * 34 / 2) * 2);
      for (var yy = 0; yy < bh; yy += 2) R(8 + i * bw, 85 - yy - 2, bw - 1, 2, yy < 18 ? C.grn : (yy < 28 ? C.yel : C.red));
    }
    var dur = 256 * 60 / tr.bpm / 4, pos = AU.step / 256;
    R(5, 94, 150, 7, C.ink); R(6, 95, 148, 5, C.lt); R(6, 95, Math.round(148 * pos), 5, C.blue);
    txt(fmt(pos * dur) + ' / ' + fmt(dur), 6, 118, C.ink, 13);
    panel(88, 105, 66, 22, C.wh);
    tri(94, 111, 8, 10, 'l', C.blue); R(95, 111, 2, 10, C.blue);
    if (AU.playing) { R(116, 110, 4, 12, C.red); R(122, 110, 4, 12, C.red); } else tri(116, 110, 10, 12, 'r', C.grn);
    tri(140, 111, 8, 10, 'r', C.blue); R(147, 111, 2, 10, C.blue);
    txt('◄ ►', 80, 141, C.mid, 10, 'center');
  }
  function pRave(now) {
    var t = now / 1000, i, j;
    header(3, now);
    var ls = wrap(T_RAVE, 144, 11), s = typed(T_RAVE, now), shown = 0;
    ls.forEach(function (l, k) { var part = s.slice(shown, shown + l.length + 1).slice(0, l.length); shown += l.length + 1; txt(part, 6, 32 + k * 9, C.ink, 11); });
    panel(4, 84, 152, 56, C.ink); R(6, 86, 148, 52, '#0c1030');
    var lv = 0; if (AU.playing) { AU.an.getByteFrequencyData(AU.data); for (i = 1; i < 11; i++) lv += AU.data[i]; lv /= 2550; }
    var amp = 4 + lv * 14;
    for (j = 0; j < 4; j++) for (i = 0; i < 36; i++) {
      var x = 8 + i * 4, h = Math.sin(i * 0.5 + t * 2.4 * A + j * 0.9) * amp, yy = 100 + j * 8 + h * 0.5;
      var u = Math.max(0, Math.min(1, (h + amp) / (2 * amp)));
      R(x, Math.round(yy), 3, 3, u < 0.45 ? C.blue : (u < 0.8 ? C.cy : (j % 2 ? C.pink : C.wh)));
    }
  }
  function pJuegos(now) {
    var gm = GAMES[ST.game], k;
    header(4, now);
    // cartucho
    var cx = 10, cy = 26, cc = [C.red, C.blue, C.grn, C.pink][ST.game];
    R(cx, cy, 24, 28, C.ink); R(cx + 1, cy + 1, 22, 26, '#9aa3b5'); R(cx + 4, cy + 4, 16, 12, cc); R(cx + 4, cy + 4, 16, 2, C.wh); R(cx + 5, cy + 19, 14, 2, C.ink); R(cx + 5, cy + 23, 14, 1, '#5a6478');
    var y = 33; wrap(gm[0].toUpperCase(), 100, 14).forEach(function (l) { txt(l, 42, y, C.ink, 14); y += 12; });
    panel(4, 64, 152, 52, C.wh);
    var yy = 78; wrap(gm[1], 138, 12).forEach(function (l) { txt(l, 10, yy, C.ink, 12); yy += 11; });
    tri(8, 124, 7, 11, 'l', C.blue); tri(145, 124, 7, 11, 'r', C.blue);
    GAMES.forEach(function (_, i) { panel(80 + (i - 1.5) * 14 - 5, 125, 10, 10, i === ST.game ? C.yel : C.wh); });
  }
  function paint(now) {
    g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
    R(0, 0, LW, LH, C.bg);
    ({ home: pHome, perfil: pPerfil, stats: pStats, musica: pMusica, rave: pRave, juegos: pJuegos })[ST.page](now);
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = lcd(); g.fillRect(0, 0, LW * K, LH * K); // rejilla LCD
  }
  var lcdPat; function lcd() {
    if (lcdPat) return lcdPat;
    var c = document.createElement('canvas'); c.width = c.height = 2; var x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,40,.075)'; x.fillRect(1, 0, 1, 2); x.fillRect(0, 1, 2, 1);
    return (lcdPat = g.createPattern(c, 'repeat'));
  }

  /* ---------- navegación ---------- */
  function announce() {
    var s = '', p = ST.page;
    if (p === 'home') s = 'Menú: ' + MENU[ST.sel][0] + ', opción ' + (ST.sel + 1) + ' de ' + MENU.length;
    else if (p === 'perfil') s = 'Perfil. Tomás Estévez. ' + T_PERFIL;
    else if (p === 'stats') s = 'Stats. ' + STATS.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ');
    else if (p === 'musica') s = 'Música: ' + TRACKS[AU.idx].n + ', ' + (AU.playing ? 'reproduciendo' : 'en pausa');
    else if (p === 'rave') s = 'Visuales. ' + T_RAVE;
    else s = 'Juego favorito ' + (ST.game + 1) + ' de ' + GAMES.length + ': ' + GAMES[ST.game][0] + '. ' + GAMES[ST.game][1];
    srEl.textContent = s;
  }
  function open(p) {
    if (p === 'proyectos') { var el = document.getElementById('proyectos'); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    ST.page = p; ST.t0 = performance.now(); markDirty(); announce();
  }
  function back() { if (ST.page !== 'home') open('home'); }
  function press(b) {
    var p = ST.page;
    if (b === 'start') open('proyectos');
    else if (b === 'select' || b === 'b') back();
    else if (p === 'home') {
      if (b === 'right') ST.sel = (ST.sel + 1) % 6; else if (b === 'left') ST.sel = (ST.sel + 5) % 6; else if (b === 'up' || b === 'down') ST.sel = (ST.sel + 3) % 6;
      if (b === 'a') open(MENU[ST.sel][1]); else { markDirty(); announce(); }
    } else if (p === 'musica') {
      if (b === 'a') { AU.playing ? pause() : play(); } else if (b === 'right') go(1); else if (b === 'left') go(-1); announce();
    } else if (p === 'juegos') {
      if (b === 'right' || b === 'a') ST.game = (ST.game + 1) % GAMES.length; else if (b === 'left') ST.game = (ST.game + GAMES.length - 1) % GAMES.length;
      markDirty(); announce();
    } else if (b === 'left') back();
    nudge = 1;
  }
  function tap(x, y) { // toque directo sobre la pantallita (0..160 × 0..144)
    var i, p = ST.page;
    if (p === 'home') { for (i = 0; i < 6; i++) { var b = ICOBOX(i); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { ST.sel = i; open(MENU[i][1]); return true; } } return false; }
    if (y < 19 && x < 30) { back(); return true; }
    if (p === 'musica' && y > 100 && y < 130) { press(x < 108 ? 'left' : (x > 134 ? 'right' : 'a')); return true; }
    if (p === 'juegos' && y > 60) { press(x < 80 ? 'left' : 'right'); return true; }
    if (y > 19) { if (p === 'musica') return false; back(); return true; }
    return false;
  }

  /* ---------- textura: foto del Game Boy + pantalla en vivo ---------- */
  var S = 2, TS = 1024 * S, baseCv, texCv, tx, tex, nudge = 0;
  var BTN = { // botones (coordenadas del modelo)
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
  function screenUV(u, v) { // textura (rotada 90° y espejada) → pantallita
    var a = u * 1024, b = v * 1024;
    if (a < 70 || a > 233 || b < 475 || b > 659) return null;
    return { x: -(b - 567) / (182 / 160) + 80, y: -(a - 151.5) / (161 / 144) + 72 };
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
  var px = 0, py = 0, spin = 0, spinV = 0, drag = false, moved = 0, lastX = 0, lastPaint = 0;

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
    var lp = model.worldToLocal(h.point.clone()), b = hitTest(lp); if (b) return { b: b };
    var s = h.uv && lp.z > 0.1 ? screenUV(h.uv.x, h.uv.y) : null; return s ? { s: s } : null;
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
      else if (ready && e.target === r.domElement) { var h = hitAt(e); visor.style.cursor = (h && (h.b || h.s)) ? 'pointer' : 'grab'; }
    });
    visor.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; try { visor.setPointerCapture(e.pointerId); } catch (x) {} });
    addEventListener('pointerup', function (e) {
      if (drag && moved < 6) { var h = hitAt(e); if (h && h.b) { press(h.b); flash(h.b); } else if (h && h.s && tap(h.s.x, h.s.y)) nudge = .6; }
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
    if (!ready || !vis || document.hidden) return;
    var t = now / 1000, p = ST.page;
    var typing = (p === 'perfil' && now - ST.t0 < T_PERFIL.length * 28 + 100) || (p === 'rave' && now - ST.t0 < T_RAVE.length * 28 + 100);
    var every = typing ? 36 : (p === 'musica' || p === 'rave' || (p === 'stats' && now - ST.t0 < 800)) ? 70 : 280;
    if (dirty || (!reduce && now - lastPaint > every)) { paint(now); blit(); dirty = false; lastPaint = now; }
    if (!drag) { spinV *= 0.92; spin += spinV; spin *= 0.95; }
    rootG.rotation.y += (spin + px * 0.35 * A - rootG.rotation.y) * 0.12;
    rootG.rotation.x += (py * 0.16 * A - rootG.rotation.x) * 0.12;
    rootG.position.y = Math.sin(t * 1.6) * 0.02 * A;
    var beat = AU.playing ? Math.sin(t * (TRACKS[AU.idx].bpm / 60) * Math.PI * 2) : 0;
    if (fx && fx.visible && now > fxUntil) fx.visible = false;
    nudge *= 0.85; rootG.scale.setScalar(1 - nudge * 0.02 + Math.abs(beat) * 0.01 * A);
    r.render(scene3, cam);
  }
  init();
})();
