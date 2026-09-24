# F1 Rangliste – Cloudflare Worker + Supabase

Diese Variante der App läuft als Cloudflare Worker (Hono) und nutzt
Supabase (Postgres) statt SQLite als Datenbank. Funktional identisch zur
Node/Express-Version im Projekt-Root (gleiche Punkteregeln, gleicher
Admin-Bereich, gleiches Design).

## Bereits erledigt

- Supabase-Projekt `f1-rangliste` wurde angelegt (Organisation "Curseforge Dev").
- Schema (`drivers`, `races`, `results`, `admins`) inkl. Row-Level-Security
  und den Postgres-Funktionen `verify_admin_password` / `set_admin_password`
  ist bereits per Migration eingespielt.
- Ein Admin-Zugang ist angelegt: Benutzer `admin`, Passwort `admin123`
  (bitte nach dem ersten Login über den Admin-Bereich ändern).
- `wrangler.toml` ist mit der Supabase-URL und dem öffentlichen anon-Key
  vorkonfiguriert (der anon-Key ist bewusst öffentlich, der Zugriffsschutz
  läuft über den Admin-Login im Worker, nicht über den Key selbst).

## Warum es noch keine Live-Vorschau gibt

In dieser Sandbox-Umgebung sind ausgehende Verbindungen zu
`api.cloudflare.com` und `*.supabase.co` per Netzwerk-Policy blockiert.
Außerdem stellt der verbundene Cloudflare-MCP-Connector keine Funktion zum
Deployen eines Workers bereit (nur Lesen/Verwalten von D1, KV, R2,
Hyperdrive und vorhandenen Workern). Ein `wrangler deploy` kann daher aus
dieser Session heraus nicht ausgeführt werden.

## Selbst deployen (2 Minuten)

```bash
cd worker
npm install
npx wrangler login          # einmalig im Browser einloggen
npx wrangler secret put SESSION_SECRET   # einen zufälligen String eingeben
npx wrangler deploy
```

Danach bekommst du eine `https://f1-rangliste.<dein-worker-subdomain>.workers.dev`
URL als Vorschau.

## Alternative: Netzwerkzugriff in dieser Session erlauben

Falls du stattdessen möchtest, dass ich das Deployment direkt aus dieser
Session heraus mache: In den Umgebungseinstellungen (Cloud-Umgebungs-Menü
in der Titelleiste dieser Session → "Edit") den Netzwerkzugriff erweitern
(oder `api.cloudflare.com` als erlaubte Domain hinzufügen) und dort einen
`CLOUDFLARE_API_TOKEN` (Berechtigung "Edit Cloudflare Workers") als
Umgebungsvariable hinterlegen. Dann kann ich `npx wrangler deploy` von hier
aus laufen lassen.

## Lokale Entwicklung

```bash
npm run dev
```

Startet `wrangler dev` auf `http://localhost:8787`. Benötigt ebenfalls
Netzwerkzugriff auf `*.supabase.co`, sonst schlagen alle Datenbank-Anfragen
fehl.
