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

  // Schritt auf Beton: tiefer Absatz plus Kratzen
  concrete({ pitch = 1, seed = 41 } = {}) {
    const n = noise(seed);
    const heel = lowpass(new Float32Array(len(0.13)).map(() => n()), 520 * pitch);
    const grit = highpass(new Float32Array(len(0.13)).map(() => n()), 2400);
    return normalize(heel.map((v, i) => {
      const t = i / RATE;
      return v * 3 * env(t, 0.001, 0.035) + grit[i] * 0.09 * env(t, 0.004, 0.05);
    }), 0.7);
  },

  // Atemzug: gefiltertes Rauschen, ein- und ausatmen
  breath({ dur = 0.9, pitch = 1, seed = 43 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => (1200 + 500 * Math.sin((t / dur) * Math.PI)) * pitch, 1.2);
    return normalize(x.map((v, i) => v * Math.sin((i / x.length) * Math.PI) ** 1.6), 0.5);
  },

  // Laufendes Wasser: viele kleine Blasen ueber Rauschen
  water({ dur = 4, pitch = 1, seed = 47 } = {}) {
    const n = noise(seed);
    const hiss = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => (1500 + 500 * Math.sin(t * 3.1) + 300 * Math.sin(t * 7.7)) * pitch, 0.9);
    const x = hiss.map((v, i) => {
      const t = i / RATE;
      return v * (0.7 + 0.3 * Math.sin(t * 19 + 3 * Math.sin(t * 2.3)));
    });
    const y = x.map((v, i) => v * Math.min(1, i / (RATE * 0.05), (x.length - i) / (RATE * 0.2)));
    return normalize(y, 0.6);
  },

  // Wasser fuellt Eimer: Tonhoehe steigt mit dem Fuellstand
  fill({ dur = 2.4, seed = 53 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => 420 + (t / dur) ** 1.4 * 1500, 3);
    return normalize(x.map((v, i) => v * Math.min(1, i / (RATE * 0.03), (x.length - i) / (RATE * 0.1))), 0.7);
  },

  // Einzelner Tropfen mit kurzem Echo im Metall
  drip({ pitch = 1 } = {}) {
    return normalize(sweep(0.14, (t) => (900 + 2600 * t * 7) * pitch).map((v, i) => v * env(i / RATE, 0.001, 0.03)), 0.5);
  },

  // Wasser schwappt im Eimer
  slosh({ dur = 0.5, seed = 59 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => 500 + 500 * Math.sin((t / dur) * Math.PI), 2);
    return normalize(x.map((v, i) => v * Math.sin((i / x.length) * Math.PI)), 0.5);
  },

  // Eimergriff oder Tuer: Knarren aus schnellen Reibeimpulsen
  creak({ dur = 0.8, pitch = 1, seed = 61 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur));
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / RATE;
      ph += (70 + 45 * Math.sin(t * 5) + 30 * n() * 0.1) * pitch / RATE;
      x[i] = (ph % 1 < 0.08 ? 1 : 0) * Math.sin((i / x.length) * Math.PI);
    }
    return normalize(bandpass(x, 1500 * pitch, 2.4), 0.6);
  },

  // Toilettenspuelung, die ins Leere gurgelt
  gurgle({ dur = 1.2, seed = 67 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => 220 + 160 * Math.sin(t * 22) * (1 - t / dur), 5);
    return normalize(x.map((v, i) => v * Math.exp((-2.4 * i) / x.length)), 0.7);
  },

  // Rollgitter: Metallrasseln mit Schlag
  shutter({ dur = 0.9, seed = 71 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), 1900, 8);
    return normalize(x.map((v, i) => {
      const t = i / RATE;
      return v * Math.exp(-t * 6) * (0.6 + 0.4 * Math.sign(Math.sin(t * 90)));
    }), 0.8);
  },

  // Gemurmel: mehrere gefilterte Stimmen-Formanten, die auf- und abschwellen
  murmur({ dur = 4, seed = 73 } = {}) {
    const n = noise(seed);
    const base = new Float32Array(len(dur)).map(() => n());
    const a = bandpass(base, (t) => 520 + 180 * Math.sin(t * 3.7), 3);
    const b = bandpass(base, (t) => 1150 + 260 * Math.sin(t * 2.9 + 1), 3);
    const y = a.map((v, i) => {
      const t = i / RATE;
      const k = Math.max(0, Math.sin(t * 5.3) + Math.sin(t * 8.1 + 2));
      return (v + b[i] * 0.7) * k * Math.min(1, t / 0.5, (dur - t) / 0.4);
    });
    return normalize(y, 0.6);
  },

  // Herzschlag: Doppelschlag
  heart({ pitch = 1 } = {}) {
    const x = new Float32Array(len(0.55));
    for (const [o, g] of [[0, 1], [0.2, 0.7]]) {
      const b = sweep(0.2, (t) => (72 - t * 160) * pitch).map((v, i) => v * env(i / RATE, 0.004, 0.05) * g);
      x.set(b.map((v, i) => v + (x[i + Math.round(o * RATE)] || 0)), Math.round(o * RATE));
    }
    return normalize(x, 0.9);
  },

  // Sirene in weiter Ferne
  siren({ dur = 5 } = {}) {
    const x = sweep(dur, (t) => 620 + 240 * Math.sin(t * 1.5));
    return normalize(lowpass(x, 900).map((v, i) => v * Math.sin((i / x.length) * Math.PI)), 0.25);
  },

  // Wind
  wind({ dur = 6, seed = 79 } = {}) {
    const n = noise(seed);
    const x = bandpass(new Float32Array(len(dur)).map(() => n()), (t) => 340 + 170 * Math.sin(t * 0.8) + 90 * Math.sin(t * 2.1), 1.4);
    return normalize(x.map((v, i) => v * Math.min(1, i / (RATE * 0.6), (x.length - i) / (RATE * 0.6))), 0.5);
  },

  // Raumton: leises tiefes Rauschen, damit Stille nicht tot klingt
  room({ dur = 6, seed = 83 } = {}) {
    const n = noise(seed);
    const x = lowpass(new Float32Array(len(dur)).map(() => n()), 180);
    return normalize(x.map((v, i) => v * Math.min(1, i / (RATE * 0.2), (x.length - i) / (RATE * 0.2))), 0.35);
  },

  // Schwerer Riegel: Metall gleitet, rastet ein
  bolt({ seed = 89 } = {}) {
    const n = noise(seed);
    const slide = bandpass(new Float32Array(len(0.28)).map(() => n()), (t) => 1400 + t * 2600, 5);
    const clack = sweep(0.09, (t) => 310 - t * 900).map((v, i) => v * env(i / RATE, 0.001, 0.02));
    const x = new Float32Array(len(0.42));
    slide.forEach((v, i) => (x[i] = v * 0.5 * Math.sin((i / slide.length) * Math.PI)));
    clack.forEach((v, i) => (x[i + len(0.27)] += v));
    return normalize(x, 0.9);
  },

  // Kerze knistert: seltene kleine Knacker
  crackle({ dur = 3, seed = 97 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(dur));
    for (let k = 0; k < dur * 9; k++) {
      const at = Math.floor(((n() + 1) / 2) * (x.length - 900));
      for (let i = 0; i < 800; i++) x[at + i] += n() * Math.exp(-i / 90) * (0.4 + (n() + 1) / 3);
    }
    return normalize(highpass(x, 900), 0.45);
  },

  // Feuer: tiefes Rauschen, das atmet, dazu Knacken
  fire({ dur = 6, seed = 101 } = {}) {
    const n = noise(seed);
    const low = lowpass(new Float32Array(len(dur)).map(() => n()), 320);
    const crack = sfx.crackle({ dur, seed: seed + 1 });
    const y = low.map((v, i) => {
      const t = i / RATE;
      return (v * 3 * (0.65 + 0.35 * Math.sin(t * 2.3 + Math.sin(t * 0.9))) + crack[i] * 0.5) * Math.min(1, t / 0.6, (dur - t) / 0.6);
    });
    return normalize(y, 0.7);
  },

  // Husten: zwei kurze Stoesse
  cough({ pitch = 1, seed = 103 } = {}) {
    const n = noise(seed);
    const x = new Float32Array(len(0.62));
    for (const [o, g] of [[0, 1], [0.27, 0.75]]) {
      const b = bandpass(new Float32Array(len(0.24)).map(() => n()), (t) => (620 - t * 900) * pitch, 1.6);
      b.forEach((v, i) => (x[i + len(o)] += v * g * env(i / RATE, 0.006, 0.07)));
    }
    return normalize(x, 0.7);
  },

  // Rauchmelder weit entfernt
  alarm({ dur = 4 } = {}) {
    const x = sweep(dur, () => 3100);
    return normalize(lowpass(x, 1800).map((v, i) => v * ((i / RATE) % 1 < 0.45 ? 1 : 0)), 0.3);
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
