const STYLE = `
:root {
  --f1-red: #e10600; --f1-black: #15151e; --f1-dark: #1f1f2b; --f1-gray: #38383f;
  --f1-text: #f4f4f4; --f1-muted: #9a9aa5; --gold: #ffd700; --silver: #c0c0c0; --bronze: #cd7f32;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(180deg, var(--f1-black) 0%, #0c0c12 100%); color: var(--f1-text); min-height: 100vh; }
header.topbar { background: var(--f1-black); border-bottom: 4px solid var(--f1-red); padding: 18px 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
header.topbar h1 { margin: 0; font-size: 1.6rem; letter-spacing: 1px; text-transform: uppercase; }
header.topbar h1 span { color: var(--f1-red); }
nav a, header.topbar a.btn { color: var(--f1-text); text-decoration: none; margin-left: 14px; font-weight: 600; }
.btn { display: inline-block; background: var(--f1-red); color: #fff !important; padding: 8px 16px; border-radius: 4px;
  border: none; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
.btn.secondary { background: var(--f1-gray); }
.btn.danger { background: #7a1010; }
main { max-width: 1000px; margin: 0 auto; padding: 24px; }
.card { background: var(--f1-dark); border-radius: 8px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--f1-gray); }
th { color: var(--f1-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
tr.pos-1 td.pos { color: var(--gold); font-weight: 800; }
tr.pos-2 td.pos { color: var(--silver); font-weight: 800; }
tr.pos-3 td.pos { color: var(--bronze); font-weight: 800; }
.driver-color { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
.points { font-weight: 800; color: var(--f1-red); }
a.race-link { color: var(--f1-text); font-weight: 600; }
form.inline { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 10px; }
input, select { background: #0f0f16; border: 1px solid var(--f1-gray); color: var(--f1-text); padding: 8px 10px; border-radius: 4px; }
.error { background: #3a1010; border: 1px solid var(--f1-red); color: #ffbdbd; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
.muted { color: var(--f1-muted); font-size: 0.9rem; }
.results-form td input[type="number"] { width: 70px; }
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

export function renderIndex({ standings, races, isAdmin }) {
  const rows = standings
    .map(
      (s, i) => `
    <tr class="pos-${i + 1}">
      <td class="pos">${i + 1}</td>
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
        : `<table>
      <thead><tr><th>#</th><th>Fahrer</th><th>Rennen</th><th>Siege</th><th>Podien</th><th>Punkte</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
    }
  </div>
  <div class="card">
    <h2>Rennen</h2>
    ${
      races.length === 0
        ? `<p class="muted">Noch keine Rennen eingetragen.</p>`
        : `<table><thead><tr><th>Datum</th><th>Rennen</th><th>Strecke</th></tr></thead><tbody>${raceRows}</tbody></table>`
    }
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
    <tr>
      <td>${r.dnf ? 'DNF' : r.position}</td>
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
        : `<table><thead><tr><th>Platz</th><th>Fahrer</th><th>Punkte</th></tr></thead><tbody>${rows}</tbody></table>`
    }
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

export function renderAdmin({ drivers, races, passwordError }) {
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
  <div class="grid-2">
    <div class="card">
      <h2>Fahrer</h2>
      <table><thead><tr><th>Name</th><th>Farbe</th><th></th></tr></thead><tbody>${driverRows}</tbody></table>
      <form class="inline" action="/admin/drivers" method="POST">
        <input type="text" name="name" placeholder="Fahrername" required />
        <input type="color" name="color" value="#e10600" />
        <button class="btn" type="submit">Fahrer hinzufuegen</button>
      </form>
    </div>
    <div class="card">
      <h2>Rennen</h2>
      <table><thead><tr><th>Rennen</th><th>Datum</th><th></th></tr></thead><tbody>${raceRows}</tbody></table>
      <form class="inline" action="/admin/races" method="POST">
        <input type="text" name="name" placeholder="Rennname (z.B. GP Spa)" required />
        <input type="text" name="track" placeholder="Strecke" />
        <input type="date" name="race_date" />
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
        <table><thead><tr><th>Fahrer</th><th>Platz</th><th>DNF</th><th>Schnellste Runde</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <br /><button class="btn" type="submit">Ergebnisse speichern</button>
      </form>`
    }
  </div>
  <a href="/admin">&larr; Zurueck zum Admin-Bereich</a>`;
  return layout({ title: 'Ergebnisse: ' + race.name, isAdmin: true, body });
}
