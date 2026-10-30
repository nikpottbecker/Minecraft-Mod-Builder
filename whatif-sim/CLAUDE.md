# Anleitung für Claude: „Was wäre wenn…“-Video aus einer Zeile

Der Nutzer schreibt eine Prämisse („Was wäre, wenn …“). Arbeite diese fünf Schritte
der Reihe nach ab und melde kurz nach jedem Schritt das Ergebnis.

## 1. Prämisse prüfen
- Suche (WebSearch) auf TikTok/YouTube/Instagram, ob es die Idee schon als
  virales Video gibt (Suchbegriffe auf Deutsch und Englisch, z. B. „what if friction disappeared“).
- Gibt es sie schon mit vielen Aufrufen: dem Nutzer melden und **einen neuen Dreh**
  vorschlagen (anderer Ort, andere Dauer, andere Größe).
- Prüfe, ob die Physik sauber erklärbar ist. Wenn die echte Antwort unklar oder
  umstritten ist, sag das und schlage eine Variante mit klarer Physik vor.

## 2. Quellen
- Jede Zahl, die im Video erscheint, braucht eine Quelle oder eine Formel.
- Recherchiere die Werte (WebSearch) und trage sie in `sources` der Szene ein.
- Zahlen im Video **aus der Simulation berechnen** (z. B. `S.redSlid`), nicht
  hart eintippen, damit Bild und Text nie auseinanderlaufen.

## 3. Szene als Code schreiben
- Neue Datei `scenes/<kurzname>.js`, Aufbau wie `scenes/reibung.js`:
  `title`, `duration`, `fps`, `seed`, `sources`, `setup`, `update`, `overlay`.
- Bausteine: `ctx.blocks` (`runtime/blocks.js`): `building`, `car`, `person`,
  `tree`, `billboard`, `box`, `ground`, `animatePerson`.
- Overlays: `ui` (`runtime/ui.js`): `pill`, `title`, `caption`, `stat`, `card`,
  `vignette`, `fade`, `fmt`. `*Wort*` wird gelb hervorgehoben.
- Ablauf, der funktioniert: 0–3 s Frage + normale Welt, dann das Ereignis mit
  laufendem Zähler, danach die Folgen, am Ende eine Faktenkarte mit Quelle und
  eine Schlusszeile. 15–25 s Gesamtlänge.
- Nur deterministisch: Zufall nur über `ctx.rng`, Zeit nur über `t`/`dt`.

## 4. Eigene Frames prüfen
```bash
node render.mjs scenes/<kurzname>.js --check                 # 12 Bilder über die ganze Länge
node render.mjs scenes/<kurzname>.js --check --from 3 --to 8 --count 8
```
Dann `out/check/<kurzname>/kontaktbogen.jpg` (und bei Bedarf einzelne PNGs) ansehen und
gezielt prüfen:
- Steckt die Kamera in einem Gebäude oder ist das Bild von Objekten verdeckt?
- Passiert die Pointe jeder Untertitelzeile **sichtbar im Bild**?
- Überdecken Texte/Kacheln die Action? Ist alles lesbar (auch „μ“, Umlaute)?
- Stimmen die Zahlen mit dem Text überein?
Fehler beheben und erneut prüfen, bis nichts mehr auffällt.

## 5. Rendern
```bash
node render.mjs scenes/<kurzname>.js --preview    # schnell, halbe Auflösung
node render.mjs scenes/<kurzname>.js              # final: out/<kurzname>.mp4, 1080x1920
node render.mjs scenes/<kurzname>.js --gpu        # auf dem Mac/PC mit Grafikkarte deutlich schneller
node render.mjs scenes/<kurzname>.js --audio musik.mp3
```
Am Ende: Pfad zum Video, Länge und die verwendeten Quellen nennen.
