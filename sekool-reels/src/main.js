/* SEKOOL Reels · builds the ad named in ?ad= from window.ADS and drives it with a
 * deterministic GSAP timeline. The renderer calls SEKOOL.seek(t) and screenshots the
 * stage; sound-effect cues are collected next to the visuals and exported for the mixer
 * (../sekool-explainer/audio/generate_audio.py). */
(() => {
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  if (RENDER) document.body.classList.add('render');
  const NAME = params.get('ad') || Object.keys(window.ADS)[0];
  const AD = window.ADS[NAME];
  const FPS = 30;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const photo = (n, bg) => `../photos/${n}${bg ? '-bg' : ''}.jpg`;

  // ---------------------------------------------------------------- markup
  const stage = $('#stage');
  const caps = (list) => `<div class="caps">${list.map(([, html, size]) => `<div class="cap ${size}">${html}</div>`).join('')}</div>`;
  AD.scenes.forEach((s, i) => {
    const el = document.createElement('section');
    el.className = `scene t-${s.type}${s.fast ? ' fast' : ''}`;
    el.id = `s${i}`;
    if (s.type === 'photo') {
      const ins = s.insert ? `<div class="insert" style="top:${s.insert.y}px;transform:rotate(${s.insert.rot}deg)"><img src="${photo(s.insert.src)}"></div>` : '';
      el.innerHTML = `<div class="cam"><img class="ph" src="${photo(s.src)}" style="object-position:${s.pos}"></div><div class="shade"></div>${ins}${caps(s.captions)}`;
    } else if (s.type === 'card') {
      el.innerHTML = `<img class="bg" src="${photo(s.src, true)}"><div class="card"><img src="${photo(s.src)}"></div>${caps(s.captions)}`;
    } else {
      const meta = s.meta ? `<p class="c-meta c-el">${s.meta.join('<i></i>')}</p>` : '';
      el.innerHTML = `<div class="glow"></div><div class="c-stack">
        <div class="lockup c-el"><div class="mark" data-logo="mark"></div><div class="wordmark" data-logo="wordmark"></div></div>
        <h2 class="c-h">${s.lines.map((l) => `<span class="c-el">${l}</span>`).join('')}</h2>
        ${s.sub ? `<p class="c-sub c-el">${s.sub}</p>` : ''}${meta}
        <div class="btn c-el">${s.button}<i class="sheen"></i></div>
        <p class="url c-el">sekool.my</p></div>`;
    }
    stage.appendChild(el);
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

    AD.scenes.forEach((s, i) => {
      const el = `#s${i}`;
      const { from, to } = s;
      tl.set(el, { autoAlpha: 1 }, from);
      // stay visible under the next scene until its entrance is fully opaque
      const next = AD.scenes[i + 1];
      if (next) tl.set(el, { autoAlpha: 0 }, Math.max(to, next.from + (next.type === 'cta' ? 0.6 : 0.45)));

      if (s.type === 'cta') {
        const k = s.fast ? 0.6 : 1;
        tl.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'expo.inOut' }, from);
        tl.fromTo(`${el} .glow`, { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 3, ease: 'power2.out' }, from + 0.2);
        tl.fromTo($$(`${el} .c-el`), { y: 50, opacity: 0, filter: B(12) },
          { y: 0, opacity: 1, filter: B(0), duration: 0.9, stagger: 0.12 * k }, from + 0.35 * k);
        const btnAt = from + 0.35 * k + 0.12 * k * $$(`${el} .c-el`).findIndex((e) => e.classList.contains('btn'));
        tl.fromTo(`${el} .btn`, { scale: 0.85 }, { scale: 1, duration: 0.7, ease: 'back.out(2.2)', immediateRender: false }, btnAt);
        tl.fromTo(`${el} .sheen`, { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut' }, btnAt + 0.7);
        tl.fromTo(`${el} .sheen`, { left: '-40%' }, { left: '120%', duration: 1.0, ease: 'power2.inOut', immediateRender: false }, btnAt + 2.2);
        sfx(from - 0.1, 'whoosh', 0.6); sfx(from + 0.35 * k, 'hit', 0.7); sfx(btnAt, 'glint', 0.7);
        return;
      }

      // entrance
      if (i > 0) {
        if (s.cut) {
          tl.fromTo(el, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: 'expo.out' }, from);
          sfx(from, 'swish', 0.45);
        } else {
          tl.fromTo(el, { opacity: 0, scale: 1.1, filter: B(16) }, { opacity: 1, scale: 1, filter: B(0), duration: 0.4, ease: 'power2.out' }, from);
          sfx(from - 0.12, 'whoosh', 0.55);
        }
      }
      // slow push-in on the photo
      const target = s.type === 'photo' ? `${el} .ph` : `${el} .card img`;
      tl.fromTo(target, { scale: s.zoom[0] }, { scale: s.zoom[1], duration: to - from, ease: 'sine.inOut', transformOrigin: s.origin }, from);
      if (s.insert) {
        tl.fromTo(`${el} .insert`, { scale: 0.5, opacity: 0, filter: B(10) },
          { scale: 1, opacity: 1, filter: B(0), duration: 0.6, ease: 'back.out(1.8)' }, from + s.insert.at);
        sfx(from + s.insert.at, 'swish', 0.5);
      }
      if (s.type === 'card') {
        tl.fromTo(`${el} .card`, { y: 80, scale: 0.94 }, { y: 0, scale: 1, duration: 0.8 }, from);
      }
      // captions pop in
      $$(`${el} .cap`).forEach((c, j) => {
        const t = from + s.captions[j][0];
        tl.fromTo(c, { scale: 0.6, y: 24, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, t);
        sfx(t, i === 0 && j === 0 ? 'hit' : 'tick', i === 0 && j === 0 ? 0.8 : 0.7);
      });
    });
    tl.set({}, {}, AD.duration);
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
    name: NAME,
    duration: AD.duration,
    fps: FPS,
    cues,
    music: { bpm: 120, drop: 0, breakdown: [999, 999], ...AD.music },
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
    sel.innerHTML = Object.keys(window.ADS).map((n) => `<option${n === NAME ? ' selected' : ''}>${n}</option>`).join('');
    sel.onchange = () => { location.search = `?ad=${sel.value}`; };
    const playBtn = $('#play'), scrub = $('#scrub'), clk = $('#clock');
    scrub.max = AD.duration;
    const audio = new Audio(`../build/${NAME}.wav`);
    let playing = false, t0 = 0, start = 0, cur = 0;
    const setT = (t) => { cur = Math.max(0, Math.min(AD.duration, t)); tl.seek(cur, false); scrub.value = cur; clk.textContent = `${cur.toFixed(2)}s`; };
    const loop = (now) => {
      if (!playing) return;
      const t = audio.readyState >= 2 && !audio.paused ? audio.currentTime : start + (now - t0) / 1000;
      setT(t);
      if (cur >= AD.duration) { playing = false; playBtn.textContent = 'Play'; audio.pause(); return; }
      requestAnimationFrame(loop);
    };
    playBtn.onclick = () => {
      playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play';
      if (playing) { t0 = performance.now(); start = cur >= AD.duration ? 0 : cur; audio.currentTime = start; audio.play().catch(() => {}); requestAnimationFrame(loop); }
      else audio.pause();
    };
    scrub.oninput = () => { setT(+scrub.value); if (playing) { t0 = performance.now(); start = cur; audio.currentTime = cur; } };
    addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); playBtn.click(); } });
    ready.then(() => setT(+(params.get('t') || 0)));
  }
})();
