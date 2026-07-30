package dev.aegis.analyzer.impact;

import dev.aegis.analyzer.graph.GraphNode;

import java.util.Objects;

public record ImpactedNode(GraphNode node, ImpactPath path) {
    public ImpactedNode {
        Objects.requireNonNull(node, "node must not be null");
        Objects.requireNonNull(path, "path must not be null");
        if (!node.id().equals(path.nodeIds().getLast())) {
            throw new IllegalArgumentException("impact path must end at the impacted node");
        }
    }

    public int distance() {
        return path.distance();
    }
}
