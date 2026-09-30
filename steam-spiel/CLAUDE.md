# CLAUDE.md: Driftwood Crew

Du bist der Programmierer dieses Spiels. Der Besitzer des Projekts hat **keine Programmiererfahrung**. Erkläre deshalb auf Deutsch und in einfachen Worten, was du tust und was er in Godot anklicken oder testen soll.

## Projekt
- Koop-Segelabenteuer für 1–4 Spieler für Steam. Design: `docs/01_GAME_DESIGN.md`, Bauplan: `docs/02_ROADMAP.md`
- Engine: **Godot 4 (neueste stabile 4.x), GDScript**. Kein C#.
- Zielplattform: Windows (Steam), Linux/Steam Deck soll mitlaufen.

## Arbeitsweise
- Arbeite **nur am aktuellen Meilenstein** aus der Roadmap. Kein Vorgreifen und keine ungefragten Extra-Features.
- Arbeite in kleinen Schritten. Sag nach jedem Schritt **genau, wie man es testet** (welche Szene, welche Taste, was man sehen sollte).
- Lege Szenen (`.tscn`) und Ressourcen (`.tres`) als Text an. Wenn etwas im Godot-Editor per Hand gemacht werden muss, beschreibe es Klick für Klick.
- Prüfe nach Änderungen, ob das Projekt fehlerfrei lädt: `godot --headless --path . --quit` (bzw. mit dem Pfad zur Godot-exe). Fehler in der Ausgabe beheben, bevor du sagst, dass etwas fertig ist.
- Nach einem funktionierenden Schritt: einen Commit mit klarer deutscher Nachricht vorschlagen. Pushen nur, wenn der Nutzer es möchte.
- Hake erledigte Punkte in `docs/02_ROADMAP.md` ab.

## Code-Regeln
- GDScript mit **statischen Typen** (`var speed: float = 5.0`, `func foo() -> void:`).
- Dateien und Ordner in `snake_case`, Klassen (`class_name`) in `PascalCase`.
- Kommentare und Variablennamen auf Englisch, Texte für den Spieler über das Übersetzungssystem (`tr("KEY")`, CSV in `localization/`).
- Eine Szene = eine Aufgabe. Kleine Skripte statt riesiger „Manager“.
- Signale statt fester Pfade (`get_node("../../..")` vermeiden).
- Globale Dienste als Autoloads in `autoload/`: `GameState`, `NetworkManager`, `SaveManager`, `AudioManager`, `SteamManager`.

## Ordnerstruktur
```
assets/        models/, textures/, audio/, fonts/, shaders/
autoload/      globale Singletons
scenes/        main_menu/, player/, boat/, world/, islands/, ui/, npc/
scripts/       Hilfsklassen ohne eigene Szene
localization/  translations.csv (de, en)
docs/          Design & Roadmap
```

## Multiplayer-Architektur (wichtig, von Anfang an einhalten!)
- **Der Host ist die Autorität.** Nur der Host simuliert die Bootsphysik, NPCs, Aufträge und die Welt. Clients schicken nur Eingaben und Interaktions-Wünsche (RPC an den Host).
- Jeder Spieler bewegt seine eigene Figur (Autorität der Figur = ihr Besitzer). Die Position wird **relativ zum Boot** synchronisiert, wenn die Figur auf dem Boot steht, sonst ruckelt es.
- Nutze `MultiplayerSpawner` und `MultiplayerSynchronizer` von Godot. Interpoliere auf den Clients.
- Die Netzwerkschicht ist austauschbar: `NetworkManager` erzeugt entweder einen **ENetMultiplayerPeer** (lokales Testen, zwei Fenster) oder einen **SteamMultiplayerPeer** (GodotSteam). Der restliche Code weiß nicht, welcher Peer aktiv ist.
- Alles muss auch **solo** funktionieren (der Host ist dann allein).

## Wasser & Boot
- Wellen über **Gerstner-Wellen**, mit derselben Formel im Shader (für die Optik) und in GDScript (`WaveSystem.get_height(pos, time)`, für die Physik). Die Zeit wird vom Host synchronisiert.
- Das Boot ist ein `RigidBody3D` mit mehreren **Auftriebspunkten**, die ins Wasser gezogen werden.

## Steam
- Plugin: **GodotSteam** (GDExtension-Version aus der Godot Asset Library).
- Solange es keine eigene App-ID gibt: **App-ID 480** zum Testen. Die App-ID steht an genau einer Stelle (`SteamManager`).
- Das Spiel muss **ohne Steam starten** können (Fallback auf ENet, Steam-Features dann aus). Wichtig für schnelles Testen.

## Art
- Solange es keine fertigen Modelle gibt: **Platzhalter** (Kapseln für Figuren, Boxen für das Boot). Platzhalter müssen später austauschbar sein, deshalb Modelle immer als eigene Unterszene einbinden.
- Stil: Knetfiguren (matte Materialien, warmes Licht, gesättigte Tropenfarben). Details siehe Game Design Abschnitt 6.
