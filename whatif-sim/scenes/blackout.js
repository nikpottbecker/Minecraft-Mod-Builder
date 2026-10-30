// Blackout in a high-rise, Part 1.
//
// Die Stimme gibt das Timing vor: Text in blackout.script.js aendern, dann
//   node timing.mjs scenes/blackout.script.js
// Die Wohnung liegt auf 42 m (14 Stockwerke zu je 3 m). Drei Sets (Stadt, Wohnung, Flur)
// liegen uebereinander, jede Einstellung schaltet nur ihr Set sichtbar.

import script from './blackout.script.js';
import timing from './blackout.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing);
const FLOOR = 42;
const T_OFF = at.off + 0.5;
const T_DROP = at.peak + 1.1; // Wasser faellt im Schema
const DRY = at.tap + 3.4; // Hahn: nach dem letzten Strahl nur noch Tropfen
const y = (v) => FLOOR + v;

const CLOCKS = [
  ['dinner', '6:42 PM'],
  ['tap', '7:20 PM'],
  ['helen', '9:15 PM'],
  ['knock', '11:08 PM'],
];

export default {
  title: 'Blackout in a high-rise',
  voice: script.voice,
  series: { name: 'Blackout in a high-rise', part: 1 },
  caption: {
    scenario: 'The power goes out and you live on floor 14',
    emoji: '🔦🏢',
    question: 'Would you open the door?',
    tags: ['blackout', 'whatif', 'survival', 'scenario', 'highrise', 'powerout'],
  },
  duration,
  fps: 30,
  seed: 14,
  look: {
    env: 0.12,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 2.2, maxblur: 0.014 },
    bloom: { strength: 0.28, radius: 0.45, threshold: 1.5 },
  },
  sources: [
    'Mains pressure reaches about 22 m, buildings above five floors need electric booster stations, water only trickles from about floor 7: Berliner Wasserbetriebe, quoted in Berliner Zeitung',
    'Cell sites: overloaded within minutes, battery backup about 2 hours: TAB report for the German Bundestag, Drucksache 17/5672 (2011)',
    'Fridge stays cold about 4–6 hours if rarely opened: Verbraucherzentrale Niedersachsen',
    '2 liters of drinking water per person per day: BBK (German Federal Office of Civil Protection) guide',
    'Math: 14 floors × 3 m = 42 m; 9 L ÷ 2 L/day = 4.5 days; 9 L ÷ (2 × 2 L/day) = 2.25 days',
  ],
  music: {
    bpm: 84,
    gain: -16,
    sections: [
      { at: 0, mood: 'pulse' },
      { at: at.off, mood: 'suspense' },
      { at: at.tap, mood: 'drive' },
      { at: at.count, mood: 'resolve' },
      { at: at.helen, mood: 'suspense' },
      { at: at.ask - 1.5, mood: 'build' },
    ],
  },
  story: { hook: 'What if the power never comes back and you live on floor 14?', beats },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;

    const sky = document.createElement('canvas');
    sky.width = 4;
    sky.height = 256;
    const sg = sky.getContext('2d');
    const grad = sg.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#050817');
    grad.addColorStop(0.6, '#101a3f');
    grad.addColorStop(1, '#2c3566');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 4, 256);
    const skyTex = new THREE.CanvasTexture(sky);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTex;
    scene.fog = new THREE.Fog('#141b3d', 120, 520);
    scene.add(new THREE.HemisphereLight('#7f97d8', '#20222e', 0.55));
    const moon = new THREE.DirectionalLight('#a9c1ff', 1.3);
    moon.position.set(-40, 90, -70);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 70, bottom: -20, near: 10, far: 220 });
    moon.shadow.normalBias = 0.05;
    scene.add(moon);

    // ---------- Stadt ----------
    const city = new THREE.Group();
    scene.add(city);
    const ground = b.ground(1400, '#20232d');
    city.add(ground);
    const windowsList = [];
    const addWindows = (bx, bz, w, h, d, rows, cols) => {
      const inset = 0.05;
      for (let r = 0; r < rows; r++) {
        const wy = ((r + 0.55) * h) / rows;
        for (let c = 0; c < cols; c++) {
          const u = ((c + 0.5) / cols - 0.5);
          for (const side of [-1, 1]) {
            windowsList.push({ x: bx + u * w, y: wy, z: bz + side * (d / 2 + inset), ry: 0 });
            windowsList.push({ x: bx + side * (w / 2 + inset), y: wy, z: bz + u * d, ry: Math.PI / 2 });
          }
        }
      }
    };
    const tower = (x, z, w, h, d, color) => {
      const m = b.box(w, h, d, color, { x, y: h / 2, z, r: 0.05 });
      city.add(m);
      addWindows(x, z, w, h, d, Math.floor(h / 3), Math.max(3, Math.floor(w / 3)));
    };
    for (let gx = -6; gx <= 6; gx++) {
      for (let gz = 0; gz < 7; gz++) {
        const x = gx * 42 + rng.range(-5, 5);
        const z = -70 - gz * 48 + rng.range(-5, 5);
        if (Math.abs(x) < 34 && z > -125) continue; // Blickachse frei halten
        tower(x, z, rng.range(16, 28), rng.range(24, 96), rng.range(16, 28), rng.pick(['#232a44', '#2a2f4a', '#1f2740', '#2d2a45']));
      }
    }
    // Stadtseite hinter dem eigenen Haus, damit der Blick von aussen nicht ins Leere geht
    for (let gx = -4; gx <= 4; gx++) {
      if (gx === 0) continue;
      tower(gx * 46, 26 + rng.range(-6, 6), 22, rng.range(26, 64), 22, '#232a44');
    }

    const home = new THREE.Group();
    scene.add(home);
    const HOME_H = 60;
    home.add(b.box(30, HOME_H, 20, '#343c5e', { y: HOME_H / 2, z: 8, r: 0.1 }));
    const homeStart = windowsList.length;
    addWindows(0, 8, 30, HOME_H, 20, 20, 9);
    S.homeWindows = [homeStart, windowsList.length];
    // Funkmast auf dem Dach
    const mast = new THREE.Group();
    mast.position.set(8, HOME_H, 2);
    mast.add(b.box(0.5, 12, 0.5, '#8a8f9e', { y: 6 }));
    for (const h of [8, 10.5]) mast.add(b.box(3, 0.24, 0.24, '#8a8f9e', { y: h }));
    for (const s of [-1, 1]) mast.add(b.box(0.5, 1.8, 0.2, '#d7dae3', { x: s * 1.5, y: 9.2 }));
    S.mastLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 0.2) }));
    S.mastLight.position.y = 12.2;
    mast.add(S.mastLight);
    home.add(mast);

    const count = windowsList.length;
    const winMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
    S.windows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5, 1.7), winMat, count);
    S.windows.frustumCulled = false;
    const dummy = new THREE.Object3D();
    S.winCol = windowsList.map((win, i) => {
      dummy.position.set(win.x, win.y, win.z);
      dummy.rotation.y = win.ry;
      dummy.updateMatrix();
      S.windows.setMatrixAt(i, dummy.matrix);
      const lit = rng() < 0.62;
      const warm = rng() < 0.75;
      const c = lit ? (warm ? [1.9, 1.4, 0.75] : [1.15, 1.5, 1.9]) : [0.03, 0.04, 0.08];
      const dist = Math.hypot(win.x + 200, win.z + 300);
      return { c, off: T_OFF + dist * 0.0034 + rng() * 0.14 };
    });
    const dark = new THREE.Color(0.018, 0.022, 0.05);
    const col = new THREE.Color();
    S.paintWindows = (t) => {
      S.winCol.forEach((w, i) => {
        if (t >= w.off) col.copy(dark);
        else col.setRGB(w.c[0], w.c[1], w.c[2]);
        S.windows.setColorAt(i, col);
      });
      S.windows.instanceColor.needsUpdate = true;
    };
    S.paintWindows(0);
    city.add(S.windows);

    // Sterne: erst sichtbar, wenn die Stadt dunkel ist
    const starPos = [];
    for (let i = 0; i < 900; i++) {
      const az = rng.range(0, Math.PI * 2);
      const el = rng.range(0.1, 1.4);
      starPos.push(Math.cos(az) * Math.cos(el) * 480, Math.sin(el) * 480, Math.sin(az) * Math.cos(el) * 480);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    S.starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
    city.add(new THREE.Points(starGeo, S.starMat));

    // ---------- Wohnung ----------
    const room = new THREE.Group();
    room.position.y = FLOOR;
    scene.add(room);
    const part = (w, h, d, color, x, py, z) => {
      const m = b.box(w, h, d, color, { x, y: py, z, r: 0.02 });
      room.add(m);
      return m;
    };
    const wall = '#8d8775';
    part(9, 0.1, 7, '#7a5a3e', 0, -0.05, 0); // Boden
    part(9, 0.1, 7, '#c9c4b6', 0, 2.95, 0); // Decke
    part(0.1, 3, 7, wall, -4.5, 1.5, 0);
    part(0.1, 3, 7, wall, 4.5, 1.5, 0);
    part(9, 3, 0.1, wall, 0, 1.5, 3.5);
    // Fensterfront mit Rahmen
    part(1.2, 3, 0.14, wall, -3.9, 1.5, -3.5);
    part(1.2, 3, 0.14, wall, 3.9, 1.5, -3.5);
    part(9, 0.5, 0.14, wall, 0, 0.25, -3.5);
    part(9, 0.3, 0.14, wall, 0, 2.85, -3.5);
    for (const fx of [-1.1, 1.1]) part(0.09, 2.3, 0.1, '#30343f', fx, 1.65, -3.5);
    // Kueche rechts
    part(1.1, 0.9, 3.4, '#d6d2c7', 3.9, 0.45, 0.2);
    part(1.2, 0.07, 3.5, '#4b4e58', 3.9, 0.93, 0.2);
    part(0.62, 0.05, 0.8, '#9aa0aa', 3.8, 0.97, -0.4); // Spuele
    const steel = b.mat('#dfe3ea', { metalness: 0.25, roughness: 0.3 });
    room.add(b.box(0.07, 0.42, 0.07, '', { x: 4.2, y: 1.18, z: -0.4, material: steel, r: 0.02 }));
    room.add(b.box(0.34, 0.07, 0.07, '', { x: 4.05, y: 1.38, z: -0.4, material: steel, r: 0.02 }));
    room.add(b.box(0.05, 0.1, 0.05, '', { x: 3.9, y: 1.33, z: -0.4, material: steel, r: 0.015 }));
    // Wasser
    const waterMat = new THREE.MeshStandardMaterial({ color: '#7cc8ff', emissive: '#3f95d8', emissiveIntensity: 0.7, roughness: 0.15 });
    S.sinkLight = new THREE.PointLight('#ffc48c', 0, 3, 1.5);
    S.sinkLight.position.set(3.1, 1.5, 0.1);
    room.add(S.sinkLight);
    S.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10), waterMat);
    S.stream.position.set(3.9, 1.14, -0.4);
    room.add(S.stream);
    S.drop = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), waterMat);
    S.drop.position.set(3.9, 1.27, -0.4);
    room.add(S.drop);
    // Kuehlschrank
    part(0.92, 2, 0.9, '#e4e6ea', 3.95, 1, 2.75);
    S.fridgeDoor = new THREE.Group();
    S.fridgeDoor.position.set(3.47, 0, 2.3);
    S.fridgeDoor.add(b.box(0.08, 1.98, 0.9, '#f1f2f5', { y: 1, z: 0.45, r: 0.03 }));
    S.fridgeDoor.add(b.box(0.05, 0.6, 0.05, '#7c8290', { x: -0.08, y: 1.2, z: 0.8 }));
    room.add(S.fridgeDoor);
    // Tisch
    part(2.2, 0.08, 1.2, '#6b4a2e', -1.9, 0.76, 0.5);
    for (const [lx, lz] of [[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]]) part(0.08, 0.74, 0.08, '#4d3420', -1.9 + lx, 0.37, 0.5 + lz);
    // Flaschen
    S.bottles = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.27, 16), new THREE.MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.2, transparent: true, opacity: 0.8 }));
      body.position.y = 0.135;
      const cap = b.box(0.05, 0.05, 0.05, '#2f6fe0', { y: 0.3, r: 0.012 });
      g.add(body, cap);
      g.position.set(-2.55 + (i % 3) * 0.2, 0.8, 0.28 + Math.floor(i / 3) * 0.2);
      g.scale.setScalar(0.001);
      room.add(g);
      S.bottles.push(g);
    }
    // Kerze
    S.candle = new THREE.Group();
    S.candle.position.set(-1.3, 0.8, 0.45);
    S.candle.add(b.box(0.07, 0.16, 0.07, '#efe6cf', { y: 0.08, r: 0.015 }));
    S.flame = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1) }));
    S.flame.position.y = 0.2;
    S.flame.scale.y = 1.7;
    S.candle.add(S.flame);
    S.candle.visible = false;
    room.add(S.candle);
    S.candleLight = new THREE.PointLight('#ffb066', 0, 12, 1.25);
    S.candleLight.position.set(-1.3, 1.1, 0.45);
    room.add(S.candleLight);
    // Deckenlicht
    part(0.8, 0.07, 0.8, '#fff3cf', 0, 2.87, 0);
    S.lamp = new THREE.PointLight('#ffdca6', 26, 16, 1.6);
    S.lamp.position.set(0, 2.5, 0);
    room.add(S.lamp);
    // Handy
    S.phoneCanvas = document.createElement('canvas');
    S.phoneCanvas.width = 270;
    S.phoneCanvas.height = 540;
    S.phoneTex = new THREE.CanvasTexture(S.phoneCanvas);
    S.phoneTex.colorSpace = THREE.SRGBColorSpace;
    S.phone = new THREE.Group();
    S.phone.position.set(-2.1, 0.92, 0.75);
    S.phone.rotation.x = -0.4;
    S.phone.add(b.box(0.12, 0.23, 0.012, '#15171f', { r: 0.005 }));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.106, 0.212), new THREE.MeshBasicMaterial({ map: S.phoneTex }));
    screen.position.z = 0.0066;
    S.phone.add(screen);
    room.add(S.phone);
    S.phoneLight = new THREE.PointLight('#bcd4ff', 0, 3, 1.8);
    S.phoneLight.position.set(-2.1, 1.1, 1);
    room.add(S.phoneLight);
    S.drawPhone = (title, sub, bars) => {
      const g = S.phoneCanvas.getContext('2d');
      g.fillStyle = '#0d1020';
      g.fillRect(0, 0, 270, 540);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i < bars ? '#ffffff' : 'rgba(255,255,255,0.22)';
        g.fillRect(24 + i * 16, 42 - i * 7, 11, 12 + i * 7);
      }
      g.fillStyle = '#ffffff';
      g.textAlign = 'center';
      g.font = "400 50px 'Anton', sans-serif";
      g.fillText(title, 135, 260);
      g.fillStyle = '#ff6a5f';
      g.font = "400 30px 'Anton', sans-serif";
      g.fillText(sub, 135, 312);
      S.phoneTex.needsUpdate = true;
    };
    S.drawPhone('CALLING…', 'MOM', 4);
    // Tuer (innen) mit Lichtspalt
    part(1.1, 2.2, 0.08, '#8a6547', -2.8, 1.16, 3.42);
    part(0.07, 0.07, 0.1, '#d9c27a', -3.2, 1.05, 3.34);
    S.doorGap = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.05, 0.5) }));
    S.doorGap.position.set(-2.8, 0.03, 3.37);
    S.doorGap.rotation.y = Math.PI;
    room.add(S.doorGap);
    S.feet = [-3.0, -2.6].map((fx) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.056), new THREE.MeshBasicMaterial({ color: '#0a0806' }));
      m.position.set(fx, 0.03, 3.365);
      m.rotation.y = Math.PI;
      room.add(m);
      return m;
    });

    S.you = b.character({ shirt: '#d9463d', pants: '#27324f', skin: '#d6a57c', hair: '#2a1a10', outfit: 'hoodie', hairStyle: 'tufts' });
    scene.add(S.you);

    // ---------- Flur ----------
    const hall = new THREE.Group();
    hall.position.y = FLOOR;
    scene.add(hall);
    const hp = (w, h, d, color, x, py, z, extra) => {
      const m = b.box(w, h, d, color, { x, y: py, z, r: 0.02, ...extra });
      hall.add(m);
      return m;
    };
    hp(10, 0.1, 6, '#54565f', 0, -0.05, 0);
    hp(10, 0.1, 6, '#a7a8ab', 0, 2.75, 0);
    hp(10, 2.8, 0.1, '#6d7180', 0, 1.4, -3);
    hp(10, 2.8, 0.1, '#6d7180', 0, 1.4, 3);
    hp(0.1, 2.8, 6, '#6d7180', -5, 1.4, 0);
    hp(0.1, 2.8, 6, '#6d7180', 5, 1.4, 0);
    // Aufzug
    const liftMat = b.mat('#aeb4c1', { metalness: 0.7, roughness: 0.35 });
    hp(2.4, 2.4, 0.08, '#3f4352', -1.8, 1.2, -2.92);
    for (const s of [-1, 1]) hp(0.98, 2.26, 0.05, '', -1.8 + s * 0.5, 1.15, -2.86, { material: liftMat });
    hp(0.24, 0.42, 0.05, '#20222c', -0.2, 1.3, -2.92);
    // Notausgang
    S.exit = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 3.2, 1) }));
    S.exit.position.set(2.8, 2.35, -2.93);
    hall.add(S.exit);
    hp(1.05, 2.2, 0.07, '#5c6170', 2.8, 1.1, -2.93);
    // Tuer 14B
    hp(1.05, 2.2, 0.07, '#5d4432', 0.8, 1.1, 2.93);
    const em = new THREE.PointLight('#7dffb4', 8, 10, 1.7);
    em.position.set(2.8, 2.1, -2.2);
    hall.add(em);
    S.hallCandle = new THREE.PointLight('#ffb066', 5, 8, 1.4);
    S.hallCandle.position.set(-0.3, 2.0, 2.0);
    hall.add(S.hallCandle);

    S.helen = b.character({ shirt: '#8e6db3', pants: '#3f4258', skin: '#efcfb3', hair: '#d9dbe2', shoes: '#6c6f7c', outfit: 'jacket', hairStyle: 'bun' });
    S.helen.position.set(1.3, 0, 0.4); // schaut in die Kamera
    S.helen.rotation.y = -Math.PI / 2 - 0.4;
    S.helen.scale.setScalar(0.92);
    b.expression(S.helen, 'worried');
    hall.add(S.helen);
    // Rollator
    const walker = new THREE.Group();
    S.walker = walker;
    walker.position.set(1.05, 0, 1.0);
    walker.rotation.y = 0.5;
    const wm = '#3a4a7a';
    for (const [wx, wz] of [[-0.25, -0.24], [0.25, -0.24]]) walker.add(b.box(0.04, 0.9, 0.04, wm, { x: wx, y: 0.47, z: wz, r: 0.012 }));
    for (const [wx, wz] of [[-0.25, 0.1], [0.25, 0.1]]) walker.add(b.box(0.04, 0.9, 0.04, wm, { x: wx, y: 0.47, z: wz, r: 0.012 }));
    walker.add(b.box(0.56, 0.04, 0.04, wm, { y: 0.9, z: 0.1, r: 0.012 }));
    walker.add(b.box(0.5, 0.03, 0.34, '#22242e', { y: 0.52, z: -0.07, r: 0.01 }));
    for (const [wx, wz] of [[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.1], [0.25, 0.1]]) walker.add(b.box(0.05, 0.14, 0.14, '#111319', { x: wx, y: 0.07, z: wz, r: 0.03 }));
    hall.add(walker);

    S.sets = { city, home, room, hall };
    const face = (x, z) => [x, y(1.75), z];
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, set: 'room', aperture: 1.6, pos: [0.3, y(1.5), 3.1], look: [-0.5, y(1.85), -2], move: { pos: [0.1, y(1.5), 2.2], dur: at.dinner }, focus: face(-0.6, -2) },
      { at: at.dinner, set: 'room', aperture: 1.6, pos: [0.5, y(1.7), 2.7], look: [3.1, y(1.25), 0], move: { pos: [0.9, y(1.65), 2.3], dur: 3 }, focus: face(3, 0.1) },
      { at: at.off, set: 'city', aperture: 0.05, pos: [-34, 6, -118], look: [0, 44, 0], fov: 46, move: { pos: [-30, 7, -106], dur: 5 } },
      { at: at.phone, set: 'room', aperture: 2.4, pos: [-1.65, y(1.5), 2.9], look: [-2.1, y(1.4), 0.3], move: { pos: [-1.8, y(1.45), 2.4], dur: 2.5 }, focus: face(-2.1, -0.25) },
      { at: at.busy, set: 'room', aperture: 7, pos: [-2.1, y(1.12), 1.17], look: [-2.1, y(0.93), 0.75], fov: 40, move: { pos: [-2.1, y(1.08), 1.1], dur: 2 } },
      { at: at.mast, set: 'city', aperture: 0.05, pos: [-14, 66, -34], look: [8, 68, 2], fov: 42, move: { pos: [-10, 64, -30], dur: 4 } },
      { at: at.lift, set: 'hall', aperture: 1.4, fov: 56, pos: [2.6, y(1.6), 2.4], look: [-1.2, y(1.3), -2.6], move: { pos: [2.1, y(1.55), 1.9], dur: 4 }, focus: [-1.2, y(1.3), -1.2] },
      { at: at.tap, set: 'room', aperture: 7, pos: [3.1, y(1.28), 0.35], look: [3.9, y(1.13), -0.4], fov: 38, move: { pos: [3.25, y(1.25), 0.15], dur: 4 } },
      { at: at.press, set: 'city', aperture: 0.05, pos: [-34, 6, -118], look: [0, 44, 0], fov: 46 },
      { at: at.count, set: 'room', aperture: 3, pos: [-2.25, y(1.75), 2.3], look: [-2.35, y(0.9), 0.4], fov: 40, move: { pos: [-2.3, y(1.6), 1.95], dur: 4 } },
      { at: at.fridge, set: 'room', aperture: 3, pos: [1.1, y(1.5), 1.3], look: [3.5, y(1.05), 2.7], fov: 44, move: { pos: [1.5, y(1.45), 1.5], dur: 4 } },
      { at: at.helen, set: 'hall', aperture: 1.6, pos: [-0.9, y(1.5), 2.6], look: [1.3, y(1.05), 0.4], fov: 46, move: { pos: [-0.6, y(1.5), 2.4], dur: 4 }, focus: face(1.3, 0.4) },
      { at: at.helen2, set: 'hall', aperture: 3, pos: [0.1, y(1.55), 2.4], look: [1.25, y(1.35), 0.4], fov: 44, move: { pos: [0.25, y(1.55), 2.2], dur: 4 }, focus: face(1.3, 0.4) },
      { at: at.share, set: 'room', aperture: 3, pos: [-2.3, y(1.6), 1.95], look: [-2.35, y(0.9), 0.4], fov: 40 },
      { at: at.knock, set: 'room', aperture: 2, pos: [-2.8, y(0.95), 0.2], look: [-2.8, y(0.8), 3.4], fov: 50, move: { pos: [-2.8, y(0.85), 1.2], dur: 5 } },
      { at: at.empty, set: 'room', aperture: 5, pos: [-2.8, y(0.2), 2.3], look: [-2.8, y(0.04), 3.4], fov: 40, move: { pos: [-2.8, y(0.16), 2.6], dur: 3 } },
      { at: at.ask, set: 'room', aperture: 1.6, pos: [-2.65, y(1.75), 3.3], look: [-2.8, y(2.05), 1.35], fov: 52, move: { pos: [-2.7, y(1.75), 3.05], dur: 2.2 }, focus: face(-2.8, 1.35) },
    ]);
  },

  update(ctx, t, dt) {
    const { state: S, blocks: b, phase, motion } = ctx;
    const shot = S.rig.list[S.rig.current(t)];
    const inRoom = shot.set === 'room';
    S.sets.room.visible = inRoom;
    S.sets.hall.visible = shot.set === 'hall';
    S.sets.home.visible = shot.set === 'city';
    S.sets.city.visible = shot.set === 'city' || inRoom;
    S.you.visible = shot.set !== 'city' && (t < at.tap || t >= at.ask);

    // Bis nach dem Stromausfall aendern sich die Fenster nur in der Welle
    if (t >= T_OFF - dt && t < T_OFF + 2.5) S.paintWindows(t);
    const off = t >= T_OFF;
    if (off && !S.wasOff) {
      S.wasOff = true;
      S.lamp.intensity = 0;
      ctx.sound('powerdown', { gain: -3, dur: 1.2 });
      ctx.sound('boom', { gain: -9, dur: 2 });
    }
    S.starMat.opacity = 0.9 * phase(t, T_OFF + 1.2, T_OFF + 3.5);
    S.mastLight.visible = t < at.mast + 3 || Math.sin(t * 7) > 0;

    // Figur: am Fenster, Kueche, Handy, Flur, Schluss
    const you = S.you;
    b.look(you, Math.sin(t * 0.8) * 0.5, 0);
    const blinkT = (t * 0.37) % 1;
    b.blink(you, blinkT < 0.05 ? 1 : 0);
    const place = (x, py, z, ry) => {
      you.position.set(x, py, z);
      you.rotation.y = ry;
    };
    if (t < at.dinner) {
      place(-0.6, FLOOR, -2.0, -Math.PI / 2 + 0.15);
      b.expression(you, 'worried');
    } else if (t < at.phone) {
      place(3.0, FLOOR, 0.1, 0);
      b.expression(you, off ? 'shock' : 'smile');
      you.userData.limbs.armR.rotation.z = 0.9 + Math.sin(t * 6) * 0.15;
      you.userData.limbs.armL.rotation.z = 0.7;
    } else if (t < at.lift) {
      place(-2.1, FLOOR, -0.25, -Math.PI / 2);
      b.expression(you, 'worried');
      you.userData.limbs.armR.rotation.z = 1.2;
      you.userData.limbs.armL.rotation.z = 0;
    } else if (t < at.tap) {
      place(-0.7, FLOOR, -1.0, 2.1);
      b.expression(you, 'worried');
      you.userData.limbs.armR.rotation.z = 0;
    } else {
      place(-2.8, FLOOR, 1.35, -Math.PI / 2);
      b.expression(you, 'worried');
    }

    S.helen.visible = S.walker.visible = t >= at.helen;
    b.blink(S.helen, ((t + 1.1) * 0.31) % 1 < 0.05 ? 1 : 0);

    // Handy
    if (inRoom) {
      S.phoneLight.intensity = t >= at.phone && t < at.tap ? 2 : 0;
      if (t >= at.busy && !S.busy) {
        S.busy = true;
        S.drawPhone('NETWORK', 'BUSY', 1);
        ctx.sound('glitch', { gain: -8 });
      }
    }

    // Hahn: letzter Strahl, dann Tropfen
    const tapOn = t >= at.tap + 1.6;
    S.stream.visible = tapOn && t < DRY;
    if (S.stream.visible) S.stream.scale.x = S.stream.scale.z = 1 - 0.8 * phase(t, DRY - 1, DRY);
    const cycle = t >= DRY ? ((t - DRY) % 1.3) / 1.3 : -1;
    S.drop.visible = cycle >= 0 && t < at.press;
    if (S.drop.visible) {
      S.drop.position.y = 1.27 - 0.24 * cycle ** 2 - (cycle > 0.3 ? (cycle - 0.3) * 0.1 : 0);
      if (cycle < S.lastCycle) ctx.sound('click', { gain: -10, pitch: 1.8 });
      S.lastCycle = cycle;
    }
    if (t >= at.tap + 1.5 && !S.tapSound) {
      S.tapSound = true;
      ctx.sound('click', { gain: -9 });
    }

    // Kerze ab dem Wasser-Check
    const candle = t >= at.tap;
    S.candle.visible = candle;
    S.sinkLight.intensity = t >= at.tap && t < at.press ? 2.4 : 0;
    S.candleLight.intensity = candle ? 6 + Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3) * 0.4 : 0;

    // Flaschen ploppen einzeln auf
    S.bottles.forEach((g, i) => {
      const tb = at.count + 0.9 + i * 0.2;
      const k = motion.ease.outBack(phase(t, tb, tb + 0.28));
      g.scale.setScalar(Math.max(0.001, k));
      if (t >= tb && !g.userData.popped) {
        g.userData.popped = true;
        ctx.sound('pop', { gain: -9, pitch: 1 + i * 0.05 });
      }
    });

    // Kuehlschrank geht zu
    const closeT = at.fridge + 1.4;
    S.fridgeDoor.rotation.y = 0.9 * (1 - motion.ease.inOutCubic(phase(t, closeT, closeT + 0.4)));
    if (t >= closeT + 0.4 && !S.fridgeSound) {
      S.fridgeSound = true;
      ctx.sound('thud', { gain: -5 });
    }

    // Klopfen: dreimal, die Tuer zittert im Bild
    const knocks = [0.2, 0.55, 0.9].map((k) => at.knock + 1.9 + k);
    for (const k of knocks) {
      if (t >= k && !S['k' + k]) {
        S['k' + k] = true;
        ctx.sound('thud', { gain: -1, pitch: 0.8 });
      }
    }
    const lastKnock = knocks.filter((k) => k <= t).pop();
    const knockShake = lastKnock ? motion.shake(t, lastKnock, { amp: 0.05, decay: 11 }) : [0, 0, 0];
    S.doorGap.visible = t >= at.knock;
    S.feet.forEach((f) => (f.visible = t >= at.empty - 0.2));

    if (t >= at.peak + 1 && !S.peakSound) {
      S.peakSound = true;
      ctx.sound('impact', { gain: -3 });
      ctx.sound('powerdown', { gain: -6, dur: 1.6, pitch: 0.7 });
    }
    S.rig.apply(ctx.camera, t, ctx, knockShake);
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion } = ctx;
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.vignette(g, 0.5);

    // Hochhaus-Schema: Peak (fh = Wasserstand in Stockwerken)
    const schemaIn = phase(t, at.press - 0.05, at.press + 0.2);
    const schemaOut = phase(t, at.count - 0.3, at.count);
    if (t >= at.press - 0.05 && t < at.count) {
      const level = t < T_DROP ? 18 : 18 - 11 * motion.ease.inOutCubic(phase(t, T_DROP, T_DROP + 1));
      const shake = t >= T_DROP ? motion.shake(t, T_DROP, { amp: 10, decay: 5 }) : [0, 0, 0];
      g.save();
      g.translate(shake[0], shake[1]);
      ui.section(g, { alpha: schemaIn * (1 - schemaOut), level, pump: t < T_DROP ? 1 : 0, showMains: phase(t, at.press + 0.8, at.press + 1.2) });
      g.restore();
      ui.flash(g, 0.5 * (1 - phase(t, T_DROP, T_DROP + 0.25)) * (t >= T_DROP ? 1 : 0), '#ff4438');
    }

    // Uhrzeit-Chip
    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && (t < at.press || t >= at.count)) ui.clock(g, clock[1]);

    // Karten
    if (t >= at.mast && t < at.lift) {
      ui.rule(g, { label: 'Cell tower backup', text: '≈ 2 hours of battery', y: 270, k: pop(at.mast + 0.7, at.lift) });
    }
    if (t >= at.rule1 && t < at.tap) ui.rule(g, { label: 'Rule #1', text: 'Stay out of the elevator', y: 270, k: pop(at.rule1, at.tap) });
    if (t >= at.math && t < at.fridge) ui.rule(g, { label: 'Your water', text: '9 L ÷ 2 L a day', result: '= 4.5 days', y: 270, k: pop(at.math + 0.1, at.fridge) });
    if (t >= at.fridge && t < at.helen) ui.rule(g, { label: 'Rule #2', text: 'Fridge stays shut', result: 'Cold for 4–6 h', y: 270, k: pop(at.fridge, at.helen) });
    if (t >= at.helen + 1.6 && t < at.share) ui.nameTag(g, { name: 'Helen', info: '81 · Apt 14B', y: 1130, k: pop(at.helen + 1.6, at.share) });
    if (t >= at.share && t < at.knock) ui.rule(g, { label: 'You + Helen', text: '9 L ÷ 2 people ÷ 2 L', result: '= 2.25 days', y: 270, k: pop(at.share + 0.1, at.knock) });

    if (t < at.ask) ui.words(g, t, chunks);

    // Titel auf dem ersten Bild
    if (t < at.dinner) ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 1', y: 240, size: 150, alpha: 1 - phase(t, at.dinner - 0.3, at.dinner) });

    // Ende: Frage + Teil 2
    if (t >= at.ask) ui.cover(g, { lines: ['Would you', '*open it?*'], part: 'Part 2 soon', y: 280, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
  },
};
