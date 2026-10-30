// Blackout in a high-rise, Part 2: "Floor 5". Ablauf und Regie: plans/blackout-part-2.md
// Stimme gibt das Timing vor (blackout2.script.js, node timing.mjs). Jede Einstellung schaltet ihr Set.

import script from './blackout2.script.js';
import timing from './blackout2.timing.js';
import { layout } from '../runtime/narration.js';

const { beats, chunks, at, duration } = layout(script.lines, timing);

const CLOCKS = [
  ['recap', 'DAY 2 · 7:30 AM'],
  ['stairs', '8:10 AM'],
  ['street', '8:40 AM'],
  ['back', '9:05 AM'],
  ['marek', '9:20 AM'],
  ['carry', '9:30 AM'],
  ['payoff', '10:05 AM'],
  ['hall', '10:06 AM'],
];
const STOP = at.running - 1.1; // Figur bleibt auf der Treppe stehen

export default {
  title: 'Blackout in a high-rise, Part 2',
  voice: script.voice,
  voiceChain: 'highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.5:g=1.5',
  series: { name: 'Blackout in a high-rise', part: 2 },
  caption: {
    scenario: 'The last working tap in your building is on floor 5',
    emoji: '🪣🏢',
    question: 'Would you tell them?',
    tags: ['blackout', 'whatif', 'survival', 'scenario', 'highrise', 'powerout'],
  },
  duration,
  fps: 30,
  seed: 25,
  look: {
    env: 0.16,
    ao: { radius: 0.5, intensity: 0.8 },
    dof: { aperture: 2, maxblur: 0.012 },
    bloom: { strength: 0.25, radius: 0.45, threshold: 1.5 },
  },
  sources: [
    'Mains pressure about 22 m in Berlin, booster stations are electric, upper floors fetch water from lower floors: Berliner Wasserbetriebe, quoted in Berliner Zeitung',
    'Stores without generators turn customers away within 2 hours, ATMs fail immediately, fuel pumps need power: TAB report, Bundestag Drucksache 17/5672 (2011)',
    'German framework: public water supply should work for at least 72 hours in a large outage: quoted by t-online',
    'Flush 6 L (water-saving cistern) to 9 L: Kreis Soest and secondary sources citing the Umweltbundesamt',
    '2 liters per person per day: BBK guide',
    'Math: 6 L ÷ 2 L/day = 3 days; 7 L ÷ 4 L/day = 1.75 days; 7 + 10 = 17 L; 17 L ÷ 4 L/day = 4.25 days',
  ],
  music: {
    bpm: 80,
    gain: -17,
    sections: [
      { at: 0, mood: 'dread' },
      { at: at.recap, mood: 'suspense' },
      { at: at.toilet, mood: 'silence' },
      { at: at.rule3, mood: 'suspense' },
      { at: at.stairs, mood: 'dread' },
      { at: at.back + 1.6, mood: 'silence' },
      { at: at.running, mood: 'dread' },
      { at: at.marek, mood: 'suspense' },
      { at: at.deal, mood: 'drive' },
      { at: at.payoff, mood: 'resolve' },
      { at: at.hall, mood: 'silence' },
      { at: at.seen, mood: 'dread' },
      { at: at.ask, mood: 'silence' },
    ],
  },
  story: { hook: "The last working tap in your building isn't yours.", beats },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;
    scene.background = new THREE.Color('#05060c');
    S.hemi = new THREE.HemisphereLight('#c8d4ee', '#3a3a44', 0.6);
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

    // Figuren
    S.you = b.character({ shirt: '#d9463d', pants: '#27324f', skin: '#d6a57c', hair: '#2a1a10', outfit: 'hoodie', hairStyle: 'tufts' });
    scene.add(S.you);
    S.helen = b.character({ shirt: '#8e6db3', pants: '#3f4258', skin: '#efcfb3', hair: '#d9dbe2', shoes: '#6c6f7c', outfit: 'jacket', hairStyle: 'bun' });
    S.helen.scale.setScalar(0.92);
    b.expression(S.helen, 'worried');
    scene.add(S.helen);
    S.marek = b.character({ shirt: '#3f7f73', pants: '#2b2f3c', skin: '#c99a73', hair: '#4a4a50', outfit: 'tshirt', hairStyle: 'short' });
    b.expression(S.marek, 'flat');
    scene.add(S.marek);

    // Eimer an der Hand der Figur
    const bucketMat = b.mat('#3f6fd8', { roughness: 0.4 });
    const makeBucket = () => {
      const g = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#3f6fd8', side: THREE.DoubleSide, roughness: 0.4 }));
      shell.position.y = 0.16;
      shell.castShadow = true;
      g.add(shell);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20), bucketMat);
      g.add(base);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.135, 1, 20), new THREE.MeshStandardMaterial({ color: '#58b8ff', emissive: '#2f7fc4', emissiveIntensity: 0.5, roughness: 0.1 }));
      g.add(water);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 24, Math.PI), b.mat('#b8bcc8'));
      handle.position.y = 0.32;
      g.add(handle);
      g.userData.level = (k) => {
        water.visible = k > 0.01;
        water.scale.y = 0.27 * k;
        water.position.y = 0.015 + (0.27 * k) / 2;
      };
      g.userData.level(0);
      return g;
    };
    S.bucket = makeBucket();
    S.bucket.position.set(0, 0.27, 0.68);
    S.you.add(S.bucket);

    // ---------- Treppenhaus: Stufen laufen unter der Figur durch ----------
    const stairs = group();
    S.flight = new THREE.Group();
    stairs.add(S.flight);
    for (let i = -24; i <= 24; i++) {
      mk(S.flight, 0.31, 0.18, 2.4, i % 2 ? '#62656f' : '#6a6d78', i * 0.3, i * 0.18 - 0.09, 0, { r: 0.012 });
      mk(S.flight, 0.31, 3, 2.4, '#4a4c56', i * 0.3, i * 0.18 - 1.68, 0, { r: 0.005 });
    }
    mk(stairs, 40, 14, 0.2, '#3f4250', 0, 3, -1.3);
    mk(S.flight, 0.05, 0.05, 2.4, '#000', 0, 0, 0);
    const rail = mk(S.flight, 16, 0.05, 0.05, '#c9423a', 0, 1.0, -1.05, { r: 0.02 });
    rail.rotation.z = Math.atan2(0.18, 0.3);
    S.numCanvas = document.createElement('canvas');
    S.numCanvas.width = 256;
    S.numCanvas.height = 256;
    S.numTex = new THREE.CanvasTexture(S.numCanvas);
    S.numTex.colorSpace = THREE.SRGBColorSpace;
    S.numBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: S.numTex, roughness: 0.9 }));
    S.numBoard.position.set(1.6, 2.1, -1.19);
    stairs.add(S.numBoard);
    S.drawNum = (n) => {
      if (S.num === n) return;
      S.num = n;
      const g = S.numCanvas.getContext('2d');
      g.fillStyle = '#3f4250';
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#f2efe6';
      g.font = "400 200px 'Anton', sans-serif";
      g.textAlign = 'center';
      g.fillText(String(n), 128, 215);
      S.numTex.needsUpdate = true;
    };
    S.drawNum(14);
    // Tuer im 5. Stock mit Lichtspalt
    S.door5 = new THREE.Group();
    mk(S.door5, 1.05, 2.2, 0.07, '#5a4436', -1.7, 2.2, -1.18);
    S.door5.add(new THREE.Mesh(new THREE.PlaneGeometry(0.05, 2.2), glow(2.4, 1.9, 1.1)));
    S.door5.children[1].position.set(-1.14, 2.2, -1.14);
    S.door5.visible = false;
    stairs.add(S.door5);
    S.torch = new THREE.SpotLight('#fff0d0', 17, 16, 0.55, 0.7, 1.2);
    S.torch.position.set(0.9, 2.6, 4.2);
    S.torch.target.position.set(0, 1.2, 0);
    stairs.add(S.torch, S.torch.target);
    S.torchFill = new THREE.PointLight('#a9b8e8', 1.2, 7, 1.5);
    S.torchFill.position.set(0.5, 3, 2);
    stairs.add(S.torchFill);

    // ---------- Wohnung bei Tag ----------
    const apt = group();
    mk(apt, 9, 0.1, 7, '#7a5a3e', 0, -0.05, 0);
    mk(apt, 0.1, 3, 7, '#8d8775', -4.5, 1.5, 0);
    mk(apt, 0.1, 3, 7, '#8d8775', 4.5, 1.5, 0);
    mk(apt, 9, 0.5, 0.14, '#8d8775', 0, 0.25, -3.5);
    mk(apt, 9, 0.3, 0.14, '#8d8775', 0, 2.85, -3.5);
    for (const wx of [-3.9, 3.9]) mk(apt, 1.2, 3, 0.14, '#8d8775', wx, 1.5, -3.5);
    const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshBasicMaterial({ color: '#b7c1d2' }));
    skyPlane.position.set(0, 2, -14);
    apt.add(skyPlane);
    for (let i = 0; i < 12; i++) mk(apt, 1.8, rng.range(2, 6), 1, rng.pick(['#7b8294', '#8a90a0', '#6e7588']), -9 + i * 1.7, 0.5, -12);
    mk(apt, 2.4, 0.08, 1.3, '#6b4a2e', 0, 0.76, 0);
    for (const [lx, lz] of [[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]]) mk(apt, 0.08, 0.74, 0.08, '#4d3420', lx, 0.37, lz);
    S.bottles = [];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.27, 16), new THREE.MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.2, transparent: true, opacity: 0.8 }));
      body.position.y = 0.135;
      g.add(body, b.box(0.05, 0.05, 0.05, '#2f6fe0', { y: 0.3, r: 0.012 }));
      g.position.set(-0.5 + (i % 3) * 0.24, 0.8, -0.1 + Math.floor(i / 3) * 0.24);
      apt.add(g);
      S.bottles.push(g);
    }
    S.tableBucket = makeBucket();
    S.tableBucket.position.set(0.55, 0.8, 0.1);
    S.tableBucket.userData.level(1);
    apt.add(S.tableBucket);
    const aptLight = new THREE.PointLight('#dfe7f7', 16, 12, 1.4);
    aptLight.position.set(0, 2.6, 1.5);
    apt.add(aptLight);

    // ---------- Bad (Toilette und Mareks Wanne) ----------
    const bath = group();
    mk(bath, 8, 0.1, 6, '#9fa8b2', 0, -0.05, 0);
    mk(bath, 8, 3, 0.1, '#c7d0d6', 0, 1.5, -2.5);
    for (let tx = -3.5; tx <= 3.5; tx += 0.5) mk(bath, 0.012, 3, 0.02, '#a9b4bb', tx, 1.5, -2.44, { r: 0.002 });
    for (let ty = 0.25; ty <= 2.8; ty += 0.5) mk(bath, 8, 0.012, 0.02, '#a9b4bb', 0, ty, -2.44, { r: 0.002 });
    mk(bath, 0.1, 3, 6, '#b6bfc6', -3.5, 1.5, 0);
    mk(bath, 0.1, 3, 6, '#b6bfc6', 3.5, 1.5, 0);
    // Toilette rechts
    mk(bath, 0.6, 0.42, 0.72, '#f1f2f5', 2.2, 0.21, -1.8, { r: 0.08 });
    mk(bath, 0.66, 0.05, 0.76, '#e4e6ea', 2.2, 0.45, -1.8, { r: 0.02 });
    mk(bath, 0.64, 0.56, 0.2, '#f1f2f5', 2.2, 0.82, -2.3, { r: 0.05 });
    mk(bath, 0.16, 0.06, 0.03, '#9aa0aa', 2.2, 0.98, -2.19, { r: 0.01 });
    // Wanne links
    mk(bath, 2.3, 0.56, 1.05, '#eef0f3', -1.6, 0.28, -1.9, { r: 0.1 });
    S.tubWater = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.02, 0.84), new THREE.MeshStandardMaterial({ color: '#58b8ff', emissive: '#2f7fc4', emissiveIntensity: 0.45, roughness: 0.08 }));
    S.tubWater.position.set(-1.6, 0.565, -1.9);
    bath.add(S.tubWater);
    const steel = b.mat('#dfe3ea', { metalness: 0.3, roughness: 0.3 });
    bath.add(b.box(0.06, 0.34, 0.06, '', { x: -0.7, y: 0.84, z: -2.34, material: steel, r: 0.02 }));
    bath.add(b.box(0.05, 0.05, 0.26, '', { x: -0.7, y: 1.0, z: -2.22, material: steel, r: 0.015 }));
    S.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 10), new THREE.MeshStandardMaterial({ color: '#7cc8ff', emissive: '#3f95d8', emissiveIntensity: 0.8, roughness: 0.1 }));
    S.stream.position.set(-0.7, 0.77, -2.09);
    bath.add(S.stream);
    S.fillBucket = makeBucket();
    S.fillBucket.position.set(-0.7, 0.56, -2.09);
    bath.add(S.fillBucket);
    const bathLight = new THREE.PointLight('#ffe9c8', 7, 11, 1.4);
    bathLight.position.set(1.6, 2.3, 1.6);
    bath.add(bathLight);

    // ---------- Strasse ----------
    const street = group();
    street.add(b.ground(300, '#6d6f76'));
    mk(street, 300, 0.1, 10, '#3f4149', 0, 0.02, 12);
    const shop = new THREE.Group();
    shop.position.set(-6, 0, -6);
    street.add(shop);
    mk(shop, 15, 9, 3, '#8f8678', 0, 4.5, 0);
    for (let i = 0; i < 16; i++) mk(shop, 8, 0.15, 0.06, i % 2 ? '#8a8e98' : '#777b85', -2.5, 0.25 + i * 0.2, 1.56, { r: 0.01 });
    const signC = document.createElement('canvas');
    signC.width = 512;
    signC.height = 128;
    const sg = signC.getContext('2d');
    sg.fillStyle = '#2a2d38';
    sg.fillRect(0, 0, 512, 128);
    sg.fillStyle = '#c9cbd2';
    sg.font = "400 92px 'Anton', sans-serif";
    sg.textAlign = 'center';
    sg.fillText('MARKET', 256, 106);
    const signT = new THREE.CanvasTexture(signC);
    signT.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshStandardMaterial({ map: signT }));
    sign.position.set(-2.5, 4.3, 1.56);
    shop.add(sign);
    // Geldautomat
    mk(shop, 1.5, 2.3, 0.3, '#3d4656', 3.8, 1.15, 1.6);
    mk(shop, 1.1, 0.74, 0.04, '#07080c', 3.8, 1.55, 1.78);
    mk(shop, 1.1, 0.4, 0.14, '#272c38', 3.8, 0.85, 1.8);
    S.crowd = [];
    for (const [px, pz, ry] of [[3.4, -2.8, Math.PI / 2], [-3, -3.2, Math.PI / 2], [-5.8, -2.6, 2]]) {
      const p = b.person();
      p.position.set(px, 0, pz);
      p.rotation.y = ry;
      b.expression(p, 'worried');
      street.add(p);
    }
    // Tankstelle
    const gas = new THREE.Group();
    gas.position.set(46, 0, -8);
    street.add(gas);
    mk(gas, 14, 0.7, 8, '#e8e9ec', 0, 5, 0);
    mk(gas, 14, 0.14, 8.2, '#c9423a', 0, 4.6, 0);
    for (const px of [-4, 4]) mk(gas, 0.5, 4.5, 0.5, '#d4d6dc', px, 2.25, 0);
    for (const px of [-2.2, 2.2]) {
      mk(gas, 0.9, 2, 0.6, '#c9423a', px, 1, 0);
      mk(gas, 0.7, 0.5, 0.04, '#0a0b10', px, 1.5, 0.32);
    }
    for (const [cx, col] of [[-9, '#2f6fe0'], [-3, '#e7c43a'], [3, '#8e96a8']]) {
      const c = b.car(col);
      c.position.set(cx, 0, 4.5);
      gas.add(c);
    }
    S.sun = new THREE.DirectionalLight('#dfe6f2', 1.8);
    S.sun.position.set(-20, 40, 30);
    S.sun.target.position.set(10, 0, -4);
    S.sun.castShadow = true;
    S.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(S.sun.shadow.camera, { left: -70, right: 70, top: 40, bottom: -40, near: 5, far: 120 });
    scene.add(S.sun, S.sun.target);

    // ---------- Flur auf 14 ----------
    const hall = group();
    mk(hall, 12, 0.1, 6, '#54565f', 0, -0.05, 0);
    mk(hall, 12, 0.1, 6, '#a7a8ab', 0, 2.75, 0);
    mk(hall, 12, 2.8, 0.1, '#6d7180', 0, 1.4, -3);
    mk(hall, 12, 2.8, 0.1, '#6d7180', 0, 1.4, 3.2);
    for (const hx of [-3.6, -1.2, 1.2, 3.6]) mk(hall, 1.05, 2.2, 0.07, '#5d4432', hx, 1.1, -2.93);
    S.neighbors = [];
    for (const [nx, nz, ry, opts] of [
      [-2.5, -1.7, -1.3, { shirt: '#3f7f73', hairStyle: 'cap' }],
      [-1.0, -2.2, -1.5, { shirt: '#e0a33a', hairStyle: 'bun' }],
      [0.9, -1.9, -1.7, { shirt: '#4a70c9', hairStyle: 'short' }],
      [2.4, -1.5, -1.9, { shirt: '#b54d8c', hairStyle: 'spiky' }],
    ]) {
      const p = b.person({ ...opts, outfit: 'jacket' });
      p.position.set(nx, 0, nz);
      p.rotation.y = ry;
      b.expression(p, 'worried');
      hall.add(p);
      S.neighbors.push(p);
    }
    const hl = new THREE.PointLight('#ffe2b4', 9, 10, 1.3);
    hl.position.set(1.5, 2.2, -0.4);
    hall.add(hl);
    const exit = new THREE.PointLight('#7dffb4', 4, 8, 1.5);
    exit.position.set(4.5, 2.2, -1);
    hall.add(exit);

    S.sets = { stairs, apt, bath, street, hall };

    // Sounds als Zeitplan
    const cue = [];
    const add = (t, name, opts) => cue.push([t, name, opts]);
    add(0, 'room', { dur: duration, gain: -26 });
    add(0.1, 'drip', { gain: -6, space: 'stairs' });
    add(1.5, 'drip', { gain: -10, pitch: 1.1, space: 'stairs' });
    add(at.recap, 'wind', { dur: 8, gain: -24 });
    add(at.helen, 'thud', { gain: -9, pitch: 0.8, space: 'stairs' });
    add(at.helen + 0.32, 'thud', { gain: -11, pitch: 0.8, space: 'stairs' });
    add(at.math + 0.3, 'pop', { gain: -8 });
    add(at.rule3 + 0.6, 'gurgle', { gain: -6, space: 'bath' });
    add(at.rule3 + 0.1, 'pop', { gain: -10 });
    add(at.stairs, 'click', { gain: -7 });
    for (let t = at.stairs + 0.3; t < at.street - 0.2; t += 0.42) add(t, 'concrete', { gain: -7, pan: 0.15, space: 'stairs', pitch: 1 + (t * 7 % 1) * 0.08 });
    for (let t = at.stairs + 0.6; t < at.street - 0.8; t += 1.5) add(t, 'breath', { gain: -15, dur: 0.8 });
    add(at.street, 'wind', { dur: at.back - at.street, gain: -16 });
    add(at.street + 0.9, 'shutter', { gain: -5, space: 'street' });
    add(at.street + 0.5, 'siren', { dur: 5, gain: -22, pan: -0.5 });
    add(at.street + 2.2, 'click', { gain: -6, pitch: 0.5 });
    add(at.gas + 0.7, 'click', { gain: -5, pitch: 0.4 });
    add(at.gas + 1.0, 'click', { gain: -7, pitch: 0.4 });
    for (let t = at.back; t < STOP; t += 0.5) add(t, 'concrete', { gain: -8, pan: -0.15, space: 'stairs' });
    add(at.back + 0.6, 'breath', { dur: 0.9, gain: -13 });
    add(STOP + 0.15, 'breath', { dur: 1.2, gain: -11 });
    add(STOP + 0.2, 'water', { dur: 1.2, gain: -24, pan: 0.5 });
    add(at.running, 'water', { dur: 2.2, gain: -8 });
    add(at.running, 'boom', { gain: -12, dur: 1.6 });
    add(at.line, 'riser', { dur: 1.2, gain: -16 });
    add(at.marek + 0.1, 'creak', { dur: 0.9, gain: -8, space: 'bath' });
    add(at.marek + 2.6, 'water', { dur: 1.2, gain: -18 });
    add(at.clock + 2.4, 'pop', { gain: -9 });
    add(at.deal + 0.2, 'fill', { dur: at.carry - at.deal - 0.2, gain: -7, space: 'bath' });
    for (let t = at.carry; t < at.payoff - 0.1; t += 0.62) {
      add(t, 'concrete', { gain: -5, pitch: 0.85, space: 'stairs' });
      add(t + 0.1, 'slosh', { gain: -14 });
    }
    add(at.carry + 0.3, 'creak', { dur: 0.7, gain: -16, pitch: 1.5 });
    add(at.carry + 1.0, 'breath', { dur: 0.9, gain: -10 });
    add(at.carry + 2.2, 'breath', { dur: 0.9, gain: -8, pitch: 0.9 });
    add(at.payoff + 0.15, 'thud', { gain: -7 });
    add(at.payoff + 0.2, 'slosh', { gain: -11 });
    add(at.payoff + 1.5, 'ding', { dur: 1, gain: -14 });
    add(at.hall + 0.05, 'impact', { gain: -9 });
    add(at.seen, 'murmur', { dur: at.where - at.seen + 0.5, gain: -13, space: 'hall' });
    for (let t = at.where; t < at.ask; t += 1.05) add(t, 'heart', { gain: -8 + (t - at.where) * 0.6 });
    add(at.ask + 0.65, 'drip', { gain: -6, space: 'stairs' });
    S.cues = cue.sort((a, c) => a[0] - c[0]);
    S.cueI = 0;

    const fig = (x, z) => [x, 1.75, z];
    S.rig = ctx.motion.shots(THREE, [
      { at: 0, set: 'stairs', pose: 'hook', aperture: 1, pos: [0.35, 1.55, 4.4], look: [0.1, 2.0, 0], move: { pos: [0.25, 1.55, 3.6], dur: at.recap }, focus: fig(0, 0) },
      { at: at.recap, set: 'apt', aperture: 0.6, pos: [0.3, 1.75, 5.2], look: [0.05, 1.25, -1], fov: 52, move: { pos: [0.15, 1.7, 4.5], dur: 4 }, focus: fig(0, -1) },
      { at: at.helen, set: 'apt', aperture: 2.5, pos: [-0.7, 1.55, 1.2], look: [-1, 1.72, -1], fov: 40, move: { pos: [-0.75, 1.55, 0.9], dur: 3.5 }, focus: fig(-1, -1) },
      { at: at.math, set: 'apt', aperture: 2, pos: [-0.25, 1.65, 2.3], look: [-0.25, 1.0, 0], fov: 40, move: { pos: [-0.25, 1.55, 1.9], dur: 3.5 }, focus: [-0.25, 0.95, 0] },
      { at: at.toilet, set: 'apt', aperture: 2.5, pos: [-0.7, 1.55, 1.0], look: [-1, 1.72, -1], fov: 40 },
      { at: at.rule3, set: 'bath', aperture: 2, pos: [1.5, 1.3, 1.1], look: [2.2, 0.7, -2], fov: 44, move: { pos: [1.7, 1.2, 0.6], dur: 4.5 } },
      { at: at.stairs, set: 'stairs', pose: 'down', aperture: 0.8, pos: [-0.8, 2.0, 4.3], look: [0, 1.6, 0], fov: 50, focus: fig(0, 0) },
      { at: at.street, set: 'street', bg: '#aeb7c6', aperture: 0.25, pos: [-7, 2.4, 19], look: [-5.5, 3.1, -4], fov: 58, move: { pos: [-6.5, 2.3, 16], dur: 3.8 }, focus: [-3, 2, -3] },
      { at: at.gas, set: 'street', bg: '#aeb7c6', aperture: 0.25, pos: [36, 2, 9], look: [46, 2.3, -4], fov: 46, move: { pos: [37, 2, 8], dur: 2.2 }, focus: [44, 2, -3] },
      { at: at.back, set: 'stairs', pose: 'up', aperture: 0.8, pos: [0.8, 2.0, 4.3], look: [0, 1.6, 0], fov: 50, focus: fig(0, 0) },
      { at: STOP, set: 'stairs', pose: 'stop', aperture: 1.6, pos: [0.5, 1.75, 2.8], look: [-0.2, 1.8, -1], fov: 44, move: { pos: [0.35, 1.75, 2.4], dur: 1.1 }, focus: fig(0, 0) },
      { at: at.running, set: 'bath', aperture: 1.5, pos: [0.15, 1.15, -0.85], look: [-0.7, 0.8, -2.1], fov: 40, move: { pos: [0.05, 1.1, -1.0], dur: 1.5 }, focus: [-0.7, 0.8, -2.09] },
      { at: at.line, set: 'stairs', pose: 'stop', aperture: 1, pos: [0.5, 1.75, 3.2], look: [0, 1.6, 0], fov: 50 },
      { at: at.marek, set: 'bath', aperture: 1.5, pos: [1.0, 1.65, 3.2], look: [-0.45, 1.15, -1.2], fov: 50, move: { pos: [0.8, 1.65, 2.8], dur: 4 }, focus: fig(-0.1, -0.5) },
      { at: at.clock, set: 'bath', aperture: 2, pos: [0.3, 1.8, 2.2], look: [-0.1, 1.72, -0.5], fov: 42, move: { pos: [0.25, 1.8, 1.9], dur: 4.5 }, focus: fig(-0.1, -0.5) },
      { at: at.deal, set: 'bath', aperture: 5, pos: [-0.25, 1.2, -1.2], look: [-0.7, 0.68, -2.1], fov: 42, move: { pos: [-0.3, 1.1, -1.3], dur: 2.5 } },
      { at: at.carry, set: 'stairs', pose: 'carry', aperture: 0.8, pos: [0.8, 1.9, 3.9], look: [0, 1.5, 0], fov: 50, focus: fig(0, 0) },
      { at: at.payoff, set: 'apt', aperture: 1.2, pos: [0.4, 1.6, 3.5], look: [0.15, 1.2, 0], fov: 46, move: { pos: [0.35, 1.55, 3.0], dur: 3.5 }, focus: [0.3, 1.1, 0] },
      { at: at.hall, set: 'hall', aperture: 1.2, pos: [0, 1.65, 2.8], look: [0, 1.55, -2], fov: 56, move: { pos: [0, 1.62, 2.5], dur: 1.8 }, focus: [0, 1.7, -1.8] },
      { at: at.seen, set: 'hall', aperture: 1.8, pos: [-0.6, 1.6, 0.8], look: [-1.0, 1.72, -2.2], fov: 44, move: { pos: [0.6, 1.6, 0.8], dur: 2 }, focus: [0, 1.7, -2] },
      { at: at.where, set: 'hall', aperture: 2, pos: [0.85, 1.72, -1.3], look: [0.75, 1.78, 0.9], fov: 46, move: { pos: [0.85, 1.72, -0.95], dur: 2 }, focus: fig(0.75, 0.9) },
      { at: at.dilemma, set: 'bath', aperture: 4, pos: [-0.5, 1.15, -0.9], look: [-1.6, 0.56, -1.9], fov: 42, move: { pos: [-0.6, 1.1, -1.0], dur: 1.8 } },
      { at: at.dilemma + 1.75, set: 'hall', aperture: 1.8, pos: [0.5, 1.6, 0.8], look: [-0.3, 1.72, -2], fov: 44, focus: [0, 1.7, -2] },
      { at: at.ask, set: 'hall', aperture: 2, pos: [0.85, 1.72, -1.5], look: [0.75, 2.05, 0.9], fov: 52, move: { pos: [0.85, 1.72, -1.2], dur: 2 }, focus: fig(0.75, 0.9) },
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
    const dark = shot.set === 'stairs';
    ctx.scene.background.set(shot.bg || (dark ? '#05060c' : '#40454f'));
    S.hemi.intensity = shot.set === 'street' ? 1.5 : dark ? 0.18 : 0.5;
    S.sun.intensity = shot.set === 'street' ? 1.8 : 0;

    const you = S.you;
    const limbs = you.userData.limbs;
    b.blink(you, t < at.ask && (t * 0.37) % 1 < 0.05 ? 1 : 0);
    b.blink(S.helen, ((t + 1.1) * 0.31) % 1 < 0.05 ? 1 : 0);
    b.blink(S.marek, ((t + 0.6) * 0.29) % 1 < 0.05 ? 1 : 0);
    you.rotation.z = 0;
    b.animatePerson(you, 0, 0);
    you.visible = false;
    S.helen.visible = false;
    S.marek.visible = false;

    // Eimer: leer bis zum Fuellen, voll danach
    const filled = phase(t, at.deal + 0.2, at.carry);
    S.bucket.visible = t >= at.stairs - 0 && t < at.payoff;
    S.bucket.position.set(0, 0.27, 0.68);
    S.bucket.userData.level(t >= at.deal ? filled : 0);
    S.fillBucket.visible = t >= at.deal && t < at.carry;
    S.fillBucket.userData.level(filled);
    S.stream.visible = t >= at.running && t < at.carry;
    S.stream.scale.x = S.stream.scale.z = 1;
    S.tableBucket.visible = t >= at.payoff;

    if (shot.set === 'stairs') {
      you.visible = true;
      S.flight.visible = true;
      S.door5.visible = shot.pose === 'stop';
      if (shot.pose === 'hook' || shot.pose === 'stop') {
        S.flight.position.set(0, 0, 0);
      }
      you.position.set(0, 0.06, 0);
      S.bucket.visible = true;
      if (shot.pose === 'hook') {
        you.rotation.y = -Math.PI / 2 + 0.12;
        b.expression(you, 'worried');
        b.look(you, 0.4, 0.4);
        S.drawNum(14);
        S.numBoard.position.x = 1.7;
      } else if (shot.pose === 'stop') {
        you.rotation.y = -Math.PI / 2 - 0.5 - 0.55 * motion.ease.inOutCubic(phase(t, STOP, STOP + 0.5));
        b.expression(you, 'o');
        S.drawNum(5);
        S.numBoard.position.x = 1.7;
        b.look(you, 0.9, 0);
      } else {
        const heavy = shot.pose === 'carry';
        const dir = shot.pose === 'down' ? -1 : 1;
        const speed = heavy ? 2.6 : 3.6;
        const dtSince = t - shot.at;
        const u = dtSince * speed;
        const off = ((u % 1) + 1) % 1;
        S.flight.position.set(-dir * off * 0.3, -dir * off * 0.18, 0);
        you.rotation.y = dir < 0 ? Math.PI : 0;
        if (heavy) you.rotation.z = -0.13;
        b.animatePerson(you, u * Math.PI * (heavy ? 1 : 1), heavy ? 0.55 : 0.8);
        if (heavy) limbs.armR.rotation.z = limbs.armL.rotation.z = 0;
        b.expression(you, heavy ? 'worried' : 'flat');
        const span = shot.pose === 'down' ? at.street - at.stairs : shot.pose === 'up' ? STOP - at.back : at.payoff - at.carry;
        const [from, to] = shot.pose === 'down' ? [14, 0] : shot.pose === 'up' ? [0, 5] : [5, 14];
        const f = from + (to - from) * phase(t, shot.at, shot.at + span);
        S.floor = Math.round(f);
        S.drawNum(S.floor);
        const cycle = ((dtSince * 1.1) % 1 + 1) % 1;
        S.numBoard.position.x = -dir * (4 - cycle * 8) * -1;
      }
    }

    if (shot.set === 'apt') {
      S.helen.visible = true;
      S.helen.position.set(-1, 0, -1);
      S.helen.rotation.y = -Math.PI / 2 + 0.15;
      b.expression(S.helen, t >= at.payoff ? 'smile' : 'worried');
      const drinking = t >= at.helen && t < at.math;
      S.helen.userData.limbs.armR.rotation.z = drinking ? 1.7 : 0.1;
      if (t >= at.toilet && t < at.rule3) b.look(S.helen, -0.9, 0);
      else b.look(S.helen, 0, 0);
      you.visible = t < at.helen || t >= at.payoff;
      you.position.set(1.2, 0, -0.9);
      you.rotation.y = Math.PI + 0.5;
      b.expression(you, t >= at.payoff ? 'open' : 'worried');
    }

    if (shot.set === 'bath' && t >= at.running) {
      S.marek.visible = t >= at.marek;
      S.marek.position.set(-0.1, 0, -0.5);
      S.marek.rotation.y = -Math.PI / 2 + 0.2;
      b.expression(S.marek, t >= at.clock ? 'worried' : 'flat');
    }

    if (shot.set === 'hall') {
      you.visible = true;
      you.position.set(0.75, 0, 0.9);
      you.rotation.y = Math.PI / 2;
      b.expression(you, 'worried');
      b.look(you, Math.sin(t * 2.2) * 0.7, 0);
      S.neighbors.forEach((p, i) => {
        b.blink(p, ((t + i) * 0.33) % 1 < 0.05 ? 1 : 0);
        b.look(p, 0, 0.1);
      });
    }
    const crash = at.running;
    S.rig.apply(ctx.camera, t, ctx, t >= crash && t < crash + 0.8 ? motion.shake(t, crash, { amp: 0.03, decay: 7 }) : [0, 0, 0]);
  },

  overlay(g, t, ui, ctx) {
    const { phase, motion, state: S } = ctx;
    const pop = (start, end) => motion.ease.outBack(phase(t, start, start + 0.3)) * (1 - phase(t, end - 0.2, end));
    ui.vignette(g, 0.5);

    // Schema
    if (t >= at.line - 0.05 && t < at.marek) {
      ui.section(g, { alpha: phase(t, at.line - 0.05, at.line + 0.2) * (1 - phase(t, at.marek - 0.3, at.marek)), level: 7, pump: 0, marker: phase(t, at.line + 1.2, at.line + 1.3) > 0.5 ? 5 : null });
    }
    const clock = CLOCKS.filter(([id]) => at[id] <= t).pop();
    if (clock && (t < at.line || t >= at.marek) && t < at.ask) ui.clock(g, clock[1]);

    // Dauer-Anzeigen
    const showWater = t >= at.math && t < at.ask && !(t >= at.line && t < at.marek);
    if (showWater) {
      const water = t >= at.payoff + 1 ? '17 L' : '7 L';
      const pulse = 1 - phase(t, at.payoff + 1, at.payoff + 1.4);
      ui.gauge(g, { label: 'WATER LEFT', value: water, warn: t < at.payoff + 1, k: t >= at.payoff + 1 ? pulse : 0, x: 60, y: 90 });
    }
    const counting = (t >= at.stairs && t < at.street) || (t >= at.back && t < at.running) || (t >= at.carry && t < at.payoff);
    if (counting) ui.gauge(g, { label: 'FLOOR', value: String(S.floor ?? 14), x: 840, y: 90 });

    // Karten
    if (t >= at.rule3 && t < at.stairs) ui.rule(g, { label: 'Rule #3', text: 'One flush = 6 liters', result: '= 3 days of water', y: 270, k: pop(at.rule3, at.stairs) });
    if (t >= at.clock + 2 && t < at.deal) ui.rule(g, { label: 'Emergency plan target', text: '72 hours', y: 270, k: pop(at.clock + 2, at.deal) });
    if (t >= at.deal && t < at.carry) ui.rule(g, { label: "Marek's rule", text: 'One bucket per apartment', y: 270, k: pop(at.deal, at.carry) });
    if (t >= at.carry && t < at.payoff) ui.rule(g, { label: 'The climb', text: '10 L = 10 kg · 9 floors', y: 270, k: pop(at.carry + 0.1, at.payoff) });
    if (t >= at.payoff + 1 && t < at.hall) ui.rule(g, { label: 'Two people', text: '17 L ÷ 4 L a day', result: '= 4.25 days', y: 270, k: pop(at.payoff + 1, at.hall) });
    if (t >= at.marek + 1.5 && t < at.clock + 2) ui.nameTag(g, { name: 'Marek', info: '52 · Apt 5C', y: 1130, k: pop(at.marek + 1.5, at.clock + 2) });

    if (t < at.ask) ui.words(g, t, chunks);

    if (t < at.recap) ui.cover(g, { lines: ['*Blackout*', 'in a high-rise'], part: 'Part 2', y: 240, size: 150, alpha: 1 - phase(t, at.recap - 0.3, at.recap) });
    if (t >= at.ask) ui.cover(g, { lines: ['Would you', '*tell them?*'], part: 'Part 3 soon', y: 280, size: 170, alpha: phase(t, at.ask, at.ask + 0.2) });
  },
};
