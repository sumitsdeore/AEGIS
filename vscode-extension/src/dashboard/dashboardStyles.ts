/**
 * Dashboard stylesheet.
 *
 * Design intent: Ultra-premium pitch-black Glassmorphism theme with vivid
 * neon accents, specular sheen highlights, frosted glass cards, and smooth
 * micro-interactions while integrating cleanly with VS Code editor typography.
 */
export const DASHBOARD_STYLES = `
:root {
  /* Obsidian / Pitch-black base surfaces */
  --aegis-bg: #000000;
  --aegis-bg-elevated: #050811;
  --aegis-bg-raised: rgba(13, 19, 33, 0.65);
  --aegis-bg-overlay: rgba(22, 32, 54, 0.55);
  --aegis-bg-hover: rgba(56, 189, 248, 0.09);
  --aegis-bg-glass: rgba(10, 15, 26, 0.45);

  --aegis-border: rgba(255, 255, 255, 0.08);
  --aegis-border-strong: rgba(255, 255, 255, 0.15);
  --aegis-border-glow: rgba(56, 189, 248, 0.35);

  --aegis-text: #f8fafc;
  --aegis-text-muted: #94a3b8;
  --aegis-text-dim: #64748b;

  /* Vibrant Neon Accents */
  --aegis-primary: #38bdf8;
  --aegis-primary-glow: rgba(56, 189, 248, 0.28);
  --aegis-primary-dim: #0284c7;

  /* Risk bands */
  --aegis-low: #10b981;
  --aegis-moderate: #fbbf24;
  --aegis-elevated: #f97316;
  --aegis-high: #f43f5e;

  --aegis-radius: 14px;
  --aegis-radius-sm: 8px;
  --aegis-radius-xs: 5px;
  --aegis-glass-blur: blur(20px) saturate(180%);
  --aegis-glass-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);

  --aegis-font: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --aegis-font-mono: var(--vscode-editor-font-family, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace);
  --aegis-font-size: var(--vscode-font-size, 13px);
  --aegis-focus: var(--vscode-focusBorder, #38bdf8);
}

* { box-sizing: border-box; }

/* Sleek custom scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.4); }

body {
  margin: 0;
  padding: 0;
  background-color: var(--aegis-bg);
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.14), transparent 70%),
    radial-gradient(circle 600px at 90% 15%, rgba(168, 85, 247, 0.08), transparent),
    radial-gradient(circle 600px at 10% 60%, rgba(16, 185, 129, 0.05), transparent);
  background-attachment: fixed;
  color: var(--aegis-text);
  font-family: var(--aegis-font);
  font-size: var(--aegis-font-size);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--aegis-primary); text-decoration: none; transition: color 120ms ease; }
a:hover { color: #7dd3fc; text-decoration: underline; }

:focus-visible {
  outline: 2px solid var(--aegis-focus);
  outline-offset: 2px;
  border-radius: var(--aegis-radius-sm);
}

.layout {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px 28px 64px;
}

/* ---------------------------------------------------------------- header --- */

.masthead {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 24px;
  background: var(--aegis-bg-raised);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  box-shadow: var(--aegis-glass-shadow);
  position: relative;
  overflow: hidden;
}

.masthead::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%);
  pointer-events: none;
}

.brand-row { display: flex; align-items: center; gap: 14px; }

.brand-mark {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 11px;
  background: linear-gradient(135deg, #00f0ff 0%, #38bdf8 50%, #818cf8 100%);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 16px;
  color: #020617;
  letter-spacing: -0.5px;
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.6);
}

h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #ffffff 60%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.project-path {
  margin: 3px 0 0;
  font-family: var(--aegis-font-mono);
  font-size: 11.5px;
  color: var(--aegis-text-dim);
  word-break: break-all;
}

.badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid var(--aegis-border-strong);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 11px;
  color: var(--aegis-text-muted);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.badge strong { color: var(--aegis-text); font-weight: 600; }
.badge.is-warn { border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.12); color: var(--aegis-moderate); }
.badge.is-error { border-color: rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.14); color: var(--aegis-high); }
.badge.is-ok { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.12); color: var(--aegis-low); }

.action-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

button {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid var(--aegis-border-strong);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--aegis-text);
  cursor: pointer;
  transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
button:active { transform: translateY(0); }

button.primary {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  border-color: #38bdf8;
  color: #020617;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4);
}
button.primary:hover {
  background: linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%);
  box-shadow: 0 0 28px rgba(56, 189, 248, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

/* ------------------------------------------------------------- callouts --- */

.callout {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: var(--aegis-radius);
  border: 1px solid var(--aegis-border-strong);
  border-left: 3px solid var(--aegis-primary);
  background: var(--aegis-bg-raised);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  box-shadow: var(--aegis-glass-shadow);
  font-size: 12.5px;
}
.callout.is-warn { border-left-color: var(--aegis-moderate); }
.callout.is-error { border-left-color: var(--aegis-high); }
.callout-title { font-weight: 700; margin-bottom: 4px; }
.callout-body { color: var(--aegis-text-muted); }

/* ----------------------------------------------------------------- tabs --- */

.tabs {
  display: inline-flex;
  gap: 4px;
  margin: 0 0 24px;
  padding: 5px;
  background: rgba(10, 15, 26, 0.75);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.tab {
  padding: 8px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: none;
  color: var(--aegis-text-muted);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.tab:hover {
  color: var(--aegis-text);
  background: rgba(255, 255, 255, 0.06);
}
.tab[aria-selected="true"] {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15);
}
.tab .tab-count {
  margin-left: 7px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10.5px;
  color: var(--aegis-text-dim);
}
.tab[aria-selected="true"] .tab-count {
  background: rgba(56, 189, 248, 0.25);
  color: #7dd3fc;
}

.panel { display: none; }
.panel.is-active { display: block; animation: fadeIn 200ms ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---------------------------------------------------------------- cards --- */

.section-title {
  margin: 0 0 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.85px;
  color: var(--aegis-text-dim);
}

.card {
  background: var(--aegis-bg-raised);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  box-shadow: var(--aegis-glass-shadow);
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms ease,
              box-shadow 180ms ease;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.18) 50%, transparent 100%);
  pointer-events: none;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.14);
}

.grid { display: grid; gap: 14px; }
.metric-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.split { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); align-items: start; }

.metric {
  position: relative;
  padding: 18px 20px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.metric:hover {
  transform: translateY(-2px);
  border-color: var(--aegis-border-glow);
  box-shadow: 0 16px 32px -6px rgba(0, 0, 0, 0.8), 0 0 20px var(--aegis-primary-glow), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
}
.metric-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--aegis-text-dim);
  font-weight: 700;
}
.metric-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.metric-hint { font-size: 11px; color: var(--aegis-text-muted); margin-top: 4px; }

/* ------------------------------------------------------------ bar chart --- */

.bar-row {
  display: grid;
  grid-template-columns: 100px 1fr 44px;
  gap: 12px;
  align-items: center;
  margin-bottom: 9px;
}
.bar-name { font-size: 12px; color: var(--aegis-text-muted); }
.bar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}
.bar-value { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; color: var(--aegis-text); font-weight: 600; }

/* ----------------------------------------------------------------- ring --- */

.ring-wrap { display: flex; align-items: center; gap: 20px; }
.ring { flex: 0 0 84px; }
.ring-track { stroke: rgba(255, 255, 255, 0.07); }
.ring-value {
  font-size: 18px;
  font-weight: 700;
  fill: #ffffff;
  filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
}

/* ---------------------------------------------------------------- table --- */

.table-scroll {
  max-height: 400px;
  overflow: auto;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 12, 20, 0.45);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}
thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  text-align: left;
  padding: 10px 12px;
  background: rgba(13, 19, 31, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--aegis-text-dim);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 700;
  border-bottom: 1px solid var(--aegis-border);
  white-space: nowrap;
}
tbody td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
  transition: background 120ms ease;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr.is-clickable { cursor: pointer; }
tbody tr.is-clickable:hover td { background: var(--aegis-bg-hover); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--aegis-font-mono); font-size: 11px; }
.dim { color: var(--aegis-text-dim); }
.accent { color: var(--aegis-primary); font-weight: 600; text-shadow: 0 0 10px rgba(56, 189, 248, 0.35); }

/* ------------------------------------------------------------ risk pill --- */

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.pill-low { background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); box-shadow: 0 0 12px rgba(16, 185, 129, 0.15); }
.pill-moderate { background: rgba(251, 191, 36, 0.14); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.35); box-shadow: 0 0 12px rgba(251, 191, 36, 0.15); }
.pill-elevated { background: rgba(249, 115, 22, 0.14); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.35); box-shadow: 0 0 12px rgba(249, 115, 22, 0.15); }
.pill-high { background: rgba(244, 63, 94, 0.16); color: #f87171; border: 1px solid rgba(244, 63, 94, 0.45); box-shadow: 0 0 16px rgba(244, 63, 94, 0.25); }

.verb {
  display: inline-block;
  min-width: 52px;
  text-align: center;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: var(--aegis-font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.verb-GET { background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
.verb-POST { background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
.verb-PUT { background: rgba(251, 191, 36, 0.14); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.35); box-shadow: 0 0 10px rgba(251, 191, 36, 0.2); }
.verb-PATCH { background: rgba(249, 115, 22, 0.14); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.35); box-shadow: 0 0 10px rgba(249, 115, 22, 0.2); }
.verb-DELETE { background: rgba(244, 63, 94, 0.16); color: #f87171; border: 1px solid rgba(244, 63, 94, 0.4); box-shadow: 0 0 12px rgba(244, 63, 94, 0.25); }
.verb-ANY { background: rgba(168, 85, 247, 0.14); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); box-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }

.tag {
  display: inline-block;
  padding: 2px 7px;
  margin: 0 3px 3px 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--aegis-border);
  font-family: var(--aegis-font-mono);
  font-size: 10px;
  color: var(--aegis-text-muted);
}

/* ---------------------------------------------------------------- graph --- */

.graph-shell { display: grid; grid-template-columns: 1fr 316px; gap: 14px; align-items: start; }
@media (max-width: 1020px) { .graph-shell { grid-template-columns: 1fr; } }

.graph-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

input[type="search"], select {
  font-family: inherit;
  font-size: 12px;
  padding: 6px 11px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid var(--aegis-border-strong);
  background: rgba(10, 15, 26, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--aegis-text);
  transition: all 140ms ease;
}
input[type="search"]:focus, select:focus {
  border-color: var(--aegis-primary);
  box-shadow: 0 0 12px var(--aegis-primary-glow);
  outline: none;
}
input[type="search"] { min-width: 200px; }
input[type="search"]::placeholder { color: var(--aegis-text-dim); }

.graph-canvas {
  position: relative;
  height: 580px;
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  background-color: #000000;
  background-image:
    radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.09) 0%, transparent 65%),
    radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 45%),
    linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.95), var(--aegis-glass-shadow);
  overflow: hidden;
}
.graph-canvas svg { width: 100%; height: 100%; display: block; cursor: grab; }
.graph-canvas svg.is-panning { cursor: grabbing; }

.edge { stroke: rgba(255, 255, 255, 0.12); stroke-width: 1.2; fill: none; transition: stroke 160ms ease; }
.edge.is-adjacent { stroke: #38bdf8; stroke-width: 2.2; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.7)); }
.edge.is-dimmed { stroke: rgba(255, 255, 255, 0.03); }

.node-dot { cursor: pointer; stroke: #000000; stroke-width: 1.6; transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1); }
.node-dot:hover { filter: drop-shadow(0 0 8px currentColor); }
.node-dot.is-selected { stroke: #ffffff; stroke-width: 2.6; filter: drop-shadow(0 0 14px #38bdf8); }
.node-dot.is-dimmed { opacity: 0.16; }
.node-label {
  font-size: 10px; font-weight: 500; fill: #cbd5e1; pointer-events: none;
  paint-order: stroke; stroke: #000000; stroke-width: 3px; stroke-linejoin: round;
}
.node-label.is-dimmed { opacity: 0.15; }

.graph-legend {
  position: absolute; bottom: 14px; left: 14px;
  display: flex; flex-wrap: wrap; gap: 12px;
  padding: 8px 14px; border-radius: var(--aegis-radius-sm);
  background: rgba(8, 12, 20, 0.85);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  font-size: 11px; color: var(--aegis-text-muted);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

.graph-empty {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  text-align: center; padding: 30px;
  color: var(--aegis-text-muted); font-size: 13px;
}

.graph-match-count {
  margin-left: auto; white-space: nowrap;
  font-size: 11.5px; color: var(--aegis-text-muted);
}
.graph-match-count.is-empty { color: var(--aegis-moderate); font-weight: 600; }

/* ------------------------------------------------------------- inspector -- */

.inspector {
  position: sticky;
  top: 12px;
  background: rgba(13, 19, 33, 0.75);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  box-shadow: var(--aegis-glass-shadow);
}
.inspector-empty { color: var(--aegis-text-dim); font-size: 12px; }
.inspector h3 { margin: 0; font-size: 15px; font-weight: 700; word-break: break-word; color: #ffffff; }
.inspector .qualified {
  font-family: var(--aegis-font-mono); font-size: 10.5px;
  color: var(--aegis-text-dim); word-break: break-all; margin: 3px 0 14px;
}

.stat-pair { display: flex; justify-content: space-between; gap: 10px; padding: 5px 0; font-size: 12px; }
.stat-pair + .stat-pair { border-top: 1px solid rgba(255, 255, 255, 0.05); }
.stat-pair dt { color: var(--aegis-text-muted); }
.stat-pair dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 600; color: var(--aegis-text); }

.factor { margin-bottom: 10px; }
.factor-head { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px; font-weight: 600; }
.factor-detail { font-size: 10.5px; color: var(--aegis-text-dim); margin-top: 3px; }

.relation-list { list-style: none; margin: 6px 0 0; padding: 0; max-height: 150px; overflow: auto; }
.relation-list li {
  padding: 4px 0; font-size: 11.5px;
  font-family: var(--aegis-font-mono);
  color: var(--aegis-text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: color 120ms ease;
}
.relation-list li:hover { color: var(--aegis-primary); }

hr.divider { border: none; border-top: 1px solid var(--aegis-border); margin: 16px 0; }

.subhead {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--aegis-text-dim); font-weight: 700; margin: 0 0 6px;
}

.empty-state { text-align: center; padding: 54px 20px; color: var(--aegis-text-muted); }
.empty-state h2 {
  font-size: 18px; margin: 0 0 8px; font-weight: 700;
  background: linear-gradient(135deg, #ffffff 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.empty-state p { margin: 0 auto 20px; max-width: 500px; font-size: 13px; line-height: 1.6; }

.footnote { font-size: 11px; color: var(--aegis-text-dim); margin-top: 12px; }

/* Respect the editor's high-contrast themes by strengthening every border. */
@media (prefers-contrast: more) {
  :root { --aegis-border: #4a5f7a; --aegis-border-strong: #6b83a3; --aegis-text-muted: #b9c9dd; }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;
