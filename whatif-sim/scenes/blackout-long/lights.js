// Tag 4 bis 6: Bilder aus Part 5, dazu Wiederaufbau des Netzes, Regeln, Vorrat.
import orig from '../blackout5.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'lights');
const CLOCKS = [['sealed', 'DAY 4 · 7:10 AM'], ['line_e', '11:20 AM'], ['marek_e', '3:25 PM'], ['day6', 'DAY 6 · 6:42 PM'], ['tap_e', '7:15 PM']];
const RULES = [['r1', '1', 'Stay out of the elevator'], ['r2', '2', 'Keep the fridge shut'], ['r3', '3', "Don't flush drinking water"], ['r4', '4', 'Flashlights, not candles'], ['r5', '5', 'A closed door buys time']];
const KIT = [[0.1, '20 L of water per person'], [2.6, 'A flashlight'], [3.7, 'Spare batteries'], [4.9, 'A battery radio']];

export default remix(orig, {
  title: 'Days 4 to 6', start: c.start, end: c.end, lines: c.lines,
  overlay(g, T, ui, ctx, { pop, set }) {
    const { phase, motion } = ctx;
    const day = T >= at.sealed && T < at.day6;
    ui.grade(g, { color: set === 'room' || set === 'tap' ? '#ffe9d2' : day ? '#e0e4ec' : '#c3cfea', edge: 0.62 });
    ui.vignette(g, 0.42);
    const clock = CLOCKS.filter(([id]) => at[id] <= T).pop();
    if (clock && T >= at.sealed && T < at.rules) ui.clock(g, clock[1]);
    if (T >= at.sealed && T < at.rules) ui.gauge(g, { label: 'WATER LEFT', value: T >= at.line_e + 3 ? '10 L' : '0 L', warn: T < at.line_e + 3 });
    if (T >= at.well + 0.8 && T < at.line_e) ui.rule(g, { label: 'Backup water', text: '≈ 5,200 emergency wells', k: pop(at.well + 0.8, at.line_e) });
    if (T >= at.grid + 0.2 && T < at.day6) {
      const n = Math.floor(23 * phase(T, at.grid + 1.5, at.day6 - 0.6));
      ui.blocks(g, { n, alpha: phase(T, at.grid + 0.2, at.grid + 0.5) * (1 - phase(T, at.day6 - 0.3, at.day6)) });
    }
    if (T >= at.rules && T < at.lesson) {
      ui.list(g, RULES.map(([id, n, text]) => ({ n, text, k: motion.ease.outBack(phase(T, at[id] - 0.1, at[id] + 0.2)) })), { alpha: 1 - phase(T, at.lesson - 0.2, at.lesson) });
    }
    if (T >= at.lesson && T < at.kit) ui.rule(g, { label: 'Official advice', text: '2 L a day × 10 days', result: '= 20 L per person', k: pop(at.lesson + 1.2, at.kit) });
    if (T >= at.kit && T < at.neighbor) {
      ui.list(g, KIT.map(([d, text]) => ({ n: '✓', text, k: motion.ease.outBack(phase(T, at.kit + d, at.kit + d + 0.3)) })), { alpha: 1 - phase(T, at.neighbor - 0.2, at.neighbor), x: 36, w: 700, y: 180 });
    }
    if (T >= at.neighbor + 2.2 && T < at.ask_e) ui.rule(g, { label: 'Not on any list', text: 'Who on your floor needs help?', k: pop(at.neighbor + 2.2, at.ask_e) });
    if (T >= at.ask_e) {
      ui.cover(g, { lines: ['How many days', '*would you last?*'], cx: 470, y: 400, size: 130, alpha: phase(T, at.ask_e, at.ask_e + 0.2) });
      const k = phase(T, at.ask_e + 1.3, at.ask_e + 1.6);
      if (k > 0) ui.rule(g, { label: 'Comment your number', text: 'Subscribe for the next scenario', cx: 470, y: 560, k });
    } else ui.words(g, T, chunks);
  },
});
