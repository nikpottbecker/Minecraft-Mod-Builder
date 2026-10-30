// Bewegungs-Werkzeuge: Easing, Federn, Keyframes, Kamera-Einstellungen, Wackeln.
// Grundregel: Nichts bewegt sich linear. Alles beschleunigt und bremst (Easing).

const clamp01 = (t) => Math.min(1, Math.max(0, t));

export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  inCubic: (t) => t ** 3,
  outCubic: (t) => 1 - (1 - t) ** 3,
  inOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  // Schiesst kurz ueber das Ziel hinaus: gut fuer Text/Objekte, die "aufploppen".
  outBack: (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
  // Holt kurz Schwung (Antizipation) und bewegt sich dann.
  inBack: (t, s = 1.70158) => (s + 1) * t ** 3 - s * t ** 2,
};

// Gedaempfte Feder von 0 nach 1. freq = Schwingungen pro Sekunde, damping = Abklingrate.
export function spring(seconds, { freq = 3, damping = 7 } = {}) {
  if (seconds <= 0) return 0;
  return 1 - Math.exp(-damping * seconds) * Math.cos(2 * Math.PI * freq * seconds);
}

// Fortschritt 0..1 zwischen start und end, mit Easing.
export function tween(t, start, end, easing = ease.inOutCubic) {
  return easing(clamp01((t - start) / (end - start)));
}

// Keyframes: [[zeit, wert], ...]; Werte duerfen Zahlen oder Arrays sein.
export function keyframes(t, frames, easing = ease.inOutCubic) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      const k = easing((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * k) : v0 + (v1 - v0) * k;
    }
  }
  return frames[frames.length - 1][1];
}

// Abklingendes Wackeln nach einem Ereignis bei t0 (Aufprall, Explosion).
// Deterministisch: gleiche Zeit -> gleiche Verschiebung.
export function shake(t, t0, { amp = 0.4, decay = 5, freq = 23 } = {}) {
  if (t0 == null || t < t0) return [0, 0, 0];
  const d = t - t0;
  const a = amp * Math.exp(-decay * d);
  return [a * Math.sin(d * freq * 6.283), a * Math.sin(d * freq * 5.1 + 1.3) * 0.7, a * Math.sin(d * freq * 4.3 + 2.1) * 0.5];
}

// Kamera-Einstellungen (Shots). Jeder Shot ab Zeit `at`:
//   { at, pos: [x,y,z] | (t, ctx) => [x,y,z], look: ..., fov, blend, move }
//   blend = Sekunden weiche Ueberblendung vom vorherigen Shot (0 = harter Schnitt)
//   move  = { pos, look, fov, dur, easing } — Kamerafahrt innerhalb des Shots
//   focus = Punkt [x,y,z] oder Funktion fuer die Schaerfe (Standard: look), aperture = Unschaerfe-Staerke
//   Setzt ctx.focus/ctx.aperture, damit die Tiefenunschaerfe dem Motiv folgt.
// Liefert apply(camera, t, ctx, extraOffset) und current(t) (Index des aktiven Shots).
export function shots(THREE, list) {
  const sorted = [...list].sort((a, b) => a.at - b.at);
  const val = (v, t, ctx) => (typeof v === 'function' ? v(t, ctx) : v);
  const evalShot = (s, t, ctx) => {
    let pos = val(s.pos, t, ctx);
    let look = val(s.look, t, ctx);
    let fov = s.fov ?? 50;
    if (s.move) {
      const k = (s.move.easing || ease.inOutCubic)(clamp01((t - s.at) / (s.move.dur || 2)));
      const lerp3 = (a, b) => a.map((x, i) => x + (b[i] - x) * k);
      if (s.move.pos) pos = lerp3(pos, val(s.move.pos, t, ctx));
      if (s.move.look) look = lerp3(look, val(s.move.look, t, ctx));
      if (s.move.fov != null) fov += (s.move.fov - fov) * k;
    }
    return { pos, look, fov };
  };
  const current = (t) => {
    let i = 0;
    while (i + 1 < sorted.length && sorted[i + 1].at <= t) i++;
    return i;
  };
  const look = new THREE.Vector3();
  return {
    list: sorted,
    current,
    apply(camera, t, ctx, offset = [0, 0, 0]) {
      const i = current(t);
      const s = sorted[i];
      let v = evalShot(s, t, ctx);
      if (i > 0 && s.blend > 0 && t - s.at < s.blend) {
        const prev = evalShot(sorted[i - 1], t, ctx);
        const k = ease.inOutCubic((t - s.at) / s.blend);
        const mix = (a, b) => a.map((x, j) => x + (b[j] - x) * k);
        v = { pos: mix(prev.pos, v.pos), look: mix(prev.look, v.look), fov: prev.fov + (v.fov - prev.fov) * k };
      }
      camera.position.set(v.pos[0] + offset[0], v.pos[1] + offset[1], v.pos[2] + offset[2]);
      look.set(v.look[0] + offset[0] * 0.5, v.look[1] + offset[1] * 0.5, v.look[2] + offset[2] * 0.5);
      camera.lookAt(look);
      if (ctx) {
        const f = s.focus ? val(s.focus, t, ctx) : v.look;
        ctx.focus = Math.hypot(f[0] - v.pos[0], f[1] - v.pos[1], f[2] - v.pos[2]);
        ctx.aperture = s.aperture ?? null;
      }
      if (camera.fov !== v.fov) {
        camera.fov = v.fov;
        camera.updateProjectionMatrix();
      }
    },
  };
}
