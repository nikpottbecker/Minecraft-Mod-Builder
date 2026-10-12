import assert from 'node:assert/strict';
import test from 'node:test';

import { renderIndex, renderNews } from '../src/views.js';

const standings = [
  { name: 'Max <Test>', color: '#e10600', is_ai: false, races: 2, wins: 1, podiums: 2, points: 43 },
  { name: 'KI Fahrer', color: '#4fb0e8', is_ai: true, races: 2, wins: 1, podiums: 1, points: 25 },
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
  assert.doesNotMatch(html, />Ohne Punkte</);
});

test('news page marks the news navigation item as current', () => {
  const html = renderNews({ items: [], isAdmin: false });
  assert.match(html, /href="\/news" aria-current="page">News/);
});
