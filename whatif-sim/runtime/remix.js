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

// Bildzeilen im selben Shot schliessen nahtlos an die vorige Zeile an, sonst ruckelt die Kamera.
export function stitch(rows, sameShot) {
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    if (!prev || row.rate == null) return;
    const end = Math.min(prev.limit, prev.B + (prev.end - prev.L) * prev.r);
    if (sameShot(end, row.B) && Math.abs(row.B - end) < 3) row.B = end;
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
      S0.drift = 0;
      await orig.setup(ctx);
      const rig = ctx.state.rig;
      stitch(rows, (a, b) => rig.current(a) === rig.current(b));
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
      // Blinzeln in echter Zeit: in langsamen Zeilen blieben die Augen sonst sekundenlang zu
      [S.you, S.helen, S.marek].forEach((c, i) => {
        if (c) ctx.blocks.blink(c, ((T + i * 1.1) * 0.36) % 1 < 0.05 ? 1 : 0);
      });
      // Langsame Stellen: Kamera faehrt sacht weiter; die Fahrt laeuft ueber Zeilen hinweg bis zum Schnitt
      const shotNow = S.rig.current(src);
      if (shotNow !== S0.shot) S0.drift = 0;
      S0.shot = shotNow;
      if (row.r < 0.7) S0.drift = Math.min(1.4, S0.drift + dt * 0.03);
      if (S0.drift > 0) {
        const d = ctx.camera.getWorldDirection(new ctx.THREE.Vector3());
        ctx.camera.position.addScaledVector(d, Math.min(1, (ctx.focus || 6) / 6) * S0.drift);
      }
    },

    overlay(g, t, ui, ctx) {
      const T = t + first;
      const phase = ctx.phase;
      const pop = (a, b) => ctx.motion.ease.outBack(phase(T, a, a + 0.3)) * (1 - phase(T, b - 0.2, b));
      const shot = ctx.state.rig.list[ctx.state.rig.current(warp(rows, T).t)];
      overlay(g, T, wide, ctx, { pop, set: shot.set, src: warp(rows, T).t });
      wide.fade(g, 1 - phase(t, 0, 0.45));
      const line = lines.findLast((l) => l.at <= T);
      if (line?.q) wide.sourceTag(g, line.q);
      if (card) wide.chapter(g, { lines: card, alpha: phase(T, end - 2.05, end - 1.75) });
      else wide.fade(g, phase(T, end - 0.5, end));
    },
  };
}
