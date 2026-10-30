# Anleitung für Claude: „Was wäre wenn…“-Video aus einer Zeile

Der Nutzer schreibt eine Prämisse („Was wäre, wenn …“). Arbeite die Schritte der Reihe
nach ab und melde nach jedem Schritt kurz das Ergebnis.

**Vorher lesen:** [`STORY.md`](./STORY.md) (Psychologie, Struktur, Rhetorik) und
[`ANIMATION.md`](./ANIMATION.md) (Animationsprinzipien, Kamera, Bildaufbau).

## 1. Prämisse prüfen
- Suche (WebSearch) auf TikTok, YouTube und Instagram, ob es die Idee schon als virales
  Video gibt. Suchbegriffe auf Deutsch und Englisch, z. B. „what if friction disappeared“.
- Gibt es sie schon mit vielen Aufrufen, melde das dem Nutzer und schlage **einen neuen
  Dreh** vor (anderer Ort, andere Dauer, andere Größe).
- Prüfe, ob sich die Physik sauber erklären lässt. Ist die echte Antwort unklar oder
  umstritten, sag das und schlage eine Variante mit klarer Physik vor.

## 2. Quellen
- Jede Zahl, die im Video erscheint, braucht eine Quelle oder Formel. Recherchiere sie
  und trage sie in `sources` ein.
- Zahlen im Text als `{platzhalter}` schreiben und zur Laufzeit aus der Simulation
  füllen, damit Bild und Text nie auseinanderlaufen.

## 3. Story schreiben (vor jeder Zeile Animationscode)
- Fülle `story.beats` nach dem Bauplan in `STORY.md`: hook → setup → **aber** → Eskalation
  mit `peak` → Folgen → Twist → Payoff → Loop.
- Jeder Beat hat `link` (aber/deshalb/doch/also/denn) — **nie „und dann“**.
- Formuliere mehrere Hook-Varianten, nimm die mit der kleinsten, konkretesten
  Neugierlücke.
- `node lint-story.mjs scenes/<name>.js` muss ohne ✗ durchlaufen, Ziel ≥ 90/100.

## 4. Szene als Code
- Neue Datei `scenes/<kurzname>.js`, Aufbau wie `scenes/reibung.js`:
  `title`, `duration`, `fps`, `seed`, `sources`, `story`, `setup`, `update`, `overlay`.
- **Shot-Liste** mit `ctx.motion.shots()`: pro Beat eine Einstellung, die genau das
  zeigt, was der Untertitel sagt. Wendepunkt nah, Folgen in der Totale, Loop wie der
  Anfang.
- Bausteine: `ctx.blocks` (`building`, `car`, `person`, `tree`, `billboard`, `box`,
  `ground`, `animatePerson`). Bewegung: `ctx.motion` (`ease`, `tween`, `spring`,
  `keyframes`, `shake`, `shots`).
- Overlays: `ui.beats(g, t, story.beats)` für Untertitel, die Wort für Wort
  aufploppen, dazu `ui.title`, `ui.pill`, `ui.stat`, `ui.card`, `ui.flash`, `ui.vignette`.
- Nur deterministisch: Zufall nur über `ctx.rng`, Zeit nur über `t` und `dt`.
- Physik ehrlich halten, aber groß zeigen (Nahaufnahme, Blitz, Wackeln am Peak).

## 5. Eigene Frames prüfen
```bash
node render.mjs scenes/<kurzname>.js --check --count 16              # ganze Länge
node render.mjs scenes/<kurzname>.js --check --from 3 --to 8 --count 8
```
Sieh dir `out/check/<kurzname>/kontaktbogen.jpg` an und prüfe jeden Beat:
- Ist die Aktion, von der der Untertitel spricht, **sichtbar** in der Einstellung?
- Steckt die Kamera in einem Objekt, oder verdeckt etwas im Vordergrund das Motiv
  (Auto, Mast, Baum, Person)?
- Überlappen Texte, Kacheln oder Karte einander oder die Aktion?
- Ist alles lesbar (auch „μ“ und Umlaute)? Stimmen die Zahlen?
Fehler beheben und neu prüfen, bis nichts mehr auffällt. Erst dann rendern.

## 6. Rendern
```bash
node render.mjs scenes/<kurzname>.js --preview    # schnell, halbe Auflösung
node render.mjs scenes/<kurzname>.js              # final: out/<kurzname>.mp4, 1080x1920
node render.mjs scenes/<kurzname>.js --gpu        # mit Grafikkarte (Mac/PC) schneller
node render.mjs scenes/<kurzname>.js --audio musik.mp3
```
Melde am Ende den Pfad zum Video, die Länge, den Story-Score und die Quellen.

## 7. Ton
- Während der Szene `ctx.sound(name, { gain, pan, dur, pitch })` an den Ereignissen aufrufen
  (Aufprall, Schnitt, Umschalten). Physik auch im Ton ehrlich halten (z. B. kein
  Reifenquietschen ohne Reibung). Weniger ist mehr: höchstens ein lauter Effekt pro Moment.
- `music.sections` an die Story-Rollen koppeln: hook/setup → `pulse`, turn → `suspense`,
  escalation/peak → `drive`, payoff → `resolve`, loop → `build`.
- `node audio.mjs scenes/<name>.js` (Stimme edge-tts) → `out/<name>-ton.mp4`.
  Warnungen „Text zu lang für den Slot“ ernst nehmen: Sprechertext kürzen.

Siehe auch [`KANAL.md`](./KANAL.md) für Serien, Titel und Captions (nächster Ausbau).

## Erzählvideos und Serien (englisch, 60–120 s)
Vorlage: `scenes/blackout.js`. Die Sprache der Videos ist ab jetzt Englisch.
1. Text in `scenes/<name>.script.js` schreiben (`*wort*` = gelb, `say` = gesprochene Fassung).
2. `node timing.mjs scenes/<name>.script.js` misst die Stimme und schreibt `<name>.timing.js`.
3. Die Szene baut daraus mit `layout()` (`runtime/narration.js`) Beats, Untertitel und Länge.
   **Stimme geht vor:** `fxDuck` (Effekte weichen der Stimme) immer setzen, laute Effekte in Sprechpausen legen,
   nie auf ein Wort. Prüfen pro 100 ms in der Sprechzeit, nicht im Durchschnitt: Median ≥ 15 dB Abstand, höchstens 5 % unter 6 dB.
4. Rendern wie gewohnt, dann `node audio.mjs`, dann `node caption.mjs scenes/<name>.js`
   (Caption + Cover). Bausteine: `ui.cover`, `ui.clock`, `ui.rule`, `ui.nameTag`, `ui.section`, `ui.words`.
