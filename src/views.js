const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --f1-red: #e10600; --f1-red-dark: #a30500; --f1-black: #0d0d12; --f1-dark: #1a1a24; --f1-dark-2: #14141d;
  --f1-gray: #34343f; --f1-gray-light: #46465500;
  --f1-text: #f4f4f6; --f1-muted: #9a9aa8; --gold: #ffd23f; --silver: #d5d8de; --bronze: #e0965a;
  --accent-blue: #4fb0e8;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background:
    radial-gradient(circle at 15% 0%, rgba(225,6,0,0.10) 0%, transparent 45%),
    linear-gradient(180deg, var(--f1-black) 0%, #08080c 100%);
  color: var(--f1-text); min-height: 100vh; }
h1, h2, h3 { font-family: "Titillium Web", "Inter", sans-serif; }

header.topbar {
  background: linear-gradient(90deg, #000000 0%, var(--f1-black) 60%);
  border-bottom: 3px solid var(--f1-red);
  box-shadow: 0 2px 0 rgba(225,6,0,0.35), 0 4px 20px rgba(0,0,0,0.5);
  padding: 18px 28px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  position: sticky; top: 0; z-index: 20; backdrop-filter: blur(6px);
}
header.topbar h1 { margin: 0; font-size: 1.5rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
header.topbar h1 span { color: var(--f1-red); text-shadow: 0 0 18px rgba(225,6,0,0.55); }
header.topbar h1 a { color: inherit; text-decoration: none; }
nav { display: flex; align-items: center; gap: 6px; }
nav a, header.topbar a.btn { color: var(--f1-text); text-decoration: none; margin-left: 16px; font-weight: 600; font-size: 0.9rem;
  padding-bottom: 2px; border-bottom: 2px solid transparent; transition: border-color 0.15s, color 0.15s; }
nav a:hover { border-color: var(--f1-red); color: #fff; }
nav a[aria-current="page"] { color: #fff; border-color: var(--f1-red); }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
  outline: 3px solid rgba(79,176,232,0.85); outline-offset: 3px;
}

.btn { display: inline-block; background: linear-gradient(180deg, #ff1a10 0%, var(--f1-red) 100%);
  color: #fff !important; padding: 9px 18px; border-radius: 6px;
  border: none; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.6px;
  box-shadow: 0 2px 8px rgba(225,6,0,0.35); transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(225,6,0,0.5); filter: brightness(1.05); }
.btn:active { transform: translateY(0); }
.btn.secondary { background: linear-gradient(180deg, #4a4a58 0%, var(--f1-gray) 100%); box-shadow: none; }
.btn.danger { background: linear-gradient(180deg, #a3181f 0%, #7a1010 100%); box-shadow: none; }

main { max-width: 1100px; margin: 0 auto; padding: 28px 24px 60px; }
@media (max-width: 480px) {
  header.topbar { padding: 14px 16px; }
  header.topbar h1 { font-size: 1.15rem; }
  nav { width: 100%; justify-content: space-between; gap: 4px; }
  nav a, header.topbar a.btn, header.topbar form { margin-left: 0; }
  nav a { font-size: 0.82rem; }
  main { padding: 16px 14px 40px; }
  .card { padding: 16px; }
}

.card { background: linear-gradient(180deg, var(--f1-dark) 0%, var(--f1-dark-2) 100%);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 22px; margin-bottom: 22px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
.card h2 { margin: 0 0 16px; font-size: 1.15rem; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px; }
.card h2::before { content: ''; width: 4px; height: 18px; background: var(--f1-red); border-radius: 2px; display: inline-block; }

.season-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .6fr);
  gap: 24px; align-items: end; padding: 28px; border: 1px solid rgba(225,6,0,.28);
  background: linear-gradient(125deg, rgba(225,6,0,.17), rgba(26,26,36,.96) 45%, rgba(20,20,29,.98)); }
.season-hero::after { content: ''; position: absolute; right: -55px; top: -95px; width: 260px; height: 260px;
  border: 34px solid rgba(225,6,0,.08); border-radius: 50%; pointer-events: none; }
.eyebrow { margin: 0 0 6px; color: #ff6c66; text-transform: uppercase; font-size: .72rem; font-weight: 800; letter-spacing: 1.6px; }
.season-hero h2 { margin: 0; font-size: clamp(2rem, 5vw, 3.6rem); line-height: .95; letter-spacing: -.8px; }
.season-hero h2::before { display: none; }
.season-hero .hero-subtitle { margin: 10px 0 0; color: var(--f1-muted); }
.season-stats { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.season-stat { padding: 13px 14px; border-radius: 10px; background: rgba(8,8,12,.7); border: 1px solid rgba(255,255,255,.07); }
.season-stat strong { display: block; font-family: "Titillium Web", sans-serif; font-size: 1.35rem; line-height: 1; }
.season-stat span { display: block; margin-top: 5px; color: var(--f1-muted); font-size: .7rem; text-transform: uppercase; letter-spacing: .8px; }
@media (max-width: 700px) { .season-hero { grid-template-columns: 1fr; align-items: start; padding: 22px 18px; } }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 11px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
th { color: var(--f1-muted); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1.2px; font-weight: 700; }
tbody tr { transition: background 0.12s ease; }
tbody tr:hover { background: rgba(255,255,255,0.035); }
tbody tr:nth-child(even) { background: rgba(255,255,255,0.015); }

.pos-badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
  border-radius: 50%; font-weight: 800; font-size: 0.82rem; background: rgba(255,255,255,0.06); color: var(--f1-text); }
tr.pos-1 .pos-badge { background: var(--gold); color: #241a00; box-shadow: 0 0 10px rgba(255,210,63,0.5); }
tr.pos-2 .pos-badge { background: var(--silver); color: #1c1c22; }
tr.pos-3 .pos-badge { background: var(--bronze); color: #251200; }
tr.pos-1 td, tr.pos-2 td, tr.pos-3 td { font-weight: 700; }

.driver-color { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 9px;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.06); }
.ai-badge { display: inline-block; margin-left: 7px; padding: 1px 7px; border-radius: 999px;
  background: rgba(79,176,232,0.15); color: var(--accent-blue); font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.4px; vertical-align: middle; }
.points { font-weight: 800; color: var(--f1-red); font-variant-numeric: tabular-nums; }
a.race-link { color: var(--f1-text); font-weight: 600; text-decoration: none; border-bottom: 1px solid var(--f1-gray); transition: border-color 0.12s, color 0.12s; }
a.race-link:hover { color: var(--f1-red); border-color: var(--f1-red); }

form.inline { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
input, select { background: #0c0c12; border: 1px solid var(--f1-gray); color: var(--f1-text); padding: 9px 11px;
  border-radius: 6px; font-family: inherit; transition: border-color 0.12s; }
input:focus, select:focus { outline: none; border-color: var(--f1-red); }
.error { background: rgba(163,5,0,0.18); border: 1px solid var(--f1-red); color: #ffb3ac; padding: 11px 14px; border-radius: 8px; margin-bottom: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
.muted { color: var(--f1-muted); font-size: 0.9rem; }
.results-form td input[type="number"] { width: 70px; }
.table-wrap { overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--f1-gray) transparent; }
.mobile-driver-stats { display: none; }
.chart-wrap { overflow-x: auto; }
.chart-wrap svg { display: block; width: 100%; min-width: 480px; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 12px 18px; margin-top: 14px; }
.chart-legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--f1-muted); }
.chart-legend .swatch { width: 10px; height: 10px; border-radius: 50%; }
.wide-input { min-width: 220px; flex: 1 1 220px; }

.replay-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.replay-card { display: block; color: var(--f1-text); text-decoration: none; background: var(--f1-dark-2);
  border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; position: relative; }
.replay-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.45); border-color: var(--f1-red); }
.replay-card::after { content: '▶'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);
  width: 42px; height: 42px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 0.9rem; opacity: 0; transition: opacity 0.15s ease; }
.replay-card:hover::after { opacity: 1; }
.replay-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #0a0a10; }
.replay-card .replay-info { padding: 11px 13px; }
.replay-card .replay-info strong { display: block; font-size: 0.92rem; }
.replay-card .replay-info span { color: var(--f1-muted); font-size: 0.78rem; }

.highlights { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.highlights li { padding: 10px 14px; border-radius: 8px; background: var(--f1-dark-2); border-left: 3px solid var(--f1-gray); font-size: 0.92rem; }
.highlights li.dnf { border-left-color: #e05a4a; }
.highlights li.fastest { border-left-color: var(--accent-blue); }
.highlights li.winner { border-left-color: var(--gold); }

.status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.status-tile { background: var(--f1-dark-2); border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.06); }
.status-tile .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
.status-tile .dot.on { background: #2ecc71; box-shadow: 0 0 8px rgba(46,204,113,0.7); }
.status-tile .dot.off { background: #5a5a66; }
.status-tile .label { display: block; color: var(--f1-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; }

.news-feed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.news-item { display: flex; gap: 14px; align-items: flex-start; padding: 12px 14px; border-radius: 8px;
  background: var(--f1-dark-2); border-left: 3px solid var(--f1-gray); }
.news-item.crash { border-left-color: #e05a4a; }
.news-item.win { border-left-color: var(--gold); }
.news-item.team_change { border-left-color: var(--accent-blue); }
.news-item .news-date { flex: 0 0 auto; color: var(--f1-muted); font-size: 0.76rem; font-variant-numeric: tabular-nums;
  min-width: 78px; padding-top: 2px; }
.news-item .news-message { font-size: 0.94rem; }

@media (max-width: 640px) {
  .standings-table th:nth-child(3), .standings-table th:nth-child(4), .standings-table th:nth-child(5),
  .standings-table td:nth-child(3), .standings-table td:nth-child(4), .standings-table td:nth-child(5),
  .teams-table th:nth-child(3), .teams-table th:nth-child(4),
  .teams-table td:nth-child(3), .teams-table td:nth-child(4) { display: none; }
  .standings-table th, .standings-table td, .teams-table th, .teams-table td { padding-left: 8px; padding-right: 8px; }
  .standings-table td:nth-child(2) { min-width: 155px; }
  .standings-table td:last-child, .teams-table td:last-child { text-align: right; }
  .standings-table th:last-child, .teams-table th:last-child { text-align: right; }
  .mobile-driver-stats { display: block; margin-top: 3px; color: var(--f1-muted); font-size: .68rem; font-weight: 500; }
  .chart-wrap svg { min-width: 620px; }
}
@media (max-width: 480px) {
  .wide-input { min-width: 0; flex: 1 1 100%; }
  form.inline { flex-direction: column; align-items: stretch; }
  form.inline input, form.inline button { width: 100%; }
  .news-item { flex-direction: column; gap: 4px; }
  .news-item .news-date { min-width: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}

/* Championship dashboard */
:root {
  --race-red: #ff2638; --race-red-deep: #b90b1d; --race-bg: #071015; --race-panel: #0b141a;
  --race-line: #26323a; --race-muted: #a5aeb7; --race-cyan: #25c5ca;
}
body { background: var(--race-bg); }
body::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: .22;
  background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 48px 48px; mask-image: linear-gradient(to bottom, #000, transparent 70%); }
header.topbar { min-height: 68px; padding: 0 28px; background: rgba(6,13,18,.94); border-bottom: 1px solid var(--race-line); box-shadow: none; }
header.topbar h1 { font-style: italic; letter-spacing: .4px; }
header.topbar h1 span { color: var(--race-red); text-shadow: none; }
.brand-check { display: inline-grid; grid-template-columns: repeat(2, 8px); gap: 2px; margin-right: 10px; transform: skewX(-16deg); vertical-align: 2px; }
.brand-check i { display: block; width: 8px; height: 8px; background: var(--race-red); }
.brand-check i:nth-child(2), .brand-check i:nth-child(3) { opacity: .6; }
nav a, header.topbar a.btn { margin-left: 24px; padding: 24px 0 20px; border-width: 3px; }
nav a[aria-current="page"] { border-color: var(--race-red); }
main.dashboard-main { max-width: none; padding: 0 0 54px; }
.dashboard-shell { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
.leader-stage { position: relative; overflow: hidden; border-bottom: 1px solid var(--race-line); background:
  linear-gradient(105deg, rgba(255,38,56,.08), transparent 34%), radial-gradient(circle at 88% 0, rgba(255,38,56,.1), transparent 32%); }
.leader-stage::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .12;
  background: repeating-linear-gradient(135deg, transparent 0 70px, rgba(255,255,255,.12) 70px 71px); }
.leader-grid { position: relative; display: grid; grid-template-columns: minmax(300px,.85fr) minmax(520px,1.15fr); gap: 56px; align-items: end; padding-top: 42px; padding-bottom: 42px; }
.champ-label { margin: 0 0 8px; color: var(--race-muted); font-size: .72rem; font-weight: 700; letter-spacing: 2.1px; text-transform: uppercase; }
.leader-name { margin: 0; font-size: clamp(3.4rem,7vw,6.4rem); line-height: .8; letter-spacing: -2px; font-style: italic; text-transform: uppercase; }
.leader-score { display: flex; align-items: baseline; gap: 12px; margin-top: 22px; font-family: "Titillium Web", sans-serif; font-style: italic; text-transform: uppercase; }
.leader-score strong { color: var(--race-red); font-size: clamp(3rem,6vw,5.1rem); line-height: .8; }
.leader-score span { font-size: clamp(1.3rem,2.7vw,2rem); font-weight: 800; }
.leader-metrics { display: flex; margin-top: 32px; }
.leader-metric { min-width: 110px; padding-right: 24px; margin-right: 24px; border-right: 1px solid #75808a; }
.leader-metric:last-child { border: 0; margin: 0; }
.leader-metric strong { display: block; font: 800 1.65rem/1 "Titillium Web", sans-serif; }
.leader-metric span { display: block; margin-top: 6px; color: var(--race-muted); font-size: .65rem; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; }
.podium-title { margin: 0 0 14px; color: var(--race-muted); font-size: .72rem; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }
.podium-rail { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.podium-card { position: relative; min-height: 178px; padding: 22px 20px 18px 28px; overflow: hidden; background: linear-gradient(145deg, rgba(17,27,34,.98), rgba(8,15,20,.98)); border: 1px solid var(--race-line); border-top: 3px solid var(--podium); transform: skewX(-4deg); }
.podium-card > * { transform: skewX(4deg); }
.podium-card .podium-rank { color: var(--podium); font: 900 2.35rem/1 "Titillium Web", sans-serif; }
.podium-card .podium-name { display: block; min-height: 43px; margin: 16px 0 8px; font: 800 1.15rem/1.05 "Titillium Web", sans-serif; text-transform: uppercase; }
.podium-card .podium-points { color: #fff; font: 900 2rem/1 "Titillium Web", sans-serif; }
.podium-card .podium-points small { color: var(--race-muted); font-size: .65rem; letter-spacing: 1px; text-transform: uppercase; }
.dashboard-section { padding: 34px 0; border-bottom: 1px solid var(--race-line); }
.section-grid { display: grid; grid-template-columns: minmax(0,1.65fr) minmax(310px,.75fr); gap: 0; }
.section-grid > section:first-child { padding-right: 34px; border-right: 1px solid var(--race-line); }
.section-grid > section:last-child { padding-left: 34px; }
.section-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.section-heading { margin: 0; font-size: 1.55rem; line-height: 1; letter-spacing: .3px; text-transform: uppercase; }
.section-heading::before { content: '/'; display: inline-block; margin-right: 10px; color: var(--race-red); font-weight: 900; transform: skewX(-12deg); }
.section-kicker { margin: 6px 0 0; color: var(--race-muted); font-size: .76rem; }
.filter-control { display: inline-flex; border: 1px solid var(--race-line); border-radius: 7px; overflow: hidden; }
.filter-control button { min-width: 92px; padding: 9px 13px; border: 0; border-right: 1px solid var(--race-line); background: #0c151b; color: var(--race-muted); font: 700 .72rem "Inter", sans-serif; cursor: pointer; }
.filter-control button:last-child { border: 0; }
.filter-control button[aria-pressed="true"] { background: var(--race-red); color: white; }
.timing-table { width: 100%; table-layout: fixed; }
.timing-table th, .timing-table td { padding: 10px 12px; border-color: var(--race-line); }
.timing-table th { font-size: .64rem; }
.timing-table tbody tr { border-left: 3px solid transparent; }
.timing-table tbody tr:hover { background: rgba(255,38,56,.06); border-left-color: var(--race-red); }
.timing-table .col-pos { width: 58px; }
.timing-table .col-stat { width: 82px; text-align: center; }
.timing-table .col-points { width: 90px; text-align: right; }
.timing-table td.stat { text-align: center; font-variant-numeric: tabular-nums; }
.timing-table td.points { text-align: right; color: var(--race-red); font-size: 1.12rem; }
.filter-empty { display: none; padding: 24px 12px; color: var(--race-muted); text-align: center; border-bottom: 1px solid var(--race-line); }
.team-list { margin: 0; padding: 0; list-style: none; }
.team-row { display: grid; grid-template-columns: 34px 5px minmax(0,1fr) auto; align-items: center; gap: 13px; min-height: 55px; border-bottom: 1px solid var(--race-line); }
.team-rank { font: 800 1.1rem "Titillium Web", sans-serif; }
.team-stripe { width: 5px; height: 28px; background: var(--team-color); box-shadow: 0 0 10px color-mix(in srgb, var(--team-color) 45%, transparent); }
.team-name { min-width: 0; font-weight: 700; }
.team-drivers { display: block; overflow: hidden; color: var(--race-muted); font-size: .68rem; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.team-points { color: #fff; font: 900 1.15rem "Titillium Web", sans-serif; }
.chart-panel { padding-top: 4px; }
.chart-wrap.dashboard-chart { border: 1px solid var(--race-line); border-radius: 8px; background: linear-gradient(180deg, rgba(12,21,27,.75), rgba(7,16,21,.35)); }
.dashboard-chart svg { min-width: 660px; }
.chart-note { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 10px; }
.scroll-cue { display: none; color: var(--race-muted); font-size: .7rem; }
.race-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--race-line); }
.race-row { display: grid; grid-template-columns: 110px minmax(0,1fr) minmax(140px,.8fr) auto; align-items: center; gap: 16px; min-height: 58px; border-bottom: 1px solid var(--race-line); }
.race-date { color: var(--race-muted); font-size: .82rem; font-variant-numeric: tabular-nums; }
.race-row strong { font-size: .92rem; }
.race-track { color: var(--race-muted); font-size: .8rem; }
.row-action { display: inline-flex; align-items: center; gap: 8px; color: var(--race-red); font-size: .78rem; font-weight: 800; text-decoration: none; }
.row-action svg { width: 16px; transition: transform .15s ease; }
.row-action:hover svg { transform: translateX(3px); }
.replay-row { grid-template-columns: 110px minmax(0,1fr) auto; }
.play-icon { display: inline-flex; align-items: center; justify-content: center; width: 25px; height: 25px; border: 1px solid #6c7780; border-radius: 50%; color: #fff; }
.play-icon svg { width: 10px; height: 10px; }
.dashboard-foot { padding-top: 24px; color: var(--race-muted); font-size: .72rem; text-align: center; }

@media (max-width: 900px) {
  .leader-grid { grid-template-columns: 1fr; gap: 34px; }
  .section-grid { grid-template-columns: 1fr; }
  .section-grid > section:first-child { padding: 0 0 34px; border-right: 0; border-bottom: 1px solid var(--race-line); }
  .section-grid > section:last-child { padding: 34px 0 0; }
}
@media (max-width: 640px) {
  header.topbar { min-height: auto; padding: 13px 16px 0; }
  header.topbar h1 { font-size: 1.05rem; }
  .brand-check { margin-right: 6px; transform: skewX(-16deg) scale(.8); }
  nav { margin-top: 8px; }
  nav a, header.topbar a.btn { display: inline-flex; align-items: center; min-height: 44px; padding: 9px 0 10px; font-size: .78rem; }
  .dashboard-shell { padding-left: 16px; padding-right: 16px; }
  .leader-grid { padding-top: 30px; padding-bottom: 26px; }
  .leader-name { font-size: clamp(3rem,17vw,4.5rem); }
  .leader-metrics { margin-top: 26px; }
  .leader-metric { min-width: 0; flex: 1; margin-right: 14px; padding-right: 14px; }
  .leader-metric strong { font-size: 1.35rem; }
  .leader-metric span { font-size: .56rem; }
  .podium-rail { gap: 7px; }
  .podium-card { min-height: 122px; padding: 13px 8px 12px 14px; transform: none; }
  .podium-card > * { transform: none; }
  .podium-card .podium-rank { font-size: 1.4rem; }
  .podium-card .podium-name { min-height: 33px; margin: 9px 0 5px; font-size: .78rem; }
  .podium-card .podium-points { font-size: 1.4rem; }
  .dashboard-section { padding: 28px 0; }
  .section-head { align-items: stretch; flex-direction: column; gap: 14px; }
  .section-heading { font-size: 1.3rem; }
  .filter-control { display: grid; grid-template-columns: repeat(3,1fr); width: 100%; }
  .filter-control button { min-width: 0; min-height: 44px; }
  .timing-table .desktop-stat { display: none; }
  .timing-table .col-pos { width: 44px; }
  .timing-table .col-points { width: 64px; }
  .timing-table th, .timing-table td { padding: 10px 7px; }
  .timing-table td:nth-child(2) { min-width: 0; }
  .mobile-driver-stats { display: block; }
  .scroll-cue { display: inline; }
  .race-row, .replay-row { grid-template-columns: 82px minmax(0,1fr) auto; gap: 10px; }
  .race-track { display: none; }
  .row-action span.label { display: none; }
  .row-action { justify-content: flex-end; min-width: 44px; min-height: 44px; }
  .race-date { font-size: .72rem; }
}
`;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function aiBadge(isAi) {
  return isAi ? '<span class="ai-badge">KI</span>' : '';
}

function layout({ title = 'F1 Rangliste', isAdmin = false, active = '', mainClass = '', body = '' }) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="F1-style Rangliste und Rennergebnisse fuer die Gruppe." />
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0d0d12"/><rect x="18" y="28" width="8" height="44" fill="#e10600"/><path d="M26 28h56v10l-14 8 14 8v10l-14-8-14 8-14-8-14 8V46l14-8-14-8z" fill="#f4f4f6"/></svg>')}" />
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header class="topbar">
  <h1><a href="/" aria-label="Zur F1 Freunde-Rangliste"><span class="brand-check" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>F1</span> Freunde</a></h1>
  <nav aria-label="Hauptnavigation">
    <a href="/"${active === 'standings' ? ' aria-current="page"' : ''}>Rangliste</a>
    <a href="/news"${active === 'news' ? ' aria-current="page"' : ''}>News</a>
    ${
      isAdmin
        ? `<a href="/admin"${active === 'admin' ? ' aria-current="page"' : ''}>Admin</a>
           <form action="/admin/logout" method="POST" style="display:inline">
             <button class="btn secondary" type="submit">Logout</button>
           </form>`
        : `<a href="/admin/login">Admin-Login</a>`
    }
  </nav>
</header>
<main${mainClass ? ` class="${esc(mainClass)}"` : ''}>${body}</main>
</body>
</html>`;
}

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

function arrowIcon() {
  return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function playIcon() {
  return '<span class="play-icon" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M3 2l7 4-7 4V2z" fill="currentColor"/></svg></span>';
}

function formatDate(value) {
  if (!value) return '–';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}.${month}.${year}` : esc(value);
}

function renderReplaysList(races) {
  const withVideo = races.filter((r) => r.video_url);
  if (withVideo.length === 0) {
    return `<p class="muted">Noch keine Rennaufzeichnungen verlinkt.</p>`;
  }
  const rows = withVideo
    .map((r) => {
      return `<li class="race-row replay-row">
        <span class="race-date">${formatDate(r.race_date)}</span>
        <strong>${esc(r.name)}</strong>
        <a class="row-action" href="${esc(r.video_url)}" target="_blank" rel="noopener">${playIcon()}<span class="label">Aufzeichnung ansehen</span>${arrowIcon()}</a>
      </li>`;
    })
    .join('');
  return `<ul class="race-list">${rows}</ul>`;
}

function renderHighlights(race, results) {
  const items = [];

  const winner = results.find((r) => !r.dnf && r.position === 1);
  if (winner) {
    items.push({ cls: 'winner', text: `🏆 ${winner.driver_name} gewinnt das Rennen.` });
  }

  const fastest = results.find((r) => r.driver_id === race.fastest_lap_driver_id);
  if (fastest) {
    items.push({ cls: 'fastest', text: `⚡ ${fastest.driver_name} fährt die schnellste Runde.` });
  }

  for (const r of results) {
    if (!r.dnf) continue;
    const lapText = r.laps_completed ? `in Runde ${r.laps_completed} ` : '';
    const reasonText = r.dnf_reason ? `wegen ${r.dnf_reason}` : '(Grund unbekannt)';
    items.push({ cls: 'dnf', text: `💥 ${r.driver_name} scheidet ${lapText}aus ${reasonText}.` });
  }

  if (items.length === 0) {
    return `<p class="muted">Noch keine Highlights für dieses Rennen.</p>`;
  }

  return `<ul class="highlights">${items
    .map((i) => `<li class="${i.cls}">${i.text}</li>`)
    .join('')}</ul>`;
}

export function renderTelemetryStatus(status) {
  const now = Date.now();
  const secondsSince = (iso) => (iso ? (now - new Date(iso).getTime()) / 1000 : Infinity);

  const listenerOn = secondsSince(status?.last_heartbeat) < 30;
  const gameOn = secondsSince(status?.last_packet_at) < 15;
  const armed = !!status?.armed;

  const tile = (on, label, extra) =>
    `<div class="status-tile"><span class="dot ${on ? 'on' : 'off'}"></span>${extra || (on ? 'Ja' : 'Nein')}
      <span class="label">${esc(label)}</span></div>`;

  return `
  <div class="status-grid">
    ${tile(listenerOn, 'Listener aktiv')}
    ${tile(gameOn, 'Verbindung zum Spiel')}
    ${tile(armed, 'Naechstes Rennen scharf')}
  </div>`;
}

function renderPointsChart(progression) {
  const { races: orderedRaces } = progression;
  const chartPalette = ['#ff2638', '#25c5ca', '#c9d3dd'];
  const rankedDrivers = progression.drivers
    .filter((d) => d.series.some((value) => value > 0))
    .sort((a, b) => (b.series.at(-1) || 0) - (a.series.at(-1) || 0));
  const drivers = (rankedDrivers.length > 0 ? rankedDrivers : progression.drivers)
    .slice(0, 3)
    .map((driver, index) => ({ ...driver, chartColor: chartPalette[index] }));
  if (orderedRaces.length < 2) {
    return `<p class="muted">Sobald mindestens zwei Rennen eingetragen sind, erscheint hier der Punkteverlauf.</p>`;
  }

  const width = 920;
  const height = 280;
  const padLeft = 46;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 48;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxPoints = Math.max(1, ...drivers.map((d) => d.series[d.series.length - 1] || 0));
  const yMax = Math.ceil((maxPoints * 1.1) / 10) * 10 || 10;

  const x = (i) => padLeft + (orderedRaces.length === 1 ? 0 : (i / (orderedRaces.length - 1)) * plotW);
  const y = (v) => padTop + plotH - (v / yMax) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const val = Math.round(yMax * f);
      const yy = y(val);
      return `<line x1="${padLeft}" y1="${yy}" x2="${width - padRight}" y2="${yy}" stroke="var(--f1-gray)" stroke-width="1" />
        <text x="${padLeft - 8}" y="${yy + 4}" text-anchor="end" font-size="10" fill="var(--f1-muted)">${val}</text>`;
    })
    .join('');

  const xLabels = orderedRaces
    .map((r, i) => {
      if (orderedRaces.length > 12 && i % Math.ceil(orderedRaces.length / 12) !== 0) return '';
      return `<text x="${x(i)}" y="${height - 20}" text-anchor="middle" font-size="10" fill="var(--f1-muted)">${i + 1}</text>
        <text x="${x(i)}" y="${height - 6}" text-anchor="middle" font-size="9" fill="var(--f1-muted)">${formatDate(r.race_date)}</text>`;
    })
    .join('');

  const lines = drivers
    .map((d, driverIndex) => {
      const points = d.series.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      const dots = d.series
        .map((v, i) => {
          const labelX = x(i) + (i === 0 ? 13 : i === d.series.length - 1 ? -13 : 0);
          return `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${d.chartColor}"><title>${esc(d.name)} · ${esc(
              orderedRaces[i].name
            )}: ${v} Punkte</title></circle><text x="${labelX}" y="${y(v) + (driverIndex === 2 ? 16 : -9)}" text-anchor="middle" font-size="11" font-weight="700" fill="${d.chartColor}">${v}</text>`;
        })
        .join('');
      return `<polyline points="${points}" fill="none" stroke="${d.chartColor}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />${dots}`;
    })
    .join('');

  const legend = drivers
    .map(
      (d) =>
        `<span><span class="swatch" style="background:${d.chartColor}"></span>${esc(d.name)}${aiBadge(d.is_ai)}</span>`
    )
    .join('');

  return `
  <div class="chart-wrap dashboard-chart">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Punkteverlauf pro Fahrer">
      ${gridLines}
      ${lines}
      ${xLabels}
    </svg>
  </div>
  <div class="chart-note"><div class="chart-legend">${legend}</div><span class="scroll-cue">Seitlich scrollen →</span></div>`;
}

function renderTeamStandings(teamStandings) {
  if (teamStandings.length === 0) {
    return `<p class="muted">Noch keine Fahrer mit einem Team versehen. Team im Admin-Bereich beim Fahrer eintragen.</p>`;
  }
  const teamColor = (name) => {
    const value = String(name || '').toLowerCase();
    if (value.includes('mercedes')) return '#27d2c9';
    if (value.includes('ferrari')) return '#ff2638';
    if (value.includes('aston')) return '#20b486';
    if (value.includes('mclaren')) return '#ff8700';
    if (value.includes('red bull')) return '#4b72e8';
    if (value.includes('williams')) return '#28a9e8';
    if (value.includes('alpine')) return '#ee70b7';
    if (value.includes('haas')) return '#d5d8de';
    if (value.includes('sauber') || value.includes('kick')) return '#52e252';
    if (value.includes('racing bulls') || value.includes('visa')) return '#8db8ff';
    return '#8b96a0';
  };
  const rows = teamStandings
    .map((t, i) => {
      const driverNames = t.drivers
        .map((d) => `${esc(d.name)}${aiBadge(d.is_ai)} (${d.points})`)
        .join(', ');
      return `<li class="team-row" style="--team-color:${teamColor(t.team)}">
        <span class="team-rank">${i + 1}</span><span class="team-stripe" aria-hidden="true"></span>
        <span class="team-name">${esc(t.team)}<span class="team-drivers">${driverNames}</span></span>
        <strong class="team-points">${t.points}</strong>
      </li>`;
    })
    .join('');
  return `<ol class="team-list">${rows}</ol>`;
}

export function renderIndex({ standings, teamStandings, races, progression, isAdmin }) {
  const seasonYear = races.find((r) => r.race_date)?.race_date?.slice(0, 4) || new Date().getFullYear();
  const activeDrivers = standings.filter((s) => s.races > 0).length;
  const leaderGap = Math.max(0, (standings[0]?.points || 0) - (standings[1]?.points || 0));
  const podiumColors = ['#ffd45b', '#c9d3dd', '#e89155'];
  let friendRank = 0;
  let aiRank = 0;
  const rows = standings
    .map((s, i) => {
      const kind = s.is_ai ? 'ai' : 'friend';
      const groupRank = s.is_ai ? ++aiRank : ++friendRank;
      return `
    <tr class="pos-${i + 1}" data-driver-kind="${kind}" data-rank-overall="${i + 1}" data-rank-group="${groupRank}"${s.is_ai ? ' hidden' : ''}>
      <td class="stat"><span class="row-position">${groupRank}</span></td>
      <td><span class="driver-color" style="background:${esc(s.color)}"></span>${esc(s.name)}${aiBadge(s.is_ai)}
        <span class="mobile-driver-stats">${s.races} Rennen · ${s.wins} Siege · ${s.podiums} Podien</span></td>
      <td class="stat desktop-stat">${s.races}</td>
      <td class="stat desktop-stat">${s.wins}</td>
      <td class="stat desktop-stat">${s.podiums}</td>
      <td class="points">${s.points}</td>
    </tr>`;
    })
    .join('');

  const raceRows = races
    .map(
      (r) => `<li class="race-row">
        <span class="race-date">${formatDate(r.race_date)}</span>
        <strong>${esc(r.name)}</strong>
        <span class="race-track">${esc(r.track || 'Strecke nicht hinterlegt')}</span>
        <a class="row-action" href="/races/${r.id}"><span class="label">Ergebnis ansehen</span>${arrowIcon()}</a>
      </li>`
    )
    .join('');

  const podium = standings.slice(0, 3).map((driver, index) => `<article class="podium-card" style="--podium:${podiumColors[index]}">
    <span class="podium-rank">${index + 1}</span>
    <strong class="podium-name">${esc(driver.name)}${aiBadge(driver.is_ai)}</strong>
    <span class="podium-points">${driver.points} <small>Punkte</small></span>
  </article>`).join('');

  const body = `
  <section class="leader-stage" aria-labelledby="season-title">
    <div class="dashboard-shell leader-grid">
      <div>
        <p class="champ-label">Meisterschaft ${esc(seasonYear)} · Spitzenreiter</p>
        <h2 class="leader-name" id="season-title">${standings[0] ? esc(standings[0].name) : 'Startaufstellung'}</h2>
        <div class="leader-score"><strong>${standings[0]?.points || 0}</strong><span>Punkte</span></div>
        <div class="leader-metrics" aria-label="Saisonübersicht">
          <div class="leader-metric"><strong>${races.length}</strong><span>Rennen</span></div>
          <div class="leader-metric"><strong>${activeDrivers}</strong><span>Aktive Fahrer</span></div>
          <div class="leader-metric"><strong>${leaderGap}</strong><span>Punkte Vorsprung</span></div>
        </div>
      </div>
      <div>
        <p class="podium-title">Top 3 der Gesamtwertung</p>
        <div class="podium-rail">${podium}</div>
      </div>
    </div>
  </section>
  <div class="dashboard-shell">
    <div class="dashboard-section section-grid">
      <section aria-labelledby="drivers-heading">
        <div class="section-head">
          <div><h2 class="section-heading" id="drivers-heading">Fahrerwertung</h2><p class="section-kicker"><span id="driver-count">${friendRank}</span> Fahrer angezeigt</p></div>
          <div class="filter-control" role="group" aria-label="Fahrerwertung filtern">
            <button type="button" data-filter="friend" aria-pressed="true">Freunde</button>
            <button type="button" data-filter="all" aria-pressed="false">Gesamtfeld</button>
            <button type="button" data-filter="ai" aria-pressed="false">KI</button>
          </div>
        </div>
        ${standings.length === 0
          ? `<p class="muted">Noch keine Fahrer angelegt. ${isAdmin ? '<a href="/admin">Jetzt im Admin-Bereich anlegen</a>.' : ''}</p>`
          : `<div class="table-wrap"><table class="timing-table standings-table">
            <thead><tr><th class="col-pos">Pos.</th><th>Fahrer</th><th class="col-stat desktop-stat">Rennen</th><th class="col-stat desktop-stat">Siege</th><th class="col-stat desktop-stat">Podien</th><th class="col-points">Punkte</th></tr></thead>
            <tbody>${rows}</tbody>
          </table><p class="filter-empty" id="filter-empty">Keine Fahrer in dieser Auswahl.</p></div>`}
      </section>
      <section aria-labelledby="teams-heading">
        <div class="section-head"><div><h2 class="section-heading" id="teams-heading">Teamwertung</h2><p class="section-kicker">Konstrukteurswertung</p></div></div>
        ${renderTeamStandings(teamStandings)}
      </section>
    </div>

    <section class="dashboard-section chart-panel" aria-labelledby="chart-heading">
      <div class="section-head"><div><h2 class="section-heading" id="chart-heading">Punkteverlauf</h2><p class="section-kicker">Entwicklung der Top 3 nach jedem Rennen</p></div></div>
      ${renderPointsChart(progression)}
    </section>

    <section class="dashboard-section" aria-labelledby="races-heading">
      <div class="section-head"><div><h2 class="section-heading" id="races-heading">Letzte Rennen</h2><p class="section-kicker">Alle eingetragenen Ergebnisse</p></div></div>
      ${races.length === 0 ? '<p class="muted">Noch keine Rennen eingetragen.</p>' : `<ul class="race-list">${raceRows}</ul>`}
    </section>

    <section class="dashboard-section" aria-labelledby="replays-heading">
      <div class="section-head"><div><h2 class="section-heading" id="replays-heading">Rennaufzeichnungen</h2><p class="section-kicker">Die Saison noch einmal ansehen</p></div></div>
      ${renderReplaysList(races)}
    </section>
    <footer class="dashboard-foot">F1 Freunde-Rangliste · Saison ${esc(seasonYear)}</footer>
  </div>
  <script>
  (() => {
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const rows = [...document.querySelectorAll('[data-driver-kind]')];
    const count = document.getElementById('driver-count');
    const empty = document.getElementById('filter-empty');
    const applyFilter = (filter) => {
      let visible = 0;
      for (const row of rows) {
        const matches = filter === 'all' || row.dataset.driverKind === filter;
        row.hidden = !matches;
        if (matches) {
          visible += 1;
          row.querySelector('.row-position').textContent = filter === 'all' ? row.dataset.rankOverall : row.dataset.rankGroup;
        }
      }
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
      if (count) count.textContent = String(visible);
      if (empty) empty.style.display = visible ? 'none' : 'block';
    };
    for (const button of buttons) button.addEventListener('click', () => applyFilter(button.dataset.filter));
    applyFilter('friend');
  })();
  </script>`;
  return layout({ title: 'F1 Rangliste', isAdmin, active: 'standings', mainClass: 'dashboard-main', body });
}

export function renderRace({ race, results, POINTS, FASTEST_LAP_BONUS, isAdmin }) {
  const rows = results
    .map((r) => {
      let pts = 0;
      if (!r.dnf) {
        pts = POINTS[r.position] || 0;
        if (race.fastest_lap_driver_id === r.driver_id && r.position && r.position <= 10) pts += FASTEST_LAP_BONUS;
      }
      return `
    <tr class="${!r.dnf && r.position <= 3 ? 'pos-' + r.position : ''}">
      <td>${r.dnf ? '<span class="muted">DNF</span>' : `<span class="pos-badge">${r.position}</span>`}</td>
      <td><span class="driver-color" style="background:${esc(r.driver_color)}"></span>${esc(r.driver_name)}${aiBadge(r.driver_is_ai)}
        ${race.fastest_lap_driver_id === r.driver_id ? '<span class="muted">(schnellste Runde)</span>' : ''}
      </td>
      <td class="points">${pts}</td>
    </tr>`;
    })
    .join('');

  const body = `
  <div class="card">
    <h2>${esc(race.name)}</h2>
    <p class="muted">${esc(race.track || '')} ${race.race_date ? '· ' + esc(race.race_date) : ''}</p>
    ${
      results.length === 0
        ? `<p class="muted">Noch keine Ergebnisse fuer dieses Rennen.</p>`
        : `<div class="table-wrap"><table><thead><tr><th>Platz</th><th>Fahrer</th><th>Punkte</th></tr></thead><tbody>${rows}</tbody></table></div>`
    }
    ${
      race.video_url
        ? `<p style="margin-top:16px;"><a class="race-link" href="${esc(race.video_url)}" target="_blank" rel="noopener">&#9654; Rennaufzeichnung ansehen</a></p>`
        : ''
    }
  </div>
  <div class="card">
    <h2>Highlights</h2>
    ${renderHighlights(race, results)}
  </div>
  <a href="/">&larr; Zurück zur Rangliste</a>`;
  return layout({ title: race.name, isAdmin, active: 'standings', body });
}

export function renderNews({ items, isAdmin }) {
  const dateFmt = (iso) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const body = `
  <div class="card">
    <h2>News</h2>
    ${
      items.length === 0
        ? `<p class="muted">Noch keine News. Sobald jemand ausfaellt, gewinnt oder das Team wechselt, taucht es hier auf.</p>`
        : `<ul class="news-feed">${items
            .map(
              (i) => `<li class="news-item ${esc(i.kind)}">
              <span class="news-date">${esc(dateFmt(i.at))}</span>
              <span class="news-message">${esc(i.message)}</span>
            </li>`
            )
            .join('')}</ul>`
    }
  </div>
  <a href="/">&larr; Zurück zur Rangliste</a>`;
  return layout({ title: 'News', isAdmin, active: 'news', body });
}

export function renderLogin({ error }) {
  const body = `
  <div class="card" style="max-width:400px;margin:40px auto;">
    <h2>Admin-Login</h2>
    ${error ? `<div class="error">${esc(error)}</div>` : ''}
    <form method="POST" action="/admin/login">
      <div style="margin-bottom:12px;">
        <label>Benutzername</label><br />
        <input type="text" name="username" required style="width:100%;" />
      </div>
      <div style="margin-bottom:16px;">
        <label>Passwort</label><br />
        <input type="password" name="password" required style="width:100%;" />
      </div>
      <button class="btn" type="submit">Einloggen</button>
    </form>
  </div>`;
  return layout({ title: 'Admin-Login', isAdmin: false, body });
}

export function renderAdmin({ drivers, races, passwordError, telemetryStatus }) {
  const driverRows = drivers
    .map(
      (d) => `
    <tr>
      <td>${esc(d.name)}${aiBadge(d.is_ai)}</td>
      <td><span class="driver-color" style="background:${esc(d.color)}"></span></td>
      <td>
        <form action="/admin/drivers/${d.id}/team" method="POST" class="inline" style="margin:0;flex-wrap:nowrap;">
          <input type="text" name="team" value="${esc(d.team || '')}" placeholder="Team" style="width:150px;" />
          <button class="btn secondary" type="submit" style="padding:6px 10px;">✓</button>
        </form>
      </td>
      <td><form action="/admin/drivers/${d.id}/delete" method="POST" onsubmit="return confirm('Fahrer wirklich loeschen?');">
        <button class="btn danger" type="submit">Loeschen</button></form></td>
    </tr>`
    )
    .join('');

  const raceRows = races
    .map(
      (r) => `
    <tr>
      <td><a class="race-link" href="/admin/races/${r.id}">${esc(r.name)}</a></td>
      <td>${esc(r.race_date || '-')}</td>
      <td><form action="/admin/races/${r.id}/delete" method="POST" onsubmit="return confirm('Rennen wirklich loeschen?');">
        <button class="btn danger" type="submit">Loeschen</button></form></td>
    </tr>`
    )
    .join('');

  const body = `
  <div class="card">
    <h2>Telemetrie-Status</h2>
    ${renderTelemetryStatus(telemetryStatus)}
  </div>
  <div class="grid-2">
    <div class="card">
      <h2>Fahrer</h2>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Farbe</th><th>Team</th><th></th></tr></thead><tbody>${driverRows}</tbody></table></div>
      <form class="inline" action="/admin/drivers" method="POST">
        <input type="text" name="name" placeholder="Fahrername" required />
        <input type="color" name="color" value="#e10600" />
        <input type="text" name="team" placeholder="Team (optional)" class="wide-input" />
        <label class="muted" style="display:flex;align-items:center;gap:5px;">
          <input type="checkbox" name="is_ai" style="width:auto;" /> KI-Fahrer
        </label>
        <button class="btn" type="submit">Fahrer hinzufuegen</button>
      </form>
    </div>
    <div class="card">
      <h2>Rennen</h2>
      <div class="table-wrap"><table><thead><tr><th>Rennen</th><th>Datum</th><th></th></tr></thead><tbody>${raceRows}</tbody></table></div>
      <form class="inline" action="/admin/races" method="POST">
        <input type="text" name="name" placeholder="Rennname (z.B. GP Spa)" required />
        <input type="text" name="track" placeholder="Strecke" />
        <input type="date" name="race_date" />
        <input type="text" name="video_url" class="wide-input" placeholder="YouTube-Link (optional)" />
        <button class="btn" type="submit">Rennen anlegen</button>
      </form>
    </div>
  </div>
  <div class="card">
    <h2>Passwort aendern</h2>
    ${passwordError ? `<div class="error">${esc(passwordError)}</div>` : ''}
    <form action="/admin/password" method="POST" class="inline">
      <input type="password" name="current_password" placeholder="Aktuelles Passwort" required />
      <input type="password" name="new_password" placeholder="Neues Passwort" required minlength="4" />
      <button class="btn" type="submit">Aendern</button>
    </form>
  </div>`;
  return layout({ title: 'Admin', isAdmin: true, active: 'admin', body });
}

export function renderAdminRace({ race, drivers, resultsByDriver }) {
  const rows = drivers
    .map((d) => {
      const r = resultsByDriver[d.id];
      return `
    <tr>
      <td><span class="driver-color" style="background:${esc(d.color)}"></span>${esc(d.name)}${aiBadge(d.is_ai)}</td>
      <td><input type="number" min="1" max="99" name="position_${d.id}" value="${r && r.position ? r.position : ''}" /></td>
      <td><input type="checkbox" name="dnf_${d.id}" ${r && r.dnf ? 'checked' : ''} /></td>
      <td><input type="radio" name="fastest_lap_driver_id" value="${d.id}" ${race.fastest_lap_driver_id === d.id ? 'checked' : ''} /></td>
    </tr>`;
    })
    .join('');

  const body = `
  <div class="card">
    <h2>Ergebnisse eintragen: ${esc(race.name)}</h2>
    <p class="muted">${esc(race.track || '')} ${race.race_date ? '· ' + esc(race.race_date) : ''}</p>
    ${
      drivers.length === 0
        ? `<p class="muted">Lege zuerst Fahrer im <a href="/admin">Admin-Bereich</a> an.</p>`
        : `<form action="/admin/races/${race.id}/results" method="POST" class="results-form">
        <div class="table-wrap"><table><thead><tr><th>Fahrer</th><th>Platz</th><th>DNF</th><th>Schnellste Runde</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
        <div class="row" style="margin-top:14px;">
          <label>YouTube-Link zur Aufzeichnung:<br />
            <input type="text" name="video_url" class="wide-input" style="display:block;width:100%;max-width:420px;" value="${esc(race.video_url || '')}" />
          </label>
        </div>
        <br /><button class="btn" type="submit">Ergebnisse speichern</button>
      </form>`
    }
  </div>
  <a href="/admin">&larr; Zurueck zum Admin-Bereich</a>`;
  return layout({ title: 'Ergebnisse: ' + race.name, isAdmin: true, body });
}
