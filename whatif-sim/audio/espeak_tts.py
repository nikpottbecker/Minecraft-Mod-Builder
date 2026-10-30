"""Offline-Sprachausgabe mit espeak-ng (ueber das pip-Paket espeakng-loader).

Klingt roboterhaft, liefert aber exakte Zeitstempel pro Wort. Gedacht zum Testen
der Pipeline ohne Internet; fuer echte Videos edge-tts oder ElevenLabs nehmen.

    python3 -I espeak_tts.py --text "Hallo Welt" --out hallo.wav [--voice de] [--rate 165]

Gibt JSON aus: {"duration": s, "words": [{"w": "Hallo", "start": s}, ...]}
"""

import argparse
import ctypes
import json
import os
import wave

import espeakng_loader

AUDIO_OUTPUT_SYNCHRONOUS = 2
EVENT_WORD = 1
EVENT_LIST_TERMINATED = 0
POS_CHARACTER = 1
CHARS_UTF8 = 1
ESPEAK_RATE = 1
ESPEAK_PITCH = 3


class Event(ctypes.Structure):
    _fields_ = [
        ("type", ctypes.c_int),
        ("unique_identifier", ctypes.c_uint),
        ("text_position", ctypes.c_int),
        ("length", ctypes.c_int),
        ("audio_position", ctypes.c_int),
        ("sample", ctypes.c_int),
        ("user_data", ctypes.c_void_p),
        ("id", ctypes.c_char * 8),
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--voice", default="de")
    ap.add_argument("--rate", type=int, default=165)
    ap.add_argument("--pitch", type=int, default=42)
    args = ap.parse_args()

    lib = ctypes.CDLL(espeakng_loader.get_library_path())
    data_dir = os.path.dirname(espeakng_loader.get_data_path())
    lib.espeak_Initialize.restype = ctypes.c_int
    rate = lib.espeak_Initialize(AUDIO_OUTPUT_SYNCHRONOUS, 0, data_dir.encode(), 0)
    if rate <= 0:
        raise SystemExit("espeak konnte nicht initialisiert werden")
    lib.espeak_SetVoiceByName(args.voice.encode())
    lib.espeak_SetParameter(ESPEAK_RATE, args.rate, 0)
    lib.espeak_SetParameter(ESPEAK_PITCH, args.pitch, 0)

    samples = bytearray()
    word_events = []

    CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.POINTER(Event))

    def on_synth(wav, n, events):
        if n > 0:
            samples.extend(ctypes.string_at(wav, n * 2))
        i = 0
        while events[i].type != EVENT_LIST_TERMINATED:
            ev = events[i]
            if ev.type == EVENT_WORD:
                word_events.append((ev.text_position, ev.length, ev.audio_position / 1000.0))
            i += 1
        return 0

    cb = CALLBACK(on_synth)
    lib.espeak_SetSynthCallback(cb)
    text = args.text.encode("utf-8")
    lib.espeak_Synth(text, len(text) + 1, 0, POS_CHARACTER, 0, CHARS_UTF8, None, None)
    lib.espeak_Synchronize()

    with wave.open(args.out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(bytes(samples))

    # text_position ist 1-basiert und zaehlt Bytes in UTF-8
    words = []
    for pos, length, start in word_events:
        chunk = text[pos - 1 : pos - 1 + length].decode("utf-8", errors="ignore")
        words.append({"w": chunk, "start": round(start, 3)})
    print(json.dumps({"duration": len(samples) / 2 / rate, "rate": rate, "words": words}))


if __name__ == "__main__":
    main()
