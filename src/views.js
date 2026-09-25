const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --f1-red: #e10600; --f1-red-dark: #a30500; --f1-black: #0d0d12; --f1-dark: #1a1a24; --f1-dark-2: #14141d;
  --f1-gray: #34343f; --f1-gray-light: #46465500;
  --f1-text: #f4f4f6; --f1-muted: #9a9aa8; --gold: #ffd23f; --silver: #d5d8de; --bronze: #e0965a;
  --accent-blue: #4fb0e8;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background:
    radial-gradient(circle at 15% 0%, rgba(225,6,0,0.10) 0%, transparent 45%),
    linear-gradient(180deg, var(--f1-black) 0%, #08080c 100%);
  color: var(--f1-text); min-height: 100vh; }
h1, h2, h3 { font-family: "Titillium Web", "Inter", sans-serif; }

header.topbar {
  background: linear-gradient(90deg, #000000 0%, var(--f1-black) 60%);
  border-bottom: 3px solid var(--f1-red);
  box-shadow: 0 2px 0 rgba(225,6,0,0.35), 0 4px 20px rgba(0,0,0,0.5);
  padding: 18px 28px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  position: sticky; top: 0; z-index: 20; backdrop-filter: blur(6px);
}
header.topbar h1 { margin: 0; font-size: 1.5rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
header.topbar h1 span { color: var(--f1-red); text-shadow: 0 0 18px rgba(225,6,0,0.55); }
nav a, header.topbar a.btn { color: var(--f1-text); text-decoration: none; margin-left: 16px; font-weight: 600; font-size: 0.9rem;
  padding-bottom: 2px; border-bottom: 2px solid transparent; transition: border-color 0.15s, color 0.15s; }
nav a:hover { border-color: var(--f1-red); color: #fff; }

.btn { display: inline-block; background: linear-gradient(180deg, #ff1a10 0%, var(--f1-red) 100%);
  color: #fff !important; padding: 9px 18px; border-radius: 6px;
  border: none; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.6px;
  box-shadow: 0 2px 8px rgba(225,6,0,0.35); transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(225,6,0,0.5); filter: brightness(1.05); }
.btn:active { transform: translateY(0); }
.btn.secondary { background: linear-gradient(180deg, #4a4a58 0%, var(--f1-gray) 100%); box-shadow: none; }
.btn.danger { background: linear-gradient(180deg, #a3181f 0%, #7a1010 100%); box-shadow: none; }

main { max-width: 1040px; margin: 0 auto; padding: 28px 24px 60px; }
@media (max-width: 480px) {
  header.topbar { padding: 14px 16px; }
  header.topbar h1 { font-size: 1.15rem; }
  nav a, header.topbar a.btn, header.topbar form { margin-left: 8px; }
  main { padding: 16px 14px 40px; }
  .card { padding: 16px; }
}

.card { background: linear-gradient(180deg, var(--f1-dark) 0%, var(--f1-dark-2) 100%);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 22px; margin-bottom: 22px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
.card h2 { margin: 0 0 16px; font-size: 1.15rem; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px; }
.card h2::before { content: ''; width: 4px; height: 18px; background: var(--f1-red); border-radius: 2px; display: inline-block; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 11px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
th { color: var(--f1-muted); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1.2px; font-weight: 700; }
tbody tr { transition: background 0.12s ease; }
tbody tr:hover { background: rgba(255,255,255,0.035); }
tbody tr:nth-child(even) { background: rgba(255,255,255,0.015); }

.pos-badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
  border-radius: 50%; font-weight: 800; font-size: 0.82rem; background: rgba(255,255,255,0.06); color: var(--f1-text); }
tr.pos-1 .pos-badge { background: var(--gold); color: #241a00; box-shadow: 0 0 10px rgba(255,210,63,0.5); }
tr.pos-2 .pos-badge { background: var(--silver); color: #1c1c22; }
tr.pos-3 .pos-badge { background: var(--bronze); color: #251200; }
tr.pos-1 td, tr.pos-2 td, tr.pos-3 td { font-weight: 700; }

.driver-color { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 9px;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.06); }
.points { font-weight: 800; color: var(--f1-red); font-variant-numeric: tabular-nums; }
a.race-link { color: var(--f1-text); font-weight: 600; text-decoration: none; border-bottom: 1px solid var(--f1-gray); transition: border-color 0.12s, color 0.12s; }
a.race-link:hover { color: var(--f1-red); border-color: var(--f1-red); }

form.inline { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
input, select { background: #0c0c12; border: 1px solid var(--f1-gray); color: var(--f1-text); padding: 9px 11px;
  border-radius: 6px; font-family: inherit; transition: border-color 0.12s; }
input:focus, select:focus { outline: none; border-color: var(--f1-red); }
.error { background: rgba(163,5,0,0.18); border: 1px solid var(--f1-red); color: #ffb3ac; padding: 11px 14px; border-radius: 8px; margin-bottom: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
.muted { color: var(--f1-muted); font-size: 0.9rem; }
.results-form td input[type="number"] { width: 70px; }
.table-wrap { overflow-x: auto; }
.chart-wrap { overflow-x: auto; }
.chart-wrap svg { display: block; width: 100%; min-width: 480px; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 12px 18px; margin-top: 14px; }
.chart-legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--f1-muted); }
.chart-legend .swatch { width: 10px; height: 10px; border-radius: 50%; }
.wide-input { min-width: 220px; flex: 1 1 220px; }

.replay-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.replay-card { display: block; color: var(--f1-text); text-decoration: none; background: var(--f1-dark-2);
  border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; position: relative; }
.replay-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.45); border-color: var(--f1-red); }
.replay-card::after { content: '▶'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);
  width: 42px; height: 42px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 0.9rem; opacity: 0; transition: opacity 0.15s ease; }
.replay-card:hover::after { opacity: 1; }
.replay-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #0a0a10; }
.replay-card .replay-info { padding: 11px 13px; }
.replay-card .replay-info strong { display: block; font-size: 0.92rem; }
.replay-card .replay-info span { color: var(--f1-muted); font-size: 0.78rem; }

.highlights { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.highlights li { padding: 10px 14px; border-radius: 8px; background: var(--f1-dark-2); border-left: 3px solid var(--f1-gray); font-size: 0.92rem; }
.highlights li.dnf { border-left-color: #e05a4a; }
.highlights li.fastest { border-left-color: var(--accent-blue); }
.highlights li.winner { border-left-color: var(--gold); }

.status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.status-tile { background: var(--f1-dark-2); border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.06); }
.status-tile .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
.status-tile .dot.on { background: #2ecc71; box-shadow: 0 0 8px rgba(46,204,113,0.7); }
.status-tile .dot.off { background: #5a5a66; }
.status-tile .label { display: block; color: var(--f1-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; }

@media (max-width: 480px) {
  .wide-input { min-width: 0; flex: 1 1 100%; }
  form.inline { flex-direction: column; align-items: stretch; }
  form.inline input, form.inline button { width: 100%; }
}
`;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function layout({ title = 'F1 Rangliste', isAdmin = false, body = '' }) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header class="topbar">
  <h1><span>F1</span> Freunde-Rangliste</h1>
  <nav>
    <a href="/">Rangliste</a>
    ${
      isAdmin
        ? `<a href="/admin">Admin</a>
           <form action="/admin/logout" method="POST" style="display:inline">
             <button class="btn secondary" type="submit">Logout</button>
           </form>`
        : `<a href="/admin/login">Admin-Login</a>`
    }
  </nav>
</header>
<main>${body}</main>
</body>
</html>`;
}

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

function renderReplaysGallery(races) {
  const withVideo = races.filter((r) => r.video_url);
  if (withVideo.length === 0) {
    return `<p class="muted">Noch keine Rennaufzeichnungen verlinkt.</p>`;
  }
  const cards = withVideo
    .map((r) => {
      const vid = youtubeId(r.video_url);
      const thumb = vid
        ? `<img src="https://img.youtube.com/vi/${esc(vid)}/hqdefault.jpg" alt="" loading="lazy" />`
        : `<div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--f1-muted);">&#9654;</div>`;
      return `<a class="replay-card" href="${esc(r.video_url)}" target="_blank" rel="noopener">
        ${thumb}
        <div class="replay-info">
          <strong>${esc(r.name)}</strong>
          <span>${esc(r.race_date || '')}${r.track ? ' · ' + esc(r.track) : ''}</span>
        </div>
      </a>`;
    })
    .join('');
  return `<div class="replay-grid">${cards}</div>`;
}

function renderHighlights(race, results) {
  const items = [];

  const winner = results.find((r) => !r.dnf && r.position === 1);
  if (winner) {
    items.push({ cls: 'winner', text: `🏆 ${winner.driver_name} gewinnt das Rennen.` });
  }

  const fastest = results.find((r) => r.driver_id === race.fastest_lap_driver_id);
  if (fastest) {
    items.push({ cls: 'fastest', text: `⚡ ${fastest.driver_name} fährt die schnellste Runde.` });
  }

  for (const r of results) {
    if (!r.dnf) continue;
    const lapText = r.laps_completed ? `in Runde ${r.laps_completed} ` : '';
    const reasonText = r.dnf_reason ? `wegen ${r.dnf_reason}` : '(Grund unbekannt)';
    items.push({ cls: 'dnf', text: `💥 ${r.driver_name} scheidet ${lapText}aus ${reasonText}.` });
  }

  if (items.length === 0) {
    return `<p class="muted">Noch keine Highlights für dieses Rennen.</p>`;
  }

  return `<ul class="highlights">${items
    .map((i) => `<li class="${i.cls}">${i.text}</li>`)
    .join('')}</ul>`;
}

export function renderTelemetryStatus(status) {
  const now = Date.now();
  const secondsSince = (iso) => (iso ? (now - new Date(iso).getTime()) / 1000 : Infinity);

  const listenerOn = secondsSince(status?.last_heartbeat) < 30;
  const gameOn = secondsSince(status?.last_packet_at) < 15;
  const armed = !!status?.armed;

  const tile = (on, label, extra) =>
    `<div class="status-tile"><span class="dot ${on ? 'on' : 'off'}"></span>${extra || (on ? 'Ja' : 'Nein')}
      <span class="label">${esc(label)}</span></div>`;

  return `
  <div class="status-grid">
    ${tile(listenerOn, 'Listener aktiv')}
    ${tile(gameOn, 'Verbindung zum Spiel')}
    ${tile(armed, 'Naechstes Rennen scharf')}
  </div>`;
}

function renderPointsChart(progression) {
  const { races: orderedRaces, drivers } = progression;
  if (orderedRaces.length < 2) {
    return `<p class="muted">Sobald mindestens zwei Rennen eingetragen sind, erscheint hier der Punkteverlauf.</p>`;
  }

  const width = 680;
  const height = 260;
  const padLeft = 34;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxPoints = Math.max(1, ...drivers.map((d) => d.series[d.series.length - 1] || 0));
  const yMax = Math.ceil((maxPoints * 1.1) / 10) * 10 || 10;

  const x = (i) => padLeft + (orderedRaces.length === 1 ? 0 : (i / (orderedRaces.length - 1)) * plotW);
  const y = (v) => padTop + plotH - (v / yMax) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const val = Math.round(yMax * f);
      const yy = y(val);
      return `<line x1="${padLeft}" y1="${yy}" x2="${width - padRight}" y2="${yy}" stroke="var(--f1-gray)" stroke-width="1" />
        <text x="${padLeft - 8}" y="${yy + 4}" text-anchor="end" font-size="10" fill="var(--f1-muted)">${val}</text>`;
    })
    .join('');

  const xLabels = orderedRaces
    .map((r, i) => {
      if (orderedRaces.length > 12 && i % Math.ceil(orderedRaces.length / 12) !== 0) return '';
      return `<text x="${x(i)}" y="${height - 6}" text-anchor="middle" font-size="10" fill="var(--f1-muted)">${i + 1}</text>`;
    })
    .join('');

  const lines = drivers
    .map((d) => {
      const points = d.series.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      const dots = d.series
        .map(
          (v, i) =>
            `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="${esc(d.color)}"><title>${esc(d.name)} · ${esc(
              orderedRaces[i].name
            )}: ${v} Punkte</title></circle>`
        )
        .join('');
      return `<polyline points="${points}" fill="none" stroke="${esc(d.color)}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />${dots}`;
    })
    .join('');

  const legend = drivers
    .map(
      (d) =>
        `<span><span class="swatch" style="background:${esc(d.color)}"></span>${esc(d.name)}</span>`
    )
    .join('');

  return `
  <div class="chart-wrap">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Punkteverlauf pro Fahrer">
      ${gridLines}
      ${lines}
      ${xLabels}
    </svg>
  </div>
  <div class="chart-legend">${legend}</div>
  <p class="muted" style="margin-top:8px;">X-Achse: Rennen in chronologischer Reihenfolge (1 = erstes Rennen)</p>`;
}

export function renderIndex({ standings, races, progression, isAdmin }) {
  const rows = standings
    .map(
      (s, i) => `
    <tr class="pos-${i + 1}">
      <td><span class="pos-badge">${i + 1}</span></td>
      <td><span class="driver-color" style="background:${esc(s.color)}"></span>${esc(s.name)}</td>
      <td>${s.races}</td>
      <td>${s.wins}</td>
      <td>${s.podiums}</td>
      <td class="points">${s.points}</td>
    </tr>`
    )
    .join('');

  const raceRows = races
    .map(
      (r) => `
    <tr>
      <td>${esc(r.race_date || '-')}</td>
      <td><a class="race-link" href="/races/${r.id}">${esc(r.name)}</a></td>
      <td>${esc(r.track || '-')}</td>
    </tr>`
    )
    .join('');

  const body = `
  <div class="card">
    <h2>Fahrerwertung</h2>
    ${
      standings.length === 0
        ? `<p class="muted">Noch keine Fahrer angelegt. ${isAdmin ? '<a href="/admin">Jetzt im Admin-Bereich anlegen</a>.' : ''}</p>`
        : `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Fahrer</th><th>Rennen</th><th>Siege</th><th>Podien</th><th>Punkte</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`
    }
  </div>
  <div class="card">
    <h2>Punkteverlauf</h2>
    ${renderPointsChart(progression)}
  </div>
  <div class="card">
    <h2>Rennen</h2>
    ${
      races.length === 0
        ? `<p class="muted">Noch keine Rennen eingetragen.</p>`
        : `<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Rennen</th><th>Strecke</th></tr></thead><tbody>${raceRows}</tbody></table></div>`
    }
  </div>
  <div class="card">
    <h2>Rennaufzeichnungen</h2>
    ${renderReplaysGallery(races)}
  </div>`;
  return layout({ title: 'F1 Rangliste', isAdmin, body });
}

export function renderRace({ race, results, POINTS, FASTEST_LAP_BONUS, isAdmin }) {
  const rows = results
    .map((r) => {
      let pts = 0;
      if (!r.dnf) {
        pts = POINTS[r.position] || 0;
        if (race.fastest_lap_driver_id === r.driver_id && r.position && r.position <= 10) pts += FASTEST_LAP_BONUS;
      }
      return `
    <tr class="${!r.dnf && r.position <= 3 ? 'pos-' + r.position : ''}">
      <td>${r.dnf ? '<span class="muted">DNF</span>' : `<span class="pos-badge">${r.position}</span>`}</td>
      <td><span class="driver-color" style="background:${esc(r.driver_color)}"></span>${esc(r.driver_name)}
        ${race.fastest_lap_driver_id === r.driver_id ? '<span class="muted">(schnellste Runde)</span>' : ''}
      </td>
      <td class="points">${pts}</td>
    </tr>`;
    })
    .join('');

  const body = `
  <div class="card">
    <h2>${esc(race.name)}</h2>
    <p class="muted">${esc(race.track || '')} ${race.race_date ? '· ' + esc(race.race_date) : ''}</p>
    ${
      results.length === 0
        ? `<p class="muted">Noch keine Ergebnisse fuer dieses Rennen.</p>`
        : `<div class="table-wrap"><table><thead><tr><th>Platz</th><th>Fahrer</th><th>Punkte</th></tr></thead><tbody>${rows}</tbody></table></div>`
    }
    ${
      race.video_url
        ? `<p style="margin-top:16px;"><a class="race-link" href="${esc(race.video_url)}" target="_blank" rel="noopener">&#9654; Rennaufzeichnung ansehen</a></p>`
        : ''
    }
  </div>
  <div class="card">
    <h2>Highlights</h2>
    ${renderHighlights(race, results)}
  </div>
  <a href="/">&larr; Zurueck zur Rangliste</a>`;
  return layout({ title: race.name, isAdmin, body });
}

export function renderLogin({ error }) {
  const body = `
  <div class="card" style="max-width:400px;margin:40px auto;">
    <h2>Admin-Login</h2>
    ${error ? `<div class="error">${esc(error)}</div>` : ''}
    <form method="POST" action="/admin/login">
      <div style="margin-bottom:12px;">
        <label>Benutzername</label><br />
        <input type="text" name="username" required style="width:100%;" />
      </div>
      <div style="margin-bottom:16px;">
        <label>Passwort</label><br />
        <input type="password" name="password" required style="width:100%;" />
      </div>
      <button class="btn" type="submit">Einloggen</button>
    </form>
  </div>`;
  return layout({ title: 'Admin-Login', isAdmin: false, body });
}

export function renderAdmin({ drivers, races, passwordError, telemetryStatus }) {
  const driverRows = drivers
    .map(
      (d) => `
    <tr>
      <td>${esc(d.name)}</td>
      <td><span class="driver-color" style="background:${esc(d.color)}"></span></td>
      <td><form action="/admin/drivers/${d.id}/delete" method="POST" onsubmit="return confirm('Fahrer wirklich loeschen?');">
        <button class="btn danger" type="submit">Loeschen</button></form></td>
    </tr>`
    )
    .join('');

  const raceRows = races
    .map(
      (r) => `
    <tr>
      <td><a class="race-link" href="/admin/races/${r.id}">${esc(r.name)}</a></td>
      <td>${esc(r.race_date || '-')}</td>
      <td><form action="/admin/races/${r.id}/delete" method="POST" onsubmit="return confirm('Rennen wirklich loeschen?');">
        <button class="btn danger" type="submit">Loeschen</button></form></td>
    </tr>`
    )
    .join('');

  const body = `
  <div class="card">
    <h2>Telemetrie-Status</h2>
    ${renderTelemetryStatus(telemetryStatus)}
  </div>
  <div class="grid-2">
    <div class="card">
      <h2>Fahrer</h2>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Farbe</th><th></th></tr></thead><tbody>${driverRows}</tbody></table></div>
      <form class="inline" action="/admin/drivers" method="POST">
        <input type="text" name="name" placeholder="Fahrername" required />
        <input type="color" name="color" value="#e10600" />
        <button class="btn" type="submit">Fahrer hinzufuegen</button>
      </form>
    </div>
    <div class="card">
      <h2>Rennen</h2>
      <div class="table-wrap"><table><thead><tr><th>Rennen</th><th>Datum</th><th></th></tr></thead><tbody>${raceRows}</tbody></table></div>
      <form class="inline" action="/admin/races" method="POST">
        <input type="text" name="name" placeholder="Rennname (z.B. GP Spa)" required />
        <input type="text" name="track" placeholder="Strecke" />
        <input type="date" name="race_date" />
        <input type="text" name="video_url" class="wide-input" placeholder="YouTube-Link (optional)" />
        <button class="btn" type="submit">Rennen anlegen</button>
      </form>
    </div>
  </div>
  <div class="card">
    <h2>Passwort aendern</h2>
    ${passwordError ? `<div class="error">${esc(passwordError)}</div>` : ''}
    <form action="/admin/password" method="POST" class="inline">
      <input type="password" name="current_password" placeholder="Aktuelles Passwort" required />
      <input type="password" name="new_password" placeholder="Neues Passwort" required minlength="4" />
      <button class="btn" type="submit">Aendern</button>
    </form>
  </div>`;
  return layout({ title: 'Admin', isAdmin: true, body });
}

export function renderAdminRace({ race, drivers, resultsByDriver }) {
  const rows = drivers
    .map((d) => {
      const r = resultsByDriver[d.id];
      return `
    <tr>
      <td><span class="driver-color" style="background:${esc(d.color)}"></span>${esc(d.name)}</td>
      <td><input type="number" min="1" max="99" name="position_${d.id}" value="${r && r.position ? r.position : ''}" /></td>
      <td><input type="checkbox" name="dnf_${d.id}" ${r && r.dnf ? 'checked' : ''} /></td>
      <td><input type="radio" name="fastest_lap_driver_id" value="${d.id}" ${race.fastest_lap_driver_id === d.id ? 'checked' : ''} /></td>
    </tr>`;
    })
    .join('');

  const body = `
  <div class="card">
    <h2>Ergebnisse eintragen: ${esc(race.name)}</h2>
    <p class="muted">${esc(race.track || '')} ${race.race_date ? '· ' + esc(race.race_date) : ''}</p>
    ${
      drivers.length === 0
        ? `<p class="muted">Lege zuerst Fahrer im <a href="/admin">Admin-Bereich</a> an.</p>`
        : `<form action="/admin/races/${race.id}/results" method="POST" class="results-form">
        <div class="table-wrap"><table><thead><tr><th>Fahrer</th><th>Platz</th><th>DNF</th><th>Schnellste Runde</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
        <div class="row" style="margin-top:14px;">
          <label>YouTube-Link zur Aufzeichnung:<br />
            <input type="text" name="video_url" class="wide-input" style="display:block;width:100%;max-width:420px;" value="${esc(race.video_url || '')}" />
          </label>
        </div>
        <br /><button class="btn" type="submit">Ergebnisse speichern</button>
      </form>`
    }
  </div>
  <a href="/admin">&larr; Zurueck zum Admin-Bereich</a>`;
  return layout({ title: 'Ergebnisse: ' + race.name, isAdmin: true, body });
}
