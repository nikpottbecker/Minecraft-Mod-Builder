# Business & Budget

**Hinweis:** Das hier ist eine Orientierung, keine Rechts- oder Steuerberatung. Für Steuern und Gewerbe lohnt sich ein Termin bei einem Steuerberater, oft reicht eine Stunde.

## 1. Kosten

| Posten | Muss? | Kosten |
|---|---|---|
| Godot, Blender, Git, GitHub | ja | 0 € |
| Claude-Abo für Claude Code | ja | laut deinem Abo |
| Steam Direct Fee | ja | **100 $** (Rückzahlung ab 1.000 $ Bruttoumsatz) |
| Asset-Pakete (Kenney, Quaternius) | – | 0 € (CC0) |
| Sounds & Musik | – | 0 € (CC0) bis ca. 500 € (Musik-Lizenz oder Komponist) |
| Capsule-Grafik vom Artist | empfohlen | 200–800 € |
| Trailer-Schnitt | optional | 0 € (selbst) bis 1.500 € |
| 3D-Figuren vom Artist | optional | 300–2.000 € |
| Marke anmelden (DPMA) | optional | ab ca. 290 € |
| Werbung | optional | 0,30–2,00 $ pro Wunschliste |

**Minimal-Budget:** ca. **100 $ + Abo**. **Empfohlenes Budget:** ca. **1.000–2.500 €** (Capsule, Musik, eventuell Figuren).

## 2. Was bleibt vom Verkaufspreis übrig?
Beispiel mit einem Preis von 7,99 €:
- Mehrwertsteuer geht ab (in der EU führt Steam sie ab)
- **Steam behält 30 %** (ab 10 Mio. $ Umsatz 25 %, ab 50 Mio. $ 20 %)
- Dazu kommen Rabatte, regionale Preise und Rückerstattungen
- **Faustregel: Pro verkaufter Kopie bleiben ca. 50 % des Listenpreises**, also etwa **4 €**

## 3. Szenarien (grobe Schätzung)
| Szenario | Wunschlisten zum Launch | Verkäufe Woche 1 | Verkäufe 1. Jahr (ca. 3–5× Woche 1) | Für dich (ca. 4 €/Kopie, vor Steuern) |
|---|---|---|---|---|
| Schwach | 2.000 | ~250 | ~1.000 | ~4.000 € |
| Solide | 10.000 | ~1.500 | ~6.000 | ~24.000 € |
| Gut | 30.000 | ~4.500 | ~18.000 | ~72.000 € |
| Hit (Streamer-Welle) | egal | 50.000+ | 250.000+ | 1 Mio. €+ |

Die Werte schwanken in der Praxis stark: Laut Branchendaten kann ein Spiel 10× schlechter oder 20× besser konvertieren als der Durchschnitt. Hits wie PEAK oder RV There Yet? entstanden fast immer durch Streamer, nicht durch vorhandene Wunschlisten.

## 4. Formales (Deutschland)
- **Steamworks-Vertrag:** Du musst volljährig sein und einen Vertrag abschließen können. Wenn du unter 18 bist, müssen deine Eltern den Account einrichten.
- **Steuerformular bei Steam** (W-8BEN für Privatpersonen außerhalb der USA): Dank Doppelbesteuerungsabkommen behält die USA dann keine Quellensteuer ein.
- **Gewerbe anmelden,** wenn du regelmäßig mit Gewinnabsicht verkaufst. Das geht beim Gewerbeamt, kostet ca. 20–60 € und oft auch online.
- **Kleinunternehmerregelung** (Umsatzsteuer) mit dem Steuerberater klären.
- Einnahmen gehören in die **Einkommensteuererklärung.**
- **Altersfreigabe:** Auf Steam gibt es für Deutschland ein Selbstauskunft-Verfahren (IARC-Fragebogen in Steamworks). Das Spiel hat keine Gewalt, also ist eine niedrige Einstufung zu erwarten.
- **Impressum und Datenschutz:** Wenn du eine eigene Website oder ein Presskit hast, braucht die ein Impressum.

## 5. Lizenzen: eine Liste von Anfang an führen
Leg im Projekt eine Datei `docs/LIZENZEN.md` an und trag **jedes** fremde Asset ein: Name, Quelle (Link), Lizenz, Autor. Das brauchst du für die Credits im Spiel und falls es jemals Fragen gibt.
Claude Code kann das automatisch pflegen. Die Regel dafür steht in der aktualisierten `CLAUDE.md`.

## 6. KI-Offenlegung auf Steam
Steam fragt beim Einreichen, ob KI bei der Entwicklung verwendet wurde. Code, der mit Claude Code geschrieben wurde, gibst du dort **ehrlich an.** Das ist erlaubt und üblich. Wenn KI-generierte Inhalte im Spiel zu sehen oder zu hören sind (Bilder, Texte, Stimmen), muss das auf der Store-Seite offengelegt werden. Die aktuellen Regeln stehen in der Steamworks-Dokumentation.
