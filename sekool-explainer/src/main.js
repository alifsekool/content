/* SEKOOL explainer · premium edition
 * Deterministic GSAP timeline: every frame is a pure function of time. The renderer
 * calls SEKOOL.seek(t) and screenshots the stage at 60 fps. Sound-effect cues are
 * declared next to the visuals they belong to and exported for the audio mixer. */
(() => {
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  const DURATION = 53;
  const FPS = 60;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- icons
  const ICONS = {
    video: '<rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="M16 10.5l6-3.5v10l-6-3.5z"/>',
    map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.5h6V4"/><path d="M9 12.5l2 2 4-4.5"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M21 17V4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    phone: '<path d="M3 13.5c5-4 13-4 18 0l-2.5 2.5-3-1.5v-2c-2.3-.7-4.7-.7-7 0v2l-3 1.5z"/>',
  };
  const icon = (n, sw = 2.2) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
  $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  // ---------------------------------------------------------------- S2 dot matrix
  const COLS = 40, ROWS = 20, SP = 44;
  const GX = (1920 - (COLS - 1) * SP) / 2, GY = (1080 - (ROWS - 1) * SP) / 2;
  const HC = 24, HR = 14;
  const HX = GX + HC * SP, HY = GY + HR * SP;
  const dotsEl = $('.dots');
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dotsEl.insertAdjacentHTML('beforeend', `<i class="dot${r === HR && c === HC ? ' hero' : ''}" style="left:${GX + c * SP}px;top:${GY + r * SP}px"></i>`);
    }
  }
  dotsEl.style.transformOrigin = `${HX}px ${HY}px`;
  gsap.set('.zoomer', { left: HX, top: HY });
  const dots = $$('.dot');
  const hero = $('.dot.hero');

  // ---------------------------------------------------------------- S4 whiteboard
  const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  $('.eq.e1').innerHTML = `${fr(3, 4)} + ${fr(1, 8)} = ?`;
  $('.eq.e2').innerHTML = `= ${fr(6, 8)} + ${fr(1, 8)}`;
  $('.eq.e3').innerHTML = `= ${fr(7, 8)} <span class="ok">${icon('check', 3)}</span>`;
  $('.btn').insertAdjacentHTML('beforeend', '<i class="sheen"></i>');

  // ---------------------------------------------------------------- headline lines
  $$('.h, .bento-h').forEach((h) => {
    h.innerHTML = h.innerHTML.split(/<br\s*\/?>/).map((l) => `<span class="ln"><span class="lni">${l}</span></span>`).join('');
  });

  // ---------------------------------------------------------------- logos
  // Vector traces of the official SEKOOL logos (from the Learning Roadmap PDFs),
  // inlined so CSS `color` switches them between indigo and white.
  function loadLogos() {
    const kinds = [...new Set($$('[data-logo]').map((el) => el.dataset.logo))];
    return Promise.all(kinds.map((k) => fetch(`assets/logo-${k}.svg`)
      .then((r) => (r.ok ? r.text() : null))
      .then((svg) => { if (svg) $$(`[data-logo="${k}"]`).forEach((el) => { el.innerHTML = svg; }); })
      .catch(() => {})));
  }

  // ================================================================ timeline
  const cues = [];
  const sfx = (t, name, gain = 1) => cues.push({ t: +t.toFixed(3), name, gain });
  let tl;

  function build() {
    tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out', duration: 0.9 } });
    const B = (px) => `blur(${px}px)`;
    const show = (sel, a, b) => { tl.set(sel, { autoAlpha: 1 }, a); if (b != null) tl.set(sel, { autoAlpha: 0 }, b); };
    const blurIn = (el, t, o = {}) => tl.fromTo(el,
      { y: o.y ?? 50, x: o.x ?? 0, opacity: 0, filter: B(o.blur ?? 14), scale: o.scale ?? 1 },
      { y: 0, x: 0, opacity: 1, filter: B(0), scale: 1, duration: o.d ?? 1.0, stagger: o.stagger ?? 0, ease: o.ease ?? 'expo.out' }, t);
    const blurOut = (el, t, o = {}) => tl.to(el,
      { y: o.y ?? -50, opacity: 0, filter: B(o.blur ?? 14), scale: o.scale ?? 1, duration: o.d ?? 0.45, ease: 'power3.in' }, t);
    const linesIn = (el, t) => tl.fromTo($$('.lni', $(el)), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out' }, t);
    const drift = (id, a, b, to = 1.04) => tl.fromTo(`#${id} .cam`, { scale: 1 }, { scale: to, duration: b - a, ease: 'none' }, a);
    const deviceIn = (el, t, holdTo) => {
      tl.fromTo(el, { x: 300, rotationY: -26, rotationX: 8, opacity: 0, scale: 0.92 },
        { x: 0, rotationY: -10, rotationX: 3, opacity: 1, scale: 1, duration: 1.3, ease: 'expo.out' }, t);
      tl.to(el, { rotationY: -4, rotationX: 1, y: -14, duration: holdTo - t - 1.3, ease: 'sine.inOut' }, t + 1.3);
    };
    const featureIn = (id, t0) => {
      blurIn(`#${id} .eyebrow`, t0, { y: 30, d: 0.9 });
      linesIn(`#${id} .h`, t0 + 0.08);
      blurIn(`#${id} .p`, t0 + 0.35, { y: 30 });
      sfx(t0 - 0.15, 'whoosh', 0.55);
    };
    const featureOut = (id, t) => tl.to([`#${id} .ft`, `#${id} .fv`],
      { y: -90, opacity: 0, filter: B(12), duration: 0.5, ease: 'power3.in', stagger: 0.05 }, t);

    // ------------------------------------------------ S1 · Hook (0 – 3.9)
    show('#s1', 0, 3.95);
    drift('s1', 0, 3.95, 1.05);
    [['.k1', 0.12, 1.02], ['.k2', 1.17, 2.12]].forEach(([k, a, b]) => {
      blurIn(`#s1 ${k}`, a, { y: 70, blur: 22, scale: 1.08, d: 0.95 });
      blurOut(`#s1 ${k}`, b, { y: -70, blur: 22 });
    });
    blurIn('#s1 .k3', 2.27, { y: 40, blur: 26, scale: 1.14, d: 1.2 });
    tl.to('#s1 .k3', { scale: 1.3, opacity: 0, filter: B(26), duration: 0.5, ease: 'power3.in' }, 3.45);
    sfx(0.12, 'boom', 0.55); sfx(1.17, 'boom', 0.55); sfx(2.27, 'boom', 0.85);

    // ------------------------------------------------ S2 · Problem (3.6 – 8.0)
    show('#s2', 3.6, 8.05);
    const dist = (i) => Math.hypot((i % COLS) - HC, Math.floor(i / COLS) - HR);
    tl.fromTo(dots, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: (i) => dist(i) * 0.022 }, 3.6);
    tl.fromTo('#s2 .dots', { scale: 1.35 }, { scale: 1, duration: 3.6, ease: 'power2.out' }, 3.6);
    [['.t1', 3.85, 4.9], ['.t2', 5.0, 6.0], ['.t3', 6.1, 7.2]].forEach(([k, a, b]) => {
      blurIn(`#s2 ${k}`, a, { y: 40, blur: 16, d: 0.9 });
      blurOut(`#s2 ${k}`, b, { y: -40 });
    });
    tl.to(dots.filter((d) => d !== hero), { opacity: 0.35, duration: 0.6, ease: 'power2.out' }, 6.3);
    tl.to(hero, { backgroundColor: '#4f46e5', scale: 2, boxShadow: '0 0 30px 10px rgba(79,70,229,.85)', duration: 0.7 }, 6.35);
    tl.to('#s2 .dots', { scale: 16, duration: 0.85, ease: 'power3.in' }, 7.15);
    gsap.set('.zoomer', { scale: 0 });
    tl.to('.zoomer', { scale: 150, duration: 0.65, ease: 'power3.in' }, 7.35);
    sfx(3.6, 'riser', 1); sfx(6.35, 'glint', 0.7);

    // ------------------------------------------------ S3 · Brand (8.0 – 11.9)
    show('#s3', 7.98, 11.95);
    drift('s3', 8.0, 11.95, 1.03);
    const mark = $('#s3 .mark'), wm = $('#s3 .wordmark');
    gsap.set(mark, { x: 960 - (mark.offsetLeft + mark.offsetWidth / 2) });
    tl.fromTo(mark, { scale: 2, opacity: 0, filter: B(30) }, { scale: 1, opacity: 1, filter: B(0), duration: 1.2 }, 8.0);
    tl.to(mark, { x: 0, duration: 1.0, ease: 'expo.inOut' }, 8.7);
    const letters = $$('.lt', wm).length ? $$('.lt', wm) : [wm];
    tl.fromTo(letters, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 1.0, stagger: 0.05 }, 9.05);
    tl.fromTo('#s3 .glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3.5, ease: 'power2.out' }, 8.0);
    blurIn('#s3 .s3-tag', 9.75, { y: 30 });
    blurIn('#s3 .s3-meta', 10.1, { y: 24 });
    tl.to('#s3 .cam', { opacity: 0, filter: B(12), duration: 0.45, ease: 'power3.in' }, 11.3);
    tl.to('#s3', { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, 11.35);
    sfx(8.0, 'hit', 1); sfx(9.05, 'shimmer', 0.6);

    // ------------------------------------------------ S4 · 1-to-1 class (11.4 – 18.6)
    show('#s4', 11.35, 18.7);
    drift('s4', 11.35, 18.7, 1.03);
    featureIn('s4', 11.6);
    deviceIn('#s4 .laptop', 11.5, 18.1);
    blurIn($$('#s4 .chips span'), 12.3, { y: 20, blur: 8, stagger: 0.06, d: 0.8 });
    blurIn('#s4 .note', 12.7, { y: 20, blur: 8, d: 0.8 });
    tl.to('#s4 .live i', { opacity: 0.2, duration: 0.5, repeat: 12, yoyo: true, ease: 'sine.inOut' }, 12.0);
    $$('#s4 .wave i').forEach((b, i) => {
      tl.fromTo(b, { scaleY: 0.3 }, { scaleY: [0.9, 0.55, 1, 0.7, 0.85][i], duration: [0.28, 0.34, 0.22, 0.3, 0.26][i], repeat: 19, yoyo: true, ease: 'sine.inOut' }, 12.2);
    });
    const clock = { s: 12 * 60 + 40 };
    const timer = $('#s4 .timer');
    tl.to(clock, { s: 12 * 60 + 47, duration: 7, ease: 'none', onUpdate: () => {
      const s = Math.floor(clock.s); timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    } }, 11.5);
    [['.e1', 12.9, 0.7], ['.e2', 13.75, 0.6], ['.e3', 14.5, 0.4]].forEach(([c, t, d]) => {
      tl.fromTo(`#s4 .eq${c}`, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: d, ease: 'power1.inOut' }, t);
    });
    tl.fromTo('#s4 .eq.e3 .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 14.95);
    sfx(14.95, 'tick', 0.8);
    featureOut('s4', 18.1);

    // ------------------------------------------------ S5 · Roadmap: the real PDF (18.3 – 26.0)
    show('#s5', 18.25, 26.1);
    drift('s5', 18.25, 26.1, 1.03);
    featureIn('s5', 18.5);
    deviceIn('#s5 .ipad', 18.4, 25.5);
    tl.fromTo('#s5 .free-pill', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, 18.95);
    tl.fromTo('#s5 .sticker', { scale: 1.5, rotation: -24, opacity: 0, filter: B(10) }, { scale: 1, rotation: -8, opacity: 1, filter: B(0), duration: 0.8 }, 19.3);
    sfx(19.3, 'boom', 0.45);
    const PAGE = 854 + 14;
    [[19.7, 1], [21.7, 2], [23.7, 3]].forEach(([t, n]) => {
      tl.to('#s5 .pages', { y: -PAGE * n, duration: 0.9, ease: 'expo.inOut' }, t);
      sfx(t, 'swish', 0.35);
    });
    [['.co1', 20.3, 21.55], ['.co2', 22.3, 23.55], ['.co3', 24.3, null]].forEach(([c, a, b]) => {
      blurIn(`#s5 ${c}`, a, { x: -30, y: 0, blur: 10, d: 0.8 });
      if (b) blurOut(`#s5 ${c}`, b, { y: -20, d: 0.35 });
    });
    featureOut('s5', 25.55);

    // ------------------------------------------------ S6 · Monthly test (25.7 – 33.3)
    show('#s6', 25.65, 33.4);
    drift('s6', 25.65, 33.4, 1.03);
    featureIn('s6', 25.9);
    deviceIn('#s6 .win', 25.8, 32.8);
    tl.fromTo('#s6 .q-prog i', { scaleX: 0.6 }, { scaleX: 1, duration: 1.0 }, 26.5);
    blurIn($$('#s6 .opt'), 26.6, { y: 24, blur: 6, stagger: 0.06, d: 0.8 });
    tl.to('#s6 .opt.pick', { borderColor: '#4f46e5', backgroundColor: '#eef0fd', duration: 0.3, ease: 'power2.out' }, 27.7);
    tl.to('#s6 .opt.pick b', { backgroundColor: '#4f46e5', color: '#ffffff', duration: 0.3, ease: 'power2.out' }, 27.7);
    sfx(27.7, 'click', 0.8);
    tl.fromTo('#s6 .opt .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 28.1);
    tl.to('#s6 .opt.pick', { borderColor: '#22c55e', backgroundColor: '#f0fdf4', duration: 0.3, ease: 'power2.out' }, 28.1);
    tl.to('#s6 .opt.pick b', { backgroundColor: '#22c55e', duration: 0.3, ease: 'power2.out' }, 28.1);
    sfx(28.1, 'glint', 0.6);
    tl.to('#s6 .q-state', { x: -140, opacity: 0, filter: B(10), duration: 0.5, ease: 'power3.in' }, 28.75);
    tl.fromTo('#s6 .r-state', { x: 140, opacity: 0, filter: B(10) }, { x: 0, opacity: 1, filter: B(0), duration: 1.0 }, 29.05);
    sfx(28.8, 'swish', 0.4);
    tl.fromTo('#s6 .ring-fg', { strokeDashoffset: 1 }, { strokeDashoffset: 0.15, duration: 1.6, ease: 'expo.out' }, 29.2);
    const pct = { v: 0 }, pctEl = $('#s6 .pct');
    tl.to(pct, { v: 85, duration: 1.6, ease: 'expo.out', onUpdate: () => { pctEl.textContent = `${Math.round(pct.v)}%`; } }, 29.2);
    blurIn('#s6 .r-lvl', 29.6, { y: 20, blur: 8 });
    blurIn($$('#s6 .r-row'), 29.9, { y: 20, blur: 8, stagger: 0.1, d: 0.8 });
    featureOut('s6', 32.85);

    // ------------------------------------------------ S7 · Progress report (33.0 – 40.6)
    show('#s7', 32.95, 40.7);
    drift('s7', 32.95, 40.7, 1.03);
    featureIn('s7', 33.2);
    deviceIn('#s7 .iphone', 33.1, 40.1);
    tl.fromTo('#s7 .notif', { y: -70, scale: 0.92, opacity: 0, filter: B(8) }, { y: 0, scale: 1, opacity: 1, filter: B(0), duration: 0.9 }, 34.0);
    sfx(34.0, 'notif', 0.8);
    tl.to('#s7 .notif', { scale: 0.96, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 35.05);
    sfx(35.05, 'click', 0.6);
    tl.to('#s7 .lock', { scale: 1.08, opacity: 0, filter: B(10), duration: 0.6, ease: 'power3.inOut' }, 35.25);
    tl.fromTo('#s7 .report', { scale: 0.86, opacity: 0, borderRadius: 60 }, { scale: 1, opacity: 1, borderRadius: 0, duration: 0.8 }, 35.3);
    const tp = { n: 4 }, tpEl = $('#s7 .tp-n');
    tl.to(tp, { n: 5, duration: 0.01, onUpdate: () => { tpEl.textContent = Math.round(tp.n); } }, 36.25);
    tl.fromTo('#s7 .rp-tp', { scale: 1 }, { scale: 1.06, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 36.2);
    tl.fromTo('#s7 .up', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6 }, 36.35);
    sfx(36.25, 'tick', 0.7);
    tl.fromTo('#s7 .spark polyline', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'expo.out' }, 35.9);
    $$('#s7 .mini-ring .fg').forEach((c, i) => {
      tl.fromTo(c, { strokeDashoffset: 1 }, { strokeDashoffset: 1 - +c.dataset.v, duration: 1.2, ease: 'expo.out' }, 36.4 + i * 0.12);
    });
    blurIn('#s7 .rp-card.cnote', 37.1, { y: 20, blur: 8, d: 0.8 });
    featureOut('s7', 40.15);

    // ------------------------------------------------ S8 · Bento recap (40.3 – 45.4)
    show('#s8', 40.25, 45.45);
    drift('s8', 40.25, 45.45, 1.04);
    linesIn('#s8 .bento-h', 40.4);
    blurIn($$('#s8 .tile-b'), 40.85, { y: 80, blur: 10, stagger: 0.09, d: 1.1 });
    sfx(40.3, 'whoosh', 0.55);
    tl.to('#s8 .cam', { opacity: 0, filter: B(14), scale: 1.06, duration: 0.5, ease: 'power3.in' }, 44.95);

    // ------------------------------------------------ S9 · CTA (45.1 – 53)
    show('#s9', 45.1);
    tl.fromTo('#s9', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 45.1);
    drift('s9', 45.1, DURATION, 1.03);
    tl.fromTo('#s9 .cta-glow', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 3 }, 45.3);
    blurIn('#s9 .c1', 45.35, { y: 30 });
    tl.fromTo('#s9 .free-big', { scale: 1.35, opacity: 0, filter: B(24) }, { scale: 1, opacity: 1, filter: B(0), duration: 1.1 }, 45.7);
    blurIn('#s9 .c2r', 45.85, { x: 40, y: 0, blur: 16 });
    sfx(45.7, 'hit', 0.65);
    blurIn('#s9 .c3', 46.6, { y: 24 });
    tl.fromTo('#s9 .btn', { y: 30, opacity: 0, filter: B(10) }, { y: 0, opacity: 1, filter: B(0), duration: 1.0 }, 47.1);
    blurIn('#s9 .endlock', 47.8, { y: 20 });
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.1, ease: 'power2.inOut' }, 48.6);
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.1, ease: 'power2.inOut', immediateRender: false }, 50.6);

    tl.set({}, {}, DURATION);
  }

  // ================================================================ boot
  const ready = (async () => {
    await Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Poppins`)));
    await document.fonts.ready;
    await Promise.all($$('img').map((i) => i.decode().catch(() => {})));
    await loadLogos();
    build();
    tl.seek(0, false);
  })();

  window.SEKOOL = {
    duration: DURATION,
    fps: FPS,
    cues,
    music: { bpm: 120, drop: 8.0, end: 50.0 },
    ready,
    seek: (t) => { tl.seek(t, false); },
  };

  // ================================================================ preview player
  if (!RENDER) {
    const stage = $('#stage');
    const fit = () => {
      const s = Math.min(innerWidth / 1920, (innerHeight - 48) / 1080);
      stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, 0) scale(${s})`;
    };
    addEventListener('resize', fit); fit();
    const playBtn = $('#play'), scrub = $('#scrub'), clk = $('#clock');
    scrub.max = DURATION;
    const audio = new Audio('../build/soundtrack.wav');
    let playing = false, t0 = 0, start = 0, cur = 0;
    const setT = (t) => { cur = Math.max(0, Math.min(DURATION, t)); tl.seek(cur, false); scrub.value = cur; clk.textContent = `${cur.toFixed(2)}s`; };
    const loop = (now) => {
      if (!playing) return;
      const t = audio.readyState >= 2 && !audio.paused ? audio.currentTime : start + (now - t0) / 1000;
      setT(t);
      if (cur >= DURATION) { playing = false; playBtn.textContent = 'Play'; audio.pause(); return; }
      requestAnimationFrame(loop);
    };
    playBtn.onclick = () => {
      playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play';
      if (playing) { t0 = performance.now(); start = cur >= DURATION ? 0 : cur; audio.currentTime = start; audio.play().catch(() => {}); requestAnimationFrame(loop); }
      else audio.pause();
    };
    scrub.oninput = () => { setT(+scrub.value); if (playing) { t0 = performance.now(); start = cur; audio.currentTime = cur; } };
    addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); playBtn.click(); } });
    ready.then(() => setT(+(new URLSearchParams(location.search).get('t') || 0)));
  }
})();
