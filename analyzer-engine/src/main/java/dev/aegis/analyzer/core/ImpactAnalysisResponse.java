package dev.aegis.analyzer.core;

import dev.aegis.analyzer.impact.ImpactAnalysis;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record ImpactAnalysisResponse(
        AnalysisStatus status,
        String command,
        String message,
        Instant generatedAt,
        ImpactAnalysis impactAnalysis,
        List<Diagnostic> diagnostics
) implements AnalysisResponse {
    public ImpactAnalysisResponse {
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(message, "message must not be null");
        Objects.requireNonNull(generatedAt, "generatedAt must not be null");
        Objects.requireNonNull(impactAnalysis, "impactAnalysis must not be null");
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static ImpactAnalysisResponse success(ImpactAnalysis impactAnalysis, List<Diagnostic> diagnostics) {
        return new ImpactAnalysisResponse(
                AnalysisStatus.SUCCESS,
                "impact",
                "Impact analysis completed.",
                Instant.now(),
                impactAnalysis,
                diagnostics
        );
    }
}
