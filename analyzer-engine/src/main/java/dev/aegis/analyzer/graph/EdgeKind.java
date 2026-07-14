package dev.aegis.analyzer.graph;

public enum EdgeKind {
    DECLARES,
    IMPORTS,
    HAS_METHOD,
    HAS_FIELD,
    RETURNS,
    PARAMETER_TYPE,
    FIELD_TYPE,
    ANNOTATED_WITH
}
