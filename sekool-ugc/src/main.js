/* SEKOOL green-screen UGC reel
 * Deterministic: every frame is a pure function of time. The renderer calls
 * SEKOOL.seek(t) and screenshots the 1080x1920 stage. Beat times come from script.js,
 * or from the URL (?beats=0.2,3.1,...&end=41.8) when the renderer has re-timed them
 * to a real avatar clip. ?noavatar hides the placeholder avatar so the real one can be
 * keyed on top. */
(() => {
  const Q = new URLSearchParams(location.search);
  const RENDER = Q.has('render');
  if (RENDER) document.body.classList.add('render');
  if (Q.has('noavatar')) document.body.classList.add('no-avatar');

  const FPS = 30;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- timing
  const S = window.SCRIPT;
  const starts = Q.get('beats') ? Q.get('beats').split(',').map(Number) : S.beats.map((b) => b.t);
  const END = Q.get('end') ? +Q.get('end') : S.end;
  const DURATION = +(END + S.tail).toFixed(2);
  const beats = S.beats.map((b, i) => ({ ...b, t: starts[i], end: i + 1 < starts.length ? starts[i + 1] - 0.3 : END, next: starts[i + 1] ?? DURATION }));

  // ---------------------------------------------------------------- icons
  const ICONS = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
    arrowdown: '<path d="M12 3v17M5.5 13.5L12 20l6.5-6.5"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="M16 10.5l6-3.5v10l-6-3.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    teacher: '<circle cx="12" cy="7.5" r="3.8"/><path d="M4.5 21c0-4.2 3.4-6.8 7.5-6.8s7.5 2.6 7.5 6.8"/><path d="M8.5 7.2h7"/>',
    child: '<circle cx="12" cy="9" r="3.4"/><path d="M6 21c0-3.6 2.7-6 6-6s6 2.4 6 6"/><path d="M8.6 7.6c1.4-2.4 5.4-2.4 6.8 0"/>',
  };
  const icon = (n, sw = 2.2) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
  $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, el.dataset.icon === 'check' ? 3 : 2.2)));

  function loadLogos() {
    const kinds = [...new Set($$('[data-logo]').map((el) => el.dataset.logo))];
    return Promise.all(kinds.map((k) => fetch(`assets/logo-${k}.svg`)
      .then((r) => (r.ok ? r.text() : null))
      .then((svg) => { if (svg) $$(`[data-logo="${k}"]`).forEach((el) => { el.innerHTML = svg; }); })
      .catch(() => {})));
  }

  // ---------------------------------------------------------------- words, captions, lip movement
  const clean = (w) => w.replace(/^[‘'"(]+|[’'",.)]+$/g, '');
  const SPOKEN = { '2–6': 5, '1': 2, '5': 2, '6': 2, '&': 2, 'A': 1 };
  const syllables = (w) => SPOKEN[w] ?? Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length);

  const words = [];
  const chunks = [];
  beats.forEach((b, bi) => {
    const toks = b.say.split(/\s+/).filter(Boolean);
    const weights = toks.map((w) => syllables(clean(w)) + 0.6);
    const pauses = toks.map((w, i) => (/[,]$/.test(w) && i < toks.length - 1 ? 1.2 : 0));
    const total = weights.reduce((a, c) => a + c, 0) + pauses.reduce((a, c) => a + c, 0);
    const unit = (b.end - b.t) / total;
    let t = b.t;
    const bw = toks.map((raw, i) => {
      const w = { text: clean(raw), raw, beat: bi, t0: t, t1: t + weights[i] * unit * 0.92, syl: syllables(clean(raw)) };
      w.key = b.key.includes(w.text);
      t += (weights[i] + pauses[i]) * unit;
      words.push(w);
      return w;
    });
    // captions: up to 3 words / 17 characters, never across a comma
    let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    bw.forEach((w) => {
      const len = cur.reduce((a, c) => a + c.text.length + 1, 0) + w.text.length;
      if (cur.length && (cur.length >= 3 || len > 17)) flush();
      cur.push(w);
      if (/[,.]$/.test(w.raw)) flush();
    });
    flush();
  });
  chunks.forEach((c, i) => {
    c.t0 = c[0].t0;
    const n = chunks[i + 1];
    c.t1 = Math.min(n ? n[0].t0 : DURATION, c[c.length - 1].t1 + 0.45);
  });

  const capEl = $('#captions .cap');
  let shownChunk = -1;
  function updateCaptions(t) {
    const ci = chunks.findIndex((c) => t >= c.t0 && t < c.t1);
    if (ci !== shownChunk) {
      shownChunk = ci;
      capEl.innerHTML = ci < 0 ? '' : chunks[ci].map((w) => `<span class="${w.key ? 'key' : ''}">${w.text}</span>`).join(' ');
    }
    if (ci < 0) return;
    const spans = capEl.children;
    chunks[ci].forEach((w, i) => spans[i].classList.toggle('on', t >= w.t0 && (i === chunks[ci].length - 1 || t < chunks[ci][i + 1].t0)));
  }

  // mouth openness 0..1: one open-close per syllable, with a little deterministic variety
  const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  function mouthOpen(t) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (t < w.t0 || t >= w.t1) continue;
      const p = ((t - w.t0) / (w.t1 - w.t0)) * w.syl;
      const k = Math.floor(p);
      const amp = 0.45 + 0.55 * hash(i * 7 + k);
      return amp * Math.sin(Math.PI * (p - k)) ** 0.8;
    }
    return 0;
  }

  const av = {
    head: $('#avatar .head'), body: $('#avatar .body'), brows: $('#avatar .brows'), eyes: $$('#avatar .eye'),
    shape: $$('#avatar .mouth-shape'), line: $('#avatar .mouth-line'),
  };
  function mouthPath(o) {
    const lo = 482 + 46 * o, up = 474 - 2 * o, hw = 34 - 6 * o;
    return `M${380 - hw},478 Q380,${up} ${380 + hw},478 Q380,${lo} ${380 - hw},478Z`;
  }
  function updateAvatar(t) {
    const o = mouthOpen(t);
    const d = mouthPath(o);
    av.shape.forEach((p) => p.setAttribute('d', d));
    av.line.setAttribute('d', o < 0.08 ? 'M344,478 Q380,496 416,478' : '');
    const rot = 1.6 * Math.sin(t * 1.3) + 1.0 * Math.sin(t * 2.7 + 1);
    const nod = 5 * o + 2.5 * Math.sin(t * 2.1);
    av.head.setAttribute('transform', `rotate(${rot.toFixed(3)} 380 600) translate(0 ${nod.toFixed(2)})`);
    av.body.setAttribute('transform', `translate(0 ${(3 * Math.sin(t * 1.1)).toFixed(2)})`);
    // brows lift at the start of each beat
    const since = Math.min(...beats.map((b) => (t >= b.t ? t - b.t : 99)));
    const lift = since < 0.9 ? Math.sin(Math.PI * Math.min(1, since / 0.9)) * 9 : 0;
    av.brows.setAttribute('transform', `translate(0 ${(-lift).toFixed(2)})`);
    // blink: irregular but deterministic
    const bp = (t + 0.7 * Math.sin(t * 0.37)) % 3.4;
    const sy = bp < 0.14 ? Math.max(0.08, Math.abs(bp - 0.07) / 0.07) : 1;
    av.eyes.forEach((e) => {
      const cx = e.dataset.cx, cy = e.dataset.cy;
      e.setAttribute('transform', `translate(${cx} ${cy}) scale(1 ${sy.toFixed(3)}) translate(${-cx} ${-cy})`);
    });
  }

  // ================================================================ timeline
  const cues = [];
  const sfx = (t, name, gain = 1) => cues.push({ t: +t.toFixed(3), name, gain });
  const typing = [];
  let tl;

  function build() {
    tl = gsap.timeline({ paused: true });
    const D = (el) => (typeof el === 'string' ? $$(el) : el);

    beats.forEach((b, i) => {
      const scene = $(`#s${i + 1}`);
      const span = b.next - b.t;
      const k = Math.min(1, span / (S.beats[i + 1] ? S.beats[i + 1].t - S.beats[i].t : 5)); // squeeze if the voice is faster
      const at = (off) => b.t + off * k;
      const t0 = i === 0 ? 0 : b.t; // the first frame is never empty
      tl.set(scene, { autoAlpha: 1 }, t0);
      if (i + 1 < beats.length) tl.to(scene, { autoAlpha: 0, y: -50, duration: 0.22, ease: 'power2.in' }, b.next - 0.12);
      const pops = D(`#s${i + 1} .panel, #s${i + 1} > .pop`).filter((el) => !el.closest('.fan'));
      tl.fromTo(pops, { y: 90, scale: 0.9, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.5)', stagger: 0.12 }, t0);
      if (i > 0) sfx(b.t, 'swish', 0.6);
      SCENES[i]?.(at, scene, b);
    });
  }

  const SCENES = [
    (at) => {
      sfx(at(0), 'boom', 0.55);
      $$('#s1 .mark').forEach((m, j) => {
        tl.fromTo(m, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.22, ease: 'back.out(3)' }, at(0.7 + j * 0.28));
        sfx(at(0.7 + j * 0.28), 'tick', 0.9);
      });
      tl.to('#s1 .ring path', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, at(1.9));
      sfx(at(1.9), 'fail', 0.55);
    },
    (at) => {
      tl.fromTo('#s2 .scan', { y: -120 }, { y: 520, duration: 1.3, ease: 'sine.inOut' }, at(0.3));
      tl.fromTo('#s2 .bar i', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out', stagger: 0.18 }, at(0.4));
      tl.fromTo('#s2 .row em', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.5)', stagger: 0.18 }, at(0.9));
      const imgs = $$('#s2 .fan img');
      [-230, 230, 0].forEach((x, j) => tl.fromTo(imgs[j], { x: -125, y: 300, rotation: 0, autoAlpha: 0 },
        { x: x - 125, y: 0, rotation: [-12, 12, 0][j], autoAlpha: 1, duration: 0.55, ease: 'back.out(1.3)' }, at(2.0 + j * 0.1)));
      tl.fromTo('#s2 .fan .chip', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)' }, at(2.6));
      sfx(at(2.0), 'whoosh', 0.5); sfx(at(2.6), 'glint', 0.7);
    },
    (at) => {
      tl.fromTo('#s3 .badge', { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2.5)' }, at(1.2));
      sfx(at(1.2), 'tick');
      tl.fromTo('#s3 .grade', { scale: 2.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'power3.in' }, at(2.9));
      sfx(at(3.2), 'hit', 0.6); sfx(at(3.25), 'glint', 0.8);
    },
    (at) => {
      tl.fromTo('#s4 .trophy', { y: 60, scale: 0.5, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.8)' }, at(0.5));
      tl.fromTo('#s4 .spot', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, at(0.3));
      const box = $('#s4 .confetti');
      const colors = ['#f5c542', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'];
      for (let j = 0; j < 46; j++) {
        const c = document.createElement('i');
        c.style.left = `${(hash(j + 3) * 940).toFixed(0)}px`;
        c.style.background = colors[j % colors.length];
        box.appendChild(c);
        tl.fromTo(c, { y: -40 - hash(j + 11) * 200, rotation: hash(j) * 360 },
          { y: 680, rotation: `+=${360 + hash(j + 5) * 540}`, x: (hash(j + 9) - 0.5) * 160, duration: 2.2 + hash(j + 2) * 1.2, ease: 'none' }, at(0.9 + hash(j + 7) * 1.2));
      }
      const n = { v: 0 };
      tl.fromTo(n, { v: 0 }, { v: 5, duration: 0.8, ease: 'power2.out', onUpdate: () => { $('#s4 .count').textContent = Math.round(n.v); } }, at(1.3));
      sfx(at(0.9), 'shimmer', 0.9);
    },
    (at) => {
      tl.fromTo('#s5 .r-row', { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.15 }, at(0.3));
      tl.fromTo('#s5 .stamp', { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power3.in' }, at(1.55));
      sfx(at(1.8), 'fail', 0.8);
      tl.fromTo('#s5 .door', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.6)' }, at(2.4));
      tl.fromTo('#s5 .door .strike', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power2.out' }, at(3.3));
      sfx(at(3.3), 'swish', 0.8);
    },
    (at) => {
      sfx(at(0), 'whoosh', 0.7);
      tl.fromTo('#s6 .tile', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.15 }, at(0.7));
      tl.fromTo('#s6 .eq', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, at(1.2));
      tl.fromTo('#s6 .live', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, repeat: 7, yoyo: true }, at(1.0));
      tl.fromTo('#s6 .chip', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)' }, at(2.6));
      sfx(at(2.6), 'glint', 0.7);
    },
    (at) => {
      tl.fromTo('#s7 .arrow', { y: -20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }, at(0.6));
      tl.fromTo('#s7 .free', { scale: 2.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power3.in' }, at(1.5));
      sfx(at(1.7), 'hit', 0.4);
    },
    (at) => {
      tl.fromTo('#s8 .big6', { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, at(0.9));
      sfx(at(0.9), 'boom', 0.5);
      $$('#s8 .chairs i').forEach((c, j) => {
        tl.fromTo(c, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, ease: 'back.out(2)' }, at(1.3 + j * 0.13));
        sfx(at(1.3 + j * 0.13), 'tick', 0.7);
      });
      tl.fromTo('#s8 .note', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35 }, at(2.6));
    },
    (at) => {
      tl.fromTo('#s9 .seal', { rotation: -120 }, { rotation: 0, duration: 0.5, ease: 'back.out(1.6)' }, at(0));
      sfx(at(0.3), 'glint', 0.9);
      tl.fromTo('#s9 .only', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, at(0.35));
      tl.fromTo('#s9 .id', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.6)', stagger: 0.15 }, at(0.9));
      tl.fromTo('#s9 .id em', { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', stagger: 0.15 }, at(1.3));
    },
    (at, scene, b) => {
      $$('#s10 .field').forEach((f, j) => typing.push({ el: f, text: f.dataset.type, t0: at(0.5 + j * 0.8), t1: at(1.1 + j * 0.8) }));
      tl.to('#s10 .btn', { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' }, at(3.1));
      sfx(at(3.1), 'click'); sfx(at(3.25), 'notif', 0.8);
      tl.fromTo('#s10 .down .ic', { y: -6 }, { y: 10, duration: 0.35, repeat: Math.floor((b.next - at(1)) / 0.35) - 1, yoyo: true, ease: 'sine.inOut' }, at(1));
    },
  ];

  function updateTyping(t) {
    typing.forEach((f) => {
      const n = Math.round(Math.max(0, Math.min(1, (t - f.t0) / (f.t1 - f.t0))) * f.text.length);
      const txt = f.text.slice(0, n);
      if (f.el.textContent !== txt) f.el.textContent = txt;
      f.el.classList.toggle('focus', t >= f.t0 - 0.1 && t < f.t1 + 0.3);
    });
  }

  let current = 0;
  function seek(t) {
    current = Math.max(0, Math.min(DURATION, t));
    tl.seek(current, false);
    updateCaptions(current);
    updateAvatar(current);
    updateTyping(current);
  }

  // ---------------------------------------------------------------- preview scaling + controls
  function fit() {
    const s = Math.min(innerWidth / 1080, (innerHeight - (RENDER ? 0 : 44)) / 1920);
    $('#stage').style.transform = RENDER ? 'none' : `translate(${(innerWidth - 1080 * s) / 2}px, 0) scale(${s})`;
  }
  addEventListener('resize', fit);
  fit();

  const ready = Promise.all([document.fonts.ready, loadLogos(), ...$$('img').map((i) => i.decode().catch(() => {}))]).then(() => {
    build();
    seek(+(Q.get('t') || 0));
  });

  if (!RENDER) {
    let playing = false, t0 = 0, p0 = 0;
    const audio = new Audio('../build/soundtrack.wav');
    const scrub = $('#scrub'), time = $('#time'), btn = $('#play');
    const toggle = () => {
      playing = !playing; btn.textContent = playing ? 'Pause' : 'Play';
      if (playing) { t0 = performance.now(); p0 = current >= DURATION ? 0 : current; audio.currentTime = p0; audio.play().catch(() => {}); } else audio.pause();
    };
    btn.onclick = toggle;
    addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
    scrub.oninput = () => { seek((scrub.value / 1000) * DURATION); audio.currentTime = current; };
    const loop = () => {
      if (playing) { seek(p0 + (performance.now() - t0) / 1000); if (current >= DURATION) toggle(); }
      scrub.value = (current / DURATION) * 1000; time.textContent = current.toFixed(2);
      requestAnimationFrame(loop);
    };
    ready.then(loop);
  }

  window.SEKOOL = {
    ready, seek, fps: FPS, width: 1080, height: 1920,
    get duration() { return DURATION; },
    get cues() { return cues; },
    music: { bpm: 100, drop: 0, end: +(DURATION - 1.2).toFixed(2), breakdown: [999, 999], arps: 999 },
  };
})();
