# SEKOOL.my Green-Screen UGC Reel

A 9:16 reel (1080×1920, 30 fps, about 43 s) in the "green screen" UGC format. A young Malay teacher talks to camera in the bottom half of the frame, the visuals change behind and above him on every line, and word-by-word captions sit between the two. Aimed at parents of Darjah 2–6 pupils who are weak in Matematik.

- **Draft:** [`output/sekool-ugc-draft.mp4`](output/sekool-ugc-draft.mp4). It uses an illustrated placeholder teacher with lip movement, plus music and SFX. There is no voiceover yet.
- **Final:** add a talking-head clip at `avatar/avatar.mp4`, shot or generated on a green screen, and run `npm run render`. The output is `output/sekool-ugc.mp4`: the clip is keyed over the scenes, its voice becomes the soundtrack with a quiet music bed, and scenes and captions are re-timed to its pauses. See [`avatar/README.md`](avatar/README.md) for the avatar brief, the script to paste into HeyGen / Arcads, and timing and placement overrides.

## Beats

| # | Line | Visual |
|---|------|--------|
| 1 | Kalau anak Darjah 2–6 lemah dalam Matematik, | Worksheet getting red crosses, **4/20** circled in red pen |
| 2 | Kami akan diagnose kelemahan pelajar dan susun cara pembelajaran yang sesuai | "Diagnosis Kelemahan" topic bars (Kuat / Sederhana / Lemah), then the real Stage 2 Learning Roadmap pages fan out |
| 3 | sebagai Personal Teacher dari Sekolah Kebangsaan untuk bantu mereka skor A. | Personal Teacher card with a "✓ Cikgu Sekolah Kebangsaan" badge, then an **A** stamped on a result slip |
| 4 | Tahun lepas, lebih dari 5 students kami naik pentas di Majlis Anugerah Sekolah. | Award stage with a spotlight, trophy, podium and confetti, and a "**5+** pelajar SEKOOL naik pentas" counter |
| 5 | Jadi, untuk elakkan anak anda gagal atau dimasukkan ke kelas pemulihan, | Report card with Matematik **E** stamped **GAGAL**, then a "KELAS PEMULIHAN" door sign struck out |
| 6 | Kami akan bantu pelajar dengan 'SEKOOL Class' iaitu 1 to 1 Online Class bersama Personal Teacher, | SEKOOL logo, laptop with a live 1-to-1 call (teacher and child tiles, fraction on the whiteboard) |
| 7 | bermula dengan Ujian Roadmap & Trial Class. | Two steps: 1 Ujian Roadmap → 2 Trial Class, with a FREE tag |
| 8 | Kami juga hanya accept 6 new students per week kerana cikgu yang tak ramai. | Big **6** and six seats: "Pelajar baru setiap minggu" |
| 9 | We only accept Cikgu Sekolah Kebangsaan as our Personal Teacher, that's why. | Green seal, "Only Cikgu Sekolah Kebangsaan", three verified teacher cards |
| 10 | So, click link di bawah dan isi details anda untuk join Free 1 to 1 Trial Class. | Sign-up form typing itself in, "Join Free Trial Class" button press, "Klik link di bawah ↓" |

Layout follows the Reels safe zones: visuals at y 150–930, captions around y 1000, and the avatar from about y 1080 down. The bottom ~300 px, which the Reels UI covers, only shows the avatar's chest.

## Commands

```bash
npm install
pip install numpy scipy imageio-ffmpeg
npm run render                  # draft, or the final if avatar/avatar.mp4 exists (about 2.5 min on 4 cores)
npm run stills -- 2,10,20       # PNG stills at those seconds -> build/stills/
npm run preview                 # then open http://localhost:8080/src/index.html (space = play/pause, ?t=20 to jump)
```

If Playwright's bundled Chromium isn't installed, point the renderer at any Chromium with `CHROMIUM=/path/to/chrome`.

Music and SFX are synthesised by the explainer's generator (`../sekool-explainer/audio/generate_audio.py`), so there are no stock assets to license.

## Common edits

| Change | Where |
|--------|-------|
| Script / caption words, highlighted keywords, default timing | `src/script.js` |
| On-screen text in the visuals (worksheet, report card, form…) | `src/index.html` |
| Colours, sizes, positions | `src/styles.css` |
| When each animation or sound effect fires | `src/main.js`, in the `SCENES` list, one function per beat, offsets in seconds from the start of the line |
| Avatar size, position, keying, music volume | `avatar/config.json` (see `avatar/README.md`) |

## Notes

- **Placeholder data:** the worksheet answers, topic bars, report card grades, "Puan Nurul" and the phone number on the form are illustrative.
- **Claims** in the script ("lebih dari 5 students naik pentas", "6 new students per week", "skor A") are SEKOOL's as briefed. Make sure they can be backed up before running this as a paid ad.
