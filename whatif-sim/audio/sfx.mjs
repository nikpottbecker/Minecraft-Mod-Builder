// Prozedurale Soundeffekte (48 kHz, mono). Alles per Code synthetisiert:
// keine Lizenzfragen, deterministisch, beliebig anpassbar.
//
// Jeder Effekt: (opts) => Float32Array. opts.dur (s), opts.pitch (Faktor), opts.seed.

import { RATE } from './wav.mjs';

const TAU = Math.PI * 2;

function noise(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

// Einfacher Tiefpass/Hochpass (1-Pol) mit zeitlich variabler Grenzfrequenz.
function lowpass(x, cutoff) {
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof cutoff === 'function' ? cutoff(i / RATE) : cutoff;
    const k = 1 - Math.exp((-TAU * fc) / RATE);
    s += k * (x[i] - s);
    y[i] = s;
  }
  return y;
}
function highpass(x, cutoff) {
  const lp = lowpass(x, cutoff);
  return x.map((v, i) => v - lp[i]);
}
// Resonanter Bandpass (State-Variable-Filter).
function bandpass(x, freq, q = 4) {
  const y = new Float32Array(x.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < x.length; i++) {
    const f = typeof freq === 'function' ? freq(i / RATE) : freq;
    const F = 2 * Math.sin((Math.PI * Math.min(f, RATE / 6)) / RATE);
    const high = x[i] - low - band / q;
    band += F * high;
    low += F * band;
    y[i] = band;
  }
  return y;
}

const len = (dur) => Math.max(1, Math.round(dur * RATE));
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
function normalize(x, peak = 0.9) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}
// Sinus mit Frequenzverlauf f(t)
function sweep(dur, f, shape = Math.sin) {
  const x = new Float32Array(len(dur));
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    ph += (TAU * f(i / RATE)) / RATE;
    x[i] = shape(ph);
  }
  return x;
}

export const sfx = {
  // Luftzug fuer Schnitte und Texteinblendungen
  whoosh({ dur = 0.5, pitch = 1, seed = 3 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur)).map(() => n());
    const f = (t) => (300 + 3500 * Math.sin((Math.PI * t) / dur)) * pitch;
    const y = bandpass(x, f, 1.5);
    return normalize(y.map((v, i) => v * Math.sin((Math.PI * i) / y.length) ** 2), 0.7);
  },

  // Dumpfer Aufprall: tiefer Sinus-Fall + Rauschknall
  impact({ dur = 0.9, pitch = 1, seed = 5 } = {}) {
    const n = noise(seed);
    const body = sweep(dur, (t) => (95 * Math.exp(-t * 6) + 38) * pitch);
    const crack = lowpass(new Float32Array(len(dur)).map(() => n()), (t) => 5000 * Math.exp(-t * 18) + 200);
    const y = body.map((v, i) => {
      const t = i / RATE;
      return v * env(t, 0.003, 0.28) + crack[i] * 1.8 * env(t, 0.001, 0.07);
    });
    return normalize(y, 0.95);
  },

  // Blech/Karosserie (Aufprall Auto)
  crash({ dur = 1.2, pitch = 1, seed = 11 } = {}) {
    const base = sfx.impact({ dur, pitch: pitch * 0.9, seed });
    const n = noise(seed + 1);
    const metal = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => 2400 - 900 * t, 9);
    const rattle = highpass(new Float32Array(len(dur)).map(() => n()), 1500);
    const y = base.map((v, i) => {
      const t = i / RATE;
      return v + metal[i] * 1.6 * env(t, 0.002, 0.35) + rattle[i] * 0.4 * env(t, 0.01, 0.12) * (0.5 + 0.5 * Math.sin(t * 90));
    });
    return normalize(y, 0.95);
  },

  // Koerper faellt auf den Boden
  thud({ dur = 0.35, pitch = 1, seed = 7 } = {}) {
    const n = noise(seed);
    const body = sweep(dur, (t) => (140 * Math.exp(-t * 14) + 55) * pitch);
    const cloth = lowpass(new Float32Array(len(dur)).map(() => n()), 900);
    return normalize(body.map((v, i) => v * env(i / RATE, 0.002, 0.07) + cloth[i] * 2.5 * env(i / RATE, 0.001, 0.04)), 0.8);
  },

  // Reifenquietschen (nur mit Reibung!)
  skid({ dur = 1.2, pitch = 1, seed = 13 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur)).map(() => n());
    const f = (t) => (1650 + 120 * Math.sin(t * 37) + 60 * Math.sin(t * 91)) * pitch;
    const y = bandpass(x, f, 22);
    const tone = sweep(dur, (t) => f(t) * 1.002, (p) => Math.sin(p) * 0.3);
    const fade = (i) => Math.min(1, i / (0.05 * RATE)) * Math.min(1, (y.length - i) / (0.08 * RATE));
    return normalize(y.map((v, i) => (v + tone[i] * 0.2) * fade(i)), 0.6);
  },

  // Motor heult auf (durchdrehende Raeder)
  rev({ dur = 1.6, pitch = 1 } = {}) {
    const f = (t) => (60 + 140 * (1 - Math.exp(-t * 2.2))) * pitch;
    const saw = (p) => ((p / TAU) % 1) * 2 - 1;
    const x = sweep(dur, f, saw);
    const x2 = sweep(dur, (t) => f(t) * 2.01, saw);
    const y = lowpass(x.map((v, i) => v + 0.5 * x2[i]), (t) => 600 + 1800 * Math.min(1, t));
    return normalize(y.map((v, i) => v * Math.min(1, i / 2000) * Math.min(1, (y.length - i) / 6000)), 0.55);
  },

  // Ampel-/UI-Klick
  click({ pitch = 1 } = {}) {
    const x = sweep(0.06, () => 2400 * pitch);
    return normalize(x.map((v, i) => v * Math.exp(-i / (0.006 * RATE))), 0.5);
  },

  // Kurzer Pop fuer Zahlen/Karten
  pop({ pitch = 1 } = {}) {
    const x = sweep(0.12, (t) => (900 - 3000 * t) * pitch);
    return normalize(x.map((v, i) => v * env(i / RATE, 0.002, 0.03)), 0.55);
  },

  // Heller Ton fuer Fakten
  ding({ dur = 1.2, pitch = 1 } = {}) {
    const f = 1318 * pitch;
    const x = new Float32Array(len(dur)).map((_, i) => {
      const t = i / RATE;
      return (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 6) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 10)) * env(t, 0.002, 0.35);
    });
    return normalize(x, 0.5);
  },

  // Tiefer Schlag (Pointe, Schnitt auf Schwarz)
  boom({ dur = 2.2, pitch = 1, seed = 17 } = {}) {
    const n = noise(seed);
    const sub = sweep(dur, (t) => (55 * Math.exp(-t * 1.5) + 30) * pitch);
    const air = lowpass(new Float32Array(len(dur)).map(() => n()), (t) => 1200 * Math.exp(-t * 3) + 80);
    return normalize(sub.map((v, i) => v * env(i / RATE, 0.005, 0.7) + air[i] * 1.2 * env(i / RATE, 0.002, 0.25)), 0.95);
  },

  // Spannungsaufbau (Rauschen + steigender Ton), endet abrupt
  riser({ dur = 2, pitch = 1, seed = 19 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur)).map(() => n());
    const y = bandpass(x, (t) => (200 + 4000 * (t / dur) ** 2) * pitch, 3);
    const tone = sweep(dur, (t) => (110 + 330 * (t / dur) ** 2) * pitch, (p) => Math.sin(p) + 0.3 * Math.sin(2 * p));
    return normalize(y.map((v, i) => (v + tone[i] * 0.25) * (i / y.length) ** 1.6), 0.7);
  },

  // Gegenteil: Ton faellt ab (etwas "schaltet sich ab")
  powerdown({ dur = 1.0, pitch = 1 } = {}) {
    const x = sweep(dur, (t) => (420 * Math.exp(-t * 3.2) + 30) * pitch, (p) => Math.sin(p) + 0.4 * Math.sin(3 * p));
    return normalize(lowpass(x, 2000).map((v, i) => v * Math.min(1, i / 300) * (1 - i / x.length)), 0.6);
  },

  // Digitaler Glitch (Wirklichkeit "bricht")
  glitch({ dur = 0.35, seed = 23 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur));
    let hold = 0;
    let v = 0;
    for (let i = 0; i < x.length; i++) {
      if (hold-- <= 0) {
        hold = Math.floor(Math.abs(n()) * 900) + 30;
        v = n();
      }
      x[i] = v * (Math.sin(i * 0.31) > 0 ? 1 : -1) * 0.6 + n() * 0.15;
    }
    return normalize(highpass(x, 300), 0.5);
  },

  // Schritte/Gehen in der Stadt (ein Schritt)
  step({ pitch = 1, seed = 29 } = {}) {
    const n = noise(seed);
    const x = lowpass(new Float32Array(len(0.09)).map(() => n()), 1800 * pitch);
    return normalize(x.map((v, i) => v * env(i / RATE, 0.001, 0.02)), 0.4);
  },

  // Stadt-Atmosphaere (Verkehrsrauschen, Hupe in der Ferne)
  city({ dur = 10, seed = 31 } = {}) {
    const n = noise(seed);
    const rumble = lowpass(new Float32Array(len(dur)).map(() => n()), 260);
    const hiss = lowpass(highpass(new Float32Array(len(dur)).map(() => n()), 1500), 5000);
    const y = rumble.map((v, i) => {
      const t = i / RATE;
      const swell = 0.6 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1);
      const honk = t % 7.3 > 5.1 && t % 7.3 < 5.4 ? Math.sin(TAU * 392 * t) * 0.08 + Math.sin(TAU * 494 * t) * 0.06 : 0;
      return v * 2.2 * swell + hiss[i] * 0.12 + honk;
    });
    return normalize(y, 0.5);
  },
};

export const SFX_NAMES = Object.keys(sfx);
