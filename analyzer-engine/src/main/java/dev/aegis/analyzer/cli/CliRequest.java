package dev.aegis.analyzer.cli;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

public record CliRequest(
        AnalyzerCommand command,
        Optional<Path> projectPath,
        OutputFormat outputFormat,
        Optional<String> target,
        int maxDepth
) {
    public CliRequest {
        Objects.requireNonNull(command, "command must not be null");
        Objects.requireNonNull(projectPath, "projectPath must not be null");
        Objects.requireNonNull(outputFormat, "outputFormat must not be null");
        Objects.requireNonNull(target, "target must not be null");
        if (maxDepth < 1) {
            throw new IllegalArgumentException("maxDepth must be at least 1");
        }
    }

    public static CliRequest analyze(Path projectPath, OutputFormat outputFormat) {
        return new CliRequest(
                AnalyzerCommand.ANALYZE,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null"),
                Optional.empty(),
                10
        );
    }

    public static CliRequest graph(Path projectPath, OutputFormat outputFormat) {
        return new CliRequest(
                AnalyzerCommand.GRAPH,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null"),
                Optional.empty(),
                10
        );
    }

    public static CliRequest impact(Path projectPath, OutputFormat outputFormat, String target, int maxDepth) {
        return new CliRequest(
                AnalyzerCommand.IMPACT,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null"),
                Optional.of(requireTarget(target)),
                maxDepth
        );
    }

    public static CliRequest risk(Path projectPath, OutputFormat outputFormat, String target, int maxDepth) {
        return new CliRequest(
                AnalyzerCommand.RISK,
                Optional.of(Objects.requireNonNull(projectPath, "projectPath must not be null")),
                Objects.requireNonNull(outputFormat, "outputFormat must not be null"),
                Optional.of(requireTarget(target)),
                maxDepth
        );
    }

    public static CliRequest help() {
        return new CliRequest(AnalyzerCommand.HELP, Optional.empty(), OutputFormat.JSON, Optional.empty(), 10);
    }

    private static String requireTarget(String target) {
        if (target == null || target.isBlank()) {
            throw new IllegalArgumentException("target must not be blank");
        }
        return target;
    }
}
