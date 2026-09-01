package dev.aegis.analyzer.parser;

import java.util.List;
import java.util.Objects;

public record ParsedJavaFile(
        String sourceRoot,
        String relativePath,
        String packageName,
        List<String> imports,
        List<ParsedType> types,
        List<ParseDiagnostic> diagnostics
) {
    public ParsedJavaFile {
        if (sourceRoot == null || sourceRoot.isBlank()) {
            throw new IllegalArgumentException("sourceRoot must not be blank");
        }
        if (relativePath == null || relativePath.isBlank()) {
            throw new IllegalArgumentException("relativePath must not be blank");
        }
        Objects.requireNonNull(packageName, "packageName must not be null");
        imports = List.copyOf(Objects.requireNonNull(imports, "imports must not be null"));
        types = List.copyOf(Objects.requireNonNull(types, "types must not be null"));
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static ParsedJavaFile empty(
            String sourceRoot,
            String relativePath,
            String packageName,
            List<ParseDiagnostic> diagnostics
    ) {
        return new ParsedJavaFile(sourceRoot, relativePath, packageName, List.of(), List.of(), diagnostics);
    }
}
