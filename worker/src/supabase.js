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

export async function getStandings(supabase) {
  const { data: drivers } = await supabase.from('drivers').select('*').order('name');
  const { data: races } = await supabase.from('races').select('*');
  const { data: results } = await supabase.from('results').select('*');

  const standings = (drivers || []).map((d) => ({ ...d, points: 0, wins: 0, podiums: 0, races: 0 }));
  const byId = Object.fromEntries(standings.map((s) => [s.id, s]));
  const raceById = Object.fromEntries((races || []).map((r) => [r.id, r]));

  for (const r of results || []) {
    const s = byId[r.driver_id];
    if (!s) continue;
    s.races += 1;
    if (!r.dnf) {
      let pts = pointsForPosition(r.position);
      const race = raceById[r.race_id];
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
