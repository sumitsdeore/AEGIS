package dev.aegis.analyzer.cli;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

public record CliRequest(
        AnalyzerCommand command,
        Optional<Path> projectPath,
        OutputFormat outputFormat
) {
    public CliRequest {
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(projectPath, "projectPath must not be null");
        Objects.requireNonNull(outputFormat, "outputFormat must not be null");
    }

    public static CliRequest analyze(Path projectPath, OutputFormat outputFormat) {
        return new CliRequest(
                AnalyzerCommand.ANALYZE,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null")
        );
    }

    public static CliRequest graph(Path projectPath, OutputFormat outputFormat) {
        return new CliRequest(
                AnalyzerCommand.GRAPH,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null")
        );
    }

    public static CliRequest help() {
        return new CliRequest(AnalyzerCommand.HELP, Optional.empty(), OutputFormat.JSON);
    }
}
