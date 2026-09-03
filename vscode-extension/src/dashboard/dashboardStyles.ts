/**
 * Dashboard stylesheet.
 *
 * Design intent: Apple-grade frosted glass / light-grey glass cards on an
 * infinite pitch-black background with crisp specular highlights, refined
 * typography, and fluid micro-interactions.
 */
export const DASHBOARD_STYLES = `
:root {
  /* Infinite Pitch-Black base */
  --aegis-bg: #000000;
  --aegis-bg-elevated: #000000;
  --aegis-bg-raised: rgba(255, 255, 255, 0.06);
  --aegis-bg-overlay: rgba(255, 255, 255, 0.09);
  --aegis-bg-hover: rgba(255, 255, 255, 0.1);
  --aegis-bg-glass: rgba(255, 255, 255, 0.04);

  /* Apple glass borders with light grey / white translucency */
  --aegis-border: rgba(255, 255, 255, 0.12);
  --aegis-border-strong: rgba(255, 255, 255, 0.2);
  --aegis-border-glow: rgba(255, 255, 255, 0.32);

  /* Apple-grade typography contrast */
  --aegis-text: #f5f5f7;
  --aegis-text-muted: #a1a1a6;
  --aegis-text-dim: #6e6e73;

  /* Vibrant Apple-inspired accents */
  --aegis-primary: #38bdf8;
  --aegis-primary-glow: rgba(56, 189, 248, 0.25);
  --aegis-primary-dim: #0284c7;

  /* Refined risk palette */
  --aegis-low: #30d158;
  --aegis-moderate: #ffd60a;
  --aegis-elevated: #ff9f0a;
  --aegis-high: #ff453a;

  /* Apple geometry & specular glass shadows */
  --aegis-radius: 16px;
  --aegis-radius-sm: 10px;
  --aegis-radius-xs: 6px;
  --aegis-glass-blur: blur(28px) saturate(190%) contrast(105%);
  --aegis-glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.04);

  --aegis-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", var(--vscode-font-family, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --aegis-font-mono: "SF Mono", Menlo, Monaco, Consolas, var(--vscode-editor-font-family, monospace);
  --aegis-font-size: var(--vscode-font-size, 13px);
  --aegis-focus: var(--vscode-focusBorder, #38bdf8);
}

* { box-sizing: border-box; }

/* Apple-style minimalist scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.18); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); }

body {
  margin: 0;
  padding: 0;
  background-color: var(--aegis-bg);
  background: #000000;
  color: var(--aegis-text);
  font-family: var(--aegis-font);
  font-size: var(--aegis-font-size);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  padding: 22px 26px;
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
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
  pointer-events: none;
}

.brand-row { display: flex; align-items: center; gap: 14px; }

.brand-mark {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  font-weight: 750;
  font-size: 16px;
  color: #ffffff;
  letter-spacing: -0.3px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.5);
}

h1 {
  margin: 0;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: #ffffff;
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
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  font-size: 11.5px;
  color: var(--aegis-text-muted);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
.badge strong { color: #ffffff; font-weight: 600; }
.badge.is-warn { border-color: rgba(255, 214, 10, 0.35); background: rgba(255, 214, 10, 0.1); color: var(--aegis-moderate); }
.badge.is-error { border-color: rgba(255, 69, 58, 0.35); background: rgba(255, 69, 58, 0.12); color: var(--aegis-high); }
.badge.is-ok { border-color: rgba(48, 209, 88, 0.35); background: rgba(48, 209, 88, 0.1); color: var(--aegis-low); }

.action-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

button {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #ffffff;
  cursor: pointer;
  transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
button:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
button:active { transform: translateY(0); }

button.primary {
  background: linear-gradient(180deg, #0a84ff 0%, #0071e3 100%);
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
button.primary:hover {
  background: linear-gradient(180deg, #2997ff 0%, #0077ed 100%);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 6px 22px rgba(10, 132, 255, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

/* ------------------------------------------------------------- callouts --- */

.callout {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: var(--aegis-radius);
  border: 1px solid var(--aegis-border);
  border-left: 3px solid var(--aegis-primary);
  background: var(--aegis-bg-raised);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  box-shadow: var(--aegis-glass-shadow);
  font-size: 12.5px;
}
.callout.is-warn { border-left-color: var(--aegis-moderate); }
.callout.is-error { border-left-color: var(--aegis-high); }
.callout-title { font-weight: 700; margin-bottom: 4px; color: #ffffff; }
.callout-body { color: var(--aegis-text-muted); }

/* ----------------------------------------------------------------- tabs --- */

.tabs {
  display: inline-flex;
  gap: 4px;
  margin: 0 0 24px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
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
  box-shadow: none;
  transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.tab:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
  transform: none;
  box-shadow: none;
}
.tab[aria-selected="true"] {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.tab .tab-count {
  margin-left: 7px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 10.5px;
  color: var(--aegis-text-dim);
}
.tab[aria-selected="true"] .tab-count {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
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
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms ease,
              background 180ms ease,
              box-shadow 180ms ease;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  pointer-events: none;
}

.card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.grid { display: grid; gap: 14px; }
.metric-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.split { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); align-items: start; }

.metric {
  position: relative;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.metric:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 14px 32px 0 rgba(0, 0, 0, 0.75), inset 0 1px 0 0 rgba(255, 255, 255, 0.35);
}
.metric-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--aegis-text-dim);
  font-weight: 700;
}
.metric-value {
  font-size: 29px;
  font-weight: 700;
  line-height: 1.15;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  letter-spacing: -0.5px;
}
.metric-hint { font-size: 11.5px; color: var(--aegis-text-muted); margin-top: 4px; }

/* ------------------------------------------------------------ bar chart --- */

.bar-row {
  display: grid;
  grid-template-columns: 100px 1fr 44px;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}
.bar-name { font-size: 12px; color: var(--aegis-text-muted); }
.bar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}
.bar-value { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #ffffff; font-weight: 600; }

/* ----------------------------------------------------------------- ring --- */

.ring-wrap { display: flex; align-items: center; gap: 20px; }
.ring { flex: 0 0 84px; }
.ring-track { stroke: rgba(255, 255, 255, 0.09); }
.ring-value {
  font-size: 18px;
  font-weight: 700;
  fill: #ffffff;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
}

/* ---------------------------------------------------------------- table --- */

.table-scroll {
  max-height: 400px;
  overflow: auto;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
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
  padding: 10px 14px;
  background: rgba(20, 20, 24, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--aegis-text-dim);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 700;
  border-bottom: 1px solid var(--aegis-border);
  white-space: nowrap;
}
tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
  transition: background 120ms ease;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr.is-clickable { cursor: pointer; }
tbody tr.is-clickable:hover td { background: rgba(255, 255, 255, 0.08); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--aegis-font-mono); font-size: 11px; }
.dim { color: var(--aegis-text-dim); }
.accent { color: var(--aegis-primary); font-weight: 600; }

/* ------------------------------------------------------------ risk pill --- */

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.pill-low { background: rgba(48, 209, 88, 0.15); color: #30d158; border: 1px solid rgba(48, 209, 88, 0.35); }
.pill-moderate { background: rgba(255, 214, 10, 0.15); color: #ffd60a; border: 1px solid rgba(255, 214, 10, 0.35); }
.pill-elevated { background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border: 1px solid rgba(255, 159, 10, 0.35); }
.pill-high { background: rgba(255, 69, 58, 0.18); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.45); }

.verb {
  display: inline-block;
  min-width: 52px;
  text-align: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: var(--aegis-font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.verb-GET { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
.verb-POST { background: rgba(48, 209, 88, 0.15); color: #30d158; border: 1px solid rgba(48, 209, 88, 0.35); }
.verb-PUT { background: rgba(255, 214, 10, 0.15); color: #ffd60a; border: 1px solid rgba(255, 214, 10, 0.35); }
.verb-PATCH { background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border: 1px solid rgba(255, 159, 10, 0.35); }
.verb-DELETE { background: rgba(255, 69, 58, 0.18); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.4); }
.verb-ANY { background: rgba(192, 132, 252, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.35); }

.tag {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 3px 3px 0;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--aegis-border);
  font-family: var(--aegis-font-mono);
  font-size: 10.5px;
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
  padding: 7px 12px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #ffffff;
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
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  box-shadow: var(--aegis-glass-shadow);
  overflow: hidden;
}
.graph-canvas svg { width: 100%; height: 100%; display: block; cursor: grab; }
.graph-canvas svg.is-panning { cursor: grabbing; }

.edge { stroke: rgba(255, 255, 255, 0.14); stroke-width: 1.2; fill: none; transition: stroke 160ms ease; }
.edge.is-adjacent { stroke: #38bdf8; stroke-width: 2.2; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.7)); }
.edge.is-dimmed { stroke: rgba(255, 255, 255, 0.03); }

.node-dot { cursor: pointer; stroke: #000000; stroke-width: 1.6; transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1); }
.node-dot:hover { filter: drop-shadow(0 0 8px currentColor); }
.node-dot.is-selected { stroke: #ffffff; stroke-width: 2.6; filter: drop-shadow(0 0 14px #38bdf8); }
.node-dot.is-dimmed { opacity: 0.16; }
.node-label {
  font-size: 10px; font-weight: 500; fill: #d1d1d6; pointer-events: none;
  paint-order: stroke; stroke: #000000; stroke-width: 3px; stroke-linejoin: round;
}
.node-label.is-dimmed { opacity: 0.15; }

.graph-legend {
  position: absolute; bottom: 14px; left: 14px;
  display: flex; flex-wrap: wrap; gap: 12px;
  padding: 8px 14px; border-radius: var(--aegis-radius-sm);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: var(--aegis-glass-blur);
  -webkit-backdrop-filter: var(--aegis-glass-blur);
  border: 1px solid var(--aegis-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  font-size: 11px; color: var(--aegis-text-muted);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 9px; height: 9px; border-radius: 50%; }

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
  background: var(--aegis-bg-raised);
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
.stat-pair + .stat-pair { border-top: 1px solid rgba(255, 255, 255, 0.06); }
.stat-pair dt { color: var(--aegis-text-muted); }
.stat-pair dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 600; color: #ffffff; }

.factor { margin-bottom: 10px; }
.factor-head { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px; font-weight: 600; }
.factor-detail { font-size: 10.5px; color: var(--aegis-text-dim); margin-top: 3px; }

.relation-list { list-style: none; margin: 6px 0 0; padding: 0; max-height: 150px; overflow: auto; }
.relation-list li {
  padding: 4px 0; font-size: 11.5px;
  font-family: var(--aegis-font-mono);
  color: var(--aegis-text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
.empty-state h2 { font-size: 19px; margin: 0 0 8px; font-weight: 700; color: #ffffff; }
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
