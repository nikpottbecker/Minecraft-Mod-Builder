# Story-Regelwerk: Warum jemand bis zum Ende schaut

Ein „Was wäre wenn“-Video ist eine Mini-Geschichte mit **einer** Frage und **einer**
Antwort. Die Regeln unten stützen sich auf belastbare Psychologie (Loewenstein,
Kahneman) und Erzähl-Handwerk (South Park, Rhetorik). Zahlen aus Creator-Blogs zur
Watchtime sind nur Richtwerte. Am Ende entscheiden die eigenen Analytics.

`node lint-story.mjs scenes/<name>.js` prüft die Regeln mit ✓/✗ automatisch.

---

## 1. Psychologie: was das Gehirn festhält

### Neugierlücke (Loewenstein, „Information Gap“, 1994)
Neugier entsteht, wenn man merkt, dass zwischen dem, was man weiß, und dem, was man
wissen will, eine **kleine, lösbare** Lücke klafft. Zu groß, und man gibt auf. Gar
keine, und man scrollt weiter.
- **Hook = offene Frage**, deren Antwort man *fast* erraten kann („Reibung weg? Dann
  … rutscht man halt?“).
- Die Frage wird **erst am Ende vollständig** beantwortet. Zwischendurch nur
  Teilantworten, die neue kleine Fragen öffnen (offene Schleifen).
- **Erwartungsbruch** verstärkt Neugier: Zeige etwas, das der Intuition widerspricht
  („Wer stillstand, steht noch“: man hätte gedacht, alle fallen).

### Peak-End-Regel (Kahneman)
Menschen bewerten ein Erlebnis fast nur nach dem **intensivsten Moment** und dem
**Ende**, die Länge zählt kaum (*duration neglect*).
- Plane **einen** Höhepunkt (`role: 'peak'`) zwischen 25 und 80 % der Länge. Er bekommt
  den stärksten Reiz: Aufprall, Schnitt, Blitz, Kamerawackeln.
- Das Ende ist kein Ausklingen, sondern die **Pointe**: die klarste Zahl oder der
  überraschendste Satz.

### Hook in der ersten Sekunde
Gewischt wird in Sekundenbruchteilen. Deshalb:
- **Frame 0 hat Inhalt.** Kein Schwarzbild, kein Logo, kein Einfaden.
- Text **und** Bild stellen sofort die Frage. Viele schauen ohne Ton, deshalb muss der
  Untertitel die Geschichte allein tragen.
- Im Bild sofort Bewegung und Spannung zeigen (Auto fährt auf rote Ampel zu).

### Loop
Wenn der letzte Satz in den ersten übergeht („Und das alles, weil für 5 Sekunden …“ →
„Was wäre, wenn die Reibung …“), schauen viele ein zweites Mal, ohne es zu merken.
`role: 'loop'` und eine Kamera, die am Ende wieder wie am Anfang aussieht.

---

## 2. Erzählstruktur: „aber/deshalb“ statt „und dann“

Die South-Park-Autoren Trey Parker und Matt Stone prüfen jedes Drehbuch so: Steht
zwischen zwei Szenen „und dann“, ist es langweilig. Es muss **„aber“** oder
**„deshalb“** sein. Das ist Kausalität statt Aufzählung.

Jeder Beat in `story.beats` hat deshalb ein `link`-Feld:

| Rolle | Funktion | Typischer Link |
| --- | --- | --- |
| `hook` | Die Frage. Offen, konkret, kurz. | – |
| `setup` | Die normale Welt in einem Satz. Gerne „du“. | also |
| `turn` | Das Ereignis bricht die Welt. | **aber** |
| `escalation` | Erste Folge, dann eine größere. | deshalb |
| `peak` | Der stärkste, sichtbarste Moment. | also / deshalb |
| `consequence` | Was übrig bleibt. | doch |
| `twist` | Was der Intuition widerspricht. | **aber** |
| `answer` / `payoff` | Die Antwort auf die Hook-Frage, mit Zahl. | denn / aber |
| `loop` | Ein Satz, der zurück zum Anfang führt. | denn |

**Bauplan für 15–25 s** (Zeiten als Richtwert):

```
0,0 s   HOOK        Frage als großer Titel, Bild zeigt schon Spannung
2–3 s   SETUP       Normale Welt, „du“
3–4 s   TURN        „Aber …“ — harter Schnitt, Nahaufnahme
4–8 s   ESKALATION  2–3 Folgen, jede größer als die vorige, eine davon = PEAK
8–13 s  FOLGEN      Was ist passiert? Zähler, Totale
11–13 s TWIST       Das Unerwartete
13–17 s PAYOFF      Die Antwort mit einer Zahl + Quelle
letzte 2 s LOOP     Satz, der in den Hook zurückführt
```

---

## 3. Rhetorik: wie man jeden Satz schärft

- **Eine Zeile = ein Gedanke.** Höchstens 7–9 Wörter und 4 Wörter pro Sekunde.
- **Kontrast / Antithese** bleibt hängen: „Wer läuft, liegt. Wer steht, steht.“
- **Dreierregel**: Drei Folgen wirken vollständig, zwei zu wenig, vier zu lang
  („Bremsen? Nichts. Lenken? Nichts. Gas geben? Nichts.“).
- **Konkret statt abstrakt**: nicht „Fahrzeuge verlieren die Kontrolle“, sondern „Das
  rote Auto rutscht 40 m über Rot“.
- **Zahlen greifbar machen**: Vergleich mit Bekanntem (Fußballfeld, Stockwerke,
  Wohnzimmer) statt nackter Einheit.
- **Du-Ansprache** beim Setup: „Du bremst.“ macht den Zuschauer zur Figur.
- **Gelbes Wort** (`*Wort*`) = das eine Wort, das man auch ohne den Rest versteht.
  Pro Zeile höchstens eins bis zwei.
- **Kurze Fragen als Brücke**: „Lenken?“, „Grün?“: Frage und sofortige Antwort
  halten das Tempo hoch.
- **Ehrlichkeit**: Keine erfundenen Zahlen. Wer einmal bei einem falschen Fakt
  ertappt wird, glaubt dem Kanal nichts mehr. Jede Zahl braucht eine Quelle oder Formel
  und wird aus der Simulation berechnet (`{platzhalter}`).

---

## 4. Checkliste vor dem Rendern

- [ ] `node lint-story.mjs` ohne ✗
- [ ] Hook-Frage ist in Frame 0 lesbar
- [ ] Jeder Untertitel passiert **sichtbar** in der aktuellen Einstellung
- [ ] Ein klarer Höhepunkt mit stärkstem Reiz
- [ ] Twist widerspricht der Intuition
- [ ] Payoff beantwortet die Hook-Frage mit einer Zahl
- [ ] Letzter Satz führt in den ersten zurück
- [ ] Ohne Ton verständlich
- [ ] Alle Zahlen mit Quelle in `sources`
