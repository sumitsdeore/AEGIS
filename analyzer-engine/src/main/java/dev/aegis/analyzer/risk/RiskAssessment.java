package dev.aegis.analyzer.risk;

import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.impact.ImpactSummary;

import java.util.List;
import java.util.Objects;

public record RiskAssessment(
        GraphNode target,
        int score,
        RiskLevel level,
        ImpactSummary impactSummary,
        List<RiskComponent> components
) {
    public RiskAssessment {
        Objects.requireNonNull(target, "target must not be null");
        if (score < 0 || score > 100) {
            throw new IllegalArgumentException("risk score must be between 0 and 100");
        }
        Objects.requireNonNull(level, "level must not be null");
        Objects.requireNonNull(impactSummary, "impactSummary must not be null");
        components = List.copyOf(Objects.requireNonNull(components, "components must not be null"));
        int componentTotal = components.stream().mapToInt(RiskComponent::score).sum();
        if (componentTotal != score) {
            throw new IllegalArgumentException("risk score must equal the total component score");
        }
    }
}
