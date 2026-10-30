import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintStory, score } from '../lint-story.mjs';
import reibung from '../scenes/reibung.js';
import { ease, keyframes, spring, shake } from '../runtime/motion.js';

const base = {
  duration: 18,
  sources: ['Quelle'],
  story: {
    beats: [
      { at: 0, role: 'hook', until: 2.5, text: 'Was wäre, wenn du nie mehr schläfst?' },
      { at: 2.5, role: 'setup', link: 'also', text: 'Du bleibst wach.' },
      { at: 4.5, role: 'turn', link: 'aber', text: 'Aber dein Gehirn nicht.' },
      { at: 7, role: 'peak', link: 'deshalb', text: 'Deshalb schläft es heimlich.' },
      { at: 10, role: 'escalation', link: 'deshalb', text: 'Sekundenschlaf beim Fahren.' },
      { at: 13, role: 'payoff', link: 'denn', text: 'Nach 11 Tagen ist Schluss.' },
      { at: 16, role: 'loop', link: 'denn', text: 'Also: Was wäre, wenn …' },
    ],
  },
};
const levels = (def) => lintStory(def).map((r) => r.level);

test('Beispielszene besteht den Story-Check ohne Fehler', () => {
  const results = lintStory(reibung);
  assert.equal(results.filter((r) => r.level === 'error').length, 0);
  assert.ok(score(results) >= 90);
});

test('gute Story hat keine Fehler', () => {
  assert.ok(!levels(base).includes('error'));
});

test('ohne Story-Beats gibt es einen Fehler', () => {
  assert.deepEqual(levels({ duration: 18 }), ['error']);
});

test('spaeter Hook ist ein Fehler', () => {
  const def = structuredClone(base);
  def.story.beats[0].at = 1.5;
  assert.ok(lintStory(def).some((r) => r.level === 'error' && /Hook/.test(r.msg)));
});

test('ohne "aber/doch" fehlt der Wendepunkt', () => {
  const def = structuredClone(base);
  def.story.beats.forEach((b) => b.link === 'aber' && (b.link = 'deshalb'));
  assert.ok(lintStory(def).some((r) => /Wendepunkt/.test(r.msg)));
});

test('Zahlen ohne Quellen sind ein Fehler', () => {
  const def = structuredClone(base);
  def.sources = [];
  assert.ok(lintStory(def).some((r) => r.level === 'error' && /Quelle/.test(r.msg)));
});

test('zu viel Text pro Sekunde wird gewarnt', () => {
  const def = structuredClone(base);
  def.story.beats[1].text = 'Du bleibst wach und wach und wach und wach und wach';
  assert.ok(lintStory(def).some((r) => r.level === 'warn' && /zu schnell|Wörter/.test(r.msg)));
});

test('motion: Easing-Endpunkte und Keyframes', () => {
  for (const f of Object.values(ease)) {
    assert.ok(Math.abs(f(0)) < 1e-9);
    assert.ok(Math.abs(f(1) - 1) < 1e-9);
  }
  assert.equal(keyframes(0.5, [[0, 0], [1, 10]], ease.linear), 5);
  assert.deepEqual(keyframes(2, [[0, [0, 0]], [1, [2, 4]]]), [2, 4]);
  assert.ok(Math.abs(spring(5) - 1) < 1e-3);
  assert.deepEqual(shake(1, null), [0, 0, 0]);
});
