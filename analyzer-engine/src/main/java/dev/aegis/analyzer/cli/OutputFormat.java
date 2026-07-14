package dev.aegis.analyzer.cli;

import java.util.Locale;

public enum OutputFormat {
    JSON;

    public static OutputFormat fromCliValue(String value) {
        if (value == null || value.isBlank()) {
            throw new CliParseException("Output format must not be blank.");
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals(JSON.name())) {
            return JSON;
        }

        throw new CliParseException("Unsupported output format '%s'. Only 'json' is supported.".formatted(value));
    }
}
