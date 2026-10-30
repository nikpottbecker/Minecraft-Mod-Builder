// Minimaler WAV-Reader/-Writer (16 bit PCM) fuer Float32-Samples.

import { readFile, writeFile } from 'node:fs/promises';

export const RATE = 48000;

export async function writeWav(file, channels, rate = RATE) {
  const chans = Array.isArray(channels) ? channels : [channels];
  const n = chans[0].length;
  const buf = Buffer.alloc(44 + n * chans.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * chans.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(chans.length, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * chans.length * 2, 28);
  buf.writeUInt16LE(chans.length * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * chans.length * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (const c of chans) {
      const v = Math.max(-1, Math.min(1, c[i] || 0));
      buf.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  }
  await writeFile(file, buf);
}

// Liest 16-bit-PCM-WAV, gibt { rate, channels: [Float32Array...] } zurueck.
export async function readWav(file) {
  const buf = await readFile(file);
  let p = 12;
  let fmt = null;
  while (p < buf.length - 8) {
    const id = buf.toString('ascii', p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(p + 10), rate: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    if (id === 'data') {
      if (!fmt || fmt.bits !== 16) throw new Error(`${file}: nur 16-bit PCM wird unterstuetzt`);
      const n = Math.floor(size / (2 * fmt.channels));
      const channels = Array.from({ length: fmt.channels }, () => new Float32Array(n));
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < fmt.channels; c++) channels[c][i] = buf.readInt16LE(p + 8 + (i * fmt.channels + c) * 2) / 32768;
      }
      return { rate: fmt.rate, channels };
    }
    p += 8 + size + (size % 2);
  }
  throw new Error(`${file}: keine Audiodaten gefunden`);
}

// Bereich mit hoerbarem Signal (fuer Wort-Timing): erstes/letztes Sample ueber Schwelle.
export function speechSpan(samples, rate, threshold = 0.02) {
  let a = 0;
  let b = samples.length - 1;
  while (a < samples.length && Math.abs(samples[a]) < threshold) a++;
  while (b > a && Math.abs(samples[b]) < threshold) b--;
  return { start: a / rate, end: (b + 1) / rate };
}
