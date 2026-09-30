# Art- & Asset-Brief
Dieses Dokument kannst du einem 3D-Artist schicken, oder Claude Code nutzt es als Vorlage, wenn es dich Schritt für Schritt durch Blender führt.

## 1. Stil in einem Satz
**Knetfiguren-Look (Claymation) in einer sonnigen Tropenwelt:** weiche, einfache Formen, matte Oberflächen, kräftige Farben, warmes Licht, alles ein bisschen schief und handgemacht.

## 2. Figuren (Crew)
- **Körper:** eine einzige Kapsel oder Pille als Kopf und Rumpf, ohne Hals. Etwa 1,6 m hoch im Spiel.
- **Augen:** große, weiße, halbkugelförmige Glubschaugen, die leicht hervorstehen, mit kleinen schwarzen Pupillen
- **Augenbrauen:** dicke Wülste, die sich animieren lassen (für Gefühle wie Panik oder Stolz)
- **Nase:** groß, knubbelig. **Mund:** schmale Lippen, als Blend Shapes (offen/zu/„O“) für Brabbeln und Schreien
- **Arme:** dünn, zu kurz, Hände mit 4 Fingern. **Beine:** kurz, einfache Shorts oder Hosen
- **Hautfarben:** breite, realistische Palette. Einzelne Ohren-, Nasen- und Frisurformen sind wählbar. **Kein Merkmal darf stereotyp überzeichnet sein.** Alle Figuren werden gleich liebevoll und gleich albern gestaltet.
- **Frisuren und Hüte** sind separate Meshes an einem „head“-Bone (austauschbar)
- **Polygonbudget:** ca. 3.000–6.000 Dreiecke pro Figur
- **Rig:** humanoid, kompatibel mit Mixamo-Animationen
- **Animationen:** idle, gehen, rennen, springen, fallen, schwimmen, Steuerrad drehen, Seil ziehen, Eimer schöpfen, hämmern, angeln, winken, „Panik“ (Arme wedeln)

## 3. Boot (3 Stufen)
| Stufe | Beschreibung |
|---|---|
| 1 – Floß | zusammengebundene Stämme, ein Stoff-Segel, Steuerruder |
| 2 – Kutter | kleines Holzboot mit Steuerrad, 1 Segel, Eimer-Halterung, Anker |
| 3 – Segler | 2 Segel, kleine Kajüte, Frachtraum, Kanone für Notfälle |
- Mit sichtbaren Flicken, Kratzern und Schiefständen
- Leck-Stellen als eigene Objekte, die ein- und ausgeblendet werden können

## 4. Welt-Assets (Liste für den Prototyp)
- Palmen (3 Varianten), Bananenstauden, große Farnblätter, Blumen (lila/gelb)
- Felsen (5 Größen), Riffe, Sandbänke
- Wellblech- und Holzhütten, Stege, Kisten, Fässer, Netze
- Fische (5 Arten), Kokosnüsse, Holzbretter, Eimer, Hammer, Angel, Laterne, Kompass, Rettungsring
- NPC-Varianten (gleiche Basis wie die Crew, andere Kleidung)

**Gute kostenlose Startpunkte (CC0):** Quaternius (Natur-Packs, Tiere, Figuren), Kenney (Pirate Kit, Nature Kit, UI), Poly Pizza (Einzelmodelle).
Die Lizenz jedes Assets gehört in `docs/LIZENZEN.md`.

## 5. Farben
| Rolle | Farbe |
|---|---|
| Wasser flach | #3FD6E0 (türkis) |
| Wasser tief | #1A6FA3 |
| Sand | #F2DDA4 |
| Pflanzen | #5DBB3F / #2E8B3D |
| Holz | #A8743F |
| UI aktiv | #7FDCEA (türkis) |
| UI normal | #4A5E73 (schieferblau) |
| Akzent / Logo | #FFD21F (gelb) mit dunkler Kontur |

## 6. UI
- Buttons wie gemalte Pinselstriche mit ausgefransten Rändern
- Icons einfach und weiß, links im Button
- Schrift: rund und fett, gut lesbar (z. B. „Fredoka“ oder „Baloo 2“, beide unter der Open Font License)

## 7. Audio
- Musik: Ukulele, Steel Drum, Marimba. Ruhig beim Segeln, schneller im Sturm
- Stimmen: Brabbelsprache aus kurzen Silben, die je nach Figur höher oder tiefer gepitcht werden
- Effekte: Holzknarzen, Wellen, Platschen, Eimer, Hammer, Segelflattern, Donner, Möwen
- Quellen: selbst aufnehmen (Handy reicht für Platscher und Eimer!), freesound.org (Filter „CC0“)
