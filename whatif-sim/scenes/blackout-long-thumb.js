// Thumbnail 16:9: node render.mjs scenes/blackout-long-thumb.js --cover --gpu --scale 0.6667 --out out/blackout-long-thumbnail.jpg
import orig from './blackout5.js';
import { remix } from '../runtime/remix.js';
import { wide } from '../runtime/ui-wide.js';

const def = remix(orig, { title: 'Thumbnail', start: 0, end: 1, lines: [{ id: 'hook', at: 0 }], overlay() {} });

export default {
  ...def,
  update(ctx, t, dt) {
    def.update(ctx, t, dt);
    // Figur nach rechts ruecken, links steht der Titel; Hochhaus bleibt dahinter sichtbar
    const S = ctx.state;
    S.crewOut.forEach((p) => (p.visible = false));
    S.people.forEach((p) => (p.visible = false));
    S.tape.forEach((m) => (m.visible = false));
    S.truck.visible = false;
    S.blueLight.intensity = 0;
    S.heroLight.intensity = 5;
    S.heroLight.position.set(0.7, 2.2, -41.6);
    S.you.rotation.y = Math.PI / 2 - 0.45;
    S.dayLight.color.set('#6f8fe0');
    S.dayLight.intensity = 0.9;
    // Nur ein Fenster brennt: Stock 14
    S.win.setColorAt(13 * 9 + 2, new ctx.THREE.Color(9, 5.2, 1.8));
    S.win.instanceColor.needsUpdate = true;
    ctx.camera.position.set(1.15, 1.05, -42);
    ctx.camera.lookAt(-3.1, 8.2, -22);
    ctx.camera.fov = 60;
    ctx.camera.updateProjectionMatrix();
    ctx.focus = 2.4;
    ctx.aperture = 0.03;
  },
  overlay(g) {
    wide.grade(g, { color: '#c3cfea', edge: 0.42 });
    const shade = g.createLinearGradient(0, 560, 0, 1080);
    shade.addColorStop(0, 'rgba(2,4,14,0)');
    shade.addColorStop(1, 'rgba(2,4,14,0.9)');
    g.fillStyle = shade;
    g.fillRect(0, 560, 1920, 520);
    wide.cover(g, { cx: 520, lines: ['No *water*'], y: 985, size: 262 });
  },
};
