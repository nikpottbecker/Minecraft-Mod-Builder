// Laufzeit fuer "Was waere wenn"-Szenen.
//
// Eine Szene ist ein ES-Modul mit default export:
//   {
//     title, duration (s), fps, seed,
//     setup(ctx)               -> baut die Welt einmal auf
//     update(ctx, t, dt)       -> wird pro Frame in fester Reihenfolge aufgerufen (deterministisch)
//     overlay(g, t, ui, ctx)   -> zeichnet Texte/Zahlen auf das fertige Bild (Canvas 2D)
//   }
// Alles ist frame-basiert statt echtzeit-basiert, damit jedes Rendering identisch ist.

import * as THREE from 'three';
import { blocks } from './blocks.js';
import { ui } from './ui.js';
import * as motion from './motion.js';
import { createLook } from './look.js';

export const WIDTH = 1080;
export const HEIGHT = 1920;

export function createRng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(next.range(min, max + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}

export async function boot(sceneUrl, { scale = 1, live = false, quality = 'final' } = {}) {
  if (!sceneUrl) throw new Error('Parameter ?scene=... fehlt');
  const display = new FontFace('Anton', 'url(/runtime/fonts/anton-latin-400-normal.woff2)');
  document.fonts.add(await display.load());
  const mod = await import(new URL(sceneUrl, location.origin + '/').href);
  const def = mod.default;
  const fps = def.fps || 30;
  const duration = def.duration || 15;
  const totalFrames = Math.round(duration * fps);
  const w = Math.round(WIDTH * scale);
  const h = Math.round(HEIGHT * scale);

  const glCanvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const out = document.getElementById('out');
  out.width = w;
  out.height = h;
  const g = out.getContext('2d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 3000);
  const rng = createRng(def.seed ?? 1);

  const ctx = {
    THREE, scene, camera, renderer, rng,
    width: w, height: h, scale, fps, duration, totalFrames,
    blocks: blocks(THREE, rng),
    motion,
    state: {},
    // Hilfsfunktionen fuer Zeitachsen
    clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    smooth: (t) => t * t * (3 - 2 * t),
    phase: (t, start, end) => Math.min(1, Math.max(0, (t - start) / (end - start))),
    lerp: (a, b, k) => a + (b - a) * k,
    // Fokus-Distanz fuer die Tiefenunschaerfe (m). Szene setzt sie pro Frame, z. B. auf das Motiv.
    focus: 10,
    aperture: null,
    t: 0,
    // Soundeffekt zum aktuellen Zeitpunkt der Simulation ausloesen (bildgenau).
    // name = Effekt aus audio/sfx.mjs, opts: { gain (dB), pan (-1..1), dur (s), pitch }
    sound(name, opts = {}) {
      cues.push({ t: ctx.t, name, ...opts });
    },
  };
  const cues = [];

  await def.setup(ctx);
  const look = createLook(THREE, { renderer, scene, camera, width: w, height: h, look: def.look, quality });

  let frame = -1;
  const step = () => {
    frame += 1;
    const t = frame / fps;
    ctx.t = t;
    def.update?.(ctx, t, 1 / fps);
  };

  const draw = () => {
    const t = frame / fps;
    look.setFocus(ctx.focus, ctx.aperture);
    look.render();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(glCanvas, 0, 0);
    // Overlays werden immer in 1080x1920-Koordinaten gezeichnet und skaliert.
    g.setTransform(scale, 0, 0, scale, 0, 0);
    def.overlay?.(g, t, ui, ctx);
  };

  // Rendert Frame i. Frames muessen aufsteigend abgefragt werden, weil die
  // Simulation schrittweise laeuft; uebersprungene Frames werden nur simuliert.
  const renderFrame = (i) => {
    if (i < frame) throw new Error(`Frame ${i} liegt vor dem aktuellen Frame ${frame}`);
    while (frame < i) step();
    draw();
  };

  window.__sim = {
    meta: { title: def.title, fps, duration, totalFrames, width: w, height: h, sources: def.sources || [] },
    frame(i, type = 'image/jpeg', quality = 0.93) {
      renderFrame(i);
      return out.toDataURL(type, quality);
    },
    // Nur simulieren (ohne Bild): liefert Sound-Cues und Variablen fuer Ton und Stimme.
    simulate() {
      while (frame < totalFrames - 1) step();
      return { cues, vars: def.vars ? def.vars(ctx) : {} };
    },
  };
  window.__simReady = true;

  if (live) {
    const tick = () => {
      if (frame + 1 >= totalFrames) return;
      renderFrame(frame + 1);
      setTimeout(tick, 1000 / fps);
    };
    tick();
  }
}
