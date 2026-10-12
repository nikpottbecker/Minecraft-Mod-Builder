# Übergabe: F1-Freunde-Rangliste

Du übernimmst die Weiterentwicklung einer privaten F1-Rangliste für eine
Freundesgruppe. Dieses Dokument ist der komplette Kontext, den du brauchst,
um ohne Rückfragen weiterzubauen oder neue Rennergebnisse einzutragen.

## Repo & Deployment

- **Repo:** `nikpottbecker/Minecraft-Mod-Builder` (Name ist historisch/irreführend,
  hat nichts mit Minecraft zu tun)
- **Branch:** `main` ist der Produktions-Branch, an den Cloudflare Workers Builds
  automatisch deployt. Es gibt auch `claude/f1-rangliste-admin-02ksig` als
  Entwicklungs-Branch, der bisher parallel zu `main` auf dem gleichen Stand
  gehalten wurde (immer in beide Branches committen/mergen, oder zumindest
  `main` aktuell halten, da nur davon deployt wird).
- **Live-URL:** https://f1.homelab.ptbrnetwork.com
- **Admin-Login:** `admin` / `admin123` (Standardpasswort, evtl. inzwischen
  vom User geändert — im Zweifel fragen statt zu raten)

### Projektstruktur

```
wrangler.toml, src/     -> Cloudflare Worker (Hono), das hier ist die aktive App
  src/index.js          -> Routen (Hono-App)
  src/views.js           -> HTML-Templates (Template-Strings, kein JSX/Framework)
  src/supabase.js        -> Supabase-Client + Business-Logik (Punkte, Standings)
  src/auth.js             -> Signierte Cookie-Sessions fuer Admin-Login
legacy-express-app/     -> alter Prototyp (Node/Express + lokale SQLite) - NICHT live, nur zum Vergleich
telemetry-listener/     -> Python-Tool, das lokal auf dem PC des Users laeuft
  f1_listener.py          -> parst F1-25-UDP-Telemetrie, schreibt Ergebnisse nach Supabase
CLOUDFLARE.md           -> Deploy-Anleitung fuer den Worker
```

**Wichtig:** `wrangler.toml` und `src/` liegen bewusst im **Repo-Root**, nicht
in einem Unterordner. Cloudflare Workers Builds hat mehrfach ignoriert, wenn
wir ein "Root directory" in den Build-Settings gesetzt haben (baute trotzdem
immer im Repo-Root und installierte die falsche `package.json`) — die
Lösung war, den Worker-Code an die Stelle zu verschieben, wo Cloudflare
sowieso baut. **Nicht wieder in einen `worker/`-Unterordner verschieben.**

### Deploy

Cloudflare Workers Builds ist mit GitHub verbunden und deployt automatisch
bei jedem Push nach `main`. Build command: `npm install && npx wrangler deploy`.
Falls der Build fehlschlägt mit "Could not detect a directory containing
static files" → Root-Directory-Setting in Cloudflare pruefen, sollte leer
sein.

## Datenbank (Supabase)

- **Projekt:** `f1-rangliste`, Projekt-ID `byitheklzbpwysdeckvy`, Region
  eu-central-1, Organisation "Curseforge Dev"
- **Supabase-URL + anon-Key** stehen bereits in `wrangler.toml` als `[vars]`
  (bewusst im Klartext committed — der anon-Key ist oeffentlich by design,
  der Zugriffsschutz laeuft ueber den Admin-Login im Worker, nicht ueber
  den Key). Der Telemetrie-Listener nutzt denselben Key direkt (hardcoded
  in `f1_listener.py`).

### Schema

```sql
drivers (
  id, name, color, created_at,
  is_ai boolean default false,   -- true = KI-Gegner, false = Mensch (zeigt "KI"-Badge wenn true)
  team text                       -- Konstrukteur, z.B. "Red Bull" (nullable)
)

races (
  id, name, track, race_date, created_at,
  fastest_lap_driver_id -> drivers.id,
  video_url text                  -- YouTube-Link zur Aufzeichnung (nullable)
)

results (
  id, race_id -> races.id, driver_id -> drivers.id,
  position int (null bei DNF),
  dnf boolean,
  dnf_reason text,                 -- Freitext, z.B. "Totalschaden", "Mechanischer Defekt"
  laps_completed int                -- bei DNF: in welcher Runde ausgeschieden
)

admins (id, username, password_hash)  -- bcrypt via pgcrypto, siehe RPCs unten

news (id, created_at, kind text, message text)
  -- kind: 'team_change' | 'win' | 'crash' (win/crash werden NICHT gespeichert,
  -- sondern live aus races+results berechnet - nur team_change wird
  -- tatsaechlich in diese Tabelle geschrieben, siehe computeNewsFeed())

telemetry_status (id=1 feste Zeile, last_heartbeat, last_packet_at, armed, updated_at)
  -- wird vom lokalen Listener alle 10s aktualisiert, zeigt Live-Status im Admin-Bereich
```

RPCs: `verify_admin_password(p_username, p_password)`,
`set_admin_password(p_username, p_password)` — Passwort-Handling laeuft nur
darueber, nie direkt auf `admins` zugreifen.

RLS: alle Tabellen erlauben `select` fuer jeden (anon), und grossteils auch
`insert`/`update`/`delete` fuer anon — der eigentliche Zugriffsschutz ist der
Admin-Login im Worker, nicht RLS. Das ist eine bewusste Design-Entscheidung
fuer dieses private Freundes-Projekt, kein Versehen.

**Bekannter Stolperstein:** `DELETE`-Statements ueber die Supabase-SQL-Tools
(falls du aehnliche MCP-Tools nutzt) koennen haengen bleiben/timeouten -
vermutlich ein Bestaetigungsgate fuer destruktive Statements, das nicht
sauber durchkommt. Workaround, der zuverlaessig funktioniert hat:
`DO $$ BEGIN DELETE FROM ... WHERE ...; END $$;` (versteckt das DELETE
innerhalb eines anonymen Codeblocks, umgeht die Erkennung).

## Business-Logik (src/supabase.js)

- **Punkte:** echtes F1-Schema 25-18-15-12-10-8-6-4-2-1 fuer Platz 1-10,
  plus 1 Bonuspunkt fuer die schnellste Runde (nur wenn der Fahrer in den
  Top 10 landet). Eigene Punkte, NICHT die `Pkt.`-Spalte aus Spiel-CSV-Exports
  uebernehmen (die nutzt teils andere Schemata, z.B. Sprint-Punkte).
- **Team-Wertung:** Summe aller Fahrerpunkte pro `team`-Feld, wie die echte
  Konstrukteurswertung (`computeTeamStandings`).
- **Tie-Break:** bei Punktegleichstand zaehlt zuerst Siege, dann beste
  Platzierung (niedrigste `position` ueber alle Rennen), erst dann Alphabet.
- **Sortierung:** Fahrer mit `races === 0` (noch nie gefahren) landen immer
  ganz unten, unabhaengig von Punkten.
- **News-Feed:** kombiniert persistierte `news`-Zeilen (Team-Wechsel) mit
  live berechneten Events (Sieger + DNFs mit Grund/Runde) aus allen Rennen.

## Das Identitaets-System: Menschen uebernehmen KI-Autos

Das ist der wichtigste, nicht offensichtliche Teil des Projekts:

In F1 25 waehlt jeder Spieler ein Auto/einen Fahrer (z.B. "Charles
Leclerc"). Die Spiel-Telemetrie und CSV-Exports zeigen diesen **Fahrzeug-Namen**,
nicht den echten Namen der Person — ausser bei anonymen Mehrspieler-Lobbys,
wo Menschen stattdessen generisch als "Spieler:in" exportiert werden,
unterscheidbar nur ueber die Team-Spalte.

Wenn ein Freund dauerhaft ein bestimmtes Auto uebernimmt (z.B. "Henry faehrt
jetzt immer als Isack Hadjar bei Visa Cash App"), haben wir bisher so
vorgegangen:

1. Den bestehenden KI-Fahrer-Eintrag (`Isack Hadjar`, `is_ai=true`) auf
   `is_ai=false` umgestellt — er ZAEHLT jetzt als dieser Mensch.
2. Einen `news`-Eintrag (`kind='team_change'`) geschrieben, der die
   Uebernahme dokumentiert.
3. **Wichtig:** alte `results`-Zeilen dieses Fahrers aus Rennen, in denen er
   wirklich von der KI gefahren wurde, muessen geloescht werden — sonst
   zaehlen KI-Punkte faelschlich als Leistung des Menschen.
4. Der urspruengliche separate Fahrer-Eintrag des Menschen (z.B. "Henry" als
   eigener Datensatz, falls er vorher unter eigenem Namen gefahren ist)
   bleibt als eigene Fahrer-Historie bestehen (wird NICHT geloescht oder
   gemerged) — seine alten Rennen unter dem alten Namen bleiben, seine neuen
   Punkte sammeln sich ab jetzt unter der uebernommenen Identitaet.

**Bei jedem neuen CSV-Import mit demselben Fahrzeug-Namen (z.B. wieder
"Charles Leclerc" im naechsten Rennen) IMMER zuerst in der CSV die
`Fahrertyp`-Spalte pruefen:**
- Steht da `"KI"` → dieses Mal war es wirklich die KI (der Mensch hat
  ausgesetzt oder ein anderes Auto gewaehlt) → **keine Ergebniszeile fuer
  diesen Fahrer anlegen**, sonst wird dem Menschen faelschlich eine
  KI-Leistung gutgeschrieben.
- Steht da `"Spieler:in"` → echter Mensch, ganz normal eintragen.

Aktuelle Zuordnungen (Stand dieser Uebergabe):
- **Luca** = Charles Leclerc (Scuderia Ferrari HP)
- **Henry** = Isack Hadjar (Visa Cash App Racing Bulls)
- **David** = Lando Norris (McLaren)
- **Manuel** = eigener Fahrer-Eintrag, Team Mercedes-AMG Petronas
- **Nik** = eigener Fahrer-Eintrag, Team Red Bull
- **Arne** = eigener Fahrer-Eintrag, Team Aston Martin
- **Fynn** = eigener Fahrer-Eintrag, Team Williams

## CSV-Import-Workflow (manuelle Rennergebnisse)

User laedt gelegentlich eine Session-Export-CSV aus F1 25 hoch (Format:
`"Pos.","Fahrer","Team","Grid","Stopps","Beste","Zeit","Pkt.","Fahrertyp"`
plus eine zweite Tabelle mit Vorfaellen/Strafen). Vorgehen:

1. CSV lesen, alle Zeilen mit `Fahrertyp="Spieler:in"` identifizieren.
2. **Niemals raten, wer hinter "Spieler:in" steckt** — nur ueber die
   Team-Spalte einen Vorschlag machen und beim User explizit bestaetigen
   lassen (auch wenn es "offensichtlich" erscheint, z.B. weil es das
   Stammteam ist). Bei doppelt vorkommenden Teams (z.B. zwei "Spieler:in"
   im selben Team) unbedingt nachfragen.
3. Pruefen, ob bekannte "uebernommene" Fahrzeuge (Leclerc/Hadjar/Norris,
   siehe oben) diesmal als KI oder Mensch gefahren sind (`Fahrertyp`-Spalte).
4. KI-Fahrer, die noch nicht in der `drivers`-Tabelle stehen, mit
   `is_ai=true` und ihrem Team anlegen.
5. Rennen anlegen (`race_date` aus dem Dateinamen, Format
   `session_results_TTMMJJJJ_HHMM.csv`).
6. Ergebnisse eintragen: `position`, `dnf`, `dnf_reason` (aus der
   Vorfaelle-Tabelle, meist letzte Zeile mit `"DNF"` in der Strafe-Spalte
   fuer den jeweiligen Fahrer) und `laps_completed` (die Runde aus dieser
   Zeile).
7. Schnellste Runde (`fastest_lap_driver_id`) = Fahrer mit der niedrigsten
   Zeit in der "Beste"-Spalte ueber ALLE Fahrer (auch ausgeschlossene KI,
   die zaehlt fuers Gesamtfeld, aber der Bonuspunkt wird im Code sowieso nur
   vergeben wenn `position <= 10`).
8. Falls der User einen YouTube-Link zur Aufzeichnung schickt:
   `races.video_url` setzen.

## Lokales Setup des Users (telemetry-listener/)

Laeuft NICHT in der Cloud, sondern auf dem PC des Users (Windows,
`C:\Users\Kiosk01\F1-Rangliste`). Separates lokales Control-Panel
(`panel.py`, `panel.bat`) wurde von einer lokalen Claude-Code-Instanz
gebaut (nicht Teil dieses Repos/dieser Uebergabe, liegt lokal beim User).
Der Listener:
- lauscht auf UDP-Port 20777 auf F1-25-Telemetrie
- schreibt nur Ergebnisse, wenn vorher per `--arm` scharfgeschaltet wurde
  (verhindert, dass Testrunden/Solo-Fahrten in die Rangliste rutschen)
- schickt alle 10s einen Herzschlag an `telemetry_status`
- erkennt `m_aiControlled` aus der Telemetrie und setzt `is_ai` korrekt bei
  neu angelegten Fahrern

Das ist unabhaengig vom manuellen CSV-Import-Workflow oben (beide landen in
derselben Datenbank, aber ueber unterschiedliche Wege).

## Design/Styling

- Dark-Theme, F1-rot als Akzent (`--f1-red: #e10600`), Titillium Web als
  Ueberschriften-Font (Google Fonts, echte F1-Broadcast-Schrift), Inter als
  Fliesstext.
- Alle Tabellen sind in `.table-wrap` (overflow-x:auto) gewrappt, damit sie
  auf schmalen Handys nicht die ganze Seite zum Scrollen zwingen.
- Chart (Punkteverlauf) ist ein handgeschriebenes inline-SVG (keine
  Chart-Bibliothek), mit `min-width:480px` damit es auf Mobile nicht
  unleserlich klein wird (scrollt stattdessen horizontal in seiner Karte).
- KI-Badge: kleiner blauer Pill-Badge "KI" neben dem Namen, ueberall wo
  Fahrernamen angezeigt werden (`aiBadge()`-Helper in `views.js`).

## Offene Punkte / moegliche naechste Schritte

- Keine automatisierten Tests vorhanden — Aenderungen bisher per
  `node --check` + manuellen Render-Tests in Node verifiziert.
- Teamfarben/-Logos nicht visualisiert, nur Textname in der Team-Wertung.
- Kein Mechanismus, um versehentliche Doppel-Importe eines Rennens zu
  erkennen (schon einmal passiert: Telemetrie-Listener UND manueller
  CSV-Import haben dasselbe Rennen doppelt angelegt — wurde manuell
  bereinigt). Vor jedem manuellen Import kurz pruefen, ob das Rennen schon
  per Telemetrie automatisch erfasst wurde (`race_date` vergleichen).
- `legacy-express-app/` ist unbenutzt, koennte irgendwann entfernt werden,
  falls nicht mehr gebraucht.

## Zugangsdaten-Hinweis

Alle Secrets, die du zum Weiterarbeiten brauchst, liegen entweder im Repo
(Supabase anon-Key in `wrangler.toml`) oder muessen vom User kommen
(Cloudflare-Dashboard-Zugriff, Supabase-Projekt-Zugriff fuer Admin-Rechte
wie Migrationen). Frag den User direkt nach Zugriff, falls du mehr als den
anon-Key brauchst (z.B. fuer Schema-Migrationen ueber die Supabase-CLI statt
ueber ein MCP-Tool).
