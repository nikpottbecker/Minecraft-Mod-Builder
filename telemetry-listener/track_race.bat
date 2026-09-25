@echo off
REM Schaltet das naechste gestartete F1-25-Rennen zum Hochladen scharf.
REM Vor dem Rennstart doppelklicken (der Hintergrund-Listener muss bereits laufen).
python "%~dp0f1_listener.py" --arm
pause
