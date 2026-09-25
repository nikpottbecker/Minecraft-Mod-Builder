# F1 Rangliste – Cloudflare Worker + Supabase

Diese App läuft als Cloudflare Worker (Hono) und nutzt Supabase (Postgres)
als Datenbank. Der Worker-Code liegt bewusst im **Repo-Root** (`wrangler.toml`,
`src/`, `package.json`), damit Cloudflare Workers Builds ihn ohne
"Root directory"-Einstellung findet. Die ursprüngliche Node/Express +
SQLite-Version (funktional identisch, aber ohne Cloudflare/Supabase) liegt
zum Vergleich in `legacy-express-app/`.

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
npm install
npx wrangler login          # einmalig im Browser einloggen
npx wrangler secret put SESSION_SECRET   # einen zufälligen String eingeben
npx wrangler deploy
```

`wrangler.toml` enthält bereits eine `routes`-Zeile für die Custom Domain
**`f1.homelab.ptbrnetwork.com`**. Da `ptbrnetwork.com` als Zone in
demselben Cloudflare-Account liegt, legt `wrangler deploy` den DNS-Eintrag
und die Custom-Domain-Bindung automatisch mit an – danach ist die Seite
sofort unter `https://f1.homelab.ptbrnetwork.com` erreichbar (zusätzlich
zur Standard-URL `https://f1-rangliste.<dein-worker-subdomain>.workers.dev`).

Falls die Subdomain doch anders heißen soll, einfach das `pattern` in
`wrangler.toml` vor dem Deploy anpassen.

## Cloudflare Workers Builds (Git-Integration)

Falls der Worker über "Import a repository" mit GitHub verbunden ist:
- **Root directory / Path:** leer lassen bzw. `/` (Default) – der Code liegt
  jetzt absichtlich im Repo-Root, genau dort, wo Cloudflare Workers Builds
  standardmäßig baut.
- **Build command:** `npm install && npx wrangler deploy`
- **Branch:** `main` (oder der Branch, den du verbunden hast)
- Secret `SESSION_SECRET` unter Settings → Variables and Secrets setzen.

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
