/* SEKOOL explainer Reels · motion-graphics explainers in Bahasa Melayu, 1080x1920.
 * Pick one with ?ad=<name>. Each scene is { dur, bg, html, anim }: the copy lives in
 * `html`, and `anim(a)` places its animations with times relative to the scene start.
 * The renderer calls SEKOOL.seek(t) frame by frame; sound-effect cues are exported for
 * the mixer (../sekool-explainer/audio/generate_audio.py).
 *
 * Keep text between y = 260 and y = 1250: Reels and Stories cover the top ~14% and the
 * bottom ~35% of the frame with their own UI. */
(() => {
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  if (RENDER) document.body.classList.add('render');
  const FPS = 30;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- icons
  const ICONS = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
    arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
    down: '<path d="M12 4v15M5.5 12.5L12 19l6.5-6.5"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  };
  const icon = (n, sw = 2.4) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  // ---------------------------------------------------------------- building blocks
  const hl = (lines, cls = '', style = '') => `<h2 class="hl ${cls}" style="${style}">${lines.join('<br>')}</h2>`;
  const paper = (top) => `<div class="v card paper" style="top:${top}px"><h4>Ujian Matematik</h4>
    ${[['Soalan 1', 'x'], ['Soalan 2', 'check'], ['Soalan 3', 'x'], ['Soalan 4', 'x']].map(([l, m]) =>
      `<div class="row"><span>${l}</span><i></i><b class="mk ${m === 'check' ? 'ok' : ''}">${icon(m, 3)}</b></div>`).join('')}
    <div class="score">38</div><div class="stamp">GAGAL</div></div>`;
  // the four areas in SEKOOL's Learning Roadmap; the weak ones are flagged
  const AREAS = [['Concept', 78, false], ['Calculation', 84, false], ['Problem Statement', 36, true], ['Application', 30, true]];
  const diag = (top) => `<div class="v card diag" style="top:${top}px">
    ${AREAS.map(([l, v, weak]) => `<div class="brow ${weak ? 'weak' : ''}"><span>${l}</span>
      <div class="track"><div class="fill" style="width:${v}%"></div></div><b class="tag ${weak ? '' : 'ok'}">${weak ? 'Lemah' : 'OK'}</b></div>`).join('')}
    <div class="scan"><div class="lens">${icon('search', 2.6)}</div></div></div>`;
  const cta = (headline, top) => `<div class="glow"></div>
    <div class="lockup"><div class="mark" data-logo="mark"></div><div class="wordmark" data-logo="wordmark"></div></div>
    ${hl(headline, 'xl', `top:${top}px`)}
    <div class="pill" style="top:${top + 460}px">Klik link di bawah<i class="sheen"></i></div>
    <div class="down" style="top:${top + 610}px">${icon('down', 2.6)}</div>`;

  // shared animations
  const paperIn = (a, x) => {
    a.in('.paper', x, { y: 100 });
    a.pop('.paper .mk', x + 0.5, { stagger: 0.18 });
    [0, 1, 2, 3].forEach((k) => a.sfx(x + 0.5 + k * 0.18, 'tick', 0.6));
    a.pop('.paper .score', x + 1.3, { from: 1.8 });
    a.sfx(x + 1.3, 'boom', 0.45);
  };
  const diagIn = (a, x) => {
    a.in('.diag', x, { y: 100 });
    a.fromTo('.diag .fill', { scaleX: 0 }, { scaleX: 1, duration: 1.0, stagger: 0.12, ease: 'expo.out' }, x + 0.4);
    a.fromTo('.diag .scan', { y: 0, opacity: 0 }, { opacity: 1, duration: 0.3 }, x + 0.9);
    [1, 2, 3].forEach((k) => a.to('.diag .scan', { y: k * 92, duration: 0.45, ease: 'power2.inOut' }, x + 0.9 + k * 0.6));
    a.pop('.diag .tag', x + 1.0, { stagger: 0.6 });
    a.sfx(x + 1.0, 'tick', 0.5); a.sfx(x + 1.6, 'tick', 0.5); a.sfx(x + 2.2, 'fail', 0.35); a.sfx(x + 2.8, 'tick', 0.6);
    a.to('.diag .brow.weak', { backgroundColor: 'rgba(255,59,48,.07)', duration: 0.4 }, x + 3.3);
  };
  const ctaIn = (a) => {
    a.fromTo('.glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, 0.2);
    a.in('.lockup', 0.2, { y: 40, blur: 20, scale: 1.2 });
    a.lines(0.5);
    a.fromTo('.pill', { opacity: 0, scale: 0.8, xPercent: -50 }, { opacity: 1, scale: 1, xPercent: -50, duration: 0.7, ease: 'back.out(2)' }, 1.3);
    a.fromTo('.pill .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut' }, 2.0);
    a.fromTo('.pill .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut', immediateRender: false }, 3.6);
    a.in('.down', 1.6, { y: -20 });
    a.to('.down', { y: 16, duration: 0.45, ease: 'sine.inOut', repeat: Math.floor((a.dur - 2.6) / 0.45), yoyo: true }, 2.6);
    a.sfx(0.2, 'hit', 0.7); a.sfx(1.3, 'glint', 0.7);
  };

  // ================================================================ videos
  const VIDEOS = {
    // ~48 s · SEKOOL Class: diagnose, plan, Personal Teacher, proof, urgency, offer, scarcity, CTA
    'explainer-sekool-class': {
      music: { drop: 0, end: 46, arps: 30, breakdown: [26, 30], duck: [[27.3, 28.6]] },
      scenes: [
        { dur: 4.4, html: hl(['Kalau anak', '<em>Darjah 2 – 6</em>', 'lemah dalam', '<em class="bad">Matematik,</em>'], 'xl') + paper(800),
          anim: (a) => { a.lines(0.05, 0.14); a.sfx(0, 'hit', 0.8); paperIn(a, 1.0); } },
        { dur: 5.2, html: hl(['Kami akan', '<em>diagnose</em>', 'kelemahan pelajar']) + diag(700),
          anim: (a) => { a.lines(); diagIn(a, 0.6); } },
        { dur: 4.8, html: hl(['dan susun cara', 'pembelajaran', 'yang <em>sesuai</em>']) + `<div class="v steps" style="top:720px"><div class="rail"><i></i></div>
            ${['Berikan latihan', 'Semak jawapan bersama', 'Terangkan cara menjawab', 'Latihan baru, topik sama'].map((l, k) =>
              `<div class="step"><b>${k + 1}</b><span>${l}</span></div>`).join('')}</div>`,
          anim: (a) => {
            a.lines();
            a.in('.steps', 0.5, { y: 60 });
            a.fromTo('.rail i', { scaleY: 0 }, { scaleY: 1, duration: 2.2, ease: 'power1.inOut' }, 0.9);
            $$(`${a.id} .step`).forEach((_, k) => {
              a.to(`.step:nth-child(${k + 2}) b`, { backgroundColor: '#4f46e5', color: '#ffffff', scale: 1.08, duration: 0.35 }, 0.9 + k * 0.62);
              a.to(`.step:nth-child(${k + 2}) span`, { color: '#111114', duration: 0.35 }, 0.9 + k * 0.62);
              a.sfx(0.9 + k * 0.62, 'tick', 0.6);
            });
          } },
        { dur: 6.0, html: hl(['sebagai', '<em>Personal Teacher</em>', 'dari Sekolah Kebangsaan', 'untuk bantu mereka', 'skor <em>A</em>.'], 'm') +
            `<div class="v card teacher" style="top:840px"><div class="avatar">${icon('user', 2)}</div><div><h5>Personal Teacher</h5>
            <div class="badge">${icon('check', 3)}Cikgu Sekolah Kebangsaan</div></div></div><div class="v grade" style="top:830px">A</div>`,
          anim: (a) => {
            a.lines(0.1, 0.16);
            a.in('.teacher', 0.8, { y: 80 });
            a.pop('.badge', 1.4); a.sfx(1.4, 'glint', 0.5);
            a.fromTo('.grade', { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.6, ease: 'back.out(1.6)' }, 2.6);
            a.sfx(2.6, 'boom', 0.5); a.sfx(2.65, 'glint', 0.8);
          } },
        { dur: 5.6, html: hl(['Tahun lepas,', 'lebih dari <em>5 students</em>', 'kami naik pentas di', 'Majlis Anugerah', 'Sekolah.'], 'm') +
            `<div class="v pol p1" style="top:790px"><img src="../photos/6.jpg" style="object-position:75% 60%"></div>
            <div class="v pol p2" style="top:830px"><img src="../photos/4.jpg" style="object-position:50% 60%"></div>
            <div class="v trophy" style="top:730px">${icon('trophy', 2)}</div>`,
          anim: (a) => {
            a.lines(0.1, 0.14);
            a.fromTo('.p1', { y: 200, rotation: -16, opacity: 0 }, { y: 0, rotation: -6, opacity: 1, duration: 0.9 }, 0.9);
            a.fromTo('.p2', { y: 200, rotation: 16, opacity: 0 }, { y: 0, rotation: 5, opacity: 1, duration: 0.9 }, 1.15);
            a.pop('.trophy', 1.7); a.sfx(0.9, 'swish', 0.4); a.sfx(1.15, 'swish', 0.4); a.sfx(1.7, 'shimmer', 0.8);
          } },
        { dur: 4.0, bg: 'dark', html: hl(['Jadi, untuk elakkan', 'anak anda <em class="bad">gagal</em>', 'atau dimasukkan ke', '<em class="bad">kelas pemulihan,</em>'], 'm') + paper(780),
          anim: (a) => {
            a.lines(0.1, 0.12);
            a.in('.paper', 0.5, { y: 80 });
            a.fromTo('.stamp', { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power4.in' }, 1.1);
            a.fromTo('.paper', { x: 0 }, { x: 12, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', immediateRender: false }, 1.55);
            a.sfx(1.4, 'fail', 1.0);
          } },
        { dur: 6.4, bg: 'indigo', html: `<div class="glow"></div>
            <div class="lockup"><div class="mark" data-logo="mark"></div><div class="wordmark" data-logo="wordmark"></div></div>
            <p class="sc-pre">Kami akan bantu pelajar dengan</p><h2 class="sc-title">SEKOOL Class</h2>
            <p class="sc-sub">1 to 1 Online Class<br>bersama <b>Personal Teacher</b></p>
            <div class="sc-steps"><p>Bermula dengan</p><div class="sc-row">
              <div class="chip"><i>1</i>Ujian Roadmap</div><div class="arr">${icon('arrow', 2.6)}</div><div class="chip"><i>2</i>Trial Class</div></div></div>`,
          anim: (a) => {
            a.fromTo('.glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, 0);
            a.in('.lockup', 0.05, { y: 0, blur: 24, scale: 1.4 });
            a.in('.sc-pre', 0.6, { y: 30 });
            a.in('.sc-title', 0.8, { y: 50, scale: 0.9 });
            a.in('.sc-sub', 1.6, { y: 30 });
            a.to('.sc-sub b', { scale: 1.06, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 2.4);
            a.in('.sc-steps p', 2.9, { y: 20 });
            a.pop('.sc-row > *', 3.2, { stagger: 0.35 });
            a.sfx(0, 'hit', 1.0); a.sfx(0.8, 'shimmer', 0.6); a.sfx(3.2, 'tick', 0.7); a.sfx(3.55, 'swish', 0.4); a.sfx(3.9, 'glint', 0.6);
          } },
        { dur: 6.0, html: hl(['Kami hanya accept', '<em>6 new students</em>', 'per week.']) +
            `<div class="v seats" style="top:660px">${`<div class="seat">${icon('user', 2)}</div>`.repeat(6)}</div>
            <p class="sub seat-note" style="top:1120px">Kerana kami hanya ambil<br><b>Cikgu Sekolah Kebangsaan</b><br>sebagai Personal Teacher.</p>`,
          anim: (a) => {
            a.lines();
            a.pop('.seat', 0.6, { stagger: 0.07, from: 0.5 });
            $$(`${a.id} .seat`).forEach((_, k) => {
              a.to(`.seat:nth-child(${k + 1})`, { backgroundColor: '#4f46e5', color: '#ffffff', duration: 0.25 }, 1.3 + k * 0.28);
              a.sfx(1.3 + k * 0.28, 'tick', 0.55);
            });
            a.sfx(3.0, 'glint', 0.5);
            a.in('.seat-note', 3.1, { y: 30 });
          } },
        { dur: 5.6, bg: 'indigo', html: cta(['Join Free', '1 to 1', 'Trial Class.'], 520), anim: ctaIn },
      ],
    },

    // ~39 s · the 3 things to know, the Learning Roadmap, CTA
    'explainer-roadmap': {
      music: { drop: 0, end: 36, arps: 23.2, breakdown: [999, 999] },
      scenes: [
        { dur: 3.6, html: hl(['Anak anda', 'lemah dalam', '<em class="bad">Matematik?</em>'], 'xl') + paper(740),
          anim: (a) => { a.lines(0.05, 0.14); a.sfx(0, 'hit', 0.8); paperIn(a, 0.8); } },
        { dur: 3.8, html: hl(['Untuk skor <em>A</em>', 'dalam Matematik,', 'anda perlu tahu:']) + '<div class="v grade big" style="top:760px">A</div>',
          anim: (a) => {
            a.lines();
            a.fromTo('.grade', { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.6, ease: 'back.out(1.6)' }, 1.0);
            a.sfx(1.0, 'boom', 0.5); a.sfx(1.05, 'glint', 0.8);
          } },
        { dur: 5.6, html: hl(['<span class="num">1</span><em>Di mana</em>', 'kelemahan pelajar']) + diag(580),
          anim: (a) => { a.lines(); diagIn(a, 0.6); } },
        { dur: 5.2, html: hl(['<span class="num">2</span><em>Kenapa</em>', 'pelajar lemah']) +
            '<div class="v card page" style="top:580px"><img src="assets/roadmap/stage2-p5.jpg"></div>',
          anim: (a) => {
            a.lines();
            a.in('.page', 0.5, { y: 100 });
            a.fromTo('.page img', { y: 0 }, { y: -400, duration: 2.6, ease: 'power2.inOut' }, 1.6);
            a.sfx(1.6, 'swish', 0.4);
          } },
        { dur: 5.0, html: hl(['<span class="num">3</span>Cara pembelajaran', 'yang sesuai untuk', '<em>improve</em>']) +
            '<div class="v card page" style="top:680px"><img src="assets/roadmap/stage2-p8.jpg"></div>',
          anim: (a) => {
            a.lines();
            a.in('.page', 0.5, { y: 100 });
            a.fromTo('.page img', { y: 0 }, { y: -260, duration: 2.4, ease: 'power2.inOut' }, 1.5);
            a.sfx(1.5, 'swish', 0.4);
          } },
        { dur: 6.2, html: '<div class="eyebrow"><span>Good news?</span></div>' +
            hl(['Kami dah design', '<em>Learning Roadmap</em>'], '', 'top:420px') +
            '<p class="sub" style="top:640px">yang akan jelaskan 3 perkara ini<br>berdasarkan <b>tahap penguasaan pelajar</b>.</p>' +
            '<div class="v fan f1" style="top:830px"><img src="assets/roadmap/stage2-p1.jpg"></div><div class="v fan f2" style="top:860px"><img src="assets/roadmap/stage2-p3.jpg"></div>',
          anim: (a) => {
            a.pop('.eyebrow span', 0.05, { from: 0.5 }); a.sfx(0.05, 'glint', 0.8);
            a.lines(0.6);
            a.in('.sub', 1.4, { y: 30 });
            a.fromTo('.f1', { y: 260, rotation: -14, opacity: 0 }, { y: 0, rotation: -6, opacity: 1, duration: 1.0 }, 1.9);
            a.fromTo('.f2', { y: 260, rotation: 14, opacity: 0 }, { y: 0, rotation: 5, opacity: 1, duration: 1.0 }, 2.15);
            a.sfx(1.9, 'swish', 0.4); a.sfx(2.15, 'swish', 0.4); a.sfx(2.6, 'shimmer', 0.6);
          } },
        { dur: 4.6, html: hl(['Ada anak', '<em>Darjah 1 – 6</em>?'], 'xl') +
            '<p class="sub" style="top:570px">Klik link di bawah<br>dan <b>isi details anda</b>.</p>' +
            `<div class="v card form" style="top:760px">${['Nama', 'Email', 'Darjah anak'].map((l) =>
              `<div class="field"><label>${l}</label><div><i></i></div></div>`).join('')}<div class="submit">Hantar</div></div>`,
          anim: (a) => {
            a.lines(0.05, 0.14);
            a.in('.sub', 0.7, { y: 30 });
            a.in('.form', 0.9, { y: 100 });
            a.fromTo('.field i', { scaleX: 0 }, { scaleX: 1, duration: 0.45, stagger: 0.5, ease: 'power2.out' }, 1.5);
            [0, 1, 2].forEach((k) => a.sfx(1.5 + k * 0.5, 'click', 0.35));
            a.to('.submit', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 3.2);
            a.sfx(3.2, 'click', 0.8);
          } },
        { dur: 5.0, bg: 'indigo', html: `<div class="glow"></div><div class="v env">${icon('mail', 1.6)}</div>` +
            hl(['Kami akan hantar', '<em>Ujian Roadmap</em>', 'di email untuk', 'pelajar jawab.'], '', 'top:620px') +
            `<div class="pill" style="top:1040px">Klik link di bawah<i class="sheen"></i></div><div class="down" style="top:1190px">${icon('down', 2.6)}</div>`,
          anim: (a) => {
            a.fromTo('.glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, 0.1);
            a.fromTo('.env', { y: -300, rotation: -20, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.6)' }, 0.1);
            a.sfx(0.3, 'notif', 0.9);
            a.lines(0.5);
            a.fromTo('.pill', { opacity: 0, scale: 0.8, xPercent: -50 }, { opacity: 1, scale: 1, xPercent: -50, duration: 0.7, ease: 'back.out(2)' }, 1.4);
            a.fromTo('.pill .sheen', { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut' }, 2.1);
            a.in('.down', 1.7, { y: -20 });
            a.to('.down', { y: 16, duration: 0.45, ease: 'sine.inOut', repeat: Math.floor((a.dur - 2.7) / 0.45), yoyo: true }, 2.7);
            a.sfx(1.4, 'glint', 0.7);
          } },
      ],
    },
  };
  window.ADS = VIDEOS; // the renderer lists videos from here

  const NAME = params.get('ad') || Object.keys(VIDEOS)[0];
  const V = VIDEOS[NAME];
  const DURATION = +V.scenes.reduce((s, x) => s + x.dur, 0).toFixed(3);

  // ---------------------------------------------------------------- markup
  const stage = $('#stage');
  V.scenes.forEach((s, i) => {
    const el = document.createElement('section');
    el.className = `scene ${s.bg || ''}`;
    el.id = `s${i}`;
    el.innerHTML = `<div class="cam">${s.html}</div>`;
    stage.appendChild(el);
  });
  $$('.hl').forEach((h) => {
    h.innerHTML = h.innerHTML.split(/<br\s*\/?>/).map((l) => `<span class="ln"><span class="lni">${l}</span></span>`).join('');
  });
  function loadLogos() {
    return Promise.all(['mark', 'wordmark'].map((k) => fetch(`assets/logo-${k}.svg`)
      .then((r) => (r.ok ? r.text() : null))
      .then((svg) => { if (svg) $$(`[data-logo="${k}"]`).forEach((el) => { el.innerHTML = svg; }); })
      .catch(() => {})));
  }

  // ---------------------------------------------------------------- timeline
  const cues = [];
  const sfx = (t, name, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), name, gain });
  let tl;

  function build() {
    gsap.config({ force3D: true });
    tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    const B = (px) => `blur(${px}px)`;
    let t0 = 0;
    V.scenes.forEach((s, i) => {
      const id = `#s${i}`, T = t0, end = t0 + s.dur, last = i === V.scenes.length - 1;
      const q = (sel) => sel.split(',').map((x) => `${id} ${x.trim()}`).join(', ');
      tl.set(id, { autoAlpha: 1 }, T);
      if (i > 0) { tl.fromTo(id, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, T); sfx(T - 0.08, 'whoosh', 0.5); }
      if (!last) {
        tl.to(`${id} .cam`, { y: -80, opacity: 0, filter: B(12), duration: 0.4, ease: 'power3.in' }, end - 0.4);
        tl.set(id, { autoAlpha: 0 }, end + 0.35);
      }
      const a = {
        id, dur: s.dur,
        lines: (x = 0.1, stagger = 0.1) => tl.fromTo($$(`${id} .hl .lni`), { yPercent: 110 }, { yPercent: 0, duration: 1.0, stagger }, T + x),
        in: (sel, x, o = {}) => tl.fromTo(q(sel), { y: o.y ?? 60, opacity: 0, filter: B(o.blur ?? 12), scale: o.scale ?? 1 },
          { y: 0, opacity: 1, filter: B(0), scale: 1, duration: o.d ?? 0.9 }, T + x),
        pop: (sel, x, o = {}) => tl.fromTo(q(sel), { scale: o.from ?? 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2)', stagger: o.stagger ?? 0 }, T + x),
        to: (sel, vars, x) => tl.to(q(sel), vars, T + x),
        fromTo: (sel, from, to, x) => tl.fromTo(q(sel), from, to, T + x),
        set: (sel, vars) => tl.set(q(sel), vars, T),
        sfx: (x, name, gain) => sfx(T + x, name, gain),
      };
      s.anim(a);
      t0 = end;
    });
    tl.set({}, {}, DURATION);
  }

  // ---------------------------------------------------------------- boot
  const ready = (async () => {
    await Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Poppins`)));
    await document.fonts.ready;
    await Promise.all($$('img').map((i) => i.decode().catch(() => {})));
    await loadLogos();
    build();
    tl.seek(0, false);
  })();

  window.SEKOOL = {
    name: NAME, duration: DURATION, fps: FPS, cues,
    music: { bpm: 120, drop: 0, breakdown: [999, 999], ...V.music },
    ready,
    seek: (t) => { tl.seek(t, false); },
  };

  // ---------------------------------------------------------------- preview player
  if (!RENDER) {
    const fit = () => {
      const s = (innerHeight - 48) / 1920;
      stage.style.transform = `translate(${(innerWidth - 1080 * s) / 2}px, 0) scale(${s})`;
    };
    addEventListener('resize', fit); fit();
    const sel = $('#ad');
    sel.innerHTML = Object.keys(VIDEOS).map((n) => `<option${n === NAME ? ' selected' : ''}>${n}</option>`).join('');
    sel.onchange = () => { location.search = `?ad=${sel.value}`; };
    const playBtn = $('#play'), scrub = $('#scrub'), clk = $('#clock');
    scrub.max = DURATION;
    const audio = new Audio(`../build/${NAME}.wav`);
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
    ready.then(() => setT(+(params.get('t') || 0)));
  }
})();
