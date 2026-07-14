package dev.aegis.analyzer.graph;

import dev.aegis.analyzer.parser.ParsedProject;

public interface DependencyGraphBuilder {
    DependencyGraph build(ParsedProject parsedProject);
}
