package dev.aegis.analyzer.parser;

public record ParsedParameter(
        String name,
        String type
) {
    public ParsedParameter {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("type must not be blank");
        }
    }
}
