// Snowed in, Part 1: "The last exit". Plan: plans/serie-snowed-in.md. Stimme gibt das Timing vor.

import script from './snowed1.script.js';
import timing from './snowed1.timing.js';
import { layout } from '../runtime/narration.js';
import { hero } from '../runtime/hero.js';

const { beats, chunks, at, duration } = layout(script.lines, timing, { tail: 5 });

const CLOCKS = [
  ['drive', '6:40 PM'],
  ['night', '9:40 PM'],
  ['beside', '11:15 PM'],
];
const DARK = at.dark + 0.25;

export default {
  title: 'Snowed in, Part 1',
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'Snowed in', part: 1 },
  caption: {
    scenario: 'The highway stopped and your tank is a quarter full',
    emoji: '🌨️🚗',
    question: 'Engine on or off?',
    tags: ['snowstorm', 'whatif', 'survival', 'scenario', 'winter', 'highway'],
  },
  duration,
  fps: 30,
  seed: 61,
  look: {
    env: 0.14,
    ao: { radius: 0.5, intensity: 0.7 },
    dof: { aperture: 1.2, maxblur: 0.012 },
    bloom: { strength: 0.42, radius: 0.55, threshold: 1.25 },
  },
  sources: [
    'Stay with your vehicle, whiteout makes it easy to lose your way: US National Weather Service, weather.gov/safety/winter-during',
    '84 km of queued traffic on the A5 after a winter storm: hessenschau',
    'Temperature, times and the story are fictional',
  ],
  music: {
    bpm: 72,
    gain: -10,
    duck: 0.72,
    sections: [
      { at: 0, mood: 'dread' },
      { at: at.drive, mood: 'pulse' },
      { at: at.brake, mood: 'suspense' },
      { at: at.walk, mood: 'dread' },
      { at: at.beside, mood: 'silence' },
      { at: DARK, mood: 'dread' },
      { at: at.choice, mood: 'build' },
      { at: at.ask, mood: 'silence' },
      { at: at.ask + 1.6, mood: 'suspense' },
    ],
  },
  story: { hook: 'The highway stopped 3 hours ago. Your tank is a quarter full.', beats },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;
    scene.background = new THREE.Color('#141c3a');
    scene.fog = new THREE.Fog('#1d2748', 14, 110);
    S.hemi = new THREE.HemisphereLight('#a9bce8', '#54607e', 0.8);
    scene.add(S.hemi);
    const moon = new THREE.DirectionalLight('#b9caf2', 0.8);
    moon.position.set(-20, 40, 30);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 5, far: 120 });
    scene.add(moon);
    const group = () => {
      const g = new THREE.Group();
      scene.add(g);
      return g;
    };
    const mk = (g, w, h, d, color, x, y, z, opts = {}) => {
      const m = b.box(w, h, d, color, { x, y, z, r: 0.02, ...opts });
      g.add(m);
      return m;
    };
    const glow = (r, g2, bl) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g2, bl) });

    // ---------- Autobahn ----------
    const road = group();
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), b.mat('#cdd7ea', { roughness: 0.9 }));
    snow.rotation.x = -Math.PI / 2;
    snow.receiveShadow = true;
    road.add(snow);
    mk(road, 13, 0.03, 700, '#98a2b6', 0, 0.02, -200, { r: 0.002 });
    for (const lx of [-2.2, 2.2]) mk(road, 0.14, 0.04, 700, '#b9c3d6', lx, 0.03, -200, { r: 0.002 });
    for (const tx of [-3.8, -0.5, 0.5, 3.8]) mk(road, 0.38, 0.03, 700, '#7a8498', tx, 0.035, -200, { r: 0.002 });
    S.posts = [];
    for (let i = 0; i < 26; i++) {
      for (const sx of [-8, 8]) {
        const p = mk(road, 0.14, 1.1, 0.14, '#e8e8e8', sx, 0.55, -i * 16);
        S.posts.push(p);
      }
    }
    for (let i = 0; i < 46; i++) {
      const t = b.tree();
      const s = rng() < 0.5 ? -1 : 1;
      t.position.set(s * rng.range(14, 40), 0, -rng.range(-20, 240));
      t.scale.setScalar(rng.range(1.2, 2.2));
      t.traverse((m) => {
        if (m.material?.color) m.material = m.material.clone();
        if (m.material?.color) m.material.color.lerp(new THREE.Color('#dfe6f4'), 0.55);
      });
      road.add(t);
    }
    // Autos: Du fährst in der Mitte, die Schlange steht vor und neben dir
    const carRig = (color, x, z) => {
      const g = new THREE.Group();
      const c = b.car(color);
      c.rotation.y = Math.PI / 2;
      g.add(c);
      g.position.set(x, 0, z);
      const tails = [-0.62, 0.62].map((sx) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.05), glow(3.4, 0.25, 0.2));
        t.position.set(sx, 0.86, 2.08);
        g.add(t);
        return t;
      });
      const heads = [-0.6, 0.6].map((sx) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.05), glow(3, 2.8, 2.2));
        t.position.set(sx, 0.78, -2.08);
        g.add(t);
        return t;
      });
      g.add(b.box(1.7, 0.1, 1.7, '#eef2f8', { y: 1.72, z: 0.1, r: 0.05 }));
      g.userData.tails = tails;
      g.userData.heads = heads;
      road.add(g);
      return g;
    };
    S.mine = carRig('#c9352c', 0, 0);
    S.cars = [];
    const colors = ['#2f6fe0', '#e7c43a', '#8e96a8', '#2e9a7c', '#d9d9de', '#6d5bb0', '#b0412f'];
    for (let row = 0; row < 26; row++) {
      for (const lane of [-1, 0, 1]) {
        if (lane === 0 && row === 0) continue;
        const c = carRig(colors[(row * 3 + lane + 8) % colors.length], lane * 3.3 + rng.range(-0.2, 0.2), -row * 7 + rng.range(-0.6, 0.6));
        S.cars.push(c);
      }
    }
    S.neighbor = S.cars[0]; // Spur links, gleiche Reihe
    S.brake = new THREE.PointLight('#ff3a2a', 0, 40, 1.2);
    S.brake.position.set(0, 2, -12);
    road.add(S.brake);
    S.headlamp = new THREE.PointLight('#fff0d0', 8, 22, 1.3);
    S.headlamp.position.set(0, 1.6, -5);
    road.add(S.headlamp);

    // ---------- Innenraum, von vorn durch die Scheibe ----------
    const cab = group();
    mk(cab, 2.6, 0.2, 2, '#26222a', 0, 0.75, -0.2);
    mk(cab, 2.6, 2, 0.2, '#1a1c28', 0, 1.3, 1.3);
    mk(cab, 2.5, 0.42, 0.7, '#2c2e3a', 0, 1.12, -1.2);
    mk(cab, 2.5, 0.12, 2.6, '#2f3240', 0, 2.5, -0.1);
    mk(cab, 0.12, 1.5, 0.12, '#30323e', -1.25, 1.8, -1.5);
    mk(cab, 0.12, 1.5, 0.12, '#30323e', 1.25, 1.8, -1.5);
    mk(cab, 0.5, 1.3, 0.14, '#3a3c48', -0.6, 1.3, 1.1, { r: 0.08 });
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 12, 36), b.mat('#16171d'));
    wheel.position.set(-0.6, 1.5, -0.7);
    wheel.rotation.x = -0.25;
    cab.add(wheel);
    S.dash = new THREE.PointLight('#7fb2ff', 3.5, 4, 1.4);
    S.dash.position.set(-0.5, 1.35, -0.75);
    cab.add(S.dash);
    S.wipers = [-0.55, 0.45].map((x) => {
      const p = new THREE.Group();
      p.position.set(x, 1.38, -1.62);
      p.add(b.box(0.05, 1.05, 0.03, '#0d0e13', { y: 0.52, r: 0.01 }));
      p.visible = false;
      cab.add(p);
      return p;
    });
    S.you = hero(THREE, b);
    S.you.position.set(-0.6, -0.14, 0.45);
    S.you.rotation.y = Math.PI / 2;
    cab.add(S.you);

    // ---------- Tankanzeige ----------
    const gaugeSet = group();
    mk(gaugeSet, 4, 3, 0.1, '#0b0d16', 0, 1.5, -0.4);
    const gc = document.createElement('canvas');
    gc.width = gc.height = 512;
    const g2 = gc.getContext('2d');
    g2.fillStyle = '#0b0d16';
    g2.fillRect(0, 0, 512, 512);
    g2.strokeStyle = '#dfe9ff';
    g2.lineWidth = 12;
    g2.beginPath();
    g2.arc(256, 300, 200, Math.PI * 1.1, Math.PI * 1.9);
    g2.stroke();
    g2.fillStyle = '#dfe9ff';
    g2.textAlign = 'center';
    g2.font = "400 58px 'Anton', sans-serif";
    g2.fillText('E', 78, 262);
    g2.fillText('F', 436, 262);
    g2.fillText('FUEL', 256, 400);
    g2.fillStyle = '#ff4438';
    g2.fillRect(120, 160, 20, 50);
    const gt = new THREE.CanvasTexture(gc);
    gt.colorSpace = THREE.SRGBColorSpace;
    const dial = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: gt }));
    dial.position.set(0, 1.5, -0.3);
    gaugeSet.add(dial);
    S.needle = new THREE.Group();
    S.needle.position.set(0, 1.27, -0.27);
    S.needle.add(b.box(0.06, 0.95, 0.02, '#ff4438', { y: 0.47, r: 0.01, material: glow(3, 0.5, 0.3) }));
    gaugeSet.add(S.needle);

    // ---------- Schneefall ----------
    const N = 1400;
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    const flake = document.createElement('canvas');
    flake.width = flake.height = 32;
    const fg = flake.getContext('2d');
    const fr = fg.createRadialGradient(16, 16, 1, 16, 16, 15);
    fr.addColorStop(0, 'rgba(255,255,255,1)');
    fr.addColorStop(1, 'rgba(255,255,255,0)');
    fg.fillStyle = fr;
    fg.fillRect(0, 0, 32, 32);
    S.flakes = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(flake), size: 0.13, color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    S.flakes.frustumCulled = false;
    S.flakeSeed = Array.from({ length: N }, () => [rng(), rng(), rng()]);
    scene.add(S.flakes);

    S.sets = { road, cab, gauge: gaugeSet };

    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'wind', { dur: duration, gain: -19 });
    add(0, 'engine', { dur: DARK + 0.1, gain: -20 });
    add(at.brake + 0.1, 'skid', { dur: 0.8, gain: -22 });
    add(at.brake - 0.25, 'whoosh', { gain: -16 });
    add(at.night - 0.3, 'whoosh', { gain: -18 });
    add(at.walk + 2.05, 'wind', { dur: 2.4, gain: -10 });
    add(at.walk + 1.8, 'creak', { dur: 0.5, gain: -12, pitch: 0.8 });
    add(at.beside + 2.5, 'rev', { dur: 0.7, gain: -18, pitch: 0.7 });
    add(at.dark - 0.5, 'heart', { gain: -9 });
    add(at.dark + 0.8, 'powerdown', { dur: 0.7, gain: -7 });
    add(at.empty - 0.4, 'heart', { gain: -11 });
    add(at.hours - 0.35, 'heart', { gain: -10 });
    add(at.ask + 1.6, 'whoosh', { gain: -12 });
    add(at.ask + 1.9, 'pop', { gain: -10 });
    add(at.ask + 2.2, 'pop', { gain: -10, pitch: 1.2 });
    add(at.ask + 2, 'riser', { dur: 2.6, gain: -14 });
    for (let t = at.ask + 1.8; t < duration - 0.8; t += 0.92) add(t, 'heart', { gain: -9 });
    S.cues = cue.sort((a, c) => a[0] - c[0]);
    S.cueI = 0;

    const c = ctx.coverMode;
    const facePt = [-0.6, 2.0, 0.6];
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, set: 'cab', aperture: 1.2, pos: [-0.5, 2.1, c ? -2.5 : -3.1], look: [-0.55, c ? 2.25 : 2.3, 0.4], fov: 46, move: { pos: [-0.5, 2.1, -2.8], dur: at.drive }, focus: facePt },
      { at: at.drive, set: 'road', driving: true, aperture: 0.25, pos: [2.8, 2.6, 8], look: [0, 1, -6], fov: 52, focus: [0, 1, 0] },
      { at: at.brake, set: 'road', aperture: 0.05, pos: [1.7, 3.1, 11], look: [0, 1.0, -30], fov: 44, move: { pos: [1.5, 3, 9.5], dur: 3 } },
      { at: at.stat, set: 'road', aperture: 0.05, pos: [15, 24, 14], look: [0, 0, -40], fov: 52, move: { pos: [14, 28, 8], dur: 4 } },
      { at: at.night, set: 'cab', aperture: 1.2, pos: [-0.5, 2.1, -2.9], look: [-0.55, 1.85, 0.4], fov: 42, move: { pos: [-0.5, 2.1, -2.5], dur: 4 }, focus: facePt },
      { at: at.plows, set: 'road', aperture: 0.08, pos: [-6, 3.2, 6], look: [1, 1, -40], fov: 50, move: { pos: [-5.5, 3.1, 4.5], dur: 3 } },
      { at: at.walk, set: 'cab', aperture: 1.2, pos: [-0.5, 2.1, -2.7], look: [-0.55, 1.95, 0.4], fov: 40, focus: facePt },
      { at: at.walk + 1.9, set: 'road', whiteout: true, aperture: 0.05, pos: [-1.4, 1.8, 3.2], look: [-6, 1.4, 14], fov: 50 },
      { at: at.rule1, set: 'road', whiteout: true, aperture: 0.05, pos: [-3.2, 1.7, 7], look: [0, 1.2, -1], fov: 50 },
      { at: at.beside, set: 'road', aperture: 0.2, pos: [-1.65, 1.8, 6.2], look: [-3.3, 1.1, 0], fov: 46, focus: [-3.3, 1, 1] },
      { at: at.dark, set: 'road', aperture: 0.2, pos: [-1.75, 1.7, 5.1], look: [-3.3, 1.05, 0.4], fov: 40, focus: [-3.3, 1, 1.5] },
      { at: at.empty, set: 'cab', aperture: 1.5, pos: [-0.5, 2.1, -2.5], look: [-0.55, 2.0, 0.4], fov: 38, focus: facePt },
      { at: at.empty + 2.3, set: 'gauge', aperture: 0.1, pos: [0, 1.5, 3.9], look: [0, 0.95, 0], fov: 42 },
      { at: at.hours, set: 'road', aperture: 0.05, pos: [4, 8, 24], look: [0, 0.5, -40], fov: 46, move: { pos: [4, 9, 20], dur: 2 } },
      { at: at.choice, set: 'cab', aperture: 1.4, pos: [-0.5, 2.1, -2.3], look: [-0.55, 2.02, 0.4], fov: 38, focus: facePt },
      { at: at.ask, set: 'cab', aperture: 1.2, pos: [-0.5, 2.1, -2.7], look: [-0.55, 2.3, 0.4], fov: 46, focus: facePt },
    ]);
  },

  update(ctx, t, dt) {
    const { state: S, blocks: b, phase, motion } = ctx;
    while (S.cueI < S.cues.length && S.cues[S.cueI][0] <= t) {
      const [, name, opts] = S.cues[S.cueI++];
      ctx.sound(name, opts);
    }
    const shot = S.rig.list[S.rig.current(t)];
    for (const [name, g] of Object.entries(S.sets)) g.visible = name === shot.set;
    const night = t >= at.night;
    ctx.scene.background.set(shot.whiteout ? '#aab6cf' : night ? '#0e1430' : '#2a3760');
    ctx.scene.fog.color.set(shot.whiteout ? '#aab6cf' : night ? '#141c3a' : '#3a4a78');
    ctx.scene.fog.near = shot.whiteout ? 0.6 : 16;
    ctx.scene.fog.far = shot.whiteout ? 7 : t >= at.brake ? 130 : 70;
    S.hemi.intensity = shot.whiteout ? 1.5 : night ? 0.65 : 1;

    const stopped = t >= at.brake;
    S.cars.forEach((c) => (c.visible = stopped));
    S.brake.intensity = stopped ? 34 : 0;
    S.cars.forEach((c, i) => c.userData.tails.forEach((m) => (m.visible = stopped)));
    S.mine.userData.tails.forEach((m) => (m.visible = stopped));
    const dead = t >= DARK;
    S.neighbor.userData.heads.forEach((m) => (m.visible = !dead));
    S.neighbor.userData.tails.forEach((m) => (m.visible = !dead));

    // Beim Fahren laufen Pfosten und Boden am Auto vorbei
    const roll = shot.driving ? (t * 9) % 16 : 0;
    S.posts.forEach((p, i) => (p.position.z = -Math.floor(i / 2) * 16 + 24 + roll));

    const you = S.you;
    b.blink(you, t > 1 && t < at.ask ? (((t + 1.3) * 0.36) % 1 < 0.05 ? 1 : 0) : 0);
    b.expression(you, t < at.brake ? 'flat' : t >= at.dark ? 'worried' : t >= at.walk ? 'worried' : 'flat');
    you.scale.y = 1 + Math.sin(t * 2.2) * 0.009;
    b.look(you, shot.set === 'cab' && t >= at.empty && t < at.hours ? 0.5 : Math.sin(t * 0.8) * 0.3, t >= at.empty ? -0.3 : 0.1);
    you.userData.limbs.armL.rotation.z = 1.2;
    you.userData.limbs.armR.rotation.z = 1.2;
    you.userData.face.head.rotation.y = t >= at.empty && t < at.choice ? 0.25 : 0;
    S.dash.intensity = dead ? 2.4 : 3.2;
    S.wipers.forEach((w, i) => (w.rotation.z = -0.9 + Math.abs(((t * 0.9 + i * 0.02) % 2) - 1) * 1.7));
    S.needle.rotation.z = 0.72;

    // Schnee folgt der Kamera, Wind schiebt ihn seitlich
    const cam = ctx.camera.position;
    const pos = S.flakes.geometry.attributes.position;
    const fall = shot.whiteout ? 8 : night ? 5 : 3.2;
    const spread = shot.whiteout ? 9 : 16;
    S.flakeSeed.forEach(([a, c, d], i) => {
      const y = (a * 12 - t * fall * (0.7 + d * 0.5)) % 12;
      const x = ((c * spread + t * (shot.whiteout ? 7 : 2.4)) % spread) - spread / 2;
      const z = (d * spread) - spread / 2;
      pos.setXYZ(i, cam.x + x, cam.y - 4 + (y < 0 ? y + 12 : y), cam.z + z);
    });
    pos.needsUpdate = true;
    S.flakes.material.size = shot.whiteout ? 0.2 : 0.13;
    S.rig.apply(ctx.camera, t, ctx, t >= DARK && t < DARK + 0.5 ? motion.shake(t, DARK, { amp: 0.02, decay: 7 }) : [0, 0, 0]);
    void dt;
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    const set = S.rig.list[S.rig.current(t)].set;
    if (ctx.coverMode) {
      ui.grade(g, { color: '#cfdcf5', edge: 0.5 });
      ui.cover(g, { lines: ['*Snowed in*', 'on the highway'], part: 'Part 1', y: 545, size: 118 });
      return;
    }
    const snap = (key, time) => {
      if (t >= time && !S[key]) {
        const c = document.createElement('canvas');
        c.width = g.canvas.width;
        c.height = g.canvas.height;
        c.getContext('2d').drawImage(g.canvas, 0, 0);
        S[key] = c;
      }
    };
    snap('imgB', at.hours + 1);
    snap('imgA', at.empty + 3);
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.grade(g, { color: set === 'cab' ? '#d5dff5' : '#cfdcf5', edge: 0.6 });
    ui.vignette(g, 0.42);
    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && t < at.ask) ui.clock(g, clock[1]);
    if (t >= at.night && t < at.ask) ui.gauge(g, { label: 'OUTSIDE', value: '-12°C', warn: true, x: 60, y: 90 });
    if (t >= at.night && t < at.ask) ui.gauge(g, { label: 'FUEL', value: '1/4', warn: true, x: 850, y: 90 });
    if (t >= at.stat && t < at.night) ui.rule(g, { label: 'Germany, A5', text: '84 km at a standstill', y: 270, k: pop(at.stat + 0.2, at.night) });
    if (t >= at.rule1 && t < at.beside) ui.rule(g, { label: 'Rule #1', text: 'Stay with your car', y: 270, k: pop(at.rule1, at.beside) });

    if (t < at.ask) ui.words(g, t, chunks);
    if (t < at.drive) ui.cover(g, { lines: ['*Snowed in*', 'on the highway'], part: 'Part 1', y: 240, size: 150, alpha: 1 - phase(t, at.drive - 0.3, at.drive) });
    const vote = at.ask + 1.6;
    if (t >= at.ask && t < vote) ui.cover(g, { lines: ['Engine', '*on or off?*'], y: 280, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
    if (t >= vote) ui.vote(g, { title: 'Eight hours of night', a: 'Engine on', b: 'Engine off', comment: 'Comment ON or OFF', next: 'Part 2 soon · Follow', k: phase(t, vote, vote + 0.3), imgA: S.imgA, imgB: S.imgB });
  },
};
