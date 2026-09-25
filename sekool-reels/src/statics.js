/* SEKOOL static image ads (1080x1350, 4:5 feed), one per angle of the "Copywriting SEKOOL"
 * doc. Open statics.html?ad=<name> to see one; render/statics.mjs saves them all as PNGs.
 * The caption (primary text) for each image is in ../STATIC-ADS.md. */
(() => {
  const ICONS = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
    down: '<path d="M12 4v15M5.5 12.5L12 19l6.5-6.5"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5"/>',
  };
  const icon = (n, sw = 2.6) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
  const logo = (cls = '') => `<div class="logo ${cls}"><div class="mark" data-logo="mark"></div><div class="wordmark" data-logo="wordmark"></div></div>`;
  const foot = (lead, sub) => `<div class="foot"><p>${lead}<span>${sub}</span></p><div class="pill">Klik link di bawah ${icon('down')}</div></div>`;
  const AREAS = [['Concept', 78, false], ['Calculation', 84, false], ['Problem Statement', 36, true], ['Application', 30, true]];

  const STATICS = {
    // Positioning: diagnose first
    'diagnose-dulu': {
      bg: '',
      html: `${logo()}
        <div class="eyebrow">Anak Darjah 1 – 6 lemah Matematik?</div>
        <h1 class="h1" style="top:290px">Kami diagnose dulu,<br>baru <em>mengajar.</em></h1>
        <div class="diag card" style="top:560px">${AREAS.map(([l, v, w]) => `<div class="brow ${w ? 'weak' : ''}"><span>${l}</span>
          <div class="track"><div class="fill" style="width:${v}%"></div></div><b class="tag ${w ? '' : 'ok'}">${w ? 'Lemah' : 'OK'}</b></div>`).join('')}</div>
        <p class="body" style="top:1000px">Ujian Roadmap tunjuk <b>di mana</b> anak lemah dan <b>kenapa</b>, supaya cikgu tahu cara yang sesuai untuk bantu dia.</p>
        ${foot('Ujian Roadmap percuma', 'Untuk anak Darjah 1 – 6')}`,
    },

    // Proof: the parent's story
    'kisah-parent': {
      bg: 'lav',
      html: `${logo()}<div class="qmark">“</div>
        <p class="quote" style="top:250px">Lepas lebih kurang 3 bulan dengan SEKOOL, markah Math anak saya naik dari <b>59</b> ke <b>82</b>.</p>
        <div class="scores" style="top:570px">
          <div class="score card before"><small>Sebelum</small><strong>59</strong></div>
          <div class="arr">${icon('arrow')}</div>
          <div class="score card after"><small>Selepas ~3 bulan</small><strong>82</strong></div></div>
        <p class="sign" style="top:850px">“You will feel like someone is actually taking care of your child’s academics.”<span>Parent pelajar SEKOOL</span></p>
        <p class="body" style="top:1010px;font-size:34px">Dulu, nampak soalan ayat panjang terus lari cari saya. <b>Sekarang dia baca dan analyze soalan sendiri.</b></p>
        ${foot('Free 1 to 1 Trial Class', 'Untuk anak Darjah 1 – 6')}`,
    },

    // Priority: what happens if nothing changes
    'kalau-dibiarkan': {
      bg: 'dark',
      html: `${logo()}
        <h1 class="h1" style="top:200px;font-size:84px">Kalau dibiarkan,<br>lemah Matematik<br>jarang <em class="bad">okay sendiri.</em></h1>
        <div class="plist" style="top:560px">${['Gagal dalam ujian', 'Masuk kelas pemulihan', 'Turun kelas', 'Give up dalam akademik'].map((t, k) =>
          `<div class="prow"><i>${k + 1}</i>${t}</div>`).join('')}</div>
        <p class="body" style="top:1010px">SEKOOL bantu anak <b>sebelum</b> sampai ke tahap ini, dengan 1 to 1 Online Class bersama Personal Teacher.</p>
        ${foot('Hanya 6 tempat baru', 'setiap minggu')}`,
    },

    // Authority: EEF research
    'kajian-1-to-1': {
      bg: 'indigo',
      html: `<div class="glow"></div>${logo()}
        <p class="small" style="top:230px">Kajian Education Endowment Foundation (EEF):</p>
        <div class="stat" style="top:300px;font-size:215px">+5 bulan</div>
        <p class="body" style="top:560px;font-size:44px;line-height:1.3">kemajuan pembelajaran tambahan, secara purata, untuk pelajar yang dapat <b>tuisyen 1 to 1</b>.</p>
        <div class="rule" style="top:800px"></div>
        <h2 class="h2" style="top:850px">Satu Cikgu. Satu Anak.<br>Itulah <em style="background:#fff;-webkit-background-clip:border-box;background-clip:border-box;color:#4f46e5;padding:0 .16em .03em;border-radius:.16em">SEKOOL Class.</em></h2>
        <p class="src" style="top:1040px">Sumber: EEF Teaching and Learning Toolkit, One to one tuition.</p>
        ${foot('Free 1 to 1 Trial Class', 'Untuk anak Darjah 1 – 6')}`,
    },

    // Pain: the tired working parent (photo 7)
    'parent-penat': {
      bg: '',
      html: `<img class="photo-top" src="../photos/7.jpg" style="object-position:50% 62%">${logo('chip')}
        <div class="panel"></div>
        <p class="body" style="top:750px;font-size:36px">Balik kerja pukul 6. Masak. Basuh baju. Lepas tu teman anak buat homework Matematik…</p>
        <h1 class="h1" style="top:880px;font-size:84px">Biar <em>Personal Teacher</em><br>yang pantau.</h1>
        ${foot('Free 1 to 1 Trial Class', '1 to 1 Online Class dari rumah')}`,
    },

    // Proof + scarcity: awards (photos 6 and 4)
    'naik-pentas': {
      bg: 'indigo',
      html: `<div class="glow"></div>${logo()}
        <h1 class="h1" style="top:170px;font-size:80px;line-height:1.2">Tahun lepas,<br><em>5+ pelajar</em> SEKOOL<br>naik pentas.</h1>
        <p class="body" style="top:480px">Terima Anugerah Akademik di sekolah.</p>
        <div class="pol" style="left:90px;top:610px;transform:rotate(-6deg)"><img src="../photos/6.jpg" style="object-position:75% 55%;height:430px"></div>
        <div class="pol" style="left:560px;top:630px;transform:rotate(5deg)"><img src="../photos/4.jpg" style="object-position:50% 60%;height:430px"></div>
        <div class="trophy" style="left:455px;top:570px">${icon('trophy', 2)}</div>
        ${foot('Hanya 6 tempat baru', 'setiap minggu')}`,
    },

    // Positioning: comparison
    'tuisyen-vs-sekool': {
      bg: '',
      html: `${logo()}
        <h1 class="h1" style="top:180px;font-size:80px">Tuisyen biasa<br>vs <em>SEKOOL Class</em></h1>
        <div class="vs" style="top:420px"><div class="col-h a">Tuisyen biasa</div><div class="col-h b">SEKOOL Class</div>
          ${[['Kelas besar', '1 to 1: satu cikgu, satu anak'], ['Satu pace untuk semua', 'Ikut cara anak belajar'],
            ['Terus mengajar', 'Diagnose kelemahan dulu'], ['Part-timer / student', 'Cikgu Sekolah Kebangsaan & Private School'],
            ['Segan nak bertanya', '2 way: boleh tanya terus'], ['Jadual tetap', 'Kelas boleh reschedule']].map(([a, b], k, all) =>
            `<div class="c a ${k === all.length - 1 ? 'last' : ''}">${icon('x')}${a}</div><div class="c b ${k === all.length - 1 ? 'last' : ''}">${icon('check', 3)}${b}</div>`).join('')}</div>
        ${foot('Free 1 to 1 Trial Class', 'Untuk anak Darjah 1 – 6')}`,
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
    await Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Poppins`)));
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
    await Promise.all(['mark', 'wordmark'].map((k) => fetch(`assets/logo-${k}.svg`).then((r) => r.text())
      .then((svg) => document.querySelectorAll(`[data-logo="${k}"]`).forEach((e) => { e.innerHTML = svg; }))));
  })();
})();
