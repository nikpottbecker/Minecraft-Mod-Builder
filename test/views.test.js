import assert from 'node:assert/strict';
import test from 'node:test';

import { renderDriver, renderIndex, renderNews } from '../src/views.js';
import { computeDriverProfile } from '../src/supabase.js';

const standings = [
  { id: 1, name: 'Max <Test>', color: '#e10600', is_ai: false, races: 2, wins: 1, podiums: 2, points: 43 },
  { id: 2, name: 'KI Fahrer', color: '#4fb0e8', is_ai: true, races: 2, wins: 1, podiums: 1, points: 25 },
];

const progression = {
  races: [{ name: 'Rennen 1' }, { name: 'Rennen 2' }],
  drivers: [
    { name: 'Max <Test>', color: '#e10600', series: [25, 43] },
    { name: 'Ohne Punkte', color: '#ffffff', series: [0, 0] },
  ],
};

test('start page renders a safe, accessible season overview', () => {
  const html = renderIndex({
    standings,
    teamStandings: [],
    races: [{ id: 1, name: 'Rennen 1', race_date: '2026-10-12', track: 'Spa' }],
    progression,
    isAdmin: false,
  });

  assert.match(html, /Meisterschaft 2026/);
  assert.match(html, /aria-current="page">Rangliste/);
  assert.match(html, /class="timing-table standings-table"/);
  assert.match(html, /mobile-driver-stats/);
  assert.match(html, /data-filter="friend" aria-pressed="true"/);
  assert.match(html, /data-driver-kind="ai"[^>]* hidden/);
  assert.match(html, /Top 3 der Gesamtwertung/);
  assert.match(html, /Letzte Rennen/);
  assert.match(html, /Max &lt;Test&gt;/);
  assert.match(html, /href="\/drivers\/1"/);
  assert.doesNotMatch(html, />Ohne Punkte</);
});

test('driver profile combines standings, results, and race highlight videos', () => {
  const drivers = [{ id: 1, name: 'Max <Test>', color: '#e10600', is_ai: false, team: 'Test Team' }];
  const races = [{ id: 7, name: 'Nacht GP', track: 'Singapur', race_date: '2026-10-12', fastest_lap_driver_id: 1, video_url: 'https://youtu.be/example' }];
  const results = [{ race_id: 7, driver_id: 1, position: 1, dnf: false }];
  const profile = computeDriverProfile(1, drivers, races, results);
  const html = renderDriver({ ...profile, isAdmin: false });

  assert.equal(profile.standing.points, 26);
  assert.equal(profile.rank, 1);
  assert.match(html, /Fahrerprofil/);
  assert.match(html, /Max &lt;Test&gt;/);
  assert.match(html, /Singapur/);
  assert.match(html, /Schnellste Runde/);
  assert.match(html, /https:\/\/youtu\.be\/example/);
});

test('news page marks the news navigation item as current', () => {
  const html = renderNews({ items: [{ id: 4, at: '2026-10-12T12:00:00Z', kind: 'post', message: 'Neue Liga\nHeute geht es los.', persisted: true }], isAdmin: true });
  assert.match(html, /href="\/news" aria-current="page">News/);
  assert.match(html, /Paddock News/);
  assert.match(html, /Neue Liga/);
  assert.match(html, /Heute geht es los\./);
  assert.match(html, /action="\/admin\/news"/);
  assert.match(html, /action="\/admin\/news\/4\/delete"/);
});
