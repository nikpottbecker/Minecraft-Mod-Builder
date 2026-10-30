// 16:9-Overlays (1920x1080) fuer lange YouTube-Videos. Nutzt ui.js, das fuer 1080 Breite gebaut ist,
// ueber Verschiebung und Skalierung; alles Vollflaechige wird hier neu gezeichnet.
import { ui } from './ui.js';

const W = 1920;
const H = 1080;
const DISPLAY = "'Anton', 'Impact', sans-serif";
const YELLOW = '#ffd23f';
const RED = '#ff4438';

const at = (g, x, y, s, fn) => {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  fn();
  g.restore();
};
const rect = (g, color, alpha) => {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  g.restore();
};

export const wide = {
  ...ui,
  W,
  H,

  fade: (g, a, color = '#000') => a > 0 && rect(g, color, Math.min(1, a)),
  flash: (g, a, color = '#fff') => a > 0 && rect(g, color, Math.min(0.85, a)),
  haze: (g, a, color = '#7c7772') => a > 0 && rect(g, color, a),

  grade(g, { color = '#ffffff', edge = 0.6 } = {}) {
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    const v = g.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,6,0)');
    v.addColorStop(1, `rgba(0,0,6,${edge})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    g.restore();
  },

  vignette(g, s = 0.45) {
    const top = g.createLinearGradient(0, 0, 0, 240);
    top.addColorStop(0, `rgba(5,8,25,${s})`);
    top.addColorStop(1, 'rgba(5,8,25,0)');
    g.fillStyle = top;
    g.fillRect(0, 0, W, 240);
    const bot = g.createLinearGradient(0, 760, 0, H);
    bot.addColorStop(0, 'rgba(5,8,25,0)');
    bot.addColorStop(1, `rgba(5,8,25,${s + 0.2})`);
    g.fillStyle = bot;
    g.fillRect(0, 760, W, 320);
  },

  clock(g, time, { alpha = 1 } = {}) {
    at(g, W / 2 - 540 * 0.8, 26, 0.8, () => ui.clock(g, time, { y: 0, alpha }));
  },
  gauge(g, { x = 40, y = 26, ...o }) {
    at(g, x, y, 0.8, () => ui.gauge(g, { ...o, x: 0, y: 0 }));
  },
  rule(g, { cx = 1470, y = 150, s = 0.78, ...o }) {
    at(g, cx - 540 * s, y, s, () => ui.rule(g, { ...o, y: 0 }));
  },
  comment(g, { cx = 960, y = 330, s = 1, ...o }) {
    at(g, cx - 540 * s, y, s, () => ui.comment(g, { ...o, y: 0 }));
  },
  cover(g, { cx = 960, ...o }) {
    at(g, cx - 540, 0, 1, () => ui.cover(g, o));
  },
  nameTag(g, { x = 960, y = 800, k = 1, name, info }) {
    ui.nameTag(g, { x, y, k, name, info });
  },

  // Hochhaus-Schema links, rechts ist Platz fuer Erklaerungen
  section(g, { alpha = 1, ...o }) {
    if (alpha <= 0) return;
    rect(g, '#080a14', 0.97 * alpha);
    at(g, 40, -135, 0.78, () => ui.section(g, { ...o, alpha }));
  },

  // Faktenzeile: kleines Label, grosser Wert
  fact(g, { x, y, w = 800, label, value, sub, color = YELLOW, k = 1 }) {
    if (k <= 0) return;
    const h = sub ? 228 : 178;
    g.save();
    g.globalAlpha = Math.min(1, k * 1.6);
    g.translate(x + (1 - Math.min(1, k)) * 50, y);
    g.beginPath();
    g.roundRect(0, 0, w, h, 20);
    g.fillStyle = 'rgba(8,10,20,0.93)';
    g.fill();
    g.fillStyle = color;
    g.fillRect(0, 22, 8, h - 44);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `400 34px ${DISPLAY}`;
    g.fillStyle = 'rgba(255,255,255,0.72)';
    g.fillText(label.toUpperCase(), 36, 52);
    g.font = `400 84px ${DISPLAY}`;
    g.fillStyle = color;
    g.fillText(value.toUpperCase(), 36, 146);
    if (sub) {
      g.font = `400 36px ${DISPLAY}`;
      g.fillStyle = '#fff';
      g.fillText(sub.toUpperCase(), 36, 200);
    }
    g.restore();
  },

  // Kapitelkarte: oben klein, unten gross
  chapter(g, { lines, alpha = 1 }) {
    if (alpha <= 0) return;
    rect(g, '#000', alpha);
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.font = `400 58px ${DISPLAY}`;
    g.fillStyle = YELLOW;
    g.fillText(lines[0].toUpperCase(), W / 2, 450);
    g.restore();
    at(g, 420, 0, 1, () => ui.cover(g, { lines: [lines[1]], y: 620, size: 150, alpha }));
  },

  // Nummerierte Liste (Regeln, Vorrat)
  list(g, items, { x = 480, w = 960, y = 110, row = 138, alpha = 1 } = {}) {
    items.forEach(({ n, text, k }, i) => {
      if (k <= 0) return;
      const yy = y + i * row;
      g.save();
      g.globalAlpha = Math.min(1, k * 1.6) * alpha;
      g.beginPath();
      g.roundRect(x, yy, w, row - 18, 20);
      g.fillStyle = 'rgba(8,10,20,0.93)';
      g.fill();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = YELLOW;
      g.font = `400 76px ${DISPLAY}`;
      g.fillText(n, x + 32, yy + (row - 18) / 2 + 4);
      g.fillStyle = '#fff';
      g.font = `400 56px ${DISPLAY}`;
      g.fillText(text.toUpperCase(), x + 112, yy + (row - 18) / 2 + 4);
      g.restore();
    });
  },

  // Lastspitze nach dem Wiedereinschalten. u = 0..1 Fortschritt. Schema ohne Massstab.
  surge(g, { x = 1000, y = 130, w = 840, h = 620, u = 1, alpha = 1 }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y);
    g.beginPath();
    g.roundRect(0, 0, w, h, 22);
    g.fillStyle = 'rgba(8,10,20,0.95)';
    g.fill();
    const px = 50;
    const pw = w - 100;
    const base = h - 110;
    const top = 110;
    const limit = top + 90;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `400 40px ${DISPLAY}`;
    g.fillStyle = '#fff';
    g.fillText('POWER DEMAND ON ONE CIRCUIT', px, 62);
    g.font = `400 26px ${DISPLAY}`;
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText('SCHEMATIC, NOT TO SCALE', px, 94);
    g.setLineDash([18, 12]);
    g.strokeStyle = RED;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(px, limit);
    g.lineTo(px + pw, limit);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = RED;
    g.font = `400 32px ${DISPLAY}`;
    g.fillText('PROTECTION LIMIT', px + pw - 240, limit - 12);
    // Vor dem Ausfall flach, dann steil ueber die Grenze; das Abschalten zeigt das Bild danach
    const curve = (k) => (k < 0.3 ? 0 : Math.min(1.28, ((k - 0.3) / 0.14) * 1.28));
    const scale = (base - limit) / 1;
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(px, base);
    g.lineTo(px + pw, base);
    g.stroke();
    g.strokeStyle = YELLOW;
    g.lineWidth = 8;
    g.lineJoin = 'round';
    g.beginPath();
    const steps = 120;
    for (let i = 0; i <= steps * Math.min(1, u); i++) {
      const k = i / steps;
      const v = curve(k);
      const yy = base - v * scale;
      if (i === 0) g.moveTo(px + k * pw, yy);
      else g.lineTo(px + k * pw, yy);
    }
    g.stroke();
    g.font = `400 32px ${DISPLAY}`;
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillText('OUTAGE', px + 40, base + 44);
    g.fillStyle = YELLOW;
    g.fillText('POWER BACK', px + pw * 0.3, base + 44);
    g.restore();
  },

  // Bezirke gehen nacheinander ans Netz. n = wie viele von 24 leuchten.
  blocks(g, { x = 1020, y = 170, cols = 6, rows = 4, size = 124, n = 0, last = 23, alpha = 1, label = 'Districts back on' }) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.beginPath();
    g.roundRect(x - 34, y - 96, cols * (size + 10) + 58, rows * (size + 10) + 134, 22);
    g.fillStyle = 'rgba(8,10,20,0.95)';
    g.fill();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `400 40px ${DISPLAY}`;
    g.fillStyle = '#fff';
    g.fillText(label.toUpperCase(), x, y - 36);
    // feste, gemischte Reihenfolge; der eigene Bezirk ist der letzte
    const order = Array.from({ length: cols * rows }, (_, i) => (i * 7 + 3) % (cols * rows));
    order.forEach((cell, i) => {
      const cx = x + (cell % cols) * (size + 10);
      const cy = y + Math.floor(cell / cols) * (size + 10);
      const on = i < n;
      g.fillStyle = on ? '#ffd98a' : '#1b2036';
      g.fillRect(cx, cy, size, size);
      if (i === last) {
        g.strokeStyle = RED;
        g.lineWidth = 6;
        g.strokeRect(cx + 3, cy + 3, size - 6, size - 6);
        g.fillStyle = on ? '#10131f' : '#fff';
        g.font = `400 40px ${DISPLAY}`;
        g.textAlign = 'center';
        g.fillText('YOU', cx + size / 2, cy + size / 2 + 14);
        g.textAlign = 'left';
      }
    });
    g.restore();
  },

  // Untertitel fuer 16:9: unten, kleiner, breiter
  words(g, t, chunks, { y = 960, size = 68 } = {}) {
    const c = chunks.find((x) => t >= x.start && t < x.end);
    if (!c) return;
    g.save();
    g.font = `400 ${size}px ${DISPLAY}`;
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    const space = g.measureText(' ').width;
    const items = c.words.map((word) => ({ ...word, width: g.measureText(word.w.toUpperCase()).width }));
    const total = items.reduce((s, w) => s + w.width + space, -space);
    let x = W / 2 - total / 2;
    for (const word of items) {
      const wt = (t - word.start) / 0.14;
      if (wt > 0) {
        const k = wt >= 1 ? 1 : 1 + 2.2 * (wt - 1) ** 3 + 1.2 * (wt - 1) ** 2;
        g.save();
        g.translate(x + word.width / 2, y);
        g.scale(0.72 + 0.28 * k, 0.72 + 0.28 * k);
        g.strokeStyle = '#000';
        g.lineWidth = 13;
        g.lineJoin = 'round';
        g.strokeText(word.w.toUpperCase(), 0, 0);
        g.fillStyle = word.mark ? YELLOW : '#fff';
        g.fillText(word.w.toUpperCase(), 0, 0);
        g.restore();
      }
      x += word.width + space;
    }
    g.restore();
  },
};
