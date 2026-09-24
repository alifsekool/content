/* SEKOOL Reels ads: one entry per ad. All on-screen copy lives here.
 *
 * Scene types
 *   photo  full-bleed 9:16 photo (portrait photos). `pos` is the CSS object-position,
 *          `zoom` [from, to] with `origin` animates a slow push-in across the scene.
 *   card   landscape photo as a rounded card over its own blurred copy (photos/N-bg.jpg).
 *   cta    SEKOOL indigo end card.
 * A photo scene can pop in `insert`: a close-up (photos/<src>.jpg, made by
 * prepare_photos.py) at `at` s, `y` px from the top, rotated `rot` degrees.
 * Captions: [start (s, relative to the scene), html, size ('xl' | 'l' | 'm')].
 * <b> inside a caption is highlighted in SEKOOL indigo.
 *
 * Keep captions between y = 260 and y = 1250: Reels and Stories cover the top ~14%
 * and bottom ~35% of the frame with their own UI. */
window.ADS = {
  // 15 s · the class-at-home moment
  'class-at-home': {
    duration: 15,
    music: { end: 12, arps: 4 },
    scenes: [
      { type: 'photo', src: 5, from: 0, to: 4.2, pos: '100% 50%', zoom: [1, 1.1], origin: '70% 45%',
        captions: [[0.1, 'Tuition class.', 'xl'], [0.75, 'From the living room floor.', 'l'], [2.1, 'No traffic. No tuition centre.', 'm']] },
      { type: 'card', src: 3, from: 4.0, to: 7.7, zoom: [1, 1.06], origin: '72% 45%',
        captions: [[0.3, 'Live 1 to 1 class', 'l'], [0.85, 'with a <b>Cikgu Sekolah Kebangsaan</b>', 'm']] },
      { type: 'card', src: 2, from: 7.5, to: 10.8, zoom: [1, 1.06], origin: '75% 40%',
        captions: [[0.3, 'One Cikgu. One child.', 'l'], [0.85, 'Taught at <b>your child\'s pace</b>.', 'm']] },
      { type: 'cta', from: 10.6, to: 15,
        lines: ['Personalized 1 to 1', 'Online Learning'], sub: 'with <b>Cikgu Sekolah Kebangsaan</b>',
        meta: ['Year 1 – 6', 'KSSR / KSSM', 'UASA & MPT4'], button: 'Get a <b>FREE</b> Learning Roadmap' },
    ],
  },

  // 12 s · results day. Uses real results: run only with the parents' consent.
  'report-card-day': {
    duration: 12,
    music: { end: 10, arps: 2 },
    scenes: [
      { type: 'photo', src: 1, from: 0, to: 4.2, pos: '58% 50%', zoom: [1, 1.22], origin: '78% 86%',
        insert: { src: '1-slip', at: 1.5, y: 650, rot: -2.5 },
        captions: [[0.1, 'Report card day.', 'xl'], [1.6, '<b>90.40%</b> · No. 1 out of 30', 'l']] },
      { type: 'photo', src: 4, from: 4.0, to: 7.8, pos: '50% 50%', zoom: [1, 1.2], origin: '58% 66%',
        captions: [[0.3, 'Appreciation day.', 'xl'], [1.3, '<b>No. 1 Dalam Kelas</b>', 'l']] },
      { type: 'cta', from: 7.6, to: 12,
        lines: ['Moments like this', 'start at home.'], sub: '1 to 1 with <b>Cikgu Sekolah Kebangsaan</b>',
        meta: ['Year 1 – 6', 'KSSR / KSSM', 'UASA & MPT4'], button: 'Get a <b>FREE</b> Learning Roadmap' },
    ],
  },

  // 8 s · fast montage, one cut per bar of music
  'quick-cut': {
    duration: 8,
    music: { end: 6, arps: 0 },
    scenes: [
      { type: 'photo', src: 5, from: 0, to: 1.05, pos: '100% 50%', zoom: [1.04, 1.1], origin: '70% 45%', cut: true,
        captions: [[0.05, 'Live classes.', 'xl']] },
      { type: 'card', src: 3, from: 1.0, to: 2.05, zoom: [1, 1.05], origin: '72% 45%', cut: true,
        captions: [[0.05, '1 to 1.', 'xl']] },
      { type: 'card', src: 2, from: 2.0, to: 3.05, zoom: [1, 1.05], origin: '75% 40%', cut: true,
        captions: [[0.05, 'From home.', 'xl']] },
      { type: 'photo', src: 1, from: 3.0, to: 4.05, pos: '58% 50%', zoom: [1.04, 1.12], origin: '78% 86%', cut: true,
        captions: [[0.05, 'Report card day.', 'xl']] },
      { type: 'photo', src: 4, from: 4.0, to: 5.05, pos: '50% 50%', zoom: [1.04, 1.14], origin: '58% 66%', cut: true,
        captions: [[0.05, 'No. 1 Dalam Kelas.', 'xl']] },
      { type: 'cta', from: 5.0, to: 8, fast: true,
        lines: ['1 to 1 with', 'Cikgu Sekolah', 'Kebangsaan.'], button: 'Get a <b>FREE</b> Learning Roadmap' },
    ],
  },
};
