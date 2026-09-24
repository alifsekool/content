# SEKOOL.my: Explainer Storyboard (v9: polish pass)

**Format:** 1920×1080, **60 fps**, 48 s · **Language:** English · **Audience:** parents
**Look:** Apple-keynote style: big semibold type, black / white / indigo scenes, floating device mockups, soft blur-and-slide transitions. A slow, subtle camera push-in on every scene is applied after capture with sub-pixel interpolation, because in-browser drift snaps to pixels and shakes. Scenes cross-fade with no hard cuts, and entrances use short travel with soft ease-outs. No cartoon characters.
**Audio:** music + sound effects, no voiceover. A warm electric-piano house groove (Fmaj7 · Am7 · Dm9 · Bbmaj7, 120 BPM) with deep sub-bass, and cinematic sub booms, air whooshes and soft glass tones.
**Core messages:** speed (**stop being average in 1 month**, stated 4 times) and trust (**Cikgu Sekolah Kebangsaan**, stated 4 times).
**CTA:** Free Personalized Learning Roadmap at sekool.my (plain white in the CTA; red FREE tags stay on the roadmap scene and the recap tile).

| # | Time | Scene | On-screen text | Visuals |
|---|------|-------|----------------|---------|
| 1 | 0:00–0:02 | **Hook** (black) | "Struggling" → "to score in" → "**UASA & MPT4?**" | Fast kinetic type with a sub boom on each phrase |
| 2 | 0:02–0:07 | **Problem as an equation** (black) | **Big Tuition Classes** + **Same Pace for Everyone** = **Your Child Stays** **Average.** | Three cards: a packed grid of students **+** students moving in lockstep **=** a bell curve where "Your child · Stuck" is a **red** warning dot at *Average* (the card glows red). A dark, sinking "stuck" sting plays as the dot lands, with the music dipping under it. The first two terms then fade away while the result card glides to the centre and grows. The camera dives into the red dot, which blooms smoothly from red into SEKOOL indigo: problem → solution. |
| 3 | 0:07–0:11 | **Brand** (indigo) | **SEKOOL** · "**Personalized 1 to 1 Online Learning** with **Cikgu Sekolah Kebangsaan**" | The sk mark resolves from a blur and turns into the SEKOOL wordmark (never side by side), and the music drops. "Cikgu Sekolah Kebangsaan" lights up into a white highlight with its own sound (an airy swell into a soft glass chord). |
| 4 | 0:11–0:15 | **Speed** | "Stop Being Average. **In Just 1 Month.**" | A Week 1 → Week 4 bar fills from *Average* to *Excellent* while the counter runs from Day 1 to Day 30 |
| 5 | 0:15–0:20 | **Live 1 to 1 Classes** | "One Cikgu. One Child." · "Every class is taught live by an experienced **Cikgu Sekolah Kebangsaan**." · "No part-timers. No university students." | Laptop with a live class. A "✓ Cikgu Sekolah Kebangsaan" badge sits on the teacher tile and a fractions problem is solved (no subject chips, no blinking UI) |
| 6 | 0:20–0:26 | **Learning Roadmap** · FREE | "Your Child's Own Roadmap." | iPad scrolling the **real Stage 2 roadmap PDF**, with one quiet grey caption under it that follows the pages |
| 7 | 0:26–0:32 | **Monthly Test** | "Tested. Every Month." | Answer picked and marked correct, then an 85% ring, TP4 and the topic breakdown |
| 8 | 0:32–0:37 | **Progress Reports** | "Never Miss a Milestone." | Phone notification opens the March report: TP5 (+1 level), subject rings, Cikgu's note |
| 9 | 0:37–0:41 | **Recap** | "From Average to Excellent. **In Just 1 Month.**" | Bento grid; the first tile reads "1 to 1 Live Classes · With Cikgu Sekolah Kebangsaan" |
| 10 | 0:41–0:48 | **CTA** (black) | "Free Personalized Learning Roadmap." · "Get it free at **sekool.my**" | Plain white headline, a sheen across the button, the SEKOOL wordmark only (no sk mark); the music ends on an Fmaj9 chord |

The hook is fast. From the problem scene onward the pacing is about 20% more relaxed than v3, and each feature still cuts about 1 second after its demo finishes.

## Motion & layout system (polish pass)

- **Three motion primitives:** headlines slide up behind a mask; supporting content fades in with a small rise (no blur); scenes lift out. Blur is used only for hero moments (hook words, the sk → SEKOOL morph). The dive is the one signature transition. After the logo, indigo dissolves to white; after the recap, the video cuts to black on the beat.
- **Type scale:** 200 (hook) / 128 (speed, CTA) / 100 (feature + recap headlines) / 48 (tagline) / 40 (equation captions, tile titles) / 32 (body) / 24 (labels). Body copy breaks by hand into 2 balanced lines, and "Cikgu Sekolah Kebangsaan" never splits.
- **Device frame:** every device is centred at x≈1390, at least 180 px from the text column, and at least 110 px from the frame edge. Devices are solid within 0.35 s, rise 40 px, and keep a fixed 3D angle (no swing). The headline leads; the device follows 0.25 s later.
- **Sound:** scene whooshes, the "stuck" sting, the brand hit and the CTA hit, plus **demo sounds only where something happens**: soft glassy ticks that follow the Day 1→30 and 0→85% counters (rising in pitch), a soft tap when an answer or notification is pressed, a two-note success chime for each correct answer (a fourth higher for the TP4→TP5 level-up), and a soft page flick on the roadmap. Each sits about 6–18 dB above the music in its frequency band.

## 9:16 vertical cut (Reels)

`output/sekool-explainer-vertical.mp4` is 1080×1920 at 60 fps and 48 s. It uses the same timeline, music and sound effects, re-laid out (the `body.vertical` rules in `styles.css`):
- The equation stacks top to bottom, then the result card glides to the centre at 1.8×.
- Feature scenes put the text on top and the device below, both centred.
- The recap is a single column of tiles, and the CTA is stacked and centred.
- Key content stays inside the Reels safe area (below ~250 px from the top, above ~380 px from the bottom).

## Notes

- **Real material:** the Learning Roadmap scene uses actual pages from `STAGE 2 Learning Roadmap.pdf`. The logos are vector traces of the official files.
- **Monthly Test and Progress Report screens are mock-ups** in SEKOOL styling, because app.sekool.my isn't reachable from the build environment. Share screenshots, or allow network access to `app.sekool.my`, and these scenes can show the real app instead.
- **Example data:** Adam, Cikgu Aina, the scores and TP levels are illustrative.
- **"1 month" claim:** this is SEKOOL's promise as briefed. Make sure it can be backed up (for example with typical results) before running it as a paid ad.
