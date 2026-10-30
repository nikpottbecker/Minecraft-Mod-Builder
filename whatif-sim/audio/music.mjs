// Prozedurale Hintergrundmusik, die der Story folgt.
//
// Szene: music: { bpm: 96, sections: [{ at: 0, mood: 'pulse' }, { at: 3.5, mood: 'suspense' }, ...] }
// Stimmungen:
//   calm      weiche Flaeche
//   pulse     Flaeche + Bass-Puls (Neugier, normaler Alltag)
//   suspense  tiefer Drone, hoher Ton, Uhr-Ticken (etwas stimmt nicht)
//   drive     Bass, Hi-Hats, volle Akkorde (Action, Eskalation)
//   resolve   Arpeggio, offen (Aufloesung, Fakt)
//   build     alles steigt an (Loop zurueck zum Anfang)
//   silence   Stille (fuer harte Pointen)

import { RATE } from './wav.mjs';

const TAU = Math.PI * 2;
const A2 = 110;
// Akkordfolge in a-Moll: Am – F – C – G (Halbtoene relativ zu A)
const CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];
const freq = (semi, base = A2) => base * 2 ** (semi / 12);

const MOODS = {
  calm: { pad: 0.5, bass: 0, hats: 0, tick: 0, drone: 0.2, arp: 0, cutoff: 700 },
  pulse: { pad: 0.45, bass: 0.55, hats: 0, tick: 0, drone: 0, arp: 0, cutoff: 900 },
  suspense: { pad: 0.15, bass: 0, hats: 0, tick: 0.35, drone: 0.7, arp: 0, cutoff: 450 },
  drive: { pad: 0.5, bass: 0.7, hats: 0.35, tick: 0, drone: 0, arp: 0.2, cutoff: 1500 },
  resolve: { pad: 0.55, bass: 0.3, hats: 0.12, tick: 0, drone: 0, arp: 0.45, cutoff: 1800 },
  build: { pad: 0.6, bass: 0.6, hats: 0.4, tick: 0, drone: 0.2, arp: 0.5, cutoff: 2600 },
  dread: { pad: 0.06, bass: 0, hats: 0, tick: 0, drone: 0.85, arp: 0, cutoff: 320 },
  silence: { pad: 0, bass: 0, hats: 0, tick: 0, drone: 0, arp: 0, cutoff: 400 },
};
const KEYS = Object.keys(MOODS.calm);

export function music({ duration, bpm = 96, sections = [{ at: 0, mood: 'pulse' }], seed = 1 } = {}) {
  const n = Math.round(duration * RATE);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const beat = 60 / bpm;
  const sorted = [...sections].sort((a, b) => a.at - b.at);

  // Weiche Uebergaenge zwischen Stimmungen (0,4 s), "build" steigt ueber seine Dauer an.
  const mix = (t) => {
    let i = 0;
    while (i + 1 < sorted.length && sorted[i + 1].at <= t) i++;
    const cur = MOODS[sorted[i].mood] || MOODS.calm;
    const prev = i > 0 ? MOODS[sorted[i - 1].mood] || MOODS.calm : cur;
    const k = Math.min(1, (t - sorted[i].at) / 0.4);
    const out = {};
    for (const key of KEYS) out[key] = prev[key] + (cur[key] - prev[key]) * k;
    if (sorted[i].mood === 'build') {
      const end = sorted[i + 1]?.at ?? duration;
      const g = Math.min(1, (t - sorted[i].at) / Math.max(0.1, end - sorted[i].at));
      out.cutoff *= 0.4 + 0.6 * g;
      for (const key of ['pad', 'bass', 'hats', 'arp']) out[key] *= 0.3 + 0.7 * g;
    }
    return out;
  };

  let rnd = seed >>> 0;
  const noise = () => {
    rnd = (rnd * 1664525 + 1013904223) >>> 0;
    return rnd / 2147483648 - 1;
  };

  const phases = new Float64Array(16);
  let lpL = 0;
  let lpR = 0;
  let hatLp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const m = mix(t);
    const beatPos = t / beat;
    const chord = CHORDS[Math.floor(beatPos / 4) % CHORDS.length];

    // Flaeche: 3 Akkordtoene, je zwei leicht verstimmte Saegezaehne (Stereo-Breite)
    let padL = 0;
    let padR = 0;
    chord.forEach((semi, j) => {
      const f = freq(semi + 12);
      phases[j * 2] += f * 1.003 / RATE;
      phases[j * 2 + 1] += f * 0.997 / RATE;
      padL += (phases[j * 2] % 1) * 2 - 1;
      padR += (phases[j * 2 + 1] % 1) * 2 - 1;
    });
    const kc = 1 - Math.exp((-TAU * m.cutoff) / RATE);
    lpL += kc * (padL / 3 - lpL);
    lpR += kc * (padR / 3 - lpR);
    let l = lpL * m.pad * 0.5;
    let r = lpR * m.pad * 0.5;

    // Bass auf Achteln mit kurzer Huellkurve
    if (m.bass > 0) {
      const eighth = (beatPos * 2) % 1;
      const fb = freq(chord[0] - 12);
      phases[8] += fb / RATE;
      const b = Math.sin(TAU * phases[8]) + 0.3 * Math.sin(TAU * phases[8] * 2);
      const e = Math.exp(-eighth * 5) * (Math.floor(beatPos * 2) % 2 === 0 ? 1 : 0.7);
      l += b * e * m.bass * 0.45;
      r += b * e * m.bass * 0.45;
    }
    // Hi-Hats auf Sechzehnteln
    if (m.hats > 0) {
      const six = (beatPos * 4) % 1;
      const raw = noise();
      hatLp += 0.5 * (raw - hatLp);
      const h = (raw - hatLp) * Math.exp(-six * 28) * (Math.floor(beatPos * 4) % 2 ? 0.6 : 1);
      l += h * m.hats * 0.25;
      r += h * m.hats * 0.22;
    }
    // Uhr-Ticken auf jedem Schlag
    if (m.tick > 0) {
      const bp = beatPos % 1;
      const tk = Math.sin(TAU * (Math.floor(beatPos) % 2 ? 2100 : 1700) * t) * Math.exp(-bp * 160);
      l += tk * m.tick * 0.3;
      r += tk * m.tick * 0.3;
    }
    // Drone: tiefer Grundton + hoher, schwebender Ton
    if (m.drone > 0) {
      phases[9] += freq(-12) / RATE;
      phases[10] += freq(31) * (1 + 0.004 * Math.sin(t * 5)) / RATE;
      const d = Math.sin(TAU * phases[9]) * (0.7 + 0.3 * Math.sin(t * 0.8)) + 0.18 * Math.sin(TAU * phases[10]);
      l += d * m.drone * 0.35;
      r += d * m.drone * 0.35;
    }
    // Arpeggio: Akkordtoene auf Sechzehnteln, Dreieckswelle
    if (m.arp > 0) {
      const idx = Math.floor(beatPos * 4);
      const semi = chord[idx % 3] + 24 + (idx % 6 >= 3 ? 12 : 0);
      phases[11] += freq(semi) / RATE;
      const tri = 1 - 4 * Math.abs((phases[11] % 1) - 0.5);
      const e = Math.exp(-((beatPos * 4) % 1) * 6);
      const pan = idx % 2 ? 0.7 : 1;
      l += tri * e * m.arp * 0.18 * pan;
      r += tri * e * m.arp * 0.18 * (1.7 - pan);
    }
    L[i] = l;
    R[i] = r;
  }
  // Sanft ein-/ausblenden und normalisieren
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.8 / peak : 1;
  for (let i = 0; i < n; i++) {
    const f = Math.min(1, i / (0.05 * RATE), (n - i) / (0.3 * RATE));
    L[i] *= g * f;
    R[i] *= g * f;
  }
  return [L, R];
}
