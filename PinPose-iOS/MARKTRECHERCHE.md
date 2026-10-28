# Marktrecherche PinPose (Stand: Oktober 2026)

Kurzfassung: **Der Markt ist voll, aber zersplittert.** Es gibt viele Apps, die ein Vorlagenbild über die
Kamera legen oder Posen vorschlagen. Keine der gefundenen Apps kombiniert **Pose + Kamera-Einstellungen +
Licht + Ort** aus *einem* Pinterest-Bild. Genau das ist die Lücke für PinPose.

> Hinweis: Die Angaben stammen aus App-Store-Einträgen und Web-Suchergebnissen (Marketingtexte).
> Die App-Store-Seiten selbst konnte ich aus dieser Umgebung nicht öffnen, Preise und Funktionen können sich geändert haben.

## 1. Direkte Konkurrenz: Vorlage über die Kamera legen

| App | Was sie kann | Preis / Modell | Schwächen laut Reviews/Listing |
|---|---|---|---|
| [Dittoed](https://apps.apple.com/hn/app/dittoed/id1611133466) | Vorlagenbild als Live-Overlay, explizit „Pinterest-Bilder nachmachen“, auch Vorher/Nachher | Abo für Premium-Vorlagen/Filter | Nur Overlay, keine Analyse |
| [Swellsy Photo](https://apps.apple.com/us/app/-/id1095151848) | Pinterest-Bild speichern → als Overlay wählen → nachstellen | kostenlos | Overlay wird bei Selfies **nicht gespiegelt** |
| [Recreate – Then & Now](https://apps.apple.com/us/app/recreate-the-then-now-camera-app/id946092340) | Vorlage ein-/ausblenden | 0,99 $ | 1,7★, Abstürze, schneidet Bilder zu, kein Spiegeln |
| [Recreate Cam](https://apps.apple.com/us/app/-/id6740338170) | Foto-Nachstellen mit Overlay | – | – |

## 2. Pose-Guide-Apps (sehr viele, meist 2025/2026 erschienen)

| App | Besonderheit | Preis |
|---|---|---|
| [PoseCam: Pose Guide Camera AI](https://apps.apple.com/app/id6780748437) | Person aus Referenzbild „ausschneiden“ als Overlay, **Live-Coaching** („halten, neigen, Schritt“), Pose rastet grün ein, **Auto-Auslöser** nur in Pro | Free + In-App |
| [Posed: AI Pose Coach](https://apps.apple.com/app/id6762599608) | Ghost-Overlay mit **Pinch/Drag/Deckkraft**, KI-Posenvorschläge zur Szene | 39,99–49,99 $/Jahr |
| [PoStyle](https://apps.apple.com/app/id6755433832) | eigenes Referenzbild → Pose-Umriss, 10k fertige Overlays | Free + In-App |
| [Posera](https://mwm.ai/apps/posera-camera-pose-guide/6781091663) | Inspo-Overlay, Deckkraft, Seitenverhältnis | kostenlos |
| [Pose Genius](https://apps.apple.com/app/id6755207657) | Overlay, Auto-Weiter, Timer | 44,99 $/Jahr |
| [ModelPoser](https://apps.apple.com/app/id6757637348), [Pose AI](https://apps.apple.com/us/app/id6764609323), [Posei](https://apps.apple.com/app/id6763751241), [PoseMe](https://apps.apple.com/app/id6752570584), [SeePose](https://apps.apple.com/mx/app/seepose/id6505120292), [EZ Pose](https://mwm.ai/apps/ez-pose/6785361046), [PoseRef](https://apps.apple.com/in/app/poseref/id6762497572) | Posen-Bibliotheken und Overlays, teils Community | meist Abo |

**Muster:** Fast alle setzen auf Overlay + Posen-Bibliothek, die guten Funktionen stecken hinter teuren Abos (40–50 $/Jahr).

## 3. Angrenzend: Kamera-Einstellungen, Licht, Orte

- **Kamera-Einstellungen:** [CamSet: AI Camera Settings](https://apps.apple.com/app/id6776000447) (9,99 $) berechnet Einstellungen aus der *Live-Szene*, nicht aus einem fertigen Vorbild. Eine App, die ein fertiges Insta/Pinterest-Foto „zurückrechnet“, habe ich nur als Uni-Projekt gefunden ([Tunnelvision](https://vcd.bilgi.edu.tr/tunnelvision/)).
- **Licht nachträglich:** Relight-Tools ([FlexClip](https://www.flexclip.com/tools/relight-image/), [Airbrush Relight](https://thedeadpixelssociety.com/airbrush-introduces-ai-relight-feature-for-camera-inspired-photo-lighting-effects/), [Studio Lights](https://apps.apple.com/us/app/id6759322077)) fälschen das Licht im Nachhinein, statt zu sagen, *wann* man fotografieren soll.
- **Orte:** NoFilter, ShotHotspot, PIXEO, Photographer's Ephemeris (Sonnenstand) – laut [Format](https://format.com/magazine/resources/photography/finding-photography-places-near-me) und [Pixpa](https://www.pixpa.com/blog/places-to-take-pictures-near-me). Keine davon verbindet den Ort mit einem konkreten Vorbild.

## 4. Lücken = Chancen für PinPose

1. **Alles aus einem Bild:** Pose *und* Zoom/Porträtmodus/Kamerahöhe *und* Licht/Uhrzeit *und* Ort. Das macht sonst niemand.
2. **Pose in Worten:** Die anderen zeigen nur Umrisse. PinPose sagt auch, *was* zu tun ist („Hand in die Hüfte, Ellbogen raus“).
3. **Pinterest-Link direkt einfügen**, statt erst das Bild zu speichern.
4. **Selfie-Spiegeln** (Hauptbeschwerde bei Swellsy/Recreate).
5. **Gratis-Funktionen, die bei anderen im Abo stecken:** Auto-Auslöser, Live-Match, Ausschneiden der Person.
6. **Deutsch und datenschutzfreundlich:** Analyse komplett auf dem iPhone, kein Konto.

## 5. Daraus umgesetzt (dieses Update)

- Vorlage **spiegeln** (automatisch bei Frontkamera)
- **Silhouette**: Person wird aus der Vorlage ausgeschnitten und als pinke Silhouette eingeblendet
- Vorlage **verschieben & zoomen** (Pinch/Drag) mit Zurücksetzen
- **Auto-Auslöser**: Foto wird ausgelöst, wenn der Pose-Match ~1 s lang ≥ 85 % ist; Vibration, wenn die Pose einrastet
- **Golden Hour heute** an deinem Standort (Sonnenaufgang/-untergang, blaue Stunde)

## 6. Mögliche nächste Schritte

- **Teilen-Erweiterung** (Share Extension): direkt in Pinterest „Teilen → PinPose“
- **Live-Coaching pro Körperteil** („linken Arm höher“) statt nur einem Gesamt-Prozentwert
- **Zwei Personen** (Freundinnen-Fotos) erkennen und vergleichen
- **Moodboards**: mehrere Pins zu einem Shooting-Plan mit Ort und Uhrzeit bündeln
- Positionierung im App Store: „Pinterest-Foto nachmachen – Pose, Kamera, Licht & Ort aus einem Bild“
