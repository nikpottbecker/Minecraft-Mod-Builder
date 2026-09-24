# F1 Freunde-Rangliste

Eine kleine Webseite im F1-Stil, um mit Freunden Rennergebnisse einzutragen
und eine Fahrerwertung (Rangliste) zu führen. Punktevergabe wie in der
echten Formel 1: 25-18-15-12-10-8-6-4-2-1 Punkte für Platz 1-10, plus 1
Bonuspunkt für die schnellste Runde (nur wenn der Fahrer in den Top 10 liegt).

## Features

- Öffentliche Rangliste mit Punkten, Siegen und Podien
- Übersicht aller Rennen inkl. Detailergebnisse pro Rennen
- Geschützter **Admin-Bereich** (Login) zum:
  - Anlegen/Löschen von Fahrern
  - Anlegen/Löschen von Rennen
  - Eintragen der Platzierungen pro Rennen (inkl. DNF und schnellste Runde)
  - Ändern des Admin-Passworts

## Setup

```bash
npm install
npm start
```

Die Seite läuft danach unter `http://localhost:3000`.

Beim ersten Start wird automatisch ein Admin-Zugang angelegt und in der
Konsole ausgegeben (Standard: Benutzer `admin`, Passwort `admin123`).
**Bitte direkt nach dem ersten Login unter "Passwort ändern" ein eigenes
Passwort setzen!**

Optional kann der initiale Admin-Zugang über eine `.env`-Datei
konfiguriert werden (siehe `.env.example`):

```
ADMIN_USER=admin
ADMIN_PASSWORD=einSicheresPasswort
SESSION_SECRET=einZufaelligerString
PORT=3000
```

## Technik

- Node.js + Express
- SQLite (better-sqlite3) als Datenspeicher (Datei `data.sqlite`)
- EJS-Templates, eigenes CSS im F1-Look
- Sessions + bcrypt für den Admin-Login
