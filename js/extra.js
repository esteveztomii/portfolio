/* EXTRA · más movimiento e interacciones del portfolio
   Módulos: partículas, barra de progreso, letras del título, aparición al scrollear, foto con lente,
   Proyectodex (cartas), carruseles de video, TV de la animación y etapas de Vagari. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function safe(name, fn) { try { fn(); } catch (e) { console.error('[extra:' + name + ']', e); } }
  var behavior = reduce ? 'auto' : 'smooth';

  /* ---------- partículas (estelas, confeti) ---------- */
  var COLORS = ['#ff6bff', '#fff94a', '#16d93a', '#38c8f0', '#ff5a1f', '#ffffff'];
  var fxc, fctx, parts = [], running = false, dpr = 1;
  function fxInit() {
    if (fxc) return true; if (reduce) return false;
    fxc = document.createElement('canvas'); fxc.id = 'fxc'; fxc.setAttribute('aria-hidden', 'true'); document.body.appendChild(fxc); fctx = fxc.getContext('2d');
    function fit() { dpr = Math.min(devicePixelRatio || 1, 2); fxc.width = innerWidth * dpr; fxc.height = innerHeight * dpr; }
    fit(); addEventListener('resize', fit); return true;
  }
  function addPart(x, y, vx, vy, g, life, s) { parts.push({ x: x, y: y, vx: vx, vy: vy, g: g, l: life, m: life, s: s, c: COLORS[(Math.random() * COLORS.length) | 0] }); if (parts.length > 260) parts.shift(); if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } }
  var last = 0;
  function tick(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    fctx.clearRect(0, 0, fxc.width, fxc.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.l -= dt; if (p.l <= 0) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      fctx.globalAlpha = Math.min(1, p.l / p.m * 1.6); fctx.fillStyle = p.c; var s = p.s * dpr; fctx.fillRect(Math.round(p.x * dpr / 4) * 4, Math.round(p.y * dpr / 4) * 4, s, s);
    }
    fctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(tick); else { running = false; fctx.clearRect(0, 0, fxc.width, fxc.height); }
  }
  function confetti(x, y, n) { if (!fxInit()) return; for (var i = 0; i < (n || 60); i++) { var a = Math.random() * 6.283, v = 140 + Math.random() * 360; addPart(x, y, Math.cos(a) * v, Math.sin(a) * v - 160, 620, .9 + Math.random() * .9, 6 + (Math.random() * 6 | 0)); } }
  var toastEl, toastT;
  function toast(msg, ball) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = (ball === false ? '' : '<i class="ball"></i>') + '<span></span>'; toastEl.lastChild.textContent = msg;
    toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- estela de pixeles (sólo mouse) ---------- */
  safe('trail', function () {
    if (reduce || !fine) return; var lx = -99, ly = -99, lt = 0;
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return; var now = performance.now(); if (now - lt < 45 || Math.hypot(e.clientX - lx, e.clientY - ly) < 16) return; lt = now; lx = e.clientX; ly = e.clientY;
      if (!fxInit()) return; addPart(e.clientX, e.clientY, (Math.random() - .5) * 60, -20 - Math.random() * 40, 120, .55 + Math.random() * .4, 4 + (Math.random() * 3 | 0));
    }, { passive: true });
  });

  /* ---------- barra de progreso ---------- */
  safe('progress', function () {
    var bar = $('#prog'); if (!bar) return; var raf = 0;
    function upd() { raf = 0; var h = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--p', h > 0 ? clamp(scrollY / h, 0, 1).toFixed(4) : 0); }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
  });

  /* ---------- letras del título ---------- */
  safe('letters', function () {
    var h = $('.hero h1'); if (!h || reduce) return; var i = 0; h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) { var f = document.createDocumentFragment(); c.textContent.split('').forEach(function (ch) { if (!ch.trim()) { f.appendChild(document.createTextNode(ch)); return; } var s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i++); s.textContent = ch; f.appendChild(s); }); n.replaceChild(f, c); }
        else if (c.nodeType === 1) walk(c);
      });
    })(h);
  });

  /* ---------- aparición al scrollear ---------- */
  safe('reveal', function () {
    var G = [['main>section.win:not(.hero), .win.full, .caso.filo>.win, .dex, .proy>.caso', 'up'], ['.ticker', 'up'], ['.verdes li', 'l'], ['.cols>.win', 'up'], ['.skills li', 'z'], ['.logos li', 'z'], ['.globo', 'z'], ['.galeria img', 'z'], ['.vdeck', 'up'], ['.tv', 'up'], ['.stepper', 'up'], ['.dex-hud', 'up'], ['.foto', 'z']];
    var els = []; G.forEach(function (g) {
      var m = $$(g[0]).filter(function (e) { return !e.classList.contains('rv') && !e.closest('.pc-scroll'); });
      m.forEach(function (e) { var sib = m.filter(function (o) { return o.parentNode === e.parentNode; }); e.style.setProperty('--d', Math.min(sib.indexOf(e) * 90, 540) + 'ms'); e.classList.add('rv'); if (g[1] !== 'up') e.classList.add(g[1] === 'l' ? 'l' : 'z'); els.push(e); });
    });
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  });

  /* ---------- foto con lente (pixelada → real) ---------- */
  safe('photo', function () {
    var f = $('#foto'); if (!f) return; var fr = $('.foto-frame', f), img = $('img', fr), cv = $('canvas', fr), chips = $$('.chip', f);
    function draw() { if (!img.naturalWidth) return; var cw = 56, ch = Math.round(cw * img.naturalHeight / img.naturalWidth); cv.width = cw; cv.height = ch; cv.getContext('2d').drawImage(img, 0, 0, cw, ch); }
    if (img.complete) draw(); else img.addEventListener('load', draw);
    var W = 1, H = 1, tx = .5, ty = .42, x = .5, y = .42, R = 70, base = 70, hover = false, idleT = 0, pulse = -9, vis = true;
    function size() { var b = fr.getBoundingClientRect(); W = b.width || 1; H = b.height || 1; base = Math.max(44, W * .27); }
    size(); addEventListener('resize', size); if (window.ResizeObserver) new ResizeObserver(size).observe(fr);
    function move(e) { var b = fr.getBoundingClientRect(); tx = clamp((e.clientX - b.left) / b.width, 0, 1); ty = clamp((e.clientY - b.top) / b.height, 0, 1); hover = true; clearTimeout(idleT); idleT = setTimeout(function () { hover = false; }, 1800);
      fr.style.setProperty('--ty', ((tx - .5) * 12).toFixed(2) + 'deg'); fr.style.setProperty('--tx', ((.5 - ty) * 9).toFixed(2) + 'deg'); }
    fr.addEventListener('pointermove', move); fr.addEventListener('pointerdown', function (e) { move(e); pulse = performance.now(); chips.forEach(function (c) { c.style.transition = 'transform .3s cubic-bezier(.3,1.8,.5,1)'; c.style.transform = 'rotate(' + (Math.random() * 30 - 15).toFixed(0) + 'deg) scale(1.25)'; setTimeout(function () { c.style.transform = ''; }, 350); }); });
    fr.addEventListener('pointerleave', function () { fr.style.setProperty('--ty', '0deg'); fr.style.setProperty('--tx', '0deg'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(fr);
    (function loop(now) {
      requestAnimationFrame(loop); if (!vis) return; var t = now / 1000;
      if (!hover && !reduce) { tx = .5 + .27 * Math.sin(t * .9); ty = .42 + .2 * Math.sin(t * 1.3 + 1); }
      x += (tx - x) * .14; y += (ty - y) * .14; var pu = clamp((now - pulse) / 550, 0, 1); R = base * (1 + .75 * Math.sin(pu * Math.PI));
      fr.style.setProperty('--x', (x * W).toFixed(1) + 'px'); fr.style.setProperty('--y', (y * H).toFixed(1) + 'px'); fr.style.setProperty('--r', R.toFixed(1) + 'px');
    })(performance.now());
  });

  /* ---------- Proyectodex ---------- */
  safe('dex', function () {
    var dex = $('#dex'); if (!dex) return; var track = $('#dex-track'), cards = $$('.dcard', track), dots = $('#dex-dots'), cnt = $('#dex-count'), xp = $('#dex-xp'), die = $('#d20'), seen = 0, rolling = false, raf = 0;
    cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    function activeIdx() { var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9; cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }); return best; }
    function dotsUpd() { raf = 0; var a = activeIdx(); [].forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === a); }); }
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(dotsUpd); }, { passive: true }); addEventListener('resize', dotsUpd);
    function toCard(i) { i = clamp(i, 0, cards.length - 1); var c = cards[i], mid = matchMedia('(max-width:620px)').matches; track.scrollTo({ left: mid ? c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2 : c.offsetLeft - 64, behavior: behavior }); }
    $('.dex-nav.prev', dex).addEventListener('click', function () { toCard(activeIdx() - 1); }); $('.dex-nav.next', dex).addEventListener('click', function () { toCard(activeIdx() + 1); });
    setTimeout(function () { toCard(0); dotsUpd(); }, 60);
    function discover(c) {
      c.classList.add('seen'); seen++; cnt.textContent = 'Proyectodex ' + seen + ' / ' + cards.length; xp.style.width = (seen / cards.length * 100) + '%';
      toast(c.dataset.name + ' añadido a la Proyectodex'); if (seen === cards.length) setTimeout(function () { var b = c.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top + b.height / 2, 90); toast('¡Proyectodex completa! +100 XP'); }, 900);
    }
    function go(c) {
      var st = c.dataset.stage; if (st) window.dispatchEvent(new CustomEvent('vagari:stage', { detail: +st }));
      var el = document.getElementById(c.dataset.go); if (el) el.scrollIntoView({ behavior: behavior, block: 'start' });
    }
    function setTab(c) { var b = $('.go', c); if (b) b.tabIndex = c.classList.contains('flipped') ? 0 : -1; }
    cards.forEach(function (c) {
      function tilt(e) { var r = c.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1); c.classList.add('tilt');
        c.style.setProperty('--ry', ((px - .5) * 24).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 20).toFixed(1) + 'deg'); c.style.setProperty('--mx', (px * 100).toFixed(0) + '%'); c.style.setProperty('--my', (py * 100).toFixed(0) + '%'); c.style.setProperty('--hx', (px * 100).toFixed(0) + '%'); c.style.setProperty('--g', '.9'); }
      function rest() { c.classList.remove('tilt'); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--g', '0'); }
      c.addEventListener('pointermove', tilt); c.addEventListener('pointerleave', rest); c.addEventListener('pointercancel', rest);
      function flip() { var was = c.classList.contains('flipped'); c.classList.toggle('flipped'); setTab(c); if (!was && !c.classList.contains('seen')) discover(c); }
      c.addEventListener('click', function (e) { if (e.target.closest('.go')) { e.stopPropagation(); go(c); return; } flip(); });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('.go')) return; e.preventDefault(); flip(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var i = cards.indexOf(c) + (e.key === 'ArrowRight' ? 1 : -1); if (cards[i]) { e.preventDefault(); cards[i].focus({ preventScroll: true }); toCard(i); } }
      });
    });
    $('#dex-d20').addEventListener('click', function () {
      if (rolling) return; rolling = true; die.classList.add('roll'); var iv = setInterval(function () { die.textContent = 1 + (Math.random() * 20 | 0); }, 70);
      setTimeout(function () {
        clearInterval(iv); die.classList.remove('roll'); var n = 1 + (Math.random() * 20 | 0); die.textContent = n; var i = (n - 1) % cards.length, c = cards[i]; toCard(i);
        c.classList.remove('glow'); void c.offsetWidth; c.classList.add('glow'); setTimeout(function () { c.classList.remove('glow'); }, 2200); toast('Salió ' + n + ' → ' + c.dataset.name, true); rolling = false;
      }, 1000);
    });
  });

  /* ---------- carruseles de video (coverflow) ---------- */
  safe('decks', function () {
    $$('[data-vdeck]').forEach(function (d) {
      var slides = $$('.vd-slide', d), vids = slides.map(function (s) { return $('video', s); }), n = slides.length, cur = 0, vis = false;
      var prev = $('.prev', d), next = $('.next', d), dotsEl = $('.vd-dots', d), count = $('.vd-count', d), stage = $('.vd-stage', d);
      var dotBtns = slides.map(function (s, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Ir al video ' + (i + 1)); b.addEventListener('click', function () { set(i); }); dotsEl.appendChild(b); return b; });
      vids.forEach(function (v) { v.addEventListener('pause', function () { if (v._sys) { v._sys = false; return; } if (vis) v.dataset.hold = '1'; }); v.addEventListener('play', function () { delete v.dataset.hold; }); });
      function sysPause(v) { if (!v.paused) { v._sys = true; v.pause(); } }
      function playActive() { var v = vids[cur]; if (reduce || !vis || v.dataset.hold) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      function layout(off) { slides.forEach(function (s, i) { var o = i - cur + (off || 0); s.style.setProperty('--o', o.toFixed(3)); s.style.setProperty('--a', Math.min(Math.abs(o), 1.4).toFixed(3)); s.style.setProperty('--z', Math.round(Math.abs(o) * 2)); s.classList.toggle('off', i !== cur); }); }
      function set(i) {
        cur = clamp(i, 0, n - 1); layout(0);
        vids.forEach(function (v, k) { v.controls = k === cur; slides[k].setAttribute('aria-hidden', k === cur ? 'false' : 'true'); if (k !== cur) sysPause(v); });
        delete vids[cur].dataset.hold; playActive();
        dotBtns.forEach(function (b, k) { b.classList.toggle('on', k === cur); }); count.textContent = (cur + 1) + ' / ' + n; prev.disabled = cur === 0; next.disabled = cur === n - 1;
      }
      prev.addEventListener('click', function () { set(cur - 1); }); next.addEventListener('click', function () { set(cur + 1); });
      d.addEventListener('keydown', function (e) { if (e.target.tagName === 'VIDEO') return; if (e.key === 'ArrowLeft') { e.preventDefault(); set(cur - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); set(cur + 1); } });
      var sx = 0, dx = 0, down = false, moved = false, unit = 150, tgt = null;
      stage.addEventListener('pointerdown', function (e) {
        var v = e.target.closest('video'); if (v) { var r = v.getBoundingClientRect(); if (e.clientY > r.bottom - 56) return; }
        down = true; moved = false; sx = e.clientX; dx = 0; tgt = e.target.closest('.vd-slide'); unit = Math.max(90, slides[0].offsetWidth * .62);
      });
      stage.addEventListener('pointermove', function (e) {
        if (!down) return; dx = e.clientX - sx; if (!moved && Math.abs(dx) > 9) { moved = true; d.classList.add('drag'); try { stage.setPointerCapture(e.pointerId); } catch (x) {} }
        if (moved) layout(clamp(dx / unit, -1.2, 1.2));
      });
      function end() {
        if (!down) return; down = false; d.classList.remove('drag');
        if (moved) { var step = Math.round(-dx / unit); if (!step && Math.abs(dx) > 40) step = dx < 0 ? 1 : -1; set(cur + clamp(step, -1, 1)); }
        else if (tgt && tgt.classList.contains('off')) set(slides.indexOf(tgt));
        tgt = null;
      }
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) playActive(); else vids.forEach(sysPause); }, { threshold: .35 }).observe(d); else vis = true;
      set(0);
    });
  });

  /* ---------- TV de la animación ---------- */
  safe('tv', function () {
    var tv = $('#tv'); if (!tv) return; var body = $('.tv-body', tv);
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { setTimeout(function () { tv.classList.add('on'); }, 250); io.disconnect(); } }, { threshold: .4 }); io.observe(tv); } else tv.classList.add('on');
    if (reduce) return; tv.addEventListener('pointermove', function (e) { var r = tv.getBoundingClientRect(); body.style.setProperty('--ty', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); body.style.setProperty('--tx', (.5 - (e.clientY - r.top) / r.height) * 6 + 'deg'); });
    tv.addEventListener('pointerleave', function () { body.style.setProperty('--ty', '0deg'); body.style.setProperty('--tx', '0deg'); });
  });

  /* ---------- Vagari por etapas ---------- */
  safe('stages', function () {
    var st = $('#stepper'); if (!st) return; var tabs = $$('.st', st), panels = $$('.vpanel'), prev = $('#vp-prev'), next = $('#vp-next'), cnt = $('#vp-count'), cur = 0;
    function select(i, focus, fromEvent) {
      i = clamp(i, 0, tabs.length - 1); var dir = i >= cur ? 1 : -1, changed = i !== cur; cur = i;
      panels.forEach(function (p, k) {
        if (k === cur) { p.hidden = false; p.style.setProperty('--dir', dir); if (changed) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; } }
        else { p.hidden = true; $$('video', p).forEach(function (v) { v.pause(); }); }
      });
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === cur ? 'true' : 'false'); t.tabIndex = k === cur ? 0 : -1; t.classList.toggle('done', k < cur); });
      st.style.setProperty('--p', (cur / (tabs.length - 1)).toFixed(3)); prev.disabled = cur === 0; next.disabled = cur === tabs.length - 1; cnt.textContent = 'Etapa ' + (cur + 1) + ' de ' + tabs.length;
      if (focus) tabs[cur].focus();
      if (changed && !fromEvent && st.getBoundingClientRect().top < 0) st.scrollIntoView({ behavior: behavior, block: 'center' });
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { select(k); }); });
    st.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); select(cur + 1, true); } else if (e.key === 'ArrowLeft') { e.preventDefault(); select(cur - 1, true); } else if (e.key === 'Home') { e.preventDefault(); select(0, true); } else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); } });
    prev.addEventListener('click', function () { select(cur - 1); }); next.addEventListener('click', function () { select(cur + 1); });
    window.addEventListener('vagari:stage', function (e) { select((e.detail || 1) - 1, false, true); });
    select(0);
  });

  /* ---------- código secreto ---------- */
  safe('konami', function () {
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
    addEventListener('keydown', function (e) {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) { pos = 0; document.documentElement.classList.add('rainbow'); confetti(innerWidth / 2, innerHeight / 2, 120); toast('¡Código secreto! +30 XP'); setTimeout(function () { document.documentElement.classList.remove('rainbow'); }, 4600); }
    });
  });
})();
