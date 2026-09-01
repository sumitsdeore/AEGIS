package dev.aegis.analyzer.scanner;

import dev.aegis.analyzer.core.Diagnostic;

import java.util.List;
import java.util.Objects;

public record ProjectScanResult(
        String projectPath,
        BuildTool buildTool,
        List<String> sourceRoots,
        List<Diagnostic> diagnostics
) {
    public ProjectScanResult {
        if (projectPath == null || projectPath.isBlank()) {
            throw new IllegalArgumentException("projectPath must not be blank");
        }
        Objects.requireNonNull(buildTool, "buildTool must not be null");
        sourceRoots = List.copyOf(Objects.requireNonNull(sourceRoots, "sourceRoots must not be null"));
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }
}
