/**
 * Dashboard stylesheet.
 *
 * Design intent: a deliberate dark AEGIS identity (deep slate surfaces, cyan
 * primary, amber/red risk accents) that still defers to the host editor for
 * typography, focus rings, and high-contrast preferences.
 *
 * Every `var(--vscode-*)` reference carries a fallback so the same markup can be
 * rendered outside VS Code for visual regression checks.
 */
export const DASHBOARD_STYLES = `
:root {
  /* AEGIS surfaces - intentionally dark regardless of host theme. */
  --aegis-bg: #0a0e14;
  --aegis-bg-raised: #111823;
  --aegis-bg-overlay: #16202e;
  --aegis-bg-hover: #1c2837;
  --aegis-border: #223044;
  --aegis-border-strong: #2e4056;

  --aegis-text: #e4ecf7;
  --aegis-text-muted: #8fa3bd;
  --aegis-text-dim: #64758d;

  --aegis-primary: #38bdf8;
  --aegis-primary-dim: #0e7490;

  /* Risk bands - hue plus lightness so they remain distinguishable
     for viewers with colour vision deficiency. */
  --aegis-low: #34d399;
  --aegis-moderate: #fbbf24;
  --aegis-elevated: #fb923c;
  --aegis-high: #f87171;

  --aegis-radius: 10px;
  --aegis-radius-sm: 6px;

  /* Typography follows the editor so the dashboard matches the user's setup. */
  --aegis-font: var(--vscode-font-family, "Segoe UI", system-ui, -apple-system, sans-serif);
  --aegis-font-mono: var(--vscode-editor-font-family, "SF Mono", Menlo, Consolas, monospace);
  --aegis-font-size: var(--vscode-font-size, 13px);
  --aegis-focus: var(--vscode-focusBorder, #38bdf8);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0;
  background: var(--aegis-bg);
  color: var(--aegis-text);
  font-family: var(--aegis-font);
  font-size: var(--aegis-font-size);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--aegis-primary); text-decoration: none; }
a:hover { text-decoration: underline; }

:focus-visible {
  outline: 2px solid var(--aegis-focus);
  outline-offset: 2px;
  border-radius: var(--aegis-radius-sm);
}

.layout { max-width: 1400px; margin: 0 auto; padding: 20px 24px 56px; }

/* ---------------------------------------------------------------- header --- */

.masthead {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--aegis-border);
}

.brand-row { display: flex; align-items: center; gap: 12px; }

.brand-mark {
  width: 34px; height: 34px;
  flex: 0 0 34px;
  border-radius: 9px;
  background: linear-gradient(140deg, var(--aegis-primary), var(--aegis-primary-dim));
  display: grid; place-items: center;
  font-weight: 700; font-size: 15px; color: #06202b;
  letter-spacing: -0.5px;
}

h1 { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.2px; }

.project-path {
  margin: 3px 0 0;
  font-family: var(--aegis-font-mono);
  font-size: 11.5px;
  color: var(--aegis-text-dim);
  word-break: break-all;
}

.badge-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 11px; }

.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--aegis-border-strong);
  background: var(--aegis-bg-overlay);
  font-size: 11px;
  color: var(--aegis-text-muted);
  white-space: nowrap;
}
.badge strong { color: var(--aegis-text); font-weight: 600; }
.badge.is-warn { border-color: #7c5312; background: #2a1f08; color: var(--aegis-moderate); }
.badge.is-error { border-color: #7f2a2a; background: #2a1212; color: var(--aegis-high); }
.badge.is-ok { border-color: #1c6148; background: #0c241c; color: var(--aegis-low); }

.action-row { display: flex; flex-wrap: wrap; gap: 8px; }

button {
  font-family: inherit;
  font-size: 12px;
  padding: 6px 13px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid var(--aegis-border-strong);
  background: var(--aegis-bg-overlay);
  color: var(--aegis-text);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
button:hover { background: var(--aegis-bg-hover); border-color: var(--aegis-primary-dim); }
button.primary {
  background: var(--aegis-primary);
  border-color: var(--aegis-primary);
  color: #04202b;
  font-weight: 600;
}
button.primary:hover { background: #5cc9fa; }

/* ------------------------------------------------------------- callouts --- */

.callout {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: var(--aegis-radius);
  border: 1px solid var(--aegis-border-strong);
  border-left: 3px solid var(--aegis-primary);
  background: var(--aegis-bg-raised);
  font-size: 12.5px;
}
.callout.is-warn { border-left-color: var(--aegis-moderate); }
.callout.is-error { border-left-color: var(--aegis-high); }
.callout-title { font-weight: 650; margin-bottom: 3px; }
.callout-body { color: var(--aegis-text-muted); }

/* ----------------------------------------------------------------- tabs --- */

.tabs {
  display: flex; gap: 2px;
  margin: 20px 0 0;
  border-bottom: 1px solid var(--aegis-border);
}

.tab {
  padding: 9px 15px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: none;
  color: var(--aegis-text-muted);
  font-size: 12.5px;
  font-weight: 550;
}
.tab:hover { background: var(--aegis-bg-raised); border-color: transparent; color: var(--aegis-text); }
.tab[aria-selected="true"] { color: var(--aegis-primary); border-bottom-color: var(--aegis-primary); }
.tab .tab-count {
  margin-left: 6px; padding: 1px 6px;
  border-radius: 999px;
  background: var(--aegis-bg-overlay);
  font-size: 10.5px; color: var(--aegis-text-dim);
}

.panel { display: none; padding-top: 22px; }
.panel.is-active { display: block; }

/* ---------------------------------------------------------------- cards --- */

.section-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--aegis-text-dim);
}

.card {
  background: var(--aegis-bg-raised);
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  padding: 16px;
}

.grid { display: grid; gap: 12px; }
.metric-grid { grid-template-columns: repeat(auto-fit, minmax(146px, 1fr)); }
.split { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); align-items: start; }

.metric { position: relative; overflow: hidden; }
.metric-label {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px;
  color: var(--aegis-text-dim); font-weight: 600;
}
.metric-value {
  font-size: 27px; font-weight: 660; line-height: 1.15; margin-top: 5px;
  font-variant-numeric: tabular-nums;
}
.metric-hint { font-size: 11px; color: var(--aegis-text-muted); margin-top: 3px; }

/* ------------------------------------------------------------ bar chart --- */

.bar-row { display: grid; grid-template-columns: 92px 1fr 42px; gap: 10px; align-items: center; margin-bottom: 7px; }
.bar-name { font-size: 11.5px; color: var(--aegis-text-muted); }
.bar-track { height: 7px; border-radius: 4px; background: var(--aegis-bg-overlay); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; background: var(--aegis-primary); }
.bar-value { font-size: 11.5px; text-align: right; font-variant-numeric: tabular-nums; color: var(--aegis-text); }

/* ----------------------------------------------------------------- ring --- */

.ring-wrap { display: flex; align-items: center; gap: 16px; }
.ring { flex: 0 0 78px; }
.ring-track { stroke: var(--aegis-bg-overlay); }
.ring-value { font-size: 17px; font-weight: 660; fill: var(--aegis-text); }

/* ---------------------------------------------------------------- table --- */

.table-scroll { max-height: 380px; overflow: auto; border-radius: var(--aegis-radius-sm); }

table { width: 100%; border-collapse: collapse; font-size: 12px; }
thead th {
  position: sticky; top: 0; z-index: 1;
  text-align: left; padding: 8px 10px;
  background: var(--aegis-bg-overlay);
  color: var(--aegis-text-dim);
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 650;
  border-bottom: 1px solid var(--aegis-border);
  white-space: nowrap;
}
tbody td { padding: 7px 10px; border-bottom: 1px solid var(--aegis-border); vertical-align: top; }
tbody tr:last-child td { border-bottom: none; }
tbody tr.is-clickable { cursor: pointer; }
tbody tr.is-clickable:hover { background: var(--aegis-bg-hover); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--aegis-font-mono); font-size: 11px; }
.dim { color: var(--aegis-text-dim); }

/* ------------------------------------------------------------ risk pill --- */

.pill {
  display: inline-block; padding: 1px 8px; border-radius: 999px;
  font-size: 10.5px; font-weight: 650; white-space: nowrap;
}
.pill-low { background: #0c241c; color: var(--aegis-low); border: 1px solid #1c6148; }
.pill-moderate { background: #2a1f08; color: var(--aegis-moderate); border: 1px solid #7c5312; }
.pill-elevated { background: #2b1a0b; color: var(--aegis-elevated); border: 1px solid #85451a; }
.pill-high { background: #2a1212; color: var(--aegis-high); border: 1px solid #7f2a2a; }

.verb {
  display: inline-block; min-width: 48px; text-align: center;
  padding: 1px 6px; border-radius: 4px;
  font-family: var(--aegis-font-mono); font-size: 10px; font-weight: 700;
}
.verb-GET { background: #0c2436; color: #7dd3fc; }
.verb-POST { background: #0c2a1e; color: #6ee7b7; }
.verb-PUT { background: #2a2109; color: #fcd34d; }
.verb-PATCH { background: #2b1a0b; color: #fdba74; }
.verb-DELETE { background: #2a1212; color: #fca5a5; }
.verb-ANY { background: #1e2334; color: #c4b5fd; }

.tag {
  display: inline-block; padding: 1px 6px; margin: 0 3px 3px 0;
  border-radius: 4px; background: var(--aegis-bg-overlay);
  border: 1px solid var(--aegis-border);
  font-family: var(--aegis-font-mono); font-size: 10px; color: var(--aegis-text-muted);
}

/* ---------------------------------------------------------------- graph --- */

.graph-shell { display: grid; grid-template-columns: 1fr 306px; gap: 12px; align-items: start; }
@media (max-width: 1020px) { .graph-shell { grid-template-columns: 1fr; } }

.graph-toolbar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  margin-bottom: 10px;
}

input[type="search"], select {
  font-family: inherit; font-size: 12px;
  padding: 5px 9px;
  border-radius: var(--aegis-radius-sm);
  border: 1px solid var(--aegis-border-strong);
  background: var(--aegis-bg);
  color: var(--aegis-text);
}
input[type="search"] { min-width: 190px; }
input[type="search"]::placeholder { color: var(--aegis-text-dim); }

.graph-canvas {
  position: relative;
  height: 560px;
  border: 1px solid var(--aegis-border);
  border-radius: var(--aegis-radius);
  background:
    radial-gradient(circle at 30% 20%, #101a27 0%, transparent 55%),
    var(--aegis-bg-raised);
  overflow: hidden;
}
.graph-canvas svg { width: 100%; height: 100%; display: block; cursor: grab; }
.graph-canvas svg.is-panning { cursor: grabbing; }

.edge { stroke: #2c3d54; stroke-width: 1; fill: none; }
.edge.is-adjacent { stroke: var(--aegis-primary); stroke-width: 1.7; }
.edge.is-dimmed { stroke: #1b2635; }

.node-dot { cursor: pointer; stroke: #0a0e14; stroke-width: 1.4; transition: opacity 120ms ease; }
.node-dot.is-selected { stroke: #ffffff; stroke-width: 2.2; }
.node-dot.is-dimmed { opacity: 0.22; }
.node-label {
  font-size: 9.5px; fill: var(--aegis-text-muted); pointer-events: none;
  paint-order: stroke; stroke: #0a0e14; stroke-width: 2.5px; stroke-linejoin: round;
}
.node-label.is-dimmed { opacity: 0.2; }

.graph-legend {
  position: absolute; bottom: 10px; left: 12px;
  display: flex; flex-wrap: wrap; gap: 10px;
  padding: 7px 10px; border-radius: var(--aegis-radius-sm);
  background: rgba(10, 14, 20, 0.88);
  border: 1px solid var(--aegis-border);
  font-size: 10.5px; color: var(--aegis-text-muted);
}
.legend-item { display: flex; align-items: center; gap: 5px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }

.graph-empty {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  text-align: center; padding: 30px;
  color: var(--aegis-text-muted); font-size: 12.5px;
}

.graph-match-count {
  margin-left: auto; white-space: nowrap;
  font-size: 11px; color: var(--aegis-text-muted);
}
.graph-match-count.is-empty { color: var(--aegis-moderate); }

/* ------------------------------------------------------------- inspector -- */

.inspector { position: sticky; top: 12px; }
.inspector-empty { color: var(--aegis-text-dim); font-size: 12px; }
.inspector h3 { margin: 0; font-size: 14px; font-weight: 650; word-break: break-word; }
.inspector .qualified {
  font-family: var(--aegis-font-mono); font-size: 10.5px;
  color: var(--aegis-text-dim); word-break: break-all; margin: 2px 0 12px;
}

.stat-pair { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; font-size: 12px; }
.stat-pair + .stat-pair { border-top: 1px solid var(--aegis-border); }
.stat-pair dt { color: var(--aegis-text-muted); }
.stat-pair dd { margin: 0; font-variant-numeric: tabular-nums; }

.factor { margin-bottom: 9px; }
.factor-head { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px; }
.factor-detail { font-size: 10.5px; color: var(--aegis-text-dim); margin-top: 2px; }

.relation-list { list-style: none; margin: 6px 0 0; padding: 0; max-height: 150px; overflow: auto; }
.relation-list li {
  padding: 3px 0; font-size: 11.5px;
  font-family: var(--aegis-font-mono);
  color: var(--aegis-text-muted);
  border-bottom: 1px solid var(--aegis-border);
  cursor: pointer;
}
.relation-list li:hover { color: var(--aegis-primary); }

hr.divider { border: none; border-top: 1px solid var(--aegis-border); margin: 14px 0; }

.subhead {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px;
  color: var(--aegis-text-dim); font-weight: 650; margin: 0 0 5px;
}

.empty-state { text-align: center; padding: 44px 20px; color: var(--aegis-text-muted); }
.empty-state h2 { font-size: 16px; margin: 0 0 7px; color: var(--aegis-text); }
.empty-state p { margin: 0 auto 16px; max-width: 480px; font-size: 12.5px; }

.footnote { font-size: 11px; color: var(--aegis-text-dim); margin-top: 10px; }

/* Respect the editor's high-contrast themes by strengthening every border. */
@media (prefers-contrast: more) {
  :root { --aegis-border: #4a5f7a; --aegis-border-strong: #6b83a3; --aegis-text-muted: #b9c9dd; }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
`;
