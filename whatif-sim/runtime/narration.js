// Erzaehlvideos: Die Stimme gibt das Timing vor. Aus dem Skript (Saetze) und den
// gemessenen Wortzeiten (timing.mjs) entstehen Beats, Untertitel-Stuecke und die Laenge.

const tokens = (text) => String(text).trim().split(/\s+/).filter(Boolean);

// Wortzeiten auf die Untertitel-Woerter legen. Weicht die Anzahl ab (z. B. "6:42 PM" gesprochen
// als "six forty-two"), werden die Woerter nach Laenge ueber die Satzdauer verteilt.
export function wordTimes(text, timing) {
  const plain = tokens(String(text).replace(/\*/g, ''));
  if (timing.words?.length === plain.length) return plain.map((w, i) => ({ w, start: timing.words[i].start }));
  const weight = plain.map((w) => w.length + 2);
  const total = weight.reduce((s, w) => s + w, 0);
  let acc = 0;
  return plain.map((w, i) => {
    const start = (acc / total) * timing.dur;
    acc += weight[i];
    return { w, start: +start.toFixed(3) };
  });
}

// Stuecke mit hoechstens `max` Woertern; Satzzeichen beenden ein Stueck.
export function chunkWords(words, max = 4) {
  const chunks = [];
  let cur = [];
  for (const word of words) {
    cur.push(word);
    if (cur.length >= max || /[.,:?!…]$/.test(word.w)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export function layout(lines, timing, { gap = 0.35, lead = 0.06, tail = 1.2, max = 4 } = {}) {
  if (timing.lines.length !== lines.length) throw new Error('Timing passt nicht zum Skript: node timing.mjs erneut ausführen');
  const beats = [];
  const chunks = [];
  const at = {};
  let t = 0;
  lines.forEach((line, i) => {
    const tl = timing.lines[i];
    if (tl.text !== (line.say ?? line.text).replace(/\*/g, '')) throw new Error(`Timing veraltet bei „${line.id}“: node timing.mjs erneut ausführen`);
    at[line.id] = t;
    beats.push({ at: t, role: line.role, link: line.link, text: line.text, say: line.say, id: line.id, speed: line.speed, space: line.space, rate: line.rate, pitch: line.pitch, beat: line.beat, gain: line.gain });
    const marked = new Set([...line.text.matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].split(/\s+/)));
    const words = wordTimes(line.text, tl).map((w) => ({ ...w, start: t + lead + w.start, mark: marked.has(w.w) }));
    const lineEnd = t + lead + tl.dur;
    chunkWords(words, max).forEach((c) => chunks.push({ start: c[0].start, end: lineEnd + 0.15, words: c }));
    t = lineEnd + (line.pause ?? gap);
  });
  chunks.forEach((c, i) => { if (chunks[i + 1]) c.end = Math.min(c.end, chunks[i + 1].start); });
  return { beats, chunks, at, duration: +(t + tail).toFixed(2) };
}
