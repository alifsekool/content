/* SEKOOL explainer · premium edition
 * Deterministic GSAP timeline: every frame is a pure function of time. The renderer
 * calls SEKOOL.seek(t) and screenshots the stage at 60 fps. Sound-effect cues are
 * declared next to the visuals they belong to and exported for the audio mixer. */
(() => {
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  const DURATION = 42;
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
  $$('.h, .bento-h, .sp-h').forEach((h) => {
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

    // ------------------------------------------------ S1 · Hook (0 – 2.3), fast kinetic type
    show('#s1', 0, 2.35);
    drift('s1', 0, 2.35, 1.06);
    [['.k1', 0.04, 0.6], ['.k2', 0.66, 1.22]].forEach(([k, a, b]) => {
      blurIn(`#s1 ${k}`, a, { y: 60, blur: 18, scale: 1.08, d: 0.6 });
      blurOut(`#s1 ${k}`, b, { y: -60, blur: 18, d: 0.26 });
    });
    blurIn('#s1 .k3', 1.28, { y: 40, blur: 22, scale: 1.14, d: 0.8 });
    tl.to('#s1 .k3', { scale: 1.3, opacity: 0, filter: B(24), duration: 0.35, ease: 'power3.in' }, 1.98);
    sfx(0.04, 'boom', 0.5); sfx(0.66, 'boom', 0.5); sfx(1.28, 'boom', 0.85);

    // ------------------------------------------------ S2 · Problem (2.1 – 6.0)
    show('#s2', 2.1, 6.05);
    const dist = (i) => Math.hypot((i % COLS) - HC, Math.floor(i / COLS) - HR);
    tl.fromTo(dots, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: (i) => dist(i) * 0.018 }, 2.1);
    tl.fromTo('#s2 .dots', { scale: 1.35 }, { scale: 1, duration: 3.0, ease: 'power2.out' }, 2.1);
    [['.t1', 2.3, 3.05], ['.t2', 3.15, 3.9], ['.t3', 4.0, 5.1]].forEach(([k, a, b]) => {
      blurIn(`#s2 ${k}`, a, { y: 40, blur: 16, d: 0.65 });
      blurOut(`#s2 ${k}`, b, { y: -40, d: 0.3 });
    });
    tl.to(dots.filter((d) => d !== hero), { opacity: 0.35, duration: 0.5, ease: 'power2.out' }, 4.1);
    tl.to(hero, { backgroundColor: '#4f46e5', scale: 2, boxShadow: '0 0 30px 10px rgba(79,70,229,.85)', duration: 0.6 }, 4.15);
    tl.to('#s2 .dots', { scale: 16, duration: 0.8, ease: 'power3.in' }, 5.2);
    gsap.set('.zoomer', { scale: 0 });
    tl.to('.zoomer', { scale: 150, duration: 0.65, ease: 'power3.in' }, 5.35);
    sfx(1.6, 'riser', 1); sfx(4.15, 'glint', 0.7);

    // ------------------------------------------------ S3 · Brand (6.0 – 8.9)
    show('#s3', 5.98, 9.3);
    drift('s3', 6.0, 9.3, 1.03);
    const mark = $('#s3 .mark'), wm = $('#s3 .wordmark');
    gsap.set(mark, { x: 960 - (mark.offsetLeft + mark.offsetWidth / 2) });
    tl.fromTo(mark, { scale: 2, opacity: 0, filter: B(30) }, { scale: 1, opacity: 1, filter: B(0), duration: 1.0 }, 6.0);
    tl.to(mark, { x: 0, duration: 0.85, ease: 'expo.inOut' }, 6.5);
    const letters = $$('.lt', wm).length ? $$('.lt', wm) : [wm];
    tl.fromTo(letters, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.045 }, 6.8);
    tl.fromTo('#s3 .glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, 6.0);
    blurIn('#s3 .s3-tag', 7.35, { y: 30, d: 0.8 });
    blurIn('#s3 .s3-meta', 7.6, { y: 24, d: 0.8 });
    tl.to('#s3 .cam', { opacity: 0, filter: B(12), duration: 0.35, ease: 'power3.in' }, 8.6);
    tl.to('#s3', { yPercent: -100, duration: 0.65, ease: 'expo.inOut' }, 8.65);
    sfx(6.0, 'hit', 1); sfx(6.8, 'shimmer', 0.6);

    // ------------------------------------------------ S3b · Speed: average -> excellent in 1 month (8.7 – 12.3)
    show('#s3b', 8.65, 12.45);
    drift('s3b', 8.65, 12.45, 1.04);
    linesIn('#s3b .sp-h', 8.8);
    sfx(8.7, 'whoosh', 0.55);
    blurIn('#s3b .sp-track-wrap', 9.5, { y: 30, blur: 10, d: 0.8 });
    const days = { d: 1 }, dayEl = $('#s3b .sp-day b');
    tl.fromTo('#s3b .sp-fill', { scaleX: 0.02 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 9.9);
    tl.fromTo('#s3b .sp-head', { left: '1%' }, { left: '100%', duration: 1.3, ease: 'expo.inOut' }, 9.9);
    tl.to(days, { d: 30, duration: 1.3, ease: 'expo.inOut', onUpdate: () => { dayEl.textContent = Math.round(days.d); } }, 9.9);
    tl.to('#s3b .sp-from', { opacity: 0.35, duration: 0.4 }, 10.3);
    tl.fromTo('#s3b .sp-to', { scale: 0.85, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.7 }, 11.1);
    sfx(9.9, 'swish', 0.5); sfx(11.15, 'glint', 0.8);
    tl.to('#s3b .cam', { y: -90, opacity: 0, filter: B(12), duration: 0.4, ease: 'power3.in' }, 12.0);

    // ------------------------------------------------ feature scenes: tight, cut ~1 s after each demo lands
    const T4 = 12.3, T5 = 16.75, T6 = 21.85, T7 = 26.25, T8 = 30.6, T9 = 34.4;

    // S4 · 1-to-1 class
    show('#s4', T4 - 0.05, T5 + 0.1);
    drift('s4', T4 - 0.05, T5 + 0.1, 1.03);
    featureIn('s4', T4 + 0.1);
    deviceIn('#s4 .laptop', T4, T5 - 0.4);
    blurIn($$('#s4 .chips span'), T4 + 0.6, { y: 20, blur: 8, stagger: 0.05, d: 0.7 });
    blurIn('#s4 .note', T4 + 0.9, { y: 20, blur: 8, d: 0.7 });
    tl.to('#s4 .live i', { opacity: 0.2, duration: 0.5, repeat: 8, yoyo: true, ease: 'sine.inOut' }, T4 + 0.3);
    $$('#s4 .wave i').forEach((b, i) => {
      tl.fromTo(b, { scaleY: 0.3 }, { scaleY: [0.9, 0.55, 1, 0.7, 0.85][i], duration: [0.28, 0.34, 0.22, 0.3, 0.26][i], repeat: 13, yoyo: true, ease: 'sine.inOut' }, T4 + 0.5);
    });
    const clock = { s: 12 * 60 + 40 };
    const timer = $('#s4 .timer');
    tl.to(clock, { s: 12 * 60 + 45, duration: 4.4, ease: 'none', onUpdate: () => {
      const s = Math.floor(clock.s); timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    } }, T4);
    [['.e1', T4 + 1.0, 0.5], ['.e2', T4 + 1.6, 0.45], ['.e3', T4 + 2.15, 0.35]].forEach(([c, t, d]) => {
      tl.fromTo(`#s4 .eq${c}`, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: d, ease: 'power1.inOut' }, t);
    });
    tl.fromTo('#s4 .eq.e3 .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, T4 + 2.55);
    sfx(T4 + 2.55, 'tick', 0.8);
    featureOut('s4', T5 - 0.45);

    // S5 · Roadmap: the real PDF
    show('#s5', T5 - 0.05, T6 + 0.1);
    drift('s5', T5 - 0.05, T6 + 0.1, 1.03);
    featureIn('s5', T5 + 0.1);
    deviceIn('#s5 .ipad', T5, T6 - 0.4);
    tl.fromTo('#s5 .free-pill', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7 }, T5 + 0.4);
    tl.fromTo('#s5 .sticker', { scale: 1.5, rotation: -24, opacity: 0, filter: B(10) }, { scale: 1, rotation: -8, opacity: 1, filter: B(0), duration: 0.7 }, T5 + 0.7);
    sfx(T5 + 0.7, 'boom', 0.45);
    const PAGE = 854 + 14;
    [[T5 + 1.0, 1], [T5 + 2.3, 2], [T5 + 3.6, 3]].forEach(([t, n]) => {
      tl.to('#s5 .pages', { y: -PAGE * n, duration: 0.7, ease: 'expo.inOut' }, t);
      sfx(t, 'swish', 0.35);
    });
    [['.co1', T5 + 1.4, T5 + 2.2], ['.co2', T5 + 2.7, T5 + 3.5], ['.co3', T5 + 4.0, null]].forEach(([c, a, b]) => {
      blurIn(`#s5 ${c}`, a, { x: -30, y: 0, blur: 10, d: 0.6 });
      if (b) blurOut(`#s5 ${c}`, b, { y: -20, d: 0.3 });
    });
    featureOut('s5', T6 - 0.45);

    // S6 · Monthly test
    show('#s6', T6 - 0.05, T7 + 0.1);
    drift('s6', T6 - 0.05, T7 + 0.1, 1.03);
    featureIn('s6', T6 + 0.1);
    deviceIn('#s6 .win', T6, T7 - 0.4);
    tl.fromTo('#s6 .q-prog i', { scaleX: 0.6 }, { scaleX: 1, duration: 0.8 }, T6 + 0.5);
    blurIn($$('#s6 .opt'), T6 + 0.55, { y: 24, blur: 6, stagger: 0.05, d: 0.6 });
    tl.to('#s6 .opt.pick', { borderColor: '#4f46e5', backgroundColor: '#eef0fd', duration: 0.25, ease: 'power2.out' }, T6 + 1.35);
    tl.to('#s6 .opt.pick b', { backgroundColor: '#4f46e5', color: '#ffffff', duration: 0.25, ease: 'power2.out' }, T6 + 1.35);
    sfx(T6 + 1.35, 'click', 0.8);
    tl.fromTo('#s6 .opt .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, T6 + 1.65);
    tl.to('#s6 .opt.pick', { borderColor: '#22c55e', backgroundColor: '#f0fdf4', duration: 0.25, ease: 'power2.out' }, T6 + 1.65);
    tl.to('#s6 .opt.pick b', { backgroundColor: '#22c55e', duration: 0.25, ease: 'power2.out' }, T6 + 1.65);
    sfx(T6 + 1.65, 'glint', 0.6);
    tl.to('#s6 .q-state', { x: -140, opacity: 0, filter: B(10), duration: 0.4, ease: 'power3.in' }, T6 + 2.1);
    tl.fromTo('#s6 .r-state', { x: 140, opacity: 0, filter: B(10) }, { x: 0, opacity: 1, filter: B(0), duration: 0.8 }, T6 + 2.35);
    sfx(T6 + 2.15, 'swish', 0.4);
    tl.fromTo('#s6 .ring-fg', { strokeDashoffset: 1 }, { strokeDashoffset: 0.15, duration: 1.2, ease: 'expo.out' }, T6 + 2.45);
    const pct = { v: 0 }, pctEl = $('#s6 .pct');
    tl.to(pct, { v: 85, duration: 1.2, ease: 'expo.out', onUpdate: () => { pctEl.textContent = `${Math.round(pct.v)}%`; } }, T6 + 2.45);
    blurIn('#s6 .r-lvl', T6 + 2.7, { y: 20, blur: 8, d: 0.7 });
    blurIn($$('#s6 .r-row'), T6 + 2.9, { y: 20, blur: 8, stagger: 0.08, d: 0.6 });
    featureOut('s6', T7 - 0.45);

    // S7 · Progress report
    show('#s7', T7 - 0.05, T8 + 0.1);
    drift('s7', T7 - 0.05, T8 + 0.1, 1.03);
    featureIn('s7', T7 + 0.1);
    deviceIn('#s7 .iphone', T7, T8 - 0.4);
    tl.fromTo('#s7 .notif', { y: -70, scale: 0.92, opacity: 0, filter: B(8) }, { y: 0, scale: 1, opacity: 1, filter: B(0), duration: 0.7 }, T7 + 0.6);
    sfx(T7 + 0.6, 'notif', 0.8);
    tl.to('#s7 .notif', { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T7 + 1.35);
    sfx(T7 + 1.35, 'click', 0.6);
    tl.to('#s7 .lock', { scale: 1.08, opacity: 0, filter: B(10), duration: 0.5, ease: 'power3.inOut' }, T7 + 1.5);
    tl.fromTo('#s7 .report', { scale: 0.86, opacity: 0, borderRadius: 60 }, { scale: 1, opacity: 1, borderRadius: 0, duration: 0.7 }, T7 + 1.55);
    const tp = { n: 4 }, tpEl = $('#s7 .tp-n');
    tl.to(tp, { n: 5, duration: 0.01, onUpdate: () => { tpEl.textContent = Math.round(tp.n); } }, T7 + 2.3);
    tl.fromTo('#s7 .rp-tp', { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, T7 + 2.25);
    tl.fromTo('#s7 .up', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, T7 + 2.4);
    sfx(T7 + 2.3, 'tick', 0.7);
    tl.fromTo('#s7 .spark polyline', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.0, ease: 'expo.out' }, T7 + 2.0);
    $$('#s7 .mini-ring .fg').forEach((c, i) => {
      tl.fromTo(c, { strokeDashoffset: 1 }, { strokeDashoffset: 1 - +c.dataset.v, duration: 1.0, ease: 'expo.out' }, T7 + 2.3 + i * 0.08);
    });
    blurIn('#s7 .rp-card.cnote', T7 + 2.8, { y: 20, blur: 8, d: 0.6 });
    featureOut('s7', T8 - 0.45);

    // S8 · Bento recap: average -> excellent in 1 month
    show('#s8', T8 - 0.05, T9 + 0.1);
    drift('s8', T8 - 0.05, T9 + 0.1, 1.04);
    linesIn('#s8 .bento-h', T8 + 0.1);
    blurIn($$('#s8 .tile-b'), T8 + 0.5, { y: 80, blur: 10, stagger: 0.07, d: 0.9 });
    sfx(T8 - 0.1, 'whoosh', 0.55);
    tl.to('#s8 .cam', { opacity: 0, filter: B(14), scale: 1.06, duration: 0.4, ease: 'power3.in' }, T9 - 0.4);

    // S9 · CTA
    show('#s9', T9);
    tl.fromTo('#s9', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, T9);
    drift('s9', T9, DURATION, 1.03);
    tl.fromTo('#s9 .cta-glow', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 3 }, T9 + 0.2);
    blurIn('#s9 .c1', T9 + 0.2, { y: 30, d: 0.8 });
    tl.fromTo('#s9 .free-big', { scale: 1.35, opacity: 0, filter: B(24) }, { scale: 1, opacity: 1, filter: B(0), duration: 1.0 }, T9 + 0.6);
    blurIn('#s9 .c2r', T9 + 0.75, { x: 40, y: 0, blur: 16, d: 0.9 });
    sfx(T9 + 0.6, 'hit', 0.65);
    blurIn('#s9 .c3', T9 + 1.3, { y: 24, d: 0.8 });
    tl.fromTo('#s9 .btn', { y: 30, opacity: 0, filter: B(10) }, { y: 0, opacity: 1, filter: B(0), duration: 0.9 }, T9 + 1.7);
    blurIn('#s9 .endlock', T9 + 2.2, { y: 20, d: 0.8 });
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut' }, T9 + 2.8);
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut', immediateRender: false }, T9 + 4.8);

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
    music: { bpm: 120, drop: 6.0, end: 40.0, breakdown: [34.0, 36.0], arps: 30.0 },
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
