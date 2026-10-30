// Blackout in a high-rise, Part 5: Serienfinale. Stimme gibt das Timing vor (node timing.mjs).

import script from './blackout5.script.js';
import timing from './blackout5.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing, { tail: 4.2 });

const CLOCKS = [
  ['hook', 'DAY 3 · 11:50 PM'],
  ['sealed', 'DAY 4 · 7:10 AM'],
  ['line', '11:20 AM'],
  ['marek', '3:25 PM'],
  ['day6', 'DAY 6 · 6:42 PM'],
  ['tap', '7:15 PM'],
];
const LIGHTS = at.lights + 0.4;
const RULES = [
  ['r1', '1', 'Stay out of the elevator'],
  ['r2', '2', 'Keep the fridge shut'],
  ['r3', '3', "Don't flush drinking water"],
  ['r4', '4', 'Flashlights, not candles'],
  ['r5', '5', 'A closed door buys time'],
];

export default {
  title: 'Blackout in a high-rise, Part 5',
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'Blackout in a high-rise', part: 5 },
  caption: {
    scenario: 'The finale: 6 days without power',
    emoji: '💡🏢',
    question: 'How many days would you last? Comment your number',
    tags: ['blackout', 'whatif', 'survival', 'scenario', 'highrise', 'prepared'],
  },
  duration,
  fps: 30,
  seed: 53,
  look: {
    env: 0.12,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 1.5, maxblur: 0.012 },
    bloom: { strength: 0.32, radius: 0.5, threshold: 1.4 },
  },
  sources: [
    'About 5,200 emergency wells in Germany: BBK figure, reported by Rheinpfalz',
    'Restoration is staged to avoid cold load overload: research on cold load pickup, Chalmers and Univ. Kassel',
    'Water supply: 2 L per person per day, about 20 L for 10 days: BBK guide',
    'Rules: TAB report, Berlin fire department, German fire service guidance, Verbraucherzentrale Niedersachsen',
  ],
  music: {
    bpm: 76,
    gain: -10,
    duck: 0.72,
    sections: [
      { at: 0, mood: 'dread' },
      { at: at.well, mood: 'pulse' },
      { at: at.marek, mood: 'calm' },
      { at: at.grid, mood: 'suspense' },
      { at: at.day6, mood: 'silence' },
      { at: LIGHTS, mood: 'resolve' },
      { at: at.rules, mood: 'pulse' },
      { at: at.lesson, mood: 'calm' },
      { at: at.ask, mood: 'build' },
    ],
  },
  story: { hook: 'Your last water is on floor 14. The fire crew says no.', beats },

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

    const helmet = (p, color) => {
      const h = p.userData.face.head;
      h.add(b.box(0.74, 0.22, 0.74, color, { y: 0.62, r: 0.1 }));
      h.add(b.box(0.82, 0.05, 0.82, color, { y: 0.52, r: 0.02 }));
      const mask = b.box(0.1, 0.34, 0.5, '#20232c', { x: 0.32, y: 0.2, r: 0.04 });
      h.add(mask);
      return p;
    };
    // Strasse vor dem Hochhaus: Menge, Loeschfahrzeug, Laternen
    S.lamps = [];
    for (let i = 0; i < 8; i++) {
      for (const sx of [-16, 16]) {
        mk(city, 0.3, 7, 0.3, '#3a3d48', sx, 3.5, -70 + i * 8);
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: '#1a1a22' }));
        l.position.set(sx * 0.93, 7.1, -70 + i * 8);
        city.add(l);
        S.lamps.push(l);
      }
    }
    S.streetGlow = new THREE.PointLight('#ffd9a0', 0, 60, 1);
    S.streetGlow.position.set(0, 10, -36);
    city.add(S.streetGlow);
    S.truck = new THREE.Group();
    S.truck.position.set(-9, 0, -18);
    S.truck.add(b.box(9, 2.6, 2.6, '#c9272b', { y: 1.8 }));
    S.truck.add(b.box(2.4, 2, 2.5, '#d9dbe2', { x: 3.6, y: 2.2 }));
    for (const wx of [-3, 2.6]) for (const wz of [-1.2, 1.2]) S.truck.add(b.box(1, 1, 0.5, '#101218', { x: wx, y: 0.5, z: wz, r: 0.2 }));
    S.blue = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.5, 3.6) }));
    S.blue.position.set(3.6, 3.4, 0);
    S.truck.add(S.blue);
    city.add(S.truck);
    S.blueLight = new THREE.PointLight('#3f6fff', 0, 34, 1.2);
    S.blueLight.position.set(-6, 5, -20);
    city.add(S.blueLight);
    S.people = [];
    for (let i = 0; i < 16; i++) {
      const p = b.person({ shirt: ['#3f7f73', '#4a70c9', '#b54d8c', '#e0a33a', '#6d5bb0', '#8a8f9e'][i % 6], pants: ['#27324f', '#3a3a44'][i % 2] });
      p.position.set(-9 + (i % 6) * 3.6 + rng.range(-0.6, 0.6), 0, -32 + Math.floor(i / 6) * 3 + rng.range(-0.5, 0.5));
      p.rotation.y = Math.PI / 2 + rng.range(-0.3, 0.3);
      b.expression(p, 'worried');
      city.add(p);
      S.people.push(p);
    }
    S.crewOut = [-1.2, 1.3].map((x) => {
      const p = helmet(b.person({ shirt: '#20242e', pants: '#20242e', shoes: '#111', outfit: 'jacket', hairStyle: 'none' }), '#e8c43a');
      p.position.set(x * 1.9, 0, -38.8);
      p.rotation.y = Math.PI / 2 - 0.2;
      city.add(p);
      return p;
    });

    S.marek = b.character({ shirt: '#3f7f73', pants: '#2b2f3c', skin: '#c99a73', hair: '#4a4a50', outfit: 'tshirt', hairStyle: 'short' });
    b.expression(S.marek, 'flat');
    scene.add(S.marek);
    const bucket = () => {
      const g = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 20), b.mat('#3f6fd8', { roughness: 0.4 }));
      shell.position.y = 0.16;
      g.add(shell);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 24, Math.PI), b.mat('#b8bcc8'));
      handle.position.y = 0.32;
      g.add(handle);
      g.position.set(0, 0.27, 0.68);
      return g;
    };
    S.you.add(bucket());
    S.marek.add(bucket());
    S.you.userData.bucket = S.you.children.at(-1);
    S.marek.userData.bucket = S.marek.children.at(-1);

    // Absperrung und Notbrunnen
    S.tape = [];
    for (let i = -6; i <= 6; i++) {
      const m = mk(city, 2.2, 0.1, 0.05, i % 2 ? '#e7c43a' : '#1a1a1a', i * 2.2, 1.05, -30.5, { r: 0.01 });
      S.tape.push(m);
    }
    S.well = new THREE.Group();
    S.well.position.set(4, 0, -68);
    S.well.add(b.box(1.4, 1.1, 1.4, '#3f6fa8', { y: 0.55 }));
    S.well.add(b.box(0.14, 1.2, 0.14, '#b8bcc8', { y: 1.5 }));
    S.well.add(b.box(0.9, 0.1, 0.1, '#b8bcc8', { x: 0.4, y: 2 }));
    city.add(S.well);
    S.queue = [];
    for (let i = 0; i < 11; i++) {
      const p = b.person({ shirt: ['#b54d8c', '#4a70c9', '#3f7f73', '#e0a33a', '#6d5bb0'][i % 5], pants: '#2b2f3c' });
      p.position.set(4 - 1.25 * (i + 1), 0, -68 + (i % 2) * 0.25);
      p.rotation.y = 0;
      b.expression(p, 'flat');
      city.add(p);
      S.queue.push(p);
    }

    // Hahn auf Etage 14
    const tapSet = group();
    mk(tapSet, 6, 4, 0.1, '#7c7b72', 0, 1.8, -1);
    mk(tapSet, 6, 0.1, 3, '#55524a', 0, 0.9, 0.2);
    const steel = b.mat('#dfe3ea', { metalness: 0.3, roughness: 0.3 });
    tapSet.add(b.box(0.08, 0.5, 0.08, '', { y: 1.2, z: -0.5, material: steel, r: 0.03 }));
    tapSet.add(b.box(0.08, 0.08, 0.5, '', { y: 1.42, z: -0.28, material: steel, r: 0.03 }));
    S.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.46, 12), new THREE.MeshStandardMaterial({ color: '#7cc8ff', emissive: '#3f95d8', emissiveIntensity: 0.9, roughness: 0.1 }));
    S.stream.position.set(0, 1.17, -0.06);
    tapSet.add(S.stream);
    const tl = new THREE.PointLight('#ffe4bd', 12, 7, 1.3);
    tl.position.set(0.8, 2.4, 1.2);
    tapSet.add(tl);

    S.dayLight = new THREE.DirectionalLight('#e6ecf6', 0);
    S.dayLight.position.set(-30, 60, -90);
    S.dayLight.target.position.set(0, 0, -50);
    scene.add(S.dayLight, S.dayLight.target);
    S.heroLight = new THREE.PointLight('#ffe2c2', 0, 9, 1.3);
    S.heroLight.position.set(0.9, 2.5, -42.3);
    city.add(S.heroLight);
    const groundMat = city.children[0].material;
    S.setDay = (on) => groundMat.color.set(on ? '#71757e' : '#171a24');
    S.paintCity = (t) => {
      list.forEach((w, i) => {
        const k = Math.max(0, Math.min(1, (t - (LIGHTS + (i / list.length) * 1.4)) / 0.12));
        S.win.setColorAt(i, k > 0 && w.on ? warm.setRGB(1.6 * k, 1.15 * k, 0.6 * k) : dark);
      });
      S.win.instanceColor.needsUpdate = true;
      const on = t >= LIGHTS - 0.2;
      S.lamps.forEach((l, i) => {
        const k = on && t >= LIGHTS - 0.2 + i * 0.012 ? 1 : 0;
        l.material.color.setRGB(3 * k + 0.05, 2.2 * k + 0.05, 1.2 * k + 0.05);
      });
      S.streetGlow.intensity = on ? 90 : 0;
    };
    S.paintCity(0);

    S.sets = { room, city, tap: tapSet };

    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'room', { dur: duration, gain: -26 });
    add(0, 'wind', { dur: at.day6, gain: -22 });
    add(0.3, 'siren', { dur: 3, gain: -24, pan: -0.4 });
    add(at.well - 0.3, 'whoosh', { gain: -18 });
    add(at.line, 'murmur', { dur: 3.4, gain: -18, space: 'street' });
    add(at.marek - 0.45, 'creak', { dur: 0.5, gain: -16, pitch: 1.5 });
    add(at.marek + 2.7, 'slosh', { gain: -14 });
    add(at.lights - 0.4, 'heart', { gain: -9 });
    add(at.lights - 1.3, 'heart', { gain: -11 });
    add(LIGHTS - 0.2, 'click', { gain: -7 });
    add(LIGHTS + 0.8, 'ding', { dur: 1.3, gain: -12 });
    add(LIGHTS + 0.8, 'riser', { dur: 1, gain: -18 });
    add(at.tap + 1.7, 'gurgle', { dur: 0.9, gain: -9 });
    add(at.tap + 2.4, 'water', { dur: at.rules - at.tap - 2, gain: -14, space: 'bath' });
    for (const r of RULES) add(at[r[0]] - 0.05, 'pop', { gain: -12 });
    add(at.ask + 1.2, 'ding', { dur: 1.3, gain: -14 });
    S.cues = cue.sort((a2, c) => a2[0] - c[0]);
    S.cueI = 0;

    const face = (x, z) => [x, 1.75, z];
    const hero = (s) => ({ pose: 'hero', set: 'city', aperture: 1.2, pos: [0.15, 1.8, -42.6], look: [0, ctx.coverMode ? 1.95 : 2.1, -40], fov: 52, focus: face(0, -40), ...s });
    S.rig = ctx.motion.shots(THREE, [
      hero({ at: 0, move: { pos: [0.15, 1.8, -42.1], dur: at.sealed } }),
      { at: at.sealed, set: 'city', pose: 'cordon', aperture: 0.05, pos: [2.2, 2, -49], look: [0, 12, -2], fov: 50, move: { pos: [1.8, 2, -46], dur: 4 } },
      { at: at.well, set: 'city', pose: 'queue', aperture: 0.05, pos: [8.5, 2.1, -61], look: [-1, 1.6, -68], fov: 52, move: { pos: [7.8, 2.1, -61.5], dur: 3.5 } },
      { at: at.line, set: 'city', pose: 'queue', aperture: 0.8, pos: [-5.5, 1.75, -63.4], look: [-3.5, 1.65, -67.8], fov: 44, focus: face(-3.5, -68) },
      { at: at.marek, set: 'city', pose: 'pair', aperture: 0.8, pos: [-0.5, 1.85, -60.6], look: [-0.5, 1.45, -66], fov: 46, move: { pos: [-0.5, 1.82, -61.4], dur: 3.5 }, focus: face(-0.5, -66) },
      { at: at.grid, set: 'city', pose: 'cordon', aperture: 0.05, pos: [-30, 7, -96], look: [0, 42, -2], fov: 46, move: { pos: [-26, 8, -86], dur: 4 } },
      { at: at.day6, set: 'city', pose: 'dusk', aperture: 0.05, pos: [0, 1.9, -52], look: [0, 14, 0], fov: 54 },
      { at: at.tap, set: 'tap', aperture: 0.8, pos: [1.0, 1.65, 1.5], look: [0, 1.15, -0.2], fov: 42, move: { pos: [0.9, 1.6, 1.3], dur: 3 }, focus: [0, 1.2, -0.06] },
      { at: at.rules, set: 'city', pose: 'dusk', aperture: 0.05, pos: [-26, 7, -88], look: [0, 34, -2], fov: 46 },
      { at: at.lesson, set: 'room', pose: 'table', aperture: 0.6, pos: [0.15, 1.85, 3.2], look: [0, 1.2, -0.6], fov: 58, move: { pos: [0.1, 1.8, 2.8], dur: 4 } },
      hero({ at: at.ask, pose: 'hero2', pos: [0.15, 1.8, -42.3], look: [0, 2.1, -40] }),
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
    const day = t >= at.sealed && t < at.day6;
    ctx.scene.background.set(shot.set === 'tap' ? '#303030' : day ? '#7f8ea8' : t >= at.day6 ? '#16204a' : '#0a1030');
    S.hemi.intensity = day ? 1.6 : shot.set === 'city' ? 0.6 : 0.3;
    S.dayLight.intensity = day && shot.set === 'city' ? 2.4 : 0;
    S.setDay(day);
    S.heroLight.intensity = !day && shot.set === 'city' ? 10 : 0;
    const you = S.you;
    you.visible = false;
    S.helen.visible = false;
    S.marek.visible = false;
    const blink = (o) => (((t + o) * 0.36) % 1 < 0.05 ? 1 : 0);
    b.blink(you, t > 1 && t < at.ask ? blink(1.3) : 0);
    b.blink(S.helen, blink(0.4));
    b.blink(S.marek, blink(2.1));
    you.scale.y = 1 + Math.sin(t * 2.2) * 0.009;
    you.userData.bucket.visible = shot.pose === 'pair';
    S.marek.userData.bucket.visible = shot.pose === 'pair';

    if (shot.set === 'city') {
      S.paintCity(t);
      const onScene = shot.pose === 'hero' || shot.pose === 'hero2' || shot.pose === 'cordon';
      S.truck.visible = t < at.well;
      S.blue.visible = t < at.well && Math.sin(t * 12) > 0;
      S.blueLight.intensity = t < at.well && Math.sin(t * 12) > 0 ? 22 : 0;
      S.people.forEach((p) => (p.visible = t < at.well));
      S.crewOut.forEach((p, i) => {
        p.visible = t < at.well;
        p.position.set(-1.2 + i * 2.4, 0, -37.3);
        p.rotation.y = Math.PI / 2;
      });
      S.tape.forEach((m) => (m.visible = t < at.well));
      if (shot.pose === 'hero' || shot.pose === 'hero2') {
        you.visible = true;
        you.position.set(0, 0, -40);
        you.rotation.y = Math.PI / 2;
        b.expression(you, shot.pose === 'hero2' ? 'smile' : 'worried');
      }
      const pair = shot.pose === 'pair' || shot.pose === 'queue';
      if (pair) {
        you.visible = true;
        you.position.set(-1, 0, -66.2);
        you.rotation.y = -Math.PI / 2 + 0.2;
        b.expression(you, 'flat');
      }
      if (shot.pose === 'pair') {
        S.marek.visible = true;
        S.marek.position.set(-0.05, 0, -65.9);
        S.marek.rotation.y = -Math.PI / 2 - 0.25;
        b.expression(S.marek, 'smile');
      }
      void onScene;
    }
    if (shot.pose === 'dusk' && t < at.tap) {
      you.visible = true;
      you.position.set(0, 0, -47.5);
      you.rotation.y = -Math.PI / 2;
    }
    if (shot.set === 'room') {
      S.torch.intensity = 0;
      S.flames.forEach((f) => (f.visible = false));
      S.candleLight.intensity = 0;
      const lamp = 18;
      S.lampOn = S.lampOn || new ctx.THREE.PointLight('#ffdca6', lamp, 16, 1.4);
      if (!S.lampOn.parent) {
        S.lampOn.position.set(0, 2.5, 0.6);
        S.sets.room.add(S.lampOn);
      }
      S.helen.visible = true;
      S.helen.position.set(-0.9, 0, -1);
      S.helen.rotation.set(0, -Math.PI / 2 + 0.15, 0);
      b.expression(S.helen, 'smile');
      you.visible = true;
      you.position.set(1.05, 0, -0.9);
      you.rotation.y = Math.PI + 0.45;
      b.expression(you, 'smile');
      S.floorSmoke.visible = false;
      S.gap.visible = false;
    }
    S.rig.apply(ctx.camera, t, ctx, t >= LIGHTS && t < LIGHTS + 0.6 ? motion.shake(t, LIGHTS, { amp: 0.02, decay: 6 }) : [0, 0, 0]);
    void phase;
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    const set = S.rig.list[S.rig.current(t)].set;
    const day = t >= at.sealed && t < at.day6;
    const color = set === 'room' ? '#ffe9d2' : set === 'tap' ? '#ffe9d2' : day ? '#e0e4ec' : '#c3cfea';
    if (ctx.coverMode) {
      ui.grade(g, { color, edge: 0.55 });
      ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Finale', y: 545, size: 118 });
      return;
    }
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.grade(g, { color, edge: 0.64 });
    ui.vignette(g, 0.42);
    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && t >= at.sealed && t < at.rules) ui.clock(g, clock[1]);
    const litres = t >= at.line + 3 ? '10 L' : '0 L';
    if (t >= at.sealed && t < at.rules) ui.gauge(g, { label: 'WATER LEFT', value: litres, warn: t < at.line + 3, x: 60, y: 90 });
    if (t >= at.well + 0.8 && t < at.line) ui.rule(g, { label: 'Backup water', text: '≈ 5,200 emergency wells', y: 270, k: pop(at.well + 0.8, at.line) });
    if (t >= at.lesson && t < at.ask) ui.rule(g, { label: 'Official advice', text: '2 L a day × 10 days', result: '= 20 L per person', y: 270, k: pop(at.lesson + 1.2, at.ask) });
    if (t >= at.rules && t < at.lesson) {
      RULES.forEach(([id, n, text], i) => {
        const k = motion.ease.outBack(phase(t, at[id] - 0.1, at[id] + 0.2));
        if (k <= 0) return;
        g.save();
        g.globalAlpha = Math.min(1, k * 1.6) * (1 - phase(t, at.lesson - 0.2, at.lesson));
        const y = 330 + i * 172;
        g.fillStyle = 'rgba(8,10,20,0.92)';
        g.beginPath();
        g.roundRect(60, y, 960, 150, 24);
        g.fill();
        g.fillStyle = '#ffd23f';
        g.font = "400 96px 'Anton'";
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillText(n, 96, y + 80);
        g.fillStyle = '#fff';
        g.font = "400 66px 'Anton'";
        g.fillText(text.toUpperCase(), 180, y + 80);
        g.restore();
      });
    }
    if (t < at.ask) ui.words(g, t, chunks);
    if (t < at.sealed) ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Finale', y: 240, size: 150, alpha: 1 - phase(t, at.sealed - 0.3, at.sealed) });
    if (t >= at.ask) {
      ui.cover(g, { lines: ['How many days', '*would you last?*'], y: 280, size: 130, alpha: phase(t, at.ask, at.ask + 0.2) });
      const k = phase(t, at.ask + 1.3, at.ask + 1.6);
      if (k > 0) ui.rule(g, { label: 'Comment your number', text: 'New series soon · Follow', y: 1440, k });
    }
  },
};
