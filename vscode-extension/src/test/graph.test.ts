import { assessRisk, buildDependencyGraph, extractTypeReferences, findCycles } from "../model/graph";
import { deriveSpringInsights } from "../model/insights";
import { assert, assertBetween, assertDeepEqual, assertEqual, suite, test } from "./harness";
import { makeField, makeMethod, makeProject } from "./fixtures";

suite("type reference extraction", () => {
  test("unwraps generics and arrays", () => {
    assertDeepEqual(extractTypeReferences("Map<String, List<Order>>"), ["Map", "String", "List", "Order"]);
    assertDeepEqual(extractTypeReferences("Customer[]"), ["Customer"]);
    assertDeepEqual(extractTypeReferences("Optional<Product>"), ["Optional", "Product"]);
  });

  test("drops unnamed wildcards but leaves primitive filtering to the caller", () => {
    // extractTypeReferences is deliberately permissive: it splits a type
    // expression into candidate names and lets the graph builder decide what
    // resolves. "int" is emitted and then simply never matches a project type.
    assertDeepEqual(extractTypeReferences("int"), ["int"]);
    assertDeepEqual(extractTypeReferences("List<?>"), ["List"]);
    assertDeepEqual(extractTypeReferences(""), []);
  });

  test("keeps both the qualified name and its tail so either can resolve", () => {
    // Imports give qualified names, field declarations usually give simple ones,
    // so both spellings are offered to the resolver.
    assertDeepEqual(extractTypeReferences("com.example.domain.Order"), [
      "com.example.domain.Order",
      "Order"
    ]);
  });
});

suite("cycle detection", () => {
  test("finds a simple two-node cycle", () => {
    const cycles = findCycles(
      new Map([
        ["A", new Set(["B"])],
        ["B", new Set(["A"])]
      ])
    );

    assertEqual(cycles.length, 1);
    assertDeepEqual([...cycles[0].members].sort(), ["A", "B"]);
  });

  test("ignores acyclic graphs", () => {
    const cycles = findCycles(
      new Map([
        ["A", new Set(["B", "C"])],
        ["B", new Set(["C"])],
        ["C", new Set<string>()]
      ])
    );

    assertEqual(cycles.length, 0);
  });

  test("does not report a self-loop as a cycle between types", () => {
    // A type referring to itself is normal Java (recursion, static factories) and
    // carries no cross-type coupling information.
    assertEqual(findCycles(new Map([["A", new Set(["A"])]])).length, 0);
  });

  test("finds a three-node cycle and excludes unrelated nodes", () => {
    const cycles = findCycles(
      new Map([
        ["A", new Set(["B"])],
        ["B", new Set(["C"])],
        ["C", new Set(["A"])],
        ["D", new Set(["A"])],
        ["E", new Set<string>()]
      ])
    );

    assertEqual(cycles.length, 1);
    assertDeepEqual([...cycles[0].members].sort(), ["A", "B", "C"]);
  });

  test("survives a long chain without exhausting the stack", () => {
    // The implementation is iterative Tarjan precisely so a deep dependency chain
    // in a large monolith cannot crash the extension host.
    const adjacency = new Map<string, Set<string>>();
    const size = 20_000;

    for (let index = 0; index < size; index += 1) {
      adjacency.set(`n${index}`, new Set([`n${(index + 1) % size}`]));
    }

    const cycles = findCycles(adjacency);
    assertEqual(cycles.length, 1);
    assertEqual(cycles[0].members.length, size);
  });
});

suite("risk scoring", () => {
  const scales = {
    totalTypes: 100,
    maxFanIn: 20,
    maxFanOut: 20,
    maxSize: 50,
    highRiskThreshold: 70
  };

  test("scores stay within 0-100 and factors sum to the score", () => {
    const assessment = assessRisk(
      { impactReach: 40, fanIn: 12, fanOut: 6, size: 30, layer: "service" },
      scales
    );

    assertBetween(assessment.score, 0, 100);

    const factorTotal = assessment.factors.reduce((total, factor) => total + factor.points, 0);
    assertBetween(
      Math.abs(factorTotal - assessment.score),
      0,
      1,
      "the factor breakdown must explain the headline score"
    );
  });

  test("a leaf type in a low-criticality layer scores low", () => {
    const assessment = assessRisk(
      { impactReach: 0, fanIn: 0, fanOut: 0, size: 1, layer: "bootstrap" },
      scales
    );

    assertEqual(assessment.band, "low");
    assertBetween(assessment.score, 0, 20);
  });

  test("a widely depended-on persistence type scores high", () => {
    const assessment = assessRisk(
      { impactReach: 100, fanIn: 20, fanOut: 20, size: 50, layer: "persistence" },
      scales
    );

    assertEqual(assessment.band, "high");
    assertBetween(assessment.score, 90, 100);
  });

  test("lowering the threshold widens the high-risk band", () => {
    const inputs = { impactReach: 45, fanIn: 9, fanOut: 5, size: 20, layer: "service" as const };

    const strict = assessRisk(inputs, { ...scales, highRiskThreshold: 90 });
    const lenient = assessRisk(inputs, { ...scales, highRiskThreshold: 30 });

    assertEqual(strict.score, lenient.score, "the threshold must not change the score itself");
    assert(
      bandRank(lenient.band) >= bandRank(strict.band),
      "a lower threshold must not produce a calmer band"
    );
  });

  test("degenerate scales do not produce NaN", () => {
    // A single-type project makes every "max" zero; division must be guarded.
    const assessment = assessRisk(
      { impactReach: 0, fanIn: 0, fanOut: 0, size: 0, layer: "web" },
      { totalTypes: 0, maxFanIn: 0, maxFanOut: 0, maxSize: 0, highRiskThreshold: 70 }
    );

    assert(Number.isFinite(assessment.score), `score must be finite, got ${assessment.score}`);
    for (const factor of assessment.factors) {
      assert(Number.isFinite(factor.points), `factor ${factor.label} must be finite`);
    }
  });
});

suite("dependency graph", () => {
  const specs = [
    { qualifiedName: "app.web.OrderController", annotations: ["RestController"], fields: [makeField("service", "OrderService")], imports: ["app.service.OrderService"] },
    { qualifiedName: "app.service.OrderService", annotations: ["Service"], fields: [makeField("repository", "OrderRepository")], methods: [makeMethod("find", "Order", ["long"])], imports: ["app.repository.OrderRepository", "app.domain.Order"] },
    { qualifiedName: "app.repository.OrderRepository", kind: "INTERFACE" as const, methods: [makeMethod("findAll", "List<Order>")], imports: ["app.domain.Order"] },
    { qualifiedName: "app.domain.Order", fields: [makeField("id", "long")] },
    { qualifiedName: "app.util.Unreferenced", methods: [makeMethod("noop")] }
  ];

  const project = makeProject(specs);
  const graph = buildDependencyGraph(project, deriveSpringInsights(project), 70);

  const nodeFor = (qualifiedName: string) => {
    const node = graph.nodes.find((candidate) => candidate.id === qualifiedName);
    assert(node !== undefined, `expected a node for ${qualifiedName}`);
    return node!;
  };

  test("emits one node per parsed type", () => {
    assertEqual(graph.nodes.length, specs.length);
  });

  test("derives edges from imports, fields and method signatures", () => {
    const edge = graph.edges.find(
      (candidate) => candidate.from === "app.service.OrderService" && candidate.to === "app.repository.OrderRepository"
    );

    assert(edge !== undefined, "OrderService should depend on OrderRepository");
    assert(edge!.kinds.length > 0, "every edge must record how it was inferred");
  });

  test("derives inheritance edges for superclass and interfaces", () => {
    const inheritanceProject = makeProject([
      { qualifiedName: "app.service.BaseService" },
      { qualifiedName: "app.service.OrderService", kind: "INTERFACE" },
      {
        qualifiedName: "app.service.OrderServiceImpl",
        superclass: "BaseService",
        interfaces: ["OrderService"]
      }
    ]);
    const inheritanceGraph = buildDependencyGraph(
      inheritanceProject,
      deriveSpringInsights(inheritanceProject),
      70
    );

    const extendsEdge = inheritanceGraph.edges.find(
      (e) => e.from === "app.service.OrderServiceImpl" && e.to === "app.service.BaseService"
    );
    const implementsEdge = inheritanceGraph.edges.find(
      (e) => e.from === "app.service.OrderServiceImpl" && e.to === "app.service.OrderService"
    );

    assert(extendsEdge !== undefined, "OrderServiceImpl should extend BaseService");
    assert(extendsEdge!.kinds.includes("extends"), "edge should be labelled with 'extends'");

    assert(implementsEdge !== undefined, "OrderServiceImpl should implement OrderService");
    assert(implementsEdge!.kinds.includes("implements"), "edge should be labelled with 'implements'");
  });

  test("computes fan-in, fan-out and transitive impact reach", () => {
    assertEqual(nodeFor("app.repository.OrderRepository").fanIn, 1);
    assertEqual(nodeFor("app.web.OrderController").fanIn, 0);
    assertEqual(nodeFor("app.web.OrderController").fanOut, 1);

    // impactReach answers "if I change this, what else could break?", so it
    // follows dependents, not dependencies. Nothing depends on the controller,
    // so changing it is contained; Order is reached by the whole chain
    // Controller -> Service -> Repository -> Order.
    assertEqual(nodeFor("app.web.OrderController").impactReach, 0);
    assertEqual(nodeFor("app.domain.Order").impactReach, 3);
  });

  test("counts a type nothing references as isolated", () => {
    assertEqual(nodeFor("app.util.Unreferenced").fanIn, 0);
    assertEqual(nodeFor("app.util.Unreferenced").fanOut, 0);
    assert(graph.isolatedCount >= 1, "the unreferenced type should be counted as isolated");
  });

  test("never invents an edge to a type outside the project", () => {
    const known = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      assert(known.has(edge.from) && known.has(edge.to), `edge ${edge.from} -> ${edge.to} leaves the project`);
    }
  });

  test("assigns architecture layers from Spring stereotypes", () => {
    assertEqual(nodeFor("app.web.OrderController").layer, "web");
    assertEqual(nodeFor("app.service.OrderService").layer, "service");
    assertEqual(nodeFor("app.repository.OrderRepository").layer, "persistence");
  });

  test("flags a controller that reaches straight into a repository", () => {
    const leaky = makeProject([
      { qualifiedName: "app.web.AdminController", annotations: ["Controller"], fields: [makeField("repository", "OrderRepository")], imports: ["app.repository.OrderRepository"] },
      { qualifiedName: "app.repository.OrderRepository", kind: "INTERFACE" as const }
    ]);

    const leakyGraph = buildDependencyGraph(leaky, deriveSpringInsights(leaky), 70);

    assertEqual(leakyGraph.layeringViolations.length, 1);
    assertEqual(leakyGraph.layeringViolations[0].fromLayer, "web");
    assertEqual(leakyGraph.layeringViolations[0].toLayer, "persistence");
  });

  test("summarises packages with an average risk", () => {
    const servicePackage = graph.packages.find((entry) => entry.packageName === "app.service");

    assert(servicePackage !== undefined, "expected an app.service package summary");
    assertEqual(servicePackage!.typeCount, 1);
    assertBetween(servicePackage!.averageRisk, 0, 100);
  });

  test("handles an empty project without throwing", () => {
    const empty = makeProject([]);
    const emptyGraph = buildDependencyGraph(empty, deriveSpringInsights(empty), 70);

    assertEqual(emptyGraph.nodes.length, 0);
    assertEqual(emptyGraph.edges.length, 0);
    assertEqual(emptyGraph.cycles.length, 0);
  });
});

function bandRank(band: string): number {
  return ["low", "moderate", "elevated", "high"].indexOf(band);
}
