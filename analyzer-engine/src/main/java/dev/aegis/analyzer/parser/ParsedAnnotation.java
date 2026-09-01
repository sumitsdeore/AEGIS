package dev.aegis.analyzer.parser;

import java.util.Map;
import java.util.Objects;

public record ParsedAnnotation(
        String name,
        Map<String, String> arguments
) {
    public ParsedAnnotation {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        arguments = Map.copyOf(Objects.requireNonNull(arguments, "arguments must not be null"));
    }

    public static ParsedAnnotation marker(String name) {
        return new ParsedAnnotation(name, Map.of());
    }

    public static ParsedAnnotation single(String name, String value) {
        return new ParsedAnnotation(name, Map.of("value", Objects.requireNonNull(value, "value must not be null")));
    }
}
