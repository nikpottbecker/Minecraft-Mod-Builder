// Bausteine im Block-Look. Alle Masse in Metern.
// Kanten sind leicht abgerundet (wie Spielzeug aus Plastik): das faengt Licht an den
// Kanten und wirkt sofort hochwertiger als harte Wuerfel.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function blocks(THREE, rng) {
  const matCache = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!matCache.has(key)) {
      matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...extra }));
    }
    return matCache.get(key);
  };

  const geoCache = new Map();
  const geo = (w, h, d, r) => {
    const rr = Math.min(r, Math.min(w, h, d) / 2 - 1e-4);
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${rr.toFixed(3)}`;
    if (!geoCache.has(key)) {
      geoCache.set(key, rr > 0.001 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d));
    }
    return geoCache.get(key);
  };

  // Abgerundete Box. r = Kantenradius (Standard: 12 % der kleinsten Seite, max. 8 cm).
  const box = (w, h, d, color, { x = 0, y = 0, z = 0, material, r } = {}) => {
    const radius = r ?? Math.min(0.08, Math.min(w, h, d) * 0.12);
    const mesh = new THREE.Mesh(geo(w, h, d, radius), material || mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Fassadentextur mit zufaellig beleuchteten Fenstern.
  const facadeTextures = [];
  const facade = (base) => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 128; y += 10) {
      for (let x = 4; x < 64; x += 10) {
        const lit = rng() < 0.55;
        g.fillStyle = lit ? (rng() < 0.7 ? '#ffe9a8' : '#bfe3ff') : 'rgba(10,16,40,0.85)';
        g.fillRect(x, y, 6, 6);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };
  const facadeFor = (base) => {
    let entry = facadeTextures.find((f) => f.base === base);
    if (!entry) {
      entry = { base, tex: facade(base) };
      facadeTextures.push(entry);
    }
    return entry.tex;
  };

  // ---------- Figur ----------
  // Eigene Blockfigur: grosser Kopf, plastisches Gesicht, Ausdruecke.
  // Schaut in +X, Ursprung an den Fuessen, ca. 1,85 m gross.
  const character = ({
    shirt = '#f1c40f', pants = '#26324f', skin = '#e0ac69', hair = '#3b2614', shoes = '#f4f4f4',
    outfit = 'hoodie', hairStyle = 'tufts', accent = '#1f3a8a',
  } = {}) => {
    const group = new THREE.Group();
    const pivot = (y, children) => {
      const p = new THREE.Group();
      p.position.y = y;
      for (const child of children) {
        child.position.y -= y;
        p.add(child);
      }
      group.add(p);
      return p;
    };
    const dark = new THREE.Color(shirt).multiplyScalar(0.82).getStyle();

    // Beine + Schuhe
    const leg = (z) => pivot(0.68, [
      box(0.24, 0.58, 0.24, pants, { y: 0.39, z }),
      box(0.27, 0.13, 0.34, shoes, { x: 0.04, y: 0.065, z, r: 0.04 }),
    ]);
    const legL = leg(0.14);
    const legR = leg(-0.14);

    // Rumpf
    group.add(box(0.4, 0.66, 0.62, shirt, { y: 1.0, r: 0.07 }));
    if (outfit === 'hoodie') {
      group.add(box(0.06, 0.2, 0.36, dark, { x: 0.19, y: 0.8, r: 0.03 }));
      for (const z of [0.07, -0.07]) group.add(box(0.03, 0.17, 0.035, '#f5f5f5', { x: 0.21, y: 1.12, z, r: 0.01 }));
      for (const z of [0.2, -0.2]) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), mat(accent));
        cap.rotation.z = Math.PI / 2;
        cap.position.set(0.18, 1.29, z);
        cap.castShadow = true;
        group.add(cap);
      }
    } else if (outfit === 'jacket') {
      group.add(box(0.03, 0.6, 0.04, '#d9d9d9', { x: 0.205, y: 1.0, r: 0.01 }));
      group.add(box(0.36, 0.1, 0.66, dark, { y: 1.3, r: 0.04 }));
    } else {
      group.add(box(0.08, 0.06, 0.24, skin, { x: 0.17, y: 1.31, r: 0.02 }));
    }

    // Arme + Haende (Pivot an der Schulter)
    const arm = (z) => pivot(1.27, [
      box(0.2, 0.52, 0.2, shirt, { y: 1.02, z, r: 0.06 }),
      box(0.18, 0.17, 0.18, skin, { y: 0.69, z, r: 0.05 }),
    ]);
    const armL = arm(0.42);
    const armR = arm(-0.42);

    // Kopf (Pivot am Hals, damit er nicken/drehen kann)
    const head = new THREE.Group();
    head.position.y = 1.36;
    group.add(head);
    head.add(box(0.2, 0.08, 0.2, skin, { y: 0.03, r: 0.02 }));
    head.add(box(0.56, 0.54, 0.56, skin, { y: 0.33, r: 0.06 }));

    // Gesicht auf der +X-Seite
    const fx = 0.285;
    const eyes = [];
    const pupils = [];
    for (const z of [0.12, -0.12]) {
      const eye = box(0.025, 0.15, 0.13, '#ececec', { x: fx, y: 0.37, z, r: 0.012 });
      const pupil = box(0.02, 0.095, 0.075, '#15151a', { x: 0.012, y: -0.01, z: -0.005 * Math.sign(z), r: 0.01 });
      const glint = box(0.01, 0.03, 0.03, '#ffffff', { x: 0.012, y: 0.028, z: 0.018, r: 0.004 });
      pupil.add(glint);
      eye.add(pupil);
      head.add(eye);
      eyes.push(eye);
      pupils.push(pupil);
    }
    const brows = [0.12, -0.12].map((z) => {
      const b = box(0.03, 0.04, 0.16, hair, { x: fx + 0.005, y: 0.5, z, r: 0.012 });
      head.add(b);
      return b;
    });
    head.add(box(0.05, 0.08, 0.07, new THREE.Color(skin).multiplyScalar(0.9).getStyle(), { x: fx + 0.01, y: 0.27, r: 0.02 }));

    // Muender: mehrere Varianten, eine ist sichtbar
    const mouthDark = '#2a1416';
    const mouths = {};
    const addMouth = (name, parts) => {
      const m = new THREE.Group();
      for (const p of parts) m.add(p);
      m.visible = false;
      head.add(m);
      mouths[name] = m;
    };
    addMouth('smile', [
      box(0.025, 0.04, 0.16, mouthDark, { x: fx, y: 0.16, r: 0.014 }),
      box(0.025, 0.04, 0.06, mouthDark, { x: fx, y: 0.19, z: 0.1, r: 0.014 }),
      box(0.025, 0.04, 0.06, mouthDark, { x: fx, y: 0.19, z: -0.1, r: 0.014 }),
    ]);
    addMouth('flat', [box(0.025, 0.035, 0.15, mouthDark, { x: fx, y: 0.17, r: 0.012 })]);
    addMouth('worried', [
      box(0.025, 0.035, 0.12, mouthDark, { x: fx, y: 0.18, r: 0.012 }),
      box(0.025, 0.035, 0.05, mouthDark, { x: fx, y: 0.16, z: 0.075, r: 0.012 }),
      box(0.025, 0.035, 0.05, mouthDark, { x: fx, y: 0.16, z: -0.075, r: 0.012 }),
    ]);
    addMouth('open', [
      box(0.025, 0.13, 0.17, mouthDark, { x: fx, y: 0.16, r: 0.02 }),
      box(0.03, 0.035, 0.14, '#f7f7f7', { x: fx + 0.003, y: 0.205, r: 0.01 }),
    ]);
    addMouth('o', [box(0.025, 0.09, 0.08, mouthDark, { x: fx, y: 0.17, r: 0.02 })]);

    // Haare
    if (hairStyle !== 'none') {
      head.add(box(0.6, 0.12, 0.6, hair, { x: -0.01, y: 0.62, r: 0.04 }));
      head.add(box(0.12, 0.38, 0.6, hair, { x: -0.25, y: 0.46, r: 0.04 }));
      for (const z of [0.27, -0.27]) head.add(box(0.36, 0.16, 0.08, hair, { x: -0.08, y: 0.55, z, r: 0.03 }));
      const tufts = hairStyle === 'tufts' ? 9 : hairStyle === 'spiky' ? 6 : 0;
      for (let i = 0; i < tufts; i++) {
        const s = hairStyle === 'spiky' ? rng.range(0.12, 0.16) : rng.range(0.13, 0.19);
        const tuft = box(s, s * (hairStyle === 'spiky' ? 1.6 : 0.9), s, hair, { x: rng.range(-0.22, 0.2), y: 0.7 + rng.range(0, 0.04), z: rng.range(-0.22, 0.22), r: 0.035 });
        tuft.rotation.set(rng.range(-0.4, 0.4), rng.range(0, 1.5), rng.range(-0.4, 0.4));
        head.add(tuft);
      }
      if (hairStyle === 'bun') head.add(box(0.22, 0.2, 0.22, hair, { x: -0.18, y: 0.78, r: 0.08 }));
      if (hairStyle === 'cap') {
        head.add(box(0.62, 0.16, 0.62, accent, { x: -0.01, y: 0.66, r: 0.06 }));
        head.add(box(0.26, 0.04, 0.5, accent, { x: 0.38, y: 0.6, r: 0.02 }));
      }
    }

    group.userData.limbs = { legL, legR, armL, armR };
    group.userData.face = { head, eyes, pupils, brows, mouths };
    expression(group, 'smile');
    return group;
  };

  // Ausdruecke: smile, flat, worried, open, o, shock, angry
  const EXPR = {
    smile: { mouth: 'smile', brow: 0, browY: 0, pupil: 1 },
    flat: { mouth: 'flat', brow: 0, browY: 0, pupil: 1 },
    worried: { mouth: 'worried', brow: 0.3, browY: 0.01, pupil: 1 },
    open: { mouth: 'open', brow: 0.08, browY: 0.03, pupil: 1 },
    o: { mouth: 'o', brow: 0.1, browY: 0.04, pupil: 0.85 },
    shock: { mouth: 'open', brow: 0.12, browY: 0.06, pupil: 0.6 },
    angry: { mouth: 'flat', brow: -0.35, browY: -0.02, pupil: 1 },
  };
  function expression(ch, name) {
    const f = ch.userData.face;
    const e = EXPR[name] || EXPR.smile;
    for (const [k, m] of Object.entries(f.mouths)) m.visible = k === e.mouth;
    f.brows.forEach((b, i) => {
      b.rotation.x = (i === 0 ? 1 : -1) * e.brow;
      b.position.y = 0.5 + e.browY;
    });
    f.pupils.forEach((p) => p.scale.set(1, e.pupil, e.pupil));
    ch.userData.expression = name;
  }

  return {
    mat,
    box,
    character,
    expression,

    // Blinzeln: k = 0 offen, 1 zu
    blink(ch, k) {
      for (const eye of ch.userData.face.eyes) eye.scale.y = Math.max(0.08, 1 - k);
    },
    // Blickrichtung der Pupillen (-1..1)
    look(ch, side = 0, up = 0) {
      ch.userData.face.pupils.forEach((p, i) => {
        p.position.z = side * 0.025 + (i === 0 ? -0.005 : 0.005);
        p.position.y = -0.01 + up * 0.025;
      });
    },

    ground(size = 400, color = '#5b8f4e') {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color, { roughness: 0.95 }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      return mesh;
    },

    building(w, h, d, base = '#2f3a63') {
      const tex = facadeFor(base).clone();
      tex.needsUpdate = true;
      tex.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 12)));
      const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.3 });
      const top = mat(base);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side]);
      mesh.position.y = h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    },

    // Leuchtende Werbetafel.
    billboard(w, h, colors) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const g = c.getContext('2d');
      colors.forEach((col, i) => {
        g.fillStyle = col;
        g.fillRect(0, (i * 32) / colors.length, 32, 32 / colors.length + 1);
      });
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      const m = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.1 });
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), m);
    },

    tree() {
      const group = new THREE.Group();
      group.add(box(0.5, 2.4, 0.5, '#6b4423', { y: 1.2, r: 0.08 }));
      group.add(box(2.4, 2.0, 2.4, '#3f8f3a', { y: 3.2, r: 0.25 }));
      group.add(box(1.5, 1.0, 1.5, '#4fa846', { y: 4.6, r: 0.2 }));
      return group;
    },

    // Auto, Front zeigt in +X. Rueckgabe: Gruppe mit userData.wheels.
    car(color = '#e74c3c') {
      const group = new THREE.Group();
      const paint = mat(color, { roughness: 0.35, metalness: 0.15 });
      group.add(box(4.2, 0.9, 1.9, color, { y: 0.85, r: 0.18, material: paint }));
      group.add(box(2.3, 0.75, 1.75, color, { x: -0.3, y: 1.62, r: 0.16, material: paint }));
      group.add(box(2.36, 0.56, 1.8, '#9fd3ff', { x: -0.3, y: 1.6, r: 0.12, material: mat('#9fd3ff', { roughness: 0.08, metalness: 0.4 }) }));
      for (const z of [0.6, -0.6]) {
        group.add(box(0.1, 0.22, 0.42, '#fff6c8', { x: 2.12, y: 0.95, z, r: 0.04, material: mat('#fff6c8', { emissive: '#fff2b0', emissiveIntensity: 1.5 }) }));
        group.add(box(0.1, 0.2, 0.36, '#ff3b30', { x: -2.12, y: 0.98, z, r: 0.04, material: mat('#ff3b30', { emissive: '#ff2a1f', emissiveIntensity: 0.8 }) }));
      }
      const wheels = [];
      for (const [x, z] of [[1.3, 0.95], [1.3, -0.95], [-1.3, 0.95], [-1.3, -0.95]]) {
        const wheel = box(0.8, 0.8, 0.35, '#1b1b1f', { x, y: 0.4, z, r: 0.12 });
        // Felgen-Streifen, damit man die Drehung sieht
        wheel.add(box(0.56, 0.13, 0.37, '#c9ccd3', { r: 0.03 }));
        wheels.push(wheel);
        group.add(wheel);
      }
      group.userData.wheels = wheels;
      return group;
    },

    // Einfache Blockfigur (kleiner, guenstiger) — fuer Menschenmengen in der Totale.
    person(opts = {}) {
      return character({ ...opts, outfit: opts.outfit || rng.pick(['hoodie', 'jacket', 'tshirt']), hairStyle: opts.hairStyle || rng.pick(['tufts', 'short', 'bun', 'cap', 'spiky']) });
    },

    // Bein-/Armpendel fuer Lauf- (amount=1) oder Strampel-Animation.
    animatePerson(person, phase, amount = 1, armsUp = 0) {
      const { legL, legR, armL, armR } = person.userData.limbs;
      const s = Math.sin(phase) * 0.6 * amount;
      legL.rotation.z = s;
      legR.rotation.z = -s;
      armL.rotation.z = -s + armsUp * 2.6;
      armR.rotation.z = s + armsUp * 2.6;
      armL.rotation.x = -armsUp * 0.3;
      armR.rotation.x = armsUp * 0.3;
    },
  };
}
