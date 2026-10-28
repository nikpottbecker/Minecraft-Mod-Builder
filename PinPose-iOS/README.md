# PinPose – Pinterest-Bilder nachshooten 📸

iPhone-App (SwiftUI) für alle, die Pinterest-Fotos 1:1 nachmachen wollen.
Du gibst ein Pinterest-Bild ein, und die App zeigt dir:

- **So posierst du** – Körperausrichtung, Schultern, Hüfte (S-Kurve), Kopfneigung, Blickrichtung,
  was jeder Arm und jedes Bein macht (z. B. „Hand in die Hüfte, Ellbogen nach außen“, „Standbein & Spielbein“).
  Links/rechts ist immer aus Sicht der Person gemeint.
- **Kamera-Einstellungen** – Zoom (0,5× / 1× / 2× / 3×), Porträtmodus und Blende, Kamerahöhe
  (z. B. „tief halten für lange Beine“), Format (2:3, 4:5 …), Belichtungskorrektur und, falls vorhanden,
  die originalen EXIF-Daten.
- **Licht & Stimmung** – Golden Hour, Gegenlicht, Blitz-Look, weiches Licht usw. und konkrete Werte
  für die Nachbearbeitung in der Fotos-App.
- **Licht heute bei dir** – Golden Hour morgens/abends und blaue Stunde für deinen Standort.
- **Bildaufbau** – Ausschnitt (Ganzkörper, Knie, Hüfte, Porträt), Position nach der Drittel-Regel, Platz über dem Kopf.
- **Orte in deiner Nähe** – Die App erkennt die Kulisse (Strand, Café, Wald, Altstadt, Blumen …) und sucht
  passende Spots auf der Karte, inklusive Entfernung und Route. Wenn das Bild GPS-Daten hat, wird auch der Original-Ort angezeigt.

### Nachshoot-Kamera
- Vorlage halbtransparent über dem Kamerabild (Deckkraft einstellbar) – als Foto oder als ausgeschnittene **Silhouette**
- Vorlage **spiegeln** (bei Selfies automatisch) sowie **verschieben & zoomen** mit den Fingern
- **Auto-Auslöser**: löst aus, sobald du die Pose ~1 Sekunde hältst (Vibration, wenn sie einrastet)
- Pinkes Pose-Skelett der Vorlage und dein Live-Skelett darüber
- **Pose-Match in %** live (grün ab 85 %), spiegelverkehrt zählt auch
- Empfohlener Zoom und empfohlene Belichtung sind schon eingestellt
- Drittel-Raster, Tap-to-Focus, Blitz, Front-/Rückkamera, Selbstauslöser (3 s / 10 s)
- Tipps zum Durchtippen direkt im Sucher
- Fotos werden automatisch in „Fotos“ gespeichert; danach Vergleich Vorlage ↔ dein Foto und Teilen

### Bilder hinzufügen
1. **Pinterest-Link**: In Pinterest auf Teilen → „Link kopieren“, dann in PinPose einfügen („Pin laden“).
2. **Aus Fotos**: In Pinterest Pin öffnen → ••• → „Bild herunterladen“, dann in PinPose auswählen.
3. **Zwischenablage**: Bild kopieren und in PinPose einfügen.

Alle Analysen laufen direkt auf dem iPhone (Apple Vision); es gibt keinen Server und keinen Account.

## Auf dem iPhone installieren

Du brauchst einen Mac mit **Xcode 16 oder neuer** und ein iPhone mit **iOS 17 oder neuer**.
Eine kostenlose Apple-ID reicht.

1. `PinPose-iOS/PinPose.xcodeproj` in Xcode öffnen.
2. Links das Projekt **PinPose** anklicken → Target **PinPose** → Tab **Signing & Capabilities**
   → bei **Team** deine Apple-ID auswählen (ggf. über „Add an Account…“ anmelden).
   Falls Xcode meckert, dass die Bundle-ID schon vergeben ist: `com.pinpose.PinPoseApp` z. B. in
   `com.deinname.PinPose` ändern.
3. iPhone per Kabel verbinden und oben in Xcode als Ziel auswählen.
4. Auf dem iPhone: **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** einschalten (Neustart).
5. In Xcode auf ▶︎ (Run) klicken.
6. Beim ersten Start auf dem iPhone: **Einstellungen → Allgemein → VPN & Geräteverwaltung** → deinem
   Entwicklerprofil vertrauen.

> Mit einer kostenlosen Apple-ID läuft die App 7 Tage, danach einfach in Xcode nochmal auf ▶︎ drücken.

Die Kamera funktioniert nur auf einem echten iPhone, nicht im Simulator. Import und Analyse kannst du
aber auch im Simulator testen.

## Aufbau

```
PinPose/
  PinPoseApp.swift            App-Einstieg
  Models/
    BodyPose.swift            Gelenkpunkte, Skelett, Ausschnitt (Framing)
    ShotAnalysis.swift        Analyse-Ergebnis, EXIF, Look
  Services/
    ImageAnalyzer.swift       Vision (Pose, Gesicht, Szene) + Pixel-Statistik
    PoseDescriber.swift       Pose → Posing-Anleitung
    ShotAdvisor.swift         Kamera-, Licht-, Bildaufbau- und Orts-Tipps
    PoseTools.swift           Vision → BodyPose, Pose-Vergleich (Match %)
    PinterestImporter.swift   Pin-Link → Bild
    CameraController.swift    AVFoundation-Kamera, Live-Pose, Foto speichern
    PlaceFinder.swift         Standort + Apple-Maps-Suche
    SunCalculator.swift       Sonnenauf-/untergang, Golden Hour
    LookStore.swift           Speichern der Looks (JSON + JPEG)
  Views/                      SwiftUI-Oberfläche
```

Siehe auch [MARKTRECHERCHE.md](./MARKTRECHERCHE.md) – Konkurrenz-Apps und wie sich PinPose abhebt.
