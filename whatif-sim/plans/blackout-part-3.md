# Blackout in a high-rise, Part 3: "Floor 9"

Status: Plan. Skript liegt in `scenes/blackout3.script.js`, mit Stimmregie gemessen: 57 s, Story-Score 100/100.
Gebaut ist die Szene noch nicht.

## Die eine Frage

Die Wasser-Geschichte kippt in eine größere Gefahr. Die Frage wird persönlich:
**Rennst du allein durch den Rauch, oder bleibst du bei Helen?**

Alles folgt aus Part 1 und 2, nichts ist Zufall:
- Batterien leer → jede Etage brennt Kerzen
- Kein Netz seit Tag 1 → kein Notruf
- Keine Pumpen → Löschwasserdruck wird oben knapp
- Aufzug tot, Helen schafft keine Treppen → sie sitzt fest

## Einstieg nach Abstimmung

Die Mehrheit aus Part 2 entscheidet nur den ersten Satz, danach läuft die Story gleich.
Umschalten: `VOTE` in `blackout3.script.js`, dann `node timing.mjs`.

| Mehrheit | Erster Satz |
|---|---|
| TELL | You told them. Now 40 people want Marek's water. |
| QUIET | You said nothing. They followed you anyway. |

Bei knappem Ergebnis gilt die Mehrheit trotzdem. Das Video bestätigt damit, dass die Kommentare zählen.
Das Vorbild-Video nutzt genau diese Beteiligung, und sie gibt Zuschauern einen Grund, wiederzukommen.

## Hook-Varianten (TELL)

| Variante | Urteil |
|---|---|
| **You told them. Now 40 people want Marek's water.** | **Gewählt.** Beantwortet die Abstimmung, öffnet sofort Konflikt |
| Your choice just started a fire. | Stark, aber nicht wahr: Die Ursache ist eine Kerze |
| The building is out of water. Then someone lights a candle. | Gut, verrät aber das Feuer zu früh |
| Everyone on floor 14 hates you now. | Klick-Reiz, hält die Story nicht |
| What happens when 40 people need 1 bathtub? | Interessant, führt aber in eine andere Geschichte |

Das Feuer bleibt absichtlich verborgen bis 21,7 s. Erst der Geruch, dann „Smoke.“

## Rechnung

| Moment | Wert | Formel |
|---|---|---|
| Wasser Tag 2, 10:05 Uhr | 17 L | aus Part 2 |
| Wasser Tag 3, 19:52 Uhr | 11 L | rund 1,4 Tage × 4 L ≈ 6 L verbraucht |
| Abstand zum Feuer | 5 Stockwerke | 14 − 9 |
| Höhe | 42 m | 14 × 3 m, über der 22-m-Linie |

## Retention-Aufbau

| Schleife | Geht auf | Geht zu |
|---|---|---|
| Was passiert mit Marek? | 0,0 s | 3,1 s |
| Warum warnen Feuerwehrleute? | 13,4 s | 21,7 s |
| Was riecht Helen? | 16,4 s | 21,7 s |
| Wie kommt Hilfe? | 30,3 s | 36,5 s (gar nicht) |
| Was tut Helen? | 41,2 s | 44,7 s |
| Rennen oder bleiben? | 46,8 s | offen, Kommentare und Part 4 |

**Dauer-Elemente**
- **Neu: Rauch-Anzeige.** „SMOKE: FLOOR 9“ steigt ab 26,4 s Etage für Etage Richtung 14. Das ersetzt den Etagen-Zähler aus Part 2 und ist die Bedrohung als Zahl.
- **Wasser-Anzeige:** 11 L, bleibt für Serien-Zuschauer.
- **Countdown:** DECISION IN, läuft auf die Schlussfrage zu.
- **Sichtbarer Rauch:** Vom Türspalt an wird das Bild Schritt für Schritt grauer.

## Beat-Sheet

| Zeit | Anteil | Text | Bild | Ton |
|---|---|---|---|---|
| 0,0 | 0 % | You told them. Now 40 people want Marek's water. | Volles Treppenhaus, Menge vor Tür 5C, Cover | Gemurmel, Faust an Tür |
| 3,1 | 5 % | Day 3. Marek bolts his door. The last tap is gone. | Nahaufnahme Riegel, Hand zieht ihn zu | Schwerer Riegel, Stille |
| 6,9 | 12 % | You have 11 liters left. Your flashlight just died. | Wohnung abends, Lampe flackert aus, Anzeige 11 L | Klick, Klick, Dunkel |
| 10,6 | 19 % | So tonight, every floor burns candles. | Außen: Hochhaus, in den Fenstern gehen Kerzen an | Wind, warmer Drone |
| 13,4 | 23 % | Firefighters warn against exactly that. | Karte Rule #4, Kerze in Nahaufnahme | Tiefer Ton, Flamme knistert |
| 16,4 | 29 % | 7:52 PM. Helen lifts her head. She smells it first. | Helen bei Kerzenlicht, Kopf hebt sich, Blick zur Tür | Musik reißt ab, Ticken |
| 21,7 | 38 % | Smoke. | **Peak:** Harter Schnitt, Rauch kriecht unter der Tür durch | Tiefer Schlag, dann fast Stille |
| 23,2 | 41 % | You open your door one inch. The stairwell is gray. | Türspalt von innen, graues Licht | Türknarren, fernes Rufen |
| 26,4 | 46 % | It started on floor 9. One candle. Five floors below you. | Schema: Feuer auf Floor 9, Rauch steigt, Anzeige startet | Riser, Feuer rauscht |
| 30,3 | 53 % | You dial for help. No network. | Handy-Display „No service“ | Ton bricht ab |
| 32,4 | 57 % | And without pumps, fire hoses can run short on pressure up here. | Schema: Druck endet weit unter Floor 14 | Sirene sehr fern |
| 36,5 | 64 % | Then you look at Helen. She's 81. She can't do stairs. | Nahaufnahme Helen, Rollator im Vordergrund | Herzschlag setzt ein |
| 41,2 | 72 % | Alone, you might make it. She knows. | Deine Figur, Blick zwischen Tür und Helen | Herzschlag schneller |
| 44,7 | 78 % | She says: "Go." | Helen lächelt traurig, nah | Alles weg, nur die Stimme |
| 46,8 | 82 % | Run through the smoke. Or shut the door, and stay. | Schnitt Treppenhaus voller Rauch, Schnitt Tür fällt zu | Feuer, dann Tür dumpf |
| 50,8 | 89 % | What would you do? | Dein Gesicht, Rauch im Hintergrund, Titel | Stille, ein Husten |
| 52,4 | 92 % | Abstimmung | Karten RUN und STAY mit Szenenbildern, Comment RUN or STAY, Part 4 soon · Follow | Herzschlag, Riser |

## Stimme

Andrew wie in Part 1 und 2, Regie ist im Skript pro Satz festgelegt:
- Ruhig und beobachtend bis 16 s
- Ab „She smells it first“ tiefer und langsamer
- „Smoke.“ und „She says: Go.“ fast geflüstert, jeweils mit Pause danach
- Lange Pausen vor den Wendepunkten, angelehnt an das Referenzvideo

## Sound

Neu als Effekte: Riegel, Kerze knistert, Feuerrauschen, ferne Rufe, Husten, Feuermelder fern.
Vorhanden: Gemurmel, Herzschlag, Türknarren, Sirene, Wind, Raumton.
Mischung nach den Messwerten aus Part 2: Musik im Schnitt rund 8–10 dB unter der Stimme, Effekte +5 dB,
Stems nach jedem Lauf prüfen. Stille gezielt bei 16 s, 22 s und 44,7 s.

## Neu zu bauen

- **Rauch:** Volumen-Look aus weichen Partikeln im Flur und unter der Tür, dazu Grau-Verlauf im Farblook
- **Sets:** Abendliche Wohnung mit Kerzen, Außenansicht mit Kerzen in den Fenstern (aus Part 1), volles Treppenhaus
- **Figuren:** Menge vor Mareks Tür, Rollator bei Helen
- **UI:** Rauch-Anzeige, Schema-Variante mit Feuer und Druckgrenze, Karten RUN und STAY
- **Part-1-Bausteine:** Hochhaus außen und Handy-Display wiederverwenden

## Veröffentlichung

- **Termin-Vorschlag:** Dienstag, 3. November, 18:00 Uhr deutscher Zeit, über Metricool
- **Caption:** `Part 3 | One candle, five floors below you… 🕯️🏢 Run or stay? #blackout #whatif #survival #scenario #highrise #powerout`
- **Ablauf:** Bis Montagabend Kommentare zu Part 2 auszählen, Einstieg setzen, Timing messen, rendern, einplanen
- **Fester Kommentar:** enthält den echten Sicherheitshinweis, siehe unten

## Sicherheit

Das Video stellt eine lebensgefährliche Wahl zur Abstimmung, deshalb steht die richtige Antwort sofort daneben:

```text
Real advice: smoke in the stairwell? Most fire services say stay in your home, close the door, seal the gaps with wet towels, call emergency services and signal at a window. Part 4 shows why. Sources: German fire services (e.g. Feuerwehr Lehrte, Baden-Württemberg Interior Ministry), Berlin fire department on candles.
```

Part 4 löst das auf: **Die Tür zu lassen ist oft die sicherere Wahl**, entgegen dem Bauchgefühl. Das ist zugleich der Twist.

## Quellen

- Rauch im Treppenhaus, Wohnung nicht verlassen, Türen schließen, Ritzen mit nassen Tüchern, am Fenster zeigen:
  Feuerwehr Lehrte, Innenministerium Baden-Württemberg, Feuerwehr Peising
- Taschenlampen statt Kerzen, Kerzen nie unbeaufsichtigt: Berliner Feuerwehr, Aussage aus Berichten zum Stromausfall
  Treptow-Köpenick (September 2025); Statistik zu Kerzenbränden bei Stromausfällen habe ich nicht gefunden
- Löschwasserdruck in sehr hohen Gebäuden ohne Strom zu niedrig: t-online
- Basisstationen laufen nur kurz: TAB-Bericht, Bundestag Drucksache 17/5672
