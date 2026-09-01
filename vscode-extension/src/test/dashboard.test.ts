import { renderDashboardHtml } from "../dashboard/dashboardHtml";
import { buildDashboardState } from "../model/dashboardModel";
import type { AnalysisResult } from "../types/service";
import { assert, assertDeepEqual, assertEqual, assertExcludes, assertIncludes, suite, test } from "./harness";
import { loadSampleResponse, makeField, makeMethod, makeProject, makeResponse } from "./fixtures";

const NONCE = "test-nonce-value";
const CSP_SOURCE = "vscode-webview://test";

function successResult(response = makeResponse(makeProject([{ qualifiedName: "app.A" }]))): AnalysisResult {
  return {
    outcome: "success",
    message: response.message,
    diagnostics: [],
    response,
    source: "analyzer",
    durationMs: 1234,
    analyzerJarPath: "/tmp/aegis-analyzer.jar",
    javaVersion: "21.0.2"
  };
}

suite("dashboard model", () => {
  test("reports an idle state before any analysis", () => {
    const state = buildDashboardState(undefined, "/tmp/project", 70);

    assertEqual(state.kind, "empty");
    if (state.kind === "empty") {
      assertEqual(state.outcome, "idle");
      assertIncludes(state.statusMessage, "Analyze Project");
    }
  });

  test("reports an empty state when the analyzer produced no parsed project", () => {
    const state = buildDashboardState(
      {
        outcome: "error",
        message: "Project path does not exist.",
        diagnostics: [{ severity: "ERROR", message: "Project path does not exist." }],
        source: "analyzer",
        durationMs: 40
      },
      "/tmp/project",
      70
    );

    assertEqual(state.kind, "empty");
    if (state.kind === "empty") {
      assertEqual(state.outcome, "error");
      assertEqual(state.diagnostics.length, 1);
    }
  });

  test("computes metrics, averages and the largest type", () => {
    const project = makeProject([
      {
        qualifiedName: "app.Big",
        fields: [makeField("a", "String"), makeField("b", "String")],
        methods: [makeMethod("one"), makeMethod("two"), makeMethod("three")]
      },
      { qualifiedName: "app.Small", methods: [makeMethod("only")] }
    ]);

    const state = buildDashboardState(successResult(makeResponse(project)), "/tmp/project", 70);

    assertEqual(state.kind, "populated");
    if (state.kind !== "populated") {
      return;
    }

    assertEqual(state.metrics.typeCount, 2);
    assertEqual(state.metrics.methodCount, 4);
    assertEqual(state.metrics.fieldCount, 2);
    assertEqual(state.metrics.averageMethodsPerType, 2);
    assertEqual(state.metrics.largestType?.name, "Big");
    assertEqual(state.metrics.largestType?.memberCount, 5);
    assertEqual(state.metrics.packageCount, 1);
  });

  test("prefers the analyzer's reported project path over the opened folder", () => {
    // The analyzer resolves the real project root, which is not always the folder
    // the user happens to have open (a monorepo subdirectory, for instance).
    const state = buildDashboardState(
      successResult(makeResponse(makeProject([{ qualifiedName: "app.A" }], "/Users/dev/work/storefront-service"))),
      "/Users/dev/work",
      70
    );

    assertEqual(state.kind, "populated");
    if (state.kind === "populated") {
      assertEqual(state.projectName, "storefront-service");
      assertEqual(state.projectPath, "/Users/dev/work/storefront-service");
    }
  });

  test("reports 100% parse health when nothing failed to parse", () => {
    const state = buildDashboardState(successResult(), "/tmp/project", 70);

    if (state.kind === "populated") {
      assertEqual(state.health.parseSuccessRate, 100);
      assertEqual(state.health.filesWithParseErrors, 0);
    }
  });

  test("reports partial parse health when a file failed", () => {
    const sample = loadSampleResponse();
    const state = buildDashboardState(successResult(sample), "/tmp/project", 70);

    assertEqual(state.kind, "populated");
    if (state.kind !== "populated") {
      return;
    }

    // The fixture deliberately contains one unparseable file.
    assertEqual(state.health.filesWithParseErrors, 1);
    assert(
      state.health.parseSuccessRate > 90 && state.health.parseSuccessRate < 100,
      `expected partial parse health, got ${state.health.parseSuccessRate}`
    );
  });

  test("carries the sample source through so the UI can label it", () => {
    const state = buildDashboardState(
      { ...successResult(), outcome: "unavailable", source: "sample" },
      "/tmp/project",
      70
    );

    if (state.kind === "populated") {
      assertEqual(state.source, "sample");
    }
  });
});

suite("dashboard rendering", () => {
  const sampleState = buildDashboardState(successResult(loadSampleResponse()), "/tmp/storefront", 70);
  const html = renderDashboardHtml(sampleState, { nonce: NONCE, cspSource: CSP_SOURCE });

  test("emits a locked-down Content Security Policy", () => {
    assertIncludes(html, "default-src 'none'");
    assertIncludes(html, `style-src 'nonce-${NONCE}'`);
    assertIncludes(html, `script-src 'nonce-${NONCE}'`);
    assertExcludes(html, "unsafe-inline", "inline styles and scripts must be nonce-gated, not blanket-allowed");
    assertExcludes(html, "unsafe-eval", "the webview must never allow eval");
  });

  test("nonces every inline block so nothing is silently blocked", () => {
    const styleTags = html.match(/<style/g) ?? [];
    const scriptTags = html.match(/<script/g) ?? [];
    const noncedTags = html.match(new RegExp(`nonce="${NONCE}"`, "g")) ?? [];

    assertEqual(
      noncedTags.length,
      styleTags.length + scriptTags.length,
      "every style and script tag needs the nonce"
    );
  });

  test("loads no remote resources", () => {
    // The only permitted occurrence of an http URL is the SVG namespace, which is
    // an XML identifier and is never fetched. Anything that could actually pull
    // bytes over the network is what this guards against.
    assertExcludes(html, "https://");
    assertExcludes(html, "<link");
    assertExcludes(html, "@import");
    assertExcludes(html, "fetch(");
    assertExcludes(html, "XMLHttpRequest");
    assertExcludes(html, "src=\"http");
    assertExcludes(html, "href=\"http");

    const httpOccurrences = html.match(/http:\/\/[^"'\s]*/g) ?? [];
    for (const occurrence of httpOccurrences) {
      assertEqual(
        occurrence,
        "http://www.w3.org/2000/svg",
        "the SVG namespace is the only http URL the webview may contain"
      );
    }
  });

  test("renders the three requested panels", () => {
    assertIncludes(html, 'data-tab="overview"');
    assertIncludes(html, 'data-tab="graph"');
    assertIncludes(html, 'data-tab="spring"');
  });

  test("wires only allow-listed commands to buttons", () => {
    const allowed = new Set([
      "aegis.analyzeProject",
      "aegis.showImpactGraph",
      "aegis.openDashboard",
      "aegis.exportAnalysis",
      "aegis.showLogs"
    ]);

    const referenced = [...html.matchAll(/data-command="([^"]+)"/g)].map((match) => match[1]);

    assert(referenced.length > 0, "the dashboard should expose action buttons");
    for (const command of referenced) {
      assert(allowed.has(command), `button references a command outside the panel allow-list: ${command}`);
    }
  });

  test("applies the AEGIS dark palette while deferring to editor typography", () => {
    assertIncludes(html, "--aegis-bg: #0a0e14", "the dark surface colour must be present");
    assertIncludes(html, "--aegis-primary: #38bdf8");
    assertIncludes(html, "var(--vscode-font-family", "typography should follow the editor");
    assertIncludes(html, "prefers-contrast: more", "high-contrast themes must be respected");
    assertIncludes(html, "prefers-reduced-motion", "reduced-motion users must be respected");
  });

  test("references no undeclared AEGIS custom property", () => {
    // A typo in a var() name fails silently in CSS: the property is simply
    // dropped and the element renders unstyled, which is easy to miss by eye.
    const declared = new Set([...html.matchAll(/(--aegis-[a-z-]+)\s*:/g)].map((match) => match[1]));
    const referenced = [...html.matchAll(/var\((--aegis-[a-z-]+)/g)].map((match) => match[1]);

    assert(declared.size > 10, "expected the palette to declare a set of custom properties");
    for (const name of referenced) {
      assert(declared.has(name), `${name} is used but never declared`);
    }
  });

  test("serialises the graph model for the client without breaking out of the script tag", () => {
    assertIncludes(html, "window.__AEGIS_MODEL__");
    assertExcludes(html, "</script></script>");

    const modelMatch = /window\.__AEGIS_MODEL__ = (.*);<\/script>/s.exec(html);
    assert(modelMatch !== null, "the serialised model should be recoverable");

    const parsed = JSON.parse(modelMatch![1]) as { graph?: { nodes?: unknown[] } };
    assert(Array.isArray(parsed.graph?.nodes), "the client model must carry graph nodes");
    assert((parsed.graph?.nodes?.length ?? 0) > 0, "the sample should produce a non-empty graph");
  });

  test("escapes a hostile type name instead of injecting markup", () => {
    const hostile = makeProject([
      { qualifiedName: "app.<img src=x onerror=alert(1)>", fields: [makeField("f", "String")] },
      { qualifiedName: "app.Normal" }
    ]);

    const hostileHtml = renderDashboardHtml(
      buildDashboardState(successResult(makeResponse(hostile)), "/tmp/x", 70),
      { nonce: NONCE, cspSource: CSP_SOURCE }
    );

    assertExcludes(hostileHtml, "<img src=x", "a type name must never be emitted as live markup");
    assertIncludes(hostileHtml, "&lt;img", "the hostile name should appear escaped");
  });

  test("renders an actionable empty state before the first run", () => {
    const emptyHtml = renderDashboardHtml(buildDashboardState(undefined, "/tmp/project", 70), {
      nonce: NONCE,
      cspSource: CSP_SOURCE
    });

    assertIncludes(emptyHtml, 'data-command="aegis.analyzeProject"');
    assertIncludes(emptyHtml, "empty-state");
  });

  test("labels sample data prominently so it is never mistaken for real output", () => {
    const sampleHtml = renderDashboardHtml(
      buildDashboardState(
        { ...successResult(loadSampleResponse()), outcome: "unavailable", source: "sample" },
        "/tmp/project",
        70
      ),
      { nonce: NONCE, cspSource: CSP_SOURCE }
    );

    assertIncludes(sampleHtml.toLowerCase(), "sample data");
  });

  test("states plainly that endpoint URL paths are unavailable", () => {
    // The analyzer captures annotation names only. Claiming a route table we do
    // not have would be the single most misleading thing this UI could do.
    assertIncludes(html.toLowerCase(), "url path");
  });

  test("opens on the requested panel without needing a message to arrive", () => {
    // "Show Impact Graph" used to be delivered by posting into the webview right
    // after assigning `html`. That assignment reloads the document, and a message
    // posted into a document that is still loading is dropped, so the command
    // intermittently landed on Overview. The selected tab is now in the markup.
    for (const tab of ["overview", "graph", "spring"] as const) {
      const rendered = renderDashboardHtml(sampleState, {
        nonce: NONCE,
        cspSource: CSP_SOURCE,
        activeTab: tab
      });

      const activePanels = [...rendered.matchAll(/<section class="panel is-active" data-panel="([a-z]+)"/g)].map(
        (match) => match[1]
      );
      assertDeepEqual(activePanels, [tab], `exactly the ${tab} panel should open active`);

      const selectedTabs = [...rendered.matchAll(/data-tab="([a-z]+)" aria-selected="true"/g)].map(
        (match) => match[1]
      );
      assertDeepEqual(selectedTabs, [tab], `exactly the ${tab} tab should read as selected`);
    }
  });

  test("defaults to the overview panel when no tab is requested", () => {
    assertIncludes(html, '<section class="panel is-active" data-panel="overview"');
    assertIncludes(html, 'data-tab="overview" aria-selected="true"');
  });
});
