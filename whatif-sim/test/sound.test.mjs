import test from 'node:test';
import assert from 'node:assert/strict';
import { sfx } from '../audio/sfx.mjs';
import { reverb } from '../audio/reverb.mjs';
import { RATE } from '../audio/wav.mjs';

test('Neue Effekte liefern hoerbares Signal ohne Uebersteuerung', () => {
  for (const name of ['concrete', 'breath', 'water', 'fill', 'drip', 'slosh', 'creak', 'gurgle', 'shutter', 'murmur', 'heart', 'siren', 'wind', 'room']) {
    const x = sfx[name]({ dur: 1 });
    const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    assert.ok(peak > 0.05 && peak <= 1, `${name}: ${peak}`);
    assert.ok(x.every(Number.isFinite), name);
  }
});

test('Hall klingt nach dem Impuls aus', () => {
  const x = new Float32Array(RATE * 3);
  x[0] = 1;
  const [l] = reverb(x, { rt: 0.5, damp: 0.3 });
  const energy = (a, b) => l.subarray(a, b).reduce((s, v) => s + v * v, 0);
  assert.ok(energy(0, RATE / 2) > energy(RATE * 2, RATE * 3) * 100);
});
