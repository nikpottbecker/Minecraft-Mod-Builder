#!/usr/bin/env node
// Rendert eine Szene Frame fuer Frame im Headless-Browser und kodiert sie mit ffmpeg.
//
//   node render.mjs scenes/schwerkraft.js                 -> out/schwerkraft.mp4 (1080x1920)
//   node render.mjs scenes/schwerkraft.js --preview       -> halbe Aufloesung, 15 fps, schnell
//   node render.mjs scenes/schwerkraft.js --check         -> 12 Standbilder + Kontaktbogen zum Pruefen
//   node render.mjs scenes/schwerkraft.js --audio musik.mp3
//   node render.mjs scenes/schwerkraft.js --gpu           -> echte Grafikkarte statt Software-Rendering

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, resolve, relative, basename, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

export function parseArgs(argv) {
  const opts = { scene: null, out: null, scale: 1, fps: null, check: false, checkCount: 12, preview: false, draft: false, audio: null, gpu: false, from: 0, to: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--out') opts.out = next();
    else if (a === '--scale') opts.scale = Number(next());
    else if (a === '--fps') opts.fps = Number(next());
    else if (a === '--check') opts.check = true;
    else if (a === '--count') opts.checkCount = Number(next());
    else if (a === '--preview') opts.preview = true;
    else if (a === '--draft') opts.draft = true;
    else if (a === '--audio') opts.audio = next();
    else if (a === '--gpu') opts.gpu = true;
    else if (a === '--from') opts.from = Number(next());
    else if (a === '--to') opts.to = Number(next());
    else if (!a.startsWith('--') && !opts.scene) opts.scene = a;
    else throw new Error(`Unbekannte Option: ${a}`);
  }
  if (!opts.scene) throw new Error('Szene fehlt, z. B.: node render.mjs scenes/schwerkraft.js');
  if (opts.preview) {
    opts.scale = Math.min(opts.scale, 0.5);
    opts.fps ??= 15;
    opts.draft = true;
  }
  return opts;
}

// Welche Frames werden gerendert? Bei --fps kleiner als die Szenen-fps werden Frames ausgelassen.
export function frameList({ totalFrames, sceneFps, fps, from = 0, to = null, check = false, checkCount = 12 }) {
  const last = to == null ? totalFrames - 1 : Math.min(totalFrames - 1, Math.round(to * sceneFps));
  const first = Math.max(0, Math.round(from * sceneFps));
  if (check) {
    const n = Math.max(1, checkCount);
    return [...new Set(Array.from({ length: n }, (_, k) => Math.round(first + ((last - first) * k) / Math.max(1, n - 1))))];
  }
  const stride = fps && fps < sceneFps ? sceneFps / fps : 1;
  const frames = [];
  for (let f = first; f <= last + 1e-9; f += stride) frames.push(Math.round(f));
  return frames;
}

function serve(root) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = resolve(root, '.' + path);
    if (relative(root, file).startsWith('..')) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found: ' + path);
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

function run(cmd, args, { input } = {}) {
  const child = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => {
    child.on('error', fail);
    child.on('close', (code) => (code === 0 ? ok() : fail(new Error(`${cmd} beendet mit Code ${code}`))));
  });
  return { child, done };
}

const write = (stream, buf) => new Promise((ok) => (stream.write(buf) ? ok() : stream.once('drain', ok)));

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sceneRel = relative(ROOT, resolve(opts.scene)).split('\\').join('/');
  const name = basename(opts.scene).replace(/\.m?js$/, '');

  // Story-Check vorab (blockiert nicht, zeigt aber, was an der Geschichte fehlt)
  const { lintStory, formatReport } = await import('./lint-story.mjs');
  const def = (await import(pathToFileURL(resolve(opts.scene)).href)).default;
  console.log('Story-Check:\n' + formatReport(lintStory(def)));

  const server = await serve(ROOT);
  const port = server.address().port;
  const args = opts.gpu
    ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({ args, headless: true });
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[browser]', m.text()); });
  page.on('pageerror', (e) => console.error('[browser]', e.message));

  try {
    await page.goto(`http://127.0.0.1:${port}/runtime/index.html?scene=/${sceneRel}&scale=${opts.scale}&quality=${opts.draft ? 'draft' : 'final'}`);
    await page.waitForFunction(() => window.__simReady || window.__simError, null, { timeout: 120000 });
    const error = await page.evaluate(() => window.__simError);
    if (error) throw new Error('Szene konnte nicht geladen werden:\n' + error);
    const meta = await page.evaluate(() => window.__sim.meta);
    const frames = frameList({ totalFrames: meta.totalFrames, sceneFps: meta.fps, fps: opts.fps, from: opts.from, to: opts.to, check: opts.check, checkCount: opts.checkCount });
    console.log(`Szene: ${meta.title}`);
    console.log(`${meta.width}x${meta.height}, ${frames.length} Frames${opts.check ? ' (Pruefmodus)' : ''}`);

    if (opts.check) {
      const dir = join(ROOT, 'out', 'check', name);
      await rm(dir, { recursive: true, force: true });
      await mkdir(dir, { recursive: true });
      for (const f of frames) {
        const data = await page.evaluate((i) => window.__sim.frame(i, 'image/png'), f);
        const file = join(dir, `frame-${String(f).padStart(5, '0')}.png`);
        await writeFile(file, Buffer.from(data.split(',')[1], 'base64'));
        console.log(`  t=${(f / meta.fps).toFixed(2)}s -> ${relative(process.cwd(), file)}`);
      }
      const cols = Math.min(4, frames.length);
      const sheet = join(dir, 'kontaktbogen.jpg');
      await run('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(dir, 'frame-*.png'),
        '-vf', `scale=360:-1,tile=${cols}x${Math.ceil(frames.length / cols)}:padding=6:color=white`, '-frames:v', '1', sheet]).done;
      console.log(`Kontaktbogen: ${relative(process.cwd(), sheet)}`);
      return;
    }

    const outFps = opts.fps && opts.fps < meta.fps ? opts.fps : meta.fps;
    const out = resolve(opts.out || join(ROOT, 'out', `${name}${opts.preview ? '-preview' : ''}.mp4`));
    await mkdir(dirname(out), { recursive: true });
    const ff = ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(outFps), '-c:v', 'mjpeg', '-i', '-'];
    if (opts.audio) ff.push('-i', resolve(opts.audio), '-c:a', 'aac', '-b:a', '192k', '-shortest');
    ff.push('-c:v', 'libx264', '-preset', opts.preview ? 'veryfast' : 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
    const { child, done } = run('ffmpeg', ff, { input: true });

    const start = Date.now();
    for (let k = 0; k < frames.length; k++) {
      const data = await page.evaluate((i) => window.__sim.frame(i, 'image/jpeg', 0.93), frames[k]);
      await write(child.stdin, Buffer.from(data.split(',')[1], 'base64'));
      if (k % 10 === 0 || k === frames.length - 1) {
        const elapsed = (Date.now() - start) / 1000;
        const eta = (elapsed / (k + 1)) * (frames.length - k - 1);
        process.stdout.write(`\r  ${k + 1}/${frames.length} Frames  ${fmtTime(elapsed)}  (noch ~${fmtTime(eta)})   `);
      }
    }
    child.stdin.end();
    await done;
    console.log(`\nFertig: ${relative(process.cwd(), out)}`);
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
