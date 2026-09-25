import { createClient } from '@supabase/supabase-js';

export function getSupabase(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

// F1-style points table for finishing positions 1-10
export const POINTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
export const FASTEST_LAP_BONUS = 1;

export function pointsForPosition(position) {
  if (!position) return 0;
  return POINTS[position] || 0;
}

export async function loadRaceData(supabase) {
  const { data: drivers } = await supabase.from('drivers').select('*').order('name');
  const { data: races } = await supabase.from('races').select('*');
  const { data: results } = await supabase.from('results').select('*');
  return { drivers: drivers || [], races: races || [], results: results || [] };
}

function pointsForResult(result, race) {
  if (result.dnf) return { points: 0, win: false, podium: false };
  let points = pointsForPosition(result.position);
  if (race && race.fastest_lap_driver_id === result.driver_id && result.position && result.position <= 10) {
    points += FASTEST_LAP_BONUS;
  }
  return {
    points,
    win: result.position === 1,
    podium: !!(result.position && result.position <= 3),
  };
}

export function computeStandings(drivers, races, results) {
  const standings = drivers.map((d) => ({ ...d, points: 0, wins: 0, podiums: 0, races: 0 }));
  const byId = Object.fromEntries(standings.map((s) => [s.id, s]));
  const raceById = Object.fromEntries(races.map((r) => [r.id, r]));

  for (const r of results) {
    const s = byId[r.driver_id];
    if (!s) continue;
    s.races += 1;
    const { points, win, podium } = pointsForResult(r, raceById[r.race_id]);
    s.points += points;
    if (win) s.wins += 1;
    if (podium) s.podiums += 1;
  }

  standings.sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  return standings;
}

export async function getStandings(supabase) {
  const { drivers, races, results } = await loadRaceData(supabase);
  return computeStandings(drivers, races, results);
}

// Cumulative points per driver after each race, in chronological order -
// the data behind the points-progression chart on the standings page.
export function computeProgression(drivers, races, results) {
  const orderedRaces = races
    .slice()
    .sort((a, b) => (a.race_date || '').localeCompare(b.race_date || '') || a.id - b.id);

  const resultsByRace = {};
  for (const r of results) {
    (resultsByRace[r.race_id] ||= []).push(r);
  }

  const totals = Object.fromEntries(drivers.map((d) => [d.id, 0]));
  const series = Object.fromEntries(drivers.map((d) => [d.id, []]));

  for (const race of orderedRaces) {
    for (const result of resultsByRace[race.id] || []) {
      if (!(result.driver_id in totals)) continue;
      const { points } = pointsForResult(result, race);
      totals[result.driver_id] += points;
    }
    for (const d of drivers) {
      series[d.id].push(totals[d.id]);
    }
  }

  return {
    races: orderedRaces,
    drivers: drivers.map((d) => ({ id: d.id, name: d.name, color: d.color, series: series[d.id] })),
  };
}
