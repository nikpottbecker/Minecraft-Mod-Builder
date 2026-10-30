// Thumbnail "Don't run": node render.mjs scenes/blackout-long-thumb2.js --cover --gpu --scale 0.6667 --out out/blackout-long-thumbnail.jpg
import orig from './blackout4.js';
import { remix } from '../runtime/remix.js';
import { wide } from '../runtime/ui-wide.js';

const def = remix(orig, { title: 'Thumbnail', start: 0, end: 1, lines: [{ id: 'now', at: 0 }], overlay() {} });

export default {
  ...def,
  update(ctx, t, dt) {
    def.update(ctx, t, dt);
    const S = ctx.state;
    const b = ctx.blocks;
    S.you.position.set(-3.1, 0, 1.75);
    S.you.rotation.y = Math.PI / 2 + 0.12;
    b.expression(S.you, 'shock');
    b.look(S.you, 0.55, 0);
    S.you.userData.limbs.armR.rotation.z = 0;
    // Raum fast schwarz: Licht kommt nur noch aus dem Tuerspalt
    S.flames.forEach((f) => (f.visible = false));
    S.candleLight.intensity = 0;
    S.hemi.intensity = 0.06;
    S.gap.visible = true;
    S.gap.material.color.setRGB(14, 6, 1.2);
    S.heat.intensity = 3.2;
    S.floorSmoke.visible = false;
    if (!S.glowL) {
      S.glowL = new ctx.THREE.PointLight('#ff6a1e', 20, 9, 1.3);
      S.glowL.position.set(-2.1, 0.5, 2.6);
      S.rimL = new ctx.THREE.PointLight('#5f86ff', 2.6, 6, 1.4);
      S.rimL.position.set(-4.1, 2.2, 1.2);
      S.faceL = new ctx.THREE.PointLight('#ffb98a', 4.5, 5, 1.2);
      S.faceL.position.set(-2.55, 1.5, 0.55);
      ctx.scene.add(S.glowL, S.rimL, S.faceL);
    }
    ctx.camera.position.set(-2.62, 1.6, -0.12);
    ctx.camera.lookAt(-1.75, 1.52, 3.5);
    ctx.camera.fov = 58;
    ctx.camera.updateProjectionMatrix();
    ctx.focus = 1.9;
    ctx.aperture = 0.1;
  },
  overlay(g) {
    wide.grade(g, { color: '#fff0e0', edge: 0.6 });
    // Rauch: Schwaden steigen vom Spalt auf, vom Glutlicht angestrahlt
    const puffs = [[640, 900, 150], [760, 830, 190], [540, 800, 170], [860, 700, 210], [620, 640, 190], [980, 860, 170], [440, 930, 150], [760, 540, 170], [1040, 640, 150]];
    g.save();
    g.globalCompositeOperation = 'screen';
    puffs.forEach(([x, y, r], i) => {
      const p = g.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.34 - i * 0.02;
      p.addColorStop(0, `rgba(255,${120 - i * 6},${50 - i * 3},${a})`);
      p.addColorStop(1, 'rgba(120,50,20,0)');
      g.fillStyle = p;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    g.restore();
    wide.cover(g, { cx: 400, lines: ["Don't", '*run*'], y: 420, size: 270 });
  },
};
