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
  const standings = drivers.map((d) => ({ ...d, points: 0, wins: 0, podiums: 0, races: 0, bestPosition: Infinity }));
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
    if (!r.dnf && r.position && r.position < s.bestPosition) s.bestPosition = r.position;
  }

  standings.sort((a, b) => {
    if ((a.races === 0) !== (b.races === 0)) return a.races === 0 ? 1 : -1;
    return (
      b.points - a.points ||
      b.wins - a.wins ||
      a.bestPosition - b.bestPosition ||
      a.name.localeCompare(b.name)
    );
  });
  return standings.map(({ bestPosition, ...s }) => s);
}

export async function getStandings(supabase) {
  const { drivers, races, results } = await loadRaceData(supabase);
  return computeStandings(drivers, races, results);
}

// Constructor-style team standings: points from every driver assigned to
// a team are summed, same as the real F1 points scheme. Drivers without a
// team set are left out of this table.
export function computeTeamStandings(drivers, races, results) {
  const driverStandings = computeStandings(drivers, races, results);
  const teams = {};

  for (const d of driverStandings) {
    if (!d.team) continue;
    if (!teams[d.team]) {
      teams[d.team] = { team: d.team, points: 0, wins: 0, podiums: 0, drivers: [] };
    }
    teams[d.team].points += d.points;
    teams[d.team].wins += d.wins;
    teams[d.team].podiums += d.podiums;
    teams[d.team].drivers.push({ id: d.id, name: d.name, color: d.color, is_ai: d.is_ai, points: d.points });
  }

  return Object.values(teams).sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));
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

// Combines persisted news (team changes, ...) with events derived live from
// race results (crashes/DNFs, race winners) into one chronological feed.
export function computeNewsFeed(drivers, races, results, persistedNews) {
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));
  const resultsByRace = {};
  for (const r of results) {
    (resultsByRace[r.race_id] ||= []).push(r);
  }

  const items = [];

  for (const n of persistedNews) {
    items.push({ at: n.created_at, kind: n.kind, message: n.message });
  }

  for (const race of races) {
    const at = race.race_date ? `${race.race_date}T12:00:00Z` : race.created_at || new Date(0).toISOString();
    const raceResults = resultsByRace[race.id] || [];

    const winner = raceResults.find((r) => !r.dnf && r.position === 1);
    if (winner && driverById[winner.driver_id]) {
      items.push({
        at,
        kind: 'win',
        message: `🏆 ${driverById[winner.driver_id].name} gewinnt "${race.name}".`,
      });
    }

    for (const r of raceResults) {
      if (!r.dnf || !driverById[r.driver_id]) continue;
      const lapText = r.laps_completed ? `in Runde ${r.laps_completed} ` : '';
      const reasonText = r.dnf_reason ? `wegen ${r.dnf_reason}` : '(Grund unbekannt)';
      items.push({
        at,
        kind: 'crash',
        message: `💥 ${driverById[r.driver_id].name} scheidet bei "${race.name}" ${lapText}aus ${reasonText}.`,
      });
    }
  }

  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  return items;
}
