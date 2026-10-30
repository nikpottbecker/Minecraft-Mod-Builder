import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkWords, layout, wordTimes } from '../runtime/narration.js';
import { buildCaption } from '../caption.mjs';

const w = (s) => s.split(' ').map((x, i) => ({ w: x, start: i * 0.3 }));

test('Stuecke enden an Satzzeichen und haben hoechstens vier Woerter', () => {
  const c = chunkWords(w('one two. three four five six seven'));
  assert.deepEqual(c.map((x) => x.length), [2, 4, 1]);
});

test('Wortzeiten werden verteilt, wenn gesprochene Woerter abweichen', () => {
  const r = wordTimes('6:42 PM. Dinner', { dur: 3, words: [{ start: 0 }, { start: 1 }, { start: 2 }, { start: 2.5 }] });
  assert.equal(r.length, 3);
  assert.equal(r[0].start, 0);
  assert.ok(r[2].start < 3);
});

test('Layout legt Saetze hintereinander und markiert Woerter', () => {
  const lines = [{ id: 'a', role: 'hook', text: 'Hello *there*' }, { id: 'b', role: 'setup', text: 'Bye', pause: 0 }];
  const timing = { lines: [{ text: 'Hello there', dur: 2, words: [{ start: 0 }, { start: 1 }] }, { text: 'Bye', dur: 1, words: [{ start: 0 }] }] };
  const l = layout(lines, timing, { gap: 0.5, lead: 0, tail: 1 });
  assert.equal(l.at.b, 2.5);
  assert.equal(l.duration, 4.5);
  assert.equal(l.chunks[0].words[1].mark, true);
});

test('Veraltetes Timing wird erkannt', () => {
  assert.throws(() => layout([{ id: 'a', text: 'New' }], { lines: [{ text: 'Old', dur: 1, words: [] }] }), /veraltet/);
});

test('Caption folgt dem Serienformat', () => {
  const c = buildCaption({ series: { part: 1 }, caption: { scenario: 'Blackout', emoji: '🔦', question: 'Open?', tags: ['a', 'b'] } });
  assert.equal(c, 'Part 1 | Blackout… 🔦 Open? #a #b');
});
