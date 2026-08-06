package dev.aegis.analyzer.risk;

import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.impact.ImpactAnalysis;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public final class DeterministicRiskCalculator implements RiskCalculator {
    private static final int FAN_IN_MAXIMUM = 25;
    private static final int FAN_OUT_MAXIMUM = 15;
    private static final int PUBLIC_EXPOSURE_MAXIMUM = 10;
    private static final int TRANSITIVE_IMPACT_MAXIMUM = 20;
    private static final int PACKAGE_EXPOSURE_MAXIMUM = 10;
    private static final int LAYER_IMPORTANCE_MAXIMUM = 20;

    @Override
    public RiskAssessment calculate(ImpactAnalysis impactAnalysis) {
        Objects.requireNonNull(impactAnalysis, "impactAnalysis must not be null");

        List<RiskComponent> components = new ArrayList<>();
        components.add(fanIn(impactAnalysis));
        components.add(fanOut(impactAnalysis));
        components.add(publicExposure(impactAnalysis.target()));
        components.add(transitiveImpact(impactAnalysis));
        components.add(packageExposure(impactAnalysis));
        components.add(layerImportance(impactAnalysis.target()));

        int score = components.stream().mapToInt(RiskComponent::score).sum();
        return new RiskAssessment(
                impactAnalysis.target(),
                score,
                levelFor(score),
                impactAnalysis.summary(),
                components
        );
    }

    private RiskComponent fanIn(ImpactAnalysis impactAnalysis) {
        int directDependents = impactAnalysis.summary().directDependentCount();
        int score = capped(directDependents * 6, FAN_IN_MAXIMUM);
        return new RiskComponent(
                RiskFactor.FAN_IN,
                score,
                FAN_IN_MAXIMUM,
                "%d direct dependent node(s) contribute %d point(s).".formatted(directDependents, score)
        );
    }

    private RiskComponent fanOut(ImpactAnalysis impactAnalysis) {
        int directDependencies = impactAnalysis.summary().directDependencyCount();
        int score = capped(directDependencies * 3, FAN_OUT_MAXIMUM);
        return new RiskComponent(
                RiskFactor.FAN_OUT,
                score,
                FAN_OUT_MAXIMUM,
                "%d direct dependency node(s) contribute %d point(s).".formatted(directDependencies, score)
        );
    }

    private RiskComponent publicExposure(GraphNode target) {
        boolean isPublic = metadataValues(target, "modifiers").contains("public");
        int score = isPublic ? PUBLIC_EXPOSURE_MAXIMUM : 0;
        return new RiskComponent(
                RiskFactor.PUBLIC_EXPOSURE,
                score,
                PUBLIC_EXPOSURE_MAXIMUM,
                isPublic ? "The target is public and contributes 10 point(s)." : "The target is not public and contributes 0 point(s)."
        );
    }

    private RiskComponent transitiveImpact(ImpactAnalysis impactAnalysis) {
        int indirectDependents = impactAnalysis.summary().indirectDependentCount();
        int score = capped(indirectDependents * 5, TRANSITIVE_IMPACT_MAXIMUM);
        return new RiskComponent(
                RiskFactor.TRANSITIVE_IMPACT,
                score,
                TRANSITIVE_IMPACT_MAXIMUM,
                "%d indirect dependent node(s) contribute %d point(s).".formatted(indirectDependents, score)
        );
    }

    private RiskComponent packageExposure(ImpactAnalysis impactAnalysis) {
        String targetPackage = impactAnalysis.target().packageName();
        long externalPackageCount = impactAnalysis.impactedPackages().stream()
                .filter(packageName -> !packageName.equals(targetPackage))
                .count();
        int score = capped(Math.toIntExact(externalPackageCount) * 5, PACKAGE_EXPOSURE_MAXIMUM);
        return new RiskComponent(
                RiskFactor.PACKAGE_EXPOSURE,
                score,
                PACKAGE_EXPOSURE_MAXIMUM,
                "%d impacted package(s) outside the target package contribute %d point(s).".formatted(externalPackageCount, score)
        );
    }

    private RiskComponent layerImportance(GraphNode target) {
        Set<String> annotations = metadataValues(target, "annotations");
        int score;
        String layer;
        if (annotations.contains("RestController") || annotations.contains("Controller") || annotations.contains("RequestMapping")) {
            score = 20;
            layer = "API";
        } else if (annotations.contains("Service") || annotations.contains("Configuration")) {
            score = 15;
            layer = annotations.contains("Service") ? "service" : "configuration";
        } else if (annotations.contains("Repository")) {
            score = 10;
            layer = "repository";
        } else if (annotations.contains("Component")) {
            score = 8;
            layer = "component";
        } else {
            score = 5;
            layer = "unclassified";
        }

        return new RiskComponent(
                RiskFactor.LAYER_IMPORTANCE,
                score,
                LAYER_IMPORTANCE_MAXIMUM,
                "%s layer importance contributes %d point(s).".formatted(layer, score)
        );
    }

    private Set<String> metadataValues(GraphNode node, String key) {
        String value = node.metadata().getOrDefault(key, "");
        if (value.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(value.split(","))
                .filter(annotation -> !annotation.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    private int capped(int score, int maximum) {
        return Math.min(score, maximum);
    }

    private RiskLevel levelFor(int score) {
        if (score >= 75) {
            return RiskLevel.CRITICAL;
        }
        if (score >= 50) {
            return RiskLevel.HIGH;
        }
        if (score >= 25) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }
}
