import assert from "node:assert/strict";

import { parseAnalyzerCommandResponse } from "../types/analyzer";
import { getVisibleGraph } from "../webview/graphModel";

const response = parseAnalyzerCommandResponse({
  status: "SUCCESS",
  command: "graph",
  message: "Dependency graph exported.",
  diagnostics: [{ severity: "INFO", message: "Graph ready." }],
  dependencyGraph: {
    projectPath: "/workspace/demo",
    nodeCount: 1,
    edgeCount: 0,
    nodes: [{
      id: "type:demo.OrderService",
      label: "OrderService",
      qualifiedName: "demo.OrderService",
      kind: "TYPE",
      packageName: "demo",
      sourcePath: "src/main/java/demo/OrderService.java",
      metadata: { typeKind: "CLASS" }
    }],
    edges: []
  }
});

assert.equal(response.status, "SUCCESS");
assert.equal(response.dependencyGraph?.nodeCount, 1);
assert.throws(() => parseAnalyzerCommandResponse({ status: "SUCCESS" }), /missing command or message text/);

const expandableGraph = {
  projectPath: "/workspace/demo",
  nodeCount: 2,
  edgeCount: 1,
  nodes: [
    response.dependencyGraph!.nodes[0],
    {
      id: "method:demo.OrderService#listOrders()",
      label: "listOrders",
      qualifiedName: "demo.OrderService.listOrders",
      kind: "METHOD",
      packageName: "demo",
      sourcePath: "src/main/java/demo/OrderService.java",
      metadata: {}
    }
  ],
  edges: [{
    id: "HAS_METHOD|type:demo.OrderService|method:demo.OrderService#listOrders()|listOrders",
    sourceId: "type:demo.OrderService",
    targetId: "method:demo.OrderService#listOrders()",
    kind: "HAS_METHOD",
    label: "listOrders",
    metadata: {}
  }]
};

assert.equal(getVisibleGraph(expandableGraph, new Set(), "ALL").nodes.length, 1);
assert.equal(getVisibleGraph(expandableGraph, new Set(["type:demo.OrderService"]), "ALL").nodes.length, 2);
