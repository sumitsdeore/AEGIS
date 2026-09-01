package dev.aegis.analyzer.core;

import java.util.Objects;

public record Diagnostic(
        DiagnosticSeverity severity,
        String message
) {
    public Diagnostic {
        Objects.requireNonNull(severity, "severity must not be null");
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message must not be blank");
        }
    }

    public static Diagnostic info(String message) {
        return new Diagnostic(DiagnosticSeverity.INFO, message);
    }

    public static Diagnostic warning(String message) {
        return new Diagnostic(DiagnosticSeverity.WARNING, message);
    }

    public static Diagnostic error(String message) {
        return new Diagnostic(DiagnosticSeverity.ERROR, message);
    }
}
