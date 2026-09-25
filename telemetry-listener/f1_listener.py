#!/usr/bin/env python3
"""
F1 25 UDP-Telemetrie-Listener fuer die F1-Freunde-Rangliste.

Empfaengt die offiziellen UDP-Telemetriepakete von F1 25 (Codemasters/EA,
Format-Version 2025), wartet auf das "Final Classification"-Paket am
Rennende und schreibt die Ergebnisse automatisch in Supabase - in die
gleichen Tabellen, die auch der Cloudflare-Worker und die Web-App nutzen.

Quelle der Paketstrukturen: offizielle EA-Spezifikation
"Data Output from F1 25 v3" (EA Forums), gespiegelt u.a. in
https://github.com/MacManley/f1-25-udp

So aktivierst du die Telemetrie in F1 25:
  Einstellungen -> Telemetrie-Einstellungen
    UDP-Telemetrie:      Ein
    UDP-Broadcast-Modus: Aus
    UDP-IP-Adresse:      <IP des Rechners, auf dem dieses Skript laeuft>
    UDP-Port:            20777 (Standard)
    UDP-Format:          2025

Der Listener laeuft dauerhaft im Hintergrund, laedt aber NUR Rennen hoch,
die vorher explizit "scharf geschaltet" wurden - damit nicht jedes Testrennen
oder jede Solo-Runde in der Rangliste landet. Scharfschalten:

  python f1_listener.py --arm

(oder Doppelklick auf track_race.bat unter Windows). Das gilt fuer genau
das naechste Rennen, das gestartet wird - danach ist der Listener wieder
automatisch "kalt" und ignoriert Rennen, bis du erneut scharfschaltest.

Nutzung:
  pip install requests
  python f1_listener.py           # Listener dauerhaft im Hintergrund laufen lassen
  python f1_listener.py --arm     # naechstes Rennen zum Hochladen scharfschalten
  # optional: bestehende Renn-ID statt automatisch neuem Rennen verwenden
  python f1_listener.py --race-id 12
"""

import argparse
import os
import socket
import struct
import sys
from datetime import datetime, timezone

import requests

ARM_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "TRACK_NEXT_RACE.flag")

SUPABASE_URL = "https://byitheklzbpwysdeckvy.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
    "ImJ5aXRoZWtsemJwd3lzZGVja3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzc4"
    "OTgsImV4cCI6MjEwNTgxMzg5OH0.5DExeZ8iKYWFw_H70K3QBdiaQ6_4GVnFKlNQg8t8wck"
)

PACKET_ID_PARTICIPANTS = 4
PACKET_ID_FINAL_CLASSIFICATION = 8

# Result statuses that count as "did not finish" for our own points scheme.
DNF_RESULT_STATUSES = {4, 5, 6, 7}  # DNF, disqualified, not classified, retired

# --- Struct layouts, exactly as in the official F1 25 UDP specification ---
# All little-endian, tightly packed (no padding).

HEADER_FORMAT = "<HBBBBBQfIIBB"
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)  # 29 bytes
HEADER_FIELDS = [
    "m_packetFormat", "m_gameYear", "m_gameMajorVersion", "m_gameMinorVersion",
    "m_packetVersion", "m_packetId", "m_sessionUID", "m_sessionTime",
    "m_frameIdentifier", "m_overallFrameIdentifier", "m_playerCarIndex",
    "m_secondaryPlayerCarIndex",
]

PARTICIPANT_FORMAT = "<BBBBBBB32sBBHBB3B3B3B3B"
PARTICIPANT_SIZE = struct.calcsize(PARTICIPANT_FORMAT)  # 57 bytes
NUM_CARS = 22

CLASSIFICATION_FORMAT = "<BBBBBBBIdBBB8B8B8B"
CLASSIFICATION_SIZE = struct.calcsize(CLASSIFICATION_FORMAT)  # 46 bytes


def parse_header(data):
    values = struct.unpack_from(HEADER_FORMAT, data, 0)
    return dict(zip(HEADER_FIELDS, values))


def parse_participants(data):
    """Returns {car_index: driver_name}."""
    offset = HEADER_SIZE
    num_active_cars = data[offset]
    offset += 1
    names = {}
    for i in range(NUM_CARS):
        chunk = data[offset:offset + PARTICIPANT_SIZE]
        if len(chunk) < PARTICIPANT_SIZE:
            break
        fields = struct.unpack(PARTICIPANT_FORMAT, chunk)
        raw_name = fields[7]  # 32s
        name = raw_name.split(b"\x00", 1)[0].decode("utf-8", errors="replace").strip()
        if i < num_active_cars and name:
            names[i] = name
        offset += PARTICIPANT_SIZE
    return names


def parse_final_classification(data):
    """Returns list of dicts, indexed by car index (list position)."""
    offset = HEADER_SIZE
    num_cars = data[offset]
    offset += 1
    results = []
    for i in range(NUM_CARS):
        chunk = data[offset:offset + CLASSIFICATION_SIZE]
        if len(chunk) < CLASSIFICATION_SIZE:
            break
        fields = struct.unpack(CLASSIFICATION_FORMAT, chunk)
        (position, num_laps, grid_position, points, num_pit_stops,
         result_status, result_reason, best_lap_time_ms, total_race_time,
         penalties_time, num_penalties, num_tyre_stints,
         *_rest) = fields
        results.append({
            "car_index": i,
            "position": position,
            "result_status": result_status,
            "result_reason": result_reason,
            "best_lap_time_ms": best_lap_time_ms,
        })
        offset += CLASSIFICATION_SIZE
    return results[:num_cars]


def rest_headers(extra=None):
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def get_or_create_driver(name, cache):
    if name in cache:
        return cache[name]
    resp = requests.get(
        SUPABASE_URL + "/rest/v1/drivers",
        params={"select": "id,name", "name": "eq." + name},
        headers=rest_headers(),
        timeout=10,
    )
    resp.raise_for_status()
    rows = resp.json()
    if rows:
        driver_id = rows[0]["id"]
    else:
        create = requests.post(
            SUPABASE_URL + "/rest/v1/drivers",
            headers=rest_headers({"Prefer": "return=representation"}),
            json={"name": name, "color": "#e10600"},
            timeout=10,
        )
        create.raise_for_status()
        driver_id = create.json()[0]["id"]
        print(f"  + neuer Fahrer angelegt: {name} (id {driver_id})")
    cache[name] = driver_id
    return driver_id


def create_race(track_hint=None):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    name = f"F1 25 Auto-Import {today}"
    resp = requests.post(
        SUPABASE_URL + "/rest/v1/races",
        headers=rest_headers({"Prefer": "return=representation"}),
        json={"name": name, "track": track_hint, "race_date": today},
        timeout=10,
    )
    resp.raise_for_status()
    race_id = resp.json()[0]["id"]
    print(f"Neues Rennen angelegt: '{name}' (id {race_id})")
    return race_id


def upsert_result(race_id, driver_id, position, dnf):
    payload = {
        "race_id": race_id,
        "driver_id": driver_id,
        "position": None if dnf else position,
        "dnf": dnf,
    }
    resp = requests.post(
        SUPABASE_URL + "/rest/v1/results",
        params={"on_conflict": "race_id,driver_id"},
        headers=rest_headers({"Prefer": "resolution=merge-duplicates"}),
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()


def set_fastest_lap(race_id, driver_id):
    resp = requests.patch(
        SUPABASE_URL + "/rest/v1/races",
        params={"id": "eq." + str(race_id)},
        headers=rest_headers(),
        json={"fastest_lap_driver_id": driver_id},
        timeout=10,
    )
    resp.raise_for_status()


def process_final_classification(data, participants, race_id, driver_cache):
    classification = parse_final_classification(data)
    print(f"Zielklassement empfangen ({len(classification)} Autos) - schreibe nach Supabase...")

    if race_id is None:
        race_id = create_race()

    best_time_ms = None
    best_driver_id = None
    top10_driver_ids = set()

    for entry in classification:
        name = participants.get(entry["car_index"])
        if not name:
            continue  # kein Teilnehmername bekannt (Participants-Paket fehlte)

        driver_id = get_or_create_driver(name, driver_cache)
        dnf = entry["result_status"] in DNF_RESULT_STATUSES
        position = entry["position"]

        upsert_result(race_id, driver_id, position, dnf)
        print(f"  {name}: Platz {position if not dnf else 'DNF'}")

        if not dnf and position and position <= 10:
            top10_driver_ids.add(driver_id)
            if entry["best_lap_time_ms"] and (
                best_time_ms is None or entry["best_lap_time_ms"] < best_time_ms
            ):
                best_time_ms = entry["best_lap_time_ms"]
                best_driver_id = driver_id

    if best_driver_id:
        set_fastest_lap(race_id, best_driver_id)
        print(f"  Schnellste Runde: Fahrer-ID {best_driver_id}")

    print(f"Fertig. Ergebnisse stehen unter Rennen-ID {race_id}.\n")
    return race_id


def arm_next_race():
    with open(ARM_FILE, "w") as f:
        f.write("armed\n")
    print(f"Scharf geschaltet: Das naechste gestartete Rennen wird hochgeladen.")
    print(f"(Marker-Datei: {ARM_FILE})")


def consume_arm_flag():
    """Prueft, ob scharfgeschaltet wurde, und loescht die Markierung sofort
    wieder - gilt also nur fuer genau ein Rennen."""
    if os.path.exists(ARM_FILE):
        try:
            os.remove(ARM_FILE)
        except OSError:
            pass
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=20777, help="UDP-Port (Standard: 20777)")
    parser.add_argument("--race-id", type=int, default=None,
                         help="Bestehende Renn-ID verwenden statt automatisch ein neues Rennen anzulegen")
    parser.add_argument("--arm", action="store_true",
                         help="Naechstes gestartetes Rennen zum Hochladen scharfschalten und beenden")
    args = parser.parse_args()

    if args.arm:
        arm_next_race()
        return

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", args.port))
    print(f"Warte auf F1-25-Telemetrie auf UDP-Port {args.port} ...")
    print("(In F1 25: Einstellungen -> Telemetrie-Einstellungen -> UDP-Telemetrie: Ein,")
    print(" UDP-IP-Adresse = IP dieses Rechners, UDP-Format = 2025)")
    print("Rennen werden NUR hochgeladen, wenn du sie vorher scharfschaltest:")
    print("  python f1_listener.py --arm   (oder track_race.bat)\n")

    participants_by_session = {}
    processed_sessions = set()
    tracked_sessions = {}  # session_uid -> bool
    driver_cache = {}

    try:
        while True:
            data, _addr = sock.recvfrom(2048)
            if len(data) < HEADER_SIZE:
                continue
            header = parse_header(data)
            if header["m_packetFormat"] != 2025:
                continue  # anderes Spiel/Format, ignorieren

            session_uid = header["m_sessionUID"]
            packet_id = header["m_packetId"]

            if session_uid not in tracked_sessions:
                # Neue Session erkannt - jetzt entscheiden, ob sie getrackt wird.
                is_armed = consume_arm_flag()
                tracked_sessions[session_uid] = is_armed
                if is_armed:
                    print(f"Neues Rennen erkannt (Session {session_uid}) - wird getrackt.")
                else:
                    print(f"Neues Rennen erkannt (Session {session_uid}) - wird ignoriert (nicht scharfgeschaltet).")

            if not tracked_sessions[session_uid]:
                continue  # dieses Rennen ist nicht scharfgeschaltet - komplett ignorieren

            if packet_id == PACKET_ID_PARTICIPANTS:
                participants_by_session[session_uid] = parse_participants(data)

            elif packet_id == PACKET_ID_FINAL_CLASSIFICATION:
                if session_uid in processed_sessions:
                    continue  # dieses Rennen wurde schon verarbeitet
                participants = participants_by_session.get(session_uid, {})
                if not participants:
                    print("Zielklassement ohne bekannte Teilnehmer empfangen - ignoriere.")
                    continue
                processed_sessions.add(session_uid)
                process_final_classification(data, participants, args.race_id, driver_cache)

    except KeyboardInterrupt:
        print("\nBeendet.")
        sys.exit(0)


if __name__ == "__main__":
    main()
