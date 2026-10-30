// Tag 1: Bilder aus Part 1, dazu echte Blackouts und die Druck-Erklaerung.
import orig from '../blackout.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'dark');
const T_DROP = at.peak + 1.1;
const CLOCKS = [['dinner', '6:42 PM'], ['tap', '7:20 PM'], ['helen', '9:15 PM'], ['knock', '11:08 PM']];

export default remix(orig, {
  title: 'Day 1', start: c.start, end: c.end, lines: c.lines, card: c.card,
  // Die Fensterwelle ist im Original nach 2,5 s vorbei; hier bleibt die Stadt lange im Bild
  after(ctx, T) {
    if (T >= at.real1 && !ctx.state.allDark) {
      ctx.state.allDark = true;
      ctx.state.paintWindows(1e4);
    }
  },
  overlay(g, T, ui, ctx, { pop }) {
    const { phase, motion } = ctx;
    ui.vignette(g, 0.5);
    const schema = T >= at.press - 0.05 && T < at.count;
    if (schema) {
      const level = T < T_DROP ? 18 : 18 - 11 * motion.ease.inOutCubic(phase(T, T_DROP, T_DROP + 1));
      const shake = T >= T_DROP ? motion.shake(T, T_DROP, { amp: 10, decay: 5 }) : [0, 0, 0];
      g.save();
      g.translate(shake[0], shake[1]);
      ui.section(g, { alpha: phase(T, at.press - 0.05, at.press + 0.2) * (1 - phase(T, at.count - 0.3, at.count)), level, pump: T < T_DROP ? 1 : 0, showMains: phase(T, at.press + 0.8, at.press + 1.2) });
      g.restore();
      const a = 1 - phase(T, at.count - 0.3, at.count);
      if (a > 0) {
        g.save();
        g.globalAlpha = a;
        ui.fact(g, { x: 1010, y: 80, label: 'Street pressure reaches', value: '≈ 22 m', sub: 'About floor 7', k: phase(T, at.press + 0.8, at.press + 1.2) });
        ui.fact(g, { x: 1010, y: 330, label: 'Height costs pressure', value: '10 m ≈ 1 bar', k: phase(T, at.bar + 0.2, at.bar + 0.6), color: '#3fb4ff' });
        ui.fact(g, { x: 1010, y: 530, label: 'Your kitchen', value: '42 m', sub: 'Only electric pumps get water here', k: phase(T, at.pumps + 0.2, at.pumps + 0.6), color: '#ff4438' });
        g.restore();
      }
      ui.flash(g, 0.5 * (1 - phase(T, T_DROP, T_DROP + 0.25)) * (T >= T_DROP ? 1 : 0), '#ff4438');
    }
    const clock = CLOCKS.filter(([id]) => at[id] <= T).pop();
    if (clock && !schema) ui.clock(g, clock[1]);
    if (T >= at.real1 && T < at.phone - 0.3) {
      const out = 1 - phase(T, at.phone - 0.6, at.phone - 0.3);
      ui.fact(g, { x: 110, y: 170, w: 820, label: '28 April 2025 · Spain and Portugal', value: '≈ 60 million', sub: 'People without power', k: phase(T, at.real1 + 2.4, at.real1 + 2.8) * out, color: '#ffd23f' });
      ui.fact(g, { x: 990, y: 170, w: 820, label: 'January 2026 · Berlin', value: '≈ 45,000', sub: 'Households · Up to 4 days', k: phase(T, at.real2 + 1.6, at.real2 + 2) * out, color: '#ff4438' });
    }
    if (T >= at.mast + 0.7 && T < at.lift) ui.rule(g, { label: 'Cell tower backup', text: '≈ 2 hours of battery', k: pop(at.mast + 0.7, at.lift) });
    if (T >= at.rule1 && T < at.tap) ui.rule(g, { label: 'Rule #1', text: 'Stay out of the elevator', k: pop(at.rule1, at.tap) });
    if (T >= at.math && T < at.fridge) ui.rule(g, { label: 'Your water', text: '9 L ÷ 2 L a day', result: '= 4.5 days', k: pop(at.math + 0.1, at.fridge) });
    if (T >= at.fridge && T < at.helen) ui.rule(g, { label: 'Rule #2', text: 'Fridge stays shut', result: 'Cold for 4–6 h', k: pop(at.fridge, at.helen) });
    if (T >= at.helen + 1.6 && T < at.share) ui.nameTag(g, { name: 'Helen', info: '81 · Apt 14B', x: 1400, y: 780, k: pop(at.helen + 1.6, at.share) });
    if (T >= at.share && T < at.knock) ui.rule(g, { label: 'You + Helen', text: '9 L ÷ 2 people ÷ 2 L', result: '= 2.25 days', k: pop(at.share + 0.1, at.knock) });
    if (T >= at.ask) ui.cover(g, { lines: ['Would you', '*open it?*'], cx: 470, y: 460, size: 170, alpha: phase(T, at.ask, at.ask + 0.2) });
    else ui.words(g, T, chunks);
  },
});
