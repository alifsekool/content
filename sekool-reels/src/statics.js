/* SEKOOL static image ads (1080x1350, 4:5 feed), one per angle of the "Copywriting SEKOOL"
 * doc. Each is one clear headline and one short subheadline, with the SEKOOL wordmark and
 * no CTA (the ad's own button does that). Open statics.html?ad=<name> to see one;
 * render/statics.mjs saves them all as PNGs. Captions are in ../STATIC-ADS.md. */
(() => {
  const logo = (cls = '') => `<div class="logo ${cls}" data-logo="wordmark"></div>`;
  // `by` is an optional small attribution line (who said it, or the source of a figure)
  const keep = (t) => t.replace(/1 to 1/g, '1&nbsp;to&nbsp;1'); // never split "1 to 1" across lines
  const text = (h, sub, cls = '', by = '') => keep(`<div class="text ${cls}">${cls ? '' : '<div class="bar"></div>'}<h1>${h}</h1><p class="sub">${sub}</p>${by ? `<p class="by">${by}</p>` : ''}</div>`);

  const STATICS = {
    // Positioning: diagnose first
    'diagnose-dulu': {
      bg: '',
      html: logo() + text('Kami kenal pasti <em>kelemahan anak</em> dulu, baru mula mengajar.',
        'Ujian Roadmap tunjuk di mana anak lemah dan kenapa, sebelum kelas bermula.'),
    },
    // Proof: the parent's story
    'kisah-parent': {
      bg: 'lav',
      html: logo() + text('“Markah Matematik anak saya naik dari <em>59 ke 82</em> dalam 3 bulan.”',
        'Setiap kali dia salah, cikgu terangkan kenapa sampai dia betul-betul faham.', '', 'Parent pelajar SEKOOL'),
    },
    // Priority: act before it gets worse
    'kalau-dibiarkan': {
      bg: 'dark',
      html: logo() + text('Anak lemah Matematik? Bantu dia <em>sebelum masuk kelas pemulihan.</em>',
        'Kalau dibiarkan, anak boleh gagal ujian, turun kelas dan hilang minat belajar.'),
    },
    // Authority: EEF research
    'kajian-1-to-1': {
      bg: 'indigo',
      html: logo() + text('Pelajar 1 to 1 progres <em>5 bulan lebih laju</em> berbanding pelajar kelas biasa.',
        'Sebab cikgu fokus pada seorang pelajar sahaja, ikut pace dia.', '', 'Sumber: Education Endowment Foundation (EEF)'),
    },
    // Pain: the tired working parent (photo 7)
    'parent-penat': {
      bg: '',
      html: `<img class="photo" src="../photos/7.jpg" style="object-position:50% 62%">${logo('chip')}` +
        text('Tak sempat teman anak buat homework <em>Matematik?</em>', 'Personal Teacher SEKOOL boleh temankan dia, 1 to 1 secara online dari rumah.', 'low'),
    },
    // Proof: awards (photos 6 and 4)
    'naik-pentas': {
      bg: '',
      html: `<div class="photos"><img src="../photos/6.jpg" style="object-position:72% 55%"><img src="../photos/4.jpg" style="object-position:45% 60%"></div>${logo('chip')}` +
        text('Tahun lepas, <em>5+ pelajar SEKOOL</em> terima Anugerah Akademik.', 'Mereka belajar 1 to 1 dengan Personal Teacher yang ajar ikut tahap mereka.', 'low'),
    },
    // Positioning: a class that fits how the child learns
    'ikut-cara-belajar': {
      bg: 'lav',
      html: logo() + text('Anak tak perlukan lebih banyak kelas. Dia perlukan kelas yang <em>ikut cara dia belajar.</em>',
        'Di SEKOOL, Personal Teacher ajar 1 to 1 ikut tahap dan pace anak anda.'),
    },
    // Pain: no time to watch over the child because of house chores
    'house-chores': {
      bg: 'lav',
      html: logo() + text('Tak sempat nak <em>pantau anak</em> sebab kena settlekan house chores?',
        'Mula dengan <b>FREE Learning Roadmap</b>. Anda tahu di mana anak lemah tanpa perlu pantau setiap hari.'),
    },
    // Offer: the free Learning Roadmap
    'free-roadmap': {
      bg: 'indigo',
      html: logo() + text('<em>FREE Learning Roadmap</em> untuk Darjah 1 – 6',
        'Tahu di mana anak lemah dalam Matematik, kenapa, dan cara yang sesuai untuk improve.'),
    },
    // Pain: phone time
    'main-fon': {
      bg: 'dark',
      html: logo() + text('Penat nak jerit suruh anak <em>berhenti main&nbsp;fon?</em>',
        'Mungkin dia lari dari subjek yang dia tak faham. <b>FREE Learning Roadmap</b> tunjuk di mana dia lemah.'),
    },
    // Pain: parent guilt
    'rasa-bersalah': {
      bg: '',
      html: logo() + text('Rasa bersalah <em>tak sempat ajar anak?</em>',
        'Mula dengan <b>FREE Learning Roadmap</b>: tahu di mana anak lemah, dan cara yang sesuai untuk bantu&nbsp;dia.'),
    },
    // Method (from the sekool.my Threads post): the 3D teaching method
    'document-demonstrate-duplicate': {
      bg: 'indigo',
      // hook + the 3D line, then a pointer to the caption (steps and Pro Tips live in the caption)
      html: logo() + `<div class="text" style="bottom:200px"><div class="bar"></div>
        <h1>The most underrated way untuk mengajar <em>student Darjah 1&nbsp;–&nbsp;6.</em></h1>
        <p class="ddd">Document, Demonstrate, Duplicate.</p></div>
        <p class="readcap">Baca caption <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5.5 12.5L12 19l6.5-6.5"/></svg></p>`,
    },
    // Method, framed as the benefit for parents
    'cara-jawab-soalan': {
      bg: '',
      html: logo() + text('Anak belajar <em>cara jawab soalan</em>, bukan hafal jawapan.',
        'Cikgu tulis langkah-langkahnya, tunjuk cara guna, dan anak cuba sendiri sampai&nbsp;boleh.'),
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
