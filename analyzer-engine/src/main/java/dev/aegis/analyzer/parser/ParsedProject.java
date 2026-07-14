package dev.aegis.analyzer.parser;

import java.util.List;
import java.util.Objects;

public record ParsedProject(
        String projectPath,
        int fileCount,
        int typeCount,
        int methodCount,
        int fieldCount,
        List<ParsedJavaFile> files,
        List<ParseDiagnostic> diagnostics
) {
    public ParsedProject {
        if (projectPath == null || projectPath.isBlank()) {
            throw new IllegalArgumentException("projectPath must not be blank");
        }
        if (fileCount < 0 || typeCount < 0 || methodCount < 0 || fieldCount < 0) {
            throw new IllegalArgumentException("parsed counts must not be negative");
        }
        files = List.copyOf(Objects.requireNonNull(files, "files must not be null"));
        diagnostics = List.copyOf(Objects.requireNonNull(diagnostics, "diagnostics must not be null"));
    }

    public static ParsedProject fromFiles(String projectPath, List<ParsedJavaFile> files, List<ParseDiagnostic> diagnostics) {
        List<ParsedJavaFile> copiedFiles = List.copyOf(Objects.requireNonNull(files, "files must not be null"));
        int typeCount = copiedFiles.stream().mapToInt(file -> file.types().size()).sum();
        int methodCount = copiedFiles.stream()
                .flatMap(file -> file.types().stream())
                .mapToInt(type -> type.methods().size())
                .sum();
        int fieldCount = copiedFiles.stream()
                .flatMap(file -> file.types().stream())
                .mapToInt(type -> type.fields().size())
                .sum();

        return new ParsedProject(projectPath, copiedFiles.size(), typeCount, methodCount, fieldCount, copiedFiles, diagnostics);
    }
}
