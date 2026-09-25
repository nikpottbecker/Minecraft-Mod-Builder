# F1 25 Telemetrie-Listener

Kleines Python-Tool, das während eines F1-25-Rennens automatisch die
UDP-Telemetrie des Spiels empfängt und nach Rennende die Ergebnisse
direkt in die Supabase-Datenbank der F1-Freunde-Rangliste schreibt —
die gleiche Datenbank, die auch der Cloudflare Worker und die Web-App
nutzen.

Basiert auf der offiziellen EA-Spezifikation "Data Output from F1 25 v3"
(Format-Version 2025). Verarbeitet werden:

- **Participants-Paket** (ID 4): liefert die Fahrernamen je Startplatz
- **Final-Classification-Paket** (ID 8): liefert das Zielklassement
  (Platz, DNF-Status, schnellste Rundenzeit) direkt nach Rennende

## Einrichtung

1. **Python-Abhängigkeit installieren** (auf dem Rechner, der während des
   Rennens läuft — PC, Laptop, Raspberry Pi im gleichen Netzwerk wie
   deine Konsole/dein PC mit F1 25):

   ```bash
   pip install requests
   ```

2. **UDP-Telemetrie in F1 25 aktivieren:**
   Einstellungen → Telemetrie-Einstellungen
   - UDP-Telemetrie: **Ein**
   - UDP-Broadcast-Modus: **Aus**
   - UDP-IP-Adresse: die lokale IP des Rechners, auf dem dieses Skript
     läuft (z.B. `192.168.1.50`)
   - UDP-Port: **20777** (Standard)
   - UDP-Format: **2025**

3. **Listener starten:**

   ```bash
   python f1_listener.py
   ```

   Das Skript legt für jedes beendete Rennen automatisch einen neuen
   Renneintrag an (`F1 25 Auto-Import <Datum>`) und trägt die Ergebnisse
   ein. Fahrer, die noch nicht in der Datenbank existieren, werden
   anhand ihres In-Game-Namens automatisch neu angelegt.

   Willst du die Ergebnisse stattdessen einem bereits im Admin-Bereich
   angelegten Rennen zuordnen:

   ```bash
   python f1_listener.py --race-id 12
   ```

   (die Renn-ID siehst du in der URL `/races/<id>` bzw. `/admin/races/<id>`)

4. Rennen fahren, ins Ziel kommen — sobald der Ergebnisbildschirm
   erscheint, verarbeitet das Skript automatisch das Zielklassement und
   beendet sich nicht (läuft weiter für das nächste Rennen). Mit
   `Strg+C` beenden.

## Punkte

Das Skript schreibt nur **Platzierung** und **DNF-Status** sowie die
**schnellste Runde** in die Datenbank — die eigentliche Punktevergabe
(25-18-15-12-10-8-6-4-2-1 + Bonuspunkt) übernimmt weiterhin die Web-App
selbst, damit die Punkteregeln an einer einzigen Stelle gepflegt werden.

## Bekannte Einschränkungen

- Fahrer werden über ihren **In-Game-Anzeigenamen** zugeordnet. Wenn
  jemand seinen Namen zwischen Rennen ändert, entsteht ein neuer
  Fahrer-Eintrag — im Admin-Bereich kannst du doppelte Einträge löschen.
- Das Skript muss während des gesamten Rennens laufen und im selben
  Netzwerk wie die Konsole/der PC sein (UDP wird nicht über das
  Internet geroutet, nur im LAN).
- Getestet mit synthetischen Beispielpaketen gegen die offizielle
  Spezifikation; falls EA das Format in einem Patch anpasst, kann eine
  kleine Anpassung der Byte-Layouts in `f1_listener.py` nötig werden.
