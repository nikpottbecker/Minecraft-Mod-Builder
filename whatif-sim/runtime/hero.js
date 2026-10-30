// Hauptfigur der Serien: erwachsener Mann, feste Silhouette, kein Zufall.
// Gleiche Schnittstelle wie blocks.character: userData.limbs, userData.face, blocks.expression,
// blocks.blink und blocks.look funktionieren unveraendert. Gesicht zeigt nach +X. Groesse rund 2,45 m.

export const HERO_EYE = 2.14; // Augenhoehe, fuer Kameras

export function hero(THREE, b, { jacket = false } = {}) {
  const { box } = b;
  const C = {
    skin: '#d8a982', skinDark: '#b98660', stubble: '#5e4638',
    hair: '#2a1a12', hairMid: '#3a2517', hairDark: '#1b110c',
    hoodie: '#a93430', hoodieDark: '#7f2522', coat: '#23262f', coatLight: '#30343f',
    denim: '#262f46', denimLight: '#384463', boot: '#3a2a1f', sole: '#17181c', iris: '#3d2a1c',
  };
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

  // Beine: lang und gerade, feste Boots
  const leg = (z) => pivot(0.98, [
    box(0.27, 0.78, 0.27, C.denim, { y: 0.56, z, r: 0.04 }),
    box(0.29, 0.06, 0.29, C.denimLight, { y: 0.2, z, r: 0.02 }),
    box(0.4, 0.17, 0.29, C.boot, { x: 0.05, y: 0.11, z, r: 0.04 }),
    box(0.42, 0.04, 0.31, C.sole, { x: 0.05, y: 0.02, z, r: 0.012 }),
  ]);
  const legL = leg(0.16);
  const legR = leg(-0.16);

  // Rumpf: breite Schultern, schmalere Huefte
  const top = jacket ? C.coat : C.hoodie;
  const topDark = jacket ? C.coatLight : C.hoodieDark;
  group.add(box(0.42, 0.34, 0.6, top, { y: 1.13, r: 0.06 }));
  group.add(box(0.46, 0.46, 0.84, top, { y: 1.5, r: 0.09 }));
  group.add(box(0.44, 0.07, 0.62, topDark, { y: 0.98, r: 0.025 }));
  group.add(box(0.03, 0.2, 0.42, topDark, { x: 0.213, y: 1.14, r: 0.02 }));
  group.add(box(0.48, 0.15, 0.56, topDark, { x: -0.04, y: 1.76, r: 0.06 }));
  group.add(box(0.2, 0.32, 0.46, top, { x: -0.25, y: 1.62, r: 0.07 }));
  for (const z of [0.07, -0.07]) group.add(box(0.02, 0.26, 0.024, '#d8d3c8', { x: 0.238, y: 1.5, z, r: 0.008 }));
  if (jacket) {
    group.add(box(0.47, 0.72, 0.16, C.hoodie, { y: 1.34, r: 0.03 }));
    group.add(box(0.5, 0.17, 0.62, C.hoodie, { x: -0.03, y: 1.78, r: 0.06 }));
    group.add(box(0.03, 0.8, 0.03, '#8f939e', { x: 0.24, y: 1.34, z: 0.09, r: 0.01 }));
  }

  // Arme
  const arm = (z) => pivot(1.68, [
    box(0.23, 0.72, 0.23, top, { y: 1.34, z, r: 0.07 }),
    box(0.24, 0.07, 0.24, topDark, { y: 0.98, z, r: 0.02 }),
    box(0.18, 0.17, 0.2, C.skin, { y: 0.86, z, r: 0.05 }),
    box(0.08, 0.12, 0.06, C.skin, { x: 0.08, y: 0.9, z: z - Math.sign(z) * 0.07, r: 0.02 }),
  ]);
  const armL = arm(0.54);
  const armR = arm(-0.54);

  // Kopf: kantiger Kiefer, kleiner im Verhaeltnis zum Koerper
  const head = new THREE.Group();
  head.position.y = 1.77;
  head.scale.setScalar(0.86);
  group.add(head);
  head.add(box(0.24, 0.16, 0.26, C.skinDark, { y: 0.03, r: 0.03 }));
  head.add(box(0.54, 0.34, 0.52, C.skin, { y: 0.44, r: 0.08 }));
  head.add(box(0.52, 0.26, 0.5, C.skin, { y: 0.24, r: 0.05 }));
  // Bartschatten: weicher Verlauf ohne harte Kante
  const bc = document.createElement('canvas');
  bc.width = 128;
  bc.height = 64;
  const bg = bc.getContext('2d');
  const grad = bg.createRadialGradient(64, 42, 4, 64, 42, 62);
  grad.addColorStop(0, 'rgba(94,70,56,0.5)');
  grad.addColorStop(0.65, 'rgba(94,70,56,0.42)');
  grad.addColorStop(1, 'rgba(94,70,56,0)');
  bg.fillStyle = grad;
  bg.fillRect(0, 0, 128, 64);
  const shadow = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false });
  const beard = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.24), shadow);
  beard.position.set(0.262, 0.21, 0);
  beard.rotation.y = Math.PI / 2;
  head.add(beard);
  for (const z of [0.27, -0.27]) head.add(box(0.09, 0.14, 0.05, C.skinDark, { x: -0.04, y: 0.39, z, r: 0.02 }));

  const fx = 0.268;
  const eyes = [];
  const pupils = [];
  for (const z of [0.125, -0.125]) {
    const eye = box(0.02, 0.085, 0.125, '#efe9df', { x: fx, y: 0.42, z, r: 0.016 });
    const iris = box(0.016, 0.082, 0.07, C.iris, { x: 0.009, y: -0.002, r: 0.018 });
    iris.add(box(0.006, 0.05, 0.042, '#0d0a09', { x: 0.006, r: 0.012 }));
    iris.add(box(0.006, 0.016, 0.016, '#ffffff', { x: 0.009, y: 0.018, z: 0.013, r: 0.005 }));
    eye.add(iris);
    head.add(box(0.03, 0.026, 0.145, C.skinDark, { x: fx + 0.003, y: 0.476, z, r: 0.008 }));
    head.add(eye);
    eyes.push(eye);
    pupils.push(iris);
  }
  // blocks.expression setzt die Hoehe der Brauen auf 0,5 plus Versatz
  const brows = [0.125, -0.125].map((z) => {
    const m = box(0.034, 0.055, 0.175, C.hairDark, { x: fx + 0.006, y: 0.5, z, r: 0.012 });
    head.add(m);
    return m;
  });
  head.add(box(0.05, 0.1, 0.065, C.skinDark, { x: fx + 0.006, y: 0.33, r: 0.022 }));

  const lip = '#5a322c';
  const mouths = {};
  const addMouth = (name, parts) => {
    const m = new THREE.Group();
    parts.forEach((p) => m.add(p));
    m.visible = false;
    head.add(m);
    mouths[name] = m;
  };
  addMouth('smile', [
    box(0.02, 0.024, 0.14, lip, { x: fx + 0.002, y: 0.205, r: 0.01 }),
    box(0.02, 0.024, 0.04, lip, { x: fx + 0.002, y: 0.218, z: 0.08, r: 0.01 }),
    box(0.02, 0.024, 0.04, lip, { x: fx + 0.002, y: 0.218, z: -0.08, r: 0.01 }),
  ]);
  addMouth('flat', [box(0.02, 0.024, 0.15, lip, { x: fx + 0.002, y: 0.21, r: 0.01 })]);
  addMouth('worried', [
    box(0.02, 0.024, 0.1, lip, { x: fx + 0.002, y: 0.214, r: 0.01 }),
    box(0.02, 0.024, 0.04, lip, { x: fx + 0.002, y: 0.2, z: 0.064, r: 0.01 }),
    box(0.02, 0.024, 0.04, lip, { x: fx + 0.002, y: 0.2, z: -0.064, r: 0.01 }),
  ]);
  addMouth('open', [box(0.02, 0.09, 0.13, '#2a1412', { x: fx + 0.002, y: 0.195, r: 0.02 })]);
  addMouth('o', [box(0.02, 0.07, 0.07, '#2a1412', { x: fx + 0.002, y: 0.2, r: 0.02 })]);

  // Haare: kurz an den Seiten, oben etwas Laenge, kein Spielzeug-Schopf
  const lock = (w, h, d, color, x, y, z, rx = 0, ry = 0, rz = 0, r = 0.05) => {
    const m = box(w, h, d, color, { x, y, z, r });
    m.rotation.set(rx, ry, rz);
    head.add(m);
  };
  lock(0.58, 0.16, 0.56, C.hair, -0.02, 0.62, 0);
  lock(0.13, 0.34, 0.56, C.hairDark, -0.24, 0.46, 0, 0, 0, 0, 0.05);
  for (const z of [0.272, -0.272]) lock(0.34, 0.13, 0.03, C.hairDark, -0.07, 0.54, z, 0, 0, 0, 0.012);
  lock(0.22, 0.14, 0.56, C.hair, 0.21, 0.645, 0, 0, 0, -0.16, 0.06);
  lock(0.13, 0.08, 0.26, C.hairMid, 0.28, 0.61, 0.13, 0.1, 0, -0.3, 0.035);
  lock(0.38, 0.1, 0.42, C.hairMid, 0.0, 0.72, -0.02, 0.05, 0, -0.08, 0.045);

  group.userData.limbs = { legL, legR, armL, armR };
  group.userData.face = { head, eyes, pupils, brows, mouths };
  b.expression(group, 'flat');
  return group;
}
