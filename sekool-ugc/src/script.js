/* The voiceover script, one entry per beat. Each beat drives one background scene and
 * its captions.
 *
 *   t      default start time in seconds, used for the placeholder avatar. When a real
 *          avatar clip is dropped into avatar/, the renderer re-times every beat to the
 *          pauses in that clip (see render/render.mjs), or you can pin times in
 *          avatar/timing.json.
 *   say    exactly what the avatar says; this is also the caption text
 *   key    words drawn in the highlight colour even when they are not being spoken
 */
window.SCRIPT = {
  tail: 1.2, // seconds the last scene holds after the voice ends
  beats: [
    { t: 0.3, say: 'Kalau anak Darjah 2–6 lemah dalam Matematik,', key: ['lemah', 'Matematik'] },
    { t: 3.4, say: 'Kami akan diagnose kelemahan pelajar dan susun cara pembelajaran yang sesuai', key: ['diagnose', 'kelemahan'] },
    { t: 7.7, say: 'sebagai Personal Teacher dari Sekolah Kebangsaan untuk bantu mereka skor A.', key: ['Personal', 'Teacher', 'skor', 'A'] },
    { t: 11.8, say: 'Tahun lepas, lebih dari 5 students kami naik pentas di Majlis Anugerah Sekolah.', key: ['5', 'students', 'naik', 'pentas'] },
    { t: 16.5, say: 'Jadi, untuk elakkan anak anda gagal atau dimasukkan ke kelas pemulihan,', key: ['gagal', 'pemulihan'] },
    { t: 20.8, say: 'Kami akan bantu pelajar dengan ‘SEKOOL Class’ iaitu 1 to 1 Online Class bersama Personal Teacher,', key: ['SEKOOL', 'Class', '1', 'to'] },
    { t: 26.2, say: 'bermula dengan Ujian Roadmap & Trial Class.', key: ['Ujian', 'Roadmap', 'Trial', 'Class'] },
    { t: 28.8, say: 'Kami juga hanya accept 6 new students per week kerana cikgu yang tak ramai.', key: ['6', 'new', 'students'] },
    { t: 33.4, say: 'We only accept Cikgu Sekolah Kebangsaan as our Personal Teacher, that’s why.', key: ['Cikgu', 'Sekolah', 'Kebangsaan'] },
    { t: 37.2, say: 'So, click link di bawah dan isi details anda untuk join Free 1 to 1 Trial Class.', key: ['link', 'bawah', 'Free', 'Trial', 'Class'] },
  ],
  end: 42.3, // default time the voice ends
};
