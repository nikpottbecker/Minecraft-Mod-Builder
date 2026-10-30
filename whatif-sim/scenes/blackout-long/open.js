// Kalter Einstieg: Bilder aus Part 4.
import orig from '../blackout4.js';
import { remix } from '../../runtime/remix.js';
import { chapters, chunks, at } from '../blackout-long.js';

const c = chapters.find((x) => x.id === 'open');
const grades = { room: '#ffe2c4', city: '#c3cfea', stairs: '#d8cdc2' };

export default remix(orig, {
  title: 'Cold open', start: c.start, end: c.end, lines: c.lines, card: c.card,
  after(ctx) {
    const S = ctx.state;
    const pose = S.rig.list[S.rig.current(S.lastSrc ?? 0)]?.pose;
    if (pose === 'window' || pose === 'signal') S.helen.visible = false;
  },
  overlay(g, T, ui, ctx, { set }) {
    ui.grade(g, { color: grades[set], edge: 0.7 });
    if (set === 'city') {
      // Die Stadtnacht ist in 16:9 zu dunkel: sanft aufhellen
      g.save();
      g.globalCompositeOperation = 'screen';
      g.fillStyle = '#0d1630';
      g.fillRect(0, 0, ui.W, ui.H);
      g.restore();
    }
    ui.vignette(g, 0.45);
    if (T >= at.o2 && T < at.o4) ui.gauge(g, { label: 'SMOKE', value: 'FLOOR 13', warn: true, x: 1640, y: 26 });
    if (T >= at.o5) ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], y: 400, size: 150, alpha: ctx.phase(T, at.o5, at.o5 + 0.3) });
    else ui.words(g, T, chunks);
  },
});
