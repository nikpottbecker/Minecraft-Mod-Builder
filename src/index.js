import { Hono } from 'hono';
import { getSupabase, loadRaceData, computeStandings, computeProgression, POINTS, FASTEST_LAP_BONUS } from './supabase.js';
import { createSessionCookie, clearSessionCookie, readSession } from './auth.js';
import { renderIndex, renderRace, renderLogin, renderAdmin, renderAdminRace } from './views.js';

const app = new Hono();

app.use('*', async (c, next) => {
  const secret = c.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
  const session = await readSession(c.req.header('Cookie'), secret);
  c.set('isAdmin', !!session);
  await next();
});

function requireAdmin(c) {
  if (!c.get('isAdmin')) return c.redirect('/admin/login');
  return null;
}

// ---------- Public routes ----------

app.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const { drivers, races, results } = await loadRaceData(supabase);
  const standings = computeStandings(drivers, races, results);
  const progression = computeProgression(drivers, races, results);
  const racesDesc = races
    .slice()
    .sort((a, b) => (b.race_date || '').localeCompare(a.race_date || '') || b.id - a.id);
  return c.html(renderIndex({ standings, races: racesDesc, progression, isAdmin: c.get('isAdmin') }));
});

app.get('/races/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const raceId = c.req.param('id');
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();
  if (!race) return c.text('Rennen nicht gefunden', 404);
  const { data: results } = await supabase
    .from('results')
    .select('*, drivers(name, color)')
    .eq('race_id', raceId);

  const flatResults = (results || [])
    .map((r) => ({ ...r, driver_name: r.drivers?.name, driver_color: r.drivers?.color }))
    .sort((a, b) => (a.dnf === b.dnf ? (a.position || 99) - (b.position || 99) : a.dnf ? 1 : -1));

  return c.html(
    renderRace({ race, results: flatResults, POINTS, FASTEST_LAP_BONUS, isAdmin: c.get('isAdmin') })
  );
});

// ---------- Admin auth ----------

app.get('/admin/login', (c) => c.html(renderLogin({ error: null })));

app.post('/admin/login', async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || '');
  const password = String(body.password || '');
  const supabase = getSupabase(c.env);
  const { data: ok } = await supabase.rpc('verify_admin_password', {
    p_username: username,
    p_password: password,
  });
  if (!ok) {
    return c.html(renderLogin({ error: 'Benutzername oder Passwort ist falsch.' }));
  }
  const secret = c.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
  const cookie = await createSessionCookie(username, secret);
  c.header('Set-Cookie', cookie);
  return c.redirect('/admin');
});

app.post('/admin/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie());
  return c.redirect('/');
});

// ---------- Admin area ----------

app.get('/admin', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const supabase = getSupabase(c.env);
  const { data: drivers } = await supabase.from('drivers').select('*').order('name');
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: false })
    .order('id', { ascending: false });
  return c.html(renderAdmin({ drivers: drivers || [], races: races || [] }));
});

app.post('/admin/drivers', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const body = await c.req.parseBody();
  const name = String(body.name || '').trim();
  const color = String(body.color || '#e10600');
  if (name) {
    const supabase = getSupabase(c.env);
    await supabase.from('drivers').insert({ name, color });
  }
  return c.redirect('/admin');
});

app.post('/admin/drivers/:id/delete', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const supabase = getSupabase(c.env);
  await supabase.from('drivers').delete().eq('id', c.req.param('id'));
  return c.redirect('/admin');
});

app.post('/admin/races', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const body = await c.req.parseBody();
  const name = String(body.name || '').trim();
  if (name) {
    const supabase = getSupabase(c.env);
    await supabase.from('races').insert({
      name,
      track: body.track || null,
      race_date: body.race_date || null,
      video_url: body.video_url || null,
    });
  }
  return c.redirect('/admin');
});

app.post('/admin/races/:id/delete', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const supabase = getSupabase(c.env);
  await supabase.from('races').delete().eq('id', c.req.param('id'));
  return c.redirect('/admin');
});

app.get('/admin/races/:id', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const supabase = getSupabase(c.env);
  const raceId = c.req.param('id');
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();
  if (!race) return c.text('Rennen nicht gefunden', 404);
  const { data: drivers } = await supabase.from('drivers').select('*').order('name');
  const { data: results } = await supabase.from('results').select('*').eq('race_id', raceId);
  const resultsByDriver = Object.fromEntries((results || []).map((r) => [r.driver_id, r]));
  return c.html(renderAdminRace({ race, drivers: drivers || [], resultsByDriver }));
});

app.post('/admin/races/:id/results', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const supabase = getSupabase(c.env);
  const raceId = c.req.param('id');
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();
  if (!race) return c.text('Rennen nicht gefunden', 404);

  const body = await c.req.parseBody();
  const { data: drivers } = await supabase.from('drivers').select('*');

  for (const d of drivers || []) {
    const posRaw = body[`position_${d.id}`];
    const dnf = body[`dnf_${d.id}`] ? true : false;
    const position = posRaw ? parseInt(String(posRaw), 10) : null;
    if (!position && !dnf) {
      await supabase.from('results').delete().eq('race_id', raceId).eq('driver_id', d.id);
      continue;
    }
    await supabase
      .from('results')
      .upsert(
        { race_id: Number(raceId), driver_id: d.id, position: dnf ? null : position, dnf },
        { onConflict: 'race_id,driver_id' }
      );
  }

  const fastestLapDriverId = body.fastest_lap_driver_id ? Number(body.fastest_lap_driver_id) : null;
  await supabase
    .from('races')
    .update({ fastest_lap_driver_id: fastestLapDriverId, video_url: body.video_url || null })
    .eq('id', raceId);

  return c.redirect(`/admin/races/${raceId}`);
});

app.post('/admin/password', async (c) => {
  const guard = requireAdmin(c);
  if (guard) return guard;
  const secret = c.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
  const session = await readSession(c.req.header('Cookie'), secret);
  const body = await c.req.parseBody();
  const supabase = getSupabase(c.env);

  const { data: ok } = await supabase.rpc('verify_admin_password', {
    p_username: session.u,
    p_password: String(body.current_password || ''),
  });

  if (!ok) {
    const { data: drivers } = await supabase.from('drivers').select('*').order('name');
    const { data: races } = await supabase.from('races').select('*');
    return c.html(
      renderAdmin({
        drivers: drivers || [],
        races: races || [],
        passwordError: 'Aktuelles Passwort ist falsch.',
      })
    );
  }

  await supabase.rpc('set_admin_password', {
    p_username: session.u,
    p_password: String(body.new_password || ''),
  });

  return c.redirect('/admin');
});

export default app;
