import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spokenText, estimateWords, parseArgs } from '../audio.mjs';
import { sfx, SFX_NAMES } from '../audio/sfx.mjs';
import { music } from '../audio/music.mjs';
import { RATE, speechSpan } from '../audio/wav.mjs';

test('spokenText: Markierungen raus, Platzhalter fuellen, say hat Vorrang', () => {
  assert.equal(spokenText({ text: '*Doch* {n} liegen.' }, { n: 41 }), 'Doch 41 liegen.');
  assert.equal(spokenText({ text: '12 m', say: '12 Meter' }), '12 Meter');
});

test('estimateWords: Woerter aufsteigend im Sprachbereich, Pause nach Satzzeichen', () => {
  const w = estimateWords('Reibung weg. Bremsen bringt nichts', 0.1, 2.1);
  assert.equal(w.length, 5);
  assert.equal(w[0].start, 0.1);
  for (let i = 1; i < w.length; i++) assert.ok(w[i].start > w[i - 1].start);
  assert.ok(w.at(-1).start < 2.1);
  // "weg." traegt eine Pause: Abstand zu "Bremsen" groesser als zwischen "Reibung" und "weg."
  assert.ok(w[2].start - w[1].start > w[1].start - w[0].start - 0.3);
});

test('parseArgs: Standard ist edge-tts', () => {
  assert.equal(parseArgs(['scenes/x.js']).voice, 'edge');
  assert.equal(parseArgs(['scenes/x.js', '--voice', 'espeak']).voice, 'espeak');
});

test('alle Soundeffekte liefern endliche Samples im Bereich -1..1', () => {
  for (const name of SFX_NAMES) {
    const x = sfx[name]({ dur: 0.5 });
    assert.ok(x.length > 0, name);
    let peak = 0;
    for (const v of x) {
      assert.ok(Number.isFinite(v), name);
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(peak <= 1 && peak > 0.01, `${name}: Peak ${peak}`);
  }
});

test('Musik hat die richtige Laenge und ist deterministisch', () => {
  const a = music({ duration: 2, sections: [{ at: 0, mood: 'pulse' }, { at: 1, mood: 'drive' }] });
  const b = music({ duration: 2, sections: [{ at: 0, mood: 'pulse' }, { at: 1, mood: 'drive' }] });
  assert.equal(a.length, 2);
  assert.equal(a[0].length, 2 * RATE);
  assert.deepEqual(a[0].slice(5000, 5010), b[0].slice(5000, 5010));
});

test('speechSpan findet den hoerbaren Bereich', () => {
  const x = new Float32Array(RATE);
  for (let i = RATE / 4; i < RATE / 2; i++) x[i] = 0.5;
  const s = speechSpan(x, RATE);
  assert.ok(Math.abs(s.start - 0.25) < 0.001);
  assert.ok(Math.abs(s.end - 0.5) < 0.001);
});
