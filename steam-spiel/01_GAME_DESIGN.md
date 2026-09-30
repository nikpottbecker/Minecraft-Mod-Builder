# Game Design Document: Driftwood Crew (Arbeitstitel)

## 1. Pitch in einem Satz
Ein Koop-Abenteuer für 1–4 Spieler: Als Crew aus knuffigen Knetfiguren segelt ihr mit einem kleinen, wackeligen Boot durch ein tropisches Inselreich, helft den Inselbewohnern, erlebt ihre Geschichten und baut euer Boot Stück für Stück aus.

**Slogan-Idee:** „Tiny boat. Huge trouble.“ (bewusst ein eigener Slogan und nicht der aus dem Referenzbild)

## 2. Zielgruppe & Vorbilder
- Freundesgruppen, die zusammen chaotischen Koop-Spaß wollen (Discord-Abende)
- Spiele, an denen wir uns orientieren: *Sea of Thieves* (gemeinsam ein Boot bedienen), *PEAK* / *Lethal Company* (lustiges Proximity-Chaos), *Overcooked* (Aufgaben unter Zeitdruck verteilen), *A Short Hike* (entspannte Erkundung und Charme)
- Plattform: **Windows (Steam)**. Linux/Steam Deck ist mit Godot fast gratis dabei.
- Preis-Idee: 9,99–14,99 €

## 3. Kern-Spielschleife
```
Auftrag auf einer Insel annehmen
  → Boot beladen & lossegeln (gemeinsam bedienen!)
  → Ereignisse auf See (Sturm, Leck, Seeschlange, Treibgut)
  → neue Insel erkunden, Ressourcen sammeln, Rätsel lösen
  → Auftrag abschließen → Belohnung
  → Boot ausbauen / Figuren anpassen → nächste, weiter entfernte Insel
```

## 4. Die zentrale Mechanik: das Boot
Das Boot ist der Star. Jeder Spieler kann jede Station bedienen:

| Station | Was man macht |
|---|---|
| **Steuerrad** | Lenken. Die Sicht ist eingeschränkt, deshalb muss jemand anderes ansagen, wo es hingeht |
| **Segel** | Hochziehen oder einholen, nach dem Wind ausrichten. Bei Sturm muss es runter, sonst kentert ihr |
| **Eimer** | Wasser rausschöpfen, wenn das Boot leckt |
| **Hammer + Planken** | Lecks flicken |
| **Angel** | Fisch = Essen und Handelsware |
| **Laterne / Kompass / Karte** | Navigation, besonders nachts und im Nebel |
| **Anker** | Anhalten, bevor ihr auf den Strand knallt |

- **Physik:** Das Boot schaukelt auf echten Wellen. Figuren können ausrutschen und über Bord fallen (das ist gewollt, lustig und ein Teil des Chaos). Wer im Wasser landet, schwimmt zurück oder wird mit dem Rettungsring rausgefischt.
- **Ausbau:** Größerer Rumpf, zweites Segel, Kanone gegen Seeungeheuer, Kajüte zum Speichern, Frachtraum.
- Solo spielbar: Das Boot ist dann etwas „gutmütiger“ (weniger Lecks, automatischer Anker).

## 5. Welt & „Big Stories“
- **Inselreich mit 5 Regionen**, jede mit eigener Stimmung und einem Story-Bogen:
  1. **Startbucht:** Tutorial. Die Crew strandet und baut das erste Floß-Boot.
  2. **Palmenriff:** Fischerdorf, erste Aufträge, Riffe als Hindernisse
  3. **Nebelinseln:** Navigation mit Kompass, Geister-Leuchtturm
  4. **Vulkanatoll:** Hitze, Lavabrocken, Schmiede für Boots-Upgrades
  5. **Sturmsee:** Finale gegen den „Großen Strudel“
- Pro Region 4–6 Inseln und 1 Hauptgeschichte mit 3–5 Missionen, dazu Nebenaufträge.
- **Inselbewohner** mit einfachen Dialogen (Sprechblasen und Brabbel-Sounds wie in *Animal Crossing*, also ohne Sprachaufnahmen).
- Die Welt ist **handgebaut**, nicht zufallsgeneriert. Das ist für Anfänger viel einfacher zu kontrollieren.

## 6. Figuren & Artstyle
Orientiert am Referenzbild:
- **Kapsel- oder Pillenkörper** ohne Hals, große **runde weiße Augen** mit kleinen Pupillen, dicke Augenbrauen, große Nase, schmale Lippen
- **Kurze dünne Arme**, einfache Hosen oder Shorts
- **Knet-Optik (Claymation):** matte Oberflächen, leicht „weiche“ Formen, warmes Licht
- **Charakter-Editor:** Hautfarbe (breite Palette), Frisur, Augenbrauen, Nase, Kleidung, Hüte
- **Welt:** Tropen in kräftigen Farben, stilisiertes Wasser (türkis, Schaumkronen), große Palmblätter, Holz- und Wellblechhütten
- **UI:** Buttons im „Pinselstrich“-Look (wie im Referenz-Menü), türkis für aktiv und schieferblau für inaktiv, dazu eine Schrift, die gut lesbar und ein bisschen verspielt ist

## 7. Multiplayer
- **1–4 Spieler**, Koop
- **Host / Join** über **Steam-Lobbys** (Freunde einladen, Beitritt über die Steam-Freundesliste)
- Der Host ist die Autorität: Er berechnet die Bootsphysik, und die Clients bekommen den Zustand geschickt.
- **Proximity Voice Chat** (optional, späterer Meilenstein): Wer weit weg ist, klingt leise.
- Ping-System (Markierung setzen) für Spieler ohne Voice Chat

## 8. Hauptmenü
Wie im Referenzbild: Hintergrund ist eine lebendige 3D-Inselszene mit Kamerafahrt.
- **Spiel hosten** (Spielstand wählen/neu, Lobby-Einstellungen: öffentlich/nur Freunde/privat)
- **Spiel beitreten** (Freundesliste / Lobby-Browser)
- **Figur anpassen**
- **Optionen** (Grafik, Audio, Steuerung, Sprache DE/EN)
- **Beenden**
- Unten links die Version, unten mittig der Slogan

## 9. Steuerung
- Maus + Tastatur und **Controller** (wichtig für Steam Deck)
- WASD laufen, Leertaste springen, E interagieren/Station benutzen, Linksklick Werkzeug benutzen, Tab Karte, Q/Mausrad Inventar

## 10. Speichern & Fortschritt
- Spielstände gehören dem Host (3 Slots), Autosave beim Anlegen an einer Insel
- Figuren-Aussehen wird pro Spieler lokal gespeichert
- **Steam-Errungenschaften** (z. B. „Über Bord!“ = zum ersten Mal ins Wasser gefallen, „Kapitän“ = Spiel durchgespielt)
- Steam Cloud für Spielstände

## 11. Umfang der Vollversion (Ziel)
- 5 Regionen, ca. 25 Inseln
- 5 Hauptgeschichten, ca. 20 Nebenaufträge
- 3 Boot-Stufen mit ca. 15 Upgrades
- ca. 40 Anpassungs-Items für Figuren
- Spielzeit: 8–12 Stunden
- Sprachen: Deutsch & Englisch
