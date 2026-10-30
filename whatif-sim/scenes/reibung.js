// Was waere, wenn die Reibung 5 Sekunden lang verschwindet?
//
// Physik (vereinfacht, aber ehrlich):
// - Ohne Reibung gibt es keine horizontale Kraft zwischen Reifen/Schuhen und Boden.
//   Alles, was sich bewegt, behaelt seine Geschwindigkeit (1. Newtonsches Gesetz).
// - Bremsen und Lenken wirken nicht mehr; durchdrehende Raeder bringen nichts.
// - Gehen braucht Haftreibung: Laufende rutschen weg. Wer stillsteht, braucht keine
//   horizontale Kraft und bleibt stehen.
// - Luftwiderstand bleibt, ist ueber 5 s bei Stadttempo aber vernachlaessigbar.

const T_OFF = 3.5;
const T_ON = 8.5;
const MU = 0.8; // Reifen auf trockenem Asphalt
const G = 9.81;
const KMH = 3.6;

export default {
  title: 'Was wäre, wenn die *Reibung* 5 Sekunden lang verschwindet?',
  duration: 19,
  fps: 30,
  seed: 7,
  sources: [
    'Haftreibungszahl Reifen/trockener Asphalt ≈ 0,7–0,8 — Wikipedia „Reibungskoeffizient“ / Kfz-Fachliteratur',
    'Bremsweg s = v² / (2·μ·g) — Grundformel der Mechanik',
    'Gehen benötigt Haftreibung zwischen Schuh und Boden — z. B. Wikipedia „Gehen“',
  ],

  // Story zuerst (siehe STORY.md). `link` = Verbindung zum vorherigen Beat (aber/deshalb statt
  // "und dann"), `role` = Funktion im Bogen. {name} wird zur Laufzeit aus der Simulation ersetzt.
  story: {
    hook: 'Was wäre, wenn die Reibung 5 Sekunden lang verschwindet?',
    beats: [
      { at: 0, role: 'hook', until: 2.4, text: 'Was wäre, wenn die *Reibung* 5 Sekunden lang verschwindet?' },
      { at: 2.4, role: 'setup', link: 'also', text: 'Ampel *rot.* Du bremst.' },
      { at: 3.5, role: 'turn', link: 'aber', text: '*Aber* die Reibung ist weg.' },
      { at: 4.9, role: 'escalation', link: 'deshalb', text: 'Bremsen bringt *nichts* mehr.' },
      { at: 5.9, role: 'peak', link: 'also', text: 'Lenken auch nicht: *geradeaus.*' },
      { at: 7.4, role: 'escalation', link: 'deshalb', text: 'Grün? Räder *drehen durch.*' },
      { at: 8.8, role: 'consequence', link: 'doch', text: 'Reibung zurück. *Doch* {fallen} liegen am Boden.' },
      { at: 11.0, role: 'twist', link: 'aber', text: 'Nur wer *stillstand*, steht noch.' },
      { at: 13.2, role: 'answer', link: 'denn', text: 'Mit Reibung: *{stop} m* Bremsweg.' },
      { at: 14.8, role: 'payoff', link: 'aber', text: 'Ohne Reibung: *unendlich.*' },
      { at: 16.6, role: 'loop', link: 'denn', text: 'Und das alles, weil für 5 Sekunden …' },
    ],
  },

  setup(ctx) {
    const { THREE, scene, blocks: b, rng } = ctx;
    const S = ctx.state;

    scene.background = new THREE.Color('#8ec5f0');
    scene.fog = new THREE.Fog('#8ec5f0', 140, 360);
    scene.add(new THREE.HemisphereLight('#dfefff', '#5b5246', 1.4));
    const sun = new THREE.DirectionalLight('#fff3dc', 2.6);
    sun.position.set(-60, 110, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 300 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // Boden, Strassen, Gehwege
    scene.add(b.ground(800, '#6f7279'));
    const flat = (w, d, color, x, z, y = 0.02, h = 0.04) => {
      const m = b.box(w, h, d, color, { x, y, z });
      m.castShadow = false;
      scene.add(m);
      return m;
    };
    flat(400, 12, '#3a3d46', 0, 0);
    flat(12, 400, '#3a3d46', 0, 0);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        // Gehweg-Platte pro Quadrant (hoeher als die Strasse)
        const slab = b.box(200, 0.25, 200, '#b9b4a8', { x: sx * 106, y: 0.125, z: sz * 106 });
        slab.castShadow = false;
        scene.add(slab);
      }
    }
    for (let d = 9; d < 200; d += 6) {
      for (const s of [-1, 1]) {
        flat(3, 0.25, '#f4d03f', s * d, 0, 0.05, 0.02);
        flat(0.25, 3, '#f4d03f', 0, s * d, 0.05, 0.02);
      }
    }
    // Zebrastreifen + Haltelinien
    for (let k = -5; k <= 5; k += 1.6) {
      for (const s of [-1, 1]) {
        flat(2.6, 0.8, '#f2f2f2', s * 8.5, k, 0.05, 0.02);
        flat(0.8, 2.6, '#f2f2f2', k, s * 8.5, 0.05, 0.02);
      }
    }
    flat(0.5, 6, '#f2f2f2', -10.5, 3, 0.05, 0.02);
    flat(0.5, 6, '#f2f2f2', 10.5, -3, 0.05, 0.02);
    flat(6, 0.5, '#f2f2f2', -3, -10.5, 0.05, 0.02);
    flat(6, 0.5, '#f2f2f2', 3, 10.5, 0.05, 0.02);

    // Gebaeude entlang beider Strassen in allen vier Quadranten
    S.walls = [];
    const palette = ['#2f3a63', '#4a3f6b', '#3d5a73', '#6b4a3f', '#40566b', '#5a4a63'];
    const billboardColors = [['#ff3d7f', '#ffd23f', '#2ec4ff'], ['#7cff6b', '#1b1f3a', '#ff3d7f'], ['#ffd23f', '#ff6b35', '#ffffff'], ['#2ec4ff', '#ffffff', '#7b2cff']];
    const addBuilding = (x0, x1, z0, z1, h) => {
      const m = b.building(x1 - x0, h, z1 - z0, rng.pick(palette));
      m.position.x = (x0 + x1) / 2;
      m.position.z = (z0 + z1) / 2;
      m.position.y += 0.25;
      scene.add(m);
      S.walls.push({ x0, x1, z0, z1 });
      return m;
    };
    const FRONT = 12;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        // Reihe entlang der Hauptstrasse (X)
        for (let a = FRONT; a < 170;) {
          const w = rng.range(10, 20);
          const d = rng.range(14, 22);
          const h = rng.range(18, 75);
          const [x0, x1] = sx > 0 ? [a, a + w] : [-a - w, -a];
          const [z0, z1] = sz > 0 ? [FRONT, FRONT + d] : [-FRONT - d, -FRONT];
          addBuilding(x0, x1, z0, z1, h);
          if (rng() < 0.55 && a < 90) {
            const bb = b.billboard(rng.range(5, 8), rng.range(4, 7), rng.pick(billboardColors));
            bb.position.set((x0 + x1) / 2, rng.range(7, 16), sz > 0 ? FRONT - 0.2 : -FRONT + 0.2);
            scene.add(bb);
          }
          a += w + 0.6;
        }
        // Reihe entlang der Querstrasse (Z), hinter der Eckbebauung
        for (let a = FRONT + 23; a < 170;) {
          const w = rng.range(10, 20);
          const d = rng.range(14, 20);
          const h = rng.range(18, 60);
          const [z0, z1] = sz > 0 ? [a, a + w] : [-a - w, -a];
          const [x0, x1] = sx > 0 ? [FRONT, FRONT + d] : [-FRONT - d, -FRONT];
          addBuilding(x0, x1, z0, z1, h);
          a += w + 0.6;
        }
      }
    }

    // Baeume am Strassenrand
    for (let a = 18; a < 120; a += 14) {
      for (const s of [-1, 1]) {
        for (const side of [-1, 1]) {
          const t1 = b.tree();
          t1.position.set(s * a, 0.25, side * 10.6);
          scene.add(t1);
        }
      }
    }

    // Ampeln: Hauptstrasse (X) und Querstrasse (Z)
    const lamp = (x, z, rotY) => {
      const g = new THREE.Group();
      g.add(b.box(0.3, 5, 0.3, '#2b2b2b', { y: 2.5 }));
      g.add(b.box(0.6, 1.8, 0.6, '#1a1a1a', { y: 5.4 }));
      const bulbs = ['#ff3b30', '#ffcc00', '#34c759'].map((c, i) => {
        const m = new THREE.MeshStandardMaterial({ color: '#222', emissive: c, emissiveIntensity: 0 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.42), m);
        mesh.position.set(0.32, 6.0 - i * 0.58, 0);
        g.add(mesh);
        return m;
      });
      g.position.set(x, 0.25, z);
      g.rotation.y = rotY;
      scene.add(g);
      return bulbs;
    };
    S.mainLights = [lamp(-7.5, 7.5, Math.PI), lamp(7.5, -7.5, 0)];
    S.crossLights = [lamp(-7.5, -7.5, -Math.PI / 2), lamp(7.5, 7.5, Math.PI / 2)];

    // ---------- Autos ----------
    S.cars = [];
    const heading = (dx, dz) => Math.atan2(-dz, dx);
    const addCar = (color, opts) => {
      const group = b.car(color);
      group.rotation.order = 'YXZ';
      scene.add(group);
      const car = { group, pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: 0, slid: 0, ...opts };
      S.cars.push(car);
      return car;
    };
    // 1D-Bewegung mit Bremsen: Position ab Start x0, v0, Bremsbeginn tb, Verzoegerung a
    const brakePath = (x0, v0, tb, a) => (t) => {
      if (t <= tb) return { s: x0 + v0 * t, v: v0 };
      const tt = Math.min(t - tb, v0 / a);
      return { s: x0 + v0 * tb + v0 * tt - 0.5 * a * tt * tt, v: Math.max(0, v0 - a * (t - tb)) };
    };

    // Rotes Auto: bremst fuer die rote Ampel — rutscht ohne Reibung einfach drueber.
    const redPath = brakePath(-60 - (50 / KMH) * 0.5, 50 / KMH, 1.5, 3.0);
    S.red = addCar('#e63946', {
      after: 'brake',
      plan: (t) => ({ x: redPath(t).s, z: 3, h: 0, locked: t > 1.5 }),
    });
    // Taxi von der anderen Seite, bremst ebenfalls
    const taxiPath = brakePath(0, 50 / KMH, 2.5, 3.43);
    S.taxi = addCar('#f7c600', {
      after: 'brake',
      plan: (t) => ({ x: 70 + (50 / KMH) * 0.5 - taxiPath(t).s, z: -3, h: Math.PI, locked: t > 2.5 }),
    });
    // Blaues Auto biegt gerade links ab — ohne Reibung faehrt es geradeaus in die Hausecke.
    const R = 9;
    const vTurn = 9;
    const tArc = 2.9;
    S.blue = addCar('#1d8cf8', {
      after: 'brake',
      plan: (t) => {
        if (t < tArc) return { x: -6 - vTurn * (tArc - t), z: 3, h: 0 };
        const phi = Math.min(Math.PI / 2, (vTurn * (t - tArc)) / R);
        return { x: -6 + R * Math.sin(phi), z: -6 + R * Math.cos(phi), h: phi };
      },
    });
    // Querverkehr wartet an der Ampel: bei Gruen drehen die Raeder durch.
    for (const [x, z, dz] of [[-3, -14.5, 1], [-3, -20.5, 1], [3, 14.5, -1], [3, 20.5, -1]]) {
      addCar(rng.pick(['#f1faee', '#2a9d8f', '#8d99ae', '#ff8c42']), {
        after: 'go',
        waiting: true,
        plan: () => ({ x, z, h: heading(0, dz) }),
      });
    }
    // Durchgangsverkehr, schon hinter der Kreuzung: faehrt einfach weiter.
    for (const [x0, z, dir] of [[18, 3, 1], [52, 3, 1], [-16, -3, -1], [-48, -3, -1]]) {
      const v = (50 / KMH) * dir;
      addCar(rng.pick(['#f1faee', '#6c757d', '#9b5de5', '#00bbf9']), {
        after: 'cruise',
        plan: (t) => ({ x: x0 + v * t, z, h: dir > 0 ? 0 : Math.PI }),
      });
    }

    // ---------- Fussgaenger ----------
    S.people = [];
    const shirts = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#ecf0f1', '#e67e22', '#1abc9c'];
    const skins = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
    const addPerson = (x, z, dx, dz, walking) => {
      const p = b.person({ shirt: rng.pick(shirts), pants: rng.pick(['#22304f', '#3b3b3b', '#5a4632', '#1f4e79']), skin: rng.pick(skins), hair: rng.pick(['#3b2614', '#111111', '#a0522d', '#e8c07d']) });
      p.rotation.order = 'YXZ';
      p.rotation.y = heading(dx, dz);
      p.position.set(x, 0.25, z);
      scene.add(p);
      S.people.push({
        mesh: p, walking, dx, dz,
        speed: walking ? rng.range(1.2, 1.6) : 0,
        phase: rng() * Math.PI * 2,
        slipDelay: rng.range(0, 0.35),
        fall: 0, fallen: false, vx: 0, vz: 0,
        getUp: T_ON + rng.range(4.2, 6.0),
        wobble: rng() * 10,
      });
    };
    // Hauptfigur fuer die Nahaufnahme: rutscht als Erste weg.
    addPerson(-13, 7.2, -1, 0, true);
    S.hero = S.people[S.people.length - 1];
    Object.assign(S.hero, { speed: 1.4, slipDelay: 0.05 });
    // Gehende laufen von der Kreuzung weg, damit niemand auf die Fahrbahn geraet.
    for (let i = 0; i < 26; i++) {
      const s = rng() < 0.5 ? -1 : 1;
      const side = rng() < 0.5 ? -1 : 1;
      addPerson(s * rng.range(9, 55), side * rng.pick([7.2, 8.8]), s, 0, true);
    }
    for (let i = 0; i < 14; i++) {
      const s = rng() < 0.5 ? -1 : 1;
      const side = rng() < 0.5 ? -1 : 1;
      addPerson(side * rng.pick([7.2, 8.8]), s * rng.range(14, 50), 0, s, true);
    }
    // Wartende an den Ecken: stehen still.
    for (const [cx, cz] of [[-8.2, 8.2], [8.2, -8.2], [8.2, 8.2], [-8.2, -8.2]]) {
      for (let i = 0; i < 3; i++) {
        addPerson(cx + rng.range(-1.6, 1.6) * Math.sign(cx) * 0.6 + Math.sign(cx) * 0.6 * i, cz + Math.sign(cz) * rng.range(0, 2.2), -Math.sign(cx), 0, false);
      }
    }
    S.walkers = S.people.filter((p) => p.walking).length;
    S.fallenCount = 0;
    S.redSlid = 0;
    S.mu = MU;
    ctx.camera.position.set(-60, 6, 12);
  },

  update(ctx, t, dt) {
    const { THREE, camera, blocks: b, smooth, phase, lerp } = ctx;
    const S = ctx.state;
    const off = t >= T_OFF && t < T_ON;
    S.mu = off ? 0 : MU;

    // Ampeln
    const mainState = t < 2.0 ? 2 : t < 3.0 ? 1 : 0;
    const crossState = t < 4.5 ? 0 : 2;
    for (const bulbs of S.mainLights) bulbs.forEach((m, i) => (m.emissiveIntensity = i === mainState ? 2.2 : 0));
    for (const bulbs of S.crossLights) bulbs.forEach((m, i) => (m.emissiveIntensity = i === crossState ? 2.2 : 0));

    // ---------- Autos ----------
    for (const car of S.cars) {
      const prev = car.pos.clone();
      if (car.after === 'cruise' || t < T_OFF) {
        const p = car.plan(t);
        car.pos.set(p.x, 0, p.z);
        car.heading = p.h;
        car.locked = p.locked;
        if (t < T_OFF) {
          const q = car.plan(Math.max(0, t - 0.01));
          car.vel.set((p.x - q.x) / 0.01, 0, (p.z - q.z) / 0.01);
        }
      } else {
        if (t >= T_ON) {
          const speed = car.vel.length();
          if (car.after === 'brake' && speed > 0) {
            // Reibung ist zurueck: Vollbremsung mit μ·g
            const ns = Math.max(0, speed - MU * G * dt);
            car.vel.multiplyScalar(speed > 0 ? ns / speed : 0);
            car.locked = true;
          } else if (car.after === 'go' && t > T_ON + 0.4) {
            const dir = new THREE.Vector3(Math.cos(car.heading), 0, -Math.sin(car.heading));
            const ns = Math.min(10, speed + 2.5 * dt);
            car.vel.copy(dir.multiplyScalar(ns));
          }
        }
        car.pos.addScaledVector(car.vel, dt);
        // Aufprall an Hauswaenden (Auto als Kreis mit Radius 1,6 m)
        for (const w of S.walls) {
          if (car.pos.x > w.x0 - 1.6 && car.pos.x < w.x1 + 1.6 && car.pos.z > w.z0 - 1.6 && car.pos.z < w.z1 + 1.6) {
            car.pos.copy(prev);
            car.vel.set(0, 0, 0);
            car.crashT ??= t;
          }
        }
      }
      if (car === S.red && t >= T_OFF && t < T_ON) S.redSlid += car.pos.distanceTo(prev);

      const g = car.group;
      g.position.copy(car.pos);
      g.rotation.y = car.heading;
      // Bremsen kippt die Front nach unten (nur MIT Reibung — beim Rutschen gibt es keine
      // Bremskraft, also auch kein Nicken). Feder sorgt fuers Nachwippen beim Anhalten.
      const speedNow = car.pos.distanceTo(prev) / dt;
      const braking = car.locked && !off && speedNow > 0.2 && car.after !== 'cruise';
      car.pitchV = (car.pitchV || 0) + ((braking ? -0.045 : 0) - (car.pitch || 0)) * 160 * dt - (car.pitchV || 0) * 9 * dt;
      car.pitch = (car.pitch || 0) + car.pitchV * dt;
      const crash = car.crashT != null ? Math.exp(-(t - car.crashT) * 6) * Math.sin((t - car.crashT) * 60) * 0.08 : 0;
      g.rotation.z = car.pitch + crash;
      // Raeder: rollen mit der Strecke; beim Querverkehr drehen sie bei Gruen ohne Reibung durch.
      const dist = car.pos.distanceTo(prev);
      let spin = car.locked ? 0 : dist / 0.4;
      if (car.waiting && t >= 4.5 && t < T_ON) spin = 28 * dt;
      for (const wheel of g.userData.wheels) wheel.rotation.z -= spin;
    }

    // ---------- Fussgaenger ----------
    let fallen = 0;
    for (const p of S.people) {
      const m = p.mesh;
      if (p.walking) {
        const slipStart = T_OFF + p.slipDelay;
        if (t < slipStart) {
          p.vx = p.dx * p.speed;
          p.vz = p.dz * p.speed;
          p.phase += dt * p.speed * 4.2;
          b.animatePerson(m, p.phase, 1);
        } else if (t < p.getUp) {
          // Fuesse rutschen weg: nach hinten umfallen, dabei weiterrutschen
          if (t >= T_ON) {
            const k = Math.max(0, 1 - dt * 5);
            p.vx *= k;
            p.vz *= k;
          }
          p.fall = Math.min(1, p.fall + dt / 0.55);
          if (p.fall > 0.6) p.fallen = true;
          p.phase += dt * 14;
          b.animatePerson(m, p.phase, t < T_ON ? 0.8 : 0.15, t < T_ON ? 0.8 : 0.2);
        } else {
          // Aufstehen, kurz stehen bleiben, weitergehen
          p.fall = Math.max(0, p.fall - dt / 0.8);
          p.vx = 0;
          p.vz = 0;
          if (p.fall === 0 && t > p.getUp + 1.6) {
            p.vx = p.dx * p.speed;
            p.vz = p.dz * p.speed;
            p.phase += dt * p.speed * 4.2;
            b.animatePerson(m, p.phase, 1);
          } else {
            b.animatePerson(m, 0, 0, 0);
          }
        }
        m.position.x += p.vx * dt;
        m.position.z += p.vz * dt;
        const a = smooth(p.fall) * (Math.PI / 2 - 0.08);
        m.rotation.z = a;
        m.position.y = 0.25 + Math.sin(a) * 0.26;
      } else if (off) {
        // Stillstehende brauchen keine Reibung — sie balancieren nur nervoes.
        const k = smooth(phase(t, T_OFF, T_OFF + 0.6));
        b.animatePerson(m, 0, 0, 0.32 * k);
        m.rotation.x = Math.sin(t * 5 + p.wobble) * 0.04 * k;
      } else {
        const k = 1 - smooth(phase(t, T_ON, T_ON + 0.8));
        b.animatePerson(m, 0, 0, t >= T_ON ? 0.32 * k : 0);
        m.rotation.x = 0;
      }
      if (p.fallen) fallen++;
    }
    S.fallenCount = Math.max(S.fallenCount, fallen);

    // ---------- Kamera ----------
    // Shot-Liste: jede Einstellung zeigt genau das, was der Untertitel gerade sagt.
    if (!S.rig) {
      const hero = () => S.hero.mesh.position;
      const red = () => S.red.pos;
      S.rig = ctx.motion.shots(THREE, [
        // Hook: hinter dem roten Auto auf Strassenhoehe
        { at: 0, fov: 48, pos: () => [red().x - 15, 5.5, red().z + 2], look: () => [red().x + 14, 1.5, red().z - 1] },
        // Wendepunkt: harter Schnitt auf den Fussgaenger, der wegrutscht
        { at: 3.5, fov: 46, pos: () => [hero().x - 5.5, 1.7, 10.2], look: () => [hero().x + 0.6, 0.8, hero().z - 0.8], move: { fov: 52, dur: 1.4 } },
        // Totale: rotes Auto rutscht ueber Rot, blaues Auto in die Hausecke
        { at: 4.9, fov: 58, pos: [-30, 34, 1.5], look: [4, 0, -2], move: { pos: [-26, 30, 1.5], dur: 2.5 } },
        // Detail: Raeder des Querverkehrs drehen durch
        { at: 7.4, fov: 46, pos: [4.5, 2.6, -7.6], look: [-3, 0.7, -14.5] },
        // Folge: Gestuerzte auf dem Gehweg
        { at: 8.8, fov: 50, pos: [-13, 4.2, 4.2], look: [-27, 0.3, 8.2], move: { pos: [-15, 3.6, 4.6], dur: 2.2 } },
        // Kontrast: die Stehenden an der Ecke, dahinter die Liegenden
        { at: 11.0, fov: 60, pos: [-3.5, 1.8, 9.6], look: [-30, 0.3, 8.8], move: { pos: [-4.5, 1.7, 9.6], dur: 2.2 } },
        // Aufloesung: Kran nach oben, Ueberblick
        { at: 13.2, fov: 58, pos: [-30, 30, 1.5], look: [4, 0, 0], move: { pos: [-44, 62, 1.5], look: [8, 0, 0], dur: 3.4 } },
        // Loop: zurueck auf Strassenhoehe, wie am Anfang
        { at: 16.6, fov: 48, blend: 1.6, pos: [-58, 5.5, 5], look: [-29, 1.5, 2] },
      ]);
    }
    const blueCrash = S.blue.crashT;
    S.rig.apply(camera, t, ctx, ctx.motion.shake(t, blueCrash, { amp: 0.9, decay: 4 }));
  },

  overlay(g, t, ui, ctx) {
    const S = ctx.state;
    const { smooth, phase } = ctx;
    const fadeIn = (a, b) => smooth(phase(t, a, b));
    const window_ = (a, b, f = 0.25) => Math.min(fadeIn(a, a + f), 1 - fadeIn(b - f, b));
    const stop = (50 / KMH) ** 2 / (2 * MU * G);
    const vars = { fallen: S.fallenCount, stop: ui.fmt(stop, 0) };
    const fill = (text) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

    ui.vignette(g, 0.6);

    // Oben: Status
    if (t < T_OFF) ui.pill(g, 'WAS WÄRE *WENN*', {});
    else if (t < T_ON) ui.pill(g, `REIBUNG WEG · *${ui.fmt(t - T_OFF, 1)} s*`, {});
    else ui.pill(g, 'REIBUNG *ZURÜCK*', {});

    // Zahlen nur, solange sie die Geschichte tragen (weniger ist mehr)
    const statsAlpha = window_(3.3, 13.0, 0.3);
    ui.stat(g, { x: 60, y: 230, width: 470, label: 'Reibungszahl μ', value: ui.fmt(S.mu, 2), color: S.mu === 0 ? '#ff5a5f' : ui.YELLOW, alpha: statsAlpha });
    ui.stat(g, { x: 550, y: 230, width: 470, label: 'Gestürzt', value: `${S.fallenCount}`, unit: `/ ${S.walkers}`, alpha: statsAlpha });
    ui.stat(g, {
      x: 60, y: 420, width: 960, alpha: window_(4.9, 7.4, 0.3),
      label: 'Rotes Auto, über Rot gerutscht',
      value: ui.fmt(S.redSlid, 1), unit: `m  ·  ${ui.fmt(S.red.vel.length() * KMH, 0)} km/h`,
    });

    // Hook als grosser Titel, ab Frame 0 sichtbar (kein Schwarzbild am Anfang)
    const beats = this.story.beats;
    ui.title(g, beats[0].text, { y: 640, alpha: 1 - fadeIn(2.15, 2.4) });
    ui.beats(g, t, beats.slice(1).map((b) => ({ ...b, text: fill(b.text) })), { y: 1330 });

    // Faktenkarte mit Quelle zur Aufloesung
    ui.card(g, {
      y: 1530,
      alpha: window_(13.2, 16.5, 0.3),
      label: 'Fakt · Bremsweg aus 50 km/h',
      lines: [`μ ≈ 0,8 (Reifen auf trockenem Asphalt): ${ui.fmt(stop, 0)} m.`, 'μ = 0: Das Auto hält nie an.'],
      source: 's = v² / (2·μ·g)',
    });

    // Akzent am Hoehepunkt: kurzer Blitz beim Aufprall
    if (S.blue.crashT != null) ui.flash(g, 0.35 * Math.exp(-(t - S.blue.crashT) * 9));
  },
};
