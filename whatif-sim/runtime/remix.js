// Spielt eine fertige Hochformat-Szene in neuer Zeitachse ab: Jede neue Zeile sagt, welche Stelle
// der Originalszene sie zeigt. Die Originaldatei bleibt unberuehrt; Overlays kommen neu.
import { wide } from './ui-wide.js';

// Zeitachse eines Abschnitts: [{ L, end, B, r }], L = Start neu, B = Start im Original, r = Tempo.
export function warpTable(lines, origAt, end) {
  const rows = lines.map((l) => {
    const [id, off = 0, rate = null] = Array.isArray(l.v) ? l.v : [l.v ?? l.src ?? l.id];
    if (origAt[id] == null) throw new Error(`Kein Bild „${id}“ im Original (Zeile ${l.id})`);
    return { id: l.id, L: l.at, B: origAt[id] + off, rate };
  });
  rows.forEach((row, i) => {
    const next = rows[i + 1];
    row.end = next ? next.L : end;
    const span = next && next.B > row.B ? next.B - row.B : null;
    row.limit = span != null ? next.B - 0.04 : Infinity;
    row.r = row.rate ?? (span != null ? Math.min(1, span / (row.end - row.L)) : 0.25);
  });
  return rows;
}

export function warp(rows, T) {
  const row = rows.findLast((x) => x.L <= T) ?? rows[0];
  return { row, t: Math.min(row.limit, row.B + Math.max(0, T - row.L) * row.r) };
}

// Abschnitt als eigene Szene. opts: { start, end, lines, overlay(g, T, ui, ctx, api), card, fix }
export function remix(orig, { title, start, end, lines, overlay, card, after, seed }) {
  const origAt = Object.fromEntries(orig.story.beats.map((b) => [b.id, b.at]));
  const rows = warpTable(lines, origAt, end);
  const first = Math.round(start * (orig.fps || 30)) / (orig.fps || 30);
  const S0 = {};
  return {
    title,
    format: 'wide',
    fps: orig.fps || 30,
    seed: seed ?? orig.seed,
    look: orig.look,
    duration: +(end - first).toFixed(3),
    story: { hook: title, beats: lines.map((l) => ({ ...l, at: l.at - first })) },

    async setup(ctx) {
      const sound = ctx.sound;
      ctx.sound = (name, o = {}) => {
        if (S0.muted || (o.dur ?? 0) > 6) return;
        sound(name, o);
      };
      S0.last = null;
      await orig.setup(ctx);
    },

    update(ctx, t, dt) {
      const T = t + first;
      const { row, t: src } = warp(rows, T);
      const S = ctx.state;
      const jump = S0.last == null || Math.abs(src - S0.last) > 0.5;
      S0.muted = jump;
      if (jump && S.cues) {
        S.cueI = S.cues.findIndex((c) => c[0] >= src);
        if (S.cueI < 0) S.cueI = S.cues.length;
      }
      orig.update(ctx, src, dt);
      S0.muted = false;
      S0.last = src;
      S.lastSrc = src;
      after?.(ctx, T, src);
      // Langsame Stellen: Kamera faehrt sacht weiter, damit das Bild lebt
      if (row.r < 0.7) {
        const d = ctx.camera.getWorldDirection(new ctx.THREE.Vector3());
        ctx.camera.position.addScaledVector(d, Math.min(0.5, (ctx.focus || 6) * 0.012) * (T - row.L));
      }
    },

    overlay(g, t, ui, ctx) {
      const T = t + first;
      const phase = ctx.phase;
      const pop = (a, b) => ctx.motion.ease.outBack(phase(T, a, a + 0.3)) * (1 - phase(T, b - 0.2, b));
      const shot = ctx.state.rig.list[ctx.state.rig.current(warp(rows, T).t)];
      overlay(g, T, wide, ctx, { pop, set: shot.set, src: warp(rows, T).t });
      wide.fade(g, 1 - phase(t, 0, 0.45));
      if (card) wide.chapter(g, { lines: card, alpha: phase(T, end - 2.05, end - 1.75) });
      else wide.fade(g, phase(T, end - 0.5, end));
    },
  };
}
