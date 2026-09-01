package dev.aegis.analyzer.core;

import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.ProjectScanResult;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record AnalyzerResponse(
        AnalysisStatus status,
        String command,
        String message,
        Instant generatedAt,
        ProjectScanResult project,
        ParsedProject parsedProject,
        List<Diagnostic> diagnostics
) {
    public AnalyzerResponse {
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(message, "message must not be null");
        Objects.requireNonNull(generatedAt, "generatedAt must not be null");
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static AnalyzerResponse success(String command, String message, ProjectScanResult project, List<Diagnostic> diagnostics) {
        return success(command, message, project, null, diagnostics);
    }

    public static AnalyzerResponse success(
            String command,
            String message,
            ProjectScanResult project,
            ParsedProject parsedProject,
            List<Diagnostic> diagnostics
    ) {
        return new AnalyzerResponse(AnalysisStatus.SUCCESS, command, message, Instant.now(), project, parsedProject, diagnostics);
    }

    public static AnalyzerResponse error(String command, String message, List<Diagnostic> diagnostics) {
        return new AnalyzerResponse(AnalysisStatus.ERROR, command, message, Instant.now(), null, null, diagnostics);
    }
}
