package dev.aegis.analyzer.parser;

import java.util.List;
import java.util.Objects;

public record ParsedField(
        String name,
        String type,
        List<String> modifiers,
        List<String> annotations,
        SourceRange sourceRange
) {
    public ParsedField {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("type must not be blank");
        }
        modifiers = List.copyOf(Objects.requireNonNull(modifiers, "modifiers must not be null"));
        annotations = List.copyOf(Objects.requireNonNull(annotations, "annotations must not be null"));
        Objects.requireNonNull(sourceRange, "sourceRange must not be null");
    }
}
