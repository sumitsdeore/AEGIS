package dev.aegis.analyzer.parser;

import dev.aegis.analyzer.core.DiagnosticSeverity;

import java.util.Objects;

public record ParseDiagnostic(
        DiagnosticSeverity severity,
        String sourcePath,
        String message,
        int line,
        int column
) {
    public ParseDiagnostic {
        Objects.requireNonNull(severity, "severity must not be null");
        Objects.requireNonNull(sourcePath, "sourcePath must not be null");
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message must not be blank");
        }
        if (line < 0 || column < 0) {
            throw new IllegalArgumentException("diagnostic positions must not be negative");
        }
    }

    public static ParseDiagnostic warning(String sourcePath, String message, int line, int column) {
        return new ParseDiagnostic(DiagnosticSeverity.WARNING, sourcePath, message, line, column);
    }

    public static ParseDiagnostic error(String sourcePath, String message, int line, int column) {
        return new ParseDiagnostic(DiagnosticSeverity.ERROR, sourcePath, message, line, column);
    }
}
