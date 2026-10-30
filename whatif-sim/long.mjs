#!/usr/bin/env node
// Langfassung: Kapitel einzeln rendern, Ton mischen, zusammensetzen.
//   node long.mjs scenes/blackout-long.js cues    -> Sound-Cues aller Kapitel einsammeln
//   node long.mjs scenes/blackout-long.js join    -> out/long/*.mp4 + Ton -> out/blackout-long.mp4
//   node long.mjs scenes/blackout-long.js texts   -> Kapitelmarken und Untertitel (.srt)
import { writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { serve } from './render.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const [scene, cmd] = process.argv.slice(2);
const name = basename(scene).replace(/\.m?js$/, '');
const mod = await import(pathToFileURL(resolve(scene)).href);
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const srtTime = (s) => new Date(s * 1000).toISOString().slice(11, 23).replace('.', ',');

if (cmd === 'cues') {
  const server = await serve(ROOT);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const all = [];
  for (const c of mod.chapters) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[browser]', e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/runtime/index.html?scene=/scenes/${name}/${c.id}.js&scale=0.1&quality=draft`);
    await page.waitForFunction(() => window.__simReady || window.__simError, null, { timeout: 120000 });
    const error = await page.evaluate(() => window.__simError);
    if (error) throw new Error(error);
    const { cues } = await page.evaluate(() => window.__sim.simulate());
    console.log(`${c.id}: ${cues.length} Cues`);
    all.push(...cues.map((q) => ({ ...q, t: +(q.t + Math.round(c.start * 30) / 30).toFixed(3) })));
    await page.close();
  }
  await browser.close();
  server.close();
  await writeFile(join(ROOT, 'scenes', `${name}.cues.js`), `// Erzeugt von long.mjs cues, nicht von Hand aendern.\nexport default ${JSON.stringify(all)};\n`);
}

if (cmd === 'texts') {
  const marks = mod.chapters.map((c, i) => `${stamp(i === 0 ? 0 : c.start)} ${c.title}`).join('\n');
  await writeFile(join(ROOT, 'out', `${name}-kapitel.txt`), marks + '\n');
  const srt = mod.chunks.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.words.map((w) => w.w).join(' ')}\n`).join('\n');
  await writeFile(join(ROOT, 'out', `${name}.srt`), srt);
  await writeFile(join(ROOT, 'out', `${name}-quellen.txt`), mod.SOURCES.map((x, i) => `Q${i + 1} ${x}`).join('\n') + '\n');
  console.log(marks);
}

if (cmd === 'join') {
  const parts = mod.chapters.map((c) => join(ROOT, 'out', 'long', `${c.id}.mp4`));
  await Promise.all(parts.map((p) => access(p)));
  const list = join(ROOT, 'out', 'long', 'list.txt');
  await writeFile(list, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  const out = join(ROOT, 'out', `${name}.mp4`);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', join(ROOT, 'out', `${name}.m4a`), '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
  console.log(`Fertig: ${out}`);
}
