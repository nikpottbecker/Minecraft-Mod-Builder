# Start hier: dein Steam-Spiel von 0 auf

Arbeitstitel: **Driftwood Crew** (kann jederzeit geändert werden; vor dem Release auf Steam und per Google prüfen, ob der Name frei ist)

In diesem Ordner liegen diese Dateien:

| Datei | Wofür |
|---|---|
| `00_START_HIER.md` | Diese Anleitung. Was **du** selbst machen musst (Installation, Accounts, Steam) |
| `01_GAME_DESIGN.md` | Das Spielkonzept: was das Spiel ist, wie es sich spielt, wie es aussieht |
| `02_ROADMAP.md` | Der Bauplan in Meilensteinen, mit **fertigen Prompts** zum Kopieren in Claude Code |
| `03_MARKTANALYSE.md` | Markt, Konkurrenz, Chancen & Risiken, strategische Empfehlung |
| `04_MARKETING_PLAN.md` | Zeitplan, Wunschlisten-Ziele, 25 TikTok-Ideen, Streamer & Festivals |
| `05_STEAM_STORE_UND_BRANDING.md` | Namensvorschläge, Tags, Store-Texte (DE/EN), Capsule-Grafiken, Trailer-Skript, Preis |
| `06_BUSINESS_UND_BUDGET.md` | Kosten, Umsatz-Szenarien, Formales in Deutschland |
| `07_ART_UND_ASSET_BRIEF.md` | Stilvorgaben für Figuren, Boot, Welt, UI, Audio |
| `CLAUDE.md` | Kommt in deinen Projektordner auf dem PC. Claude Code liest diese Datei automatisch und kennt dann die Regeln des Projekts |

---

## Ehrlich vorweg: was dich erwartet

- **Claude Code schreibt den Code.** Szenen, Skripte, Shader, Multiplayer-Logik und Menüs sind alles Textdateien in Godot, die Claude Code direkt anlegen kann.
- **3D-Modelle, Musik und Sounds kann Claude Code nicht zeichnen oder komponieren.** Dafür gibt es drei Wege:
  1. Kostenlose Asset-Pakete (CC0, dürfen auch kommerziell verwendet werden): **Kenney.nl**, **Quaternius.com**, **Poly.pizza**. Damit fangen wir an.
  2. Selbst in **Blender** modellieren (kostenlos). Der Knetfiguren-Stil ist einfach: Kapsel-Körper, Kugelaugen, kurze Arme.
  3. Später einen 3D-Artist beauftragen, z. B. über Fiverr oder ArtStation.
  Claude Code baut das Spiel mit **Platzhaltern** (Kapseln, Kästen). Die tauschst du später gegen echte Modelle.
- **Vollversion als Anfänger:** Realistisch sind das **12 bis 18 Monate**, wenn du regelmäßig dranbleibst. Die Roadmap ist so gebaut, dass du nach jedem Meilenstein etwas **Spielbares** hast. Du verlierst also nie den Überblick.
- **Kosten:** Steam verlangt **100 US-$ pro Spiel** (Steam Direct Fee). Das Geld bekommst du zurück, sobald das Spiel 1.000 $ Umsatz gemacht hat. Alles andere in dieser Anleitung ist kostenlos. Für Claude Code brauchst du dein Claude-Abo.

---

## Schritt 1: Programme installieren (einmalig, ca. 30 Minuten)

1. **Godot 4** (die neueste stabile 4.x-Version, **Standard-Version**, NICHT die .NET/C#-Version)
   → https://godotengine.org/download
   Godot muss nicht installiert werden: Zip entpacken und die `.exe` z. B. nach `C:\Godot\` legen.
2. **Git** → https://git-scm.com/downloads (bei der Installation überall die Standard-Einstellungen lassen)
3. **Claude Code** auf dem PC: siehe https://code.claude.com/docs. Danach im Terminal `claude` eingeben und einloggen.
4. **Blender** (optional, erst ab Meilenstein 6 wichtig) → https://www.blender.org
5. **GitHub-Account** (hast du schon): Lege ein **neues, privates** Repository an, Name z. B. `driftwood-crew`. Damit ist dein Code gesichert, wenn der PC kaputtgeht.

## Schritt 2: Projektordner anlegen

1. Ordner erstellen, z. B. `C:\Games\driftwood-crew`
2. Die Datei **`CLAUDE.md`** aus diesem Paket **in diesen Ordner kopieren**.
3. Alle anderen `.md`-Dateien in einen Unterordner `docs\` kopieren.
4. Im Ordner ein Terminal öffnen (Rechtsklick → „Im Terminal öffnen“) und `claude` starten.
5. Den **Prompt für Meilenstein 0** aus `02_ROADMAP.md` einfügen. Ab da führt Claude Code dich.

## Schritt 3: So arbeitest du mit Claude Code

- **Pro Sitzung nur einen Meilenstein** (oder einen Teil davon). Kleine Schritte funktionieren viel besser als „bau alles“.
- **Nach jedem Schritt in Godot testen** (F5 drückt „Play“). Wenn etwas nicht klappt, beschreib Claude Code genau, was du siehst, oder schick einen Screenshot. Fehlermeldungen aus dem Godot-Fenster „Ausgabe/Debugger“ einfach reinkopieren.
- **Wenn es funktioniert:** Claude Code sagen „committe und pushe das“. Dann ist der Stand gesichert.
- **Wenn Claude Code sich verrennt:** `/clear` eingeben und neu anfangen. Der Stand ist ja in Git gesichert.
- **Multiplayer testen:** In Godot unter *Debug → Instanzen ausführen* „2“ einstellen. Dann starten zwei Spielfenster, eins hostet und eins joint.

## Schritt 4: Steam (erst ab Meilenstein 9, aber gut zu wissen)

1. Auf https://partner.steamgames.com registrieren: Steamworks-Account, Steuerformular (als Privatperson in Deutschland ausfüllbar, der Assistent führt dich durch) und Bankdaten.
2. 100 $ App-Gebühr zahlen → du bekommst eine **App-ID**.
3. **Bis dahin testen wir mit App-ID 480** („Spacewar“). Das ist Valves offizielle Test-ID, mit der jeder Steam-Lobbys und Multiplayer ausprobieren kann.
4. Die **Store-Seite** („Coming Soon“) so früh wie möglich live stellen. Wunschlisten sind das Wichtigste für einen erfolgreichen Launch.
5. Wichtige Fristen bei Steam:
   - Zwischen App-Gebühr und Release müssen mindestens **30 Tage** liegen.
   - Die Coming-Soon-Seite muss mindestens **2 Wochen** vor dem Release sichtbar sein.
   - Store-Seite und Build werden von Valve geprüft, das dauert ein paar Tage.
   Die aktuellen Regeln stehen in der Steamworks-Dokumentation. Kurz vor dem Release nochmal nachlesen.
6. Teilnahme am **Steam Next Fest** (Demo-Festival) einplanen. Das bringt viele Wunschlisten.

---

## Wenn du nicht weiterkommst

Komm einfach in diese Cloud-Session zurück. Ich kann Design-Fragen klären, Pläne anpassen, neue Prompts schreiben oder Steam-Texte formulieren (Store-Beschreibung, Trailer-Skript, Social-Media-Posts).
