#!/usr/bin/env node
// Saves every static image ad in src/statics.js to output/statics/<name>.png (1080x1350)
//
//   node render/statics.mjs              all
//   node render/statics.mjs naik-pentas  one
//
// CHROMIUM=/path/to/chrome uses an existing browser instead of Playwright's own download.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output', 'statics');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/src/statics.html`;

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(base);
  const names = process.argv[2] ? [process.argv[2]] : await page.evaluate(() => Object.keys(window.STATICS));
  for (const name of names) {
    await page.goto(`${base}?ad=${name}`);
    await page.evaluate(() => window.READY);
    const file = path.join(OUT, `${name}.png`);
    await page.locator('.ad').screenshot({ path: file });
    console.log('image', file);
  }
} finally {
  await browser.close();
  server.close();
}
