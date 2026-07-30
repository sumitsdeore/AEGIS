package dev.aegis.analyzer.impact;

public record ImpactSummary(
        int directDependencyCount,
        int directDependentCount,
        int indirectDependentCount,
        int impactedApiCount,
        int impactedServiceCount,
        int impactedRepositoryCount,
        int impactedPackageCount
) {
    public ImpactSummary {
        if (directDependencyCount < 0 || directDependentCount < 0 || indirectDependentCount < 0
                || impactedApiCount < 0 || impactedServiceCount < 0 || impactedRepositoryCount < 0
                || impactedPackageCount < 0) {
            throw new IllegalArgumentException("impact summary counts must not be negative");
        }
    }
}
