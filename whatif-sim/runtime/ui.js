// 2D-Overlays im TikTok-Stil. Koordinaten immer in 1080x1920.

const FONT = "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, monospace";
const YELLOW = '#ffd23f';
const RED = '#ff4438';
const DISPLAY = "'Anton', 'Impact', sans-serif";

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (g.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Text in Teilen zeichnen: "Normal *gelb* normal" -> Sternchen-Woerter werden hervorgehoben.
function drawMarked(g, text, cx, y, baseColor, markColor, stroke) {
  const parts = String(text).split(/(\*[^*]+\*)/).filter(Boolean).map((p) => (
    p.startsWith('*') ? { text: p.slice(1, -1), color: markColor } : { text: p, color: baseColor }
  ));
  const total = parts.reduce((s, p) => s + g.measureText(p.text).width, 0);
  let x = cx - total / 2;
  g.textAlign = 'left';
  for (const p of parts) {
    if (stroke) {
      g.strokeStyle = stroke.color;
      g.lineWidth = stroke.width;
      g.lineJoin = 'round';
      g.strokeText(p.text, x, y);
    }
    g.fillStyle = p.color;
    g.fillText(p.text, x, y);
    x += g.measureText(p.text).width;
  }
}

export const ui = {
  YELLOW,

  // Zahl im deutschen Format: 1234.5 -> "1.234,5"
  fmt(n, digits = 0) {
    return Number(n).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  },

  // Kleines Label oben, z. B. "SCHRITT 1 · *PRÜFUNG*"
  pill(g, text, { y = 150, alpha = 1 } = {}) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.font = `800 40px ${FONT}`;
    const plain = String(text).replace(/\*/g, '');
    const w = g.measureText(plain).width + 64;
    roundRect(g, 540 - w / 2, y - 44, w, 80, 22);
    g.fillStyle = 'rgba(12,16,38,0.82)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    g.lineWidth = 2;
    g.stroke();
    g.textBaseline = 'middle';
    drawMarked(g, text, 540, y - 3, '#ffffff', YELLOW);
    g.restore();
  },

  // Grosse Frage/Titel, mehrzeilig, mit Schatten.
  title(g, text, { y = 420, alpha = 1, size = 74 } = {}) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.font = `800 ${size}px ${FONT}`;
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.55)';
    g.shadowBlur = 24;
    const lines = wrap(g, String(text).replace(/\*/g, ''), 920);
    // Hervorhebungen gehen beim Umbrechen verloren -> markierte Woerter neu zuordnen.
    const marked = new Set([...String(text).matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].split(/\s+/)));
    lines.forEach((line, i) => {
      const rich = line.split(' ').map((w) => (marked.has(w) ? `*${w}*` : w)).join(' ');
      drawMarked(g, rich, 540, y + i * size * 1.15, '#ffffff', YELLOW);
    });
    g.restore();
  },

  // Untertitel in der Bildmitte, fett mit schwarzer Kontur.
  caption(g, text, { y = 1240, alpha = 1, size = 78 } = {}) {
    if (alpha <= 0 || !text) return;
    g.save();
    g.globalAlpha = alpha;
    g.font = `900 ${size}px ${FONT}`;
    g.textBaseline = 'middle';
    const lines = wrap(g, String(text).replace(/\*/g, ''), 940);
    const marked = new Set([...String(text).matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].split(/\s+/)));
    lines.forEach((line, i) => {
      const rich = line.split(' ').map((w) => (marked.has(w) ? `*${w}*` : w)).join(' ');
      drawMarked(g, rich, 540, y + i * size * 1.12, '#ffffff', YELLOW, { color: 'rgba(0,0,0,0.9)', width: 14 });
    });
    g.restore();
  },

  // Zahlen-Kachel: kleines Label + grosse Zahl.
  stat(g, { x = 60, y = 260, label, value, unit = '', color = YELLOW, alpha = 1, width = 440 }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    roundRect(g, x, y, width, 170, 26);
    g.fillStyle = 'rgba(12,16,38,0.8)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 2;
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `600 28px ${MONO}`;
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillText(String(label).toUpperCase().replace(/Μ/g, 'μ'), x + 30, y + 50);
    g.font = `900 84px ${FONT}`;
    g.fillStyle = color;
    g.fillText(value, x + 28, y + 140);
    if (unit) {
      const vw = g.measureText(value).width;
      g.font = `700 40px ${FONT}`;
      g.fillStyle = '#ffffff';
      g.fillText(unit, x + 40 + vw, y + 138);
    }
    g.restore();
  },

  // Faktenkarte mit Quellenangabe.
  card(g, { y = 1400, label = 'FAKT', lines = [], source = '', alpha = 1 }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.font = `700 46px ${FONT}`;
    const wrapped = lines.flatMap((l) => wrap(g, l, 860));
    const h = 110 + wrapped.length * 60 + (source ? 70 : 0);
    roundRect(g, 60, y, 960, h, 30);
    g.fillStyle = 'rgba(12,16,38,0.86)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    g.lineWidth = 2;
    g.stroke();
    g.textAlign = 'left';
    g.font = `600 28px ${MONO}`;
    g.fillStyle = YELLOW;
    g.fillText(label.toUpperCase().replace(/Μ/g, 'μ'), 100, y + 60);
    g.font = `700 46px ${FONT}`;
    g.fillStyle = '#ffffff';
    wrapped.forEach((l, i) => g.fillText(l, 100, y + 125 + i * 60));
    if (source) {
      g.font = `500 26px ${MONO}`;
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillText('Quelle: ' + source, 100, y + h - 36);
    }
    g.restore();
  },

  // Leichte Abdunkelung oben/unten, damit Text lesbar bleibt.
  vignette(g, strength = 0.55) {
    const top = g.createLinearGradient(0, 0, 0, 700);
    top.addColorStop(0, `rgba(5,8,25,${strength})`);
    top.addColorStop(1, 'rgba(5,8,25,0)');
    g.fillStyle = top;
    g.fillRect(0, 0, 1080, 700);
    const bottom = g.createLinearGradient(0, 1300, 0, 1920);
    bottom.addColorStop(0, 'rgba(5,8,25,0)');
    bottom.addColorStop(1, `rgba(5,8,25,${strength})`);
    g.fillStyle = bottom;
    g.fillRect(0, 1300, 1080, 620);
  },

  // Story-Untertitel: aktiver Beat = letzter mit at <= t (bis zum naechsten Beat oder `until`).
  // Woerter ploppen einzeln auf (0,07 s versetzt, leichtes Ueberschwingen) — das Auge
  // liest mit, und jeder Wortwechsel ist ein kleiner visueller Reiz.
  beats(g, t, beats, { y = 1330, size = 80 } = {}) {
    let i = -1;
    for (let k = 0; k < beats.length; k++) if (beats[k].at <= t) i = k;
    if (i < 0) return;
    const b = beats[i];
    const end = b.until ?? beats[i + 1]?.at ?? Infinity;
    if (t >= end || !b.text) return;
    const local = t - b.at;
    const out = Math.min(1, Math.max(0, (end - t) / 0.12));
    g.save();
    g.font = `900 ${size}px ${FONT}`;
    g.textBaseline = 'middle';
    const marked = new Set([...String(b.text).matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].split(/\s+/)));
    const lines = wrap(g, String(b.text).replace(/\*/g, ''), 940);
    let wordIndex = 0;
    lines.forEach((line, li) => {
      const words = line.split(' ');
      const widths = words.map((w) => g.measureText(w + ' ').width);
      let x = 540 - (widths.reduce((s, w) => s + w, 0) - g.measureText(' ').width) / 2;
      const ly = y + li * size * 1.12;
      words.forEach((w, wi) => {
        const wt = (local - wordIndex * 0.07) / 0.22;
        wordIndex++;
        if (wt <= 0) {
          x += widths[wi];
          return;
        }
        const k = wt >= 1 ? 1 : 1 + 2.2 * (wt - 1) ** 3 + 1.2 * (wt - 1) ** 2;
        const cx = x + g.measureText(w).width / 2;
        g.save();
        g.globalAlpha = Math.min(1, wt * 2) * out;
        g.translate(cx, ly);
        g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
        g.textAlign = 'center';
        g.strokeStyle = 'rgba(0,0,0,0.9)';
        g.lineWidth = 14;
        g.lineJoin = 'round';
        g.strokeText(w, 0, 0);
        g.fillStyle = marked.has(w) ? YELLOW : '#ffffff';
        g.fillText(w, 0, 0);
        g.restore();
        x += widths[wi];
      });
    });
    g.restore();
  },

  // Cover (erstes Bild): riesiger Titel, `*wort*` = rot. lines = eine Zeile pro Eintrag.
  cover(g, { lines, part, y = 300, size = 190, alpha = 1 }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.textBaseline = 'alphabetic';
    lines.forEach((line, i) => {
      g.font = `400 ${size}px ${DISPLAY}`;
      drawMarked(g, line.toUpperCase(), 540, y + i * size * 1.1, '#ffffff', RED, { color: '#000', width: 18 });
    });
    if (part) {
      const by = y + (lines.length - 1) * size * 1.1 + 40;
      g.font = `400 62px ${DISPLAY}`;
      const label = part.toUpperCase();
      const w = g.measureText(label).width + 60;
      roundRect(g, 540 - w / 2, by, w, 92, 14);
      g.fillStyle = YELLOW;
      g.fill();
      g.fillStyle = '#10131f';
      g.textAlign = 'center';
      g.fillText(label, 540, by + 70);
    }
    g.restore();
  },

  // Uhrzeit-Chip: zeigt, wann man in der Geschichte ist.
  clock(g, time, { y = 130, alpha = 1 } = {}) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.font = `400 58px ${DISPLAY}`;
    const w = g.measureText(time).width + 56;
    roundRect(g, 540 - w / 2, y, w, 88, 16);
    g.fillStyle = 'rgba(8,10,20,0.9)';
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(time, 540, y + 47);
    g.restore();
  },

  // Regel- oder Rechenkarte: kleines Label, grosse Zeile, optional Ergebnis. k = 0..1 (Einflug).
  rule(g, { label, text, result, y = 270, k = 1 }) {
    if (k <= 0) return;
    const ks = 0.85 + 0.15 * k;
    g.save();
    g.globalAlpha = Math.min(1, k * 1.6);
    g.translate(540, y);
    g.scale(ks, ks);
    const h = result ? 330 : 230;
    roundRect(g, -470, 0, 940, h, 26);
    g.fillStyle = 'rgba(8,10,20,0.92)';
    g.fill();
    g.strokeStyle = YELLOW;
    g.lineWidth = 5;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.font = `400 46px ${DISPLAY}`;
    g.fillStyle = YELLOW;
    g.fillText(label.toUpperCase(), 0, 66);
    g.font = `400 72px ${DISPLAY}`;
    g.fillStyle = '#ffffff';
    g.fillText(text.toUpperCase(), 0, 160);
    if (result) {
      g.font = `400 96px ${DISPLAY}`;
      g.fillStyle = RED;
      g.fillText(result.toUpperCase(), 0, 280);
    }
    g.restore();
  },

  // Dauer-Anzeige: Wasser oder Stockwerk. warn = rot, k = 0..1 kurzer Puls bei Aenderung.
  gauge(g, { label, value, x = 60, y = 240, warn = false, k = 0, alpha = 1 }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y);
    const s = 1 + 0.12 * k;
    g.scale(s, s);
    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';
    g.font = `400 34px ${DISPLAY}`;
    const lw = g.measureText(label).width;
    g.font = `400 76px ${DISPLAY}`;
    const w = Math.max(lw, g.measureText(value).width) + 44;
    roundRect(g, 0, 0, w, 138, 16);
    g.fillStyle = 'rgba(8,10,20,0.9)';
    g.fill();
    g.fillStyle = warn ? RED : '#3fb4ff';
    g.fillText(value, 22, 118);
    g.font = `400 34px ${DISPLAY}`;
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillText(label, 22, 44);
    g.restore();
  },

  // Steckbrief einer Figur: "HELEN · 81 · APT 14B"
  nameTag(g, { name, info, x = 540, y = 1180, k = 1 }) {
    if (k <= 0) return;
    g.save();
    g.globalAlpha = Math.min(1, k * 1.6);
    g.font = `400 66px ${DISPLAY}`;
    const a = name.toUpperCase();
    const b = ` · ${info.toUpperCase()}`;
    const wa = g.measureText(a).width;
    const w = wa + g.measureText(b).width + 56;
    const left = x - w / 2;
    roundRect(g, left, y, w, 98, 14);
    g.fillStyle = 'rgba(8,10,20,0.92)';
    g.fill();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = YELLOW;
    g.fillText(a, left + 28, y + 52);
    g.fillStyle = '#ffffff';
    g.fillText(b, left + 28 + wa, y + 52);
    g.restore();
  },

  // Hochhaus-Schema: Wassersaeule im Querschnitt. mains = Stockwerk, bis zu dem der Leitungsdruck
  // reicht; level = aktueller Wasserstand (Stockwerke); pump = 0..1 Pumpe laeuft.
  section(g, { floors = 18, mains = 7, you = 14, level = 18, pump = 1, alpha = 1, showMains = 1, marker = null }) {
    if (alpha <= 0) return;
    const left = 300;
    const width = 480;
    const top = 250;
    const fh = 50;
    const bottom = top + floors * fh;
    const fy = (f) => bottom - f * fh;
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = 'rgba(8,10,20,0.9)';
    g.fillRect(0, 0, 1080, 1920);
    roundRect(g, left, top, width, bottom - top, 10);
    g.fillStyle = '#1b2036';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)';
    g.lineWidth = 5;
    g.stroke();
    for (let f = 1; f < floors; f++) {
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(left, fy(f), width, 3);
    }
    const pipe = left + 90;
    g.fillStyle = 'rgba(255,255,255,0.14)';
    g.fillRect(pipe, top, 34, bottom - top);
    g.fillStyle = '#3fb4ff';
    g.fillRect(pipe, fy(level), 34, bottom - fy(level) + 40);
    g.fillRect(left - 180, bottom + 10, 300, 30);
    g.font = `400 50px ${DISPLAY}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    // Pumpe im Keller
    roundRect(g, left + 150, bottom + 8, 190, 78, 10);
    g.fillStyle = pump > 0.5 ? '#2ecc71' : RED;
    g.fill();
    g.fillStyle = '#0b0d16';
    g.textAlign = 'center';
    g.fillText(pump > 0.5 ? 'PUMP ON' : 'PUMP OFF', left + 245, bottom + 49);
    // Grenze Leitungsdruck
    if (showMains > 0) {
      g.globalAlpha = alpha * showMains;
      g.setLineDash([22, 14]);
      g.strokeStyle = YELLOW;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(left - 30, fy(mains));
      g.lineTo(left + width + 30, fy(mains));
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = YELLOW;
      g.textAlign = 'left';
      g.fillText('22 M', left + width + 42, fy(mains) - 28);
      g.font = `400 42px ${DISPLAY}`;
      g.fillText('≈ FLOOR 7', left + width + 42, fy(mains) + 26);
      g.font = `400 50px ${DISPLAY}`;
      g.globalAlpha = alpha;
    }
    if (marker) {
      roundRect(g, left + 180, fy(marker) - fh + 5, 280, fh - 8, 8);
      g.fillStyle = '#3fb4ff';
      g.fill();
      g.fillStyle = '#071018';
      g.textAlign = 'center';
      g.font = `400 40px ${DISPLAY}`;
      g.fillText(`WATER · FLOOR ${marker}`, left + 320, fy(marker) - fh / 2 + 2);
    }
    // Deine Wohnung
    const room = fy(you);
    roundRect(g, left + 180, room - fh + 5, 280, fh - 8, 8);
    g.fillStyle = RED;
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = `400 40px ${DISPLAY}`;
    g.fillText('YOU · FLOOR 14', left + 320, room - fh / 2 + 2);
    g.restore();
  },

  // Untertitel aus den echten Wortzeiten: Stuecke mit 2-4 Woertern, Woerter ploppen im Sprechtakt auf.
  words(g, t, chunks, { y = 1340, size = 94 } = {}) {
    const c = chunks.find((x) => t >= x.start && t < x.end);
    if (!c) return;
    g.save();
    g.font = `400 ${size}px ${DISPLAY}`;
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    const space = g.measureText(' ').width;
    const rows = [[]];
    let width = 0;
    for (const word of c.words) {
      const w = g.measureText(word.w.toUpperCase()).width;
      if (width + w > 900 && rows.at(-1).length) {
        rows.push([]);
        width = 0;
      }
      rows.at(-1).push({ ...word, width: w });
      width += w + space;
    }
    rows.forEach((row, ri) => {
      const total = row.reduce((s, w) => s + w.width + space, -space);
      let x = 540 - total / 2;
      for (const word of row) {
        const wt = (t - word.start) / 0.14;
        if (wt > 0) {
          const k = wt >= 1 ? 1 : 1 + 2.2 * (wt - 1) ** 3 + 1.2 * (wt - 1) ** 2;
          g.save();
          g.translate(x + word.width / 2, y + ri * size * 1.18);
          g.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
          g.strokeStyle = '#000';
          g.lineWidth = 16;
          g.lineJoin = 'round';
          g.strokeText(word.w.toUpperCase(), 0, 0);
          g.fillStyle = word.mark ? YELLOW : '#ffffff';
          g.fillText(word.w.toUpperCase(), 0, 0);
          g.restore();
        }
        x += word.width + space;
      }
    });
    g.restore();
  },

  // Kurzer Lichtblitz als Akzent (Aufprall, Wendepunkt).
  flash(g, amount, color = '#ffffff') {
    if (amount <= 0) return;
    g.save();
    g.globalAlpha = Math.min(0.85, amount);
    g.fillStyle = color;
    g.fillRect(0, 0, 1080, 1920);
    g.restore();
  },

  // Blende (0 = unsichtbar, 1 = schwarz).
  fade(g, amount, color = '#000') {
    if (amount <= 0) return;
    g.save();
    g.globalAlpha = Math.min(1, amount);
    g.fillStyle = color;
    g.fillRect(0, 0, 1080, 1920);
    g.restore();
  },
};
