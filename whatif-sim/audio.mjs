#!/usr/bin/env node
// Ton fuer eine Szene: Stimme + Soundeffekte + Musik + Atmosphaere -> gemischt ins Video.
//
//   node audio.mjs scenes/reibung.js                       -> Stimme: edge-tts (Standard)
//   node audio.mjs scenes/reibung.js --voice espeak        -> offline, roboterhaft (zum Testen)
//   node audio.mjs scenes/reibung.js --voice say           -> macOS-Stimme (z. B. "Anna")
//   node audio.mjs scenes/reibung.js --voice elevenlabs    -> ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
//   node audio.mjs scenes/reibung.js --no-voice            -> nur Effekte + Musik
//   ... --speaker de-DE-KillianNeural                      -> Stimme des Anbieters waehlen
//
// Ablauf:
//  1. Szene im Browser nur simulieren (ohne Bild) -> Sound-Cues (ctx.sound) + Variablen
//  2. Pro Story-Beat den Sprechertext (beat.say oder beat.text) erzeugen und in den
//     Zeitslot des Beats einpassen (notfalls leicht beschleunigt)
//  3. Effekte, Musik (scene.music) und Atmosphaere (scene.ambience) synthetisieren
//  4. Musik unter der Stimme absenken (Ducking), Lautheit auf -14 LUFS (TikTok/Reels)
//  5. Ergebnis: out/<name>.wav und, falls out/<name>.mp4 existiert, out/<name>-ton.mp4

import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join, resolve, relative, basename, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { serve } from './render.mjs';
import { RATE, readWav, writeWav, speechSpan } from './audio/wav.mjs';
import { sfx } from './audio/sfx.mjs';
import { music } from './audio/music.mjs';
import { reverb, SPACES } from './audio/reverb.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));

export function parseArgs(argv) {
  const o = { scene: null, voice: 'edge', speaker: null, noVoice: false, video: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--voice') o.voice = argv[++i];
    else if (a === '--speaker') o.speaker = argv[++i];
    else if (a === '--no-voice') o.noVoice = true;
    else if (a === '--video') o.video = argv[++i];
    else if (!a.startsWith('--') && !o.scene) o.scene = a;
    else throw new Error(`Unbekannte Option: ${a}`);
  }
  if (!o.scene) throw new Error('Szene fehlt, z. B.: node audio.mjs scenes/reibung.js');
  return o;
}

const run = (cmd, args, { capture = false } = {}) => new Promise((ok, fail) => {
  const child = spawn(cmd, args, { stdio: ['ignore', capture ? 'pipe' : 'ignore', 'pipe'] });
  let out = '';
  let err = '';
  child.stdout?.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (err += d));
  child.on('error', fail);
  child.on('close', (code) => (code === 0 ? ok(out) : fail(new Error(`${cmd} ${args.slice(0, 3).join(' ')}… (Code ${code})\n${err.slice(-800)}`))));
});

const exists = (f) => access(f).then(() => true, () => false);
const dbToGain = (db) => 10 ** (db / 20);

// Sprechertext eines Beats: Markierungen raus, Platzhalter fuellen.
export function spokenText(beat, vars = {}) {
  const raw = beat.say ?? beat.text ?? '';
  return String(raw).replace(/\*/g, '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? k)).replace(/\s+/g, ' ').trim();
}

// Wortzeiten schaetzen (fuer Anbieter ohne Zeitstempel): Woerter gleichmaessig nach
// Zeichenzahl ueber den hoerbaren Bereich verteilen, Satzzeichen bekommen Pausen.
export function estimateWords(text, start, end) {
  const words = text.split(/\s+/).filter(Boolean);
  const weight = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1 + (/[.,!?:;…]$/.test(w) ? 3 : 0));
  const total = weight.reduce((s, w) => s + w, 0) || 1;
  let acc = start;
  return words.map((w, i) => {
    const s = acc;
    acc += ((end - start) * weight[i]) / total;
    return { w, start: +s.toFixed(3) };
  });
}

// ---------- Sprachanbieter ----------
async function synthesize(provider, text, file, speaker, speed = 1, dir = {}) {
  const tmp = file.replace(/\.wav$/, '.src');
  if (provider === 'directed') {
    const out = await run('python3', [join(ROOT, 'audio', 'edge_directed.py'), '--text', text, '--voice', speaker, `--rate=${dir.rate}`, `--pitch=${dir.pitch}`, '--gap', String(dir.beat ?? 0.26), '--cache', join(ROOT, 'out', 'audio', 'cache'), '--out', file], { capture: true });
    return JSON.parse(out).words;
  }
  if (provider === 'kokoro') {
    const py = join(homedir(), '.cache/whatif-tts/.venv/bin/python');
    const json = await run(py, [join(ROOT, 'audio', 'kokoro_tts.py'), '--text', text, '--voice', speaker || 'am_michael', '--speed', String(speed), '--out', tmp + '.wav'], { capture: true });
    await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp + '.wav', '-ar', String(RATE), '-ac', '1', file]);
    return JSON.parse(json);
  }
  if (provider === 'espeak') {
    const json = await run('python3', ['-I', join(ROOT, 'audio', 'espeak_tts.py'), '--text', text, '--out', tmp + '.wav', '--voice', speaker || 'de', '--rate', '195'], { capture: true });
    await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp + '.wav', '-ar', String(RATE), '-ac', '1', file]);
    return JSON.parse(json).words;
  }
  if (provider === 'edge') {
    // Der Dienst liefert gelegentlich kein Audio: kurz warten, neu versuchen.
    const say = () => run('edge-tts', ['--voice', speaker || 'de-DE-ConradNeural', '--text', text, '--write-media', tmp + '.mp3']);
    const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
    await say().catch(() => wait(2000).then(say)).catch(() => wait(6000).then(say));
    await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp + '.mp3', '-ar', String(RATE), '-ac', '1', file]);
    return null;
  }
  if (provider === 'say') {
    await run('say', ['-v', speaker || 'Anna', '-o', tmp + '.aiff', text]);
    await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp + '.aiff', '-ar', String(RATE), '-ac', '1', file]);
    return null;
  }
  if (provider === 'elevenlabs') {
    const key = process.env.ELEVENLABS_API_KEY;
    const voice = speaker || process.env.ELEVENLABS_VOICE_ID;
    if (!key || !voice) throw new Error('ElevenLabs braucht ELEVENLABS_API_KEY und ELEVENLABS_VOICE_ID (oder --speaker <voice_id>).');
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs: ${res.status} ${await res.text()}`);
    const data = await res.json();
    await writeFile(tmp + '.mp3', Buffer.from(data.audio_base64, 'base64'));
    await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp + '.mp3', '-ar', String(RATE), '-ac', '1', file]);
    // Zeichen-Zeitstempel -> Wortanfaenge
    const { characters, character_start_times_seconds: starts } = data.alignment;
    const words = [];
    let cur = null;
    characters.forEach((c, i) => {
      if (/\s/.test(c)) cur = null;
      else if (!cur) words.push((cur = { w: c, start: starts[i] }));
      else cur.w += c;
    });
    return words;
  }
  throw new Error(`Unbekannter Sprachanbieter: ${provider} (espeak | edge | say | elevenlabs)`);
}

async function simulate(sceneRel) {
  const server = await serve(ROOT);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 200, height: 360 } });
    page.on('pageerror', (e) => console.error('[browser]', e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/runtime/index.html?scene=/${sceneRel}&scale=0.1&quality=draft`);
    await page.waitForFunction(() => window.__simReady || window.__simError, null, { timeout: 120000 });
    const error = await page.evaluate(() => window.__simError);
    if (error) throw new Error(error);
    return await page.evaluate(() => window.__sim.simulate());
  } finally {
    await browser.close();
    server.close();
  }
}

// Stereo-Spur, in die Clips an Zeitpunkten eingelegt werden.
function track(duration) {
  const n = Math.round(duration * RATE);
  return [new Float32Array(n), new Float32Array(n)];
}
function place([L, R], clip, t, { gain = 0, pan = 0 } = {}) {
  const g = dbToGain(gain);
  const gl = g * Math.min(1, 1 - pan);
  const gr = g * Math.min(1, 1 + pan);
  const o = Math.round(t * RATE);
  const mono = !Array.isArray(clip);
  const cl = mono ? clip : clip[0];
  const cr = mono ? clip : clip[1];
  for (let i = 0; i < cl.length && o + i < L.length; i++) {
    if (o + i < 0) continue;
    L[o + i] += cl[i] * gl;
    R[o + i] += cr[i] * gr;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sceneAbs = resolve(opts.scene);
  const sceneRel = relative(ROOT, sceneAbs).split('\\').join('/');
  const name = basename(opts.scene).replace(/\.m?js$/, '');
  const def = (await import(pathToFileURL(sceneAbs).href)).default;
  const duration = def.duration;
  const dir = join(ROOT, 'out', 'audio', name);
  await mkdir(dir, { recursive: true });

  const provider = process.argv.includes('--voice') ? opts.voice : def.tts || opts.voice;
  console.log(`Ton fuer: ${def.title}`);
  const { cues, vars } = await simulate(sceneRel);
  console.log(`  ${cues.length} Sound-Cues aus der Simulation`);

  // ---------- Stimme ----------
  const voice = track(duration);
  const sends = {}; // Hall-Wege pro Ort (mono)
  const send = (space) => (sends[space] ??= new Float32Array(Math.round(duration * RATE)));
  const timeline = [];
  if (!opts.noVoice) {
    const beats = [...(def.story?.beats || [])].sort((a, b) => a.at - b.at);
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      const text = spokenText(b, vars);
      if (!text || b.say === false) continue;
      const slotEnd = Math.min(b.until ?? Infinity, beats[i + 1]?.at ?? duration, duration);
      const slot = slotEnd - b.at - 0.12;
      const raw = join(dir, `beat-${String(i).padStart(2, '0')}.wav`);
      let words = await synthesize(provider, text, raw, opts.speaker || def.voice, b.speed ?? 1, { rate: b.rate ?? def.rate ?? '+0%', pitch: b.pitch ?? def.pitch ?? '+0Hz', beat: b.beat });
      let { channels } = await readWav(raw);
      let clip = channels[0];
      const span = speechSpan(clip, RATE);
      // Stille am Anfang/Ende abschneiden
      // Geregelte Stimme ist schon sauber geschnitten: nichts mehr kuerzen
      if (provider !== 'directed') clip = clip.slice(Math.max(0, Math.round(span.start * RATE) - 480), Math.round(span.end * RATE) + 2400);
      const offset = provider === 'directed' ? 0 : Math.max(0, span.start - 0.01);
      words = (words || estimateWords(text, span.start, span.end)).map((w) => ({ ...w, start: Math.max(0, w.start - offset) }));
      // In den Slot einpassen: notfalls Tempo erhoehen (ohne Tonhoehe zu aendern)
      let tempo = 1;
      const len = clip.length / RATE;
      if (len > slot) {
        tempo = Math.min(1.45, len / slot);
        const fitted = raw.replace('.wav', '-fit.wav');
        await writeWav(raw.replace('.wav', '-trim.wav'), clip);
        await run('ffmpeg', ['-v', 'error', '-y', '-i', raw.replace('.wav', '-trim.wav'), '-filter:a', `atempo=${tempo.toFixed(3)}`, fitted]);
        clip = (await readWav(fitted)).channels[0];
        words = words.map((w) => ({ ...w, start: w.start / tempo }));
        if (len / tempo > slot + 0.05) console.warn(`  ! Beat ${b.at} s: Text zu lang für den Slot (${(len / tempo).toFixed(1)} s > ${slot.toFixed(1)} s). Kürzen!`);
      }
      const at = b.at + 0.06;
      place(voice, clip, at, { gain: b.gain ?? 0 });
      if (b.space) {
        const s = send(b.space);
        const o = Math.round(at * RATE);
        for (let k = 0; k < clip.length && o + k < s.length; k++) s[o + k] += clip[k];
      }
      timeline.push({ at, dur: clip.length / RATE, tempo: +tempo.toFixed(3), text, words: words.map((w) => ({ w: w.w, start: +(at + w.start).toFixed(3) })) });
      console.log(`  Stimme ${b.at.toFixed(1)} s: „${text}“${tempo > 1 ? ` (×${tempo.toFixed(2)})` : ''}`);
    }
    await writeFile(join(dir, 'timeline.json'), JSON.stringify({ provider: opts.voice, beats: timeline }, null, 2));
  }

  // ---------- Effekte ----------
  const fx = track(duration);
  for (const c of cues) {
    const gen = sfx[c.name];
    if (!gen) {
      console.warn(`  ! Unbekannter Effekt „${c.name}“ bei ${c.t.toFixed(2)} s`);
      continue;
    }
    const clip = gen({ dur: c.dur, pitch: c.pitch, seed: Math.round(c.t * 100) + 1 });
    place(fx, clip, c.t, { gain: c.gain ?? -6, pan: c.pan ?? 0 });
    if (c.space) {
      const s = send(c.space);
      const o = Math.round(c.t * RATE);
      const g = dbToGain(c.gain ?? -6);
      for (let k = 0; k < clip.length && o + k < s.length; k++) s[o + k] += clip[k] * g;
    }
  }
  if (def.ambience) place(fx, sfx[def.ambience]({ dur: duration }), 0, { gain: -20 });

  // ---------- Stimmbearbeitung: Waerme, Praesenz, gleichmaessige Lautstaerke ----------
  if (def.voiceChain && !opts.noVoice) {
    const dry = join(dir, 'voice-dry.wav');
    const wet = join(dir, 'voice-wet.wav');
    await writeWav(dry, voice);
    await run('ffmpeg', ['-v', 'error', '-y', '-i', dry, '-af', def.voiceChain, wet]);
    const { channels } = await readWav(wet);
    voice[0] = channels[0];
    voice[1] = channels[1] ?? channels[0];
  }

  // ---------- Hall pro Ort ----------
  const room = track(duration);
  for (const [space, sig] of Object.entries(sends)) {
    const cfg = SPACES[space];
    const [l, r] = reverb(sig, cfg);
    for (let i = 0; i < l.length; i++) {
      room[0][i] += l[i] * cfg.wet;
      room[1][i] += r[i] * cfg.wet;
    }
  }

  // ---------- Musik mit Ducking unter der Stimme ----------
  const bed = music({ duration, ...(def.music || {}) });
  const duck = new Float32Array(bed[0].length);
  let envl = 0;
  for (let i = 0; i < duck.length; i++) {
    const v = Math.abs(voice[0][Math.min(i + (def.fxDuck ? Math.round(RATE * 0.09) : 0), duck.length - 1)]);
    envl = v > envl ? envl + (v - envl) * (def.fxDuck ? 0.2 : 0.02) : envl * 0.99994;
    duck[i] = 1 - (def.music?.duck ?? 0.65) * Math.min(1, envl * 6);
  }
  const musicGain = dbToGain(def.music?.gain ?? -14);
  // Effekte und Hall weichen der Stimme: schnell runter, langsam zurueck, tiefer als die Musik
  const fxKeep = new Float32Array(bed[0].length).fill(1);
  if (def.fxDuck) {
    const look = Math.round(RATE * 0.09);
    let e = 0;
    for (let i = 0; i < fxKeep.length; i++) {
      const v = Math.abs(voice[0][Math.min(i + look, fxKeep.length - 1)]);
      e = v > e ? e + (v - e) * 0.2 : e * 0.99996;
      fxKeep[i] = 1 - def.fxDuck * Math.min(1, e * 9);
    }
  }

  // ---------- Mischen ----------
  const fxGain = dbToGain(def.fxGain ?? 0);
  const mixed = track(duration);
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < mixed[c].length; i++) {
      mixed[c][i] = voice[c][i] + (fx[c][i] * 0.9 + room[c][i]) * fxGain * fxKeep[i] + bed[c][i] * musicGain * duck[i];
    }
  }
  // Einzelspuren fuer die Kontrolle der Mischung
  await writeWav(join(dir, 'stem-voice.wav'), voice);
  await writeWav(join(dir, 'stem-fx.wav'), fx.map((c) => c.map((v, i) => v * fxKeep[i])));
  await writeWav(join(dir, 'stem-room.wav'), room.map((c) => c.map((v, i) => v * fxKeep[i])));
  await writeWav(join(dir, 'stem-music.wav'), bed.map((c) => c.map((v, i) => v * musicGain * duck[i])));
  const rawMix = join(dir, 'mix-raw.wav');
  await writeWav(rawMix, mixed);
  const wavOut = join(ROOT, 'out', `${name}.wav`);
  // Lautheit fuer Social Media: -14 LUFS, True Peak -1,5 dB
  await run('ffmpeg', ['-v', 'error', '-y', '-i', rawMix, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', String(RATE), wavOut]);
  console.log(`Ton: ${relative(process.cwd(), wavOut)}`);

  const video = opts.video ? resolve(opts.video) : join(ROOT, 'out', `${name}.mp4`);
  const complete = (await exists(video)) && (await run('ffprobe', ['-v', 'error', video]).then(() => true, () => false));
  if (complete) {
    const final = video.replace(/\.mp4$/, '-ton.mp4');
    await run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', wavOut, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final]);
    console.log(`Video mit Ton: ${relative(process.cwd(), final)}`);
  } else {
    console.log(`(Kein fertiges Video unter ${relative(process.cwd(), video)} — erst rendern, dann erneut ausführen.)`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
