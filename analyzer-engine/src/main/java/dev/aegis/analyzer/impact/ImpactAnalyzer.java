package dev.aegis.analyzer.impact;

import dev.aegis.analyzer.graph.DependencyGraph;

public interface ImpactAnalyzer {
    ImpactAnalysis analyze(DependencyGraph graph, String targetReference, int maxDepth);
}
