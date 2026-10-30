// Blackout in a high-rise, Langfassung (YouTube, 16:9). Diese Datei traegt Timeline und Ton;
// das Bild entsteht kapitelweise in scenes/blackout-long/*.js (siehe long.mjs).
import script, { CHAPTERS } from './blackout-long.script.js';
import timing from './blackout-long.timing.js';
import cues from './blackout-long.cues.js';
import { layout } from '../runtime/narration.js';

// Quellen je Zeile: Nummer = Position in SOURCES, unten rechts als Q1, Q2 ...
const Q = {
  real1: [1], real2: [2], rule1b: [3], busy: [6], mast: [6], mast2: [6], press: [4], seven: [4], bar: [5], pumps: [4], peak: [4],
  math: [8, 20], math2: [8], fridge: [7], share: [20], math_b: [8, 20], rule3: [9, 20], street: [6], store: [6], gas: [6],
  line: [4], clock: [10], payoff: [20], warn: [11], rule4: [11], hose: [15], crews: [12], lungs: [13], rule5: [12], hand: [14],
  towels: [12], seal: [12], call: [12], ladder: [16, 20], wave: [12], crew: [17], surge: [18], cold: [18], trip: [18],
  well: [19], well2: [19], grid: [18], pieces: [1, 18], r2: [7], r3: [9], r4: [11], r5: [12], lesson: [8], kit: [8],
};
const lines = script.lines.map((l) => ({ ...l, src: l.id, id: l.u ?? l.id, q: Q[l.u ?? l.id] }));
export const { beats, chunks, at, duration } = layout(lines, timing, { tail: 5 });
const timed = lines.map((l, i) => ({ ...l, at: beats[i].at }));

// Abschnitte fuer die Kapitel-Szenen
export const chapters = CHAPTERS.map((c, i) => {
  const own = timed.filter((l) => l.ch === c.id);
  const next = CHAPTERS[i + 1];
  const nextFirst = next && timed.find((l) => l.ch === next.id);
  return { ...c, lines: own, start: own[0].at, end: nextFirst ? nextFirst.at : duration, card: next?.card };
});

export const SOURCES = [
  'Iberian blackout, 28 April 2025, about 60 million people, restoration finished at 00:22 in Portugal and about 04:00 in Spain: ENTSO-E',
  'Berlin, January 2026: cable bridge fire, about 45,000 households, power fully back after about four days: Stromnetz Berlin and reporting',
  'Northeast blackout 2003, hundreds trapped in elevators: Wikipedia summary of the US-Canada task force report',
  'Mains pressure reaches about 22 m, buildings above five floors need electric booster stations: Berliner Wasserbetriebe, quoted in Berliner Zeitung',
  'Physics: 10 m of water column is about 1 bar',
  'Cell sites overloaded within minutes, about 2 hours of battery, stores without generators close within 2 hours, ATMs and fuel pumps fail: TAB report, Bundestag Drucksache 17/5672 (2011)',
  'Fridge stays cold about 4 to 6 hours if rarely opened: Verbraucherzentrale Niedersachsen',
  '2 liters of drinking water per person per day, 20 liters for 10 days: BBK guide',
  'Flush 6 L (water-saving cistern): Kreis Soest and sources citing the Umweltbundesamt',
  'Public water supply should work for at least 72 hours in a large outage: quoted by t-online',
  'Use flashlights rather than candles: Berlin fire department, quoted in reports on the Treptow-Köpenick outage',
  'Smoke in the stairwell: stay in, close doors, seal gaps, call emergency services, signal at a window: Feuerwehr Lehrte, Baden-Württemberg Interior Ministry, Feuerwehr Peising, City of Toronto guidance',
  'Most fire deaths come from smoke inhalation, not burns: NIST FireDOC, Michigan State University Extension',
  'Check a door with the back of your hand before opening it: US Fire Administration and Ready.gov, via fire service guidance',
  'Without pumps, hose pressure is too low for very tall buildings: t-online',
  'Standard turntable ladder DLK 23/12, rescue height 23 m: Baunetz Wissen, Feuerwehr Münster',
  'Escape hoods fitted by crews: City of Neuss fire service',
  'Cold load pickup, loss of load diversity, relays can read the surge as a fault, staged restoration: Schneider Electric, Basler Electric, Chalmers dissertation, Univ. Kassel',
  'About 5,200 emergency wells, not connected to the pipe network: BBK figure, reported by Rheinpfalz',
  'Math: 14 floors × 3 m = 42 m; 9 L ÷ 2 L/day = 4.5 days; 9 L ÷ 4 L/day = 2.25 days; 6 L ÷ 2 L/day = 3 days; 17 L ÷ 4 L/day = 4.25 days',
];

const ambience = chapters.flatMap((c) => [
  { t: c.start, name: 'room', gain: -26, dur: c.end - c.start },
  ...(['open', 'lights'].includes(c.id) ? [{ t: c.start, name: 'wind', gain: -22, dur: c.end - c.start }] : []),
]);
const allCues = [...ambience, ...cues].sort((a, b) => a.t - b.t);

export default {
  title: 'Blackout in a high-rise (full story)',
  format: 'wide',
  lean: true,
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  duration,
  fps: 30,
  seed: 80,
  sources: SOURCES,
  music: {
    bpm: 76,
    gain: -13,
    duck: 0.78,
    sections: [
      { at: 0, mood: 'dread' },
      { at: at.dinner, mood: 'pulse' },
      { at: at.off, mood: 'suspense' },
      { at: at.tap, mood: 'drive' },
      { at: at.count, mood: 'resolve' },
      { at: at.helen, mood: 'suspense' },
      { at: at.recap, mood: 'pulse' },
      { at: at.back, mood: 'suspense' },
      { at: at.payoff, mood: 'resolve' },
      { at: at.hall, mood: 'suspense' },
      { at: at.hook, mood: 'dread' },
      { at: at.smoke, mood: 'drive' },
      { at: at.now, mood: 'dread' },
      { at: at.seal, mood: 'suspense' },
      { at: at.wait, mood: 'silence' },
      { at: at.crew, mood: 'pulse' },
      { at: at.lights, mood: 'resolve' },
      { at: at.trip, mood: 'dread' },
      { at: at.well, mood: 'pulse' },
      { at: at.marek_e, mood: 'calm' },
      { at: at.grid, mood: 'suspense' },
      { at: at.day6, mood: 'silence' },
      { at: at.lights_e + 0.4, mood: 'resolve' },
      { at: at.rules, mood: 'pulse' },
      { at: at.lesson, mood: 'calm' },
      { at: at.ask_e, mood: 'build' },
    ],
  },
  story: { hook: 'One light in a black city. That light is you.', beats },

  setup(ctx) {
    ctx.state.i = 0;
    ctx.scene.background = new ctx.THREE.Color('#000');
  },
  update(ctx, t) {
    while (ctx.state.i < allCues.length && allCues[ctx.state.i].t <= t) {
      const { name, t: _, ...o } = allCues[ctx.state.i++];
      ctx.sound(name, o);
    }
  },
  vars: () => ({}),
};
