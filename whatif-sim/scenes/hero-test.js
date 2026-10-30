// Pruefstand fuer die Hauptfigur: Drehung und Ausdruecke.
import { hero } from '../runtime/hero.js';

const VIEWS = [
  [[4.4, 1.7, 1.1], [0, 1.3, 0], 'smile'],
  [[3.6, 1.8, 2.6], [0, 1.3, 0], 'worried'],
  [[0, 1.6, 4.6], [0, 1.3, 0], 'flat'],
  [[-3.6, 1.9, 2.7], [0, 1.3, 0], 'open'],
  [[2.0, 2.14, 0.2], [0, 2.1, 0], 'worried'],
  [[2.0, 2.14, 0.2], [0, 2.1, 0], 'smile'],
  [[2.0, 2.14, 0.2], [0, 2.1, 0], 'o'],
  [[2.0, 2.14, 0.2], [0, 2.1, 0], 'flat'],
];

export default {
  title: 'Hero test',
  duration: 8,
  fps: 30,
  seed: 3,
  look: { env: 0.3, ao: { radius: 0.3, intensity: 0.7 }, bloom: { strength: 0.2, radius: 0.5, threshold: 1.5 } },
  story: { beats: [{ at: 0, role: 'hook', text: 'Test' }] },
  setup(ctx) {
    const { THREE, scene, blocks: b } = ctx;
    scene.background = new THREE.Color('#222a3f');
    ctx.state.you = hero(THREE, b);
    scene.add(ctx.state.you);
    scene.add(new THREE.HemisphereLight('#c8d4ee', '#4a4a55', 1.1));
    const key = new THREE.DirectionalLight('#fff0dd', 2.6);
    key.position.set(5, 6, 3);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#7fa6ff', 1.4);
    rim.position.set(-4, 4, -4);
    scene.add(rim);
    const floor = b.ground(30, '#39415a');
    scene.add(floor);
  },
  update(ctx, t) {
    const v = VIEWS[Math.min(VIEWS.length - 1, Math.floor(t))];
    ctx.camera.position.set(...v[0]);
    ctx.camera.lookAt(...v[1]);
    ctx.camera.fov = 40;
    ctx.camera.updateProjectionMatrix();
    ctx.blocks.expression(ctx.state.you, v[2]);
  },
};
