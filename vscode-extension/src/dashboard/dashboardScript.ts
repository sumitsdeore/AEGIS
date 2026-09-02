/**
 * Dashboard client script, injected inline under a CSP nonce.
 *
 * Written with string concatenation rather than template literals so it can live
 * inside a TypeScript template literal without escaping every backtick.
 *
 * Responsibilities: tab switching, the force-directed dependency graph
 * (layout, pan, zoom, drag, filtering), the node inspector, and postMessage
 * calls back to the extension host.
 */
export const DASHBOARD_SCRIPT = `
(function () {
  "use strict";

  var vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;
  var model = window.__AEGIS_MODEL__ || null;

  function post(message) {
    if (vscode) { vscode.postMessage(message); }
  }

  /* ------------------------------------------------------------- helpers -- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = String(text); }
    return node;
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  /* ---------------------------------------------------------------- tabs -- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));

  function activateTab(name) {
    tabs.forEach(function (tab) {
      var selected = tab.getAttribute("data-tab") === name;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute("data-panel") === name;
      panel.classList.toggle("is-active", active);
    });
    if (name === "graph") { requestAnimationFrame(fitGraphToViewport); }
    /* Told to the host so that re-analysing leaves the reader on the panel they
       were reading. Setting webview.html reloads the document, and the host can
       only re-render the right tab if it knows which one that is. */
    post({ type: "tabChanged", tab: name });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { activateTab(tab.getAttribute("data-tab")); });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") { return; }
      event.preventDefault();
      var index = tabs.indexOf(tab);
      var next = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      activateTab(tabs[next].getAttribute("data-tab"));
    });
  });

  /* Registered before the graph guard below so "reveal the graph tab" still
     works when the model is empty and the graph section bails out early. */
  window.addEventListener("message", function (event) {
    var message = event.data;
    if (message && message.type === "activateTab" && message.tab) {
      activateTab(message.tab);
    }
  });

  /* The host holds back messages until this arrives. A webview that is still
     loading silently discards anything posted to it, so without the handshake a
     "reveal this type" request issued while the dashboard was opening would be
     dropped and the command would appear to do nothing. */
  post({ type: "ready" });

  /* ------------------------------------------------------------- actions -- */

  document.querySelectorAll("[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
      post({ type: "command", command: button.getAttribute("data-command") });
    });
  });

  document.querySelectorAll("[data-open-path]").forEach(function (row) {
    row.addEventListener("click", function () {
      post({
        type: "openSource",
        sourcePath: row.getAttribute("data-open-path"),
        line: Number(row.getAttribute("data-open-line") || 1)
      });
    });
  });

  if (!model || !model.graph) { return; }

  /* --------------------------------------------------------------- graph -- */

  var RENDER_LIMIT = 140;
  var LAYER_COLORS = {
    bootstrap: "#c084fc",
    web: "#38bdf8",
    service: "#34d399",
    persistence: "#fbbf24",
    config: "#fb923c",
    "cross-cutting": "#94a3b8"
  };
  var LAYER_ORDER = ["bootstrap", "web", "service", "persistence", "config", "cross-cutting"];

  var allNodes = model.graph.nodes.slice(0, RENDER_LIMIT);
  var visibleIds = {};
  allNodes.forEach(function (node) { visibleIds[node.id] = true; });
  var allEdges = model.graph.edges.filter(function (edge) {
    return visibleIds[edge.from] && visibleIds[edge.to];
  });

  var nodeById = {};
  allNodes.forEach(function (node) { nodeById[node.id] = node; });

  var neighbors = {};
  allNodes.forEach(function (node) { neighbors[node.id] = {}; });
  allEdges.forEach(function (edge) {
    neighbors[edge.from][edge.to] = true;
    neighbors[edge.to][edge.from] = true;
  });

  var svg = document.getElementById("graph-svg");
  var viewport = document.getElementById("graph-viewport");
  var edgeLayer = document.getElementById("graph-edges");
  var nodeLayer = document.getElementById("graph-nodes");
  var labelLayer = document.getElementById("graph-labels");

  if (!svg || !viewport) { return; }

  var WIDTH = 1000;
  var HEIGHT = 620;

  /* Deterministic pseudo-random jitter: the same project always produces the
     same layout, which keeps the view stable across re-analyses. */
  function seededRandom(seed) {
    var value = seed;
    return function () {
      value = (value * 1103515245 + 12345) & 0x7fffffff;
      return value / 0x7fffffff;
    };
  }
  var random = seededRandom(allNodes.length * 7919 + 13);

  /* Seed positions in vertical layer bands so the initial state already
     communicates architecture, then let the simulation relax it. */
  var simNodes = allNodes.map(function (node, index) {
    var band = LAYER_ORDER.indexOf(node.layer);
    if (band < 0) { band = LAYER_ORDER.length - 1; }
    var bandWidth = WIDTH / LAYER_ORDER.length;
    return {
      id: node.id,
      data: node,
      x: bandWidth * (band + 0.5) + (random() - 0.5) * bandWidth * 0.7,
      y: HEIGHT * 0.12 + random() * HEIGHT * 0.76,
      vx: 0,
      vy: 0,
      radius: 4 + Math.sqrt(node.methodCount + node.fieldCount) * 1.15,
      index: index
    };
  });

  var simById = {};
  simNodes.forEach(function (node) { simById[node.id] = node; });

  var simEdges = allEdges.map(function (edge) {
    return { source: simById[edge.from], target: simById[edge.to], data: edge };
  }).filter(function (edge) { return edge.source && edge.target; });

  /* Barnes-Hut would be overkill at this node cap; the pairwise loop below runs
     in a few milliseconds for 140 nodes and keeps the code auditable. */
  function runSimulation(iterations) {
    var repulsion = 5200;
    var springLength = 78;
    var springStrength = 0.016;
    var damping = 0.85;
    var centerPull = 0.0016;

    for (var step = 0; step < iterations; step++) {
      var cooling = 1 - step / iterations;

      for (var i = 0; i < simNodes.length; i++) {
        var a = simNodes[i];
        for (var j = i + 1; j < simNodes.length; j++) {
          var b = simNodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < 0.01) { distanceSquared = 0.01; dx = random() - 0.5; dy = random() - 0.5; }
          var distance = Math.sqrt(distanceSquared);
          var force = repulsion / distanceSquared;
          var fx = (dx / distance) * force;
          var fy = (dy / distance) * force;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }

      simEdges.forEach(function (edge) {
        var dx = edge.target.x - edge.source.x;
        var dy = edge.target.y - edge.source.y;
        var distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var displacement = distance - springLength;
        var force = displacement * springStrength;
        var fx = (dx / distance) * force;
        var fy = (dy / distance) * force;
        edge.source.vx += fx; edge.source.vy += fy;
        edge.target.vx -= fx; edge.target.vy -= fy;
      });

      simNodes.forEach(function (node) {
        node.vx += (WIDTH / 2 - node.x) * centerPull;
        node.vy += (HEIGHT / 2 - node.y) * centerPull;
        node.vx *= damping; node.vy *= damping;
        node.x += node.vx * cooling;
        node.y += node.vy * cooling;
      });
    }
  }

  runSimulation(simNodes.length > 90 ? 220 : 320);

  /* ------------------------------------------------------------ rendering -- */

  var SVG_NS = "http://www.w3.org/2000/svg";
  var edgeElements = [];
  var nodeElements = [];
  var labelElements = [];

  simEdges.forEach(function (edge) {
    var line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("class", "edge");
    edgeLayer.appendChild(line);
    edgeElements.push({ line: line, edge: edge });
  });

  simNodes.forEach(function (node) {
    var circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "node-dot");
    circle.setAttribute("r", String(node.radius));
    circle.setAttribute("fill", LAYER_COLORS[node.data.layer] || LAYER_COLORS["cross-cutting"]);
    circle.setAttribute("tabindex", "0");
    circle.setAttribute("role", "button");
    circle.setAttribute("aria-label", node.data.simpleName + ", risk " + node.data.risk.score);

    var title = document.createElementNS(SVG_NS, "title");
    title.textContent = node.data.simpleName + " - " + (node.data.stereotypeLabel || node.data.kind) +
      " - risk " + node.data.risk.score + "/100";
    circle.appendChild(title);

    nodeLayer.appendChild(circle);
    nodeElements.push({ circle: circle, node: node });

    var label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "node-label");
    label.setAttribute("text-anchor", "middle");
    label.textContent = node.data.simpleName;
    labelLayer.appendChild(label);
    labelElements.push({ label: label, node: node });
  });

  function paintPositions() {
    edgeElements.forEach(function (entry) {
      entry.line.setAttribute("x1", entry.edge.source.x.toFixed(1));
      entry.line.setAttribute("y1", entry.edge.source.y.toFixed(1));
      entry.line.setAttribute("x2", entry.edge.target.x.toFixed(1));
      entry.line.setAttribute("y2", entry.edge.target.y.toFixed(1));
    });
    nodeElements.forEach(function (entry) {
      entry.circle.setAttribute("cx", entry.node.x.toFixed(1));
      entry.circle.setAttribute("cy", entry.node.y.toFixed(1));
    });
    labelElements.forEach(function (entry) {
      entry.label.setAttribute("x", entry.node.x.toFixed(1));
      entry.label.setAttribute("y", (entry.node.y - entry.node.radius - 4).toFixed(1));
    });
  }

  paintPositions();

  /* --------------------------------------------------------- pan and zoom -- */

  var transform = { x: 0, y: 0, scale: 1 };

  function applyTransform() {
    viewport.setAttribute(
      "transform",
      "translate(" + transform.x.toFixed(2) + "," + transform.y.toFixed(2) + ") scale(" + transform.scale.toFixed(3) + ")"
    );
  }

  function fitGraphToViewport() {
    if (simNodes.length === 0) { return; }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    simNodes.forEach(function (node) {
      minX = Math.min(minX, node.x - node.radius);
      minY = Math.min(minY, node.y - node.radius);
      maxX = Math.max(maxX, node.x + node.radius);
      maxY = Math.max(maxY, node.y + node.radius);
    });
    var rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) { return; }
    var padding = 46;
    var scale = Math.min(
      (rect.width - padding * 2) / Math.max(1, maxX - minX),
      (rect.height - padding * 2) / Math.max(1, maxY - minY)
    );
    transform.scale = Math.min(Math.max(scale, 0.25), 2.2);
    transform.x = (rect.width - (maxX + minX) * transform.scale) / 2;
    transform.y = (rect.height - (maxY + minY) * transform.scale) / 2;
    applyTransform();
  }

  svg.addEventListener("wheel", function (event) {
    event.preventDefault();
    var rect = svg.getBoundingClientRect();
    var pointerX = event.clientX - rect.left;
    var pointerY = event.clientY - rect.top;
    var factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    var nextScale = Math.min(Math.max(transform.scale * factor, 0.2), 4);
    var ratio = nextScale / transform.scale;
    transform.x = pointerX - (pointerX - transform.x) * ratio;
    transform.y = pointerY - (pointerY - transform.y) * ratio;
    transform.scale = nextScale;
    applyTransform();
  }, { passive: false });

  var panState = null;

  svg.addEventListener("pointerdown", function (event) {
    if (event.target.classList && event.target.classList.contains("node-dot")) { return; }
    panState = { startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y };
    svg.classList.add("is-panning");
    svg.setPointerCapture(event.pointerId);
  });

  svg.addEventListener("pointermove", function (event) {
    if (dragState) {
      var rect = svg.getBoundingClientRect();
      dragState.node.x = (event.clientX - rect.left - transform.x) / transform.scale;
      dragState.node.y = (event.clientY - rect.top - transform.y) / transform.scale;
      paintPositions();
      return;
    }
    if (!panState) { return; }
    transform.x = panState.originX + (event.clientX - panState.startX);
    transform.y = panState.originY + (event.clientY - panState.startY);
    applyTransform();
  });

  svg.addEventListener("pointerup", function (event) {
    panState = null;
    dragState = null;
    svg.classList.remove("is-panning");
    if (svg.hasPointerCapture(event.pointerId)) { svg.releasePointerCapture(event.pointerId); }
  });

  var dragState = null;

  nodeElements.forEach(function (entry) {
    entry.circle.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
      dragState = { node: entry.node };
      svg.setPointerCapture(event.pointerId);
    });
    entry.circle.addEventListener("click", function (event) {
      event.stopPropagation();
      selectNode(entry.node.id);
    });
    entry.circle.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectNode(entry.node.id);
      }
    });
    entry.circle.addEventListener("dblclick", function (event) {
      event.stopPropagation();
      post({
        type: "openSource",
        sourcePath: entry.node.data.sourcePath,
        line: entry.node.data.sourceRange ? entry.node.data.sourceRange.beginLine : 1
      });
    });
  });

  /* ------------------------------------------------------------ filtering -- */

  var searchInput = document.getElementById("graph-search");
  var layerFilter = document.getElementById("graph-layer");
  var riskFilter = document.getElementById("graph-risk");
  var matchCount = document.getElementById("graph-match-count");
  var selectedId = null;

  function matchesFilters(node) {
    var term = (searchInput && searchInput.value || "").trim().toLowerCase();
    if (term && node.data.simpleName.toLowerCase().indexOf(term) === -1 &&
        node.data.id.toLowerCase().indexOf(term) === -1) {
      return false;
    }
    var layer = layerFilter && layerFilter.value;
    if (layer && layer !== "all" && node.data.layer !== layer) { return false; }
    var band = riskFilter && riskFilter.value;
    if (band && band !== "all" && node.data.risk.band !== band) { return false; }
    return true;
  }

  function refreshHighlight() {
    var anyFilter = Boolean(
      (searchInput && searchInput.value.trim()) ||
      (layerFilter && layerFilter.value !== "all") ||
      (riskFilter && riskFilter.value !== "all")
    );

    var matched = 0;

    nodeElements.forEach(function (entry, index) {
      var passes = matchesFilters(entry.node);
      if (passes) { matched += 1; }
      var adjacentToSelection = selectedId
        ? entry.node.id === selectedId || neighbors[selectedId][entry.node.id]
        : true;
      var dim = (anyFilter && !passes) || (selectedId && !adjacentToSelection);
      entry.circle.classList.toggle("is-dimmed", Boolean(dim));
      entry.circle.classList.toggle("is-selected", entry.node.id === selectedId);
      labelElements[index].label.classList.toggle("is-dimmed", Boolean(dim));
    });

    /* Filtering dims rather than hides, so without this a filter that matches
       nothing is indistinguishable from a rendering failure. */
    if (matchCount) {
      if (!anyFilter) {
        matchCount.textContent = "";
        matchCount.classList.remove("is-empty");
      } else if (matched === 0) {
        matchCount.textContent = "No types match";
        matchCount.classList.add("is-empty");
      } else {
        matchCount.textContent = matched + " of " + nodeElements.length + " types match";
        matchCount.classList.remove("is-empty");
      }
    }

    edgeElements.forEach(function (entry) {
      var touchesSelection = selectedId &&
        (entry.edge.source.id === selectedId || entry.edge.target.id === selectedId);
      entry.line.classList.toggle("is-adjacent", Boolean(touchesSelection));
      entry.line.classList.toggle("is-dimmed", Boolean(selectedId && !touchesSelection));
    });
  }

  [searchInput, layerFilter, riskFilter].forEach(function (control) {
    if (!control) { return; }
    control.addEventListener("input", refreshHighlight);
    control.addEventListener("change", refreshHighlight);
  });

  var resetButton = document.getElementById("graph-reset");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      selectedId = null;
      if (searchInput) { searchInput.value = ""; }
      if (layerFilter) { layerFilter.value = "all"; }
      if (riskFilter) { riskFilter.value = "all"; }
      refreshHighlight();
      renderInspector(null);
      fitGraphToViewport();
    });
  }

  /* ------------------------------------------------------------ inspector -- */

  var inspector = document.getElementById("inspector-body");

  function dependentsOf(id) {
    return allEdges.filter(function (edge) { return edge.to === id; }).map(function (edge) { return edge.from; });
  }
  function dependenciesOf(id) {
    return allEdges.filter(function (edge) { return edge.from === id; }).map(function (edge) { return edge.to; });
  }

  function statPair(label, value) {
    var row = el("div", "stat-pair");
    row.appendChild(el("dt", null, label));
    row.appendChild(el("dd", null, value));
    return row;
  }

  function relationList(title, ids) {
    var wrap = document.createDocumentFragment();
    wrap.appendChild(el("p", "subhead", title + " (" + ids.length + ")"));
    if (ids.length === 0) {
      wrap.appendChild(el("p", "inspector-empty", "None detected."));
      return wrap;
    }
    var list = el("ul", "relation-list");
    ids.slice(0, 40).forEach(function (id) {
      var item = el("li", null, nodeById[id] ? nodeById[id].simpleName : id);
      item.title = id;
      item.addEventListener("click", function () { selectNode(id); });
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderInspector(id) {
    if (!inspector) { return; }
    clear(inspector);

    if (!id || !nodeById[id]) {
      inspector.appendChild(el("p", "inspector-empty",
        "Select a node in the graph to inspect its dependencies, impact reach, and risk breakdown."));
      return;
    }

    var node = nodeById[id];

    inspector.appendChild(el("h3", null, node.simpleName));
    inspector.appendChild(el("p", "qualified", node.id));

    var badges = el("div", "badge-row");
    var kindBadge = el("span", "badge", node.stereotypeLabel || node.kind);
    badges.appendChild(kindBadge);
    var riskBadge = el("span", "pill pill-" + node.risk.band, node.risk.band + " " + node.risk.score);
    badges.appendChild(riskBadge);
    inspector.appendChild(badges);

    inspector.appendChild(document.createElement("hr")).className = "divider";

    var stats = el("dl");
    stats.style.margin = "0";
    if (node.superclass) {
      stats.appendChild(statPair("Extends", node.superclass));
    }
    if (node.interfaces && node.interfaces.length > 0) {
      stats.appendChild(statPair("Implements", node.interfaces.join(", ")));
    }
    stats.appendChild(statPair("Direct dependents", String(node.fanIn)));
    stats.appendChild(statPair("Depends on", String(node.fanOut)));
    stats.appendChild(statPair("Transitive impact", String(node.impactReach) + " type(s)"));
    stats.appendChild(statPair("Methods", String(node.methodCount)));
    stats.appendChild(statPair("Fields", String(node.fieldCount)));
    stats.appendChild(statPair("Package", node.packageName || "(default)"));
    inspector.appendChild(stats);

    inspector.appendChild(document.createElement("hr")).className = "divider";

    inspector.appendChild(el("p", "subhead", "Risk breakdown"));
    node.risk.factors.forEach(function (factor) {
      var wrap = el("div", "factor");
      var head = el("div", "factor-head");
      head.appendChild(el("span", null, factor.label));
      head.appendChild(el("span", null, factor.points + " / " + factor.maxPoints));
      wrap.appendChild(head);

      var track = el("div", "bar-track");
      var fill = el("div", "bar-fill");
      fill.style.width = Math.round((factor.points / factor.maxPoints) * 100) + "%";
      track.appendChild(fill);
      wrap.appendChild(track);
      wrap.appendChild(el("div", "factor-detail", factor.detail));
      inspector.appendChild(wrap);
    });

    inspector.appendChild(document.createElement("hr")).className = "divider";
    inspector.appendChild(relationList("Dependents", dependentsOf(id)));
    inspector.appendChild(relationList("Dependencies", dependenciesOf(id)));

    var openButton = el("button", "primary", "Open in editor");
    openButton.style.marginTop = "14px";
    openButton.style.width = "100%";
    openButton.addEventListener("click", function () {
      post({
        type: "openSource",
        sourcePath: node.sourcePath,
        line: node.sourceRange ? node.sourceRange.beginLine : 1
      });
    });
    inspector.appendChild(openButton);
  }

  function selectNode(id) {
    selectedId = selectedId === id ? null : id;
    refreshHighlight();
    renderInspector(selectedId);
  }

  renderInspector(null);
  refreshHighlight();

  window.addEventListener("resize", fitGraphToViewport);
  requestAnimationFrame(fitGraphToViewport);

  /* Allow the host to jump straight to a type, e.g. from the risk table. */
  window.addEventListener("message", function (event) {
    var message = event.data;
    if (message && message.type === "focusType" && nodeById[message.id]) {
      activateTab("graph");
      selectedId = null;
      selectNode(message.id);
    }
  });

  document.querySelectorAll("[data-focus-type]").forEach(function (row) {
    row.addEventListener("click", function () {
      var id = row.getAttribute("data-focus-type");
      if (!nodeById[id]) { return; }
      activateTab("graph");
      selectedId = null;
      selectNode(id);
    });
  });
})();
`;
