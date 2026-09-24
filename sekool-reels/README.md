# SEKOOL.my Reels ads

Short 9:16 video ads (1080×1920, 30 fps, sound on) built from real SEKOOL customer photos. They're made for Instagram and Facebook Reels and Stories.

| Ad | Length | Story |
|----|--------|-------|
| `class-at-home` | 17 s | "Tuition class. From the living room floor." Live 1 to 1 with a Cikgu Sekolah Kebangsaan, then "Dinner's cooking. Class is on." (a pan from mum's selfie to the laptop) |
| `report-card-day` | 14 s | Results slip (with a close-up of the marks), the "No. 1 Dalam Kelas" plaque and the Anugerah Kecemerlangan Akademik trophy, then "Moments like this start at home." |
| `quick-cut` | 10 s | Seven photos cut on the beat: Live classes / 1 to 1 / From home / While dinner cooks / Report card day / No. 1 Dalam Kelas / Anugerah Kecemerlangan |

All three end on a simple indigo card: the SEKOOL logo, a headline, the "Get a FREE Learning Roadmap" button, then "Click link down below" with a bouncing arrow pointing at the ad's own link button. The captions stay between y = 260 and y = 1250, so the Reels and Stories interface doesn't cover them.

## Photos stay out of git

This repository is public and the photos show real children, so the photos and the rendered videos are git-ignored (`photos/`, `output/`, `build/`). Only the code is committed. Keep the originals somewhere private, such as Google Drive.

`prepare_photos.py` blurs the school names and crests on the results slip, the plaque and the awards-day photo (stage banner, trophy and uniform badge), and the child's full name on the plaque. The slip already had the name and IC number blurred. If you add new photos, check them for names, IC numbers and school names, and add boxes to `REDACT`.

## Before running `report-card-day` or the last three shots of `quick-cut`

These show real results. Run them only if the children are SEKOOL students, the results are genuine, and you have the parents' written consent to use the photos in ads.

## Commands

```bash
npm install
pip install numpy scipy imageio-ffmpeg pillow
python3 prepare_photos.py /path/to/originals   # expects 1.webp ... 7.webp
npm run render                                 # all ads -> output/<ad>.mp4 (about 90 s in total)
node render/render.mjs --ad quick-cut          # one ad
node render/render.mjs --ad quick-cut --stills 0.5,6   # PNG stills -> build/stills/
npm run preview                                # then open http://localhost:8081/src/index.html?ad=quick-cut
```

If Playwright's own Chromium isn't installed, point it at an existing one with `CHROMIUM=/path/to/chrome`.

The soundtrack is made by the explainer's synthesiser (`../sekool-explainer/audio/generate_audio.py`): the same 120 BPM groove with sound effects placed on each cut and caption. It's royalty-free and normalised to -14 LUFS, the usual level for social video.

## Editing

| Change | Where |
|--------|-------|
| Captions, timings, photo order, CTA text | `src/ads.js`, one block per ad |
| A new ad | Add an entry to `window.ADS` in `src/ads.js` |
| Colours, fonts, caption style | `src/styles.css` |
| Transitions and sound-effect placement | `src/main.js` |
