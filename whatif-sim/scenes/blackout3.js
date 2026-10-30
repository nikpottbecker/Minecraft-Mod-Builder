// Blackout in a high-rise, Part 3: "Floor 9". Ablauf und Regie: plans/blackout-part-3.md
// Stimme gibt das Timing vor. Abstimmung aus Part 2: VOTE in blackout3.script.js, dann node timing.mjs.

import script from './blackout3.script.js';
import timing from './blackout3.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing, { tail: 5.2 });

const CLOCKS = [
  ['hook', 'DAY 3 · 2:10 PM'],
  ['water', '6:30 PM'],
  ['smell', '7:52 PM'],
  ['crack', '7:53 PM'],
  ['dial', '7:54 PM'],
  ['look', '7:55 PM'],
];
const FIRE_T = at.floor9 + 0.4; // Rauch-Anzeige startet

export default {
  title: 'Blackout in a high-rise, Part 3',
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'Blackout in a high-rise', part: 3 },
  caption: {
    scenario: 'One candle, five floors below you',
    emoji: '🕯️🏢',
    question: 'Run or stay?',
    tags: ['blackout', 'whatif', 'survival', 'scenario', 'highrise', 'powerout'],
  },
  duration,
  fps: 30,
  seed: 39,
  look: {
    env: 0.1,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 2, maxblur: 0.012 },
    bloom: { strength: 0.3, radius: 0.5, threshold: 1.4 },
  },
  sources: [
    'Smoke in the stairwell: stay in the home, close doors, seal gaps with wet towels, signal at a window: Feuerwehr Lehrte, Interior Ministry Baden-Württemberg, Feuerwehr Peising',
    'Use flashlights rather than candles, never leave candles alone: Berlin fire department, quoted in reports on the Treptow-Köpenick outage',
    'Without power, hose pressure is too low for very tall buildings: t-online',
    'Cell sites fail within minutes to hours: TAB report, Bundestag Drucksache 17/5672',
    'Math: 17 L − about 6 L used = 11 L; 14 − 9 = 5 floors',
  ],
  music: {
    bpm: 76,
    gain: -8,
    duck: 0.72,
    sections: [
      { at: 0, mood: 'suspense' },
      { at: at.water, mood: 'dread' },
      { at: at.smell, mood: 'silence' },
      { at: at.smoke, mood: 'dread' },
      { at: at.dial, mood: 'suspense' },
      { at: at.look, mood: 'dread' },
      { at: at.go - 0.3, mood: 'silence' },
      { at: at.choice, mood: 'drive' },
      { at: at.ask, mood: 'silence' },
      { at: at.ask + 1.6, mood: 'suspense' },
    ],
  },
  story: { hook: script.lines[0].text.replace(/\*/g, ''), beats },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;
    scene.background = new THREE.Color('#05060c');
    S.hemi = new THREE.HemisphereLight('#8fa2d0', '#2a2a33', 0.35);
    scene.add(S.hemi);

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

    S.you = b.character({ shirt: '#d9463d', pants: '#27324f', skin: '#d6a57c', hair: '#2a1a10', outfit: 'hoodie', hairStyle: 'tufts' });
    scene.add(S.you);
    S.helen = b.character({ shirt: '#8e6db3', pants: '#3f4258', skin: '#efcfb3', hair: '#d9dbe2', shoes: '#6c6f7c', outfit: 'jacket', hairStyle: 'bun' });
    S.helen.scale.setScalar(0.92);
    b.expression(S.helen, 'worried');
    scene.add(S.helen);

    // Weicher Rauch: Punkte mit Verlaufs-Textur
    const puff = document.createElement('canvas');
    puff.width = puff.height = 128;
    const pg = puff.getContext('2d');
    const rad = pg.createRadialGradient(64, 64, 4, 64, 64, 62);
    rad.addColorStop(0, 'rgba(255,255,255,0.85)');
    rad.addColorStop(0.5, 'rgba(255,255,255,0.32)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    pg.fillStyle = rad;
    pg.fillRect(0, 0, 128, 128);
    const puffTex = new THREE.CanvasTexture(puff);
    const makeSmoke = (count, size, color) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
      const mat = new THREE.PointsMaterial({ map: puffTex, size, color, transparent: true, opacity: 0.2, depthWrite: false, sizeAttenuation: true });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.userData.seed = Array.from({ length: count }, () => [rng(), rng(), rng()]);
      return pts;
    };

    // ---------- Etage 5: Menge vor Mareks Tuer ----------
    const landing = group();
    mk(landing, 14, 0.1, 12, '#55575f', 0, -0.05, 2);
    mk(landing, 18, 10, 0.2, '#454956', 0, 5, -1.6);
    mk(landing, 1.15, 2.3, 0.1, '#5a4436', 0, 1.15, -1.45);
    mk(landing, 0.07, 0.07, 0.1, '#d9c27a', 0.45, 1.05, -1.38);
    mk(landing, 0.24, 0.16, 0.05, '#7f8590', 0.34, 1.32, -1.38);
    S.bolt = mk(landing, 0.3, 0.05, 0.06, '#c9ced8', 0.19, 1.32, -1.33, { r: 0.015 });
    const numC = document.createElement('canvas');
    numC.width = numC.height = 256;
    const ng = numC.getContext('2d');
    ng.fillStyle = '#454956';
    ng.fillRect(0, 0, 256, 256);
    ng.fillStyle = '#f2efe6';
    ng.font = "400 200px 'Anton', sans-serif";
    ng.textAlign = 'center';
    ng.fillText('5', 128, 215);
    const numT = new THREE.CanvasTexture(numC);
    numT.colorSpace = THREE.SRGBColorSpace;
    const num = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: numT }));
    num.position.set(-2.4, 2.15, -1.49);
    landing.add(num);
    S.crowd = [];
    for (let i = 0; i < 11; i++) {
      const p = b.person({ shirt: ['#3f7f73', '#4a70c9', '#b54d8c', '#e0a33a', '#6d5bb0', '#8a8f9e', '#2f9a8f'][i % 7], pants: ['#27324f', '#3a3a44', '#4a3a2c'][i % 3], outfit: i % 2 ? 'jacket' : 'tshirt', hair: ['#2a1a10', '#4a4a50', '#8a5a2c', '#141216'][i % 4] });
      p.position.set(-3 + (i % 4) * 2 + rng.range(-0.25, 0.25), 0, -0.5 + Math.floor(i / 4) * 1.15 + rng.range(-0.15, 0.15));
      p.rotation.y = Math.PI / 2 + rng.range(-0.25, 0.25);
      b.expression(p, i % 3 ? 'angry' : 'worried');
      landing.add(p);
      S.crowd.push(p);
    }
    const lw = new THREE.PointLight('#ffd3a0', 22, 16, 1.3);
    lw.position.set(1.5, 3.2, 5.4);
    landing.add(lw);
    const ld = new THREE.PointLight('#ffe7c8', 3, 5, 1.4);
    ld.position.set(0.5, 1.8, 0.1);
    landing.add(ld);
    const lc = new THREE.PointLight('#8fa2d0', 6, 12, 1.4);
    lc.position.set(-3, 3, 1);
    landing.add(lc);

    // ---------- Wohnung am Abend ----------
    const room = group();
    const wall = '#6f6a5e';
    mk(room, 9, 0.1, 7, '#6a4e38', 0, -0.05, 0);
    mk(room, 9, 0.1, 7, '#a9a597', 0, 2.95, 0);
    mk(room, 0.1, 3, 7, wall, -4.5, 1.5, 0);
    mk(room, 0.1, 3, 7, wall, 4.5, 1.5, 0);
    mk(room, 9, 0.5, 0.14, wall, 0, 0.25, -3.5);
    mk(room, 9, 0.3, 0.14, wall, 0, 2.85, -3.5);
    for (const wx of [-3.9, 3.9]) mk(room, 1.2, 3, 0.14, wall, wx, 1.5, -3.5);
    const night = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({ color: '#0d1430' }));
    night.position.set(0, 2, -16);
    room.add(night);
    for (let i = 0; i < 12; i++) {
      const h = rng.range(3, 9);
      mk(room, 1.8, h, 1, '#141a33', -9 + i * 1.7, -2 + h / 2, -13);
      for (let k = 0; k < 4; k++) {
        const c = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), glow(1.8, 1, 0.38));
        c.position.set(-9.5 + i * 1.7 + rng.range(0, 1), -1.2 + rng.range(0, h - 0.5), -12.45);
        room.add(c);
      }
    }
    // Wand mit Tuer
    mk(room, 1.75, 3, 0.1, wall, -3.63, 1.5, 3.5);
    mk(room, 6.1, 3, 0.1, wall, 1.45, 1.5, 3.5);
    mk(room, 1.1, 0.8, 0.1, wall, -2.2, 2.6, 3.5);
    S.door = new THREE.Group();
    S.door.position.set(-2.75, 0, 3.46);
    S.door.add(b.box(1.08, 2.18, 0.07, '#8a6547', { x: 0.54, y: 1.1, r: 0.02 }));
    S.door.add(b.box(0.07, 0.07, 0.1, '#d9c27a', { x: 0.95, y: 1.05, z: -0.06 }));
    room.add(S.door);
    S.gray = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.82, 0.79, 0.74) }));
    S.gray.position.set(-2.2, 1.15, 3.6);
    S.gray.rotation.y = Math.PI;
    room.add(S.gray);
    S.gap = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.045), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.22, 1.1) }));
    S.gap.position.set(-2.2, 0.03, 3.42);
    S.gap.rotation.y = Math.PI;
    room.add(S.gap);
    // Tisch, Flaschen, Kerzen, Taschenlampe, Handy
    mk(room, 2.4, 0.08, 1.3, '#6b4a2e', 0, 0.76, 0);
    for (const [lx, lz] of [[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]]) mk(room, 0.08, 0.74, 0.08, '#4d3420', lx, 0.37, lz);
    for (let i = 0; i < 4; i++) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.27, 16), new THREE.MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.2, transparent: true, opacity: 0.8 }));
      body.position.set(-0.75 + i * 0.2, 0.935, -0.25);
      room.add(body);
    }
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 20), b.mat('#3f6fd8', { roughness: 0.4 }));
    bk.position.set(0.72, 0.96, -0.2);
    room.add(bk);
    S.flames = [];
    const candle = (x, z) => {
      mk(room, 0.08, 0.18, 0.08, '#efe6cf', x, 0.89, z, { r: 0.015 });
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), glow(3.0, 1.75, 0.6));
      f.position.set(x, 1.03, z);
      f.scale.y = 1.8;
      room.add(f);
      S.flames.push(f);
    };
    candle(0.05, 0.25);
    candle(-0.32, 0.38);
    S.candleLight = new THREE.PointLight('#ffa95e', 0, 13, 1.25);
    S.candleLight.position.set(-0.1, 1.45, 0.3);
    room.add(S.candleLight);
    mk(room, 0.32, 0.09, 0.09, '#20232c', 0.55, 0.85, 0.3, { r: 0.03 });
    S.lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), glow(3, 3, 2.4));
    S.lens.position.set(0.39, 0.85, 0.3);
    S.lens.rotation.y = -Math.PI / 2;
    room.add(S.lens);
    S.torch = new THREE.PointLight('#fff0d0', 0, 9, 1.4);
    S.torch.position.set(0.2, 1.1, 0.5);
    room.add(S.torch);
    S.phoneC = document.createElement('canvas');
    S.phoneC.width = 270;
    S.phoneC.height = 540;
    const pc = S.phoneC.getContext('2d');
    pc.fillStyle = '#0d1020';
    pc.fillRect(0, 0, 270, 540);
    for (let i = 0; i < 4; i++) {
      pc.fillStyle = 'rgba(255,255,255,0.22)';
      pc.fillRect(24 + i * 16, 42 - i * 7, 11, 12 + i * 7);
    }
    pc.fillStyle = '#fff';
    pc.textAlign = 'center';
    pc.font = "400 58px 'Anton', sans-serif";
    pc.fillText('NO', 135, 250);
    pc.fillText('SERVICE', 135, 318);
    pc.fillStyle = '#ff6a5f';
    pc.font = "400 30px 'Anton', sans-serif";
    pc.fillText('CALL FAILED', 135, 372);
    const pt = new THREE.CanvasTexture(S.phoneC);
    pt.colorSpace = THREE.SRGBColorSpace;
    const phone = new THREE.Group();
    phone.position.set(-0.55, 0.93, 0.42);
    phone.rotation.x = -0.45;
    phone.add(b.box(0.12, 0.23, 0.012, '#15171f', { r: 0.005 }));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.106, 0.212), new THREE.MeshBasicMaterial({ map: pt }));
    scr.position.z = 0.0066;
    phone.add(scr);
    room.add(phone);
    // Rollator neben Helen
    const wm = '#3a4a7a';
    const walker = new THREE.Group();
    walker.position.set(-1.35, 0, -0.3);
    for (const [wx, wz] of [[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.1], [0.25, 0.1]]) {
      walker.add(b.box(0.04, 0.9, 0.04, wm, { x: wx, y: 0.47, z: wz, r: 0.012 }));
      walker.add(b.box(0.05, 0.14, 0.14, '#111319', { x: wx, y: 0.07, z: wz, r: 0.03 }));
    }
    walker.add(b.box(0.56, 0.04, 0.04, wm, { y: 0.9, z: 0.1, r: 0.012 }));
    walker.add(b.box(0.5, 0.03, 0.34, '#22242e', { y: 0.52, z: -0.07, r: 0.01 }));
    room.add(walker);
    S.floorSmoke = makeSmoke(150, 1.1, '#9a9690');
    room.add(S.floorSmoke);

    // ---------- Aussen: Hochhaus mit Kerzen ----------
    const city = group();
    city.add(b.ground(1400, '#171a24'));
    const tower = (x, z, w, h, d, color) => mk(city, w, h, d, color, x, h / 2, z, { r: 0.05 });
    tower(0, 8, 30, 60, 20, '#343c5e');
    for (let gx = -5; gx <= 5; gx++) {
      for (let gz = 0; gz < 4; gz++) {
        const x = gx * 44 + rng.range(-5, 5);
        const z = -60 - gz * 50;
        if (Math.abs(x) < 30 && z > -120) continue;
        tower(x, z, 24, rng.range(26, 90), 24, rng.pick(['#232a44', '#2a2f4a', '#1f2740']));
      }
    }
    const list = [];
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 9; c++) {
        list.push({ x: -13.3 + c * 3.3, y: 1.7 + r * 3, on: rng() < 0.74, t: at.candles + 0.15 + rng() * 2.2 });
      }
    }
    S.win = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5, 1.7), new THREE.MeshBasicMaterial({ color: '#ffffff' }), list.length);
    S.win.frustumCulled = false;
    const dummy = new THREE.Object3D();
    list.forEach((w, i) => {
      dummy.position.set(w.x, w.y, -2.06);
      dummy.rotation.y = Math.PI;
      dummy.updateMatrix();
      S.win.setMatrixAt(i, dummy.matrix);
    });
    const dark = new THREE.Color(0.02, 0.025, 0.05);
    const warm = new THREE.Color();
    S.paintWin = (t) => {
      list.forEach((w, i) => {
        const k = w.on ? Math.min(1, Math.max(0, (t - w.t) / 0.25)) : 0;
        const fl = 1 + Math.sin(t * 9 + i) * 0.12;
        S.win.setColorAt(i, k > 0 ? warm.setRGB(1.05 * k * fl + 0.02, 0.4 * k * fl + 0.02, 0.07 * k + 0.05) : dark);
      });
      S.win.instanceColor.needsUpdate = true;
    };
    S.paintWin(0);
    city.add(S.win);
    const starPos = [];
    for (let i = 0; i < 700; i++) {
      const az = rng.range(0, Math.PI * 2);
      const el = rng.range(0.1, 1.4);
      starPos.push(Math.cos(az) * Math.cos(el) * 480, Math.sin(el) * 480, Math.sin(az) * Math.cos(el) * 480);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    city.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
    const fillC = new THREE.DirectionalLight('#8ea4dc', 0.9);
    fillC.position.set(-30, 70, -80);
    city.add(fillC);

    // ---------- Treppenhaus voller Rauch ----------
    const stairs = group();
    for (let i = -18; i <= 18; i++) {
      mk(stairs, 0.31, 0.18, 2.4, i % 2 ? '#62656f' : '#6a6d78', i * 0.3, i * 0.18 + 1.6, 0, { r: 0.012 });
      mk(stairs, 0.31, 3, 2.4, '#4a4c56', i * 0.3, i * 0.18, 0, { r: 0.005 });
    }
    mk(stairs, 40, 18, 0.2, '#3f4250', 0, 4, -1.3);
    const rail = mk(stairs, 13, 0.05, 0.05, '#c9423a', 0, 2.6, -1.05, { r: 0.02 });
    rail.rotation.z = Math.atan2(0.18, 0.3);
    S.fireLight = new THREE.PointLight('#ff7a2a', 0, 18, 1.2);
    S.fireLight.position.set(-3.2, 0.9, 1);
    stairs.add(S.fireLight);
    const sl = new THREE.PointLight('#c2cbe0', 9, 14, 1.2);
    sl.position.set(1.8, 5.2, 3);
    stairs.add(sl);
    S.stairSmoke = makeSmoke(170, 1.35, '#8d8984');
    stairs.add(S.stairSmoke);

    S.sets = { landing, room, city, stairs };

    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'room', { dur: duration, gain: -26 });
    add(0, 'murmur', { dur: at.bolt + 1.2, gain: -14, space: 'stairs' });
    add(0.9, 'thud', { gain: -7, pitch: 0.8, space: 'stairs' });
    add(1.3, 'thud', { gain: -8, pitch: 0.8, space: 'stairs' });
    add(1.75, 'thud', { gain: -7, pitch: 0.8, space: 'stairs' });
    add(at.bolt + 1.3, 'bolt', { gain: -9, space: 'stairs' });
    add(at.water + 1.8, 'click', { gain: -11 });
    add(at.water + 2.15, 'click', { gain: -12 });
    add(at.water + 2.7, 'powerdown', { dur: 0.5, gain: -14 });
    add(at.candles, 'wind', { dur: at.smell - at.candles + 1, gain: -22 });
    for (let k = 0; k < 8; k++) add(at.candles + 0.3 + k * 0.28, 'click', { gain: -22, pitch: 1.6 + k * 0.05 });
    add(at.warn, 'crackle', { dur: at.smell - at.warn + 1.5, gain: -14 });
    add(at.smell + 2.2, 'heart', { gain: -11 });
    add(at.smell + 3.3, 'heart', { gain: -10 });
    add(at.smoke + 0.6, 'impact', { gain: -8 });
    add(at.smoke + 0.6, 'boom', { dur: 1.3, gain: -14 });
    add(at.smoke + 0.3, 'alarm', { dur: 7, gain: -24, pan: -0.4 });
    add(at.crack + 0.2, 'creak', { dur: 0.8, gain: -6, space: 'hall' });
    add(at.crack + 0.5, 'fire', { dur: at.dial - at.crack + 1, gain: -15, space: 'stairs' });
    add(at.crack + 1.2, 'murmur', { dur: 2.5, gain: -20, space: 'stairs' });
    add(at.floor9 - 0.35, 'cough', { gain: -14, pan: 0.4, space: 'stairs' });
    add(at.floor9, 'riser', { dur: 3, gain: -15 });
    add(at.dial + 0.3, 'click', { gain: -7, pitch: 1.3 });
    add(at.dial + 1, 'glitch', { gain: -9 });
    add(at.hose + 0.3, 'siren', { dur: 3.6, gain: -23, pan: 0.5 });
    for (let t = at.look + 0.6; t < at.go - 0.3; t += 0.86) add(t, 'heart', { gain: -8 + (t - at.look) * 0.25 });
    add(at.go - 0.65, 'cough', { gain: -16, pitch: 0.85 });
    add(at.choice, 'fire', { dur: 2.3, gain: -14, space: 'stairs' });
    add(at.ask - 0.65, 'thud', { gain: -2, pitch: 0.65, space: 'hall' });
    add(at.ask + 0.8, 'cough', { gain: -12 });
    add(at.ask + 1.6, 'whoosh', { gain: -12 });
    add(at.ask + 1.9, 'pop', { gain: -10 });
    add(at.ask + 2.2, 'pop', { gain: -10, pitch: 1.2 });
    add(at.ask + 2, 'riser', { dur: 2.6, gain: -14 });
    for (let t = at.ask + 1.8; t < duration - 0.8; t += 0.8) add(t, 'heart', { gain: -8 });
    S.cues = cue;
    S.cueI = 0;

    const cover = ctx.coverMode;
    const face = (x, z) => [x, 1.75, z];
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, set: 'landing', pose: 'crowd', aperture: 0.7, pos: [0.4, 1.9, 8.6], look: [0, cover ? 1.95 : 2.1, 0], fov: 50, move: { pos: [0.3, 1.85, 7.8], dur: at.bolt }, focus: face(0, 3.4) },
      { at: at.bolt, set: 'landing', pose: 'none', aperture: 0.8, pos: [0.3, 1.8, 6.6], look: [0.1, 1.5, -1.4], fov: 46, move: { pos: [0.25, 1.75, 5.8], dur: 1.2 }, focus: [0.1, 1.4, -1.35] },
      { at: at.bolt + 1.05, set: 'landing', pose: 'hide', aperture: 0.3, pos: [0.42, 1.42, -0.2], look: [0.2, 1.3, -1.35], fov: 36, focus: [0.25, 1.32, -1.33] },
      { at: at.water, set: 'room', aperture: 0.8, pos: [0.15, 1.85, 3.3], look: [0.1, 1.15, -0.6], fov: 58, move: { pos: [0.12, 1.8, 3.0], dur: 3.4 }, focus: [0.3, 1, 0] },
      { at: at.candles, set: 'city', pos: [-30, 7, -96], look: [0, 42, -2], fov: 46, aperture: 0.05, move: { pos: [-26, 8, -86], dur: 3 } },
      { at: at.warn, set: 'room', aperture: 5, pos: [0.15, 1.22, 1.7], look: [-0.1, 1.0, 0.3], fov: 40, move: { pos: [0.12, 1.2, 1.45], dur: 3 }, focus: [0.05, 1.03, 0.25] },
      { at: at.smell, set: 'room', aperture: 1.8, pos: [-0.55, 1.62, 1.75], look: [-1, 1.65, -1], fov: 40, move: { pos: [-0.65, 1.62, 1.35], dur: 5 }, focus: face(-1, -1) },
      { at: at.smoke, set: 'room', aperture: 0.5, pos: [-2.2, 0.22, 1.1], look: [-2.2, 0.12, 3.4], fov: 46, move: { pos: [-2.2, 0.18, 1.5], dur: 1.6 }, focus: [-2.2, 0.08, 3.3] },
      { at: at.crack, set: 'room', aperture: 1, pos: [-0.6, 1.5, 1.5], look: [-2.15, 1.2, 3.45], fov: 46, move: { pos: [-0.75, 1.45, 1.9], dur: 3 }, focus: [-1.75, 1.2, 3.3] },
      { at: at.floor9, set: 'room', aperture: 1, pos: [0, 1.6, 3], look: [0, 1.2, 0], fov: 50 },
      { at: at.dial, set: 'room', aperture: 5, pos: [-0.55, 1.14, 1.0], look: [-0.55, 0.84, 0.42], fov: 40, move: { pos: [-0.55, 1.1, 0.92], dur: 2 }, focus: [-0.55, 0.93, 0.42] },
      { at: at.hose, set: 'room', aperture: 1, pos: [0, 1.6, 3], look: [0, 1.2, 0], fov: 50 },
      { at: at.look, set: 'room', aperture: 2, pos: [-0.2, 1.55, 2.1], look: [-1.1, 1.3, -0.8], fov: 44, move: { pos: [-0.35, 1.55, 1.7], dur: 4.5 }, focus: face(-1, -1) },
      { at: at.alone, set: 'room', aperture: 2, pos: [-0.15, 1.72, 2.0], look: [1.1, 1.72, -0.9], fov: 40, move: { pos: [0, 1.72, 1.75], dur: 3.3 }, focus: face(1.2, -0.9) },
      { at: at.go, set: 'room', aperture: 3, pos: [-0.75, 1.62, 1.05], look: [-1, 1.65, -1], fov: 38, focus: face(-1, -1) },
      { at: at.choice, set: 'stairs', pos: [1.9, 2.8, 4.9], look: [-1.3, 2.1, 0], fov: 50, aperture: 0.8, move: { pos: [1.5, 2.7, 4.3], dur: 2.2 }, focus: [-0.8, 2, 0] },
      { at: at.choice + 2.2, set: 'room', pose: 'shut', aperture: 2, pos: [-2.2, 1.45, 0.9], look: [-2.2, 1.2, 3.4], fov: 46, focus: [-2.2, 1.2, 3.4] },
      { at: at.ask, set: 'room', pose: 'hero', aperture: 2, pos: [-2.15, 1.75, -0.65], look: [-2.2, 2.0, 1.4], fov: 52, move: { pos: [-2.15, 1.75, -0.4], dur: 2 }, focus: face(-2.2, 1.4) },
    ]);
  },

  update(ctx, t) {
    const { state: S, blocks: b, phase, motion } = ctx;
    while (S.cueI < S.cues.length && S.cues[S.cueI][0] <= t) {
      const [, name, opts] = S.cues[S.cueI++];
      ctx.sound(name, opts);
    }
    const shot = S.rig.list[S.rig.current(t)];
    for (const [name, g] of Object.entries(S.sets)) g.visible = name === shot.set;
    const bg = { city: '#0a1030', stairs: '#2a2a2e' }[shot.set] || '#05060c';
    ctx.scene.background.set(bg);
    S.hemi.intensity = shot.set === 'city' ? 0.5 : shot.set === 'stairs' ? 0.3 : 0.22;

    const you = S.you;
    you.visible = false;
    S.helen.visible = false;
    const blink = (o) => (((t + o) * 0.36) % 1 < 0.05 ? 1 : 0);
    b.blink(you, t > 1 && t < at.ask ? blink(1.3) : 0);
    b.blink(S.helen, t < at.go ? blink(0.4) : 0);
    you.scale.y = 1 + Math.sin(t * 2.2) * 0.009;
    S.helen.scale.y = 0.92 + Math.sin(t * 1.7) * 0.007;

    if (shot.set === 'landing') {
      you.visible = shot.pose === 'crowd';
      you.position.set(0, 0, 3.4);
      you.rotation.y = -Math.PI / 2 + 0.1;
      b.expression(you, 'worried');
      b.look(you, 0.3, 0.2);
      S.crowd.forEach((p, i) => {
        p.position.y = Math.abs(Math.sin(t * 5 + i * 1.7)) * 0.04;
        p.userData.limbs.armL.rotation.z = i % 3 === 0 ? 1.8 + Math.sin(t * 6 + i) * 0.5 : 0;
      });
      S.crowd.forEach((p) => (p.visible = shot.pose !== 'hide'));
      S.bolt.position.x = 0.19 - 0.24 * motion.ease.inOutCubic(phase(t, at.bolt + 1.05, at.bolt + 1.35));
    }

    if (shot.set === 'city') S.paintWin(t);

    if (shot.set === 'room') {
      const flash = t < at.candles;
      const dying = phase(t, at.water + 1.8, at.water + 2.8);
      const fl = dying > 0 ? (Math.sin(t * 46) > 0.1 ? 1 - dying : 0.12 * (1 - dying)) : 1;
      S.torch.intensity = flash ? 5 * fl : 0;
      S.lens.material.color.setRGB(1.6 * fl + 0.05, 1.6 * fl + 0.05, 1.3 * fl + 0.05);
      const lit = t >= at.warn;
      S.flames.forEach((f) => (f.visible = lit));
      S.candleLight.intensity = lit ? 9 + Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6 : 0;

      const helenOn = shot.pose !== 'hero' && shot.pose !== 'shut';
      S.helen.visible = helenOn;
      S.helen.position.set(-0.9, 0, -1);
      S.helen.rotation.y = -Math.PI / 2 + 0.15;
      const head = S.helen.userData.face.head;
      const lift = motion.ease.inOutCubic(phase(t, at.smell + 1.3, at.smell + 2.1));
      head.rotation.y = t < at.go ? -0.12 - 0.5 * lift * (t < at.smoke ? 1 : 0.4) : 0;
      b.expression(S.helen, t >= at.go ? 'smile' : t >= at.smell + 2 && t < at.crack ? 'o' : 'worried');
      b.look(S.helen, t >= at.smell + 1.3 && t < at.look ? -0.8 : t >= at.go ? 0 : 0.1, 0);

      you.visible = t < at.warn || (t >= at.alone && t < at.go) || shot.pose === 'hero' || t >= at.look;
      if (shot.pose === 'hero') {
        you.position.set(-2.2, 0, 1.4);
        you.rotation.y = Math.PI / 2;
      } else {
        you.position.set(1.05, 0, -0.9);
        you.rotation.y = Math.PI + 0.45;
      }
      b.expression(you, t >= at.look ? 'worried' : 'flat');
      b.look(you, t >= at.alone && t < at.go ? Math.sin(t * 1.9) * 0.9 : 0, 0);

      const open = t >= at.crack + 0.2 && t < at.floor9 ? motion.ease.outCubic(phase(t, at.crack + 0.2, at.crack + 0.8)) : 0;
      const shake = t >= at.ask - 0.65 && t < at.ask - 0.35 ? Math.sin(t * 90) * 0.012 : 0;
      S.door.rotation.y = 0.36 * open + shake;
      S.gray.visible = true;
      S.gap.visible = t >= at.smoke;

      // Rauch kriecht unter der Tuer in den Raum
      const on = phase(t, at.smoke - 0.1, at.smoke + 1.2);
      S.floorSmoke.visible = on > 0;
      S.floorSmoke.material.opacity = 0.2 + 0.16 * phase(t, at.look, at.ask);
      const pos = S.floorSmoke.geometry.attributes.position;
      const reach = 0.3 + 3.2 * phase(t, at.smoke, at.ask);
      S.floorSmoke.userData.seed.forEach(([a, c, d], i) => {
        const u = (t * (0.1 + d * 0.11) + a) % 1;
        const up = open > 0 && i % 3 === 0;
        pos.setXYZ(i, up ? -1.75 + (c - 0.5) * 0.3 - u * 0.9 : -2.2 + (c - 0.5) * (1 + u * 3.4), up ? 0.2 + u * 2.1 : 0.1 + u * 0.32 + d * 0.15, up ? 3.3 - u * 1.2 : 3.35 - u * reach);
      });
      pos.needsUpdate = true;
    }

    if (shot.set === 'stairs') {
      S.fireLight.intensity = 60 + Math.sin(t * 17) * 13 + Math.sin(t * 7) * 11;
      S.stairSmoke.material.opacity = 0.17;
      const pos = S.stairSmoke.geometry.attributes.position;
      S.stairSmoke.userData.seed.forEach(([a, c, d], i) => {
        const u = (t * (0.05 + d * 0.06) + a) % 1;
        pos.setXYZ(i, -5.5 + c * 10 + u * 2, 0.4 + u * 6, -0.8 + d * 3);
      });
      pos.needsUpdate = true;
    }
    S.rig.apply(ctx.camera, t, ctx);
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    const set = S.rig.list[S.rig.current(t)].set;
    const grades = { landing: '#d8cfc6', room: '#ffe2c4', city: '#c3cfea', stairs: '#d8cdc2' };
    if (ctx.coverMode) {
      ui.grade(g, { color: grades.landing, edge: 0.55 });
      ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 3', y: 545, size: 118 });
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
    snap('imgA', at.choice + 1.2);
    snap('imgB', at.choice + 2.8);
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.grade(g, { color: grades[set], edge: 0.72 });
    ui.haze(g, 0.22 * phase(t, at.crack, at.ask));
    ui.vignette(g, 0.45);

    const smokeNow = 9 + 4 * phase(t, FIRE_T, at.ask - 0.5);
    const schema = (t >= at.floor9 && t < at.dial) || (t >= at.hose && t < at.look);
    if (schema) {
      const start = t < at.dial ? at.floor9 : at.hose;
      const end = t < at.dial ? at.dial : at.look;
      ui.section(g, { alpha: phase(t, start - 0.05, start + 0.2) * (1 - phase(t, end - 0.25, end)), level: 7, pump: 0, fire: 9, smoke: smokeNow, showMains: t >= at.hose ? 1 : 0, mainsLabel: 'HOSE', mainsSub: 'PRESSURE' });
    }
    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && !schema && t < at.ask && t >= at.bolt) ui.clock(g, clock[1]);
    if (t >= at.water && t < at.ask && !schema) ui.gauge(g, { label: 'WATER LEFT', value: '11 L', warn: true, x: 60, y: 90 });
    if (t >= at.bolt && t < at.ask) {
      const left = Math.ceil(at.ask - t);
      ui.gauge(g, { label: 'DECISION IN', value: `${left}s`, warn: left <= 10, x: 800, y: 90 });
    }
    if (t >= FIRE_T && t < at.ask) ui.gauge(g, { label: 'SMOKE', value: `FLOOR ${Math.floor(smokeNow)}`, warn: true, x: 765, y: 240 });
    if (t >= at.warn && t < at.smell) ui.rule(g, { label: 'Rule #4', text: 'Flashlights, not candles', y: 270, k: pop(at.warn + 0.1, at.smell) });
    if (t >= at.look + 1 && t < at.alone) ui.nameTag(g, { name: 'Helen', info: '81 · Apt 14B', y: 1130, k: pop(at.look + 1, at.alone) });

    if (t < at.ask) ui.words(g, t, chunks);
    if (t < at.bolt) ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 3', y: 240, size: 150, alpha: 1 - phase(t, at.bolt - 0.3, at.bolt) });

    const vote = at.ask + 1.6;
    if (t >= at.ask && t < vote) ui.cover(g, { lines: ['What would', '*you do?*'], y: 280, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
    if (t >= vote) ui.vote(g, { title: 'Run or stay?', a: 'Run', b: 'Stay', comment: 'Comment RUN or STAY', next: 'Part 4 soon · Follow', k: phase(t, vote, vote + 0.3), imgA: S.imgA, imgB: S.imgB });
  },
};
