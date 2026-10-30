#!/usr/bin/env python3
"""Stimme per edge-tts inklusive echter Wortzeiten (Sekunden) als JSON auf stdout."""
import argparse
import asyncio
import json

import edge_tts


async def main():
    p = argparse.ArgumentParser()
    p.add_argument('--text', required=True)
    p.add_argument('--voice', required=True)
    p.add_argument('--out', required=True)
    a = p.parse_args()
    words = []
    with open(a.out, 'wb') as f:
        async for c in edge_tts.Communicate(a.text, a.voice, boundary='WordBoundary').stream():
            if c['type'] == 'audio':
                f.write(c['data'])
            elif c['type'] == 'WordBoundary':
                words.append({'w': c['text'], 'start': c['offset'] / 1e7, 'end': (c['offset'] + c['duration']) / 1e7})
    print(json.dumps(words))


asyncio.run(main())
