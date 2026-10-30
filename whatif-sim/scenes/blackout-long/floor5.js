// Tag 2: Bilder aus Part 2.
import orig from '../blackout2.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'floor5');
const CLOCKS = [['recap', 'DAY 2 · 7:30 AM'], ['stairs', '8:10 AM'], ['street', '8:40 AM'], ['back', '9:05 AM'], ['marek', '9:20 AM'], ['carry', '9:30 AM'], ['payoff', '10:05 AM'], ['hall', '10:06 AM']];
const grades = { stairs: '#c3cfea', apt: '#ffe6cc', bath: '#dfeaf2', street: '#b9c4d8', hall: '#c4b6ac' };

export default remix(orig, {
  title: 'Day 2', start: c.start, end: c.end, lines: c.lines, card: c.card,
  overlay(g, T, ui, ctx, { pop, set }) {
    const { phase, state: S } = ctx;
    ui.grade(g, { color: grades[set], edge: set === 'stairs' ? 0.72 : 0.6 });
    ui.vignette(g, 0.45);
    const schema = T >= at.line - 0.05 && T < at.marek;
    if (schema) {
      const a = phase(T, at.line - 0.05, at.line + 0.2) * (1 - phase(T, at.marek - 0.3, at.marek));
      ui.section(g, { alpha: a, level: 7, pump: 0, marker: T >= at.line + 1.2 ? 5 : null });
      g.save();
      g.globalAlpha = a;
      ui.fact(g, { x: 1010, y: 200, label: 'Floor 5', value: 'Water runs', sub: 'Below the 22 m line', k: phase(T, at.line + 1.2, at.line + 1.5), color: '#3fb4ff' });
      ui.fact(g, { x: 1010, y: 460, label: 'Floor 14', value: 'Dry', sub: '9 floors higher', k: phase(T, at.line2 + 0.4, at.line2 + 0.8), color: '#ff4438' });
      g.restore();
    }
    const clock = CLOCKS.filter(([id]) => at[id] <= T).pop();
    if (clock && !schema && T < at.ask_b) ui.clock(g, clock[1]);
    if (T >= at.math_b && T < at.ask_b && !schema) {
      const water = T >= at.payoff + 1 ? '17 L' : '7 L';
      ui.gauge(g, { label: 'WATER LEFT', value: water, warn: T < at.payoff + 1, k: T >= at.payoff + 1 ? 1 - phase(T, at.payoff + 1, at.payoff + 1.4) : 0 });
    }
    const counting = (T >= at.stairs && T < at.street) || (T >= at.back && T < at.running) || (T >= at.carry && T < at.payoff);
    if (counting) ui.gauge(g, { label: 'FLOOR', value: String(S.floor ?? 14), x: 1740 });
    if (T >= at.rule3 && T < at.stairs) ui.rule(g, { label: 'Rule #3', text: 'One flush = 6 liters', result: '= 3 days of water', k: pop(at.rule3, at.stairs) });
    if (T >= at.store + 1.8 && T < at.gas) ui.rule(g, { label: 'Stores without generators', text: 'Closed within ≈ 2 hours', k: pop(at.store + 1.8, at.gas) });
    if (T >= at.clock + 2 && T < at.deal) ui.rule(g, { label: 'Emergency plan target', text: '72 hours', k: pop(at.clock + 2, at.deal) });
    if (T >= at.deal && T < at.carry) ui.rule(g, { label: "Marek's rule", text: 'One bucket per apartment', k: pop(at.deal, at.carry) });
    if (T >= at.carry && T < at.payoff) ui.rule(g, { label: 'The climb', text: '10 L = 10 kg · 9 floors', k: pop(at.carry + 0.1, at.payoff) });
    if (T >= at.payoff + 1 && T < at.hall) ui.rule(g, { label: 'Two people', text: '17 L ÷ 4 L a day', result: '= 4.25 days', k: pop(at.payoff + 1, at.hall) });
    if (T >= at.marek + 1.5 && T < at.clock + 2) ui.nameTag(g, { name: 'Marek', info: '52 · Apt 5C', x: 1400, y: 780, k: pop(at.marek + 1.5, at.clock + 2) });
    if (T >= at.ask_b && T < at.b1) ui.cover(g, { lines: ['Would you', '*tell them?*'], cx: 470, y: 460, size: 170, alpha: phase(T, at.ask_b, at.ask_b + 0.2) });
    else if (T >= at.b1 + 2.4) ui.comment(g, { name: 'B', text: "No don't tell", cx: 470, y: 400, s: 0.86, k: pop(at.b1 + 2.4, at.b2 + 2.2) });
    if (T < at.ask_b || T >= at.b1) ui.words(g, T, chunks);
  },
});
