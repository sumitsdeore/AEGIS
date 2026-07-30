package dev.aegis.analyzer.impact;

import dev.aegis.analyzer.graph.GraphNode;

import java.util.List;
import java.util.Objects;

public record ImpactAnalysis(
        GraphNode target,
        List<GraphNode> directDependencies,
        List<ImpactedNode> directDependents,
        List<ImpactedNode> indirectDependents,
        List<ImpactedNode> impactedApis,
        List<ImpactedNode> impactedServices,
        List<ImpactedNode> impactedRepositories,
        List<String> impactedPackages,
        ImpactSummary summary
) {
    public ImpactAnalysis {
        Objects.requireNonNull(target, "target must not be null");
        directDependencies = List.copyOf(Objects.requireNonNull(directDependencies, "directDependencies must not be null"));
        directDependents = List.copyOf(Objects.requireNonNull(directDependents, "directDependents must not be null"));
        indirectDependents = List.copyOf(Objects.requireNonNull(indirectDependents, "indirectDependents must not be null"));
        impactedApis = List.copyOf(Objects.requireNonNull(impactedApis, "impactedApis must not be null"));
        impactedServices = List.copyOf(Objects.requireNonNull(impactedServices, "impactedServices must not be null"));
        impactedRepositories = List.copyOf(Objects.requireNonNull(impactedRepositories, "impactedRepositories must not be null"));
        impactedPackages = List.copyOf(Objects.requireNonNull(impactedPackages, "impactedPackages must not be null"));
        Objects.requireNonNull(summary, "summary must not be null");
    }
}
