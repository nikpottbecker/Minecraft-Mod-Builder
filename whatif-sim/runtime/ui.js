// 2D-Overlays im TikTok-Stil. Koordinaten immer in 1080x1920.

const FONT = "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, monospace";
const YELLOW = '#ffd23f';

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
