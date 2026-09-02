import type { DashboardState } from "../model/dashboardModel";
import { GRAPH_RENDER_LIMIT } from "../model/graph";
import type { ArchitectureLayer } from "../model/insights";
import { DASHBOARD_SCRIPT } from "./dashboardScript";
import { DASHBOARD_STYLES } from "./dashboardStyles";

/**
 * Renders the dashboard webview markup.
 *
 * The model is serialized into the page for the graph script; everything else is
 * server-rendered here so the dashboard shows useful content even before the
 * script runs.
 */

export interface RenderOptions {
  readonly nonce: string;
  readonly cspSource: string;
  /**
   * Which panel opens selected. Rendered into the markup rather than requested
   * over a message afterwards: `webview.html = ...` reloads the document, and a
   * message posted into a document that has not finished loading is dropped, so
   * "Show Impact Graph" would intermittently land on Overview instead.
   */
  readonly activeTab?: DashboardTab;
}

/** The dashboard's three panels. Declared here so tests can name them without loading `vscode`. */
export type DashboardTab = "overview" | "graph" | "spring";


const LAYER_LABELS: Readonly<Record<ArchitectureLayer, string>> = {
  bootstrap: "Bootstrap",
  web: "Web",
  service: "Service",
  persistence: "Persistence",
  config: "Configuration",
  "cross-cutting": "Cross-cutting"
};

const LAYER_COLORS: Readonly<Record<ArchitectureLayer, string>> = {
  bootstrap: "#c084fc",
  web: "#38bdf8",
  service: "#34d399",
  persistence: "#fbbf24",
  config: "#fb923c",
  "cross-cutting": "#94a3b8"
};

export function renderDashboardHtml(state: DashboardState, options: RenderOptions): string {
  const activeTab = options.activeTab ?? "overview";
  const body = state.kind === "empty" ? renderEmptyState(state) : renderPopulated(state, activeTab);
  const modelJson = state.kind === "populated" ? serializeModel(state) : "null";

  // `unsafe-inline` is deliberately absent: styles and scripts are nonce-gated,
  // and no remote origin is allowed at all.
  const csp = [
    "default-src 'none'",
    `img-src ${options.cspSource} data:`,
    `style-src 'nonce-${options.nonce}'`,
    `script-src 'nonce-${options.nonce}'`,
    "font-src " + options.cspSource
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AEGIS Dashboard</title>
<style nonce="${options.nonce}">${DASHBOARD_STYLES}</style>
</head>
<body>
<div class="layout">${body}</div>
<script nonce="${options.nonce}">window.__AEGIS_MODEL__ = ${modelJson};</script>
<script nonce="${options.nonce}">${DASHBOARD_SCRIPT}</script>
</body>
</html>`;
}

/**
 * Serializes only the fields the client script reads.
 *
 * Trimming the payload matters: a large project's full parsed model is megabytes
 * of JSON, most of which the graph never touches.
 */
function serializeModel(state: Extract<DashboardState, { kind: "populated" }>): string {
  const payload = {
    graph: {
      nodes: state.graph.nodes.map((node) => ({
        id: node.id,
        simpleName: node.simpleName,
        packageName: node.packageName,
        kind: node.kind,
        layer: node.layer,
        stereotypeLabel: node.stereotypeLabel,
        sourcePath: node.sourcePath,
        sourceRange: { beginLine: node.sourceRange.beginLine },
        methodCount: node.methodCount,
        fieldCount: node.fieldCount,
        fanIn: node.fanIn,
        fanOut: node.fanOut,
        impactReach: node.impactReach,
        risk: { score: node.risk.score, band: node.risk.band, factors: node.risk.factors }
      })),
      edges: state.graph.edges.map((edge) => ({ from: edge.from, to: edge.to, kinds: edge.kinds }))
    }
  };

  // `</script>` inside a JSON string would terminate the script block early.
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/* --------------------------------------------------------------- empty state */

function renderEmptyState(state: Extract<DashboardState, { kind: "empty" }>): string {
  const diagnostics =
    state.diagnostics.length > 0
      ? `<div class="card" style="margin-top:18px;text-align:left">
           <p class="section-title">Diagnostics</p>
           ${renderDiagnosticList(state.diagnostics)}
         </div>`
      : "";

  return `
${renderMasthead("AEGIS", state.projectPath ?? "No project analyzed", [], true)}
<div class="empty-state">
  <h2>${state.outcome === "idle" ? "No analysis yet" : "Analysis produced no project data"}</h2>
  <p>${escapeHtml(state.statusMessage)}</p>
  <div class="action-row" style="justify-content:center">
    <button class="primary" data-command="aegis.analyzeProject">Analyze project</button>
    <button data-command="aegis.showLogs">Open logs</button>
  </div>
  ${diagnostics}
</div>`;
}

/* ----------------------------------------------------------------- populated */

function renderPopulated(
  state: Extract<DashboardState, { kind: "populated" }>,
  activeTab: DashboardTab
): string {
  const badges = [
    { label: "Build", value: buildToolLabel(state.buildTool), tone: toneForBuildTool(state.buildTool) },
    { label: "Types", value: String(state.metrics.typeCount), tone: "" },
    { label: "Parse health", value: `${state.health.parseSuccessRate}%`, tone: state.health.parseSuccessRate === 100 ? "is-ok" : "is-warn" },
    { label: "Analyzed in", value: `${state.durationMs} ms`, tone: "" }
  ];

  if (state.javaVersion) {
    badges.push({ label: "Java", value: shortenJavaVersion(state.javaVersion), tone: "" });
  }

  return `
${renderMasthead(state.projectName, state.projectPath, badges, false)}
${renderSourceCallout(state)}
${renderTabs(state, activeTab)}
${renderOverviewPanel(state, activeTab)}
${renderGraphPanel(state, activeTab)}
${renderSpringPanel(state, activeTab)}`;
}

/**
 * Opening tag for a tab panel.
 *
 * Centralised so the panel that carries `is-active` and the tab that carries
 * `aria-selected="true"` are decided from the same value; they were previously
 * both hardcoded to Overview.
 */
function panelTag(panel: DashboardTab, activeTab: DashboardTab): string {
  const active = panel === activeTab ? " is-active" : "";
  return `<section class="panel${active}" data-panel="${panel}" role="tabpanel">`;
}

function renderMasthead(
  title: string,
  path: string,
  badges: readonly { label: string; value: string; tone: string }[],
  minimal: boolean
): string {
  const badgeMarkup = badges
    .map(
      (badge) =>
        `<span class="badge ${badge.tone}">${escapeHtml(badge.label)} <strong>${escapeHtml(badge.value)}</strong></span>`
    )
    .join("");

  const actions = minimal
    ? ""
    : `<div class="action-row">
         <button class="primary" data-command="aegis.analyzeProject">Re-analyze</button>
         <button data-command="aegis.exportAnalysis">Export JSON</button>
         <button data-command="aegis.showLogs">Logs</button>
       </div>`;

  return `
<header class="masthead">
  <div>
    <div class="brand-row">
      <div class="brand-mark" aria-hidden="true">AE</div>
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="project-path">${escapeHtml(path)}</p>
      </div>
    </div>
    <div class="badge-row">${badgeMarkup}</div>
  </div>
  ${actions}
</header>`;
}

/** Sample-data and error states get an unmissable banner so data is never mistaken for real. */
function renderSourceCallout(state: Extract<DashboardState, { kind: "populated" }>): string {
  if (state.source === "sample") {
    return `
<div class="callout is-warn">
  <div class="callout-title">Showing bundled sample data</div>
  <div class="callout-body">${escapeHtml(state.statusMessage)} Build the analyzer with <span class="mono">mvn package</span> in <span class="mono">analyzer-engine/</span>, then re-analyze to see your own project.</div>
</div>`;
  }

  if (state.outcome === "error") {
    return `
<div class="callout is-error">
  <div class="callout-title">The analyzer reported an error</div>
  <div class="callout-body">${escapeHtml(state.statusMessage)}</div>
</div>`;
  }

  return "";
}

function renderTabs(
  state: Extract<DashboardState, { kind: "populated" }>,
  activeTab: DashboardTab
): string {
  const springCount = state.spring.components.length;
  const tab = (name: DashboardTab, label: string, count?: number): string =>
    `<button class="tab" role="tab" data-tab="${name}" aria-selected="${name === activeTab}">${label}${
      count === undefined ? "" : `<span class="tab-count">${count}</span>`
    }</button>`;

  return `
<div class="tabs" role="tablist">
  ${tab("overview", "Overview")}
  ${tab("graph", "Impact graph", state.graph.nodes.length)}
  ${tab("spring", "Spring", springCount)}
</div>`;
}

/* -------------------------------------------------------------------- overview */

function renderOverviewPanel(
  state: Extract<DashboardState, { kind: "populated" }>,
  activeTab: DashboardTab
): string {
  const { metrics, health, graph } = state;

  const metricCards = [
    { label: "Source files", value: metrics.fileCount, hint: `${state.sourceRoots.length} source root(s)` },
    { label: "Types", value: metrics.typeCount, hint: `${metrics.packageCount} package(s)` },
    { label: "Methods", value: metrics.methodCount, hint: `${metrics.averageMethodsPerType} avg per type` },
    { label: "Fields", value: metrics.fieldCount, hint: `${metrics.averageFieldsPerType} avg per type` },
    { label: "Imports", value: metrics.importCount, hint: "declared across all files" },
    { label: "Dependencies", value: graph.edges.length, hint: `${graph.isolatedCount} isolated type(s)` }
  ]
    .map(
      (card) => `
<div class="card metric">
  <div class="metric-label">${escapeHtml(card.label)}</div>
  <div class="metric-value">${formatNumber(card.value)}</div>
  <div class="metric-hint">${escapeHtml(card.hint)}</div>
</div>`
    )
    .join("");

  const maxKind = Math.max(1, ...metrics.kindBreakdown.map((entry) => entry.count));
  const kindBars = metrics.kindBreakdown
    .map((entry) =>
      renderBar(titleCase(entry.kind), entry.count, Math.round((entry.count / maxKind) * 100))
    )
    .join("");

  const largest = metrics.largestType
    ? `<div class="footnote">Largest type: <strong>${escapeHtml(metrics.largestType.name)}</strong> with ${metrics.largestType.memberCount} members.</div>`
    : "";

  return `
${panelTag("overview", activeTab)}

  <p class="section-title">Project metrics</p>
  <div class="grid metric-grid">${metricCards}</div>

  <div class="grid split" style="margin-top:22px">
    <div class="card">
      <p class="section-title">Type composition</p>
      ${kindBars || '<p class="dim">No types parsed.</p>'}
      ${largest}
    </div>

    <div class="card">
      <p class="section-title">Analysis health</p>
      <div class="ring-wrap">
        ${renderRing(health.parseSuccessRate)}
        <div style="flex:1">
          <div class="stat-pair"><dt>Files parsed cleanly</dt><dd>${metrics.fileCount - health.filesWithParseErrors} / ${metrics.fileCount}</dd></div>
          <div class="stat-pair"><dt>Errors</dt><dd>${health.errorCount}</dd></div>
          <div class="stat-pair"><dt>Warnings</dt><dd>${health.warningCount}</dd></div>
        </div>
      </div>
      <hr class="divider" />
      <p class="subhead">Architecture signals</p>
      <div class="stat-pair"><dt>Dependency cycles</dt><dd>${graph.cycles.length}</dd></div>
      <div class="stat-pair"><dt>Layering violations</dt><dd>${graph.layeringViolations.length}</dd></div>
      <div class="stat-pair"><dt>Ambiguous references skipped</dt><dd>${graph.ambiguousReferenceCount}</dd></div>
    </div>
  </div>

  <div class="grid split" style="margin-top:22px">
    <div class="card">
      <p class="section-title">Highest refactoring risk</p>
      ${renderRiskTable(state)}
      <div class="footnote">Scores are relative to this project only. Click a row to focus it in the impact graph.</div>
    </div>

    <div class="card">
      <p class="section-title">Packages</p>
      ${renderPackageTable(state)}
    </div>
  </div>

  <div class="card" style="margin-top:22px">
    <p class="section-title">Analyzer diagnostics</p>
    ${renderDiagnosticList(health.diagnostics)}
  </div>

  ${renderProvenanceFootnote(state)}
</section>`;
}

function renderRiskTable(state: Extract<DashboardState, { kind: "populated" }>): string {
  const rows = state.graph.nodes.slice(0, 12);
  if (rows.length === 0) {
    return '<p class="dim">No types available.</p>';
  }

  return `
<div class="table-scroll">
<table>
  <thead><tr><th>Type</th><th>Role</th><th class="num">Dependents</th><th class="num">Impact</th><th class="num">Risk</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (node) => `
    <tr class="is-clickable" data-focus-type="${escapeAttribute(node.id)}" title="${escapeAttribute(node.id)}">
      <td><strong>${escapeHtml(node.simpleName)}</strong><div class="mono dim">${escapeHtml(node.packageName || "(default)")}</div></td>
      <td>${escapeHtml(node.stereotypeLabel ?? titleCase(node.kind))}</td>
      <td class="num">${node.fanIn}</td>
      <td class="num">${node.impactReach}</td>
      <td class="num"><span class="pill pill-${node.risk.band}">${node.risk.score}</span></td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>
</div>`;
}

function renderPackageTable(state: Extract<DashboardState, { kind: "populated" }>): string {
  const rows = state.graph.packages.slice(0, 14);
  if (rows.length === 0) {
    return '<p class="dim">No packages detected.</p>';
  }

  return `
<div class="table-scroll">
<table>
  <thead><tr><th>Package</th><th class="num">Types</th><th class="num">Methods</th><th class="num">Avg risk</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (entry) => `
    <tr>
      <td class="mono">${escapeHtml(entry.packageName)}</td>
      <td class="num">${entry.typeCount}</td>
      <td class="num">${entry.methodCount}</td>
      <td class="num">${entry.averageRisk}</td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>
</div>`;
}

/* ----------------------------------------------------------------------- graph */

function renderGraphPanel(
  state: Extract<DashboardState, { kind: "populated" }>,
  activeTab: DashboardTab
): string {
  const truncated = state.graph.nodes.length > GRAPH_RENDER_LIMIT;

  /*
   * Decided here rather than left to the client script to hide after layout.
   * A placeholder that says "no dependencies" on a project that has 74 of them
   * is wrong for as long as it is on screen, and stays wrong permanently if the
   * script ever fails to run.
   */
  const hasGraph = state.graph.nodes.length > 0;
  const emptyNotice = hasGraph
    ? ""
    : `<div class="graph-empty" id="graph-empty">${
        state.metrics.typeCount === 0
          ? "No types were parsed, so there is nothing to graph yet."
          : "No dependencies were derived between the parsed types."
      }</div>`;

  const layerOptions = (Object.keys(LAYER_LABELS) as ArchitectureLayer[])
    .map((layer) => `<option value="${layer}">${LAYER_LABELS[layer]}</option>`)
    .join("");

  const legend = (Object.keys(LAYER_LABELS) as ArchitectureLayer[])
    .map(
      (layer) =>
        `<span class="legend-item"><span class="legend-dot" style="background:${LAYER_COLORS[layer]}"></span>${LAYER_LABELS[layer]}</span>`
    )
    .join("");

  return `
${panelTag("graph", activeTab)}
  <div class="graph-toolbar">
    <input type="search" id="graph-search" placeholder="Filter by type name..." aria-label="Filter graph by type name" />
    <select id="graph-layer" aria-label="Filter by layer"><option value="all">All layers</option>${layerOptions}</select>
    <select id="graph-risk" aria-label="Filter by risk band">
      <option value="all">All risk bands</option>
      <option value="high">High</option>
      <option value="elevated">Elevated</option>
      <option value="moderate">Moderate</option>
      <option value="low">Low</option>
    </select>
    <button id="graph-reset">Reset view</button>
    <span class="graph-match-count" id="graph-match-count" role="status" aria-live="polite"></span>
  </div>

  <div class="graph-shell">
    <div>
      <div class="graph-canvas">
        <svg id="graph-svg" role="img" aria-label="Dependency graph of project types">
          <g id="graph-viewport">
            <g id="graph-edges"></g>
            <g id="graph-nodes"></g>
            <g id="graph-labels"></g>
          </g>
        </svg>
        <div class="graph-legend">${legend}</div>
        ${emptyNotice}
      </div>
      <div class="footnote">
        Scroll to zoom, drag the background to pan, drag a node to reposition, click to inspect, double-click to open the source.
        ${truncated ? `Showing the ${GRAPH_RENDER_LIMIT} highest-risk types of ${state.graph.nodes.length}.` : ""}
      </div>
      ${renderRelationshipProvenance(state)}
    </div>

    <aside class="card inspector">
      <p class="section-title">Inspector</p>
      <div id="inspector-body"></div>
    </aside>
  </div>

  ${renderCyclesAndViolations(state)}
</section>`;
}

/**
 * States plainly how edges were inferred. The analyzer has no symbol resolution
 * yet, so presenting the graph as authoritative would overstate it.
 */
function renderRelationshipProvenance(
  state: Extract<DashboardState, { kind: "populated" }>
): string {
  return `
<div class="callout" style="margin-top:14px">
  <div class="callout-title">How these relationships were derived</div>
  <div class="callout-body">
    Edges are derived from superclasses (<span class="mono">extends</span>), implemented interfaces (<span class="mono">implements</span>),
    field types, method signatures, and project-internal imports (${formatNumber(state.graph.edges.length)} edge(s) across ${formatNumber(state.graph.nodes.length)} type(s)).
    ${state.graph.ambiguousReferenceCount} ambiguous reference(s) were skipped rather than guessed.
  </div>
</div>`;
}

function renderCyclesAndViolations(state: Extract<DashboardState, { kind: "populated" }>): string {
  const { cycles, layeringViolations } = state.graph;
  if (cycles.length === 0 && layeringViolations.length === 0) {
    return "";
  }

  const cycleMarkup =
    cycles.length === 0
      ? '<p class="dim">No circular dependencies detected.</p>'
      : cycles
          .slice(0, 8)
          .map(
            (cycle) =>
              `<div style="margin-bottom:8px"><span class="pill pill-elevated">${cycle.members.length} types</span>
               <div class="mono dim" style="margin-top:3px">${cycle.members.map(shortName).map(escapeHtml).join(" → ")}</div></div>`
          )
          .join("");

  const violationMarkup =
    layeringViolations.length === 0
      ? '<p class="dim">No layering violations detected.</p>'
      : layeringViolations
          .slice(0, 10)
          .map(
            (violation) => `
<div style="margin-bottom:9px">
  <div class="mono">${escapeHtml(shortName(violation.from))} → ${escapeHtml(shortName(violation.to))}</div>
  <div class="footnote" style="margin-top:1px">${escapeHtml(violation.rule)}</div>
</div>`
          )
          .join("");

  return `
<div class="grid split" style="margin-top:22px">
  <div class="card">
    <p class="section-title">Circular dependencies</p>
    ${cycleMarkup}
  </div>
  <div class="card">
    <p class="section-title">Layering violations</p>
    ${violationMarkup}
  </div>
</div>`;
}

/* ---------------------------------------------------------------------- spring */

function renderSpringPanel(
  state: Extract<DashboardState, { kind: "populated" }>,
  activeTab: DashboardTab
): string {
  const { spring } = state;

  if (!spring.isSpringProject) {
    return `
${panelTag("spring", activeTab)}
  <div class="empty-state">
    <h2>No Spring components detected</h2>
    <p>AEGIS found no Spring stereotype annotations such as <span class="mono">@Service</span>, <span class="mono">@RestController</span>, or <span class="mono">@Repository</span> in this project. The overview and impact graph still apply to any Java codebase.</p>
  </div>
</section>`;
  }

  const stereotypeCards = Object.entries(spring.countsByStereotype)
    .sort((left, right) => right[1] - left[1])
    .map(
      ([stereotype, count]) => `
<div class="card metric">
  <div class="metric-label">${escapeHtml(titleCase(stereotype))}</div>
  <div class="metric-value">${count}</div>
</div>`
    )
    .join("");

  const maxAnnotation = Math.max(1, ...spring.topAnnotations.map((entry) => entry.count));
  const annotationBars = spring.topAnnotations
    .map((entry) =>
      renderBar(
        `@${entry.annotation}`,
        entry.count,
        Math.round((entry.count / maxAnnotation) * 100)
      )
    )
    .join("");

  return `
${panelTag("spring", activeTab)}

  <p class="section-title">Spring stereotypes</p>
  <div class="grid metric-grid">${stereotypeCards}</div>

  <div class="grid split" style="margin-top:22px">
    <div class="card">
      <p class="section-title">HTTP endpoints (${spring.endpoints.length})</p>
      ${renderEndpointTable(state)}
    </div>
    <div class="card">
      <p class="section-title">Annotation usage</p>
      ${annotationBars || '<p class="dim">No annotations detected.</p>'}
      <hr class="divider" />
      <div class="stat-pair"><dt>Transactional methods</dt><dd>${spring.transactionalMethodCount}</dd></div>
      <div class="stat-pair"><dt>Scheduled methods</dt><dd>${spring.scheduledMethodCount}</dd></div>
      <div class="stat-pair"><dt>@Bean factory methods</dt><dd>${spring.beanFactoryMethodCount}</dd></div>
    </div>
  </div>

  <div class="card" style="margin-top:22px">
    <p class="section-title">Components by layer</p>
    ${renderComponentTable(state)}
  </div>
</section>`;
}

function renderEndpointTable(state: Extract<DashboardState, { kind: "populated" }>): string {
  const { endpoints, endpointPathsUnavailable } = state.spring;

  if (endpoints.length === 0) {
    return '<p class="dim">No request-mapping annotations found on web-layer classes.</p>';
  }

  const hasAnyPath = endpoints.some((e) => e.path !== undefined);

  const note = endpointPathsUnavailable
    ? `<div class="callout is-warn" style="margin-top:12px">
         <div class="callout-title">URL paths are not available</div>
         <div class="callout-body">The analyzer records annotation names but not their arguments, so <span class="mono">@GetMapping("/api/owners")</span> yields the verb but not the path. Capturing annotation members in the Java parser would complete this table.</div>
       </div>`
    : "";

  return `
<div class="table-scroll">
<table>
  <thead><tr><th>Verb</th>${hasAnyPath ? "<th>Path</th>" : ""}<th>Handler</th><th>Controller</th><th>Returns</th></tr></thead>
  <tbody>
    ${endpoints
      .map(
        (endpoint) => `
    <tr class="is-clickable" data-open-path="${escapeAttribute(endpoint.sourcePath)}" data-open-line="${endpoint.sourceRange.beginLine}">
      <td><span class="verb verb-${endpoint.httpMethod}">${endpoint.httpMethod}</span></td>
      ${hasAnyPath ? `<td class="mono ${endpoint.path ? "accent" : "dim"}">${endpoint.path ? escapeHtml(endpoint.path) : "—"}</td>` : ""}
      <td class="mono">${escapeHtml(endpoint.methodName)}(${escapeHtml(endpoint.parameters.join(", "))})</td>
      <td>${escapeHtml(endpoint.controllerSimpleName)}</td>
      <td class="mono dim">${escapeHtml(endpoint.returnType)}</td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>
</div>
${note}`;
}

function renderComponentTable(state: Extract<DashboardState, { kind: "populated" }>): string {
  const components = state.spring.components;
  const riskById = new Map(state.graph.nodes.map((node) => [node.id, node.risk]));

  return `
<div class="table-scroll">
<table>
  <thead><tr><th>Component</th><th>Stereotype</th><th>Layer</th><th class="num">Methods</th><th class="num">Risk</th><th>Annotations</th></tr></thead>
  <tbody>
    ${components
      .map((component) => {
        const risk = riskById.get(component.qualifiedName);
        const heuristic =
          component.detectedVia === "naming"
            ? ' <span class="badge is-warn" title="Inferred from the type name, not an annotation">naming</span>'
            : "";
        return `
    <tr class="is-clickable" data-open-path="${escapeAttribute(component.sourcePath)}" data-open-line="${component.sourceRange.beginLine}">
      <td><strong>${escapeHtml(component.simpleName)}</strong>${heuristic}<div class="mono dim">${escapeHtml(component.packageName || "(default)")}</div></td>
      <td>${escapeHtml(component.stereotypeLabel)}</td>
      <td><span class="legend-dot" style="display:inline-block;background:${LAYER_COLORS[component.layer]}"></span> ${LAYER_LABELS[component.layer]}</td>
      <td class="num">${component.methodCount}</td>
      <td class="num">${risk ? `<span class="pill pill-${risk.band}">${risk.score}</span>` : "&ndash;"}</td>
      <td>${component.annotations.slice(0, 4).map((annotation) => `<span class="tag">@${escapeHtml(annotation)}</span>`).join("")}</td>
    </tr>`;
      })
      .join("")}
  </tbody>
</table>
</div>`;
}

/* --------------------------------------------------------------- small pieces */

function renderBar(name: string, value: number, percent: number): string {
  return `
<div class="bar-row">
  <span class="bar-name" title="${escapeAttribute(name)}">${escapeHtml(name)}</span>
  <span class="bar-track"><span class="bar-fill" style="width:${Math.max(2, percent)}%"></span></span>
  <span class="bar-value">${formatNumber(value)}</span>
</div>`;
}

function renderRing(percent: number): string {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  const color = percent === 100 ? "#34d399" : percent >= 80 ? "#fbbf24" : "#f87171";

  return `
<svg class="ring" viewBox="0 0 78 78" width="78" height="78" role="img" aria-label="${percent}% of files parsed cleanly">
  <circle class="ring-track" cx="39" cy="39" r="${radius}" fill="none" stroke-width="7" />
  <circle cx="39" cy="39" r="${radius}" fill="none" stroke="${color}" stroke-width="7"
          stroke-linecap="round" stroke-dasharray="${circumference.toFixed(1)}"
          stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 39 39)" />
  <text class="ring-value" x="39" y="44" text-anchor="middle">${percent}%</text>
</svg>`;
}

function renderDiagnosticList(diagnostics: readonly { severity: string; message: string }[]): string {
  if (diagnostics.length === 0) {
    return '<p class="dim">No diagnostics reported.</p>';
  }

  return `
<div class="table-scroll">
<table>
  <thead><tr><th style="width:86px">Severity</th><th>Message</th></tr></thead>
  <tbody>
    ${diagnostics
      .map(
        (diagnostic) => `
    <tr>
      <td><span class="pill ${pillForSeverity(diagnostic.severity)}">${escapeHtml(diagnostic.severity)}</span></td>
      <td class="mono">${escapeHtml(diagnostic.message)}</td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>
</div>`;
}

function renderProvenanceFootnote(state: Extract<DashboardState, { kind: "populated" }>): string {
  const parts = [`Generated ${escapeHtml(formatTimestamp(state.generatedAt))}`];
  if (state.analyzerJarPath) {
    parts.push(`analyzer <span class="mono">${escapeHtml(state.analyzerJarPath)}</span>`);
  }
  if (state.javaVersion) {
    parts.push(`runtime <span class="mono">${escapeHtml(state.javaVersion)}</span>`);
  }
  return `<div class="footnote">${parts.join(" &middot; ")}</div>`;
}

function pillForSeverity(severity: string): string {
  switch (severity) {
    case "ERROR":
      return "pill-high";
    case "WARNING":
      return "pill-moderate";
    default:
      return "pill-low";
  }
}

function buildToolLabel(buildTool: string): string {
  return buildTool === "UNKNOWN" ? "Not detected" : titleCase(buildTool);
}

function toneForBuildTool(buildTool: string): string {
  return buildTool === "UNKNOWN" ? "is-warn" : "is-ok";
}

function shortenJavaVersion(raw: string): string {
  const match = /version\s+"([^"]+)"/.exec(raw);
  return match?.[1] ?? raw.slice(0, 24);
}

function formatTimestamp(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
}

function shortName(qualifiedName: string): string {
  return qualifiedName.slice(qualifiedName.lastIndexOf(".") + 1);
}

function titleCase(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
