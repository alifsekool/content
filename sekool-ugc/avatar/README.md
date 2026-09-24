# Avatar clip

Put the talking-head clip here as `avatar.mp4`. `.mov` and `.webm` also work. Then run `npm run render`, which writes `output/sekool-ugc.mp4`.

If there's no clip here, the render uses the illustrated placeholder teacher and writes `output/sekool-ugc-draft.mp4` instead.

## Making the clip (HeyGen, Arcads, Captions, CapCut AI avatar, or a real person)

| Setting | Value |
|---------|-------|
| Avatar | Young Malay man, early to mid 20s, a teacher look: plain light-blue or white collared shirt, neat short hair, friendly, confident, talking to the camera |
| Background | **Solid green, #00B140** (or any flat colour; the renderer samples the top-left corner to pick the key colour) |
| Framing | 9:16 portrait, 1080×1920, head and shoulders to mid-chest, head in the upper third, nothing touching the top-left corner |
| Voice | Malay male, casual Malaysian "rojak" delivery (Malay with English words), energetic but natural |
| Pauses | A short pause (about 0.3 to 0.5 s) at each line break below. The renderer uses these pauses to time the scenes and captions. |

A 16:9 clip also works: its centre 9:16 strip is used.

### Script (one line per beat, pause between lines)

```
Kalau anak Darjah 2 hingga 6 lemah dalam Matematik,
Kami akan diagnose kelemahan pelajar dan susun cara pembelajaran yang sesuai
sebagai Personal Teacher dari Sekolah Kebangsaan untuk bantu mereka skor A.
Tahun lepas, lebih dari 5 students kami naik pentas di Majlis Anugerah Sekolah.
Jadi, untuk elakkan anak anda gagal atau dimasukkan ke kelas pemulihan,
Kami akan bantu pelajar dengan SEKOOL Class, iaitu 1 to 1 Online Class bersama Personal Teacher,
bermula dengan Ujian Roadmap & Trial Class.
Kami juga hanya accept 6 new students per week kerana cikgu yang tak ramai.
We only accept Cikgu Sekolah Kebangsaan as our Personal Teacher, that's why.
So, click link di bawah dan isi details anda untuk join Free 1 to 1 Trial Class.
```

Line 1 says "2 hingga 6" so text-to-speech doesn't read "2 - 6" as "two minus six". The captions still show "Darjah 2–6".

## Timing

The renderer finds the pauses in the voice and starts each scene on the matching line, then writes what it chose to `build/timing.json`. If a scene lands on the wrong line (for example because the avatar paused in the middle of a sentence), copy that file here as `avatar/timing.json`, fix the numbers and render again. Times in this file win over the auto-timing:

```json
{ "beats": [0.4, 3.5, 7.7, 11.6, 16.0, 20.0, 25.0, 27.6, 31.8, 35.4], "end": 39.0 }
```

`beats` holds the second each of the 10 lines starts, and `end` is when the voice stops. Captions inside a line are spread across it by syllable count.

## Placement and keying (optional `avatar/config.json`)

```json
{ "scale": 0.62, "x": 0, "y": 260, "key": "auto", "similarity": 0.13, "blend": 0.06, "despill": "green", "music": 0.18 }
```

| Key | Meaning |
|-----|---------|
| `scale` | Avatar width as a fraction of the 1080 px frame |
| `x`, `y` | Offset in px. `y` pushes the avatar down from the bottom edge; the bottom ~300 px sits under the Reels UI anyway. |
| `key` | `"auto"`, a colour such as `"0x00b140"`, or `"none"` for a clip that already has a transparent background (.mov/.webm with alpha) |
| `similarity`, `blend` | ffmpeg `chromakey` settings. Raise `similarity` if green fringes remain, lower it if parts of the shirt disappear. |
| `despill` | `"green"` or `"blue"`, matching the screen colour |
| `music` | Music bed volume under the voice |
