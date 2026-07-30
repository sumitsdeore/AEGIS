package dev.aegis.analyzer.impact;

import dev.aegis.analyzer.graph.DependencyGraph;
import dev.aegis.analyzer.graph.EdgeKind;
import dev.aegis.analyzer.graph.GraphEdge;
import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.graph.NodeKind;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

public final class GraphImpactAnalyzer implements ImpactAnalyzer {
    private static final Set<EdgeKind> EXCLUDED_IMPACT_EDGE_KINDS = Set.of(EdgeKind.DECLARES);
    private static final Set<EdgeKind> EXCLUDED_DIRECT_DEPENDENCY_EDGE_KINDS = Set.of(
            EdgeKind.DECLARES,
            EdgeKind.HAS_FIELD,
            EdgeKind.HAS_METHOD
    );
    private static final Set<String> API_ANNOTATIONS = Set.of(
            "Controller", "RestController", "RequestMapping", "GetMapping", "PostMapping", "PutMapping", "PatchMapping", "DeleteMapping"
    );

    @Override
    public ImpactAnalysis analyze(DependencyGraph graph, String targetReference, int maxDepth) {
        Objects.requireNonNull(graph, "graph must not be null");
        if (targetReference == null || targetReference.isBlank()) {
            throw new ImpactAnalysisException("Impact target must not be blank.");
        }
        if (maxDepth < 1) {
            throw new ImpactAnalysisException("Impact traversal depth must be at least 1.");
        }

        Map<String, GraphNode> nodesById = graph.nodes().stream().collect(
                java.util.stream.Collectors.toMap(GraphNode::id, node -> node, (left, right) -> left, TreeMap::new)
        );
        GraphNode target = resolveTarget(nodesById, targetReference);
        Map<String, List<GraphEdge>> incomingEdges = incomingEdges(graph.edges());
        Map<String, List<GraphEdge>> outgoingEdges = outgoingEdges(graph.edges());
        List<GraphNode> directDependencies = directDependencies(target.id(), nodesById, outgoingEdges);
        List<ImpactedNode> impactedNodes = reverseTraverse(target.id(), nodesById, incomingEdges, maxDepth);

        List<ImpactedNode> directDependents = impactedNodes.stream()
                .filter(node -> node.distance() == 1)
                .toList();
        List<ImpactedNode> indirectDependents = impactedNodes.stream()
                .filter(node -> node.distance() > 1)
                .toList();
        List<ImpactedNode> impactedApis = impactedNodes.stream()
                .filter(node -> hasAnyAnnotation(node.node(), outgoingEdges, nodesById, API_ANNOTATIONS))
                .toList();
        List<ImpactedNode> impactedServices = impactedNodes.stream()
                .filter(node -> hasAnyAnnotation(node.node(), outgoingEdges, nodesById, Set.of("Service")))
                .toList();
        List<ImpactedNode> impactedRepositories = impactedNodes.stream()
                .filter(node -> hasAnyAnnotation(node.node(), outgoingEdges, nodesById, Set.of("Repository")))
                .toList();
        List<String> impactedPackages = impactedNodes.stream()
                .map(impactedNode -> impactedNode.node().packageName())
                .filter(packageName -> !packageName.isBlank() && !packageName.equals("(default)"))
                .collect(java.util.stream.Collectors.toCollection(TreeSet::new))
                .stream()
                .toList();

        return new ImpactAnalysis(
                target,
                directDependencies,
                directDependents,
                indirectDependents,
                impactedApis,
                impactedServices,
                impactedRepositories,
                impactedPackages,
                new ImpactSummary(
                        directDependencies.size(),
                        directDependents.size(),
                        indirectDependents.size(),
                        impactedApis.size(),
                        impactedServices.size(),
                        impactedRepositories.size(),
                        impactedPackages.size()
                )
        );
    }

    private GraphNode resolveTarget(Map<String, GraphNode> nodesById, String targetReference) {
        GraphNode exactIdMatch = nodesById.get(targetReference);
        if (exactIdMatch != null) {
            return exactIdMatch;
        }

        List<GraphNode> qualifiedNameMatches = nodesById.values().stream()
                .filter(node -> node.qualifiedName().equals(targetReference))
                .toList();
        if (qualifiedNameMatches.size() == 1) {
            return qualifiedNameMatches.getFirst();
        }
        if (qualifiedNameMatches.size() > 1) {
            throw new ImpactAnalysisException("Impact target '%s' is ambiguous. Use its graph node ID.".formatted(targetReference));
        }

        throw new ImpactAnalysisException("Impact target '%s' was not found in the dependency graph.".formatted(targetReference));
    }

    private Map<String, List<GraphEdge>> incomingEdges(List<GraphEdge> edges) {
        return indexEdges(edges, GraphEdge::targetId);
    }

    private Map<String, List<GraphEdge>> outgoingEdges(List<GraphEdge> edges) {
        return indexEdges(edges, GraphEdge::sourceId);
    }

    private Map<String, List<GraphEdge>> indexEdges(
            List<GraphEdge> edges,
            java.util.function.Function<GraphEdge, String> keyMapper
    ) {
        Map<String, List<GraphEdge>> indexedEdges = new TreeMap<>();
        for (GraphEdge edge : edges.stream().sorted(Comparator.comparing(GraphEdge::id)).toList()) {
            indexedEdges.computeIfAbsent(keyMapper.apply(edge), ignored -> new ArrayList<>()).add(edge);
        }
        return indexedEdges;
    }

    private List<GraphNode> directDependencies(
            String targetId,
            Map<String, GraphNode> nodesById,
            Map<String, List<GraphEdge>> outgoingEdges
    ) {
        Set<String> dependencySourceIds = new TreeSet<>();
        dependencySourceIds.add(targetId);
        GraphNode target = requireNode(nodesById, targetId);
        if (target.kind() == NodeKind.TYPE) {
            outgoingEdges.getOrDefault(targetId, List.of()).stream()
                    .filter(edge -> edge.kind() == EdgeKind.HAS_FIELD || edge.kind() == EdgeKind.HAS_METHOD)
                    .map(GraphEdge::targetId)
                    .forEach(dependencySourceIds::add);
        }

        return dependencySourceIds.stream()
                .flatMap(sourceId -> outgoingEdges.getOrDefault(sourceId, List.of()).stream())
                .filter(edge -> !EXCLUDED_DIRECT_DEPENDENCY_EDGE_KINDS.contains(edge.kind()))
                .map(GraphEdge::targetId)
                .map(nodesById::get)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(GraphNode::id))
                .toList();
    }

    private List<ImpactedNode> reverseTraverse(
            String targetId,
            Map<String, GraphNode> nodesById,
            Map<String, List<GraphEdge>> incomingEdges,
            int maxDepth
    ) {
        Map<String, ImpactPath> pathsByNodeId = new HashMap<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        pathsByNodeId.put(targetId, ImpactPath.start(targetId));
        queue.add(targetId);

        while (!queue.isEmpty()) {
            String currentNodeId = queue.removeFirst();
            ImpactPath currentPath = pathsByNodeId.get(currentNodeId);
            if (currentPath.distance() >= maxDepth) {
                continue;
            }

            for (GraphEdge edge : incomingEdges.getOrDefault(currentNodeId, List.of())) {
                if (EXCLUDED_IMPACT_EDGE_KINDS.contains(edge.kind()) || pathsByNodeId.containsKey(edge.sourceId())) {
                    continue;
                }

                ImpactPath nextPath = currentPath.append(edge.sourceId(), edge.id());
                pathsByNodeId.put(edge.sourceId(), nextPath);
                queue.addLast(edge.sourceId());
            }
        }

        return pathsByNodeId.entrySet().stream()
                .filter(entry -> !entry.getKey().equals(targetId))
                .map(entry -> new ImpactedNode(requireNode(nodesById, entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparingInt(ImpactedNode::distance).thenComparing(node -> node.node().id()))
                .toList();
    }

    private boolean hasAnyAnnotation(
            GraphNode node,
            Map<String, List<GraphEdge>> outgoingEdges,
            Map<String, GraphNode> nodesById,
            Set<String> annotationNames
    ) {
        if (node.kind() != NodeKind.TYPE && node.kind() != NodeKind.METHOD) {
            return false;
        }

        return outgoingEdges.getOrDefault(node.id(), List.of()).stream()
                .filter(edge -> edge.kind() == EdgeKind.ANNOTATED_WITH)
                .map(GraphEdge::targetId)
                .map(nodesById::get)
                .filter(Objects::nonNull)
                .map(GraphNode::label)
                .anyMatch(annotationNames::contains);
    }

    private GraphNode requireNode(Map<String, GraphNode> nodesById, String nodeId) {
        GraphNode node = nodesById.get(nodeId);
        if (node == null) {
            throw new ImpactAnalysisException("Dependency graph edge references missing node '%s'.".formatted(nodeId));
        }
        return node;
    }
}
