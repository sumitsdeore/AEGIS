package dev.aegis.analyzer.graph;

import java.util.List;
import java.util.Objects;

public record DependencyGraph(
        String projectPath,
        int nodeCount,
        int edgeCount,
        List<GraphNode> nodes,
        List<GraphEdge> edges
) {
    public DependencyGraph {
        if (projectPath == null || projectPath.isBlank()) {
            throw new IllegalArgumentException("projectPath must not be blank");
        }
        if (nodeCount < 0 || edgeCount < 0) {
            throw new IllegalArgumentException("graph counts must not be negative");
        }
        nodes = List.copyOf(Objects.requireNonNull(nodes, "nodes must not be null"));
        edges = List.copyOf(Objects.requireNonNull(edges, "edges must not be null"));
    }

    public static DependencyGraph of(String projectPath, List<GraphNode> nodes, List<GraphEdge> edges) {
        List<GraphNode> copiedNodes = List.copyOf(Objects.requireNonNull(nodes, "nodes must not be null"));
        List<GraphEdge> copiedEdges = List.copyOf(Objects.requireNonNull(edges, "edges must not be null"));
        return new DependencyGraph(projectPath, copiedNodes.size(), copiedEdges.size(), copiedNodes, copiedEdges);
    }
}
