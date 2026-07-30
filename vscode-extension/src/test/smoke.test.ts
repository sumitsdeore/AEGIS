import assert from "node:assert/strict";

import { parseAnalyzerCommandResponse } from "../types/analyzer";

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
