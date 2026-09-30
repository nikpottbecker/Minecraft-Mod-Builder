# Roadmap: Driftwood Crew

So benutzt du diese Datei: Kopiere den **Prompt** eines Meilensteins in Claude Code. Erst wenn alle Punkte unter „Fertig, wenn“ klappen, geht es mit dem nächsten Meilenstein weiter. Große Meilensteine darfst du auf mehrere Sitzungen verteilen („mach jetzt nur Punkt 1–3“).

Grobe Zeitplanung (bei ca. 10 Stunden pro Woche):

| Phase | Meilensteine | Dauer |
|---|---|---|
| A: Fundament | 0–4 | ~2 Monate |
| B: Spielbarer Prototyp (1 Region) | 5–8 | ~3 Monate |
| C: Steam & Vertical Slice / Demo | 9–11 | ~2 Monate |
| D: Inhalte für die Vollversion | 12–15 | ~5–7 Monate |
| E: Politur & Release | 16–18 | ~2 Monate |

---

## Phase A: Fundament

### M0: Projekt anlegen
**Prompt:**
> Lies CLAUDE.md und docs/. Wir starten Meilenstein 0: Leg ein neues Godot-4-Projekt in diesem Ordner an (project.godot, Ordnerstruktur aus CLAUDE.md, .gitignore für Godot, Autoload-Skripte als leere Grundgerüste). Richte Git ein und verbinde es mit meinem GitHub-Repo (frag mich nach der URL). Erklär mir danach, wie ich das Projekt in Godot öffne.

**Fertig, wenn:** Das Projekt öffnet sich in Godot ohne Fehler, und der erste Commit ist auf GitHub.
- [ ] erledigt

### M1: Spielfigur laufen lassen
**Prompt:**
> Meilenstein 1: Eine Test-Insel (flacher Boden, ein paar Platzhalter-Palmen aus Zylindern) und eine Spielfigur als Platzhalter-Kapsel mit Augen aus zwei weißen Kugeln. Third-Person-Kamera mit Maus, WASD laufen, Leertaste springen, Controller-Unterstützung über die InputMap. Die Bewegung soll sich weich und etwas „wackelig-lustig“ anfühlen.

**Fertig, wenn:** Du mit der Figur herumlaufen und springen kannst, mit Tastatur und Controller.
- [ ] erledigt

### M2: Wasser & Wellen
**Prompt:**
> Meilenstein 2: Stilisiertes Tropenwasser mit Gerstner-Wellen-Shader (türkis, Schaumkronen, bis zum Horizont). Dazu ein WaveSystem-Autoload, das die gleiche Wellenhöhe in GDScript berechnet. Fällt die Spielfigur ins Wasser, kann sie schwimmen. Füge einen Debug-Regler für die Wellenstärke hinzu.

**Fertig, wenn:** Das Wasser gut aussieht und die Figur darin schwimmt.
- [ ] erledigt

### M3: Das Boot
**Prompt:**
> Meilenstein 3: Ein Platzhalter-Boot (RigidBody3D) mit Auftriebspunkten, das auf den Wellen schaukelt. Stationen: Steuerrad (E drücken → Figur lenkt), Segel (hoch/runter, Wind aus einer Richtung), Anker. Die Figur muss auf dem fahrenden Boot stehen und laufen können, ohne herunterzurutschen (außer bei starkem Wellengang, dann soll sie leicht rutschen).

**Fertig, wenn:** Du zur Insel segeln, ankern und an Land gehen kannst.
- [ ] erledigt

### M4: Multiplayer (lokal)
**Prompt:**
> Meilenstein 4: Multiplayer nach der Architektur in CLAUDE.md, erstmal mit ENet. Ein einfaches Test-Menü mit „Host“ und „Join (127.0.0.1)“. Bis zu 4 Spieler, jede Figur in einer anderen Farbe. Das Boot simuliert der Host, und die Figuren auf dem Boot werden relativ zum Boot synchronisiert. Erklär mir, wie ich mit „Debug → Instanzen ausführen“ zwei Fenster teste.

**Fertig, wenn:** Zwei Fenster zusammen segeln können: einer lenkt, der andere bedient das Segel, und nichts ruckelt stark.
- [ ] erledigt

---

## Phase B: Spielbarer Prototyp

### M5: Hauptmenü & Optionen
**Prompt:**
> Meilenstein 5: Das Hauptmenü laut Game Design Abschnitt 8: 3D-Inselszene im Hintergrund mit langsamer Kamerafahrt, Buttons im Pinselstrich-Stil (türkis = ausgewählt, schieferblau = normal), Icons, Version unten links, Slogan unten mittig. Optionen: Lautstärke, Auflösung/Vollbild, Mausempfindlichkeit, Sprache DE/EN, Tastenbelegung. Die Einstellungen werden gespeichert. Das Menü muss mit Maus und Controller bedienbar sein.

**Fertig, wenn:** Das Menü so ähnlich aussieht wie das Referenzbild und alle Buttons funktionieren.
- [ ] erledigt

### M6: Echte Figuren & Charakter-Editor
**Vorher (du):** Figuren-Modell besorgen. Entweder in Blender eine einfache Kapselfigur modellieren (Claude Code kann dir Schritt für Schritt erklären, wie) oder ein CC0-Modell von Quaternius nehmen. Tipp: Bei **mixamo.com** kannst du kostenlos Lauf- und Spring-Animationen auf die Figur legen lassen.
**Prompt:**
> Meilenstein 6: Ich habe ein Figuren-Modell unter assets/models/character/ abgelegt. Ersetze den Platzhalter, bau einen AnimationTree (idle, laufen, springen, schwimmen, Station bedienen) und einen Charakter-Editor (Hautfarbe, Frisur, Augenbrauen, Kleidungsfarbe, Hut). Das Aussehen wird lokal gespeichert und an alle Mitspieler übertragen. Knet-Look: mattes Material, eventuell mit leichtem Noise für Fingerabdruck-Struktur.

- [ ] erledigt

### M7: Bord-Chaos
**Prompt:**
> Meilenstein 7: Lecks (tauchen bei Stößen an Felsen auf, Wasser steigt im Boot), Eimer zum Schöpfen, Hammer + Planken zum Flicken, Rettungsring. Man kann über Bord fallen. Dazu Wetter: Wind ändert sich, Sturm mit hohen Wellen, Regen, Blitzen. Tag-Nacht-Zyklus mit Laterne.

- [ ] erledigt

### M8: Erste Region „Startbucht“ + Aufträge
**Prompt:**
> Meilenstein 8: Ein Auftrags-System (Quest-Daten als Resource-Dateien, damit ich später selbst Aufträge anlegen kann), NPCs mit Sprechblasen-Dialog und Brabbel-Sound, einfaches Inventar und Ressourcen (Holz, Fisch, Kokosnüsse), Angeln. Dazu die Tutorial-Region „Startbucht“ mit 3 Inseln und der Story „Gestrandet“ aus dem Game Design. Speichern und Laden (3 Slots, Autosave).

**Fertig, wenn:** Ein Freund und du das Tutorial von Anfang bis Ende zusammen durchspielen könnt. **Das ist dein erster echter Prototyp!**
- [ ] erledigt

---

## Phase C: Steam & Demo

### M9: Steam-Anbindung
**Prompt:**
> Meilenstein 9: Binde GodotSteam (GDExtension) ein, mit App-ID 480 zum Testen. SteamManager: Initialisierung, Spielername und Avatar aus Steam. SteamMultiplayerPeer im NetworkManager: Lobby erstellen (öffentlich/Freunde/privat), über die Steam-Freundesliste beitreten, Lobby-Browser. Ohne laufendes Steam muss das Spiel weiter mit ENet funktionieren. Erklär mir, wie ich mit einem Freund über Steam teste.

- [ ] erledigt

### M10: Steam-Account & Store-Seite (du, nicht Claude Code)
- [ ] Steamworks-Account einrichten, 100 $ zahlen, App-ID bekommen (siehe 00_START_HIER.md)
- [ ] Capsule-Bilder erstellen (Steam gibt die Formate vor)
- [ ] Mindestens 5 Screenshots und einen kurzen Trailer (30–60 Sek.)
- [ ] Store-Seite auf „Coming Soon“ stellen → **Wunschlisten sammeln**
- [ ] TikTok/Shorts vom Entwicklungsfortschritt posten (wie deine Referenzvideos!)
**Prompt danach:**
> Meilenstein 10: Ich habe meine eigene App-ID: XXXXXX. Trag sie ein und erstelle ein Export-Preset für Windows (und Linux). Erklär mir, wie ich den Build mit SteamPipe (steamcmd) hochlade, und leg mir dafür ein Skript an.

### M11: Demo
**Prompt:**
> Meilenstein 11: Erstelle eine Demo-Version über ein Export-Feature-Flag „demo“: nur Startbucht + erste Insel vom Palmenriff, danach ein „Danke fürs Spielen – jetzt auf die Wunschliste!“-Bildschirm mit Link zur Store-Seite.

- [ ] erledigt → Demo auf Steam veröffentlichen, beim **Steam Next Fest** anmelden

---

## Phase D: Inhalte

### M12: Boot-Ausbau & Werkstatt
> Meilenstein 12: Boot-Upgrade-System: 3 Rumpf-Stufen, zweites Segel, Frachtraum, Kajüte (Speicherpunkt), Kanone. Upgrades kosten Ressourcen und werden als Resource-Dateien definiert. Werkstatt-Menü an Werften.
- [ ] erledigt

### M13–M15: Regionen 2–5
Für jede Region einzeln:
> Meilenstein 13: Region „Palmenriff“ laut Game Design: Inseln, Hauptgeschichte (3–5 Missionen), 4 Nebenaufträge, regionsspezifische Mechanik (Riffe als Hindernisse). Bau mir dabei Werkzeuge/Vorlagen, damit ich Inseln und Aufträge selbst im Editor zusammenstellen kann.
- [ ] Palmenriff  - [ ] Nebelinseln  - [ ] Vulkanatoll  - [ ] Sturmsee + Finale

---

## Phase E: Politur & Release

### M16: Audio & Juice
> Meilenstein 16: AudioManager mit Musik pro Region (Überblendung), Wellen-, Wind- und Knarz-Sounds, UI-Sounds, Brabbel-Stimmen. Screen-Shake, Partikel (Spritzwasser, Staub), Squash-and-Stretch bei den Figuren. Optional Proximity-Voice-Chat über Steam.
- [ ] erledigt (Sounds: z. B. freesound.org mit CC0-Filter, Musik: selbst oder lizenzfrei, **Lizenzen notieren!**)

### M17: Steam-Features
> Meilenstein 17: Steam-Errungenschaften (Liste aus Game Design + 20 weitere Vorschläge), Steam Cloud für Spielstände, Rich Presence („Segelt durchs Vulkanatoll“), Steam-Deck-Check (Controller-UI, Schriftgröße, 800p).
- [ ] erledigt

### M18: Testen & Release
- [ ] Playtest mit Freunden und Fremden (Steam Playtest-Funktion)
- [ ] Performance: stabile 60 FPS auf einem Mittelklasse-PC
- [ ] Bugliste abarbeiten: „Hier ist meine Bugliste: … Behebe sie der Reihe nach.“
- [ ] Release-Build hochladen, von Valve prüfen lassen, Release-Datum festlegen
- [ ] **Launch!**
