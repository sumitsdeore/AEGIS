package dev.aegis.analyzer.parser;

import java.util.List;
import java.util.Objects;

public record ParsedMethod(
        String name,
        String returnType,
        List<ParsedParameter> parameters,
        List<String> modifiers,
        List<String> annotations,
        List<ParsedAnnotation> annotationDetails,
        SourceRange sourceRange
) {
    public ParsedMethod {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        if (returnType == null || returnType.isBlank()) {
            throw new IllegalArgumentException("returnType must not be blank");
        }
        parameters = List.copyOf(Objects.requireNonNull(parameters, "parameters must not be null"));
        modifiers = List.copyOf(Objects.requireNonNull(modifiers, "modifiers must not be null"));
        annotations = List.copyOf(Objects.requireNonNull(annotations, "annotations must not be null"));
        annotationDetails = List.copyOf(Objects.requireNonNull(annotationDetails, "annotationDetails must not be null"));
        Objects.requireNonNull(sourceRange, "sourceRange must not be null");
    }

    public ParsedMethod(
            String name,
            String returnType,
            List<ParsedParameter> parameters,
            List<String> modifiers,
            List<String> annotations,
            SourceRange sourceRange
    ) {
        this(name, returnType, parameters, modifiers, annotations, List.of(), sourceRange);
    }
}
