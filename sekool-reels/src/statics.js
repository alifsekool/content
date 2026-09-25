/* SEKOOL static image ads (1080x1350, 4:5 feed), one per angle of the "Copywriting SEKOOL"
 * doc. Each is one clear headline and one short subheadline, with the SEKOOL wordmark and
 * no CTA (the ad's own button does that). Open statics.html?ad=<name> to see one;
 * render/statics.mjs saves them all as PNGs. Captions are in ../STATIC-ADS.md. */
(() => {
  const logo = (cls = '') => `<div class="logo ${cls}" data-logo="wordmark"></div>`;
  const text = (h, sub, cls = '') => `<div class="text ${cls}">${cls ? '' : '<div class="bar"></div>'}<h1>${h}</h1><p class="sub">${sub}</p></div>`;

  const STATICS = {
    // Positioning: diagnose first
    'diagnose-dulu': {
      bg: '',
      html: logo() + text('Kami kenal pasti <em>kelemahan anak</em> dulu, baru mula mengajar.',
        '1 to 1 Online Class Matematik untuk anak Darjah 1 – 6.'),
    },
    // Proof: the parent's story
    'kisah-parent': {
      bg: 'lav',
      html: logo() + text('“Markah Matematik anak saya naik dari <em>59 ke 82</em> dalam 3 bulan.”',
        'Parent pelajar SEKOOL'),
    },
    // Priority: act before it gets worse
    'kalau-dibiarkan': {
      bg: 'dark',
      html: logo() + text('Anak lemah Matematik? Bantu dia <em>sebelum masuk kelas pemulihan.</em>',
        '1 to 1 Online Class dengan Personal Teacher untuk anak Darjah 1 – 6.'),
    },
    // Authority: EEF research
    'kajian-1-to-1': {
      bg: 'indigo',
      html: logo() + text('Pelajar kelas 1 to 1 capai purata <em>5 bulan</em> kemajuan tambahan.',
        'Menurut kajian Education Endowment Foundation (EEF).'),
    },
    // Pain: the tired working parent (photo 7)
    'parent-penat': {
      bg: '',
      html: `<img class="photo" src="../photos/7.jpg" style="object-position:50% 62%">${logo('chip')}` +
        text('Tak sempat teman anak buat homework <em>Matematik?</em>', 'Personal Teacher SEKOOL ajar anak 1 to 1, secara online dari rumah.', 'low'),
    },
    // Proof: awards (photos 6 and 4)
    'naik-pentas': {
      bg: '',
      html: `<div class="photos"><img src="../photos/6.jpg" style="object-position:72% 55%"><img src="../photos/4.jpg" style="object-position:45% 60%"></div>${logo('chip')}` +
        text('Tahun lepas, <em>5+ pelajar SEKOOL</em> terima Anugerah Akademik.', 'Kelas Matematik 1 to 1 untuk anak Darjah 1 – 6.', 'low'),
    },
    // Positioning: a class that fits how the child learns
    'ikut-cara-belajar': {
      bg: 'lav',
      html: logo() + text('Anak tak perlukan lebih banyak kelas. Dia perlukan kelas yang <em>ikut cara dia belajar.</em>',
        'SEKOOL: 1 to 1 Online Class dengan Personal Teacher.'),
    },
  };
  window.STATICS = STATICS;

  const name = new URLSearchParams(location.search).get('ad') || Object.keys(STATICS)[0];
  const s = STATICS[name];
  const el = document.createElement('div');
  el.className = `ad ${s.bg}`;
  el.innerHTML = s.html;
  document.body.appendChild(el);

  window.READY = (async () => {
    await Promise.all(['500', '700'].map((w) => document.fonts.load(`${w} 40px Poppins`)));
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
    const svg = await fetch('assets/logo-wordmark.svg').then((r) => r.text());
    document.querySelectorAll('[data-logo="wordmark"]').forEach((e) => { e.innerHTML = svg; });
  })();
})();
