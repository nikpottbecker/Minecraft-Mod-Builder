# Animations-Handwerk: damit es nicht nach Programmierer-Animation aussieht

Werkzeuge: `ctx.motion` (`runtime/motion.js`), Overlays: `ui` (`runtime/ui.js`).

## Die 12 Animationsprinzipien (Disney), übersetzt in Code

| Prinzip | Was es heißt | So im Code |
| --- | --- | --- |
| **Timing & Spacing** | Nichts bewegt sich linear | `motion.tween(t, a, b, ease.inOutCubic)`, nie rohes `t` für Kamera/Text |
| **Ease in / out** | Beschleunigen, abbremsen | `ease.outCubic` für Ankommen, `ease.inCubic` für Losfahren |
| **Antizipation** | Vor der Aktion kurz Schwung holen | `ease.inBack`; Figur hebt Arme, *bevor* sie fällt; Auto nickt beim Bremsen |
| **Follow-through / Overlap** | Teile kommen später zur Ruhe | `motion.spring()`: Auto wippt nach dem Anhalten nach, Text schießt über (`ease.outBack`) |
| **Staging** | Pro Einstellung **ein** Blickpunkt | Shot-Liste: jede Einstellung zeigt genau den Untertitel |
| **Bögen** | Natürliche Bahnen sind gekrümmt | Kamerafahrten mit `move` + Easing, keine Ecken |
| **Sekundäre Aktion** | Kleine Details machen es lebendig | Ampel schaltet, Räder drehen sichtbar (Felgen-Streifen), Leute balancieren |
| **Übertreibung** | Physik ehrlich, aber **groß zeigen** | Nahaufnahme statt Totale, Blitz + Wackeln beim Aufprall |
| **Squash & Stretch** | Verformung zeigt Wucht | Im Block-Stil sparsam: kurzes `scale` beim Aufprall/Aufploppen |
| **Solide Formen** | Einheitlicher Stil | Nur `ctx.blocks`-Bausteine, gleiche Proportionen |
| **Appeal** | Figuren, die man mag | Bunte Shirts, klare Silhouetten, nicht zu viele Details |
| **Pose to pose** | Keyframes für geplante Bewegung | `motion.keyframes(t, [[0, a], [1.2, b]])` |

## Kamera-Grammatik

- **Shot-Liste statt Dauerfahrt**: `motion.shots(THREE, [...])`. Eine Einstellung
  dauert 1,5–3 s. Bei jedem neuen Beat ein Schnitt.
- **Größen mischen**: Totale (Überblick) → Nahaufnahme (Gefühl) → Detail (Beweis).
  Den Wendepunkt immer **nah** zeigen.
- **Harter Schnitt auf die Aktion** (`blend: 0`) wirkt schneller als Überblenden.
  Weiche Blenden (`blend: 1–1,5`) nur für Ruhe-Momente und den Loop.
- **Kamera bewegt sich immer leicht** (`move`): ein stehendes Bild wirkt wie ein Standbild.
- **Wackeln nur beim Höhepunkt**: `motion.shake(t, crashT)`. Wer überall wackelt,
  hat am Höhepunkt nichts mehr übrig.
- **Nie durch Objekte**: Kamera nicht in Häusern, Bäumen, Masten oder Autospuren
  platzieren. Der `--check`-Kontaktbogen zeigt das sofort.

## Bildaufbau für Hochkant (9:16)

- **Oben (0–700 px)**: Status-Label + max. 2–3 Zahlenkacheln. Nur zeigen, solange
  sie die Geschichte tragen.
- **Mitte (700–1250 px)**: die Aktion. Hier gehört das Motiv hin.
- **Untertitel bei ~1330 px**: im unteren Drittel, aber über der TikTok-Leiste.
- **Unten (ab ~1650 px) und rechter Rand (~120 px)**: werden von TikTok-Buttons und
  Beschreibung verdeckt. Dort nichts Wichtiges.

## Text-Animation

- `ui.beats()` lässt Wörter einzeln aufploppen (0,07 s versetzt, leichtes
  Überschwingen). Jeder Wortwechsel ist ein kleiner Reiz und hält das Auge.
- Das gelbe Schlüsselwort sitzt am Zeilenende, dort trifft es zuletzt und stärksten.
- Zahlen zählen hoch (Simulation) statt plötzlich dazustehen.

## Rhythmus

- Alle **1–3 s** ein neuer Reiz: Schnitt, neuer Text, Zahl springt, Ereignis.
- Vor dem Höhepunkt kurz **ruhiger** werden, dann wirkt der Peak stärker.
- Das Ende nicht ausblenden: Loop-Satz stehen lassen, damit das Video nahtlos neu startet.

## Look: Licht, Material, Kamera-Optik

Gesteuert über `look` in der Szene (`runtime/look.js`) und `ctx.blocks`:

- **Abgerundete Kanten** (`box(..., { r })`): Jede Box hat leicht runde Kanten. Die fangen
  Glanzlichter und lassen alles wie Spielzeug aus Plastik wirken.
- **Drei-Punkt-Licht**: warmes Hauptlicht (Sonne/Key), kühles Fülllicht (Himmel/Hemisphere),
  farbiges Kantenlicht von hinten (Rim), das die Silhouette vom Hintergrund trennt.
- **`env`**: weiche Studio-Umgebung für Reflexionen. 0,25–0,4 reicht, mehr macht alles flach.
- **`ao`** (Ambient Occlusion): Kontaktschatten in Fugen und unter Figuren. Gibt Gewicht.
- **`dof`** (Tiefenunschärfe): Der Fokus folgt automatisch dem `look`-Punkt bzw. `focus` des
  aktiven Shots. Nahaufnahmen bekommen dadurch einen weichen Hintergrund wie bei einer
  echten Kamera. Für Studios ist `aperture` 4–6 gut, für Städte 0,2–0,4.
- **`bloom`**: Nur Dinge über `threshold` leuchten (Fenster, Werbetafeln, Scheinwerfer,
  Bokeh-Lichter). Weiße Flächen dürfen nicht glühen, deshalb den Schwellenwert hoch halten (≥ 1,4).
- **Himmel**: Verlauf als Canvas-Textur, Nebel in Horizontfarbe, damit die Ferne weich ausläuft.

## Figuren (`ctx.blocks.character`)

- Optionen: `shirt`, `pants`, `skin`, `hair`, `shoes`, `accent`,
  `outfit` (`hoodie` | `jacket` | `tshirt`), `hairStyle` (`tufts` | `spiky` | `bun` | `cap` | `short` | `none`).
- Ausdrücke: `blocks.expression(fig, 'smile' | 'flat' | 'worried' | 'open' | 'o' | 'shock' | 'angry')`.
- `blocks.blink(fig, 0..1)`, `blocks.look(fig, seite, oben)` für Pupillen, Kopf: `fig.userData.face.head`.
- **Das Gesicht erzählt mit**: Jeder Beat bekommt einen passenden Ausdruck (normal → Schock →
  Sorge → Erleichterung). Blinzeln alle 2–4 s, pro Figur versetzt, sonst wirken sie tot.
- Nahaufnahmen von vorne zeigen, damit man das Gesicht sieht.

`scenes/studio.js` ist eine Vorlage für Studio-/Moderationsszenen (Gitterboden, Bokeh, Nahaufnahme).
