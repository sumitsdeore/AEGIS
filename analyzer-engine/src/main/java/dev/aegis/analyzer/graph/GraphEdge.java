package dev.aegis.analyzer.graph;

import java.util.Map;
import java.util.Objects;

public record GraphEdge(
        String id,
        String sourceId,
        String targetId,
        EdgeKind kind,
        String label,
        Map<String, String> metadata
) {
    public GraphEdge {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id must not be blank");
        }
        if (sourceId == null || sourceId.isBlank()) {
            throw new IllegalArgumentException("sourceId must not be blank");
        }
        if (targetId == null || targetId.isBlank()) {
            throw new IllegalArgumentException("targetId must not be blank");
        }
        Objects.requireNonNull(kind, "kind must not be null");
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("label must not be blank");
        }
        metadata = Map.copyOf(Objects.requireNonNull(metadata, "metadata must not be null"));
    }

    public static GraphEdge of(String sourceId, String targetId, EdgeKind kind, String label) {
        return of(sourceId, targetId, kind, label, Map.of());
    }

    public static GraphEdge of(
            String sourceId,
            String targetId,
            EdgeKind kind,
            String label,
            Map<String, String> metadata
    ) {
        String id = "%s|%s|%s|%s".formatted(kind, sourceId, targetId, label);
        return new GraphEdge(id, sourceId, targetId, kind, label, metadata);
    }
}
