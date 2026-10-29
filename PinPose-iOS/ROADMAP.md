# PinPose Roadmap

Arbeitsliste für die Weiterentwicklung. Immer den obersten offenen Punkt nehmen, umsetzen, bauen, abhaken.
Neue Ideen unten bei „Später“ eintragen.

## Jetzt

- [ ] Erster Test auf dem echten iPhone: Kamera, Pose-Skelett, Match-%, Silhouette, Karte, Golden Hour. Gefundene Bugs hier als eigene Punkte eintragen.
- [ ] Share Extension (zurückgestellt: braucht App Group = bezahlter Developer-Account; bis dahin erkennt das Banner kopierte Links)
- [ ] Live-Coaching auf dem iPhone testen: Schwellen (25° Gliedmaßen, 12° Schultern/Hüfte/Kopf) und Wortwahl anpassen; prüfen, ob die Ansagen bei stummgeschaltetem iPhone hörbar sind

## Danach

- [ ] Zwei Personen im Bild erkennen und beide Posen vergleichen
- [ ] Moodboard: mehrere Looks zu einem Shooting-Plan mit Ort und Uhrzeit bündeln
- [ ] Englisch Teil 2: Analyse-Texte aus PoseDescriber und ShotAdvisor (String(localized:)); bis dahin sind die Tipp-Karten auf Englisch noch deutsch

## Später

- [ ] App-Store-Screenshots (Texte in APPSTORE.md, Datenschutz-Manifest ist da)
- [ ] TestFlight-Verteilung automatisieren

## Erledigt

- [x] Englisch Teil 1: String Catalog (Localizable + InfoPlist) für Oberfläche, Onboarding, Coach-Hinweise, Pose-Ideen, Mitteilungen; Logik vergleicht Icons statt deutscher Texte; Tests laufen auf Deutsch (Scheme)

- [x] 3D-Icons (3dicons.co, CC0, Stil „color“) für Onboarding, Startbildschirm, Shot-Plan, Analyse-Schritte, Vergleich, Golden Hour; Bedienelemente bleiben SF Symbols; Emojis als Icon-Ersatz entfernt
- [x] Neues App-Icon: 3D-Pin im Kamera-Sucher, hell + dunkel (scripts/make_app_icon.py)

- [x] Analyse-Wartezeit als abhakende Schritte; „Jetzt nachshooten“ fest unten in der Look-Ansicht; App-Store-Texte (APPSTORE.md)

- [x] Coach korrigiert auch Abstand und Position („Einen Schritt zurück“, „Kamera etwas nach links schwenken“); Auto-Auslöser wartet, bis der Ausschnitt passt

- [x] „Über PinPose“: Fortschritt, Einführung erneut, Bewerten, Datenschutz; PrivacyInfo.xcprivacy; Bewertungs-Bitte nur nach einer guten Session (einmal pro Version)

- [x] Pose-Ideen: 6 eingebaute Posen (Figur + Silhouette), Start ohne eigenes Bild; leerer Startbildschirm ohne doppelte Erklärung

- [x] Golden-Hour-Erinnerung pro Look (lokale Mitteilung 30 Min vorher, Tippen öffnet den Look)

- [x] Farblook der Vorlage aufs eigene Foto (Belichtung, Kontrast, Sättigung, Weißabgleich; Stärke-Regler; auch in der Collage)

- [x] Unit-Tests (Target PinPoseTests) für PoseMatcher, PoseCoach, BodyPose, ShotAdvisor, SunCalculator, PinterestImporter, Look-Migration und Collage; laufen in GitHub Actions im Simulator

- [x] Analyse: „Dein Shot-Plan“ (Zoom, Kamera, Licht, Ort) oben, Tipp-Abschnitte eingeklappt
- [x] Kamera aufgeräumt: Regler nur auf Tippen (Vorlage/Belichtung), Einstellungen bleiben gespeichert, ein Hinweis zur Zeit, Rückmeldung nach jedem Foto („Neuer Bestwert“)

- [x] Eigene Fotos pro Look gespeichert (Verlauf, bestes Foto markiert), Bibliothek zeigt „Offen“ und Fortschritt
- [x] Vorher/Nachher-Collage (4:5, mit Pose-Match und PinPose-Schriftzug) zum Teilen

- [x] Onboarding beim ersten Start (3 Seiten, überspringbar, endet direkt im Import)
- [x] Kopierter Link wird erkannt: Banner „Link kopiert – direkt analysieren?“ (ohne Einfüge-Abfrage von iOS)

- [x] Grund-App: Import (Link, Fotos, Zwischenablage), Analyse, Nachshoot-Kamera, Orte
- [x] Spiegeln, Silhouette, Overlay verschieben/zoomen, Auto-Auslöser, Golden Hour
- [x] macOS-Build über GitHub Actions
- [x] Live-Coaching im Sucher: wichtigste Korrektur pro Körperteil („Linke Hand höher“, „Schultern gerader halten“), ruhig ohne Flackern, optional als Sprachansage fürs Stativ
