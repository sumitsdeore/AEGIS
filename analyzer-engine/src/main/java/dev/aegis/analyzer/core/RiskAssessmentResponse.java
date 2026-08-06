package dev.aegis.analyzer.core;

import dev.aegis.analyzer.risk.RiskAssessment;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record RiskAssessmentResponse(
        AnalysisStatus status,
        String command,
        String message,
        Instant generatedAt,
        RiskAssessment riskAssessment,
        List<Diagnostic> diagnostics
) implements AnalysisResponse {
    public RiskAssessmentResponse {
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(message, "message must not be null");
        Objects.requireNonNull(generatedAt, "generatedAt must not be null");
        Objects.requireNonNull(riskAssessment, "riskAssessment must not be null");
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static RiskAssessmentResponse success(RiskAssessment riskAssessment, List<Diagnostic> diagnostics) {
        return new RiskAssessmentResponse(
                AnalysisStatus.SUCCESS,
                "risk",
                "Risk assessment completed.",
                Instant.now(),
                riskAssessment,
                diagnostics
        );
    }
}
