package dev.aegis.analyzer.risk;

import dev.aegis.analyzer.impact.ImpactAnalysis;

public interface RiskCalculator {
    RiskAssessment calculate(ImpactAnalysis impactAnalysis);
}
