import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, frameList } from '../render.mjs';

test('parseArgs: Vorschau senkt Aufloesung und fps', () => {
  const o = parseArgs(['scenes/x.js', '--preview']);
  assert.equal(o.scene, 'scenes/x.js');
  assert.equal(o.scale, 0.5);
  assert.equal(o.fps, 15);
});

test('parseArgs: ohne Szene gibt es einen Fehler', () => {
  assert.throws(() => parseArgs(['--check']), /Szene fehlt/);
});

test('frameList: alle Frames bei voller fps', () => {
  const f = frameList({ totalFrames: 90, sceneFps: 30 });
  assert.equal(f.length, 90);
  assert.equal(f[0], 0);
  assert.equal(f.at(-1), 89);
});

test('frameList: halbe fps nimmt jeden zweiten Frame', () => {
  const f = frameList({ totalFrames: 90, sceneFps: 30, fps: 15 });
  assert.deepEqual(f.slice(0, 3), [0, 2, 4]);
  assert.equal(f.length, 45);
});

test('frameList: Pruefmodus verteilt Frames gleichmaessig im Zeitfenster', () => {
  const f = frameList({ totalFrames: 540, sceneFps: 30, check: true, checkCount: 5, from: 3, to: 8 });
  assert.deepEqual(f, [90, 128, 165, 203, 240]);
});
