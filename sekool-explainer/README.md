# SEKOOL.my Explainer Video

A 42-second, 1080p / 60 fps premium motion-graphics explainer for **SEKOOL.my** (1-to-1 online classes for primary school, KSSR/KSSM, UASA & MPT4 prep), aimed at parents.

- **Final video:** [`output/sekool-explainer.mp4`](output/sekool-explainer.mp4)
- **Script and scene breakdown:** [`STORYBOARD.md`](STORYBOARD.md)

Everything is code: the animation is an HTML page driven by a GSAP timeline, rendered frame by frame in headless Chromium. The music and sound effects are synthesised in Python, so there are no stock assets and no licensing to worry about.

## Project layout

```
src/
  index.html        scene markup (all on-screen copy lives here)
  styles.css        layout + SEKOOL brand tokens
  main.js           the timeline: every animation and every sound-effect cue
  assets/           official logos (vector traces + source bitmaps), real Learning Roadmap pages
audio/
  generate_audio.py music bed + SFX synthesiser (reads cues exported by the page)
render/
  render.mjs        Chromium frame capture -> ffmpeg -> output/sekool-explainer.mp4
output/             rendered video
```

## Requirements

- Node 18+ and Python 3.10+
- `npm install`: GSAP, Poppins (via @fontsource) and Playwright
- `pip install numpy scipy imageio-ffmpeg`, where imageio-ffmpeg provides a static ffmpeg binary. To use your own, set `FFMPEG=/path/to/ffmpeg`.
- Playwright Chromium, installed with `npx playwright install chromium` if it isn't already present

## Commands

```bash
npm run render                 # full render -> output/sekool-explainer.mp4 (about 4 min on 4 cores)
npm run stills -- 3,16,36      # PNG stills at those seconds -> build/stills/
node render/render.mjs --audio-only   # regenerate build/soundtrack.wav only
npm run preview                # then open http://localhost:8080/src/index.html
```

The preview page has play/pause (space bar) and a scrubber. It plays `build/soundtrack.wav` in sync once that file has been generated. Add `?t=36` to the URL to jump to a given second.

## Common edits

| Change | Where |
|--------|-------|
| Any on-screen text (e.g. "Year 1 – Year 6") | `src/index.html` |
| Colours / fonts / layout | `src/styles.css` (brand tokens at the top) |
| Timing of an animation or a sound effect | `src/main.js`, where each scene has its own block with absolute times in seconds |
| Logo | Replace `src/assets/logo-mark.svg` / `logo-wordmark.svg`, keeping `fill="currentColor"` |
| Music tempo, chords, melody, mix levels | `audio/generate_audio.py` |

After editing, run `npm run render` again. Audio cues are re-exported from the timeline on every render, so sound stays in sync with the visuals automatically.
