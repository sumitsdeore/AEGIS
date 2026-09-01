import type { ParsedProject, ParsedType, SourceRange, TypeKind } from "../types/analyzer";
import { collectTypes } from "../types/analyzer";
import type { ArchitectureLayer, SpringInsights } from "./insights";
import { layerRank } from "./insights";

/**
 * Dependency graph construction, impact analysis, and risk scoring.
 *
 * DERIVATION NOTE: the analyzer does not yet emit `extends`/`implements` edges
 * or resolved symbol bindings, so relationships here are inferred from three
 * observable signals: project-internal imports, field types, and method
 * signatures. Every edge records which signals produced it so the dashboard can
 * show its provenance rather than presenting inference as ground truth.
 */

/** Why an edge exists. Shown in the UI so inference is auditable. */
export type EdgeKind = "import" | "field" | "signature" | "extends" | "implements";

/**
 * How many types the impact graph draws.
 *
 * A force layout of several hundred nodes in a webview becomes illegible before
 * it becomes slow, so the graph keeps the highest-risk types — `buildGraph`
 * returns nodes already ordered by score — and the panel discloses how many it
 * left out.
 *
 * Exported because three places have to agree on this number: the client script
 * that renders the nodes, the footnote that reports the cut, and
 * `AEGIS: Reveal Type`, which must not offer to reveal a type the graph never
 * drew.
 */
export const GRAPH_RENDER_LIMIT = 140;

export interface GraphNode {
  readonly id: string;
  readonly simpleName: string;
  readonly packageName: string;
  readonly kind: TypeKind;
  readonly sourcePath: string;
  readonly sourceRange: SourceRange;
  readonly superclass?: string | null;
  readonly interfaces?: readonly string[];
  readonly methodCount: number;
  readonly fieldCount: number;
  readonly annotations: readonly string[];
  readonly layer: ArchitectureLayer;
  readonly stereotypeLabel?: string;
  /** Number of types that depend on this one. */
  readonly fanIn: number;
  /** Number of types this one depends on. */
  readonly fanOut: number;
  /** Transitive count of types that would be affected by changing this one. */
  readonly impactReach: number;
  readonly risk: RiskAssessment;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly kinds: readonly EdgeKind[];
  /** Number of distinct references observed, used for edge weighting. */
  readonly weight: number;
}

export type RiskBand = "low" | "moderate" | "elevated" | "high";

export interface RiskFactor {
  readonly label: string;
  /** Points contributed to the 0-100 score. */
  readonly points: number;
  readonly maxPoints: number;
  readonly detail: string;
}

export interface RiskAssessment {
  readonly score: number;
  readonly band: RiskBand;
  readonly factors: readonly RiskFactor[];
}

export interface DependencyCycle {
  readonly members: readonly string[];
}

export interface LayeringViolation {
  readonly from: string;
  readonly to: string;
  readonly fromLayer: ArchitectureLayer;
  readonly toLayer: ArchitectureLayer;
  readonly rule: string;
}

export interface PackageSummary {
  readonly packageName: string;
  readonly typeCount: number;
  readonly methodCount: number;
  readonly fieldCount: number;
  readonly averageRisk: number;
}

export interface DependencyGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly cycles: readonly DependencyCycle[];
  readonly layeringViolations: readonly LayeringViolation[];
  readonly packages: readonly PackageSummary[];
  /** Types with no inbound or outbound project edges. */
  readonly isolatedCount: number;
  /** References that matched more than one type by simple name and were skipped. */
  readonly ambiguousReferenceCount: number;
  readonly maxFanIn: number;
  readonly maxFanOut: number;
}

/** Weights sum to 100. Kept explicit so the UI can explain each contribution. */
const RISK_WEIGHTS = {
  impactReach: 35,
  fanIn: 20,
  fanOut: 15,
  size: 15,
  layer: 15
} as const;

/**
 * How much a change in each layer tends to ripple outward. Persistence types
 * sit at the bottom of the dependency stack so their changes propagate widest;
 * controllers are usually leaves.
 */
const LAYER_CRITICALITY: Readonly<Record<ArchitectureLayer, number>> = {
  persistence: 1,
  service: 0.8,
  config: 0.6,
  "cross-cutting": 0.5,
  web: 0.35,
  bootstrap: 0.3
};

/**
 * Java language constructs and common JDK/framework types that would otherwise
 * dominate the graph. Only project-internal types become nodes anyway, but this
 * short-circuits the common cases before any index lookup.
 */
const IGNORED_TYPE_NAMES = new Set([
  "void",
  "var",
  "boolean",
  "byte",
  "char",
  "short",
  "int",
  "long",
  "float",
  "double",
  "String",
  "Object",
  "Integer",
  "Long",
  "Double",
  "Float",
  "Boolean",
  "Byte",
  "Character",
  "Short",
  "BigDecimal",
  "BigInteger",
  "List",
  "Set",
  "Map",
  "Collection",
  "Optional",
  "Stream",
  "Iterable"
]);

interface MutableNode {
  readonly type: ParsedType;
  readonly dependsOn: Map<string, Set<EdgeKind>>;
}

export function buildDependencyGraph(
  parsedProject: ParsedProject,
  springInsights: SpringInsights,
  highRiskThreshold: number
): DependencyGraph {
  const types = collectTypes(parsedProject);
  const byQualifiedName = new Map<string, ParsedType>();
  const bySimpleName = new Map<string, ParsedType[]>();

  for (const type of types) {
    byQualifiedName.set(type.qualifiedName, type);
    const bucket = bySimpleName.get(type.simpleName);
    if (bucket) {
      bucket.push(type);
    } else {
      bySimpleName.set(type.simpleName, [type]);
    }
  }

  const stereotypeByName = new Map(
    springInsights.components.map((component) => [component.qualifiedName, component])
  );

  const mutableNodes = new Map<string, MutableNode>();
  for (const type of types) {
    mutableNodes.set(type.qualifiedName, { type, dependsOn: new Map() });
  }

  let ambiguousReferenceCount = 0;

  const addDependency = (from: ParsedType, targetQualifiedName: string, kind: EdgeKind): void => {
    if (targetQualifiedName === from.qualifiedName) {
      return; // Self-references carry no impact information.
    }
    const node = mutableNodes.get(from.qualifiedName);
    if (!node) {
      return;
    }
    const kinds = node.dependsOn.get(targetQualifiedName);
    if (kinds) {
      kinds.add(kind);
    } else {
      node.dependsOn.set(targetQualifiedName, new Set([kind]));
    }
  };

  const resolve = (reference: string, from: ParsedType): string | undefined => {
    if (IGNORED_TYPE_NAMES.has(reference)) {
      return undefined;
    }

    // Fully qualified reference.
    if (byQualifiedName.has(reference)) {
      return reference;
    }

    const candidates = bySimpleName.get(reference);
    if (!candidates || candidates.length === 0) {
      return undefined;
    }
    if (candidates.length === 1) {
      return candidates[0].qualifiedName;
    }

    // Ambiguous simple name: prefer a same-package match, otherwise skip rather
    // than guess and draw a misleading edge.
    const samePackage = candidates.find((candidate) => candidate.packageName === from.packageName);
    if (samePackage) {
      return samePackage.qualifiedName;
    }

    ambiguousReferenceCount += 1;
    return undefined;
  };

  // Imports are file-scoped, so they apply to every type declared in the file.
  for (const file of parsedProject.files) {
    for (const importEntry of file.imports) {
      const normalized = importEntry.replace(/^static\s+/, "");
      if (normalized.endsWith(".*")) {
        continue; // Wildcard imports cannot be attributed to a single type.
      }
      const target = byQualifiedName.get(normalized);
      if (!target) {
        continue;
      }
      for (const type of file.types) {
        addDependency(type, target.qualifiedName, "import");
      }
    }
  }

  for (const type of types) {
    for (const field of type.fields) {
      for (const reference of extractTypeReferences(field.type)) {
        const resolved = resolve(reference, type);
        if (resolved) {
          addDependency(type, resolved, "field");
        }
      }
    }

    for (const method of type.methods) {
      const signatureTypes = [method.returnType, ...method.parameters.map((p) => p.type)];
      for (const signatureType of signatureTypes) {
        for (const reference of extractTypeReferences(signatureType)) {
          const resolved = resolve(reference, type);
          if (resolved) {
            addDependency(type, resolved, "signature");
          }
        }
      }
    }

    if (type.superclass) {
      for (const reference of extractTypeReferences(type.superclass)) {
        const resolved = resolve(reference, type);
        if (resolved) {
          addDependency(type, resolved, "extends");
        }
      }
    }

    if (type.interfaces && type.interfaces.length > 0) {
      for (const iface of type.interfaces) {
        for (const reference of extractTypeReferences(iface)) {
          const resolved = resolve(reference, type);
          if (resolved) {
            addDependency(type, resolved, "implements");
          }
        }
      }
    }
  }

  const edges: GraphEdge[] = [];
  const dependentsOf = new Map<string, Set<string>>();
  const dependenciesOf = new Map<string, Set<string>>();

  for (const [id, node] of mutableNodes) {
    dependenciesOf.set(id, new Set(node.dependsOn.keys()));
    for (const [target, kinds] of node.dependsOn) {
      edges.push({
        from: id,
        to: target,
        kinds: [...kinds].sort(),
        weight: kinds.size
      });

      const dependents = dependentsOf.get(target);
      if (dependents) {
        dependents.add(id);
      } else {
        dependentsOf.set(target, new Set([id]));
      }
    }
  }

  const fanInOf = new Map<string, number>();
  const fanOutOf = new Map<string, number>();
  for (const id of mutableNodes.keys()) {
    fanInOf.set(id, dependentsOf.get(id)?.size ?? 0);
    fanOutOf.set(id, dependenciesOf.get(id)?.size ?? 0);
  }

  const maxFanIn = Math.max(1, ...fanInOf.values());
  const maxFanOut = Math.max(1, ...fanOutOf.values());
  const maxSize = Math.max(
    1,
    ...types.map((type) => type.methods.length + type.fields.length)
  );
  const totalTypes = Math.max(1, types.length - 1);

  const impactReachOf = new Map<string, number>();
  for (const id of mutableNodes.keys()) {
    impactReachOf.set(id, transitiveReach(id, dependentsOf));
  }

  const nodes: GraphNode[] = [];
  for (const [id, node] of mutableNodes) {
    const component = stereotypeByName.get(id);
    const layer: ArchitectureLayer = component?.layer ?? "cross-cutting";
    const fanIn = fanInOf.get(id) ?? 0;
    const fanOut = fanOutOf.get(id) ?? 0;
    const impactReach = impactReachOf.get(id) ?? 0;
    const size = node.type.methods.length + node.type.fields.length;

    nodes.push({
      id,
      simpleName: node.type.simpleName,
      packageName: node.type.packageName,
      kind: node.type.kind,
      sourcePath: node.type.sourcePath,
      sourceRange: node.type.sourceRange,
      superclass: node.type.superclass,
      interfaces: node.type.interfaces,
      methodCount: node.type.methods.length,
      fieldCount: node.type.fields.length,
      annotations: node.type.annotations,
      layer,
      stereotypeLabel: component?.stereotypeLabel,
      fanIn,
      fanOut,
      impactReach,
      risk: assessRisk(
        { impactReach, fanIn, fanOut, size, layer },
        { totalTypes, maxFanIn, maxFanOut, maxSize, highRiskThreshold }
      )
    });
  }

  nodes.sort((left, right) => right.risk.score - left.risk.score || left.id.localeCompare(right.id));

  return {
    nodes,
    edges,
    cycles: findCycles(dependenciesOf),
    layeringViolations: findLayeringViolations(nodes, edges),
    packages: summarizePackages(nodes),
    isolatedCount: nodes.filter((node) => node.fanIn === 0 && node.fanOut === 0).length,
    ambiguousReferenceCount,
    maxFanIn,
    maxFanOut
  };
}

/**
 * Splits a Java type expression into candidate simple names.
 *
 * `Map<String, List<Owner>>` yields Map, String, List, Owner; the caller filters
 * out language and JDK types. Arrays, varargs, generic bounds, and annotations
 * on types are all stripped.
 */
export function extractTypeReferences(typeText: string): string[] {
  if (!typeText) {
    return [];
  }

  const cleaned = typeText
    .replace(/\.\.\./g, "")
    .replace(/\[\]/g, "")
    .replace(/@\w+/g, "")
    .replace(/\bextends\b|\bsuper\b/g, " ")
    .replace(/[<>,&]/g, " ");

  const references = new Set<string>();
  for (const token of cleaned.split(/\s+/)) {
    const trimmed = token.trim();
    if (trimmed.length === 0 || trimmed === "?") {
      continue;
    }
    // Keep the full dotted name for qualified matches, and the last segment for
    // simple-name matches.
    references.add(trimmed);
    const lastSegment = trimmed.slice(trimmed.lastIndexOf(".") + 1);
    if (lastSegment.length > 0) {
      references.add(lastSegment);
    }
  }

  return [...references];
}

/** Breadth-first count of everything transitively reachable through `adjacency`. */
function transitiveReach(start: string, adjacency: Map<string, Set<string>>): number {
  const visited = new Set<string>([start]);
  const queue: string[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) {
      break;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  visited.delete(start);
  return visited.size;
}

interface RiskInputs {
  readonly impactReach: number;
  readonly fanIn: number;
  readonly fanOut: number;
  readonly size: number;
  readonly layer: ArchitectureLayer;
}

interface RiskScales {
  readonly totalTypes: number;
  readonly maxFanIn: number;
  readonly maxFanOut: number;
  readonly maxSize: number;
  readonly highRiskThreshold: number;
}

/**
 * Composite 0-100 risk score with a per-factor breakdown.
 *
 * Every factor is normalized against the project itself rather than an absolute
 * scale, so scores describe relative risk *within* this codebase. Comparing
 * scores across different projects is not meaningful.
 */
export function assessRisk(inputs: RiskInputs, scales: RiskScales): RiskAssessment {
  const reachRatio = clamp01(inputs.impactReach / scales.totalTypes);
  const fanInRatio = clamp01(inputs.fanIn / scales.maxFanIn);
  const fanOutRatio = clamp01(inputs.fanOut / scales.maxFanOut);
  const sizeRatio = clamp01(inputs.size / scales.maxSize);
  const layerRatio = LAYER_CRITICALITY[inputs.layer] ?? 0.5;

  const factors: RiskFactor[] = [
    {
      label: "Impact reach",
      points: round1(reachRatio * RISK_WEIGHTS.impactReach),
      maxPoints: RISK_WEIGHTS.impactReach,
      detail: `${inputs.impactReach} type(s) transitively depend on this one`
    },
    {
      label: "Direct dependents",
      points: round1(fanInRatio * RISK_WEIGHTS.fanIn),
      maxPoints: RISK_WEIGHTS.fanIn,
      detail: `${inputs.fanIn} type(s) reference it directly`
    },
    {
      label: "Outgoing coupling",
      points: round1(fanOutRatio * RISK_WEIGHTS.fanOut),
      maxPoints: RISK_WEIGHTS.fanOut,
      detail: `depends on ${inputs.fanOut} project type(s)`
    },
    {
      label: "Surface area",
      points: round1(sizeRatio * RISK_WEIGHTS.size),
      maxPoints: RISK_WEIGHTS.size,
      detail: `${inputs.size} member(s) declared`
    },
    {
      label: "Layer criticality",
      points: round1(layerRatio * RISK_WEIGHTS.layer),
      maxPoints: RISK_WEIGHTS.layer,
      detail: `${inputs.layer} layer changes propagate ${describeCriticality(layerRatio)}`
    }
  ];

  const score = Math.round(factors.reduce((total, factor) => total + factor.points, 0));

  return { score, band: toBand(score, scales.highRiskThreshold), factors };
}

function describeCriticality(ratio: number): string {
  if (ratio >= 0.8) {
    return "widely";
  }
  if (ratio >= 0.5) {
    return "moderately";
  }
  return "narrowly";
}

function toBand(score: number, highRiskThreshold: number): RiskBand {
  if (score >= highRiskThreshold) {
    return "high";
  }
  if (score >= highRiskThreshold * 0.7) {
    return "elevated";
  }
  if (score >= highRiskThreshold * 0.4) {
    return "moderate";
  }
  return "low";
}

/**
 * Finds strongly connected components with more than one member, i.e. circular
 * dependencies. Iterative Tarjan, so a deep graph cannot overflow the stack.
 */
export function findCycles(adjacency: Map<string, Set<string>>): DependencyCycle[] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: DependencyCycle[] = [];

  for (const root of adjacency.keys()) {
    if (indices.has(root)) {
      continue;
    }

    type Frame = { node: string; neighbors: string[]; position: number };
    const frames: Frame[] = [
      { node: root, neighbors: [...(adjacency.get(root) ?? [])], position: 0 }
    ];

    indices.set(root, index);
    lowLinks.set(root, index);
    index += 1;
    stack.push(root);
    onStack.add(root);

    while (frames.length > 0) {
      const frame = frames[frames.length - 1];

      if (frame.position < frame.neighbors.length) {
        const neighbor = frame.neighbors[frame.position];
        frame.position += 1;

        if (!indices.has(neighbor)) {
          indices.set(neighbor, index);
          lowLinks.set(neighbor, index);
          index += 1;
          stack.push(neighbor);
          onStack.add(neighbor);
          frames.push({
            node: neighbor,
            neighbors: [...(adjacency.get(neighbor) ?? [])],
            position: 0
          });
        } else if (onStack.has(neighbor)) {
          lowLinks.set(
            frame.node,
            Math.min(lowLinks.get(frame.node) ?? 0, indices.get(neighbor) ?? 0)
          );
        }
        continue;
      }

      frames.pop();

      if (frames.length > 0) {
        const parent = frames[frames.length - 1];
        lowLinks.set(
          parent.node,
          Math.min(lowLinks.get(parent.node) ?? 0, lowLinks.get(frame.node) ?? 0)
        );
      }

      if (lowLinks.get(frame.node) === indices.get(frame.node)) {
        const members: string[] = [];
        for (;;) {
          const popped = stack.pop();
          if (popped === undefined) {
            break;
          }
          onStack.delete(popped);
          members.push(popped);
          if (popped === frame.node) {
            break;
          }
        }
        if (members.length > 1) {
          cycles.push({ members: members.sort() });
        }
      }
    }
  }

  return cycles.sort((left, right) => right.members.length - left.members.length);
}

/**
 * Flags edges that skip a layer, most commonly a controller reaching straight
 * into a repository and bypassing the service layer.
 */
function findLayeringViolations(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[]
): LayeringViolation[] {
  const layerById = new Map(nodes.map((node) => [node.id, node.layer]));
  const violations: LayeringViolation[] = [];

  for (const edge of edges) {
    const fromLayer = layerById.get(edge.from);
    const toLayer = layerById.get(edge.to);
    if (!fromLayer || !toLayer) {
      continue;
    }

    if (fromLayer === "web" && toLayer === "persistence") {
      violations.push({
        from: edge.from,
        to: edge.to,
        fromLayer,
        toLayer,
        rule: "Web layer reaches the persistence layer directly, bypassing a service."
      });
      continue;
    }

    // Anything depending upward on the web layer inverts the intended flow.
    if (toLayer === "web" && fromLayer !== "web" && fromLayer !== "bootstrap") {
      violations.push({
        from: edge.from,
        to: edge.to,
        fromLayer,
        toLayer,
        rule: "Lower layer depends on the web layer, inverting the dependency direction."
      });
    }
  }

  return violations.sort(
    (left, right) => layerRank(left.fromLayer) - layerRank(right.fromLayer)
  );
}

function summarizePackages(nodes: readonly GraphNode[]): PackageSummary[] {
  const grouped = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    const key = node.packageName.length > 0 ? node.packageName : "(default)";
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(node);
    } else {
      grouped.set(key, [node]);
    }
  }

  return [...grouped.entries()]
    .map(([packageName, members]) => ({
      packageName,
      typeCount: members.length,
      methodCount: members.reduce((total, node) => total + node.methodCount, 0),
      fieldCount: members.reduce((total, node) => total + node.fieldCount, 0),
      averageRisk: Math.round(
        members.reduce((total, node) => total + node.risk.score, 0) / Math.max(1, members.length)
      )
    }))
    .sort((left, right) => right.typeCount - left.typeCount || left.packageName.localeCompare(right.packageName));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
