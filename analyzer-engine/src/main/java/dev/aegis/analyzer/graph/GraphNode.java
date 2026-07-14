package dev.aegis.analyzer.graph;

import java.util.Map;
import java.util.Objects;

public record GraphNode(
        String id,
        String label,
        String qualifiedName,
        NodeKind kind,
        String packageName,
        String sourcePath,
        Map<String, String> metadata
) {
    public GraphNode {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id must not be blank");
        }
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("label must not be blank");
        }
        if (qualifiedName == null || qualifiedName.isBlank()) {
            throw new IllegalArgumentException("qualifiedName must not be blank");
        }
        Objects.requireNonNull(kind, "kind must not be null");
        Objects.requireNonNull(packageName, "packageName must not be null");
        Objects.requireNonNull(sourcePath, "sourcePath must not be null");
        metadata = Map.copyOf(Objects.requireNonNull(metadata, "metadata must not be null"));
    }

    public static GraphNode packageNode(String packageName) {
        String normalizedPackage = packageName == null || packageName.isBlank() ? "(default)" : packageName;
        return new GraphNode(
                "package:%s".formatted(normalizedPackage),
                normalizedPackage,
                normalizedPackage,
                NodeKind.PACKAGE,
                normalizedPackage,
                "",
                Map.of()
        );
    }

    public static GraphNode typeNode(
            String qualifiedName,
            String simpleName,
            NodeKind kind,
            String packageName,
            String sourcePath,
            Map<String, String> metadata
    ) {
        return new GraphNode(
                "type:%s".formatted(qualifiedName),
                simpleName,
                qualifiedName,
                kind,
                packageName,
                sourcePath,
                metadata
        );
    }

    public static GraphNode externalTypeNode(String typeName) {
        return new GraphNode(
                "external-type:%s".formatted(typeName),
                typeName,
                typeName,
                NodeKind.EXTERNAL_TYPE,
                "",
                "",
                Map.of()
        );
    }

    public static GraphNode annotationNode(String annotationName) {
        return new GraphNode(
                "annotation:%s".formatted(annotationName),
                annotationName,
                annotationName,
                NodeKind.ANNOTATION,
                "",
                "",
                Map.of()
        );
    }
}
