// Tag 3: Bilder aus Part 3.
import orig from '../blackout3.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'smoke');
const CLOCKS = [['hook', 'DAY 3 · 2:10 PM'], ['water', '6:30 PM'], ['smell', '7:52 PM'], ['crack', '7:53 PM'], ['dial', '7:54 PM'], ['look', '7:55 PM']];
const grades = { landing: '#d8cfc6', room: '#ffe2c4', city: '#c3cfea', stairs: '#d8cdc2' };
const FIRE_T = at.floor9 + 0.4;

export default remix(orig, {
  title: 'Day 3', start: c.start, end: c.end, lines: c.lines, card: c.card,
  overlay(g, T, ui, ctx, { pop, set }) {
    const { phase } = ctx;
    ui.grade(g, { color: grades[set], edge: 0.7 });
    ui.haze(g, 0.22 * phase(T, at.crack, at.ask_c));
    ui.vignette(g, 0.45);
    const smokeNow = 9 + 4 * phase(T, FIRE_T, at.ask_c - 0.5);
    const schema = (T >= at.floor9 && T < at.dial) || (T >= at.hose && T < at.look);
    if (schema) {
      const start = T < at.dial ? at.floor9 : at.hose;
      const end = T < at.dial ? at.dial : at.look;
      const a = phase(T, start - 0.05, start + 0.2) * (1 - phase(T, end - 0.25, end));
      ui.section(g, { alpha: a, level: 7, pump: 0, fire: 9, smoke: smokeNow, showMains: T >= at.hose ? 1 : 0, mainsLabel: 'HOSE', mainsSub: 'PRESSURE' });
      g.save();
      g.globalAlpha = a;
      if (T < at.dial) ui.fact(g, { x: 1010, y: 250, label: 'The stairwell', value: 'A chimney', sub: 'Hot smoke rises through the shaft', k: phase(T, at.chimney + 0.2, at.chimney + 0.6), color: '#ff4438' });
      else ui.fact(g, { x: 1010, y: 250, label: 'Without pumps', value: 'Low pressure', sub: 'Fire hoses struggle up here', k: phase(T, at.hose + 0.3, at.hose + 0.7), color: '#3fb4ff' });
      g.restore();
    }
    const clock = CLOCKS.filter(([id]) => at[id] <= T).pop();
    if (clock && !schema && T < at.ask_c) ui.clock(g, clock[1]);
    if (T >= at.water && T < at.ask_c && !schema) ui.gauge(g, { label: 'WATER LEFT', value: '11 L', warn: true });
    if (T >= FIRE_T && T < at.ask_c && !schema) ui.gauge(g, { label: 'SMOKE', value: `FLOOR ${Math.floor(smokeNow)}`, warn: true, x: 1640 });
    if (T >= at.rule4 && T < at.smell) ui.rule(g, { label: 'Rule #4', text: 'Flashlights, not candles', k: pop(at.rule4, at.smell) });
    if (T >= at.look + 1 && T < at.alone) ui.nameTag(g, { name: 'Helen', info: '81 · Apt 14B', x: 1400, y: 780, k: pop(at.look + 1, at.alone) });
    if (T >= at.ask_c) ui.cover(g, { lines: ['What would', '*you do?*'], cx: 470, y: 460, size: 170, alpha: phase(T, at.ask_c, at.ask_c + 0.2) });
    else ui.words(g, T, chunks);
  },
});
