// Algorithmischer Hall (Schroeder): vier Kammfilter, zwei Allpaesse. Mono rein, Stereo raus.
import { RATE } from './wav.mjs';

export const SPACES = {
  stairs: { rt: 2.4, wet: 0.5, damp: 0.35 },
  street: { rt: 0.9, wet: 0.14, damp: 0.5 },
  room: { rt: 0.4, wet: 0.1, damp: 0.6 },
  bath: { rt: 0.8, wet: 0.28, damp: 0.25 },
  hall: { rt: 0.9, wet: 0.2, damp: 0.5 },
};

function comb(x, ms, rt, damp) {
  const d = Math.round((ms / 1000) * RATE);
  const g = 10 ** ((-3 * (ms / 1000)) / rt);
  const buf = new Float32Array(d);
  const y = new Float32Array(x.length);
  let p = 0;
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const out = buf[p];
    s = out * (1 - damp) + s * damp;
    buf[p] = x[i] + s * g;
    y[i] = out;
    p = (p + 1) % d;
  }
  return y;
}

function allpass(x, ms, g = 0.6) {
  const d = Math.round((ms / 1000) * RATE);
  const buf = new Float32Array(d);
  const y = new Float32Array(x.length);
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    const b = buf[p];
    const v = x[i] + b * g;
    buf[p] = v;
    y[i] = b - v * g;
    p = (p + 1) % d;
  }
  return y;
}

export function reverb(x, { rt = 1, damp = 0.4 } = {}) {
  const side = (times) => {
    const sum = new Float32Array(x.length);
    for (const ms of times) {
      const c = comb(x, ms, rt, damp);
      for (let i = 0; i < sum.length; i++) sum[i] += c[i] * 0.25;
    }
    return allpass(allpass(sum, 5.0), 1.7);
  };
  return [side([29.7, 37.1, 41.1, 43.7]), side([31.3, 35.9, 42.7, 45.1])];
}
