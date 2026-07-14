package dev.aegis.analyzer.parser;

public record SourceRange(
        int beginLine,
        int beginColumn,
        int endLine,
        int endColumn
) {
    public SourceRange {
        if (beginLine < 0 || beginColumn < 0 || endLine < 0 || endColumn < 0) {
            throw new IllegalArgumentException("source range positions must not be negative");
        }
    }

    public static SourceRange unknown() {
        return new SourceRange(0, 0, 0, 0);
    }
}
