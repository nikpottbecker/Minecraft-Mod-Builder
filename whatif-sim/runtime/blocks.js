// Bausteine im Block-Look (Minecraft/Voxel-Stil). Alle Masse in Metern.

export function blocks(THREE, rng) {
  const matCache = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!matCache.has(key)) {
      matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra }));
    }
    return matCache.get(key);
  };

  const box = (w, h, d, color, { x = 0, y = 0, z = 0, material } = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material || mat(color));
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

  return {
    mat,
    box,

    ground(size = 400, color = '#5b8f4e') {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color));
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      return mesh;
    },

    // Strasse entlang der X-Achse, Mitte bei z.
    road(length, width, { z = 0 } = {}) {
      const group = new THREE.Group();
      const asphalt = box(length, 0.1, width, '#3a3d46', { y: 0.05, z });
      asphalt.castShadow = false;
      group.add(asphalt);
      for (let x = -length / 2 + 2; x < length / 2; x += 6) {
        const dash = box(3, 0.02, 0.25, '#f4d03f', { x, y: 0.11, z });
        dash.castShadow = false;
        group.add(dash);
      }
      for (const side of [-1, 1]) {
        const walk = box(length, 0.25, 4, '#b9b4a8', { y: 0.125, z: z + side * (width / 2 + 2) });
        walk.castShadow = false;
        group.add(walk);
      }
      return group;
    },

    building(w, h, d, base = '#2f3a63') {
      const tex = facadeFor(base).clone();
      tex.needsUpdate = true;
      tex.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 12)));
      const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 });
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
      const m = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.9 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), m);
      return mesh;
    },

    tree() {
      const group = new THREE.Group();
      group.add(box(0.5, 2.4, 0.5, '#6b4423', { y: 1.2 }));
      group.add(box(2.4, 2.0, 2.4, '#3f8f3a', { y: 3.2 }));
      group.add(box(1.4, 1.0, 1.4, '#4fa846', { y: 4.6 }));
      return group;
    },

    // Auto, Front zeigt in +X. Rueckgabe: Gruppe mit userData.wheels.
    car(color = '#e74c3c') {
      const group = new THREE.Group();
      group.add(box(4.2, 0.9, 1.9, color, { y: 0.85 }));
      group.add(box(2.3, 0.75, 1.75, color, { x: -0.3, y: 1.65 }));
      group.add(box(2.2, 0.6, 1.8, '#9fd3ff', { x: -0.3, y: 1.62, material: mat('#9fd3ff', { roughness: 0.2, metalness: 0.3 }) }));
      group.add(box(0.1, 0.25, 0.4, '#fff6c8', { x: 2.12, y: 0.95, z: 0.6 }));
      group.add(box(0.1, 0.25, 0.4, '#fff6c8', { x: 2.12, y: 0.95, z: -0.6 }));
      const wheels = [];
      for (const [x, z] of [[1.3, 0.95], [1.3, -0.95], [-1.3, 0.95], [-1.3, -0.95]]) {
        const wheel = box(0.8, 0.8, 0.35, '#1b1b1f', { x, y: 0.4, z });
        wheels.push(wheel);
        group.add(wheel);
      }
      group.userData.wheels = wheels;
      return group;
    },

    // Blockfigur, ca. 1,8 m gross. Schaut in +X. userData.limbs fuer Animation.
    person({ shirt = '#f1c40f', pants = '#22304f', skin = '#d8a27a', hair = '#3b2614' } = {}) {
      const group = new THREE.Group();
      const pivot = (y, child) => {
        const p = new THREE.Group();
        p.position.y = y;
        child.position.y -= y;
        p.add(child);
        group.add(p);
        return p;
      };
      const legL = pivot(0.85, box(0.22, 0.85, 0.22, pants, { y: 0.425, z: 0.13 }));
      const legR = pivot(0.85, box(0.22, 0.85, 0.22, pants, { y: 0.425, z: -0.13 }));
      group.add(box(0.3, 0.65, 0.5, shirt, { y: 1.18 }));
      const armL = pivot(1.45, box(0.18, 0.62, 0.18, shirt, { y: 1.17, z: 0.34 }));
      const armR = pivot(1.45, box(0.18, 0.62, 0.18, shirt, { y: 1.17, z: -0.34 }));
      group.add(box(0.36, 0.36, 0.36, skin, { y: 1.69 }));
      group.add(box(0.38, 0.1, 0.38, hair, { y: 1.9 }));
      group.userData.limbs = { legL, legR, armL, armR };
      return group;
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
