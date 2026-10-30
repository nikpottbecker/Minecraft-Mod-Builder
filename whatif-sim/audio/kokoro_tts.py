#!/usr/bin/env python3
"""Lokale Stimme (Kokoro). Satz fuer Satz erzeugen, damit Satzzeiten exakt sind;
Woerter werden innerhalb eines Satzes nach Laenge verteilt. JSON auf stdout."""
import argparse
import json
import os
import re

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HOME = os.path.expanduser('~/.cache/whatif-tts')


def trim(a, rate, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    return a[max(0, idx[0] - int(rate * 0.015)):min(len(a), idx[-1] + int(rate * 0.06))]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--text', required=True)
    p.add_argument('--voice', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--speed', type=float, default=1.0)
    a = p.parse_args()
    k = Kokoro(f'{HOME}/kokoro-v1.0.int8.onnx', f'{HOME}/voices-v1.0.bin')
    lang = 'en-us' if a.voice[0] == 'a' else 'en-gb'
    parts, words, t, rate = [], [], 0.0, 24000
    sentences = [s for s in re.split(r'(?<=[.?!:])\s+', a.text.strip()) if s]
    for i, s in enumerate(sentences):
        audio, rate = k.create(s, voice=a.voice, speed=a.speed, lang=lang)
        audio = trim(audio, rate)
        dur = len(audio) / rate
        tokens = s.split()
        weight = [len(w) + 2 for w in tokens]
        total = sum(weight)
        acc = 0
        for w, wt in zip(tokens, weight):
            words.append({'w': w, 'start': round(t + dur * acc / total, 3), 'end': round(t + dur * (acc + wt) / total, 3)})
            acc += wt
        parts.append(audio)
        t += dur
        if i < len(sentences) - 1:
            gap = 0.12 if s.endswith(':') else 0.24
            parts.append(np.zeros(int(rate * gap), dtype=audio.dtype))
            t += gap
    sf.write(a.out, np.concatenate(parts), rate)
    print(json.dumps(words))


main()
