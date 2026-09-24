/* SEKOOL explainer · premium edition
 * Deterministic GSAP timeline: every frame is a pure function of time. The renderer
 * calls SEKOOL.seek(t) and screenshots the stage at 60 fps. Sound-effect cues are
 * declared next to the visuals they belong to and exported for the audio mixer. */
(() => {
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  const DURATION = 48;
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

  // ---------------------------------------------------------------- S4 whiteboard
  const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  $('.eq.e1').innerHTML = `${fr(3, 4)} + ${fr(1, 8)} = ?`;
  $('.eq.e2').innerHTML = `= ${fr(6, 8)} + ${fr(1, 8)}`;
  $('.eq.e3').innerHTML = `= ${fr(7, 8)} <span class="ok">${icon('check', 3)}</span>`;
  $('.btn').insertAdjacentHTML('beforeend', '<i class="sheen"></i>');

  // ---------------------------------------------------------------- headline lines
  $$('.h, .bento-h, .sp-h, .c2').forEach((h) => {
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
    // Keep animated elements on their own GPU layers for the whole timeline. With the default
    // force3D:'auto', GSAP drops layers when a tween ends, text re-rasterises at a new pixel
    // grid and the frame visibly jumps. A permanent layer moves as one smooth bitmap.
    gsap.config({ force3D: true });
    // measure the "your child" dot before any tween offsets the cards
    let youX, youY;
    { const st = $('#stage').getBoundingClientRect(), k = st.width / 1920, r = $('#s2 .you').getBoundingClientRect();
      youX = (r.left - st.left) / k; youY = (r.top - st.top) / k; }
    let c3x, c3y;
    { const st = $('#stage').getBoundingClientRect(), k = st.width / 1920, r = $('#s2 .tm3').getBoundingClientRect();
      c3x = (r.left + r.width / 2 - st.left) / k; c3y = (r.top + r.height / 2 - st.top) / k; }
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 0.9 } });
    const B = (px) => `blur(${px}px)`;
    const show = (sel, a, b) => { tl.set(sel, { autoAlpha: 1 }, a); if (b != null) tl.set(sel, { autoAlpha: 0 }, b); };
    // Premium motion: short travel, soft blur, power3/power4 ease-outs (expo tails crawl
    // sub-pixel for too long and tick as they settle).
    const soft = (v, k = 0.6) => (typeof v === 'number' ? v * k : v);
    const blurIn = (el, t, o = {}) => tl.fromTo(el,
      { y: soft(o.y ?? 50), x: soft(o.x ?? 0), opacity: 0, filter: B((o.blur ?? 14) * 0.7), scale: o.scale ? 1 + (o.scale - 1) * 0.6 : 1 },
      { y: 0, x: 0, opacity: 1, filter: B(0), scale: 1, duration: (o.d ?? 1.0) * 1.1, stagger: o.stagger ?? 0, ease: o.ease ?? 'power3.out' }, t);
    const blurOut = (el, t, o = {}) => tl.to(el,
      { y: o.y ?? -50, opacity: 0, filter: B(o.blur ?? 14), scale: o.scale ?? 1, duration: o.d ?? 0.45, ease: 'power3.in' }, t);
    const linesIn = (el, t) => tl.fromTo($$('.lni', $(el)), { yPercent: 110 }, { yPercent: 0, duration: 1.15, stagger: 0.1, ease: 'power4.out' }, t);
    // Deliberately no slow 'camera drift' on holds: sub-pixel creeping motion steps between
    // pixels and reads as judder. Motion happens in the transitions; holds stay rock-steady.
    const deviceIn = (el, t) => {
      tl.fromTo(el, { x: 180, rotationY: -20, rotationX: 6, opacity: 0, scale: 0.95 },
        { x: 0, rotationY: -10, rotationX: 3, opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' }, t);
    };
    const featureIn = (id, t0) => {
      blurIn(`#${id} .eyebrow`, t0, { y: 30, d: 0.9 });
      linesIn(`#${id} .h`, t0 + 0.08);
      blurIn(`#${id} .p`, t0 + 0.35, { y: 30 });
      sfx(t0 - 0.15, 'whoosh', 0.55);
    };
    const featureOut = (id, t) => tl.to([`#${id} .ft`, `#${id} .fv`],
      { y: -50, opacity: 0, filter: B(8), duration: 0.5, ease: 'power2.in', stagger: 0.05 }, t);

    // ------------------------------------------------ S1 · Hook (0 – 2.3), fast kinetic type
    gsap.set('#s1', { autoAlpha: 1 }); // visible on the very first frame
    show('#s1', 0, 7.05); // black backdrop stays up under the (transparent) problem scene
    [['.k1', 0.04, 0.6], ['.k2', 0.66, 1.22]].forEach(([k, a, b]) => {
      blurIn(`#s1 ${k}`, a, { y: 60, blur: 18, scale: 1.08, d: 0.6 });
      blurOut(`#s1 ${k}`, b, { y: -60, blur: 18, d: 0.26 });
    });
    blurIn('#s1 .k3', 1.28, { y: 40, blur: 22, scale: 1.14, d: 0.8 });
    tl.to('#s1 .k3', { scale: 1.3, opacity: 0, filter: B(24), duration: 0.35, ease: 'power3.in' }, 1.98);
    sfx(0.04, 'boom', 0.5); sfx(0.66, 'boom', 0.5); sfx(1.28, 'boom', 0.85);

    // ------------------------------------------------ S2 · Problem as an equation (2.1 – 7.0)
    //   Big Tuition Classes + One Pace for Everyone = Your Child Stays Average
    show('#s2', 2.1, 7.05);
    blurIn('#s2 .tm1 .card-d', 2.2, { y: 50, blur: 16, d: 0.8 });
    tl.fromTo($$('#s2 .crowd i'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: { each: 0.012, from: 'center', grid: [7, 7] } }, 2.3);
    blurIn('#s2 .tm1 p', 2.5, { y: 20, blur: 10, d: 0.7 });
    blurIn('#s2 .o1', 3.15, { y: 0, scale: 0.6, blur: 10, d: 0.6 });
    blurIn('#s2 .tm2 .card-d', 3.35, { y: 50, blur: 16, d: 0.8 });
    $$('#s2 .lane i').forEach((dot) => {
      tl.fromTo(dot, { left: '0%' }, { left: 'calc(100% - 24px)', duration: 1.3, ease: 'sine.inOut', repeat: 2, yoyo: true }, 3.45);
    });
    blurIn('#s2 .tm2 p', 3.6, { y: 20, blur: 10, d: 0.7 });
    blurIn('#s2 .o2', 4.35, { y: 0, scale: 0.6, blur: 10, d: 0.6 });
    blurIn('#s2 .tm3 .card-d', 4.45, { y: 50, blur: 16, d: 0.8 });
    tl.fromTo('#s2 .bell', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 4.55);
    blurIn($$('#s2 .c-lbl'), 4.75, { y: 10, blur: 6, stagger: 0.06, d: 0.5 });
    tl.fromTo('#s2 .you i', { y: 140, scale: 0.4, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8 }, 4.9);
    blurIn('#s2 .you span', 5.15, { y: 12, blur: 6, d: 0.5 });
    blurIn('#s2 .tm3 p', 5.0, { y: 20, blur: 10, d: 0.7 });
    tl.fromTo('#s2 .you .pulse', { scale: 1, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 0.9, ease: 'power2.out', repeat: 1 }, 5.15);
    tl.to('#s2 .tm3 .card-d', { boxShadow: 'inset 0 0 0 2px rgba(255,59,48,.55), 0 0 60px -10px rgba(255,59,48,.35)', duration: 0.6, ease: 'power2.out' }, 5.1);
    tl.to('#s2 .bell', { stroke: '#5a5a5f', duration: 0.6 }, 5.1);
    sfx(2.2, 'swish', 0.4); sfx(3.15, 'tick', 0.5); sfx(3.35, 'swish', 0.4); sfx(4.35, 'tick', 0.5); sfx(4.45, 'swish', 0.4);
    sfx(4.9, 'fail', 1.0); sfx(2.6, 'riser', 1);
    // the equation resolves: the first two terms fade away, the result glides to centre and grows
    const S3X = 1.3, DY = 20;
    tl.to(['#s2 .tm1', '#s2 .o1', '#s2 .tm2', '#s2 .o2'], { opacity: 0, x: -80, filter: B(10), duration: 0.6, ease: 'power2.inOut', stagger: 0.04 }, 5.45);
    tl.to('#s2 .tm3', { x: 960 - c3x, y: DY, scale: S3X, duration: 0.85, ease: 'power3.inOut' }, 5.45);
    sfx(5.45, 'swish', 0.35);
    // then dive into the red dot, which blooms from red into SEKOOL indigo
    const dX = 960 + (youX - c3x) * S3X, dY = c3y + DY + (youY - c3y) * S3X;
    gsap.set('#s2 .zoomer', { left: dX, top: dY, scale: 0, backgroundColor: '#ff3b30' });
    tl.to('#s2 .cam', { scale: 12, transformOrigin: `${dX}px ${dY}px`, duration: 0.75, ease: 'power3.in' }, 6.25);
    tl.to('#s2 .zoomer', { scale: 150, duration: 0.6, ease: 'power3.in' }, 6.4);
    tl.to('#s2 .zoomer', { backgroundColor: '#4f46e5', duration: 0.6, ease: 'sine.inOut' }, 6.4);

    // ------------------------------------------------ S3 · Brand (7.0 – 10.9): sk turns into SEKOOL
    show('#s3', 6.98, 11.3);
    const mark = $('#s3 .mark'), wm = $('#s3 .wordmark');
    tl.fromTo(mark, { scale: 2, opacity: 0, filter: B(30) }, { scale: 1, opacity: 1, filter: B(0), duration: 1.0 }, 7.0);
    tl.to(mark, { scale: 0.55, opacity: 0, filter: B(12), duration: 0.5, ease: 'power2.in' }, 7.75);
    const letters = $$('.lt', wm).length ? $$('.lt', wm) : [wm];
    tl.fromTo(wm, { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'power3.out' }, 7.95);
    tl.fromTo(letters, { opacity: 0, filter: B(8) }, { opacity: 1, filter: B(0), duration: 0.8, ease: 'power2.out', stagger: { each: 0.05, from: 'center' } }, 7.95);
    tl.fromTo('#s3 .glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, 7.0);
    blurIn('#s3 .s3-tag', 8.6, { y: 30, d: 0.8 });
    blurIn('#s3 .s3-tag2', 8.95, { y: 30, d: 0.8 });
    tl.fromTo('#s3 .s3-tag2 b', { backgroundColor: 'rgba(255,255,255,0)', color: '#ffffff' }, { backgroundColor: 'rgba(255,255,255,1)', color: '#4f46e5', duration: 0.5, ease: 'power2.out' }, 9.55);
    tl.to('#s3 .cam', { opacity: 0, filter: B(12), duration: 0.35, ease: 'power3.in' }, 10.6);
    tl.to('#s3', { yPercent: -100, duration: 0.65, ease: 'expo.inOut' }, 10.65);
    sfx(7.0, 'hit', 1); sfx(7.95, 'shimmer', 0.6); sfx(9.55, 'glint', 0.5);

    // ------------------------------------------------ S3b · Speed: average -> excellent in 1 month (10.7 – 15.0)
    show('#s3b', 10.65, 15.05);
    linesIn('#s3b .sp-h', 11.1);
    sfx(10.7, 'whoosh', 0.55);
    blurIn('#s3b .sp-track-wrap', 11.65, { y: 30, blur: 10, d: 0.8 });
    const days = { d: 1 }, dayEl = $('#s3b .sp-day b');
    tl.fromTo('#s3b .sp-fill', { scaleX: 0.02 }, { scaleX: 1, duration: 1.5, ease: 'expo.inOut' }, 12.1);
    tl.fromTo('#s3b .sp-head', { left: '1%' }, { left: '100%', duration: 1.5, ease: 'expo.inOut' }, 12.1);
    tl.to(days, { d: 30, duration: 1.5, ease: 'expo.inOut', onUpdate: () => { dayEl.textContent = Math.round(days.d); } }, 12.1);
    tl.to('#s3b .sp-from', { opacity: 0.35, duration: 0.4 }, 12.5);
    tl.fromTo('#s3b .sp-to', { scale: 0.85, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.7 }, 13.4);
    sfx(12.1, 'swish', 0.5); sfx(13.45, 'glint', 0.8);
    tl.to('#s3b .cam', { y: -90, opacity: 0, filter: B(12), duration: 0.4, ease: 'power3.in' }, 14.6);

    // ------------------------------------------------ feature scenes (slightly relaxed: offsets x K)
    const K = 1.2;
    const at = (T, x) => T + x * K;

    // S4 · 1 to 1 class with Cikgu Sekolah Kebangsaan
    show('#s4', T4 - 0.05, T5 + 0.1);
    featureIn('s4', T4 + 0.1);
    deviceIn('#s4 .laptop', T4);
    blurIn($$('#s4 .chips span'), at(T4, 0.7), { y: 20, blur: 8, stagger: 0.05, d: 0.7 });
    blurIn('#s4 .note', at(T4, 1.0), { y: 20, blur: 8, d: 0.7 });
    tl.fromTo('#s4 .sk-badge', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, transformOrigin: '0% 50%' }, at(T4, 0.8));
    sfx(at(T4, 0.8), 'glint', 0.5);
    tl.to('#s4 .live i', { opacity: 0.2, duration: 0.5, repeat: 10, yoyo: true, ease: 'sine.inOut' }, T4 + 0.3);
    $$('#s4 .wave i').forEach((b, i) => {
      tl.fromTo(b, { scaleY: 0.3 }, { scaleY: [0.9, 0.55, 1, 0.7, 0.85][i], duration: [0.28, 0.34, 0.22, 0.3, 0.26][i], repeat: 16, yoyo: true, ease: 'sine.inOut' }, T4 + 0.5);
    });
    const clock = { s: 12 * 60 + 40 };
    const timer = $('#s4 .timer');
    tl.to(clock, { s: 12 * 60 + 45, duration: T5 - T4, ease: 'none', onUpdate: () => {
      const s = Math.floor(clock.s); timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    } }, T4);
    [['.e1', at(T4, 1.2), 0.55], ['.e2', at(T4, 1.8), 0.5], ['.e3', at(T4, 2.35), 0.4]].forEach(([c, t, d]) => {
      tl.fromTo(`#s4 .eq${c}`, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: d, ease: 'power1.inOut' }, t);
    });
    tl.fromTo('#s4 .eq.e3 .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, at(T4, 2.8));
    sfx(at(T4, 2.8), 'tick', 0.8);
    featureOut('s4', T5 - 0.45);

    // S5 · Roadmap: the real PDF
    show('#s5', T5 - 0.05, T6 + 0.1);
    featureIn('s5', T5 + 0.1);
    deviceIn('#s5 .ipad', T5);
    tl.fromTo('#s5 .free-pill', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7 }, at(T5, 0.4));
    tl.fromTo('#s5 .sticker', { scale: 1.5, rotation: -24, opacity: 0, filter: B(10) }, { scale: 1, rotation: -8, opacity: 1, filter: B(0), duration: 0.7 }, at(T5, 0.7));
    sfx(at(T5, 0.7), 'boom', 0.45);
    const PAGE = 854 + 14;
    [[at(T5, 1.0), 1], [at(T5, 2.3), 2], [at(T5, 3.6), 3]].forEach(([t, n]) => {
      tl.to('#s5 .pages', { y: -PAGE * n, duration: 0.75, ease: 'expo.inOut' }, t);
      sfx(t, 'swish', 0.35);
    });
    [['.co1', at(T5, 1.4), at(T5, 2.2)], ['.co2', at(T5, 2.7), at(T5, 3.5)], ['.co3', at(T5, 4.0), null]].forEach(([c, a, b]) => {
      blurIn(`#s5 ${c}`, a, { x: -30, y: 0, blur: 10, d: 0.6 });
      if (b) blurOut(`#s5 ${c}`, b, { y: -20, d: 0.3 });
    });
    featureOut('s5', T6 - 0.45);

    // S6 · Monthly test
    show('#s6', T6 - 0.05, T7 + 0.1);
    featureIn('s6', T6 + 0.1);
    deviceIn('#s6 .win', T6);
    tl.fromTo('#s6 .q-prog i', { scaleX: 0.6 }, { scaleX: 1, duration: 0.8 }, at(T6, 0.5));
    blurIn($$('#s6 .opt'), at(T6, 0.55), { y: 24, blur: 6, stagger: 0.05, d: 0.6 });
    tl.to('#s6 .opt.pick', { borderColor: '#4f46e5', backgroundColor: '#eef0fd', duration: 0.25, ease: 'power2.out' }, at(T6, 1.35));
    tl.to('#s6 .opt.pick b', { backgroundColor: '#4f46e5', color: '#ffffff', duration: 0.25, ease: 'power2.out' }, at(T6, 1.35));
    sfx(at(T6, 1.35), 'click', 0.8);
    tl.fromTo('#s6 .opt .ok', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, at(T6, 1.65));
    tl.to('#s6 .opt.pick', { borderColor: '#22c55e', backgroundColor: '#f0fdf4', duration: 0.25, ease: 'power2.out' }, at(T6, 1.65));
    tl.to('#s6 .opt.pick b', { backgroundColor: '#22c55e', duration: 0.25, ease: 'power2.out' }, at(T6, 1.65));
    sfx(at(T6, 1.65), 'glint', 0.6);
    tl.to('#s6 .q-state', { x: -140, opacity: 0, filter: B(10), duration: 0.4, ease: 'power3.in' }, at(T6, 2.1));
    tl.fromTo('#s6 .r-state', { x: 140, opacity: 0, filter: B(10) }, { x: 0, opacity: 1, filter: B(0), duration: 0.8 }, at(T6, 2.35));
    sfx(at(T6, 2.15), 'swish', 0.4);
    tl.fromTo('#s6 .ring-fg', { strokeDashoffset: 1 }, { strokeDashoffset: 0.15, duration: 1.2, ease: 'expo.out' }, at(T6, 2.45));
    const pct = { v: 0 }, pctEl = $('#s6 .pct');
    tl.to(pct, { v: 85, duration: 1.2, ease: 'expo.out', onUpdate: () => { pctEl.textContent = `${Math.round(pct.v)}%`; } }, at(T6, 2.45));
    blurIn('#s6 .r-lvl', at(T6, 2.7), { y: 20, blur: 8, d: 0.7 });
    blurIn($$('#s6 .r-row'), at(T6, 2.9), { y: 20, blur: 8, stagger: 0.08, d: 0.6 });
    featureOut('s6', T7 - 0.45);

    // S7 · Progress report
    show('#s7', T7 - 0.05, T8 + 0.1);
    featureIn('s7', T7 + 0.1);
    deviceIn('#s7 .iphone', T7);
    tl.fromTo('#s7 .notif', { y: -70, scale: 0.92, opacity: 0, filter: B(8) }, { y: 0, scale: 1, opacity: 1, filter: B(0), duration: 0.7 }, at(T7, 0.6));
    sfx(at(T7, 0.6), 'notif', 0.8);
    tl.to('#s7 .notif', { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' }, at(T7, 1.35));
    sfx(at(T7, 1.35), 'click', 0.6);
    tl.to('#s7 .lock', { scale: 1.08, opacity: 0, filter: B(10), duration: 0.5, ease: 'power3.inOut' }, at(T7, 1.5));
    tl.fromTo('#s7 .report', { scale: 0.86, opacity: 0, borderRadius: 60 }, { scale: 1, opacity: 1, borderRadius: 0, duration: 0.7 }, at(T7, 1.55));
    const tp = { n: 4 }, tpEl = $('#s7 .tp-n');
    tl.to(tp, { n: 5, duration: 0.01, onUpdate: () => { tpEl.textContent = Math.round(tp.n); } }, at(T7, 2.3));
    tl.fromTo('#s7 .rp-tp', { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, at(T7, 2.25));
    tl.fromTo('#s7 .up', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, at(T7, 2.4));
    sfx(at(T7, 2.3), 'tick', 0.7);
    tl.fromTo('#s7 .spark polyline', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.0, ease: 'expo.out' }, at(T7, 2.0));
    $$('#s7 .mini-ring .fg').forEach((c, i) => {
      tl.fromTo(c, { strokeDashoffset: 1 }, { strokeDashoffset: 1 - +c.dataset.v, duration: 1.0, ease: 'expo.out' }, at(T7, 2.3) + i * 0.08);
    });
    blurIn('#s7 .rp-card.cnote', at(T7, 2.8), { y: 20, blur: 8, d: 0.6 });
    featureOut('s7', T8 - 0.45);

    // S8 · Bento recap
    show('#s8', T8 - 0.05, T9 + 0.1);
    linesIn('#s8 .bento-h', T8 + 0.1);
    blurIn($$('#s8 .tile-b'), at(T8, 0.5), { y: 80, blur: 10, stagger: 0.08, d: 0.9 });
    sfx(T8 - 0.1, 'whoosh', 0.55);
    tl.to('#s8 .cam', { opacity: 0, filter: B(14), scale: 1.06, duration: 0.4, ease: 'power3.in' }, T9 - 0.4);

    // S9 · CTA: short and clean
    show('#s9', T9 - 0.2);
    tl.fromTo('#s9', { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'sine.inOut' }, T9 - 0.2);
    tl.fromTo('#s9 .cta-glow', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 3 }, T9 + 0.2);
    linesIn('#s9 .c2', T9 + 0.2);
    sfx(T9 + 0.25, 'hit', 0.6);
    tl.fromTo('#s9 .btn', { y: 30, opacity: 0, filter: B(10) }, { y: 0, opacity: 1, filter: B(0), duration: 0.9 }, T9 + 1.0);
    blurIn('#s9 .endlock', T9 + 1.5, { y: 20, d: 0.8 });
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut' }, T9 + 2.2);
    tl.fromTo('#s9 .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut', immediateRender: false }, T9 + 4.2);

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

  // ---------------------------------------------------------------- virtual camera
  // Slow, subtle push-ins are NOT done in the page: Chromium snaps slowly moving text to the
  // pixel grid, which reads as shake. Instead the page stays still and the renderer applies
  // this camera afterwards with sub-pixel image interpolation, like a camera move in an editor.
  // Each segment: [start, end, scaleFrom, scaleTo]. Resets happen under transitions.
  const T4 = 14.9, T5 = 20.3, T6 = 26.4, T7 = 31.7, T8 = 37.0, T9 = 41.5;
  const CAMERA = [
    [0, 2.1, 1.0, 1.05],
    [2.1, 6.2, 1.0, 1.025], [6.2, 7.0, 1.025, 1.025],
    [7.0, 10.95, 1.0, 1.03],
    [10.95, T4 + 0.02, 1.0, 1.03],
    [T4 + 0.02, T5 + 0.02, 1.0, 1.03],
    [T5 + 0.02, T6 + 0.02, 1.0, 1.03],
    [T6 + 0.02, T7 + 0.02, 1.0, 1.03],
    [T7 + 0.02, T8 + 0.02, 1.0, 1.03],
    [T8 + 0.02, T9, 1.0, 1.035],
    [T9, DURATION, 1.0, 1.035],
  ];
  const camera = (t) => {
    const seg = CAMERA.find(([a, b]) => t >= a && t < b) || CAMERA[CAMERA.length - 1];
    const [a, b, s0, s1] = seg;
    const p = Math.min(1, Math.max(0, (t - a) / (b - a)));
    const e = 1 - Math.pow(1 - p, 1.6); // gentle ease-out so each push settles
    return { scale: s0 + (s1 - s0) * e, x: 0, y: 0 };
  };

  window.SEKOOL = {
    camera,
    duration: DURATION,
    fps: FPS,
    cues,
    music: { bpm: 120, drop: 7.0, end: 45.0, breakdown: [41.0, 43.0], arps: 37.0, duck: [[4.85, 6.3]] },
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
