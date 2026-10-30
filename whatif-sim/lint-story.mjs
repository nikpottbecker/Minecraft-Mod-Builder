#!/usr/bin/env node
// Story-Pruefer: bewertet das `story`-Feld einer Szene nach den Regeln aus STORY.md.
//
//   node lint-story.mjs scenes/reibung.js
//
// Fehler (✗) muessen behoben werden, Warnungen (!) sollten, Tipps (·) koennen.

import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const LINKS = ['aber', 'doch', 'deshalb', 'also', 'denn', 'trotzdem', 'sodass', 'bis'];
const TURNS = ['aber', 'doch', 'trotzdem'];
const MAX_WPS = 4; // Lesegeschwindigkeit: hoechstens ~4 Woerter pro Sekunde
const MAX_GAP = 3; // laenger als 3 s ohne neuen Text/Reiz = Leerlauf

const words = (s) => String(s || '').replace(/\*/g, '').trim().split(/\s+/).filter(Boolean);

export function lintStory(def) {
  const out = [];
  const err = (msg) => out.push({ level: 'error', msg });
  const warn = (msg) => out.push({ level: 'warn', msg });
  const tip = (msg) => out.push({ level: 'tip', msg });

  const duration = def.duration || 0;
  const story = def.story;
  if (!story || !Array.isArray(story.beats) || story.beats.length === 0) {
    err('Kein `story.beats` in der Szene. Erst die Story schreiben, dann animieren.');
    return out;
  }
  const beats = [...story.beats].sort((a, b) => a.at - b.at);

  // Laenge
  const serial = Boolean(def.series); // Serien-Teile erzaehlen laenger und enden offen
  if (serial ? duration < 30 || duration > 150 : duration < 12 || duration > 35) warn(`Länge ${duration} s: Für „Was wäre wenn“ funktionieren 12–35 s am besten.`);

  // Hook
  const first = beats[0];
  if (first.at > 0.5) err(`Hook kommt erst bei ${first.at} s. Die erste Zeile muss in der ersten halben Sekunde stehen.`);
  const hook = story.hook || first.text;
  if (words(hook).length > 14) warn(`Hook hat ${words(hook).length} Wörter. Kürzer ist stärker (≤ 14, besser ≤ 10).`);
  if (!/\?/.test(hook) && !/\d/.test(hook)) warn('Hook ist weder Frage noch überraschende Zahl. Eine offene Frage erzeugt die Neugierlücke.');

  // Lesbarkeit und Rhythmus
  beats.forEach((b, i) => {
    const end = b.until ?? beats[i + 1]?.at ?? duration;
    const shown = end - b.at;
    const n = words(b.text).length;
    if (!b.text) return;
    if (shown < 0.8) warn(`Beat bei ${b.at} s steht nur ${shown.toFixed(1)} s — zu kurz zum Lesen.`);
    if (n / shown > MAX_WPS) warn(`Beat bei ${b.at} s: ${n} Wörter in ${shown.toFixed(1)} s ist zu schnell (max. ${MAX_WPS}/s). Kürzen.`);
    if (n > (serial ? 14 : 9)) warn(`Beat bei ${b.at} s hat ${n} Wörter. Eine Zeile = ein Gedanke (≤ 7–9 Wörter).`);
  });
  for (let i = 0; i < beats.length; i++) {
    const end = beats[i].until ?? beats[i + 1]?.at ?? duration;
    const next = beats[i + 1]?.at ?? duration;
    if (next - end > MAX_GAP) warn(`Leerlauf ${end.toFixed(1)}–${next.toFixed(1)} s ohne Text. Nach spätestens ${MAX_GAP} s braucht es einen neuen Reiz.`);
  }

  // Kausalitaet: "aber/deshalb" statt "und dann"
  const rest = beats.slice(1).filter((b) => b.text);
  const unlinked = rest.filter((b) => !LINKS.includes(b.link));
  if (unlinked.length) {
    warn(`${unlinked.length} Beat(s) ohne Verbindung (${unlinked.map((b) => b.at + ' s').join(', ')}). Jeder Beat braucht ein „aber“ oder „deshalb“ zum vorherigen, nicht „und dann“.`);
  }
  if (!rest.some((b) => TURNS.includes(b.link))) err('Kein Wendepunkt („aber“/„doch“). Ohne Überraschung keine Story.');

  // Hoehepunkt und Ende (Peak-End-Regel)
  const peak = beats.find((b) => b.role === 'peak');
  if (!peak) err('Kein Höhepunkt (role: "peak"). Der Moment, an den man sich erinnert, muss geplant sein.');
  else if (peak.at < duration * 0.25 || peak.at > duration * 0.8) warn(`Höhepunkt bei ${peak.at} s liegt außerhalb von 25–80 % der Länge.`);
  const last = beats[beats.length - 1];
  if (last.at < duration * 0.8) warn(`Letzter Beat bei ${last.at} s — das Ende muss in den letzten 20 % stark sein (Peak-End-Regel).`);
  if (!beats.some((b) => b.role === 'payoff')) err('Keine Auflösung (role: "payoff"). Die Frage aus dem Hook muss beantwortet werden.');
  if (serial && last.role !== 'cliffhanger') warn('Serien-Teil endet ohne `role: "cliffhanger"`. Die offene Frage holt die Kommentare und Teil 2.');
  if (!serial && !beats.some((b) => b.role === 'loop')) tip('Kein Loop-Ende (role: "loop"). Wenn der letzte Satz in den Anfang übergeht, schauen viele ein zweites Mal.');

  // Quellen
  const texts = [hook, ...beats.map((b) => b.text)].join(' ');
  if (/\d/.test(texts) && !(def.sources || []).length) err('Zahlen im Text, aber keine `sources`. Jede Zahl braucht eine Quelle oder Formel.');

  // Ansprache
  if (!/\b(du|dich|dir|dein\w*|you|your)\b/i.test(texts)) tip('Der Zuschauer wird nie mit „du“ angesprochen. Ein „Stell dir vor…“ oder „Du würdest…“ macht es persönlich.');

  return out;
}

export function score(results) {
  const penalty = results.reduce((s, r) => s + (r.level === 'error' ? 25 : r.level === 'warn' ? 8 : 2), 0);
  return Math.max(0, 100 - penalty);
}

export function formatReport(results) {
  const icon = { error: '✗', warn: '!', tip: '·' };
  const lines = results.map((r) => `  ${icon[r.level]} ${r.msg}`);
  lines.push(`  Story-Score: ${score(results)}/100${results.some((r) => r.level === 'error') ? ' — Fehler zuerst beheben' : ''}`);
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('Aufruf: node lint-story.mjs scenes/<name>.js');
    process.exit(1);
  }
  const def = (await import(pathToFileURL(resolve(file)).href)).default;
  const results = lintStory(def);
  console.log(`Story-Check: ${def.title || file}`);
  console.log(formatReport(results));
  process.exit(results.some((r) => r.level === 'error') ? 1 : 0);
}
