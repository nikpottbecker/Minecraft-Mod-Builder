# PinPose Roadmap

Arbeitsliste für die Weiterentwicklung. Immer den obersten offenen Punkt nehmen, umsetzen, bauen, abhaken.
Neue Ideen unten bei „Später“ eintragen.

## Jetzt

- [ ] Erster Test auf dem echten iPhone: Kamera, Pose-Skelett, Match-%, Silhouette, Karte, Golden Hour. Gefundene Bugs hier als eigene Punkte eintragen.
- [ ] Share Extension: In der Pinterest-App „Teilen → PinPose“ öffnet direkt die Analyse (App Group für die Übergabe)
- [ ] Onboarding beim ersten Start (3 Seiten: Bild einfügen → Analyse → Nachshooten)
- [ ] Unit-Tests für PoseMatcher, PoseCoach, PoseDescriber, ShotAdvisor, SunCalculator und PinterestImporter (HTML-Parsing)
- [ ] Live-Coaching auf dem iPhone testen: Schwellen (25° Gliedmaßen, 12° Schultern/Hüfte/Kopf) und Wortwahl anpassen; prüfen, ob die Ansagen bei stummgeschaltetem iPhone hörbar sind

## Danach

- [ ] Zwei Personen im Bild erkennen und beide Posen vergleichen
- [ ] Moodboard: mehrere Looks zu einem Shooting-Plan mit Ort und Uhrzeit bündeln
- [ ] Vorher/Nachher-Collage (Vorlage + eigenes Foto) zum Teilen
- [ ] Bearbeitungs-Preset: Farblook aus der Analyse direkt auf das eigene Foto anwenden (Core Image)
- [ ] Englische Übersetzung (String Catalog)

## Später

- [ ] App-Store-Texte und Screenshots
- [ ] TestFlight-Verteilung automatisieren

## Erledigt

- [x] Grund-App: Import (Link, Fotos, Zwischenablage), Analyse, Nachshoot-Kamera, Orte
- [x] Spiegeln, Silhouette, Overlay verschieben/zoomen, Auto-Auslöser, Golden Hour
- [x] macOS-Build über GitHub Actions
- [x] Live-Coaching im Sucher: wichtigste Korrektur pro Körperteil („Linke Hand höher“, „Schultern gerader halten“), ruhig ohne Flackern, optional als Sprachansage fürs Stativ
