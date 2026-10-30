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

Claude folgt dann [`CLAUDE.md`](./CLAUDE.md):

1. **Prämisse prüfen**: Gibt es das Video schon? Ist die Physik sauber?
2. **Quellen**: Jede Zahl bekommt eine Quelle oder Formel.
3. **Szene schreiben**: `scenes/<name>.js`
4. **Eigene Frames prüfen**: Kontaktbogen ansehen, Fehler beheben.
5. **Rendern**: `out/<name>.mp4`

## Befehle

| Befehl | Was passiert |
| --- | --- |
| `node render.mjs scenes/reibung.js` | Finales Video nach `out/reibung.mp4` |
| `... --preview` | Halbe Auflösung, 15 fps, schnell zum Anschauen |
| `... --check [--from 3 --to 8 --count 8]` | Standbilder + `kontaktbogen.jpg` in `out/check/` |
| `... --gpu` | Grafikkarte statt Software-Rendering (viel schneller auf dem Mac) |
| `... --audio musik.mp3` | Tonspur dazumischen |
| `... --out pfad.mp4` | Ausgabedatei festlegen |

Live im Browser ansehen: `npx serve .` und
`http://localhost:3000/runtime/index.html?scene=/scenes/reibung.js&scale=0.5&live` öffnen.

## Aufbau

```
render.mjs          Renderer: Headless-Chromium -> JPEG-Frames -> ffmpeg (H.264)
runtime/engine.js   Lädt die Szene, feste Zeitschritte (deterministisch), Kamera, Licht
runtime/blocks.js   Bausteine: Häuser, Autos, Blockfiguren, Bäume, Werbetafeln
runtime/ui.js       TikTok-Overlays: Label, Titel, Untertitel, Zahlenkacheln, Faktenkarte
scenes/reibung.js   Beispiel: „Was wäre, wenn die Reibung 5 Sekunden verschwindet?“
```

Rendering-Zeit für das 18-s-Beispiel: ca. 8 Minuten mit reinem Software-Rendering
in einer Cloud-VM ohne Grafikkarte; mit `--gpu` auf einem normalen Laptop deutlich weniger.
