// Nacht 3: Bilder aus Part 4, dazu Sicherheitswissen und Lastspitze.
import orig from '../blackout4.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'knocks');
const CLOCKS = [['now', 'DAY 3 · 7:58 PM'], ['nobody', '8:05 PM'], ['wait', '8:41 PM'], ['crew', '8:52 PM'], ['payoff_d', '9:30 PM'], ['lights', '9:47 PM']];
const grades = { room: '#ffe2c4', city: '#c3cfea', stairs: '#d8cdc2' };

export default remix(orig, {
  title: 'Night 3', start: c.start, end: c.end, lines: c.lines, card: c.card,
  // In der Breite wuerde Helen riesig ins Fensterbild ragen
  after(ctx) {
    const S = ctx.state;
    const pose = S.rig.list[S.rig.current(S.lastSrc ?? 0)]?.pose;
    if (pose === 'window' || pose === 'signal') S.helen.visible = false;
  },
  overlay(g, T, ui, ctx, { pop, set }) {
    const { phase } = ctx;
    ui.grade(g, { color: grades[set], edge: 0.7 });
    ui.haze(g, 0.14 * (1 - phase(T, at.seal, at.seal + 1.4)));
    ui.vignette(g, 0.45);
    const graph = T >= at.cold - 0.2 && T < at.trip;
    const clock = CLOCKS.filter(([id]) => at[id] <= T).pop();
    if (clock && T < at.ask_d) ui.clock(g, clock[1]);
    if (T < at.ask_d && !graph) {
      const litres = T >= at.towels + 1.6 ? '9 L' : '11 L';
      ui.gauge(g, { label: 'WATER LEFT', value: litres, warn: true, k: 1 - phase(T, at.towels + 1.6, at.towels + 2) });
    }
    if (T < at.seal + 1.2) ui.gauge(g, { label: 'SMOKE', value: 'FLOOR 13', warn: true, x: 1640 });
    if (T >= at.crews + 0.2 && T < at.lungs) ui.rule(g, { label: 'Fire crews', text: 'Smoke in stairs? Stay in.', k: pop(at.crews + 0.2, at.lungs) });
    if (T >= at.lungs + 0.3 && T < at.rule5) ui.rule(g, { label: 'In home fires', text: 'Smoke kills more than flames', k: pop(at.lungs + 0.3, at.rule5) });
    if (T >= at.rule5 && T < at.hand) ui.rule(g, { label: 'Rule #5', text: 'A closed door buys time', k: pop(at.rule5, at.hand) });
    if (T >= at.hand + 0.8 && T < at.towels) ui.rule(g, { label: 'Before opening a door', text: 'Back of your hand', result: 'Hot? Keep it shut', k: pop(at.hand + 0.8, at.towels) });
    if (T >= at.call + 0.4 && T < at.ladder) ui.rule(g, { label: 'Always first', text: 'Call emergency services', k: pop(at.call + 0.4, at.ladder) });
    if (T >= at.ladder + 0.2 && T < at.phone_d) ui.rule(g, { label: 'Your window', text: '42 m · Ladder ≈ 23 m', k: pop(at.ladder + 0.2, at.phone_d) });
    if (T >= at.phone_d + 1.6 && T < at.wave) ui.rule(g, { label: "Helen's phone", text: '3% battery', k: pop(at.phone_d + 1.6, at.wave) });
    if (graph) {
      ui.surge(g, { u: phase(T, at.cold + 2, at.trip - 1.2), alpha: phase(T, at.cold - 0.2, at.cold + 0.3) * (1 - phase(T, at.trip - 0.3, at.trip)) });
    }
    if (T >= at.ask_d) ui.cover(g, { lines: ['Would you', '*go back?*'], cx: 470, y: 460, size: 170, alpha: phase(T, at.ask_d, at.ask_d + 0.2) });
    else ui.words(g, T, chunks);
  },
});
