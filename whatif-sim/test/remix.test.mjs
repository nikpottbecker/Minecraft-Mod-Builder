import test from 'node:test';
import assert from 'node:assert/strict';
import { warp, warpTable } from '../runtime/remix.js';
import { speechMargin } from '../audio.mjs';

const lines = [{ id: 'a', at: 0 }, { id: 'neu', at: 4, v: ['a', 1, 0.5] }, { id: 'b', at: 10 }];

test('Zeilen zeigen ihre Stelle im Original und bremsen, wenn die neue Zeile laenger ist', () => {
  const rows = warpTable(lines, { a: 2, b: 5 }, 14);
  assert.equal(warp(rows, 0).t, 2);
  assert.equal(warp(rows, 2).t, 2.5);
  assert.equal(warp(rows, 4).t, 3);
  assert.equal(warp(rows, 6).t, 4);
  assert.equal(warp(rows, 10).t, 5);
});

test('Fehlendes Bild im Original faellt sofort auf', () => {
  assert.throws(() => warpTable([{ id: 'x', at: 0 }], {}, 1), /Kein Bild/);
});

test('Sprachabstand misst nur Bloecke mit Stimme', () => {
  const n = 4800;
  const v = new Float32Array(n * 2).fill(0.1, 0, n);
  const mix = new Float32Array(n * 2).fill(0.2, 0, n).fill(0.5, n, n * 2);
  const m = speechMargin([v, v], [mix, mix]);
  assert.equal(m.blocks, 1);
  assert.ok(Math.abs(m.median) < 0.01);
  assert.equal(m.under6, 100);
});
