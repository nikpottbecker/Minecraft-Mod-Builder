// Bildlook: Umgebungslicht, Ambient Occlusion, Tiefenunschaerfe (Bokeh), Bloom.
//
// Eine Szene setzt `look` im default export:
//   look: {
//     env: 0.5,                                   // Staerke der weichen Studio-Umgebung (Reflexionen, Fuelllicht)
//     ao: { radius: 0.6, intensity: 1 },          // Kontaktschatten in Ecken und Fugen
//     dof: { aperture: 0.6, maxblur: 0.012 },     // Unschaerfe; Fokus per ctx.focus = Distanz in m
//     bloom: { strength: 0.35, radius: 0.5, threshold: 0.85 },
//   }
// Fehlt ein Eintrag, ist der Effekt aus. quality 'draft' schaltet AO und Unschaerfe ab.

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createLook(THREE, { renderer, scene, camera, width, height, look = {}, quality = 'final' }) {
  if (look.env) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = look.env;
  }

  const draft = quality === 'draft';
  const usePost = look.ao || look.dof || look.bloom;
  if (!usePost) {
    return { render: () => renderer.render(scene, camera), setFocus() {} };
  }

  const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));

  if (look.ao && !draft) {
    const ao = new GTAOPass(scene, camera, width, height);
    ao.updateGtaoMaterial({ radius: look.ao.radius ?? 0.6, distanceExponent: 1, thickness: 1, scale: 1 });
    ao.blendIntensity = look.ao.intensity ?? 1;
    composer.addPass(ao);
  }
  let bokeh = null;
  if (look.dof && !draft) {
    bokeh = new BokehPass(scene, camera, { focus: 10, aperture: (look.dof.aperture ?? 0.6) * 0.001, maxblur: look.dof.maxblur ?? 0.012 });
    composer.addPass(bokeh);
  }
  if (look.bloom) {
    const b = look.bloom;
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), b.strength ?? 0.35, b.radius ?? 0.5, b.threshold ?? 0.85));
  }
  composer.addPass(new OutputPass());

  return {
    render: () => composer.render(),
    setFocus(distance, aperture) {
      if (!bokeh) return;
      bokeh.uniforms.focus.value = distance;
      if (aperture != null) bokeh.uniforms.aperture.value = aperture * 0.001;
    },
  };
}
