#!/usr/bin/env node
// Renders the SEKOOL green-screen UGC reel (1080x1920, 30 fps).
//
//   node render/render.mjs                  full render -> output/
//   node render/render.mjs --stills 2,9,20  PNG stills at those seconds -> build/stills/
//   node render/render.mjs --workers 3      parallel browser pages (default 3)
//
// Two modes, picked automatically:
//   * avatar/avatar.mp4 (or .mov / .webm) exists: the talking-head clip, shot or generated
//     on a green screen, is chroma-keyed over the scenes, its voice is the soundtrack
//     (with a quiet music bed), and every beat is re-timed to the pauses in its audio.
//     Pin the beat times by hand in avatar/timing.json if the auto timing is off.
//     -> output/sekool-ugc.mp4
//   * no clip: the illustrated placeholder avatar is rendered in the page, timed to the
//     default beats in src/script.js, with music + SFX only.
//     -> output/sekool-ugc-draft.mp4
import { chromium } from 'playwright';
import { spawn, execFileSync, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'output');
const AVATAR_DIR = path.join(ROOT, 'avatar');
const AUDIO_GEN = path.resolve(ROOT, '../sekool-explainer/audio/generate_audio.py');
fs.mkdirSync(BUILD, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const STILLS = opt('stills', null);
const WORKERS = +opt('workers', 3);
const FFMPEG = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();

const run = (cmd, a) => new Promise((res, rej) => {
  const p = spawn(cmd, a, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
});
const ffStderr = (a) => spawnSync(FFMPEG, ['-hide_banner', ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }).stderr;

// ------------------------------------------------------------------ avatar clip
const clip = ['avatar.mp4', 'avatar.mov', 'avatar.webm'].map((f) => path.join(AVATAR_DIR, f)).find((f) => fs.existsSync(f));
const readJSON = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});
const cfg = { scale: 0.62, x: 0, y: 260, key: 'auto', similarity: 0.13, blend: 0.06, despill: 'green', music: 0.18, ...readJSON(path.join(AVATAR_DIR, 'config.json')) };
const SCRIPT = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'src/script.js'), 'utf8');
  const window = {};
  new Function('window', src)(window);
  return window.SCRIPT;
})();

function probe(file) {
  const e = ffStderr(['-i', file]);
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(e);
  const vid = /Stream #.*Video: .*?, (\d{2,5})x(\d{2,5})/.exec(e);
  return { duration: dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0, w: vid ? +vid[1] : 0, h: vid ? +vid[2] : 0, audio: /Stream #.*Audio:/.test(e) };
}

// Beat starts from the pauses in the voice: map the default beat times onto the speech
// span, then snap each boundary to the nearest real pause (within 1.5 s).
function autoTiming(file, duration) {
  const e = ffStderr(['-i', file, '-vn', '-af', 'silencedetect=noise=-35dB:d=0.18', '-f', 'null', '-']);
  const starts = [...e.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...e.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const gaps = starts.map((s, i) => ({ s, e: ends[i] ?? duration }));
  let speechStart = 0, speechEnd = duration;
  if (gaps.length && gaps[0].s < 0.05) speechStart = gaps.shift().e;
  if (gaps.length && gaps[gaps.length - 1].e >= duration - 0.05) speechEnd = gaps.pop().s;
  const def = SCRIPT.beats.map((b) => b.t);
  const scale = (t) => speechStart + ((t - def[0]) / (SCRIPT.end - def[0])) * (speechEnd - speechStart);
  const beats = [+Math.max(0, speechStart - 0.05).toFixed(2)];
  let used = -1;
  for (let i = 1; i < def.length; i++) {
    const want = scale(def[i]);
    let best = -1;
    gaps.forEach((g, j) => { if (j > used && Math.abs(g.e - want) < 1.5 && (best < 0 || Math.abs(g.e - want) < Math.abs(gaps[best].e - want))) best = j; });
    if (best >= 0) { used = best; beats.push(+(gaps[best].e - 0.05).toFixed(2)); } else beats.push(+want.toFixed(2));
  }
  return { beats, end: +speechEnd.toFixed(2) };
}

function keyColour(file) {
  if (cfg.key !== 'auto') return cfg.key;
  // average of a 24x24 patch in the top-left corner, 0.5 s in
  const r = spawnSync(FFMPEG, ['-loglevel', 'error', '-ss', '0.5', '-i', file, '-frames:v', '1', '-vf', 'crop=24:24:4:4,scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 });
  const [R, G, B] = r.stdout;
  return `0x${[R, G, B].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

let query = 'render';
let clipInfo = null;
if (clip) {
  clipInfo = probe(clip);
  const pinned = readJSON(path.join(AVATAR_DIR, 'timing.json'));
  const timing = pinned.beats ? pinned : autoTiming(clip, clipInfo.duration);
  if (timing.beats.length !== SCRIPT.beats.length) throw new Error(`timing has ${timing.beats.length} beats, script has ${SCRIPT.beats.length}`);
  fs.writeFileSync(path.join(BUILD, 'timing.json'), JSON.stringify(timing, null, 2));
  console.log(`avatar: ${path.relative(ROOT, clip)} (${clipInfo.w}x${clipInfo.h}, ${clipInfo.duration.toFixed(2)}s)`);
  console.log(`beats: ${timing.beats.join(', ')}  voice ends ${timing.end}${pinned.beats ? '  (from avatar/timing.json)' : '  (auto, see build/timing.json)'}`);
  query += `&noavatar&beats=${timing.beats.join(',')}&end=${timing.end}`;
}

// ------------------------------------------------------------------ page capture
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/src/index.html?${query}`;

// CHROMIUM=/path/to/chrome uses a specific browser build (e.g. one preinstalled for another Playwright version)
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && console.error('console:', m.text()));
  await page.goto(URL_);
  await page.evaluate(() => window.SEKOOL.ready);
  return page;
}
const snap = async (page, t, type = 'png') => {
  await page.evaluate((t) => window.SEKOOL.seek(t), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 94 } : {}), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
};

try {
  const first = await openPage();
  const { duration, fps, cues, music } = await first.evaluate(() => ({
    duration: window.SEKOOL.duration, fps: window.SEKOOL.fps, cues: window.SEKOOL.cues, music: window.SEKOOL.music,
  }));

  if (STILLS) {
    const dir = path.join(BUILD, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const s of STILLS.split(',').map(Number)) {
      const f = path.join(dir, `t${s.toFixed(2).padStart(6, '0')}.png`);
      fs.writeFileSync(f, await snap(first, s));
      console.log('still', path.relative(ROOT, f));
    }
    process.exit(0);
  }

  // 1) music + SFX (synthesised; see ../sekool-explainer/audio/generate_audio.py)
  fs.writeFileSync(path.join(BUILD, 'cues.json'), JSON.stringify({ duration, music, cues }, null, 2));
  await run('python3', [AUDIO_GEN, path.join(BUILD, 'cues.json'), path.join(BUILD, 'soundtrack.wav')]);

  // 2) scene frames, in parallel segments
  const total = Math.round(duration * fps);
  const per = Math.ceil(total / WORKERS);
  const started = Date.now();
  let done = 0;
  const pages = [first, ...(await Promise.all(Array.from({ length: WORKERS - 1 }, openPage)))];
  const segs = await Promise.all(pages.map(async (page, w) => {
    const a = w * per, b = Math.min(total, a + per);
    const file = path.join(BUILD, `seg${w}.mp4`);
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg segment failed')))));
    await page.evaluate(() => window.SEKOOL.seek(0));
    for (let f = a; f < b; f++) {
      const buf = await snap(page, f / fps, 'jpeg');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (++done % 150 === 0) console.log(`frames ${done}/${total}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await closed;
    return file;
  }));
  const list = path.join(BUILD, 'segments.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const scenes = path.join(BUILD, 'scenes.mp4');
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', scenes]);

  // 3) final mux
  const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', String(duration), '-movflags', '+faststart'];
  if (!clip) {
    const out = path.join(OUT, 'sekool-ugc-draft.mp4');
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', scenes, '-i', path.join(BUILD, 'soundtrack.wav'), '-map', '0:v', '-map', '1:a',
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', ...enc, out]);
    console.log(`done: ${path.relative(ROOT, out)}  (placeholder avatar, ${((Date.now() - started) / 1000).toFixed(0)}s)`);
  } else {
    const key = keyColour(clip);
    const portrait = clipInfo.w / clipInfo.h <= 0.6;
    const crop = portrait ? '' : 'crop=ih*9/16:ih,';
    const W = Math.round(1080 * cfg.scale / 2) * 2;
    const keyer = cfg.key === 'none' ? '' : `chromakey=${key}:${cfg.similarity}:${cfg.blend},despill=type=${cfg.despill},`;
    const fc = [
      `[1:v]${crop}scale=${W}:-2,format=yuva420p,${keyer}format=yuva420p[fg]`,
      `[0:v][fg]overlay=x=(W-w)/2+${cfg.x}:y=H-h+${cfg.y}:eof_action=pass:format=auto[v]`,
      `[1:a]aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,apad[voice]`,
      `[2:a]volume=${cfg.music}[bed]`,
      `[voice][bed]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    ].join(';');
    const out = path.join(OUT, 'sekool-ugc.mp4');
    console.log(`keying ${key}, avatar width ${W}px`);
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', scenes, '-i', clip, '-i', path.join(BUILD, 'soundtrack.wav'),
      '-filter_complex', fc, '-map', '[v]', '-map', '[a]', ...enc, out]);
    console.log(`done: ${path.relative(ROOT, out)}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
} finally {
  await browser.close();
  server.close();
}
