# Masterprompt für Claude Code auf dem Mac Studio

**So benutzen:** Auf dem Mac Studio im Terminal in `~/Developer` wechseln und
`claude remote-control` starten. Dann taucht die Sitzung auch in der Claude-App auf dem Handy auf, und
du kannst sie von unterwegs steuern. (Ohne Fernsteuerung reicht `claude`.) Dann eingeben:

```
/loop <den kompletten Text unten einfügen>
```

`/loop` ohne Zeitangabe lässt Claude selbst bestimmen, wann es weitermacht. Jede Runde arbeitet einen
Punkt aus `PinPose-iOS/ROADMAP.md` ab. Stoppen: `Esc` drücken oder „stopp den Loop“ schreiben.
Der Mac muss dafür wach bleiben (Systemeinstellungen → Energie → „Ruhezustand verhindern“).

---

Du arbeitest auf meinem Mac Studio an der iPhone-App **PinPose** (SwiftUI, iOS 17+). Mit der App kann man
Pinterest-Fotos nachshooten: Sie analysiert ein Vorbild (Pose, Kamera-Einstellungen, Licht, Ort) und hat
eine Nachshoot-Kamera mit Overlay und Live-Pose-Match. Du bist in einem Loop: Mach in jeder Runde einen
sinnvollen Schritt weiter, bis die Roadmap leer ist.

## Repo und Sicherheitsregeln (nicht verhandelbar)

- Repo: `https://github.com/nikpottbecker/Minecraft-Mod-Builder`, Branch **`claude/quirky-rubin-ossizi`**.
- Im Repo liegen andere Projekte (F1-Webseite, Cloudflare Worker, `legacy-express-app`, `telemetry-listener`).
  **Fass nichts außerhalb von `PinPose-iOS/` an**, außer `.github/workflows/pinpose-ios.yml`.
- Arbeite in einem **eigenen Klon** unter `~/Developer/PinPose-build`. Ändere keine anderen Checkouts dieses Repos auf dem Mac.
- Nie auf `main` pushen, nie `--force`, nie `git reset --hard` auf fremde Commits, keine Dateien anderer Projekte löschen.
- Keine Secrets, Passwörter oder API-Keys committen.

## Jede Runde

1. **Holen:**
   - Falls `~/Developer/PinPose-build` fehlt:
     `git clone --branch claude/quirky-rubin-ossizi https://github.com/nikpottbecker/Minecraft-Mod-Builder.git ~/Developer/PinPose-build`
   - Sonst: `cd ~/Developer/PinPose-build && git pull --ff-only origin claude/quirky-rubin-ossizi`
   - Beim ersten Mal lies `PinPose-iOS/README.md`, `PinPose-iOS/MARKTRECHERCHE.md` und `PinPose-iOS/ROADMAP.md` sowie alle Swift-Dateien unter `PinPose-iOS/PinPose/`.
2. **Bauen, bevor du etwas änderst:**
   ```
   cd ~/Developer/PinPose-build/PinPose-iOS
   xcodebuild -project PinPose.xcodeproj -scheme PinPose -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
   ```
   Ist der Build rot, ist das Reparieren die Aufgabe dieser Runde.
3. **Nächsten Punkt nehmen:** den obersten offenen Punkt aus `PinPose-iOS/ROADMAP.md` unter „Jetzt“. Ist der zu groß für eine Runde, teil ihn in Unterpunkte und mach den ersten.
4. **Umsetzen** im Stil des bestehenden Codes (SwiftUI, `ObservableObject`, Swift 5-Modus, deutsche UI-Texte, englische Code-Kommentare, keine Fremd-Bibliotheken ohne Rückfrage). Das Projekt nutzt synchronisierte Ordner (Xcode 16), neue Dateien in `PinPose/` sind automatisch im Target. Neue Targets (z. B. Share Extension) ordentlich über das Xcode-Projekt anlegen.
5. **Prüfen:** Wieder bauen. Wenn es Tests gibt: `xcodebuild test -scheme PinPose -destination 'platform=iOS Simulator,name=iPhone 16'` (verfügbare Simulatoren mit `xcrun simctl list devices available`). Bei UI-Änderungen die App im Simulator starten und mit `xcrun simctl io booted screenshot` kontrollieren.
6. **Abschließen:** Punkt in der ROADMAP abhaken (unter „Erledigt“ verschieben), neue Bugs/Ideen eintragen, dann
   `git add PinPose-iOS .github/workflows/pinpose-ios.yml` → aussagekräftiger Commit → `git push origin claude/quirky-rubin-ossizi`.
   Danach prüfen, dass der GitHub-Actions-Lauf „PinPose iOS Build“ grün ist (`gh run list --branch claude/quirky-rubin-ossizi --limit 1`).
7. **Kurz berichten** (2–3 Sätze auf Deutsch): was erledigt ist, was als Nächstes kommt.

Halt an und frag mich nur, wenn du wirklich eine Entscheidung von mir brauchst (z. B. Geld, Apple-Account, Design-Richtung). Sonst einfach weitermachen.

## Datei fürs Handy (remote installieren)

Sobald die Roadmap-Punkte unter „Jetzt“ erledigt sind, oder wenn ich „Handy-Build“ schreibe:

1. Prüfe in Xcode bzw. mit `security find-identity -v -p codesigning` und `xcodebuild -showBuildSettings`, welches Apple-Konto verfügbar ist.
2. **Bezahlter Apple Developer Account (99 €/Jahr) vorhanden → TestFlight (bevorzugt, echt remote):**
   - Team-ID und eine eindeutige Bundle-ID setzen (z. B. `com.<name>.PinPose`), Build-Nummer erhöhen.
   - `xcodebuild archive -scheme PinPose -destination 'generic/platform=iOS' -archivePath build/PinPose.xcarchive`
   - `xcodebuild -exportArchive -archivePath build/PinPose.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/` mit `method = app-store-connect`, `destination = upload`.
   - Danach lädt die App auf TestFlight hoch; ich installiere sie über die TestFlight-App auf dem Handy, egal wo ich bin. Falls der Upload einen App-Store-Connect-API-Key oder einen Login braucht: frag mich, und leg den Key nur lokal ab (nie committen).
3. **Nur kostenlose Apple-ID → kabellos installieren:**
   - Mein iPhone muss einmal per Kabel mit dem Mac verbunden worden sein und im selben WLAN sein (Xcode → Window → Devices and Simulators → „Connect via network“).
   - `xcrun devicectl list devices` → Gerät finden, dann bauen mit Signierung (`-allowProvisioningUpdates`, Ziel: das Gerät) und `xcrun devicectl device install app --device <ID> <Pfad zur .app>`.
   - Hinweis an mich: Mit kostenloser Apple-ID läuft die App 7 Tage. Ein .ipa zum Verschicken funktioniert ohne bezahlten Account nicht.
4. Die fertige `.ipa`/`.xcarchive` **nicht committen** (liegt in `build/`, ist in `.gitignore`). Sag mir am Ende, wie ich die App auf dem Handy bekomme.
