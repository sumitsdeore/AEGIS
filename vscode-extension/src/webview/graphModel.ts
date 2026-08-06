import type { DependencyGraph, DependencyGraphEdge, DependencyGraphNode } from "../types/analyzer";

export interface VisibleGraph {
  readonly nodes: readonly DependencyGraphNode[];
  readonly edges: readonly DependencyGraphEdge[];
}

export function getVisibleGraph(
  graph: DependencyGraph,
  expandedTypeIds: ReadonlySet<string>,
  nodeKindFilter: string
): VisibleGraph {
  const memberOwnerIds = new Map<string, string>();
  for (const edge of graph.edges) {
    if (edge.kind === "HAS_FIELD" || edge.kind === "HAS_METHOD") {
      memberOwnerIds.set(edge.targetId, edge.sourceId);
    }
  }

  const nodes = graph.nodes.filter((node) => {
    const memberOwnerId = memberOwnerIds.get(node.id);
    const isVisibleMember = memberOwnerId === undefined || expandedTypeIds.has(memberOwnerId);
    const matchesFilter = nodeKindFilter === "ALL" || node.kind === nodeKindFilter;
    return isVisibleMember && matchesFilter;
  });
  const visibleNodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId));

  return { nodes, edges };
}

export function typeHasMembers(graph: DependencyGraph, typeId: string): boolean {
  return graph.edges.some((edge) => edge.sourceId === typeId && (edge.kind === "HAS_FIELD" || edge.kind === "HAS_METHOD"));
}
