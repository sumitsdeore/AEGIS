package dev.aegis.analyzer.impact;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public record ImpactPath(List<String> nodeIds, List<String> edgeIds) {
    public ImpactPath {
        nodeIds = List.copyOf(Objects.requireNonNull(nodeIds, "nodeIds must not be null"));
        edgeIds = List.copyOf(Objects.requireNonNull(edgeIds, "edgeIds must not be null"));
        if (nodeIds.isEmpty() || edgeIds.size() != nodeIds.size() - 1) {
            throw new IllegalArgumentException("path nodes and edges must form a connected traversal");
        }
    }

    public static ImpactPath start(String targetId) {
        return new ImpactPath(List.of(Objects.requireNonNull(targetId, "targetId must not be null")), List.of());
    }

    public ImpactPath append(String nodeId, String edgeId) {
        List<String> nextNodeIds = new ArrayList<>(nodeIds);
        nextNodeIds.add(Objects.requireNonNull(nodeId, "nodeId must not be null"));
        List<String> nextEdgeIds = new ArrayList<>(edgeIds);
        nextEdgeIds.add(Objects.requireNonNull(edgeId, "edgeId must not be null"));
        return new ImpactPath(nextNodeIds, nextEdgeIds);
    }

    public int distance() {
        return edgeIds.size();
    }
}
