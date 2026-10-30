// "One street. Two sides." Einzelvideo zu den Protesten in Frankreich im Oktober 2026.
// Lea und Marc sind erfundene Figuren. Alle Zahlen tragen ihre Quelle im Bild.

import script from './paris.script.js';
import timing from './paris.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing, { tail: 4.2 });
const GAS = at.gas + 0.3;

export default {
  title: 'One street. Two sides.',
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'One street. Two sides.', part: 1 },
  caption: {
    scenario: 'One street in France, two sides',
    emoji: '🇫🇷',
    question: 'What would you change?',
    tags: ['france', 'paris', 'protest', 'news', 'explained'],
  },
  duration,
  fps: 30,
  seed: 77,
  look: {
    env: 0.12,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 0.8, maxblur: 0.012 },
    bloom: { strength: 0.42, radius: 0.55, threshold: 1.3 },
  },
  sources: [
    'Protests began as a student movement over teacher shortages, then cost of living and spending cuts: ZDFheute, 18 Oct 2026, citing Reuters, dpa, AFP',
    '17 Oct turnout: 550,000 per Interior Minister Nuñez, about 800,000 per organizers: ZDFheute',
    '17 Oct toll: 1,144 officers hurt, 1,522 shops looted per Interior Ministry: ZDFheute, 25 Oct 2026',
    '24 Oct: two people seriously hurt in police operations per Interior Minister Nuñez, circumstances not reported: ZDFheute',
    'Léa and Marc are fictional composites. The events on screen are stylised.',
  ],
  music: {
    bpm: 84,
    gain: -10,
    duck: 0.72,
    sections: [
      { at: 0, mood: 'suspense' },
      { at: at.lea, mood: 'pulse' },
      { at: at.break, mood: 'suspense' },
      { at: at.rewind, mood: 'silence' },
      { at: at.marc, mood: 'dread' },
      { at: at.fire, mood: 'drive' },
      { at: at.orderg, mood: 'dread' },
      { at: at.march2, mood: 'calm' },
      { at: at.same, mood: 'silence' },
      { at: at.ask + 1.2, mood: 'calm' },
    ],
  },
  story: { hook: 'One street in Paris. Two people. Neither of them wanted this night.', beats },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;
    scene.background = new THREE.Color('#1a2346');
    scene.fog = new THREE.Fog('#2a2f4e', 30, 150);
    S.hemi = new THREE.HemisphereLight('#b8c4ea', '#6a5e50', 1.15);
    scene.add(S.hemi);
    const sun = new THREE.DirectionalLight('#ffb98a', 1.1);
    sun.position.set(30, 30, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 5, far: 160 });
    scene.add(sun);
    const mk = (w, h, d, color, x, y, z, opts = {}) => {
      const m = b.box(w, h, d, color, { x, y, z, r: 0.02, ...opts });
      scene.add(m);
      return m;
    };
    const glow = (r, g, bl) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, bl) });

    // Strasse und Haussmann-Fassaden
    scene.add(b.ground(600, '#4e5059'));
    mk(16, 0.04, 400, '#34363e', 0, 0.02, 0, { r: 0.002 });
    for (const sx of [-9.5, 9.5]) mk(3, 0.2, 400, '#8a877f', sx, 0.1, 0, { r: 0.01 });
    const face = document.createElement('canvas');
    face.width = 512;
    face.height = 768;
    const f = face.getContext('2d');
    f.fillStyle = '#c4b7a0';
    f.fillRect(0, 0, 512, 768);
    f.fillStyle = '#5a6172';
    f.fillRect(0, 0, 512, 60);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 40 + c * 118;
        const y = 90 + r * 118;
        f.fillStyle = '#1d2233';
        f.fillRect(x, y, 66, 92);
        f.fillStyle = '#2b2b30';
        f.fillRect(x - 8, y + 86, 82, 10);
      }
    }
    f.fillStyle = '#3a3f4c';
    f.fillRect(0, 680, 512, 88);
    const faceT = new THREE.CanvasTexture(face);
    faceT.colorSpace = THREE.SRGBColorSpace;
    const faceM = new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.85 });
    for (let i = -8; i <= 12; i++) {
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(16, 26, 16), faceM);
        m.position.set(sx * 19, 13, i * 16.4);
        m.receiveShadow = true;
        scene.add(m);
      }
    }
    // Laternen und Baeume
    S.lamps = [];
    for (let i = -6; i <= 8; i++) {
      for (const sx of [-8, 8]) {
        mk(0.2, 6, 0.2, '#25272e', sx, 3, i * 10);
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), glow(3, 2.2, 1.2));
        l.position.set(sx, 6.2, i * 10);
        scene.add(l);
      }
    }
    // Schaufenster, das zerbricht
    S.shopGlass = mk(5, 2.5, 0.08, '#9fd3ff', 10.9, 1.45, -3, { material: b.mat('#9fd3ff', { roughness: 0.1, metalness: 0.3 }), r: 0.01 });
    S.shopGlass.rotation.y = Math.PI / 2;
    S.shopGlow = new THREE.PointLight('#ff8a3a', 0, 22, 1.2);
    S.shopGlow.position.set(9.5, 2, -3);
    scene.add(S.shopGlow);
    S.shards = [];
    for (let i = 0; i < 24; i++) {
      const m = b.box(0.18, 0.2, 0.03, '#bfe3ff', { r: 0.005 });
      m.visible = false;
      m.userData.v = [-rng.range(1, 4), rng.range(0.5, 3), rng.range(-3, 3)];
      scene.add(m);
      S.shards.push(m);
    }
    S.flame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 12), glow(4.5, 1.6, 0.35));
    S.flame.position.set(10.6, 1.6, -3);
    S.flame.visible = false;
    scene.add(S.flame);

    // Menge
    S.crowd = [];
    const shirts = ['#3f7f73', '#4a70c9', '#b54d8c', '#e0a33a', '#6d5bb0', '#8a8f9e', '#2f9a8f', '#d4d0c6'];
    for (let i = 0; i < 64; i++) {
      const p = b.person({ shirt: shirts[i % 8], pants: ['#27324f', '#3a3a44', '#4a3a2c'][i % 3], hair: ['#2a1a10', '#4a4a50', '#8a5a2c', '#141216'][i % 4] });
      p.position.set(-6.8 + (i % 9) * 1.7 + rng.range(-0.3, 0.3), 0, 9 + Math.floor(i / 9) * 2.1 + rng.range(-0.3, 0.3));
      p.rotation.y = Math.PI / 2 + rng.range(-0.25, 0.25);
      b.expression(p, i % 4 ? 'flat' : 'open');
      scene.add(p);
      S.crowd.push(p);
    }
    S.signs = [];
    const signC = (t, c) => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 128;
      const g = cv.getContext('2d');
      g.fillStyle = c;
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#16181f';
      g.font = "400 58px 'Anton', sans-serif";
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(t, 128, 66);
      const tx = new THREE.CanvasTexture(cv);
      tx.colorSpace = THREE.SRGBColorSpace;
      return tx;
    };
    for (const [t, x, z, c] of [['MORE TEACHERS', -3, 11, '#f1ece0'], ['SAVE OUR SCHOOLS', 3.2, 12, '#ffd23f'], ['RENT', -5.6, 14, '#f1ece0'], ['WE ARE HERE', 1, 15, '#e7675a']]) {
      const g = new THREE.Group();
      g.position.set(x, 2.5, z);
      g.add(b.box(0.06, 1.1, 0.06, '#6b4a2e', { y: -0.5 }));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1), new THREE.MeshStandardMaterial({ map: signC(t, c), side: THREE.DoubleSide }));
      m.position.y = 0.4;
      g.add(m);
      scene.add(g);
      S.signs.push(g);
    }

    // Lea
    S.lea = b.character({ shirt: '#2e6fb0', pants: '#2a2f3e', skin: '#caa07c', hair: '#2b1a12', outfit: 'hoodie', hairStyle: 'bun', accent: '#ffd23f' });
    const leaHead = S.lea.userData.face.head;
    for (const z of [0.3, -0.3]) leaHead.add(b.box(0.34, 0.62, 0.1, '#2b1a12', { x: -0.05, y: 0.3, z, r: 0.04 }));
    leaHead.add(b.box(0.14, 0.72, 0.6, '#2b1a12', { x: -0.27, y: 0.26, r: 0.05 }));
    S.lea.position.set(1.2, 0, 7.2);
    S.lea.rotation.y = Math.PI / 2;
    scene.add(S.lea);

    // Vermummte Gruppe
    S.masked = [];
    for (let i = 0; i < 7; i++) {
      const p = b.person({ shirt: '#17181e', pants: '#17181e', skin: '#17181e', hair: '#101014', outfit: 'hoodie', accent: '#101014', hairStyle: 'cap' });
      p.position.set(4 + (i % 3) * 1.5, 0, -0.6 + Math.floor(i / 3) * 1.4);
      p.rotation.y = 0.8;
      p.visible = false;
      scene.add(p);
      S.masked.push(p);
    }

    // Polizeikette
    const officer = (x, z) => {
      const p = b.character({ shirt: '#20252f', pants: '#1b1f28', skin: '#c9a080', hair: '#20252f', shoes: '#101014', outfit: 'jacket', hairStyle: 'none' });
      const h = p.userData.face.head;
      h.add(b.box(0.68, 0.2, 0.68, '#1a1d26', { y: 0.66, r: 0.1 }));
      h.add(b.box(0.72, 0.24, 0.72, '#2c3140', { y: 0.53, r: 0.08 }));
      const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.34), new THREE.MeshStandardMaterial({ color: '#a8c4e0', transparent: true, opacity: 0.28, roughness: 0.1 }));
      visor.position.set(0.31, 0.34, 0);
      visor.rotation.y = Math.PI / 2;
      h.add(visor);
      p.add(b.box(0.08, 1.4, 0.9, '#8fb0d0', { x: 0.42, y: 0.92, r: 0.04, material: new THREE.MeshStandardMaterial({ color: '#b6cde4', transparent: true, opacity: 0.5, roughness: 0.15 }) }));
      p.position.set(x, 0, z);
      p.rotation.y = -Math.PI / 2;
      scene.add(p);
      return p;
    };
    S.police = [];
    for (let i = 0; i < 11; i++) S.police.push(officer(-7 + i * 1.4, -8));
    S.marc = S.police[6];
    S.marc.children.at(-1).visible = false;
    S.marc.position.z = -7.6;
    S.vans = [];
    for (const x of [-4, 4]) {
      mk(3, 2.6, 6.4, '#1f2a4a', x, 1.5, -15, { r: 0.1 });
      const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.3), glow(0.2, 0.5, 3.6));
      light.position.set(x, 3, -13);
      scene.add(light);
      S.vans.push(light);
    }
    S.blue = new THREE.PointLight('#3f6fff', 0, 34, 1.2);
    S.blue.position.set(0, 4, -11);
    scene.add(S.blue);

    // Gaswolke und Feuerwerk
    const puff = document.createElement('canvas');
    puff.width = puff.height = 128;
    const pg = puff.getContext('2d');
    const rad = pg.createRadialGradient(64, 64, 4, 64, 64, 62);
    rad.addColorStop(0, 'rgba(255,255,255,0.8)');
    rad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    pg.fillStyle = rad;
    pg.fillRect(0, 0, 128, 128);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(260 * 3), 3));
    S.gas = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(puff), size: 3.2, color: '#c8ccd2', transparent: true, opacity: 0.16, depthWrite: false }));
    S.gas.frustumCulled = false;
    S.gasSeed = Array.from({ length: 260 }, () => [rng(), rng(), rng()]);
    scene.add(S.gas);
    S.sparks = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glow(5, 3, 1.2));
      m.visible = false;
      scene.add(m);
      S.sparks.push(m);
    }

    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'room', { dur: duration, gain: -26 });
    add(0, 'murmur', { dur: at.break + 2, gain: -15, space: 'street' });
    add(0.2, 'siren', { dur: 4, gain: -24, pan: 0.4 });
    add(at.march + 2, 'murmur', { dur: 3, gain: -13, space: 'street' });
    add(at.break + 2.0, 'crash', { dur: 0.9, gain: -5, space: 'street' });
    add(at.gas - 0.25, 'thud', { gain: -6, pitch: 0.7, space: 'street' });
    add(at.gas + 0.5, 'whoosh', { gain: -14 });
    add(at.gas + 2.9, 'cough', { gain: -13, pan: -0.3 });
    add(at.rewind - 0.45, 'glitch', { gain: -8 });
    add(at.rewind - 0.45, 'whoosh', { gain: -10 });
    add(at.marc, 'murmur', { dur: 6, gain: -20, space: 'street' });
    for (const k of [0.1, 0.9, 1.5]) add(at.fire + k, 'pop', { gain: -8, pitch: 0.5 });
    add(at.fire + 1.5, 'boom', { dur: 1, gain: -13 });
    add(at.fire + 2.4, 'glitch', { gain: -13 });
    add(at.fire + 1.5, 'fire', { dur: 8, gain: -18, space: 'street' });
    add(at.orderg + 0.2, 'thud', { gain: -7, pitch: 0.7, space: 'street' });
    add(at.orderg + 1.4, 'whoosh', { gain: -14 });
    add(at.same - 0.45, 'heart', { gain: -10 });
    add(at.ask + 1.2, 'ding', { dur: 1.2, gain: -16 });
    S.cues = cue.sort((a, c) => a[0] - c[0]);
    S.cueI = 0;

    const c = ctx.coverMode;
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, aperture: 0.05, pos: [1, 15, 34], look: [0, 1, -8], fov: 46, move: { pos: [0.5, 13, 28], dur: at.lea }, side: 'both' },
      { at: at.lea, side: 'a', aperture: 1.2, pos: [1.5, 1.75, 5], look: [1.2, 1.72, 7.2], fov: 44, move: { pos: [1.45, 1.75, 5.5], dur: 3 }, focus: [1.2, 1.75, 7.2] },
      { at: at.march, side: 'a', aperture: 0.2, pos: [-2, 2.8, 3], look: [0.5, 1.6, 14], fov: 56, move: { pos: [-1.4, 2.6, 4], dur: 4 } },
      { at: at.peace, side: 'a', aperture: 0.15, pos: [3, 5, 4], look: [-1, 1.8, 16], fov: 52 },
      { at: at.break, side: 'a', aperture: 0.15, pos: [-3, 2, 3.4], look: [7.5, 1.5, -2], fov: 46, move: { pos: [-1.6, 2, 2.8], dur: 3 } },
      { at: at.gas, side: 'a', aperture: 1.2, pos: [1.4, 1.75, 4.8], look: [1.2, 1.7, 7.2], fov: 46, focus: [1.2, 1.75, 7.2] },
      { at: at.rewind, side: 'both', rewind: true, aperture: 0.05, pos: [1, 15, 26], look: [0, 1, -8], fov: 46 },
      { at: at.marc, side: 'b', aperture: 1.2, pos: [1.6, 1.75, -5.3], look: [1.4, 1.72, -8], fov: 42, focus: [1.4, 1.75, -8] },
      { at: at.order, side: 'b', aperture: 0.15, pos: [0, 2.9, -12.4], look: [0.5, 1.5, 4], fov: 54, move: { pos: [0, 2.8, -11.6], dur: 3 } },
      { at: at.fire, side: 'b', aperture: 0.1, pos: [-2, 2.8, -11.4], look: [7.5, 2, -1], fov: 54, focus: [7, 2, 0] },
      { at: at.tell, side: 'b', aperture: 0.15, pos: [2.9, 2.45, -9.9], look: [0.3, 1.7, 10], fov: 42, focus: [0.5, 1.7, 2] },
      { at: at.orderg, side: 'b', aperture: 0.15, pos: [0, 2.9, -12], look: [0.5, 1.5, 6], fov: 52 },
      { at: at.march2, side: 'both', aperture: 0.05, pos: [0, 26, 22], look: [0, 0, -2], fov: 50 },
      { at: at.same, side: 'a', aperture: 1.2, pos: [1.45, 1.75, 5], look: [1.2, 1.72, 7.2], fov: 44, focus: [1.2, 1.75, 7.2] },
      { at: at.same + 1.45, side: 'b', aperture: 1.2, pos: [1.6, 1.75, -5.4], look: [1.4, 1.72, -8], fov: 44, focus: [1.4, 1.75, -8] },
      { at: at.ask, side: 'both', aperture: 0.05, pos: [0.5, 13, 28], look: [0, 1, -8], fov: 46 },
    ]);
    void c;
  },

  update(ctx, t) {
    const { state: S, blocks: b, phase, motion } = ctx;
    while (S.cueI < S.cues.length && S.cues[S.cueI][0] <= t) {
      const [, name, opts] = S.cues[S.cueI++];
      ctx.sound(name, opts);
    }
    const shot = S.rig.list[S.rig.current(t)];
    const marcPart = t >= at.rewind && t < at.march2;
    const localT = marcPart ? t - at.rewind + (at.break - 2) : t;
    const broken = localT >= at.break + 2 && t < at.same;
    const lit = marcPart ? t >= at.fire + 1.4 : t >= at.break + 3 && t < at.rewind ? true : t >= at.march2;
    const gasK = marcPart ? phase(t, at.orderg + 0.5, at.orderg + 2) : t < at.rewind ? phase(t, GAS, GAS + 1.5) : 0.09;

    S.shopGlass.visible = !broken && !(t >= at.march2);
    S.shards.forEach((m, i) => {
      const dt = localT - (at.break + 2);
      m.visible = t < at.same && dt > 0 && dt < 1.4;
      if (m.visible) {
        const v = m.userData.v;
        m.position.set(10.9 + v[0] * dt, Math.max(0.2, 1.6 + v[1] * dt - 4.9 * dt * dt), -3 + v[2] * dt);
        m.rotation.set(dt * 7 + i, dt * 5, 0);
      }
    });
    S.flame.visible = lit;
    S.flame.scale.y = 1 + Math.sin(t * 14) * 0.14;
    S.shopGlow.intensity = lit ? 34 + Math.sin(t * 15) * 6 : 7;

    S.masked.forEach((p, i) => {
      const k = phase(localT, at.break - 0.2, at.break + 1.6);
      p.visible = k > 0 && !(t >= at.march2);
      if (p.visible) {
        p.position.x = 3 + (i % 3) * 1.4 + k * 3.2;
        b.animatePerson(p, t * 8 + i, 0.8);
      }
    });
    const running = t >= at.gas + 2.5 && t < at.rewind;
    S.crowd.forEach((p, i) => {
      p.position.y = Math.abs(Math.sin(t * 2.6 + i)) * 0.05;
      b.animatePerson(p, t * 2.4 + i, 0.2);
      if (i % 6 === 0) p.userData.limbs.armL.rotation.z = 2.3 + Math.sin(t * 3 + i) * 0.3;
    });
    S.signs.forEach((g, i) => {
      g.rotation.z = Math.sin(t * 1.4 + i) * 0.08;
      g.rotation.y = shot.side === 'b' ? Math.PI : 0;
      g.position.y = 2.5 + Math.sin(t * 2 + i) * 0.08;
    });
    b.expression(S.lea, t >= at.same ? 'worried' : t >= GAS ? 'shock' : t >= at.break ? 'worried' : 'flat');
    b.blink(S.lea, t > 1 && ((t + 0.7) * 0.36) % 1 < 0.05 ? 1 : 0);
    if (running) b.animatePerson(S.lea, t * 10, 0.7);
    else b.animatePerson(S.lea, t * 2.4, 0.15);
    b.look(S.lea, Math.sin(t * 0.9) * 0.4, 0);

    S.police.forEach((p, i) => (p.position.y = Math.sin(t * 1.7 + i) * 0.01));
    b.expression(S.marc, t >= at.fire ? 'worried' : 'flat');
    b.blink(S.marc, ((t + 1.6) * 0.33) % 1 < 0.05 ? 1 : 0);
    const flash = Math.sin(t * 11) > 0;
    S.vans.forEach((l, i) => (l.visible = i ? flash : !flash));
    S.blue.intensity = flash ? 18 : 10;

    S.sparks.forEach((m, i) => {
      const k = (t - at.fire - i * 0.16) / 0.8;
      m.visible = k > 0 && k < 1 && marcPart;
      if (m.visible) m.position.set(-2 + i * 0.9, 1 + Math.sin(k * Math.PI) * 4, 3 - k * 10);
    });
    S.gas.visible = gasK > 0;
    S.gas.material.opacity = 0.2 * gasK;
    const pos = S.gas.geometry.attributes.position;
    S.gasSeed.forEach(([a, c, d], i) => {
      const u = (t * (0.03 + d * 0.04) + a) % 1;
      pos.setXYZ(i, -9 + c * 18, 0.4 + u * 4.6, -6 + d * 18 - u * 2);
    });
    pos.needsUpdate = true;
    S.rig.apply(ctx.camera, t, ctx, t >= at.fire + 1.5 && t < at.fire + 2.1 ? motion.shake(t, at.fire + 1.5, { amp: 0.03, decay: 6 }) : [0, 0, 0]);
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    if (ctx.coverMode) {
      ui.grade(g, { color: '#d5d8ea', edge: 0.5 });
      ui.cover(g, { lines: ['*One street*', 'Two sides'], part: 'France 2026', y: 545, size: 130 });
      return;
    }
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    const shot = S.rig.list[S.rig.current(t)];
    ui.grade(g, { color: shot.side === 'b' ? '#c9d4ec' : '#e6dcd0', edge: 0.62 });
    ui.haze(g, 0.2 * (t >= GAS && t < at.rewind ? phase(t, GAS, GAS + 1.5) : t >= at.orderg && t < at.march2 ? phase(t, at.orderg + 0.5, at.orderg + 2) : 0), '#b9bcc0');
    ui.vignette(g, 0.45);
    if (t >= at.rewind - 0.3 && t < at.rewind + 0.3) ui.flash(g, 0.5 * (1 - Math.abs(t - at.rewind) / 0.3));

    if (t >= at.lea + 0.6 && t < at.march) ui.nameTag(g, { name: 'Léa', info: '19 · Student', y: 1130, k: pop(at.lea + 0.6, at.march) });
    if (t >= at.marc + 0.6 && t < at.order) ui.nameTag(g, { name: 'Marc', info: '34 · Riot police', y: 1130, k: pop(at.marc + 0.6, at.order) });
    if (t >= at.march2 && t < at.toll) ui.rule(g, { label: 'Marchers, October 17', text: '550,000 (government)', result: '≈ 800,000 (organizers)', y: 270, k: pop(at.march2 + 0.2, at.toll) });
    if (t >= at.toll && t < at.hurt) ui.rule(g, { label: 'Interior Ministry, Oct 17', text: '1,144 officers hurt', result: '1,522 shops looted', y: 270, k: pop(at.toll + 0.2, at.hurt) });
    if (t >= at.hurt && t < at.same) ui.rule(g, { label: 'Interior Minister, Oct 24', text: '2 seriously hurt', result: 'in police operations', y: 270, k: pop(at.hurt + 0.2, at.same) });
    if (t >= at.rewind && t < at.marc) ui.clock(g, '10 MINUTES EARLIER');

    if (t < at.ask) ui.words(g, t, chunks);
    if (t < at.lea) {
      ui.cover(g, { lines: ['*One street*', 'Two sides'], part: 'France 2026', y: 240, size: 150, alpha: 1 - phase(t, at.lea - 0.3, at.lea) });
      ui.clock(g, 'FICTIONAL CHARACTERS · REAL EVENTS', { y: 1500 });
    }
    if (t >= at.ask) {
      ui.cover(g, { lines: ['What would', '*you change?*'], y: 300, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
      const k = phase(t, at.ask + 1.1, at.ask + 1.4);
      if (k > 0) ui.rule(g, { label: 'Léa and Marc are fictional', text: 'Sources in the comments', y: 1300, k });
    }
  },
};
