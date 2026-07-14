package dev.aegis.analyzer.cli;

public final class CliParseException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public CliParseException(String message) {
        super(message);
    }
}
