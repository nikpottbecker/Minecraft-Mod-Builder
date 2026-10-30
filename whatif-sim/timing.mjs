#!/usr/bin/env node
// Misst die Stimme eines Skripts: node timing.mjs scenes/blackout.script.js
// Schreibt scenes/blackout.timing.js (Satzdauer + Wortzeiten), die Szene baut darauf ihr Timing.

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const exec = promisify(execFile);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const ROOT = dirname(fileURLToPath(import.meta.url));
const KOKORO_PY = join(homedir(), '.cache/whatif-tts/.venv/bin/python');

const file = resolve(process.argv[2] || '');
if (!file.endsWith('.script.js')) {
  console.error('Aufruf: node timing.mjs scenes/<name>.script.js');
  process.exit(1);
}
const script = (await import(pathToFileURL(file).href)).default;
const dir = await mkdtemp(join(tmpdir(), 'whatif-timing-'));
const lines = [];
try {
  for (const [i, line] of script.lines.entries()) {
    const text = (line.say ?? line.text).replace(/\*/g, '');
    const out = join(dir, `${i}.mp3`);
    const say = () => (script.tts === 'kokoro'
      ? exec(KOKORO_PY, [join(ROOT, 'audio', 'kokoro_tts.py'), '--text', text, '--voice', script.voice, '--speed', String(line.speed ?? 1), '--out', out.replace('.mp3', '.wav')])
      : exec('python3', [join(ROOT, 'audio', 'edge_words.py'), '--text', text, '--voice', script.voice, '--out', out]));
    // Der Dienst liefert gelegentlich kein Audio: kurz warten, neu versuchen.
    const { stdout } = await say().catch(() => pause(2000).then(say)).catch(() => pause(6000).then(say));
    const raw = JSON.parse(stdout);
    const offset = raw[0]?.start ?? 0;
    const words = raw.map((w) => ({ w: w.w, start: +(w.start - offset).toFixed(3) }));
    const dur = +(raw.at(-1).end - offset).toFixed(3);
    lines.push({ text, dur, words });
    console.log(`  ${dur.toFixed(2)} s  ${text}`);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
await writeFile(file.replace(/\.script\.js$/, '.timing.js'), `// Erzeugt von timing.mjs, nicht von Hand aendern.\nexport default ${JSON.stringify({ voice: script.voice, tts: script.tts, lines })};\n`);
console.log(`Gesamt: ${lines.reduce((s, l) => s + l.dur, 0).toFixed(1)} s Stimme`);
