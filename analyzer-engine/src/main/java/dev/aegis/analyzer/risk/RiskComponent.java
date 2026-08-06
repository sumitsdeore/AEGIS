package dev.aegis.analyzer.risk;

import java.util.Objects;

public record RiskComponent(RiskFactor factor, int score, int maximumScore, String explanation) {
    public RiskComponent {
        Objects.requireNonNull(factor, "factor must not be null");
        if (score < 0 || maximumScore < 0 || score > maximumScore) {
            throw new IllegalArgumentException("risk component score must be within its maximum");
        }
        if (explanation == null || explanation.isBlank()) {
            throw new IllegalArgumentException("explanation must not be blank");
        }
    }
}
