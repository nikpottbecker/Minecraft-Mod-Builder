const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#e10600',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    track TEXT,
    race_date TEXT,
    fastest_lap_driver_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (fastest_lap_driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    position INTEGER,
    dnf INTEGER NOT NULL DEFAULT 0,
    UNIQUE(race_id, driver_id),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`);

// Seed a default admin user if none exists yet (change password after first login!)
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
if (adminCount === 0) {
  const defaultUser = process.env.ADMIN_USER || 'admin';
  const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(defaultUser, hash);
  console.log(`Admin-Zugang angelegt -> Benutzer: "${defaultUser}", Passwort: "${defaultPass}" (bitte nach dem ersten Login aendern!)`);
}

// F1-style points table for finishing positions 1-10
const POINTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
const FASTEST_LAP_BONUS = 1; // only awarded if driver finishes in top 10

function pointsForPosition(position) {
  if (!position) return 0;
  return POINTS[position] || 0;
}

function getStandings() {
  const drivers = db.prepare('SELECT * FROM drivers ORDER BY name').all();
  const races = db.prepare('SELECT * FROM races').all();
  const results = db.prepare('SELECT * FROM results').all();

  const standings = drivers.map((d) => ({
    ...d,
    points: 0,
    wins: 0,
    podiums: 0,
    races: 0,
  }));

  const byId = Object.fromEntries(standings.map((s) => [s.id, s]));

  for (const r of results) {
    const s = byId[r.driver_id];
    if (!s) continue;
    s.races += 1;
    if (!r.dnf) {
      let pts = pointsForPosition(r.position);
      const race = races.find((ra) => ra.id === r.race_id);
      if (race && race.fastest_lap_driver_id === r.driver_id && r.position && r.position <= 10) {
        pts += FASTEST_LAP_BONUS;
      }
      s.points += pts;
      if (r.position === 1) s.wins += 1;
      if (r.position && r.position <= 3) s.podiums += 1;
    }
  }

  standings.sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  return standings;
}

module.exports = { db, POINTS, FASTEST_LAP_BONUS, pointsForPosition, getStandings };
