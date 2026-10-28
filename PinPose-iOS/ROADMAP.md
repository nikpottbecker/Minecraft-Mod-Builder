# PinPose Roadmap

Arbeitsliste für die Weiterentwicklung. Immer den obersten offenen Punkt nehmen, umsetzen, bauen, abhaken.
Neue Ideen unten bei „Später“ eintragen.

## Jetzt

- [ ] Erster Test auf dem echten iPhone: Kamera, Pose-Skelett, Match-%, Silhouette, Karte, Golden Hour. Gefundene Bugs hier als eigene Punkte eintragen.
- [ ] Share Extension: In der Pinterest-App „Teilen → PinPose“ öffnet direkt die Analyse (App Group für die Übergabe)
- [ ] Live-Coaching pro Körperteil im Sucher („linken Arm höher“, „Kopf mehr nach links“) aus dem Vergleich Live-Pose ↔ Vorlage
- [ ] Onboarding beim ersten Start (3 Seiten: Bild einfügen → Analyse → Nachshooten)
- [ ] Unit-Tests für PoseMatcher, PoseDescriber, ShotAdvisor, SunCalculator und PinterestImporter (HTML-Parsing)

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
