#!/usr/bin/env node
// Caption + Cover: node caption.mjs scenes/blackout.js -> out/<name>-caption.txt, out/<name>-cover.jpg

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Format aus KANAL.md: "Part N | Szenario… Emojis Frage? #hashtags"
export function buildCaption({ series, caption }) {
  return `Part ${series.part} | ${caption.scenario}… ${caption.emoji} ${caption.question} ${caption.tags.map((t) => '#' + t).join(' ')}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] || '');
  const def = (await import(pathToFileURL(file).href)).default;
  const name = basename(file).replace(/\.m?js$/, '');
  await mkdir(join(ROOT, 'out'), { recursive: true });
  const text = buildCaption(def);
  await writeFile(join(ROOT, 'out', `${name}-caption.txt`), text + '\n');
  console.log(text);
  const video = join(ROOT, 'out', `${name}.mp4`);
  if (await access(video).then(() => true, () => false)) {
    await promisify(execFile)('ffmpeg', ['-v', 'error', '-y', '-i', video, '-frames:v', '1', '-update', '1', '-q:v', '2', join(ROOT, 'out', `${name}-cover.jpg`)]);
    console.log(`Cover: out/${name}-cover.jpg`);
  }
}
