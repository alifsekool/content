/* SEKOOL Reels ads: one entry per ad. All on-screen copy lives here.
 *
 * Scene types
 *   photo  full-bleed 9:16 photo (portrait photos). `pos` is the CSS object-position,
 *          or `pan` [from, to] to slide across the photo during the scene.
 *          `zoom` [from, to] with `origin` animates a slow push-in across the scene.
 *   card   landscape photo as a rounded card over its own blurred copy (photos/N-bg.jpg).
 *   roadmap  what the Learning Roadmap does: headline `lines`, two roadmap `pages`
 *          (src/assets/roadmap/), `sub`, three numbered `points` and a `note`.
 *   cta    SEKOOL indigo end card: logo (or an envelope with `mail`), headline `lines`
 *          (<em> = white highlight), optional `sub`, then a pill (`button`, default
 *          "Click down below") with an arrow pointing at the ad's link button.
 * A photo scene can pop in `insert`: a close-up (photos/<src>.jpg, made by
 * prepare_photos.py) at `at` s, `y` px from the top, rotated `rot` degrees.
 * Captions: [start (s, relative to the scene), html, size ('xl' | 'l' | 'm')].
 * <b> inside a caption is highlighted in SEKOOL indigo.
 *
 * Keep captions between y = 260 and y = 1250: Reels and Stories cover the top ~14%
 * and bottom ~35% of the frame with their own UI. */
// end cards
const CTA = { type: 'cta', fast: true, lines: ['1 to 1 with', 'Cikgu Sekolah', 'Kebangsaan.'] };
// same offer as the explainer-roadmap video: get the Learning Roadmap test by email
const ROADMAP_CTA = { type: 'cta', fast: true, mail: true, button: 'Klik link di bawah',
  lines: ['Kami akan hantar', '<em>Ujian Roadmap</em>', 'di email untuk', 'pelajar jawab.'] };

window.ADS = {
  // 17 s · the class-at-home moment
  'class-at-home': {
    duration: 17,
    music: { end: 14, arps: 4 },
    scenes: [
      { type: 'photo', src: 5, from: 0, to: 3.8, pos: '100% 50%', zoom: [1, 1.1], origin: '70% 45%',
        captions: [[0.1, 'Personal class.', 'xl'], [0.75, 'From the living room floor.', 'l'], [1.9, 'No traffic. No travelling.', 'm']] },
      { type: 'card', src: 3, from: 3.6, to: 6.8, zoom: [1, 1.06], origin: '72% 45%',
        captions: [[0.3, 'Live 1 to 1 class', 'l'], [0.8, 'with a <b>Cikgu Sekolah Kebangsaan</b>', 'm']] },
      { type: 'card', src: 2, from: 6.6, to: 9.8, zoom: [1, 1.06], origin: '75% 40%',
        captions: [[0.3, 'One Cikgu. One child.', 'l'], [0.8, 'Taught at <b>your child\'s pace</b>.', 'm']] },
      { type: 'photo', src: 7, from: 9.6, to: 13.0, pan: ['0% 50%', '100% 50%'], zoom: [1, 1.05], origin: '75% 55%',
        captions: [[0.3, 'Dinner\'s cooking.', 'xl'], [1.0, '<b>Class is on.</b>', 'xl']] },
      { ...CTA, from: 12.8, to: 17 },
    ],
  },

  // 20 s · results and awards, then what the Learning Roadmap does, then the Roadmap offer.
  // Uses real results: run only with the parents' consent.
  'report-card-day': {
    duration: 20,
    music: { end: 18, arps: 2 },
    scenes: [
      { type: 'photo', src: 1, from: 0, to: 3.8, pos: '58% 50%', zoom: [1, 1.22], origin: '78% 86%',
        insert: { src: '1-slip', at: 1.4, y: 650, rot: -2.5 },
        captions: [[0.1, 'Report card day.', 'xl'], [1.5, '<b>90.40%</b> · No. 1 out of 30', 'l']] },
      { type: 'photo', src: 4, from: 3.6, to: 6.9, pos: '50% 50%', zoom: [1, 1.2], origin: '58% 66%',
        captions: [[0.3, 'Appreciation day.', 'xl'], [1.1, '<b>No. 1 Dalam Kelas</b>', 'l']] },
      { type: 'photo', src: 6, from: 6.7, to: 10.0, pos: '100% 50%', zoom: [1, 1.15], origin: '72% 78%',
        captions: [[0.3, 'Awards day.', 'xl'], [1.1, '<b>Anugerah Kecemerlangan Akademik</b>', 'm']] },
      { type: 'roadmap', from: 9.8, to: 16.0, pages: ['stage2-p1.jpg', 'stage2-p3.jpg'],
        lines: ['Kami dah design', 'Learning Roadmap'], sub: 'yang jelaskan 3 perkara ini:',
        points: ['Di mana kelemahan pelajar', 'Kenapa pelajar lemah', 'Cara pembelajaran yang sesuai untuk improve'],
        note: 'berdasarkan <b>tahap penguasaan pelajar</b>.' },
      { ...ROADMAP_CTA, from: 15.8, to: 20 },
    ],
  },

  // 10 s · fast montage, one cut per bar of music
  'quick-cut': {
    duration: 10,
    music: { end: 8, arps: 0 },
    scenes: [
      { type: 'photo', src: 5, from: 0, to: 1.05, pos: '100% 50%', zoom: [1.04, 1.1], origin: '70% 45%', cut: true,
        captions: [[0.05, 'Live classes.', 'xl']] },
      { type: 'card', src: 3, from: 1.0, to: 2.05, zoom: [1, 1.05], origin: '72% 45%', cut: true,
        captions: [[0.05, '1 to 1.', 'xl']] },
      { type: 'card', src: 2, from: 2.0, to: 3.05, zoom: [1, 1.05], origin: '75% 40%', cut: true,
        captions: [[0.05, 'From home.', 'xl']] },
      { type: 'photo', src: 7, from: 3.0, to: 4.05, pos: '100% 50%', zoom: [1.04, 1.1], origin: '75% 55%', cut: true,
        captions: [[0.05, 'While dinner cooks.', 'xl']] },
      { type: 'photo', src: 1, from: 4.0, to: 5.05, pos: '58% 50%', zoom: [1.04, 1.12], origin: '78% 86%', cut: true,
        captions: [[0.05, 'Report card day.', 'xl']] },
      { type: 'photo', src: 4, from: 5.0, to: 6.05, pos: '50% 50%', zoom: [1.04, 1.14], origin: '58% 66%', cut: true,
        captions: [[0.05, 'No. 1 Dalam Kelas.', 'xl']] },
      { type: 'photo', src: 6, from: 6.0, to: 7.05, pos: '100% 50%', zoom: [1.04, 1.12], origin: '72% 78%', cut: true,
        captions: [[0.05, 'Anugerah Kecemerlangan.', 'xl']] },
      { ...CTA, from: 7.0, to: 10 },
    ],
  },
};
