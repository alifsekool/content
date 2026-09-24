/* SEKOOL explainer — deterministic GSAP timeline.
 * Every frame is a pure function of time: the renderer calls SEKOOL.seek(t)
 * and screenshots the stage. Sound effects are declared next to the visuals
 * they belong to (sfx(t, name)) and exported for the audio mixer. */
(() => {
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  const DURATION = 78;
  const FPS = 30;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- icons
  const ICONS = {
    video: '<rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="M16 10.5l6-3.5v10l-6-3.5z"/>',
    map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.5h6V4"/><path d="M9 12.5l2 2 4-4.5"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M21 17V4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    pencil: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M13.5 7l3.5 3.5"/>',
    trophy: '<path d="M8 21h8M12 16.5V21"/><path d="M7 3.5h10v5.5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3.5 3.5 0 0 1-3.5 3.5M7 5H4v2a3.5 3.5 0 0 0 3.5 3.5"/>',
  };
  const icon = (n, sw = 2.2) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
  $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  // ---------------------------------------------------------------- characters
  const SKIN = '#eab98f';
  function childSVG(id, moodName = 'neutral', viewBox = '0 0 400 430') {
    const happy = moodName === 'happy';
    return `<svg id="${id}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">
      <g class="c-body">
        <path d="M104 430 L104 312 Q104 252 162 242 L238 242 Q296 252 296 312 L296 430 Z" fill="#fff" stroke="#dcdce3" stroke-width="4"/>
        <rect x="184" y="204" width="32" height="46" rx="10" fill="#dca37a"/>
        <path d="M166 242 L200 282 L186 242 Z" fill="#f5f5f7" stroke="#dcdce3" stroke-width="3" stroke-linejoin="round"/>
        <path d="M234 242 L200 282 L214 242 Z" fill="#f5f5f7" stroke="#dcdce3" stroke-width="3" stroke-linejoin="round"/>
        <path d="M192 264 L208 264 L214 322 L200 338 L186 322 Z" fill="#4f46e5"/>
      </g>
      <g class="c-head">
        <circle cx="131" cy="166" r="16" fill="#e3ad84"/>
        <circle cx="269" cy="166" r="16" fill="#e3ad84"/>
        <circle cx="200" cy="158" r="70" fill="${SKIN}"/>
        <path d="M128 158 Q122 80 200 78 Q278 80 272 158 Q264 122 236 114 Q214 132 172 120 Q142 126 128 158 Z" fill="#2d2424"/>
        <rect class="brow-l" x="160" y="${happy ? 128 : 134}" width="30" height="7" rx="3.5" fill="#2d2424"/>
        <rect class="brow-r" x="210" y="${happy ? 128 : 134}" width="30" height="7" rx="3.5" fill="#2d2424"/>
        <ellipse cx="176" cy="164" rx="7.5" ry="9.5" fill="#222"/>
        <ellipse cx="224" cy="164" rx="7.5" ry="9.5" fill="#222"/>
        <circle cx="179" cy="160" r="2.5" fill="#fff"/><circle cx="227" cy="160" r="2.5" fill="#fff"/>
        <circle class="cheek" cx="156" cy="190" r="12" fill="#f28b8b" opacity="${happy ? 0.6 : 0}"/>
        <circle class="cheek" cx="244" cy="190" r="12" fill="#f28b8b" opacity="${happy ? 0.6 : 0}"/>
        <path class="m-flat" d="M186 200 L214 200" stroke="#6b2b2b" stroke-width="6" stroke-linecap="round" opacity="${moodName === 'neutral' ? 1 : 0}"/>
        <path class="m-sad" d="M182 206 Q200 190 218 206" stroke="#6b2b2b" stroke-width="6" fill="none" stroke-linecap="round" opacity="0"/>
        <path class="m-happy" d="M178 190 Q200 224 222 190 Z" fill="#7a2e2e" stroke="#7a2e2e" stroke-width="4" stroke-linejoin="round" opacity="${happy ? 1 : 0}"/>
        <path class="sweat" d="M270 104 Q282 124 270 134 Q258 124 270 104 Z" fill="#7cc4f5" opacity="0"/>
      </g>
      <g class="c-desk">
        <rect x="24" y="362" width="352" height="68" rx="14" fill="#3c34c9"/>
        <rect x="24" y="362" width="352" height="18" rx="9" fill="#4f46e5"/>
        <ellipse cx="148" cy="364" rx="26" ry="17" fill="${SKIN}"/>
        <g transform="rotate(-32 262 340)"><rect x="255" y="290" width="13" height="62" rx="2" fill="#facc15"/><rect x="255" y="290" width="13" height="10" rx="2" fill="#f28b8b"/><path d="M255 352 L268 352 L261.5 368 Z" fill="#f5d6a8"/></g>
        <ellipse cx="252" cy="364" rx="26" ry="17" fill="${SKIN}"/>
      </g>
    </svg>`;
  }

  function cikguSVG(viewBox = '0 0 400 400') {
    return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMax meet">
      <path d="M36 400 Q50 286 200 276 Q350 286 364 400 Z" fill="#f5c451"/>
      <path d="M200 48 Q314 50 318 178 Q322 270 262 302 L138 302 Q78 270 82 178 Q86 50 200 48 Z" fill="#4f46e5"/>
      <ellipse cx="200" cy="180" rx="64" ry="76" fill="#d9a078"/>
      <path d="M132 166 Q134 94 200 92 Q266 94 268 166 Q246 124 200 122 Q154 124 132 166 Z" fill="#4f46e5"/>
      <path d="M134 238 Q200 318 266 238 L280 314 Q200 352 120 314 Z" fill="#3c34c9"/>
      <path d="M158 154 Q174 146 190 153" stroke="#3a2a22" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M210 153 Q226 146 242 154" stroke="#3a2a22" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="176" cy="182" rx="6" ry="7.5" fill="#222"/><ellipse cx="224" cy="182" rx="6" ry="7.5" fill="#222"/>
      <circle cx="176" cy="182" r="20" fill="rgba(255,255,255,.18)" stroke="#222" stroke-width="4"/>
      <circle cx="224" cy="182" r="20" fill="rgba(255,255,255,.18)" stroke="#222" stroke-width="4"/>
      <path d="M196 180 Q200 175 204 180" stroke="#222" stroke-width="4" fill="none"/>
      <circle cx="154" cy="210" r="11" fill="#f28b8b" opacity=".45"/><circle cx="246" cy="210" r="11" fill="#f28b8b" opacity=".45"/>
      <path d="M178 218 Q200 240 222 218" stroke="#7a2e2e" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  const MARKS = {
    x: '<path d="M8 8 L24 24" pathLength="1"/><path d="M24 8 L8 24" pathLength="1"/>',
    v: '<path d="M5 17 L13 25 L28 7" pathLength="1"/>',
    o: '<path d="M16 3 A13 13 0 1 1 15.9 3" pathLength="1"/>',
  };
  function paperHTML(id, title, sub, grade, gradeCls, marks) {
    const widths = [72, 58, 80, 64, 70];
    const rows = marks.map((m, i) => `<div class="p-row"><span class="p-q">${i + 1}.</span>
        <span class="p-line" style="width:${widths[i]}%"></span>
        ${m ? `<svg class="p-mark ${m}" viewBox="0 0 32 32">${MARKS[m]}</svg>` : '<span class="p-mark"></span>'}</div>`).join('');
    return `<div class="paper" id="${id}"><div class="p-head"><div><div class="p-title">${title}</div>
      <div class="p-sub">${sub}</div></div><div class="grade ${gradeCls}">${grade}</div></div>${rows}</div>`;
  }

  $('#child1-wrap').innerHTML = childSVG('child1', 'neutral');
  $('#child2-wrap').innerHTML = childSVG('child2', 'happy');
  $('#paper1-wrap').innerHTML = paperHTML('paper1', 'UASA Practice', 'Matematik · Year 4', 'TP2', '', ['x', null, 'x', 'x', null]);
  $('#paper2-wrap').innerHTML = paperHTML('paper2', 'UASA Practice', 'Matematik · Year 4', 'TP5', 'green', ['v', 'v', 'v', 'v', 'v']);
  $('#paper3-wrap').innerHTML = paperHTML('paper3', 'Monthly Test', 'March · Matematik', 'TP4', 'green', ['v', 'v', 'o', 'v', 'v']);
  $('.cikgu-wrap').innerHTML = cikguSVG();
  $('.bubble-av').innerHTML = cikguSVG('110 80 180 180');
  $('.pip-child').innerHTML = childSVG('pipchild', 'happy', '95 72 210 160');

  // ---------------------------------------------------------------- S2 crowd
  const COLS = 12, ROWS = 5, DX = 104, DY = 112, FW = 64, FH = 74;
  const GX = (1920 - ((COLS - 1) * DX + FW)) / 2, GY = 372;
  const HERO = 2 * COLS + 7;
  const crowd = $('.crowd');
  const figSVG = '<svg viewBox="0 0 64 74"><circle cx="32" cy="20" r="15" fill="currentColor"/><path d="M6 74 Q6 40 32 40 Q58 40 58 74 Z" fill="currentColor"/></svg>';
  for (let i = 0; i < COLS * ROWS; i++) {
    const c = i % COLS, r = Math.floor(i / COLS);
    crowd.insertAdjacentHTML('beforeend', `<div class="fig" style="left:${GX + c * DX}px;top:${GY + r * DY}px">${figSVG}</div>`);
  }
  const figs = $$('.fig');
  const heroFig = figs[HERO];
  const HX = GX + (HERO % COLS) * DX + FW / 2, HY = GY + Math.floor(HERO / COLS) * DY + FH / 2;
  gsap.set('.hero-ring', { left: HX - 66, top: HY - 66 });

  // ---------------------------------------------------------------- S4 whiteboard
  const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  $('.eq.e1').innerHTML = `${fr(3, 4)} + ${fr(1, 8)} = ?`;
  $('.eq.e2').innerHTML = `= ${fr(6, 8)} + ${fr(1, 8)}`;
  $('.eq.e3').innerHTML = `= ${fr(7, 8)} <span class="ok">${icon('check', 3)}</span>`;

  // ---------------------------------------------------------------- S6 calendar
  const MONTHS = [
    { name: 'JANUARY', start: 4, days: 31, test: 29 },
    { name: 'FEBRUARY', start: 0, days: 28, test: 26 },
    { name: 'MARCH', start: 0, days: 31, test: 26 },
  ];
  const pages = $('.cal-pages');
  [...MONTHS].reverse().forEach((m) => {
    let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < m.start; i++) cells += '<div class="d"></div>';
    for (let d = 1; d <= m.days; d++) {
      cells += d === m.test
        ? `<div class="d test"><span class="dot"></span><span class="dn">${d}</span></div>`
        : `<div class="d">${d}</div>`;
    }
    pages.insertAdjacentHTML('beforeend', `<div class="cal-page" data-m="${m.name}"><div class="cal-head">${m.name}</div><div class="cal-grid">${cells}</div></div>`);
  });
  const [pageMar, pageFeb, pageJan] = $$('.cal-page');
  const marTest = pageMar.querySelector('.d.test');
  marTest.insertAdjacentHTML('beforeend', '<span class="test-lbl">Test day</span>');

  // ---------------------------------------------------------------- S8 sparkles / S9 confetti
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill="currentColor"/></svg>';
  const SPARKS = [[170, 300, 1], [560, 270, .7], [640, 520, 1.1], [130, 620, .8], [980, 210, .9], [1010, 700, .7]];
  SPARKS.forEach(([x, y, s]) => $('.sparkles').insertAdjacentHTML('beforeend',
    `<div class="spk" style="left:${x}px;top:${y}px;transform:scale(${s})">${STAR}</div>`));
  const CONF_COLORS = ['#facc15', '#ffffff', '#f472b6', '#34d399', '#a5b4fc'];
  for (let i = 0; i < 30; i++) {
    $('.confetti').insertAdjacentHTML('beforeend',
      `<div class="cf" style="background:${CONF_COLORS[i % 5]};${i % 3 === 0 ? 'border-radius:50%' : ''}"></div>`);
  }

  // ---------------------------------------------------------------- text splitting
  function splitWords(root) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = p;
            frag.appendChild(s); out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches('.hl-bg, svg, .dot')) {
          walk(n);
        }
      });
    };
    walk(root);
    return out;
  }
  const W = new Map();
  const words = (sel) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!W.has(el)) W.set(el, splitWords(el));
    return W.get(el);
  };

  // ---------------------------------------------------------------- logos
  // src/assets/logo-mark.svg and logo-wordmark.svg are vector traces of the official
  // SEKOOL logos (from the Learning Roadmap PDFs). They are inlined so CSS `color`
  // can switch them between indigo and white. The text inside [data-logo] is only
  // a fallback if the files are missing.
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
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 0.6 } });
    const show = (sel, a, b) => { tl.set(sel, { autoAlpha: 1 }, a); if (b != null) tl.set(sel, { autoAlpha: 0 }, b); };
    const fadeUp = (el, t, d = 0.6, y = 34) => tl.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, duration: d }, t);
    const wordsIn = (el, t, stagger = 0.07, y = 60) =>
      tl.fromTo(words(el), { y, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger }, t);
    const popIn = (el, t, from = 0.4, d = 0.5) =>
      tl.fromTo(el, { scale: from, opacity: 0 }, { scale: 1, opacity: 1, duration: d, ease: 'back.out(2)' }, t);
    const outLeft = (els, t) => tl.to(els, { x: -70, opacity: 0, duration: 0.45, ease: 'power2.in' }, t);
    const draw = (el, t, d = 0.3) => tl.fromTo(el, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: 'power2.inOut' }, t);

    // background drift
    tl.to('.b1', { x: 260, y: 140, duration: DURATION, ease: 'sine.inOut' }, 0);
    tl.to('.b2', { x: -220, y: -160, duration: DURATION, ease: 'sine.inOut' }, 0);
    tl.to('.b3', { x: -500, y: -260, duration: DURATION, ease: 'sine.inOut' }, 0);

    // ------------------------------------------------ S1 · Hook (0 – 7)
    show('#s1', 0, 7.0);
    gsap.set('#s1 .s1-art', { x: -430 });
    tl.fromTo('#child1-wrap', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.15);
    sfx(0.15, 'whoosh', 0.7);
    tl.fromTo('#paper1', { x: 320, rotation: 28, opacity: 0 }, { x: 0, rotation: 7, opacity: 1, duration: 0.75, ease: 'back.out(1.3)' }, 0.85);
    sfx(0.85, 'swipe');
    $$('#paper1 .p-mark.x').forEach((m, i) => {
      const t = 1.55 + i * 0.4;
      const [a, b] = $$('path', m);
      draw(a, t, 0.14); draw(b, t + 0.12, 0.14);
      sfx(t, 'wrong');
    });
    tl.fromTo('#paper1 .grade', { scale: 2.4, opacity: 0, rotation: 12 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.35, ease: 'back.out(2)' }, 2.85);
    sfx(2.85, 'thud');
    // child turns worried
    tl.to('#child1 .brow-l', { rotation: -16, svgOrigin: '175 137', y: -3, duration: 0.3 }, 3.05);
    tl.to('#child1 .brow-r', { rotation: 16, svgOrigin: '225 137', y: -3, duration: 0.3 }, 3.05);
    tl.to('#child1 .m-flat', { opacity: 0, duration: 0.12 }, 3.05);
    tl.to('#child1 .m-sad', { opacity: 1, duration: 0.12 }, 3.05);
    tl.fromTo('#child1 .sweat', { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.25 }, 3.2);
    tl.to('#child1 .sweat', { y: 34, opacity: 0, duration: 0.9, ease: 'power2.in' }, 3.9);
    // art slides right; headline arrives
    tl.to('#s1 .s1-art', { x: 0, duration: 0.9, ease: 'power3.inOut' }, 3.1);
    wordsIn('#s1 .l1', 3.35); sfx(3.35, 'whoosh');
    wordsIn('#s1 .l2', 3.7);
    tl.fromTo('#s1 .hl-bg', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 4.15);
    sfx(4.15, 'swipe');
    tl.fromTo([...words('#s1 .hl-t'), ...words('#s1 .q')], { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 }, 4.3);
    fadeUp('#s1 .hook-sub', 5.0);
    tl.to('#s1 .s1-text', { x: -90, opacity: 0, duration: 0.45, ease: 'power2.in' }, 6.5);
    tl.to('#s1 .s1-art', { x: 140, opacity: 0, duration: 0.45, ease: 'power2.in' }, 6.5);
    sfx(6.5, 'whoosh', 0.8);

    // ------------------------------------------------ S2 · Problem (7 – 13.9)
    show('#s2', 6.95, 13.95);
    wordsIn('#s2 .s2-title', 7.0, 0.09); sfx(7.0, 'whoosh', 0.8);
    gsap.set('.hero-ring', { scale: 0, opacity: 0 });
    const dist = (i) => Math.hypot((i % COLS) - (COLS - 1) / 2, Math.floor(i / COLS) - (ROWS - 1) / 2);
    const maxD = Math.max(...figs.map((_, i) => dist(i)));
    tl.fromTo(figs, { scale: 0, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)',
      stagger: (i) => (dist(i) / maxD) * 1.1,
    }, 7.35);
    for (let k = 0; k < 9; k++) sfx(7.4 + k * 0.13, 'tick', 0.45 + (k % 3) * 0.1);
    fadeUp('#s2 .sa', 8.7); sfx(8.7, 'pop', 0.6);
    const others = figs.filter((_, i) => i !== HERO);
    tl.to(others, { color: '#d3d4dd', duration: 0.5, stagger: (i) => ((i * 37) % 59) * 0.008 }, 9.35);
    tl.to(heroFig, { color: '#4f46e5', duration: 0.3 }, 9.55);
    tl.to('.hero-ring', { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 9.6);
    sfx(9.6, 'ping');
    // the crowd closes in, the child disappears in it
    tl.to('#s2 .sa', { y: -20, opacity: 0, duration: 0.35, ease: 'power2.in' }, 10.55);
    fadeUp('#s2 .sb', 10.8);
    tl.to('.hero-ring', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'power2.in' }, 10.9);
    tl.to(heroFig, { color: '#d3d4dd', duration: 0.5 }, 11.0);
    others.forEach((f) => {
      const i = figs.indexOf(f);
      const fx = GX + (i % COLS) * DX + FW / 2, fy = GY + Math.floor(i / COLS) * DY + FH / 2;
      tl.to(f, { x: (HX - fx) * 0.12 + ((i * 13) % 7 - 3) * 3, y: (HY - fy) * 0.12, duration: 1.2, ease: 'sine.inOut' }, 10.9);
    });
    sfx(10.9, 'swipe', 0.5);
    // ...and we find them again
    tl.to(others, { opacity: 0.25, duration: 0.4 }, 12.2);
    tl.to(heroFig, { color: '#4f46e5', scale: 1.5, duration: 0.45, ease: 'back.out(2)' }, 12.2);
    tl.to('.hero-ring', { scale: 1.5, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 12.2);
    sfx(12.2, 'ping');
    tl.to(['#s2 .s2-title', '#s2 .sb'], { y: -30, opacity: 0, duration: 0.4, ease: 'power2.in' }, 12.5);

    // ------------------------------------------------ S3 · Reveal (13.1 – 20.4)
    show('#s3', 13.1, 20.45);
    tl.fromTo('#s3', { clipPath: `circle(0px at ${HX}px ${HY}px)` },
      { clipPath: `circle(2300px at ${HX}px ${HY}px)`, duration: 0.9, ease: 'power2.in' }, 13.1);
    sfx(13.05, 'whooshBig');
    const mark = $('#s3 .mark'), wm = $('#s3 .wordmark');
    const markCenter = mark.offsetLeft + mark.offsetWidth / 2;
    gsap.set(mark, { x: 960 - markCenter });
    tl.fromTo(mark, { scale: 0, rotation: 40, opacity: 0 }, { scale: 1.25, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)' }, 14.0);
    sfx(14.0, 'pop', 1.2);
    tl.to(mark, { x: 0, scale: 1, duration: 0.75, ease: 'power3.inOut' }, 14.8);
    const letters = $$('.lt', wm).length ? $$('.lt', wm) : $$('span', wm);
    tl.fromTo(letters, { y: letters[0].tagName === 'path' ? 18 : 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'back.out(1.6)' }, 15.0);
    sfx(15.0, 'shimmer');
    wordsIn('#s3 .s3-tag', 16.0, 0.05, 30);
    $$('#s3 .pill').forEach((p, i) => { popIn(p, 16.9 + i * 0.3); sfx(16.9 + i * 0.3, 'pop', 0.7); });
    tl.to('#s3', { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 19.85);
    sfx(19.8, 'whoosh');

    // ------------------------------------------------ feature scenes
    function featureIn(id, t0) {
      const s = `#${id}`;
      tl.fromTo(`${s} .f-num`, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, t0);
      tl.fromTo(`${s} .f-eyebrow`, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, t0 + 0.1);
      wordsIn(`${s} .f-title`, t0 + 0.2, 0.06, 50);
      fadeUp(`${s} .f-body`, t0 + 0.7, 0.6, 24);
      sfx(t0, 'whoosh', 0.8);
    }
    const featureOut = (id, t) => outLeft([`#${id} .f-text`, `#${id} .f-visual`], t);

    // progress strip
    const SEGS = [[20, 32], [32, 44], [44, 54], [54, 64]];
    tl.fromTo('#prog', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 20.3);
    tl.to('#prog', { autoAlpha: 0, y: 20, duration: 0.4, ease: 'power2.in' }, 63.5);
    $$('#prog .seg').forEach((seg, i) => {
      const [a, b] = SEGS[i];
      tl.fromTo($('i', seg), { scaleX: 0 }, { scaleX: 1, duration: b - a, ease: 'none' }, a);
      tl.to($('span', seg), { color: '#4f46e5', duration: 0.3 }, a);
      tl.to($('span', seg), { color: '#4b4c4f', duration: 0.3 }, b);
    });

    // ------------------------------------------------ S4 · 1-to-1 class (20 – 32)
    show('#s4', 19.95, 32.0);
    featureIn('s4', 20.1);
    tl.fromTo('#s4 .laptop', { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 20.4);
    sfx(20.4, 'swipe');
    tl.fromTo('#s4 .cikgu-wrap', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 21.0);
    popIn('#s4 .pip', 21.35, 0.5); sfx(21.35, 'pop', 0.7);
    tl.to('#s4 .live i', { opacity: 0.15, duration: 0.45, repeat: 21, yoyo: true, ease: 'sine.inOut' }, 21.2);
    const clock = { s: 12 * 60 + 40 };
    const tbTimer = $('#s4 .tb-timer');
    tl.to(clock, {
      s: 12 * 60 + 51, duration: 11, ease: 'none',
      onUpdate: () => { const s = Math.floor(clock.s); tbTimer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
    }, 20.5);
    fadeUp('#s4 .board-h', 21.6, 0.4, 14);
    [['.e1', 22.0, 0.8], ['.e2', 23.0, 0.7], ['.e3', 23.9, 0.4]].forEach(([c, t, d]) => {
      tl.fromTo(`#s4 .eq${c}`, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: d, ease: 'none' }, t);
      sfx(t, 'scribble', d);
    });
    tl.fromTo('#s4 .eq.e3 .ok', { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 24.35);
    sfx(24.35, 'ding');
    tl.fromTo('#s4 .bubble', { scale: 0.5, opacity: 0, transformOrigin: '0% 100%' }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' }, 25.0);
    sfx(25.0, 'bubble');
    tl.fromTo('#s4 .teacher-badge', { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }, 26.0);
    sfx(26.0, 'ding', 0.8);
    $$('#s4 .chip').forEach((c, i) => { popIn(c, 27.0 + i * 0.22); sfx(27.0 + i * 0.22, 'pop', 0.6); });
    featureOut('s4', 31.45);

    // ------------------------------------------------ S5 · Roadmap (32 – 44)
    show('#s5', 31.95, 44.0);
    featureIn('s5', 32.1);
    tl.fromTo('#s5 .rm-card', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 32.35);
    sfx(32.35, 'swipe');
    // stage ladder grows
    $$('#s5 .rm-bar').forEach((bar, i) => {
      tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'back.out(1.4)' }, 33.0 + i * 0.22);
      sfx(33.0 + i * 0.22, 'tick', 0.6);
    });
    tl.fromTo($$('#s5 .rm-col span'), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.22 }, 33.2);
    // the pin "assesses" stage 1 -> 3, then settles on stage 2
    const COLW = 132;
    const here = $('#s5 .rm-here');
    gsap.set(here, { x: -COLW, y: 90 });
    tl.fromTo(here, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 33.8);
    tl.to(here, { x: -COLW, y: 90, duration: 0.01 }, 33.8);
    tl.to(here, { x: COLW, y: -90, duration: 0.55, ease: 'power2.inOut' }, 34.2);
    tl.to(here, { x: 0, y: 0, duration: 0.5, ease: 'back.out(2)' }, 34.95);
    sfx(34.2, 'swipe', 0.4); sfx(34.95, 'ping');
    tl.to('#s5 .c2 .rm-bar', { backgroundColor: '#4f46e5', duration: 0.3 }, 35.1);
    tl.to('#s5 .c2 .rm-bar b', { color: '#ffffff', opacity: 1, duration: 0.3 }, 35.1);
    tl.to('#s5 .c2 span', { color: '#4f46e5', duration: 0.3 }, 35.1);
    // skill ratings
    fadeUp('#s5 .rm-sh', 35.4, 0.4, 12);
    tl.fromTo($$('#s5 .rm-row'), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.14 }, 35.5);
    let st = 36.1;
    $$('#s5 .stars').forEach((row) => {
      $$('.star', row).slice(0, +row.dataset.n).forEach((star) => {
        tl.fromTo(star, { scale: 0.6, fill: '#e3e3e7' }, { scale: 1, fill: '#facc15', duration: 0.3, ease: 'back.out(3)', transformOrigin: '50% 50%' }, st);
        sfx(st, 'pop', 0.45);
        st += 0.11;
      });
    });
    tl.fromTo('#s5 .rm-pill.weak', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, 37.4);
    sfx(37.4, 'pop', 0.8);
    tl.fromTo('#s5 .rm-pill.plan', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, 38.0);
    sfx(38.0, 'ding', 0.8);
    tl.fromTo('#s5 .free-stamp', { scale: 2.6, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: 8, duration: 0.35, ease: 'back.out(2)' }, 38.9);
    sfx(38.9, 'thud');
    featureOut('s5', 43.45);

    // ------------------------------------------------ S6 · Monthly test (44 – 54)
    show('#s6', 43.95, 54.0);
    featureIn('s6', 44.1);
    tl.fromTo('#s6 .cal', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 44.4);
    sfx(44.4, 'swipe');
    gsap.set(marTest.querySelector('.dot'), { scale: 0 });
    gsap.set(marTest.querySelector('.test-lbl'), { opacity: 0 });
    [[pageJan, 45.2], [pageFeb, 45.95]].forEach(([pg, t]) => {
      tl.to(pg, { rotationX: 100, duration: 0.5, ease: 'power2.in' }, t);
      tl.to(pg, { opacity: 0, duration: 0.12, ease: 'none' }, t + 0.38);
      sfx(t, 'flip');
    });
    tl.to(marTest.querySelector('.dot'), { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 46.55);
    tl.to(marTest.querySelector('.dn'), { color: '#fff', duration: 0.2 }, 46.6);
    tl.fromTo(marTest.querySelector('.test-lbl'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 }, 46.75);
    sfx(46.55, 'pop');
    tl.fromTo('#paper3', { x: 200, rotation: 18, opacity: 0 }, { x: 0, rotation: 3, opacity: 1, duration: 0.7, ease: 'back.out(1.3)' }, 47.0);
    sfx(47.0, 'swipe');
    $$('#paper3 .p-mark').forEach((m, i) => {
      const t = 47.6 + i * 0.36;
      draw($('path', m), t, m.classList.contains('o') ? 0.4 : 0.25);
      sfx(t, m.classList.contains('o') ? 'pop' : 'tick', m.classList.contains('o') ? 0.6 : 0.9);
    });
    tl.fromTo('#paper3 .grade', { scale: 2.4, opacity: 0, rotation: 12 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.35, ease: 'back.out(2)' }, 49.6);
    sfx(49.6, 'thud');
    $$('#s6 .tag').forEach((g, i) => { tl.fromTo(g, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 50.3 + i * 0.5); sfx(50.3 + i * 0.5, 'pop', 0.7); });
    featureOut('s6', 53.45);

    // ------------------------------------------------ S7 · Progress report (54 – 64)
    show('#s7', 53.95, 64.0);
    featureIn('s7', 54.1);
    tl.fromTo('#s7 .phone', { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 54.4);
    sfx(54.4, 'swipe');
    tl.fromTo('#s7 .notif', { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.5)' }, 55.0);
    sfx(55.0, 'notif');
    tl.fromTo('#s7 .tap', { scale: 0.2, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 0.5, ease: 'power2.out' }, 55.95);
    sfx(55.95, 'click');
    tl.fromTo('#s7 .ph-report', { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power3.inOut' }, 56.15);
    gsap.set('#s7 .bar i', { scaleX: 0 });
    tl.to('#s7 .bar i', { scaleX: 1, duration: 0.9, stagger: 0.18, ease: 'power3.out' }, 56.8);
    sfx(56.8, 'rise');
    const tp = { n: 2 };
    const tpEl = $('#s7 .tp-n');
    tl.to(tp, { n: 5, duration: 1.0, ease: 'none', onUpdate: () => { tpEl.textContent = Math.min(5, Math.floor(tp.n + 0.001)); } }, 57.9);
    [58.23, 58.57, 58.9].forEach((t) => sfx(t, 'tick', 0.8));
    tl.fromTo('#s7 .rp-tp', { scale: 1 }, { scale: 1.15, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 58.9);
    sfx(58.95, 'ding');
    tl.fromTo('#s7 .spark polyline', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 59.2);
    fadeUp('#s7 .rp-note', 59.6, 0.5, 16);
    tl.fromTo('#s7 .fb1', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 60.3); sfx(60.3, 'pop', 0.7);
    tl.fromTo('#s7 .fb2', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 60.8); sfx(60.8, 'pop', 0.7);
    featureOut('s7', 63.45);

    // ------------------------------------------------ S8 · Recap (64 – 70)
    show('#s8', 63.95, 70.2);
    tl.fromTo('#child2-wrap', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 64.1);
    tl.fromTo('#paper2', { x: 200, rotation: 20, opacity: 0 }, { x: 0, rotation: 6, opacity: 1, duration: 0.7, ease: 'back.out(1.3)' }, 64.35);
    $$('#paper2 .p-mark path').forEach((p, i) => draw(p, 64.8 + i * 0.1, 0.2));
    tl.fromTo('#paper2 .grade', { scale: 2.4, opacity: 0, rotation: 12 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.35, ease: 'back.out(2)' }, 65.4);
    sfx(64.1, 'sparkle');
    sfx(65.4, 'thud', 0.8);
    $$('#s8 .spk').forEach((s, i) => {
      tl.fromTo(s, { scale: 0, rotation: -60, opacity: 0 }, { scale: SPARKS[i][2], rotation: 0, opacity: 1, duration: 0.4, ease: 'back.out(3)' }, 64.3 + i * 0.12);
      tl.to(s, { scale: SPARKS[i][2] * 0.7, duration: 0.6, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 64.8 + i * 0.12);
    });
    wordsIn('#s8 .a', 64.4, 0.08);
    wordsIn('#s8 .b', 65.0, 0.1); sfx(65.0, 'whoosh');
    $$('#s8 .checklist li').forEach((li, i) => {
      tl.fromTo(li, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 65.9 + i * 0.35);
      sfx(65.9 + i * 0.35, 'pop', 0.7);
    });

    // ------------------------------------------------ S9 · CTA (69.2 – 78)
    show('#s9', 69.2);
    tl.fromTo('#s9', { clipPath: 'circle(0px at 960px 540px)' }, { clipPath: 'circle(1200px at 960px 540px)', duration: 0.8, ease: 'power2.in' }, 69.2);
    sfx(69.15, 'whooshBig');
    fadeUp('#s9 .cta-pre', 70.0, 0.5, 30);
    popIn('#s9 .free', 70.3, 0.2, 0.5);
    sfx(70.3, 'impact');
    wordsIn('#s9 .cta-rest', 70.5, 0.1, 50);
    fadeUp('#s9 .cta-sub', 71.2, 0.5, 20);
    popIn('#s9 .btn', 71.9, 0.6, 0.55); sfx(71.9, 'pop');
    // cursor clicks the button
    const btn = $('#s9 .btn');
    const bx = btn.offsetLeft + $('#s9 .cta').offsetLeft + btn.offsetWidth * 0.62;
    const by = btn.offsetTop + $('#s9 .cta').offsetTop + btn.offsetHeight * 0.55;
    tl.fromTo('#s9 .cursor', { x: 1560, y: 1100, opacity: 0 }, { x: bx, y: by, opacity: 1, duration: 0.9, ease: 'power3.out' }, 72.4);
    tl.to('#s9 .cursor', { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '10% 5%' }, 73.3);
    tl.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }, 73.3);
    tl.fromTo('#s9 .ripple', { scale: 0, opacity: 1 }, { scale: 9, opacity: 0, duration: 0.7, ease: 'power2.out' }, 73.35);
    sfx(73.3, 'click');
    const cfx = btn.offsetLeft + $('#s9 .cta').offsetLeft + btn.offsetWidth / 2;
    const cfy = by;
    $$('#s9 .cf').forEach((c, i) => {
      const a = (i / 30) * Math.PI * 2 + (i % 4) * 0.09;
      const r = 260 + ((i * 53) % 190);
      tl.fromTo(c, { x: cfx, y: cfy, scale: 0, rotation: 0, opacity: 1 },
        { x: cfx + Math.cos(a) * r * 1.5, y: cfy + Math.sin(a) * r, scale: 1, rotation: 200 + i * 23, duration: 0.9, ease: 'power3.out' }, 73.4);
      tl.to(c, { y: `+=${120 + (i % 5) * 30}`, opacity: 0, duration: 1.1, ease: 'power1.in' }, 74.3);
    });
    sfx(73.4, 'sparkle');
    tl.to('#s9 .cursor', { opacity: 0, duration: 0.4 }, 74.3);
    tl.fromTo('#s9 .endlock', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 74.2);
    sfx(74.2, 'shimmer', 0.8);
    tl.to(btn, { scale: 1.04, duration: 0.7, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 74.8);

    tl.set({}, {}, DURATION);
  }

  // ================================================================ boot
  const ready = (async () => {
    await Promise.all(['400', '500', '600', '700', '800', 'italic 700'].map((w) => document.fonts.load(`${w} 40px Poppins`)));
    await document.fonts.ready;
    await loadLogos();
    build();
    tl.seek(0, false);
  })();

  window.SEKOOL = {
    duration: DURATION,
    fps: FPS,
    cues,
    music: { bpm: 120, drop: 14.0, end: 76.0 },
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
