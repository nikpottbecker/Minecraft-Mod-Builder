// Look-Test: Studio mit Gitterboden, Bokeh-Lichtern und Figuren in Nahaufnahme.
// Dient auch als Vorlage fuer Moderations-/Erklaer-Szenen.

export default {
  title: 'Studio-Test',
  duration: 6,
  fps: 30,
  seed: 3,
  look: {
    env: 0.25,
    ao: { radius: 0.5, intensity: 0.9 },
    dof: { aperture: 6, maxblur: 0.03 },
    bloom: { strength: 0.6, radius: 0.6, threshold: 1.6 },
  },
  story: { beats: [{ at: 0, role: 'hook', text: 'Studio-Test' }] },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;
    scene.background = new THREE.Color('#0b1030');
    scene.fog = new THREE.Fog('#0b1030', 12, 40);

    // Licht: warmes Hauptlicht von vorne-oben, kuehles Fuelllicht, Kantenlicht von hinten
    scene.add(new THREE.HemisphereLight('#8fa6ff', '#1a1530', 0.6));
    const key = new THREE.DirectionalLight('#fff1dd', 2.8);
    key.position.set(6, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#7f9bff', 2.2);
    rim.position.set(-6, 4, -3);
    scene.add(rim);
    const fill = new THREE.PointLight('#ff9b6b', 6, 12, 2);
    fill.position.set(3, 1.5, -3);
    scene.add(fill);

    // Boden mit leuchtendem Gitter (Textur statt 1-px-Linien, damit es auch unscharf noch traegt)
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g2 = c.getContext('2d');
    g2.fillStyle = '#000';
    g2.fillRect(0, 0, 128, 128);
    g2.fillStyle = '#ffffff';
    g2.fillRect(0, 0, 128, 4);
    g2.fillRect(0, 0, 4, 128);
    const gridTex = new THREE.CanvasTexture(c);
    gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(60, 60);
    gridTex.anisotropy = 8;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({
      color: '#060a22', roughness: 0.8, envMapIntensity: 0.15, emissive: '#3346d6', emissiveMap: gridTex, emissiveIntensity: 0.9,
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Bokeh-Lichter im Hintergrund (leuchtende Kugeln, werden durch die Unschaerfe zu Kreisen)
    const colors = ['#ffd23f', '#ff6b9a', '#6bd1ff', '#ffffff', '#ff9b4a'];
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.05, 0.14), 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(rng.pick(colors)).multiplyScalar(5) }));
      m.position.set(rng.range(-14, -5), rng.range(0.5, 9), rng.range(-12, 12));
      scene.add(m);
    }

    S.hero = b.character({ shirt: '#2fb67c', pants: '#2b2f45', skin: '#c68642', hair: '#1c1410', outfit: 'jacket', hairStyle: 'tufts' });
    S.hero.position.set(0, 0, 0.9);
    S.hero.rotation.y = 0.35;
    scene.add(S.hero);
    S.friend = b.character({ shirt: '#ff7a3d', pants: '#22304f', skin: '#f1c27d', hair: '#a0522d', outfit: 'hoodie', hairStyle: 'bun', accent: '#2a2a6e' });
    S.friend.position.set(-1.2, 0, -1.2);
    S.friend.rotation.y = -0.2;
    scene.add(S.friend);
  },

  update(ctx, t) {
    const { camera, blocks: b, motion } = ctx;
    const S = ctx.state;
    const exprs = ['smile', 'open', 'shock', 'worried', 'smile'];
    b.expression(S.hero, exprs[Math.min(exprs.length - 1, Math.floor(t / 1.2))]);
    b.expression(S.friend, t < 3 ? 'smile' : 'o');
    // Blinzeln alle ~2,3 s, dauert 0,12 s
    const bt = (t + 0.4) % 2.3;
    b.blink(S.hero, bt < 0.12 ? Math.sin((bt / 0.12) * Math.PI) : 0);
    b.look(S.hero, Math.sin(t * 0.8) * 0.6, 0);
    b.animatePerson(S.hero, 0, 0, 0);
    S.hero.userData.face.head.rotation.z = Math.sin(t * 1.3) * 0.04;
    S.hero.userData.limbs.armL.rotation.z = motion.keyframes(t, [[0, 0], [1.2, 0], [1.6, 1.4], [2.6, 1.4], [3.0, 0]], motion.ease.outBack);

    // Langsame Fahrt auf das Gesicht
    camera.position.set(...motion.keyframes(t, [[0, [4.2, 2.0, 2.4]], [6, [3.0, 1.75, 1.6]]], motion.ease.inOutQuad));
    camera.lookAt(0, 1.55, 0.6);
    camera.fov = 38;
    camera.updateProjectionMatrix();
    ctx.focus = camera.position.distanceTo(S.hero.position) - 0.1;
  },

  overlay(g, t, ui) {
    ui.pill(g, 'LOOK *TEST*');
  },
};
