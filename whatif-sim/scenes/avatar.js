// Profilbild: der Main Character aus "Blackout in a high-rise" vor der Stadt bei Nacht.
// node render.mjs scenes/avatar.js --check --count 1 --gpu, dann quadratisch zuschneiden.

export default {
  title: 'Channel avatar',
  duration: 1,
  fps: 30,
  seed: 14,
  look: {
    env: 0.2,
    ao: { radius: 0.3, intensity: 0.7 },
    dof: { aperture: 14, maxblur: 0.03 },
    bloom: { strength: 0.35, radius: 0.5, threshold: 1.3 },
  },
  story: { beats: [{ at: 0, role: 'hook', text: 'Avatar' }] },

  setup(ctx) {
    const { THREE, scene, camera, blocks: b, rng } = ctx;
    scene.background = new THREE.Color('#0a0f26');

    const you = b.character({ shirt: '#d9463d', pants: '#27324f', skin: '#d6a57c', hair: '#2a1a10', outfit: 'hoodie', hairStyle: 'tufts' });
    you.rotation.y = -Math.PI / 2 + 0.14;
    b.expression(you, 'worried');
    b.look(you, -0.5, 0.3);
    scene.add(you);

    // Stadtlichter im Hintergrund, durch die Unschaerfe weich
    const cols = ['#ffd27a', '#ffe4a8', '#bcd9ff'];
    for (let i = 0; i < 90; i++) {
      const c = new THREE.Color(rng.pick(cols)).multiplyScalar(rng.range(0.5, 1.1));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(rng.range(-7, 7), rng.range(-1, 6), -14 - rng.range(0, 4));
      scene.add(m);
    }

    const key = new THREE.PointLight('#ffb878', 9, 8, 1.5);
    key.position.set(-0.9, 1.55, 1.4);
    scene.add(key);
    const fill = new THREE.PointLight('#8fb0ff', 2.5, 8, 1.5);
    fill.position.set(1.2, 2.0, 1.2);
    scene.add(fill);
    const rim = new THREE.PointLight('#ff4438', 10, 6, 1.5);
    rim.position.set(0.9, 2.1, -1.1);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight('#8ea6e8', '#1b1d29', 0.5));

    camera.position.set(0, 1.72, 3.2);
    camera.lookAt(0, 1.72, 0);
    camera.fov = 40;
    camera.updateProjectionMatrix();
    ctx.focus = 3.2;
  },
};
