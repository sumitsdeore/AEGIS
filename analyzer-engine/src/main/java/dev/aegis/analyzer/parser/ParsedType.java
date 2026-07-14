package dev.aegis.analyzer.parser;

import java.util.List;
import java.util.Objects;

public record ParsedType(
        String qualifiedName,
        String simpleName,
        String packageName,
        TypeKind kind,
        String sourcePath,
        List<String> modifiers,
        List<String> annotations,
        List<ParsedField> fields,
        List<ParsedMethod> methods,
        SourceRange sourceRange
) {
    public ParsedType {
        if (qualifiedName == null || qualifiedName.isBlank()) {
            throw new IllegalArgumentException("qualifiedName must not be blank");
        }
        if (simpleName == null || simpleName.isBlank()) {
            throw new IllegalArgumentException("simpleName must not be blank");
        }
        Objects.requireNonNull(packageName, "packageName must not be null");
        Objects.requireNonNull(kind, "kind must not be null");
        if (sourcePath == null || sourcePath.isBlank()) {
            throw new IllegalArgumentException("sourcePath must not be blank");
        }
        modifiers = List.copyOf(Objects.requireNonNull(modifiers, "modifiers must not be null"));
        annotations = List.copyOf(Objects.requireNonNull(annotations, "annotations must not be null"));
        fields = List.copyOf(Objects.requireNonNull(fields, "fields must not be null"));
        methods = List.copyOf(Objects.requireNonNull(methods, "methods must not be null"));
        Objects.requireNonNull(sourceRange, "sourceRange must not be null");
    }
}
