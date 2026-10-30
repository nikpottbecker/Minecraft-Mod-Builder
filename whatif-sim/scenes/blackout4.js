// Blackout in a high-rise, Part 4: "Three knocks". Greift den ersten echten Kommentar aus Part 2 auf.
// Stimme gibt das Timing vor (blackout4.script.js, node timing.mjs).

import script from './blackout4.script.js';
import timing from './blackout4.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing, { tail: 5.2 });

const CLOCKS = [
  ['now', 'DAY 3 · 7:58 PM'],
  ['nobody', '8:05 PM'],
  ['wait', '8:41 PM'],
  ['crew', '8:52 PM'],
  ['payoff', '9:30 PM'],
  ['lights', '9:47 PM'],
];

export default {
  title: 'Blackout in a high-rise, Part 4',
  voice: script.voice,
  tts: script.tts,
  rate: script.rate,
  pitch: script.pitch,
  fxGain: 5,
  fxDuck: 0.93,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'Blackout in a high-rise', part: 4 },
  caption: {
    scenario: 'You stayed behind a closed door',
    emoji: '🚒🏢',
    question: 'Would you go back for your water?',
    tags: ['blackout', 'whatif', 'survival', 'scenario', 'highrise', 'firesafety'],
  },
  duration,
  fps: 30,
  seed: 47,
  look: {
    env: 0.1,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 2, maxblur: 0.012 },
    bloom: { strength: 0.3, radius: 0.5, threshold: 1.4 },
  },
  sources: [
    'Smoke in the stairwell: stay in, close doors, seal gaps, signal at a window; closed doors usually hold fire and smoke until crews arrive: Feuerwehr Lehrte, Baden-Württemberg Interior Ministry, Feuerwehr Peising, German fire service guidance',
    'Standard turntable ladder DLK 23/12: nominal rescue height 23 m: Baunetz Wissen, Feuerwehr Münster',
    'Escape hoods fitted by crews: City of Neuss fire service leaflet; at least 15 minutes protection: Dräger',
    'Cold load pickup: after an outage demand surges and restored circuits can trip again: Chalmers dissertation, Univ. Kassel research',
    'Math: 14 floors × 3 m = 42 m; 11 L − 2 L = 9 L',
  ],
  music: {
    bpm: 76,
    gain: -10,
    duck: 0.72,
    sections: [
      { at: 0, mood: 'dread' },
      { at: at.crews, mood: 'suspense' },
      { at: at.nobody, mood: 'dread' },
      { at: at.wait, mood: 'silence' },
      { at: at.knock + 0.9, mood: 'drive' },
      { at: at.payoff, mood: 'resolve' },
      { at: at.surge, mood: 'build' },
      { at: at.trip, mood: 'silence' },
      { at: at.last, mood: 'dread' },
      { at: at.ask, mood: 'silence' },
      { at: at.ask + 1.6, mood: 'suspense' },
    ],
  },
  story: { hook: "In the comments, B told you: don't tell. You told them anyway.", beats },

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


    // Handtuecher, Hitze an der Tuer, Handy-Licht am Fenster
    S.towel = mk(room, 1.1, 0.09, 0.2, '#d9d4c7', -2.2, 0.06, 3.28, { r: 0.04 });
    S.heat = new THREE.PointLight('#ff7a2a', 0, 3.2, 1.5);
    S.heat.position.set(-2.2, 1.0, 3.2);
    room.add(S.heat);
    S.signal = new THREE.PointLight('#dfeaff', 0, 4, 1.5);
    room.add(S.signal);
    S.hand = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.3), glow(2.6, 2.7, 3));
    room.add(S.hand);

    const helmet = (p, color) => {
      const h = p.userData.face.head;
      h.add(b.box(0.74, 0.22, 0.74, color, { y: 0.62, r: 0.1 }));
      h.add(b.box(0.82, 0.05, 0.82, color, { y: 0.52, r: 0.02 }));
      const mask = b.box(0.1, 0.34, 0.5, '#20232c', { x: 0.32, y: 0.2, r: 0.04 });
      h.add(mask);
      return p;
    };
    S.crewRoom = [0, 1].map((i) => {
      const p = helmet(b.person({ shirt: '#20242e', pants: '#20242e', shoes: '#111', outfit: 'jacket', accent: '#e8c43a', hairStyle: 'none' }), '#e8c43a');
      p.position.set(-2.55 + i * 0.95, 0, 2.55 - i * 0.2);
      p.rotation.y = Math.PI / 2;
      room.add(p);
      return p;
    });
    S.crewLight = new THREE.PointLight('#fff4dc', 0, 7, 1.3);
    S.crewLight.position.set(-2, 2.1, 2);
    room.add(S.crewLight);
    const hood = (p) => {
      const g = new THREE.Group();
      g.add(b.box(0.76, 0.78, 0.76, '#e8862a', { y: 0.34, r: 0.14 }));
      g.add(b.box(0.08, 0.3, 0.5, '#d6e6f2', { x: 0.38, y: 0.36, r: 0.03 }));
      g.visible = false;
      p.userData.face.head.add(g);
      return g;
    };
    S.hoods = [hood(S.you), hood(S.helen)];

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
    // Fenster: alles dunkel, nur ein Handy im 14. Stock, spaeter kurz die ganze Stadt
    S.paintCity = (t) => {
      const on = t >= at.lights + 0.9 && t < at.trip + 0.45;
      const flick = on ? (t < at.lights + 1.5 ? (Math.sin(t * 40) > 0 ? 1 : 0.2) : 1) : 0;
      list.forEach((w, i) => {
        const me = i === 13 * 9 + 4 && t < at.knock;
        if (me) S.win.setColorAt(i, warm.setRGB(2.4, 2.6, 3));
        else if (flick > 0 && w.on) S.win.setColorAt(i, warm.setRGB(1.6 * flick, 1.15 * flick, 0.6 * flick));
        else S.win.setColorAt(i, dark);
      });
      S.win.instanceColor.needsUpdate = true;
      S.lamps.forEach((l) => l.material.color.setRGB(3 * flick + 0.05, 2.2 * flick + 0.05, 1.2 * flick + 0.05));
      S.streetGlow.intensity = 90 * flick;
    };

    S.crewStair = [0, 1].map(() => {
      const p = helmet(b.person({ shirt: '#20242e', pants: '#20242e', shoes: '#111', outfit: 'jacket', hairStyle: 'none' }), '#e8c43a');
      p.rotation.y = Math.PI;
      stairs.add(p);
      return p;
    });
    S.sets = { room, city, stairs };

    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'room', { dur: duration, gain: -26 });
    add(0, 'fire', { dur: at.seal + 1, gain: -22, space: 'stairs' });
    add(at.now - 0.4, 'pop', { gain: -14 });
    add(at.instinct - 0.25, 'heart', { gain: -9 });
    add(at.crews - 0.55, 'cough', { gain: -16, pan: 0.5, space: 'stairs' });
    add(at.towels + 0.2, 'water', { dur: 1, gain: -18 });
    add(at.seal + 2.2, 'slosh', { gain: -14 });
    add(at.nobody - 0.5, 'whoosh', { gain: -18 });
    add(at.wave + 2.5, 'wind', { dur: 5, gain: -24 });
    add(at.wait + 3.1, 'creak', { dur: 0.7, gain: -18, pitch: 0.7 });
    for (const k of [0.25, 0.65, 1.05]) add(at.knock + 1.25 + k, 'thud', { gain: -1, pitch: 0.8, space: 'hall' });
    add(at.crew - 0.45, 'creak', { dur: 0.6, gain: -8, space: 'hall' });
    for (let t = at.carry; t < at.payoff - 0.2; t += 0.48) add(t, 'concrete', { gain: -9, pitch: 0.9, space: 'stairs' });
    add(at.carry + 0.4, 'breath', { dur: 0.9, gain: -14 });
    add(at.payoff - 0.1, 'siren', { dur: 5, gain: -22, pan: -0.4 });
    add(at.payoff, 'murmur', { dur: at.surge - at.payoff, gain: -17, space: 'street' });
    add(at.lights + 0.9, 'ding', { dur: 1, gain: -15 });
    add(at.lights + 2.6, 'murmur', { dur: 2, gain: -12, space: 'street' });
    add(at.surge + 0.1, 'riser', { dur: at.trip - at.surge - 0.2, gain: -14 });
    add(at.trip + 0.2, 'powerdown', { dur: 1, gain: -5 });
    add(at.trip + 0.8, 'boom', { dur: 1.3, gain: -14 });
    add(at.ask + 1.6, 'whoosh', { gain: -12 });
    add(at.ask + 1.9, 'pop', { gain: -10 });
    add(at.ask + 2.2, 'pop', { gain: -10, pitch: 1.2 });
    add(at.ask + 2, 'riser', { dur: 2.6, gain: -14 });
    for (let t = at.ask + 1.8; t < duration - 0.8; t += 0.92) add(t, 'heart', { gain: -9 });
    S.cues = cue.sort((a2, c) => a2[0] - c[0]);
    S.cueI = 0;

    const face = (x, z) => [x, 1.75, z];
    const c = ctx.coverMode;
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, set: 'room', pose: 'door', aperture: 1.5, pos: [-2.15, 1.75, -1.2], look: [-2.2, c ? 1.95 : 2.05, 1.35], fov: 52, move: { pos: [-2.15, 1.75, -0.8], dur: at.now }, focus: face(-2.2, 1.35) },
      { at: at.now, set: 'room', pose: 'door', aperture: 0.6, pos: [-0.7, 1.45, 0.9], look: [-2.2, 1.05, 3.4], fov: 46, move: { pos: [-0.9, 1.4, 1.3], dur: 3 }, focus: [-2.2, 1, 3.3] },
      { at: at.instinct, set: 'room', pose: 'door', aperture: 1.5, pos: [-2.15, 1.72, -0.65], look: [-2.2, 1.8, 1.35], fov: 44, focus: face(-2.2, 1.35) },
      { at: at.crews, set: 'room', pose: 'table', aperture: 1, pos: [0.15, 1.85, 3.2], look: [0, 1.2, -0.6], fov: 58, move: { pos: [0.1, 1.8, 2.9], dur: 4 } },
      { at: at.rule5, set: 'room', pose: 'table', aperture: 0.6, pos: [-0.9, 1.5, 0.9], look: [-2.2, 1.1, 3.4], fov: 46, focus: [-2.2, 1, 3.3] },
      { at: at.towels, set: 'room', pose: 'table', aperture: 0.5, pos: [-2.2, 0.75, 1.5], look: [-2.2, 0.15, 3.4], fov: 46, move: { pos: [-2.2, 0.65, 1.9], dur: 2 }, focus: [-2.2, 0.1, 3.3] },
      { at: at.nobody, set: 'room', pose: 'window', aperture: 0.8, pos: [0.7, 1.75, 1.2], look: [-0.5, 1.8, -3], fov: 50, move: { pos: [0.5, 1.72, 0.6], dur: 2 }, focus: face(-0.6, -2.5) },
      { at: at.ladder, set: 'city', aperture: 0.05, pos: [-26, 6, -88], look: [0, 28, -2], fov: 46, move: { pos: [-24, 7, -80], dur: 4 } },
      { at: at.phone, set: 'room', pose: 'table', aperture: 4, pos: [-0.55, 1.14, 1.0], look: [-0.55, 0.84, 0.42], fov: 40, move: { pos: [-0.55, 1.1, 0.92], dur: 3 }, focus: [-0.55, 0.93, 0.42] },
      { at: at.wave, set: 'room', pose: 'signal', aperture: 0.3, pos: [0.7, 1.75, 0.8], look: [-0.5, 1.8, -3], fov: 50, focus: face(-0.6, -2.5) },
      { at: at.wave + 1.9, set: 'city', aperture: 0.05, pos: [-34, 6, -118], look: [0, 38, 0], fov: 46, move: { pos: [-30, 7, -104], dur: 3 } },
      { at: at.wait, set: 'room', pose: 'table', aperture: 1, pos: [-0.9, 1.45, 1.2], look: [-2.2, 1.1, 3.4], fov: 46, move: { pos: [-1.1, 1.4, 1.7], dur: 4 }, focus: [-2.2, 1, 3.3] },
      { at: at.knock, set: 'room', pose: 'table', aperture: 0.6, pos: [-1.9, 1.5, 0.15], look: [-2.2, 1.25, 3.4], fov: 46, focus: [-2.2, 1.2, 3.3] },
      { at: at.crew, set: 'room', pose: 'crew', aperture: 0.6, pos: [1.4, 1.85, -1.5], look: [-1.8, 1.35, 1.6], fov: 58, move: { pos: [1.2, 1.8, -1.2], dur: 3 } },
      { at: at.carry, set: 'stairs', aperture: 0.6, pos: [0.9, 2.5, 5.4], look: [-1.0, 1.75, 0], fov: 50, move: { pos: [0.5, 2.4, 4.9], dur: 2.5 }, focus: [-0.8, 1.7, 0] },
      { at: at.payoff, set: 'city', pose: 'street', aperture: 0.8, pos: [0.3, 1.8, -47], look: [0, 2.2, -38], fov: 46, focus: [0, 1.7, -40] },
      { at: at.lights, set: 'city', pose: 'street', aperture: 0.05, pos: [2, 2, -54], look: [0, 18, 0], fov: 54, move: { pos: [1.5, 2, -50], dur: 4 } },
      { at: at.trip, set: 'city', pose: 'street', aperture: 0.05, pos: [1.5, 2, -50], look: [0, 18, 0], fov: 54 },
      { at: at.last, set: 'city', pose: 'street', aperture: 0.05, pos: [-26, 6, -88], look: [0, 40, -2], fov: 42, move: { pos: [-24, 8, -80], dur: 3 } },
      { at: at.ask, set: 'city', pose: 'street', aperture: 1.5, pos: [0.15, 1.75, -42.5], look: [0, 1.95, -40], fov: 50, focus: face(0, -40) },
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
    ctx.scene.background.set({ city: '#0a1030', stairs: '#2a2a2e' }[shot.set] || '#05060c');
    S.hemi.intensity = shot.set === 'city' ? 0.55 : shot.set === 'stairs' ? 0.3 : 0.22;

    const you = S.you;
    you.visible = false;
    S.helen.visible = false;
    const blink = (o) => (((t + o) * 0.36) % 1 < 0.05 ? 1 : 0);
    b.blink(you, t > 1 && t < at.ask ? blink(1.3) : 0);
    b.blink(S.helen, blink(0.4));
    you.scale.y = 1 + Math.sin(t * 2.2) * 0.009;
    const hooded = t >= at.crew + 1.2 && t < at.payoff;
    S.hoods.forEach((h) => (h.visible = hooded));

    if (shot.set === 'room') {
      S.torch.intensity = 0;
      S.lens.material.color.setRGB(0.05, 0.05, 0.05);
      S.flames.forEach((f) => (f.visible = true));
      S.candleLight.intensity = 9 + Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6;
      S.helen.visible = shot.pose !== 'door' || t > 99;
      S.helen.position.set(-0.9, 0, -1);
      S.helen.rotation.set(0, -Math.PI / 2 + 0.15, 0);
      b.expression(S.helen, 'worried');
      const open = t >= at.crew - 0.5 ? motion.ease.outCubic(phase(t, at.crew - 0.5, at.crew + 0.1)) : 0;
      S.door.rotation.y = 1.1 * open;
      S.gray.visible = true;
      S.gap.visible = !(t >= at.seal + 0.6 && open === 0);
      S.towel.visible = t >= at.seal + 0.3;
      S.towel.position.z = open > 0 ? 2.7 : 3.28;
      S.heat.intensity = 1.4 * phase(t, at.wait + 2.4, at.knock);
      const crewOn = t >= at.crew - 0.35;
      S.crewRoom.forEach((p, i) => {
        p.visible = crewOn;
        p.position.z = 3.3 - (i === 0 ? 0.75 : 0.95) * open;
      });
      S.crewLight.intensity = crewOn ? 5 : 0;

      let pos;
      if (shot.pose === 'door') pos = [-2.2, 1.35, Math.PI / 2];
      if (shot.pose === 'window' || shot.pose === 'signal') pos = [-0.6, -2.5, Math.PI / 2];
      if (shot.pose === 'crew') pos = [-1.75, 1.1, 0.2];
      you.visible = !!pos;
      if (pos) {
        you.position.set(pos[0], 0, pos[1]);
        you.rotation.y = pos[2];
        you.userData.limbs.armR.rotation.z = shot.pose === 'signal' ? 2.5 + Math.sin(t * 5) * 0.22 : 0;
      }
      b.expression(you, 'worried');
      const sig = shot.pose === 'signal';
      S.hand.visible = sig;
      S.signal.intensity = sig ? 7 : 0;
      if (sig) {
        const hx = -0.6 + 0.62 + Math.sin(t * 5) * 0.2;
        S.hand.position.set(hx, 2.55, -3.05);
        S.signal.position.set(hx, 2.4, -2.6);
      }

      const on = phase(t, -0.1, 0.5);
      S.floorSmoke.visible = on > 0 && t < at.seal + 1.6;
      S.floorSmoke.material.opacity = 0.26 * (1 - phase(t, at.seal + 0.4, at.seal + 1.6));
      const p2 = S.floorSmoke.geometry.attributes.position;
      S.floorSmoke.userData.seed.forEach(([a, cc, d], i) => {
        const u = (t * (0.1 + d * 0.11) + a) % 1;
        p2.setXYZ(i, -2.2 + (cc - 0.5) * (1 + u * 3.4), 0.1 + u * 0.32 + d * 0.15, 3.35 - u * 3.2);
      });
      p2.needsUpdate = true;
    }

    if (shot.set === 'city') {
      S.paintCity(t);
      const crew = t >= at.payoff;
      S.truck.visible = crew;
      S.people.forEach((p, i) => {
        p.visible = crew;
        const cheer = t >= at.lights + 2.2 && t < at.trip + 0.3;
        p.userData.limbs.armL.rotation.z = cheer ? 2.6 + Math.sin(t * 9 + i) * 0.3 : 0;
        p.userData.limbs.armR.rotation.z = cheer ? 2.6 + Math.sin(t * 8 + i) * 0.3 : 0;
        p.position.y = cheer ? Math.abs(Math.sin(t * 8 + i)) * 0.14 : 0;
        b.expression(p, cheer ? 'smile' : t >= at.trip + 0.45 ? 'shock' : 'worried');
      });
      S.crewOut.forEach((p) => (p.visible = crew));
      const flash = crew && Math.sin(t * 12) > 0;
      S.blue.visible = flash;
      S.blueLight.intensity = flash ? 26 : 0;
      if (shot.pose === 'street') {
        you.visible = true;
        you.position.set(0, 0, -40);
        you.rotation.y = Math.PI / 2;
        b.expression(you, t >= at.trip ? 'worried' : 'smile');
        S.helen.visible = true;
        S.helen.position.set(-1.3, 0, -39.4);
        S.helen.rotation.set(0, Math.PI / 2 + 0.3, 0);
        b.expression(S.helen, 'smile');
      }
    }

    if (shot.set === 'stairs') {
      S.fireLight.intensity = 22 + Math.sin(t * 17) * 5;
      S.stairSmoke.material.opacity = 0.14;
      const p2 = S.stairSmoke.geometry.attributes.position;
      S.stairSmoke.userData.seed.forEach(([a, cc, d], i) => {
        const u = (t * (0.05 + d * 0.06) + a) % 1;
        p2.setXYZ(i, -5.5 + cc * 10 + u * 2, 0.4 + u * 6, -0.8 + d * 3);
      });
      p2.needsUpdate = true;
      you.visible = true;
      S.helen.visible = true;
      S.crewStair.forEach((p) => (p.visible = true));
      const k = t - at.carry;
      const on = (x) => 1.69 + (x / 0.3) * 0.18;
      const xy = (x) => [x - k * 0.32, on(x - k * 0.32)];
      const [ax, ay] = xy(-1.5);
      you.position.set(ax, ay, 0.4);
      you.rotation.y = Math.PI;
      b.animatePerson(you, t * 7, 0.6);
      const [bx, by] = xy(-0.2);
      S.crewStair[0].position.set(bx, by, 0.2);
      b.animatePerson(S.crewStair[0], t * 7, 0.45);
      const [cx, cy] = xy(0.9);
      S.crewStair[1].position.set(cx, cy, 0.2);
      b.animatePerson(S.crewStair[1], t * 7 + 1, 0.45);
      S.helen.position.set(bx + 0.15, by + 0.95, -0.25);
      S.helen.rotation.set(0, Math.PI, 0.9);
    }
    S.rig.apply(ctx.camera, t, ctx);
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    const set = S.rig.list[S.rig.current(t)].set;
    const grades = { room: '#ffe2c4', city: '#c3cfea', stairs: '#d8cdc2' };
    if (ctx.coverMode) {
      ui.grade(g, { color: grades.room, edge: 0.55 });
      ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 4', y: 545, size: 118 });
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
    snap('imgA', at.last + 1.2);
    snap('imgB', at.payoff + 1.2);
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.grade(g, { color: grades[set], edge: 0.7 });
    ui.haze(g, 0.14 * (1 - phase(t, at.seal, at.seal + 1.4)));
    ui.vignette(g, 0.45);

    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && t < at.ask) ui.clock(g, clock[1]);
    if (t >= at.now && t < at.ask) {
      const litres = t >= at.towels + 1.6 ? '9 L' : '11 L';
      ui.gauge(g, { label: 'WATER LEFT', value: litres, warn: true, k: 1 - phase(t, at.towels + 1.6, at.towels + 2), x: 60, y: 90 });
    }
    if (t >= at.now && t < at.seal + 1.2) ui.gauge(g, { label: 'SMOKE', value: 'FLOOR 13', warn: true, x: 765, y: 90 });
    if (t >= at.ladder && t < at.phone) ui.rule(g, { label: 'Your window', text: '42 m · Ladder ≈ 23 m', y: 270, k: pop(at.ladder + 0.2, at.phone) });
    if (t >= at.crews && t < at.towels) ui.rule(g, { label: t < at.rule5 ? 'Fire crews' : 'Rule #5', text: t < at.rule5 ? 'Smoke in stairs? Stay in.' : 'A closed door buys time', y: 270, k: pop(at.crews + 0.2, at.towels) });
    if (t >= at.phone + 1.6 && t < at.wave) ui.rule(g, { label: "Helen's phone", text: '3% battery', y: 1090, k: pop(at.phone + 1.6, at.wave) });

    if (t < at.ask) ui.words(g, t, chunks);
    if (t < 0.0 + at.now) {
      if (t < at.now - 0.2 && t >= 0.05) ui.comment(g, { name: 'B', text: "No don't tell", y: 720, k: pop(0.25, at.now) });
      ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 4', y: 240, size: 150, alpha: 1 - phase(t, at.now - 0.3, at.now) });
    }

    const vote = at.ask + 1.6;
    if (t >= at.ask && t < vote) ui.cover(g, { lines: ['Would you', '*go back?*'], y: 280, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
    if (t >= vote) ui.vote(g, { title: 'Your last 9 liters', a: 'Go back', b: 'Stay out', comment: 'Comment BACK or OUT', next: 'Part 5 soon · Follow', k: phase(t, vote, vote + 0.3), imgA: S.imgA, imgB: S.imgB });
  },
};
