require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { db, getStandings, pointsForPosition, POINTS, FASTEST_LAP_BONUS } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-please-super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8h
  })
);

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

app.use((req, res, next) => {
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  next();
});

// ---------- Public routes ----------

app.get('/', (req, res) => {
  const standings = getStandings();
  const races = db
    .prepare('SELECT * FROM races ORDER BY date(race_date) DESC, id DESC')
    .all();
  res.render('index', { standings, races });
});

app.get('/races/:id', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(req.params.id);
  if (!race) return res.status(404).send('Rennen nicht gefunden');
  const results = db
    .prepare(
      `SELECT results.*, drivers.name AS driver_name, drivers.color AS driver_color
       FROM results
       JOIN drivers ON drivers.id = results.driver_id
       WHERE results.race_id = ?
       ORDER BY (results.dnf = 1) ASC, results.position ASC`
    )
    .all(race.id);
  res.render('race', { race, results, POINTS, FASTEST_LAP_BONUS });
});

// ---------- Admin auth ----------

app.get('/admin/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.render('login', { error: 'Benutzername oder Passwort ist falsch.' });
  }
  req.session.isAdmin = true;
  req.session.adminUsername = admin.username;
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ---------- Admin area ----------

app.get('/admin', requireAdmin, (req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers ORDER BY name').all();
  const races = db.prepare('SELECT * FROM races ORDER BY date(race_date) DESC, id DESC').all();
  res.render('admin', { drivers, races });
});

// Drivers CRUD
app.post('/admin/drivers', requireAdmin, (req, res) => {
  const { name, color } = req.body;
  if (name && name.trim()) {
    try {
      db.prepare('INSERT INTO drivers (name, color) VALUES (?, ?)').run(
        name.trim(),
        color || '#e10600'
      );
    } catch (e) {
      // ignore duplicate name errors
    }
  }
  res.redirect('/admin');
});

app.post('/admin/drivers/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

// Races CRUD
app.post('/admin/races', requireAdmin, (req, res) => {
  const { name, track, race_date } = req.body;
  if (name && name.trim()) {
    db.prepare('INSERT INTO races (name, track, race_date) VALUES (?, ?, ?)').run(
      name.trim(),
      track || null,
      race_date || null
    );
  }
  res.redirect('/admin');
});

app.post('/admin/races/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM races WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

app.get('/admin/races/:id', requireAdmin, (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(req.params.id);
  if (!race) return res.status(404).send('Rennen nicht gefunden');
  const drivers = db.prepare('SELECT * FROM drivers ORDER BY name').all();
  const results = db.prepare('SELECT * FROM results WHERE race_id = ?').all(race.id);
  const resultsByDriver = Object.fromEntries(results.map((r) => [r.driver_id, r]));
  res.render('admin_race', { race, drivers, resultsByDriver });
});

// Enter/update results for a race (bulk form submit)
app.post('/admin/races/:id/results', requireAdmin, (req, res) => {
  const raceId = Number(req.params.id);
  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(raceId);
  if (!race) return res.status(404).send('Rennen nicht gefunden');

  const drivers = db.prepare('SELECT * FROM drivers').all();
  const upsert = db.prepare(`
    INSERT INTO results (race_id, driver_id, position, dnf)
    VALUES (@race_id, @driver_id, @position, @dnf)
    ON CONFLICT(race_id, driver_id) DO UPDATE SET position = excluded.position, dnf = excluded.dnf
  `);
  const clear = db.prepare('DELETE FROM results WHERE race_id = ? AND driver_id = ?');

  const tx = db.transaction(() => {
    for (const d of drivers) {
      const posRaw = req.body[`position_${d.id}`];
      const dnf = req.body[`dnf_${d.id}`] ? 1 : 0;
      const position = posRaw ? parseInt(posRaw, 10) : null;
      if (!position && !dnf) {
        clear.run(raceId, d.id);
        continue;
      }
      upsert.run({ race_id: raceId, driver_id: d.id, position: dnf ? null : position, dnf });
    }
    const fastestLapDriverId = req.body.fastest_lap_driver_id
      ? Number(req.body.fastest_lap_driver_id)
      : null;
    db.prepare('UPDATE races SET fastest_lap_driver_id = ? WHERE id = ?').run(
      fastestLapDriverId,
      raceId
    );
  });
  tx();

  res.redirect(`/admin/races/${raceId}`);
});

// Change admin password
app.post('/admin/password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(req.session.adminUsername);
  if (!admin || !bcrypt.compareSync(current_password || '', admin.password_hash)) {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY name').all();
    const races = db.prepare('SELECT * FROM races ORDER BY date(race_date) DESC, id DESC').all();
    return res.render('admin', {
      drivers,
      races,
      passwordError: 'Aktuelles Passwort ist falsch.',
    });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`F1-Rangliste laeuft auf http://localhost:${PORT}`);
});
