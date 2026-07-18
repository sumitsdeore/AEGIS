package dev.aegis.analyzer.core;

import dev.aegis.analyzer.graph.DependencyGraph;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record GraphExportResponse(
        AnalysisStatus status,
        String command,
        String message,
        Instant generatedAt,
        DependencyGraph dependencyGraph,
        List<Diagnostic> diagnostics
) implements AnalysisResponse {
    public GraphExportResponse {
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(message, "message must not be null");
        Objects.requireNonNull(generatedAt, "generatedAt must not be null");
        Objects.requireNonNull(dependencyGraph, "dependencyGraph must not be null");
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static GraphExportResponse success(
            String message,
            DependencyGraph dependencyGraph,
            List<Diagnostic> diagnostics
    ) {
        return new GraphExportResponse(
                AnalysisStatus.SUCCESS,
                "graph",
                message,
                Instant.now(),
                dependencyGraph,
                diagnostics
        );
    }
}
