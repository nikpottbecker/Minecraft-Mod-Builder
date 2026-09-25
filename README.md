# F1 Freunde-Rangliste

Eine kleine Webseite im F1-Stil, um mit Freunden Rennergebnisse einzutragen
und eine Fahrerwertung (Rangliste) zu führen. Punktevergabe wie in der
echten Formel 1: 25-18-15-12-10-8-6-4-2-1 Punkte für Platz 1-10, plus 1
Bonuspunkt für die schnellste Runde (nur wenn der Fahrer in den Top 10 liegt).

**Diese Version (Repo-Root) läuft als Cloudflare Worker + Supabase** — siehe
[`CLOUDFLARE.md`](./CLOUDFLARE.md) für Deploy-Anleitung und Details.

## Features

- Öffentliche Rangliste mit Punkten, Siegen und Podien
- Übersicht aller Rennen inkl. Detailergebnisse pro Rennen und YouTube-Link
  zur Rennaufzeichnung
- Geschützter **Admin-Bereich** (Login) zum:
  - Anlegen/Löschen von Fahrern
  - Anlegen/Löschen von Rennen
  - Eintragen der Platzierungen pro Rennen (inkl. DNF und schnellste Runde)
  - Ändern des Admin-Passworts
- [`telemetry-listener/`](./telemetry-listener): Tool, das F1-25-UDP-Telemetrie
  live ausliest und Rennergebnisse automatisch einträgt

## Projektstruktur

```
wrangler.toml, src/     -> Cloudflare Worker (aktuelle, live Version)
legacy-express-app/     -> urspr. Prototyp: Node/Express + lokale SQLite-DB
telemetry-listener/     -> F1-25-UDP-Telemetrie-Listener
```

## Deploy

Siehe [`CLOUDFLARE.md`](./CLOUDFLARE.md).

## Lokaler Prototyp (Express + SQLite)

Der ursprüngliche Prototyp in `legacy-express-app/` läuft unabhängig vom
Cloudflare Worker und speichert Daten lokal in SQLite statt in Supabase:

```bash
cd legacy-express-app
npm install
npm start
```

Danach unter `http://localhost:3000` erreichbar. Admin-Zugang wird beim
ersten Start automatisch angelegt (`admin` / `admin123`, danach unbedingt
ändern) — siehe `.env.example` für Konfigurationsoptionen.
