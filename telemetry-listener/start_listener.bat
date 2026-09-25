@echo off
REM Startet den Telemetrie-Listener dauerhaft im Hintergrund.
REM Einmal starten (z.B. wenn du F1 25 startest) und laufen lassen -
REM er laedt Rennen aber nur hoch, wenn du vorher track_race.bat ausgefuehrt hast.
cd /d "%~dp0"
python f1_listener.py
pause
