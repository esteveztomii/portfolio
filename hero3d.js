import * as THREE from 'three';

/* ============ CONFIG: editá acá ============ */
const TRACKS = [
  { t: 'Canción 1', a: 'Artista', src: 'assets/audio/01.mp3' },
  { t: 'Canción 2', a: 'Artista', src: 'assets/audio/02.mp3' },
  { t: 'Canción 3', a: 'Artista', src: 'assets/audio/03.mp3' },
  { t: 'Canción 4', a: 'Artista', src: 'assets/audio/04.mp3' },
  { t: 'Canción 5', a: 'Artista', src: 'assets/audio/05.mp3' },
];
const GAMES = [
  { n: 'Resident Evil', c: '#8a1414', c2: '#2a0a0a', note: 'Survival horror. Tensión, puzzles y pasillos.' },
  { n: 'Marvel Rivals', c: '#f0b323', c2: '#a11d2e', note: 'Hero shooter en equipo, puro color.' },
  { n: 'The Walking Dead', c: '#6f8a55', c2: '#1d2318', note: 'Telltale: decisiones que duelen.' },
  { n: 'Life is Strange', c: '#33b3b0', c2: '#a45bd6', note: 'Historias, música y viajes en el tiempo.' },
];
const STATS = [['Diseño', 90], ['Programación', 62], ['Motion', 80], ['Video', 85], ['UX/UI', 75]];
const LINES = ['¡Auch, cosquillas! 🌸', '¿Viste mis proyectos? ↓', '¡Yupi! ⭐', 'Hay más abajo, scrolleá', '¡Hola otra vez! 👋'];

const MODES = {
  base:    { bg: 0x9fdcf5, gr: 0x7ec850, x: 0,    say: '¡Hola! Soy Tomás Estévez 🌸' },
  music:   { bg: 0xf4b6d6, gr: 0xe59ac4, x: 0,    say: 'Auriculares puestos 🎧 ¡dale play!' },
  pokemon: { bg: 0xbfe8a4, gr: 0x62bb45, x: -1.05, say: '¡Mi compañero de código! ⚪' },
  raver:   { bg: 0x07070d, gr: 0x14141f, x: -1.1, say: 'Tocá las visuales 🖤' },
  gaming:  { bg: 0x3b6fe0, gr: 0xdfe9ff, x: -1.1, say: 'Elegí un cartucho 🎮' },
};
const OUTFIT = {
  normal: { shirt: 0x4a3038, shorts: 0xc7861f, beret: 0x4a3040 },
  raver:  { shirt: 0x0e0e10, shorts: 0x131316, beret: 0x08080a },
};

const $ = (s) => document.querySelector(s);
const stage = $('#stage'), fx = $('#fx'), panel = $('#panel'), bubble = $('#bubble');
let mode = 'base', sel = 0, running = true, glitchPreset = 0;

/* ============ ESCENA ============ */
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const bgC = new THREE.Color(MODES.base.bg), tgtBg = new THREE.Color(MODES.base.bg);
scene.background = bgC;
const cam = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 50);
cam.position.set(0, 1.5, 6.4); cam.lookAt(0, 1.05, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9bbf7a, 1.7));
const sun = new THREE.DirectionalLight(0xfff1d0, 1.6); sun.position.set(2, 4, 4); scene.add(sun);

const grad = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
const lineMat = new THREE.MeshBasicMaterial({ color: 0x3a1f1a, side: THREE.BackSide });
function part(geo, color, outline = 1.07) {
  const m = new THREE.Mesh(geo, toon(color));
  if (outline) { const o = new THREE.Mesh(geo, lineMat); o.scale.setScalar(outline); m.add(o); }
  return m;
}
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

const groundMat = toon(MODES.base.gr);
const ground = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.05, 0.25, 28), groundMat);
ground.position.y = -0.13; scene.add(ground);
const gTgt = new THREE.Color(MODES.base.gr);

/* Decoración: árboles cónicos y tulipanes low poly */
const decor = new THREE.Group(); scene.add(decor);
[[-2.2, -1.6], [2.3, -1.9], [0.2, -2.6]].forEach(([x, z], i) => {
  const tr = at(part(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6), 0x8b5a3c), x, 0.25, z);
  decor.add(tr);
  for (let k = 0; k < 3; k++) decor.add(at(part(new THREE.ConeGeometry(0.62 - k * 0.14, 0.7, 7), i % 2 ? 0x3f9d5a : 0x2f8a4e), x, 0.75 + k * 0.45, z));
});
const tcols = [0xff6f91, 0xffd23f, 0xffffff, 0xff9ecb];
for (let i = 0; i < 9; i++) {
  const x = -2.4 + i * 0.6 + (i % 2) * 0.15, z = -0.9 - (i % 3) * 0.35;
  decor.add(at(part(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 5), 0x3f9d5a, 0), x, 0.14, z));
  const fl = at(part(new THREE.SphereGeometry(0.13, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.7), tcols[i % 4], 1.1), x, 0.34, z);
  fl.scale.y = 1.3; decor.add(fl);
}

/* ============ PERSONAJE ============ */
const hero = new THREE.Group(); scene.add(hero);
const body = new THREE.Group(); hero.add(body);
const skin = 0xf08a5d;
const mShirt = part(new THREE.CapsuleGeometry(0.36, 0.34, 4, 10), OUTFIT.normal.shirt); at(mShirt, 0, 0.92, 0); mShirt.scale.z = 0.85; body.add(mShirt);
const mShorts = part(new THREE.CylinderGeometry(0.4, 0.46, 0.42, 10), OUTFIT.normal.shorts); at(mShorts, 0, 0.5, 0); body.add(mShorts);
for (const s of [-1, 1]) {
  body.add(at(part(new THREE.CapsuleGeometry(0.11, 0.18, 3, 8), skin), s * 0.18, 0.2, 0));
  const shoe = at(part(new THREE.SphereGeometry(0.2, 8, 6), 0x3a2a35), s * 0.19, 0.08, 0.07); shoe.scale.set(1, 0.7, 1.45); body.add(shoe);
  const sole = at(part(new THREE.SphereGeometry(0.2, 8, 6), 0xf3dcc0, 0), s * 0.19, 0.03, 0.09); sole.scale.set(1.02, 0.35, 1.5); body.add(sole);
}
const arm = (s) => {
  const g = new THREE.Group(); g.position.set(s * 0.5, 1.2, 0);
  g.add(at(part(new THREE.CapsuleGeometry(0.1, 0.3, 3, 8), skin), 0, -0.26, 0));
  const wr = at(part(new THREE.TorusGeometry(0.1, 0.035, 5, 10), 0xf3e6cf, 0), 0, -0.34, 0); wr.rotation.x = Math.PI / 2; g.add(wr);
  g.add(at(part(new THREE.SphereGeometry(0.13, 8, 6), skin), 0, -0.55, 0));
  body.add(g); return g;
};
const rArm = arm(1), lArm = arm(-1);

const head = new THREE.Group(); head.position.y = 1.55; body.add(head);
const face = part(new THREE.SphereGeometry(0.62, 12, 10), skin); face.scale.set(1.05, 0.95, 1); head.add(face);
for (const s of [-1, 1]) head.add(at(part(new THREE.SphereGeometry(0.13, 7, 6), skin), s * 0.64, -0.02, 0));
const hair = part(new THREE.SphereGeometry(0.66, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), 0x8a4a35); hair.position.set(0, 0.04, -0.03); head.add(hair);
for (let i = 0; i < 5; i++) { const b = at(part(new THREE.ConeGeometry(0.11, 0.3, 5), 0x8a4a35, 1.05), -0.36 + i * 0.18, 0.4, 0.5); b.rotation.x = Math.PI * 0.85; head.add(b); }
const mBeret = part(new THREE.SphereGeometry(0.7, 12, 8), OUTFIT.normal.beret); at(mBeret, 0.04, 0.5, -0.02); mBeret.scale.set(1, 0.42, 1); mBeret.rotation.z = -0.12; head.add(mBeret);
const pin = at(part(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10), 0xf5a02a, 1.1), 0.06, 0.74, 0.1); pin.rotation.x = 0.4; head.add(pin);
const eyes = new THREE.Group(); head.add(eyes);
for (const s of [-1, 1]) {
  const e = at(new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a1514 })), s * 0.23, 0.02, 0.57); e.scale.set(1, 1.35, 0.5); eyes.add(e);
  const ch = at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6f6f })), s * 0.38, -0.14, 0.5); ch.scale.set(1.3, 0.8, 0.35); head.add(ch);
}
const smile = at(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2a1514 })), 0, -0.2, 0.6); smile.rotation.z = Math.PI; head.add(smile);
head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), toon(0xf9a37c)), 0, -0.07, 0.62));

/* Accesorios por modo */
const phones = new THREE.Group(); phones.visible = false; body.add(phones);
const band = at(part(new THREE.TorusGeometry(0.68, 0.045, 6, 18, Math.PI), 0xff71ce, 1.1), 0, 1.58, 0); phones.add(band);
for (const s of [-1, 1]) {
  const cup = at(part(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 10), 0xff71ce), s * 0.7, 1.55, 0); cup.rotation.z = Math.PI / 2; phones.add(cup);
  const pts = [[s * 0.72, 1.5, 0], [s * 0.7, 1.15, 0.12], [s * 0.4, 0.95, 0.38], [s * 0.05, 0.8, 0.42]].map((p) => new THREE.Vector3(...p));
  phones.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 5), new THREE.MeshBasicMaterial({ color: 0xf5f5f5 })));
}
const dev = at(part(new THREE.CapsuleGeometry(0.07, 0.12, 3, 6), 0x23232b, 1.1), 0, 0.76, 0.42); phones.add(dev);
dev.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.07), new THREE.MeshBasicMaterial({ color: 0x7fffd4 })), 0, 0.05, 0.075));

const shades = new THREE.Group(); shades.visible = false; head.add(shades);
for (const s of [-1, 1]) { const l = at(part(new THREE.SphereGeometry(0.19, 8, 6), 0x050505, 1.05), s * 0.23, 0.02, 0.52); l.scale.set(1.15, 0.8, 0.4); shades.add(l); }
shades.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), toon(0x050505)), 0, 0.05, 0.57));

const ball = new THREE.Group(); ball.visible = false; rArm.add(at(ball, 0, -0.66, 0.05));
ball.add(part(new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xe53935, 1.08));
const ballB = part(new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xffffff, 1.08); ball.add(ballB);
const bBand = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 5, 16), toon(0x222222)); bBand.rotation.x = Math.PI / 2; ball.add(bBand);
ball.add(at(part(new THREE.SphereGeometry(0.06, 8, 6), 0xffffff, 1.2), 0, 0, 0.2));

/* Criatura original (inspirada en el género, no en un personaje de Nintendo) */
const mon = new THREE.Group(); mon.visible = false; scene.add(at(mon, 1.35, 0.5, 0.4));
const mb = part(new THREE.SphereGeometry(0.5, 10, 8), 0x4fd1c5); mb.scale.set(1, 0.9, 1); mon.add(mb);
const mbel = at(part(new THREE.SphereGeometry(0.36, 9, 7), 0xfff0a8, 0), 0, -0.07, 0.24); mbel.scale.set(1, 0.9, 0.6); mon.add(mbel);
for (const s of [-1, 1]) {
  const ear = at(part(new THREE.ConeGeometry(0.15, 0.45, 6), 0x2fae9f), s * 0.28, 0.58, 0); ear.rotation.z = -s * 0.3; mon.add(ear);
  mon.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0x1b1b1b })), s * 0.2, 0.12, 0.46));
  mon.add(at(part(new THREE.SphereGeometry(0.13, 6, 5), 0x2fae9f), s * 0.27, -0.45, 0.15));
}
const antenna = at(part(new THREE.BoxGeometry(0.14, 0.14, 0.14), 0xff71ce, 1.15), 0, 0.92, 0); mon.add(antenna);
mon.add(at(part(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 5), 0x2fae9f, 0), 0, 0.72, 0));
const tail = at(part(new THREE.TorusGeometry(0.22, 0.07, 5, 10, Math.PI * 1.4), 0x2fae9f, 1.1), -0.5, -0.1, -0.15); tail.rotation.y = 1.2; mon.add(tail);

/* Cartuchos (ExtrudeGeometry, silueta de cartucho real) */
const carts = new THREE.Group(); carts.visible = false; scene.add(carts);
function wrap(c, text, x, y, lh) { let line = ''; const ws = text.split(' '), out = []; ws.forEach((w) => { const t = line + w + ' '; if (c.measureText(t).width > 200 && line) { out.push(line); line = w + ' '; } else line = t; }); out.push(line); out.forEach((l, i) => c.fillText(l.trim(), x, y + i * lh - (out.length - 1) * lh / 2)); }
const cartShape = new THREE.Shape();
[[-0.5, -0.6], [0.5, -0.6], [0.5, 0.4], [0.36, 0.6], [-0.36, 0.6], [-0.5, 0.4]].forEach(([x, y], i) => (i ? cartShape.lineTo(x, y) : cartShape.moveTo(x, y)));
const cartGeo = new THREE.ExtrudeGeometry(cartShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); cartGeo.translate(0, 0, -0.08);
GAMES.forEach((g, i) => {
  const m = part(cartGeo, 0x3d4350, 1.05);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, g.c); gr.addColorStop(1, g.c2); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  c.fillStyle = '#fff'; c.font = '700 36px Fredoka, Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; wrap(c, g.n, 128, 128, 42);
  m.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })), 0, 0.08, 0.125));
  m.userData = { type: 'cart', i, bx: 0.95 + (i % 2) * 1.0, by: 1.95 - Math.floor(i / 2) * 1.1 };
  m.scale.setScalar(0.78); carts.add(m);
});

/* Bells coleccionables + partículas */
const bells = []; let bellCount = 0, danceT = 0, hopY = 0, hopV = 0, blink = 0, nextBlink = 2;
const bellGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12);
function spawnBell() {
  if (bells.length >= 3 || !running) return;
  const b = part(bellGeo, 0xf8c53a, 1.12); b.rotation.x = Math.PI / 2;
  const w = new THREE.Group(); w.add(b); at(w, (Math.random() - 0.5) * 3.6, 0.8 + Math.random() * 1.8, 0.6);
  w.userData = { type: 'bell', ph: Math.random() * 6 }; scene.add(w); bells.push(w);
}
setInterval(spawnBell, 3200);
const N = 40, bp = new Float32Array(N * 3), bv = Array.from({ length: N }, () => new THREE.Vector3());
const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
const bMat = new THREE.PointsMaterial({ size: 0.14, color: 0xfff2a8, transparent: true, depthWrite: false, opacity: 0 });
const burst = new THREE.Points(bGeo, bMat); burst.frustumCulled = false; scene.add(burst); let burstT = 0;
function pop(x, y, z, col = 0xfff2a8) {
  bMat.color.set(col); burstT = 1;
  for (let i = 0; i < N; i++) { bp.set([x, y, z], i * 3); bv[i].set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.3).multiplyScalar(3); }
}

/* ============ UI ============ */
let typer;
function say(txt) {
  clearInterval(typer); let i = 0; bubble.textContent = ''; bubble.classList.add('on');
  typer = setInterval(() => { bubble.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(typer); }, 24);
}
const au = new Audio(); au.preload = 'none'; let ti = 0, playing = false;
function loadTrack(i) { ti = (i + TRACKS.length) % TRACKS.length; au.src = TRACKS[ti].src; syncPlayer(); }
function syncPlayer() {
  const T = $('#plTitle'); if (!T) return;
  T.textContent = `${TRACKS[ti].t} — ${TRACKS[ti].a}`;
  $('#plPlay').textContent = playing ? '⏸' : '▶';
  document.querySelectorAll('.pl-list button').forEach((b, i) => b.classList.toggle('on', i === ti));
}
au.addEventListener('timeupdate', () => { const f = $('#plFill'); if (f && au.duration) f.style.width = (au.currentTime / au.duration) * 100 + '%'; });
au.addEventListener('ended', () => { loadTrack(ti + 1); au.play(); });
au.addEventListener('error', () => { playing = false; const s = $('#plStatus'); if (s) s.textContent = `Falta el archivo ${TRACKS[ti].src}`; syncPlayer(); });
async function togglePlay() {
  if (!au.src) loadTrack(ti);
  if (playing) { au.pause(); playing = false; } else { try { await au.play(); playing = true; $('#plStatus').textContent = ''; } catch { playing = false; } }
  syncPlayer();
}

const VIEWS = {
  base: () => `<div class="p-card"><p class="p-hello">¡Hola! 👋</p><dl class="p-list"><dt>Nombre</dt><dd>Tomás Estévez</dd><dt>Rol</dt><dd>Diseñador Multimedial / Visual</dd><dt>Ubicación</dt><dd>Buenos Aires, Argentina</dd></dl><p class="p-hint">Tocá al personaje 👆 y juntá las campanitas 🔔</p></div>`,
  music: () => `<div class="p-card player"><div class="pl-title" id="plTitle"></div><div class="pl-bar" id="plBar"><i id="plFill"></i></div><div class="pl-ctrl"><button data-act="prev" aria-label="Anterior">⏮</button><button data-act="play" id="plPlay" aria-label="Play/Pausa">▶</button><button data-act="next" aria-label="Siguiente">⏭</button></div><div class="pl-status" id="plStatus"></div><ol class="pl-list">${TRACKS.map((t, i) => `<li><button data-act="track" data-i="${i}">${t.t}</button></li>`).join('')}</ol></div>`,
  pokemon: () => `<div class="p-card"><div class="mon-head"><b>PIXELÓN</b><span>Tipo: Diseño / Código</span><span>Nv. 22</span></div>${STATS.map(([n, v]) => `<div class="stat"><span>${n}</span><div class="stat-bar"><i data-w="${v}"></i></div><em>${v}</em></div>`).join('')}</div>`,
  raver: () => `<div class="p-card"><p class="p-hello">Visuales interactivas</p><p class="p-hint">Tocá o arrastrá sobre la pantalla de la derecha. Cambiá de visual:</p><div class="chips">${['Partículas', 'Ondas', 'Grilla'].map((n, i) => `<button data-act="fx" data-i="${i}" class="${i === glitchPreset ? 'on' : ''}">${n}</button>`).join('')}</div></div>`,
  gaming: () => `<div class="p-card"><p class="p-hello">Juegos favoritos</p><div class="chips">${GAMES.map((g, i) => `<button data-act="game" data-i="${i}" class="${i === sel ? 'on' : ''}">${g.n}</button>`).join('')}</div><p class="p-hint" id="gNote">${GAMES[sel].note}</p></div>`,
};

function setMode(m, silent) {
  mode = m; const M = MODES[m];
  document.querySelectorAll('.tab').forEach((t) => { const on = t.dataset.mode === m; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
  panel.innerHTML = VIEWS[m](); panel.dataset.mode = m;
  panel.querySelectorAll('.stat-bar i').forEach((i) => requestAnimationFrame(() => requestAnimationFrame(() => (i.style.width = i.dataset.w + '%'))));
  if (m === 'music') { if (!au.src) loadTrack(0); else syncPlayer(); }
  tgtBg.set(M.bg); gTgt.set(M.gr);
  phones.visible = m === 'music'; ball.visible = mon.visible = m === 'pokemon'; shades.visible = m === 'raver'; carts.visible = m === 'gaming';
  decor.visible = !(m === 'raver' || m === 'gaming');
  fx.classList.toggle('on', m === 'raver'); stage.parentElement.dataset.mode = m;
  if (!silent) { pop(M.x, 1.3, 0.5, m === 'raver' ? 0xff2bd6 : 0xfff2a8); say(M.say); }
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));
panel.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, i = +b.dataset.i;
  if (a === 'play') togglePlay(); else if (a === 'next') { loadTrack(ti + 1); if (playing) au.play(); } else if (a === 'prev') { loadTrack(ti - 1); if (playing) au.play(); }
  else if (a === 'track') { loadTrack(i); playing = false; togglePlay(); }
  else if (a === 'fx') { glitchPreset = i; setMode('raver', true); }
  else if (a === 'game') pickGame(i);
});
panel.addEventListener('pointerdown', (e) => { if (e.target.closest('#plBar') && au.duration) { const r = $('#plBar').getBoundingClientRect(); au.currentTime = ((e.clientX - r.left) / r.width) * au.duration; } });
function pickGame(i) {
  sel = i; pop(carts.children[i].position.x, carts.children[i].position.y, 0.5, 0xffffff); say(GAMES[i].n + ' ✨');
  document.querySelectorAll('[data-act="game"]').forEach((b, k) => b.classList.toggle('on', k === i)); const n = $('#gNote'); if (n) n.textContent = GAMES[i].note;
}
const clock = () => { const d = new Date(); $('#clock').textContent = `${d.getMonth() + 1}/${d.getDate()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
clock(); setInterval(clock, 30000);

/* ============ INTERACCIÓN 3D ============ */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, yawT = 0, look = 0;
const stageNdc = (e) => { const r = stage.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; };
stage.addEventListener('pointerdown', (e) => { down = { x: e.clientX, mv: 0 }; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', (e) => { look = stageNdc(e)[0]; if (down) { const dx = e.clientX - down.x; down.mv += Math.abs(dx); down.x = e.clientX; yawT += dx * 0.012; } });
stage.addEventListener('pointerup', (e) => {
  const moved = down && down.mv > 8; down = null; yawT = 0; if (moved) return;
  ndc.set(...stageNdc(e)); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects([...bells, ...(carts.visible ? carts.children : []), hero], true);
  if (!hits.length) return;
  let o = hits[0].object; while (o && !o.userData.type && o.parent) o = o.parent;
  if (o.userData.type === 'bell') {
    pop(o.position.x, o.position.y, 0.6, 0xf8c53a); scene.remove(o); bells.splice(bells.indexOf(o), 1);
    $('#bells').textContent = String(++bellCount).padStart(5, '0');
    if (bellCount % 5 === 0) { danceT = 2.6; say('¡5 campanitas! ¡Baile especial! 💃'); pop(hero.position.x, 2.2, 0.5, 0xff71ce); }
  } else if (o.userData.type === 'cart') pickGame(o.userData.i);
  else { hopV = 4.2; say(LINES[(Math.random() * LINES.length) | 0]); pop(hero.position.x, 2.4, 0.5); }
});

/* ============ VISUALES RAVER (2D, estilo p5/TouchDesigner) ============ */
const g2 = fx.getContext('2d'); let fw = 1, fh = 1; const ptr = { x: 0.5, y: 0.5, d: false };
const PT = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: 0, vy: 0 }));
const fxPos = (e) => { const r = fx.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = (e.clientY - r.top) / r.height; };
fx.addEventListener('pointerdown', (e) => { ptr.d = true; fxPos(e); fx.setPointerCapture(e.pointerId); });
fx.addEventListener('pointermove', fxPos);
fx.addEventListener('pointerup', () => (ptr.d = false));
function drawShape(ox, col, t) {
  g2.strokeStyle = g2.fillStyle = col; g2.lineWidth = 1.5;
  if (glitchPreset === 0) {
    PT.forEach((p, i) => {
      const dx = ptr.x - p.x, dy = ptr.y - p.y, d = Math.hypot(dx, dy) + 0.01, f = (ptr.d ? 0.012 : -0.0012) / d;
      p.vx = (p.vx + dx * f + Math.sin(t + i) * 0.00015) * 0.96; p.vy = (p.vy + dy * f + Math.cos(t * 1.1 + i) * 0.00015) * 0.96;
      if (ox === 0) { p.x = (p.x + p.vx + 1) % 1; p.y = (p.y + p.vy + 1) % 1; }
      g2.fillRect(p.x * fw + ox, p.y * fh, 4, 4);
      for (let j = i + 1; j < PT.length; j += 7) { const q = PT[j]; if (Math.hypot(q.x - p.x, q.y - p.y) < 0.16) { g2.beginPath(); g2.moveTo(p.x * fw + ox, p.y * fh); g2.lineTo(q.x * fw + ox, q.y * fh); g2.stroke(); } }
    });
  } else if (glitchPreset === 1) {
    for (let k = 0; k < 9; k++) { g2.beginPath(); for (let x = 0; x <= fw; x += 6) { const nx = x / fw, bump = Math.exp(-Math.pow((nx - ptr.x) * 5, 2)) * (ptr.d ? 70 : 28) * Math.sin(t * 6 + k); const y = fh * (0.1 + k * 0.1) + Math.sin(nx * 9 + t * 2 + k) * 14 + bump * (k % 2 ? 1 : -1) * (1 - Math.abs(ptr.y - 0.5)); x ? g2.lineTo(x + ox, y) : g2.moveTo(x + ox, y); } g2.stroke(); }
  } else {
    const n = 9; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const cx = (i + 0.5) / n, cy = (j + 0.5) / n, d = Math.hypot(cx - ptr.x, cy - ptr.y), s = (1 - Math.min(d * 1.8, 1)) * (ptr.d ? 1.5 : 1) * (fw / n) * 0.8 + 2 + Math.sin(t * 3 + i + j) * 1.5; g2.strokeRect(cx * fw - s / 2 + ox, cy * fh - s / 2, s, s); }
  }
}
function drawFx(t) {
  g2.globalCompositeOperation = 'source-over'; g2.fillStyle = 'rgba(5,5,14,.28)'; g2.fillRect(0, 0, fw, fh);
  g2.globalCompositeOperation = 'lighter';
  const sh = ptr.d ? 6 : 2; drawShape(-sh, '#ff2bd6', t); drawShape(0, '#ffffff', t); drawShape(sh, '#19f0ff', t);
  g2.globalCompositeOperation = 'source-over';
  if (ptr.d || Math.random() < 0.1) for (let k = 0; k < (ptr.d ? 5 : 2); k++) { const y = Math.random() * fh, h = 4 + Math.random() * 26, dx = (Math.random() - 0.5) * (ptr.d ? 60 : 24); g2.drawImage(fx, 0, y, fw, h, dx, y, fw, h); }
}

/* ============ LOOP ============ */
const clk = new THREE.Clock();
const lerpArm = (a, x, z) => { a.rotation.x += (x - a.rotation.x) * 0.14; a.rotation.z += (z - a.rotation.z) * 0.14; };
function tick() {
  requestAnimationFrame(tick); if (!running) return;
  const dt = Math.min(clk.getDelta(), 0.05), t = clk.elapsedTime, M = MODES[mode];
  bgC.lerp(tgtBg, 0.06); groundMat.color.lerp(gTgt, 0.06);
  hero.position.x += (M.x - hero.position.x) * 0.08;
  const o = mode === 'raver' ? OUTFIT.raver : OUTFIT.normal;
  mShirt.material.color.lerp(new THREE.Color(o.shirt), 0.08); mShorts.material.color.lerp(new THREE.Color(o.shorts), 0.08); mBeret.material.color.lerp(new THREE.Color(o.beret), 0.08);
  let r = [0, 0.12], l = [0, -0.12], beat = 0;
  if (mode === 'base') r = [0, 2.5 + Math.sin(t * 9) * 0.35];
  if (mode === 'music') { r = [0, 0.15]; l = [0, -0.15]; beat = playing ? 1 : 0.2; }
  if (mode === 'pokemon') r = [-1.35, 0.12];
  if (mode === 'raver') { r = [0, 2.4 + Math.sin(t * 6) * 0.25]; l = [0, -(2.4 + Math.sin(t * 6 + Math.PI) * 0.25)]; beat = 1.4; }
  if (danceT > 0) { danceT -= dt; r = [0, 2.6 + Math.sin(t * 12) * 0.4]; l = [0, -(2.6 + Math.sin(t * 12 + 2) * 0.4)]; hero.rotation.y += dt * 8; beat = 2; }
  lerpArm(rArm, ...r); lerpArm(lArm, ...l);
  if (danceT <= 0) { hero.rotation.y = ((hero.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; hero.rotation.y += (yawT - hero.rotation.y) * 0.12; }
  if (hopV || hopY > 0) { hopV -= 14 * dt; hopY += hopV * dt; if (hopY < 0) hopY = hopV = 0; }
  body.position.y = hopY + Math.sin(t * 2) * 0.025 + Math.abs(Math.sin(t * 5)) * 0.06 * beat;
  head.rotation.z = Math.sin(t * 5) * 0.1 * beat; head.rotation.y += (look * 0.5 - head.rotation.y) * 0.1;
  blink -= dt; nextBlink -= dt; if (nextBlink < 0) { blink = 0.12; nextBlink = 2 + Math.random() * 3; } eyes.scale.y = blink > 0 ? 0.1 : 1;
  if (mon.visible) { mon.position.y = 0.5 + Math.abs(Math.sin(t * 3)) * 0.18; mon.rotation.y = -0.4 + Math.sin(t) * 0.2; antenna.rotation.y = antenna.rotation.x = t * 2; tail.rotation.z = Math.sin(t * 6) * 0.3; }
  if (carts.visible) carts.children.forEach((c, i) => { const s = i === sel; c.position.set(c.userData.bx, c.userData.by + Math.sin(t * 2 + i) * 0.06, s ? 0.5 : 0); c.rotation.y += ((s ? Math.sin(t * 2) * 0.35 : -0.25) - c.rotation.y) * 0.1; c.scale.setScalar(c.scale.x + ((s ? 0.95 : 0.78) - c.scale.x) * 0.15); });
  bells.forEach((b) => { b.rotation.y = t * 2.5; b.position.y += Math.sin(t * 2 + b.userData.ph) * 0.003; });
  if (burstT > 0) { burstT -= dt * 1.4; bMat.opacity = Math.max(burstT, 0); for (let i = 0; i < N; i++) { bv[i].y -= 3 * dt; bp[i * 3] += bv[i].x * dt; bp[i * 3 + 1] += bv[i].y * dt; bp[i * 3 + 2] += bv[i].z * dt; } bGeo.attributes.position.needsUpdate = true; }
  if (mode === 'raver') drawFx(t);
  renderer.render(scene, cam);
}
function resize() {
  const r = stage.parentElement.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.position.z = r.width / r.height < 1.2 ? 7.4 : 6.4; cam.updateProjectionMatrix();
  const dpr = Math.min(devicePixelRatio, 1.5); fw = fx.width = Math.max(1, (r.width / 2) * dpr | 0); fh = fx.height = Math.max(1, r.height * dpr | 0);
}
new ResizeObserver(resize).observe(stage.parentElement);
new IntersectionObserver(([e]) => (running = e.isIntersecting && !document.hidden)).observe(stage.parentElement);
document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; });
resize(); setMode('base', true); say(MODES.base.say); $('#loading')?.remove(); tick();
