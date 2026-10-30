# whatif-sim: „Was wäre wenn…“-Videos als Code

Kein KI-Video: Claude schreibt eine 3D-Szene (Three.js, Block-Look), ein
Headless-Browser rendert sie Frame für Frame, ffmpeg macht daraus ein
hochkant MP4 (1080×1920, 30 fps) für TikTok, Reels und Shorts.

## Einrichtung (einmalig)

Voraussetzungen: Node.js ≥ 20, ffmpeg (`brew install ffmpeg` auf dem Mac).

```bash
cd whatif-sim
npm install
npx playwright install chromium
```

## Benutzung mit Claude Code

Im Ordner `whatif-sim` Claude Code starten und eine Zeile schreiben:

> Was wäre, wenn alle Ampeln weltweit 5 Sekunden lang grün wären?

Claude folgt dann [`CLAUDE.md`](./CLAUDE.md), dazu das Story-Regelwerk
[`STORY.md`](./STORY.md) und das Animations-Handwerk [`ANIMATION.md`](./ANIMATION.md):

1. **Prämisse prüfen**: Gibt es das Video schon? Ist die Physik sauber?
2. **Quellen**: Jede Zahl bekommt eine Quelle oder Formel.
3. **Story zuerst**: Beats mit „aber/deshalb“, Höhepunkt, Pointe, Loop; per `lint-story.mjs` geprüft
4. **Szene schreiben**: `scenes/<name>.js` mit Shot-Liste
5. **Eigene Frames prüfen**: Kontaktbogen ansehen, Fehler beheben.
6. **Rendern**: `out/<name>.mp4`

## Befehle

| Befehl | Was passiert |
| --- | --- |
| `node render.mjs scenes/reibung.js` | Finales Video nach `out/reibung.mp4` |
| `... --preview` | Halbe Auflösung, 15 fps, ohne AO/Unschärfe, schnell zum Anschauen |
| `... --draft` | Volle Auflösung, aber ohne AO/Unschärfe (schneller) |
| `... --check [--from 3 --to 8 --count 8]` | Standbilder + `kontaktbogen.jpg` in `out/check/` |
| `... --gpu` | Grafikkarte statt Software-Rendering (viel schneller auf dem Mac) |
| `... --audio musik.mp3` | Tonspur dazumischen |
| `... --out pfad.mp4` | Ausgabedatei festlegen |
| `node lint-story.mjs scenes/reibung.js` | Story-Check mit Score (läuft auch vor jedem Rendern) |

Live im Browser ansehen: `npx serve .` und
`http://localhost:3000/runtime/index.html?scene=/scenes/reibung.js&scale=0.5&live` öffnen.

## Aufbau

```
render.mjs          Renderer: Headless-Chromium -> JPEG-Frames -> ffmpeg (H.264)
runtime/engine.js   Lädt die Szene, feste Zeitschritte (deterministisch), Kamera, Licht
runtime/blocks.js   Bausteine mit runden Kanten: Figuren mit Gesichtsausdrücken, Häuser, Autos, Bäume
runtime/ui.js       TikTok-Overlays: Label, Titel, Wort-für-Wort-Untertitel, Zahlenkacheln, Faktenkarte
runtime/motion.js   Easing, Federn, Keyframes, Kamera-Shot-Liste, Wackeln
runtime/look.js     Bildlook: Umgebungslicht, Ambient Occlusion, Tiefenunschärfe, Bloom
lint-story.mjs      Story-Prüfer (Hook, aber/deshalb, Höhepunkt, Ende, Quellen, Lesetempo)
scenes/reibung.js   Beispiel: „Was wäre, wenn die Reibung 5 Sekunden verschwindet?“
scenes/studio.js    Look-Vorlage: Studio mit Gitterboden, Bokeh-Lichtern, Figuren in Nahaufnahme
```

Rendering-Zeit für das 19-s-Beispiel in voller Qualität: rund 1,5 Stunden mit reinem
Software-Rendering in einer Cloud-VM ohne Grafikkarte (`--draft`: deutlich schneller).
Mit `--gpu` auf einem Rechner mit Grafikkarte sollte es viel schneller gehen.
