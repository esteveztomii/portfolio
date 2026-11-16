/* HOME estilo 3DS · personaje 3D (three.js r128) · modos: perfil, música, pokémon, rave, gaming */
(function () {
  'use strict';
  var root = document.getElementById('home');
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, A = reduce ? 0 : 1;
  var NAMES = { perfil: 'Perfil', musica: 'Música', pokemon: 'Pokémon', rave: 'Rave / VJ', gaming: 'Gaming' };

  /* ---------- reloj ---------- */
  var clk = $('#h-clock');
  function tick() { clk.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  tick(); setInterval(tick, 15000);

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
      if (AU.step >= 256) { AU.step = 0; AU.idx = (AU.idx + 1) % TRACKS.length; tr = TRACKS[AU.idx]; sp = 60 / tr.bpm / 4; showTrack(); }
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
    syncPlay();
  }
  function pause() { if (!AU.ctx) return; AU.playing = false; AU.ctx.suspend(); syncPlay(); }
  function go(d) {
    AU.idx = (AU.idx + d + TRACKS.length) % TRACKS.length; AU.step = 0;
    if (AU.ctx) AU.next = AU.ctx.currentTime + 0.06;
    showTrack(); if (!AU.playing) play();
  }
  var elT = $('#p-title'), elA = $('#p-art'), elPlay = $('#p-play'), elBar = $('#p-bar'), elTm = $('#p-time'), note = $('#h-note');
  function showTrack() { elT.textContent = TRACKS[AU.idx].n; elA.textContent = TRACKS[AU.idx].a; }
  function syncPlay() { elPlay.textContent = AU.playing ? '❚❚' : '▶'; elPlay.setAttribute('aria-label', AU.playing ? 'Pausa' : 'Reproducir'); note.hidden = !AU.playing; }
  var fmt = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  elPlay.addEventListener('click', function () { AU.playing ? pause() : play(); });
  $('#p-next').addEventListener('click', function () { go(1); });
  $('#p-prev').addEventListener('click', function () { go(-1); });
  showTrack();

  var viz = $('#p-viz'), vx = viz.getContext('2d');
  function drawViz(t) {
    var w = viz.width, h = viz.height, n = 24, bw = w / n; vx.clearRect(0, 0, w, h);
    if (AU.playing) AU.an.getByteFrequencyData(AU.data);
    var sum = 0;
    for (var i = 0; i < n; i++) {
      var v = AU.playing ? AU.data[i + 1] / 255 : 0.08 + 0.04 * Math.sin(t * 2 + i) * A;
      if (i < 10) sum += v;
      var bh = Math.max(3, v * h), g = vx.createLinearGradient(0, h - bh, 0, h);
      g.addColorStop(0, '#38b6ff'); g.addColorStop(1, '#1a00d4');
      vx.fillStyle = g; vx.fillRect(i * bw + 1, h - bh, bw - 3, bh);
    }
    AU.lvl = AU.playing ? sum / 10 : 0;
  }

  /* ---------- mundo 3D ---------- */
  function initWorld(el) {
    var T = window.THREE; if (!T) return null;
    var r; try { r = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return null; }
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); el.appendChild(r.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, 0.1, 60); cam.position.set(0, 0.1, 9.2);
    var hemi = new T.HemisphereLight(0xffffff, 0x8fb8e8, 0.95), sun = new T.DirectionalLight(0xffffff, 0.8);
    sun.position.set(3, 5, 6); scene.add(hemi); scene.add(sun);
    var M = function (c, ro) { return new T.MeshStandardMaterial({ color: c, roughness: ro == null ? 0.7 : ro }); };
    var mSkin = M(0xe8b48f, 0.8), mHair = M(0x2b1b15, 0.9), mShirt = M(0xeaf4ff, 0.9), mJean = M(0xa9cdf0, 0.85), mShoe = M(0xffffff, 0.7), mDark = M(0x1c1530, 0.4);
    var rootG = new T.Group(), body = new T.Group(); scene.add(rootG); rootG.add(body);
    function mesh(g, m, x, y, z, p) { var o = new T.Mesh(g, m); o.position.set(x, y, z); (p || body).add(o); return o; }
    // piernas y zapatillas
    [-1, 1].forEach(function (s) {
      mesh(new T.CylinderGeometry(0.25, 0.23, 0.95, 16), mJean, s * 0.3, -1.2, 0);
      mesh(new T.SphereGeometry(0.3, 16, 12), mShoe, s * 0.3, -1.72, 0.14).scale.set(1, 0.55, 1.4);
    });
    // torso oversize + cuello
    mesh(new T.CylinderGeometry(0.66, 0.84, 1.25, 28), mShirt, 0, -0.15, 0);
    mesh(new T.CylinderGeometry(0.2, 0.2, 0.3, 12), mSkin, 0, 0.5, 0);
    var col = mesh(new T.TorusGeometry(0.3, 0.07, 8, 20), mShirt, 0, 0.46, 0); col.rotation.x = Math.PI / 2;
    // brazos con pivote en el hombro
    var arms = [];
    [-1, 1].forEach(function (s) {
      var p = new T.Group(); p.position.set(s * 0.85, 0.3, 0); body.add(p);
      mesh(new T.CylinderGeometry(0.22, 0.27, 0.8, 14), mShirt, 0, -0.4, 0, p);
      mesh(new T.CylinderGeometry(0.14, 0.14, 0.4, 12), mSkin, 0, -0.95, 0, p);
      mesh(new T.SphereGeometry(0.17, 12, 10), mSkin, 0, -1.15, 0, p);
      arms.push(p);
    });
    // cabeza
    var head = new T.Group(); head.position.set(0, 1.1, 0); body.add(head);
    mesh(new T.SphereGeometry(0.86, 32, 24), mSkin, 0, 0, 0, head).scale.set(1, 0.95, 0.95);
    mesh(new T.SphereGeometry(0.9, 28, 20), mHair, 0, 0.38, -0.18, head).scale.set(1, 0.75, 0.95);
    for (var i = -3; i <= 3; i++) { var a = i * 0.4; mesh(new T.SphereGeometry(0.27, 12, 10), mHair, Math.sin(a) * 0.7, 0.52 + Math.cos(a) * 0.18, Math.cos(a) * 0.5 + 0.12, head); }
    [-1, 1].forEach(function (s) {
      mesh(new T.SphereGeometry(0.15, 12, 10), mSkin, s * 0.84, -0.02, 0, head);
      mesh(new T.SphereGeometry(0.17, 12, 10), M(0xff9ab0, 0.9), s * 0.5, -0.2, 0.66, head).scale.set(1, 0.6, 0.4);
      mesh(new T.BoxGeometry(0.26, 0.05, 0.05), mHair, s * 0.3, 0.22, 0.79, head).rotation.z = s * -0.12;
    });
    var eyes = new T.Group(); head.add(eyes);
    [-1, 1].forEach(function (s) {
      mesh(new T.SphereGeometry(0.09, 14, 12), mDark, s * 0.3, 0.02, 0.79, eyes).scale.set(1, 1.35, 0.6);
      mesh(new T.SphereGeometry(0.03, 8, 8), M(0xffffff, 0.2), s * 0.3 + 0.03, 0.08, 0.84, eyes);
    });
    mesh(new T.SphereGeometry(0.07, 10, 8), M(0xd9a07c, 0.8), 0, -0.1, 0.84, head);
    var mouth = mesh(new T.TorusGeometry(0.1, 0.025, 8, 16, Math.PI), M(0x6b2f2f), 0, -0.3, 0.8, head); mouth.rotation.z = Math.PI;

    // accesorios 3D (aparecen/desaparecen por modo)
    var phones = new T.Group(); head.add(phones);
    var band = new T.Mesh(new T.TorusGeometry(1.12, 0.06, 10, 48, Math.PI), M(0x38b6ff, 0.4)); phones.add(band);
    [-1, 1].forEach(function (s) {
      var cup = mesh(new T.CylinderGeometry(0.3, 0.3, 0.22, 24), M(0x38b6ff, 0.4), s * 1.12, 0, 0, phones); cup.rotation.z = Math.PI / 2;
      var cap = mesh(new T.CylinderGeometry(0.17, 0.17, 0.05, 20), M(0xffffff, 0.3), s * 1.24, 0, 0, phones); cap.rotation.z = Math.PI / 2;
    });
    var visor = new T.Group(); head.add(visor); visor.position.y = 0.02;
    var vm = new T.MeshStandardMaterial({ color: 0x07070f, roughness: 0.2, metalness: 0.6, side: T.DoubleSide });
    visor.add(new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.34, 28, 1, true, -1, 2), vm));
    visor.add(new T.Mesh(new T.CylinderGeometry(0.915, 0.915, 0.06, 28, 1, true, -1, 2), new T.MeshBasicMaterial({ color: 0x38b6ff, side: T.DoubleSide })));
    var ball = new T.Group(); arms[1].add(ball); ball.position.set(0, -1.5, 0.02); ball.rotation.x = 1.45;
    mesh(new T.SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8202a, 0.35), 0, 0, 0, ball);
    mesh(new T.SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xffffff, 0.35), 0, 0, 0, ball);
    mesh(new T.TorusGeometry(0.3, 0.03, 8, 32), mDark, 0, 0, 0, ball).rotation.x = Math.PI / 2;
    var bb = mesh(new T.CylinderGeometry(0.09, 0.09, 0.06, 16), M(0xffffff, 0.3), 0, 0, 0.3, ball); bb.rotation.x = Math.PI / 2;
    var pad = new T.Group(); body.add(pad); pad.position.set(0, -0.22, 1.02);
    var shell = M(0x38b6ff, 0.4);
    mesh(new T.BoxGeometry(1.5, 0.28, 0.55), shell, 0, 0, 0, pad);
    [-1, 1].forEach(function (s) { mesh(new T.BoxGeometry(0.4, 0.3, 0.7), shell, s * 0.75, -0.05, 0.05, pad); });
    mesh(new T.CylinderGeometry(0.09, 0.09, 0.1, 12), mDark, -0.5, 0.2, -0.05, pad);
    mesh(new T.CylinderGeometry(0.09, 0.09, 0.1, 12), mDark, 0.22, 0.2, -0.12, pad);
    mesh(new T.BoxGeometry(0.2, 0.06, 0.07), mDark, -0.2, 0.17, 0.12, pad); mesh(new T.BoxGeometry(0.07, 0.06, 0.2), mDark, -0.2, 0.17, 0.12, pad);
    [[0.5, 0.06], [0.64, 0], [0.5, -0.06], [0.36, 0]].forEach(function (p, k) { mesh(new T.SphereGeometry(0.05, 8, 8), M([0xfff94a, 0xe8202a, 0x16d93a, 0xff6bff][k], 0.4), p[0], 0.17, p[1] + 0.1, pad); });
    var acc = { phones: { o: phones, s: 0, t: 0 }, ball: { o: ball, s: 0, t: 0 }, pad: { o: pad, s: 0, t: 0 }, visor: { o: visor, s: 0, t: 0 } };
    Object.keys(acc).forEach(function (k) { acc[k].o.visible = false; });

    // partículas + ondas generativas (rave)
    var N = 80, pp = new Float32Array(N * 3), pv = [];
    for (var n = 0; n < N; n++) { pp[n * 3] = (Math.random() - 0.5) * 9; pp[n * 3 + 1] = (Math.random() - 0.5) * 6; pp[n * 3 + 2] = -3 + Math.random() * 4; pv.push(0.004 + Math.random() * 0.012); }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3));
    var pm = new T.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.9 }); scene.add(new T.Points(pg, pm));
    var GX = 44, GZ = 18, wp = new Float32Array(GX * GZ * 3), wc = new Float32Array(GX * GZ * 3);
    for (var gi = 0; gi < GX; gi++) for (var gj = 0; gj < GZ; gj++) { var k = (gi * GZ + gj) * 3; wp[k] = (gi - GX / 2) * 0.32; wp[k + 1] = -2.3; wp[k + 2] = 1 - gj * 0.45; }
    var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(wp, 3)); wg.setAttribute('color', new T.BufferAttribute(wc, 3));
    var waves = new T.Points(wg, new T.PointsMaterial({ size: 0.075, vertexColors: true })); waves.visible = false; scene.add(waves);

    var OUT = { base: [0xeaf4ff, 0xa9cdf0, 0xffffff], rave: [0x15151c, 0x101018, 0x1c1c26] };
    var CFG = {
      perfil: { pc: 0xffffff, ps: 0.1, acc: [], L: [0, -0.1], R: [0, 2.5] },
      musica: { pc: 0x38b6ff, ps: 0.12, acc: ['phones'], L: [0, -0.1], R: [0, 0.1] },
      pokemon: { pc: 0xffffff, ps: 0.08, acc: ['ball'], L: [0, -0.1], R: [-1.45, 0] },
      rave: { pc: 0x38b6ff, ps: 0.1, acc: ['visor'], L: [0, -2.5], R: [0, 2.5], rave: 1 },
      gaming: { pc: 0x9fc4ff, ps: 0.1, acc: ['pad'], L: [-1.1, 0.12], R: [-1.1, -0.12] }
    };
    var W = { lvl: 0, bpm: 110, playing: false }, mode = 'perfil', cfg = CFG.perfil, tgt = new T.Color();
    var cShirt = new T.Color(OUT.base[0]), cJean = new T.Color(OUT.base[1]), cShoe = new T.Color(OUT.base[2]);
    var px = 0, py = 0, spin = 0, spinV = 0, drag = false, moved = 0, lastX = 0, hover = false, yo = 0, yv = 0, squash = 0, t = 0, last = performance.now(), blink = 3, vis = true;
    W.setMode = function (m) {
      mode = m; cfg = CFG[m]; var o = cfg.rave ? OUT.rave : OUT.base;
      cShirt.setHex(o[0]); cJean.setHex(o[1]); cShoe.setHex(o[2]);
      Object.keys(acc).forEach(function (k) { acc[k].t = cfg.acc.indexOf(k) > -1 ? 1 : 0; });
      pm.color.setHex(cfg.pc); pm.size = cfg.ps; waves.visible = !!cfg.rave;
    };
    W.jump = function () { if (yo > 0.02) return; yv = 0.17; squash = 1; };
    function size() { var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); cam.position.z = w / h < 0.9 ? 11.5 : 9.2; }
    addEventListener('resize', size); size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(el);
    addEventListener('pointermove', function (e) {
      var b = el.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / 350));
      py = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / 260));
      if (drag) { spinV = (e.clientX - lastX) * 0.012; spin += spinV; moved += Math.abs(e.clientX - lastX); lastX = e.clientX; }
    });
    el.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; try { el.setPointerCapture(e.pointerId); } catch (x) {} });
    addEventListener('pointerup', function () { if (drag && moved < 6) W.jump(); drag = false; });
    el.addEventListener('pointerenter', function () { hover = true; }); el.addEventListener('pointerleave', function () { hover = false; });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); W.jump(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(el);

    function frame() {
      var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      var lv = W.lvl, beat = W.playing ? Math.sin(t * (W.bpm / 60) * Math.PI * 2) : 0;
      if (!drag) { spinV *= 0.92; spin += spinV; spin *= 0.97; }
      rootG.rotation.y += (spin + px * 0.25 - rootG.rotation.y) * 0.12;
      head.rotation.y += (px * 0.6 - head.rotation.y) * 0.12;
      var nod = (mode === 'musica' || mode === 'rave') ? (W.playing ? beat * 0.16 : Math.sin(t * 2.2) * 0.06 * A) : 0;
      head.rotation.x += (py * 0.25 + nod - head.rotation.x) * 0.2;
      eyes.position.x += (px * 0.1 - eyes.position.x) * 0.2; eyes.position.y += (-py * 0.06 - eyes.position.y) * 0.2;
      blink -= dt; if (blink < 0) blink = 2.5 + Math.random() * 3; eyes.scale.y = (blink < 0.12 && A) ? 0.1 : 1;
      if (yo > 0 || yv > 0) { yo += yv; yv -= 0.011; if (yo <= 0) { yo = 0; yv = 0; squash = -0.8; } }
      squash *= 0.88;
      var bounce = cfg.rave ? Math.abs(beat) * 0.12 * (W.playing ? 1 : 0.4) : 0, idle = Math.sin(t * 2) * 0.05 * A;
      rootG.position.y = yo + idle + bounce * A;
      var hv = hover ? 0.04 : 0; body.scale.set(1 + squash * 0.16 + hv, 1 - squash * 0.2 - hv * 0.6, 1 + squash * 0.16 + hv);
      // pose de brazos
      var L = cfg.L, Rr = cfg.R, wave = mode === 'perfil' ? Math.sin(t * 7) * 0.3 * A : 0, pulse = cfg.rave ? Math.sin(t * 6) * 0.15 * A : 0;
      arms[0].rotation.x += (L[0] - arms[0].rotation.x) * 0.15; arms[0].rotation.z += (L[1] - pulse - arms[0].rotation.z) * 0.15;
      arms[1].rotation.x += (Rr[0] - arms[1].rotation.x) * 0.15; arms[1].rotation.z += (Rr[1] + wave + pulse - arms[1].rotation.z) * 0.15;
      mShirt.color.lerp(cShirt, 0.12); mJean.color.lerp(cJean, 0.12); mShoe.color.lerp(cShoe, 0.12);
      Object.keys(acc).forEach(function (k) { var a = acc[k]; a.s += (a.t - a.s) * 0.18; a.o.visible = a.s > 0.02; a.o.scale.setScalar(Math.max(a.s, 0.001)); });
      ball.rotation.y += 0.03 * A;
      // luces según modo
      tgt.setHex(cfg.rave ? 0x7fc4ff : 0xffffff); sun.color.lerp(tgt, 0.08);
      tgt.setHex(cfg.rave ? 0x1a00d4 : 0x8fb8e8); hemi.groundColor.lerp(tgt, 0.08);
      // partículas
      for (var n = 0; n < N; n++) { pp[n * 3 + 1] += pv[n] * A; pp[n * 3] += Math.sin(t + n) * 0.002 * A; if (pp[n * 3 + 1] > 3.2) pp[n * 3 + 1] = -3.2; }
      pg.attributes.position.needsUpdate = true;
      if (cfg.rave) {
        var amp = 0.55 + lv * 2.2 + (hover ? 0.3 : 0), cx = px * 4.5, c1 = [0.1, 0, 0.83], c2 = [0.22, 0.71, 1], c3 = [1, 1, 1];
        for (var gi2 = 0; gi2 < GX; gi2++) for (var gj2 = 0; gj2 < GZ; gj2++) {
          var q = (gi2 * GZ + gj2) * 3, x = wp[q], z = wp[q + 2], dx = x - cx;
          var h = Math.sin(x * 1.3 + t * 2.2 * A + z * 0.7) * 0.22 * amp + Math.exp(-(dx * dx) / 1.6) * (0.55 - py * 0.3) * A;
          wp[q + 1] = -2.3 + h; var u = Math.max(0, Math.min(1, (h + 0.2) / 0.9));
          var a2 = u < 0.5 ? c1 : c2, b2 = u < 0.5 ? c2 : c3, f = u < 0.5 ? u * 2 : (u - 0.5) * 2;
          wc[q] = a2[0] + (b2[0] - a2[0]) * f; wc[q + 1] = a2[1] + (b2[1] - a2[1]) * f; wc[q + 2] = a2[2] + (b2[2] - a2[2]) * f;
        }
        wg.attributes.position.needsUpdate = true; wg.attributes.color.needsUpdate = true;
      }
      r.render(scene, cam);
    }
    W.frame = frame; W.visible = function () { return vis; };
    return W;
  }

  var world = initWorld($('#visor'));

  /* ---------- gaming ---------- */
  var GAMES = [
    ['Resident Evil', 'Atmósfera, tensión y diseño sonoro.'],
    ['Marvel Rivals', 'Dinamismo, diseño de personajes y ritmo visual.'],
    ['The Walking Dead (Telltale)', 'Narrativa interactiva y peso de las decisiones.'],
    ['Life is Strange', 'Estética indie, nostalgia y banda sonora.']
  ];
  var gi = 0, gT = $('#g-title'), gD = $('#g-desc'), gN = $('#g-count');
  function showGame(d) { gi = (gi + d + GAMES.length) % GAMES.length; gT.textContent = GAMES[gi][0]; gD.textContent = GAMES[gi][1]; gN.textContent = (gi + 1) + ' / ' + GAMES.length; }
  $('#g-prev').addEventListener('click', function () { showGame(-1); });
  $('#g-next').addEventListener('click', function () { showGame(1); });
  $('[data-card="gaming"]').addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showGame(-1); if (e.key === 'ArrowRight') showGame(1); });
  showGame(0);

  /* ---------- modos / launcher ---------- */
  var slots = $$('.slot[data-m]'), panels = $$('[data-card]'), bgs = $$('.bg'), appName = $('#h-app');
  function setMode(m) {
    root.dataset.mode = m; appName.textContent = NAMES[m];
    slots.forEach(function (b) { var on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    bgs.forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); });
    panels.forEach(function (p) { var on = p.dataset.card === m; p.hidden = !on; p.classList.remove('in'); if (on) { void p.offsetWidth; p.classList.add('in'); } });
    if (m !== 'musica' && m !== 'rave' && AU.playing) pause();
    if (world) { world.setMode(m); world.jump(); }
  }
  slots.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.m); }); });
  setMode('perfil');

  /* ---------- bucle ---------- */
  function loop(now) {
    var t = now / 1000;
    if (AU.ctx && AU.playing) {
      var tr = TRACKS[AU.idx], dur = 256 * 60 / tr.bpm / 4, pos = AU.step / 256;
      elBar.style.width = (pos * 100).toFixed(1) + '%'; elTm.textContent = fmt(pos * dur) + ' / ' + fmt(dur);
      if (world) { world.bpm = tr.bpm; }
    }
    if (world) world.playing = AU.playing;
    var onMusic = root.dataset.mode === 'musica';
    if (onMusic) drawViz(t); else if (AU.an && AU.playing) { AU.an.getByteFrequencyData(AU.data); var s = 0; for (var i = 1; i < 11; i++) s += AU.data[i]; AU.lvl = s / 2550; } else AU.lvl = 0;
    if (world) { world.lvl = AU.lvl; if (world.visible()) world.frame(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
