#!/usr/bin/env node
// Renders the ads in src/ads.js to output/<ad>.mp4 (1080x1920, 30 fps, AAC audio)
//
//   node render/render.mjs                          every ad
//   node render/render.mjs --ad quick-cut           one ad
//   node render/render.mjs --ad quick-cut --stills 0.5,5.5   PNG stills -> build/stills/
//
// Pipeline: static server -> Chromium (Playwright) seeks the GSAP timeline frame by
// frame -> JPEGs piped into ffmpeg -> mux the soundtrack made by the explainer's
// synthesiser (../sekool-explainer/audio/generate_audio.py) from the page's SFX cues.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'output');
const AUDIO = path.join(ROOT, '..', 'sekool-explainer', 'audio', 'generate_audio.py');
const W = 1080, H = 1920;
fs.mkdirSync(BUILD, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const STILLS = opt('stills', null);
const FFMPEG = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();

if (!fs.existsSync(path.join(ROOT, 'photos', '1.jpg'))) {
  console.error('photos/ is empty: run  python3 prepare_photos.py /path/to/originals  first');
  process.exit(1);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/src/index.html`;

const run = (cmd, a) => new Promise((res, rej) => {
  const p = spawn(cmd, a, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
});

// CHROMIUM=/path/to/chrome uses an existing browser instead of Playwright's own download
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
try {
  const names = opt('ad', null) ? [opt('ad')] : await (async () => {
    const p = await browser.newPage();
    await p.goto(`${base}?render`);
    const n = await p.evaluate(() => Object.keys(window.ADS));
    await p.close();
    return n;
  })();

  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('page error:', e.message));
    await page.goto(`${base}?render&ad=${name}`);
    await page.evaluate(() => window.SEKOOL.ready);
    const { duration, fps, cues, music } = await page.evaluate(() => ({
      duration: window.SEKOOL.duration, fps: window.SEKOOL.fps, cues: window.SEKOOL.cues, music: window.SEKOOL.music,
    }));
    const snap = async (t, type) => {
      await page.evaluate((t) => window.SEKOOL.seek(t), t);
      return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 95 } : {}), clip: { x: 0, y: 0, width: W, height: H } });
    };

    if (STILLS) {
      const dir = path.join(BUILD, 'stills');
      fs.mkdirSync(dir, { recursive: true });
      for (const s of STILLS.split(',').map(Number)) {
        const f = path.join(dir, `${name}-t${s.toFixed(2)}.png`);
        fs.writeFileSync(f, await snap(s, 'png'));
        console.log('still', f);
      }
      await page.close();
      continue;
    }

    // 1) soundtrack
    const cueFile = path.join(BUILD, `${name}.cues.json`), wav = path.join(BUILD, `${name}.wav`);
    fs.writeFileSync(cueFile, JSON.stringify({ duration, music, cues }, null, 2));
    await run('python3', [AUDIO, cueFile, wav]);

    // 2) frames -> video
    const started = Date.now();
    const silent = path.join(BUILD, `${name}.silent.mp4`);
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), silent],
    { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg failed')))));
    const total = Math.round(duration * fps);
    for (let f = 0; f < total; f++) {
      const buf = await snap(f / fps, 'jpeg');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await closed;

    // 3) mux + loudness normalise to social-video level
    const out = path.join(OUT, `${name}.mp4`);
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-t', String(duration), '-movflags', '+faststart', out]);
    console.log(`done: ${out}  (${total} frames, ${((Date.now() - started) / 1000).toFixed(0)}s)`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
