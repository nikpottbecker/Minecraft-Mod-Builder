#!/usr/bin/env python3
"""edge-tts mit Regie: Satz fuer Satz, eigenes Tempo, Tonhoehe und Pausen. Saetze werden im
Cache gehalten, damit Messung (timing.mjs) und Mischung (audio.mjs) dieselbe Aufnahme nutzen."""
import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import wave

import edge_tts

RATE = 48000


async def sentence(text, voice, rate, pitch, cache):
    key = hashlib.sha1(f'{text}|{voice}|{rate}|{pitch}'.encode()).hexdigest()[:16]
    mp3, meta = f'{cache}/{key}.mp3', f'{cache}/{key}.json'
    if not (os.path.exists(mp3) and os.path.exists(meta)):
        for attempt in range(4):
            try:
                words = []
                data = b''
                async for c in edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary='WordBoundary').stream():
                    if c['type'] == 'audio':
                        data += c['data']
                    elif c['type'] == 'WordBoundary':
                        words.append({'w': c['text'], 'start': c['offset'] / 1e7, 'end': (c['offset'] + c['duration']) / 1e7})
                break
            except Exception:
                if attempt == 3:
                    raise
                await asyncio.sleep(2 + attempt * 3)
        with open(mp3, 'wb') as f:
            f.write(data)
        with open(meta, 'w') as f:
            json.dump(words, f)
    with open(meta) as f:
        return mp3, json.load(f)


def decode(mp3):
    # Nur echte Stille entfernen: Ausklang der Woerter bleibt, weich ausgeblendet durch Nachlauf
    trim = 'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-65dB:start_silence=0.12,afade=t=in:d=0.02,areverse,apad=pad_dur=0.03'
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-af', trim, '-ac', '1', '-ar', str(RATE), '-f', 's16le', '-'], capture_output=True, check=True).stdout


async def main():
    p = argparse.ArgumentParser()
    p.add_argument('--text', required=True)
    p.add_argument('--voice', required=True)
    p.add_argument('--rate', default='+0%')
    p.add_argument('--pitch', default='+0Hz')
    p.add_argument('--gap', type=float, default=0.26)
    p.add_argument('--cache', required=True)
    p.add_argument('--out', required=True)
    a = p.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    pcm, words, t = b'', [], 0.0
    parts = [s for s in re.split(r'(?<=[.?!:])\s+', a.text.strip()) if s]
    for i, s in enumerate(parts):
        mp3, raw = await sentence(s, a.voice, a.rate, a.pitch, a.cache)
        clip = decode(mp3)
        dur = len(clip) / 2 / RATE
        first = raw[0]['start'] if raw else 0
        for w in raw:
            words.append({'w': w['w'], 'start': round(t + w['start'] - first, 3)})
        pcm += clip
        t += dur
        if i < len(parts) - 1:
            gap = a.gap * (0.5 if s.endswith(':') else 1)
            pcm += bytes(int(gap * RATE) * 2)
            t += gap
    with wave.open(a.out, 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm)
    print(json.dumps({'dur': round(t, 3), 'words': words}))


asyncio.run(main())
