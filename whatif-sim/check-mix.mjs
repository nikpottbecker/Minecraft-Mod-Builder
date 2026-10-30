#!/usr/bin/env node
// Prueft die Mischung: node check-mix.mjs <name>  (nach audio.mjs, nutzt out/audio/<name>/)
// Stimme gegen Rest alle 100 ms, dazu harte Satzenden. Ziel: Median >= 15 dB, hoechstens 5 % unter 6 dB.

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav } from './audio/wav.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('Aufruf: node check-mix.mjs <name>');
  process.exit(1);
}
const dir = join(ROOT, 'out', 'audio', name);
const mono = async (s) => {
  const { channels } = await readWav(join(dir, `stem-${s}.wav`));
  const [a, b] = channels;
  return b ? a.map((v, i) => (v + b[i]) / 2) : a;
};
const [voice, fx, room, music] = await Promise.all(['voice', 'fx', 'room', 'music'].map(mono));
const RATE = 48000;
const db = (a, s, e) => {
  let sum = 0;
  for (let i = s; i < e; i++) sum += a[i] * a[i];
  return Math.sqrt(sum / Math.max(1, e - s));
};
const fxGain = 10 ** ((Number(process.argv[3] ?? 5)) / 20);
const bg = new Float32Array(voice.length);
for (let i = 0; i < bg.length; i++) bg[i] = (fx[i] * 0.9 + room[i]) * fxGain + music[i];
const hop = RATE / 10;
const out = [];
for (let i = 0; i + hop <= voice.length; i += hop) {
  const v = db(voice, i, i + hop);
  if (v >= 0.03) out.push({ t: i / RATE, gap: 20 * Math.log10(v / (db(bg, i, i + hop) + 1e-9)) });
}
const sorted = out.map((o) => o.gap).sort((a, b) => a - b);
const under6 = (sorted.filter((g) => g < 6).length / sorted.length) * 100;
const median = sorted[Math.floor(sorted.length / 2)];
console.log(`Sprachabstand: Median ${median.toFixed(1)} dB, unter 6 dB: ${under6.toFixed(0)} % von ${sorted.length} Fenstern`);
console.log('Schlechteste Stellen:', out.sort((a, b) => a.gap - b.gap).slice(0, 8).map((o) => `${o.t.toFixed(1)}s ${o.gap.toFixed(0)} dB`).join(', '));
const { beats } = JSON.parse(await readFile(join(dir, 'timeline.json'), 'utf8'));
const hard = beats.filter((b) => {
  const e = Math.round((b.at + b.dur) * RATE);
  return db(voice, e - RATE * 0.015, e) > 0.003;
});
console.log(`Harte Satzenden: ${hard.length} von ${beats.length}`);
process.exit(median >= 15 && under6 <= 5 && hard.length === 0 ? 0 : 1);
