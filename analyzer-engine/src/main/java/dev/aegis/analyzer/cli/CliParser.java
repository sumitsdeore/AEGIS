package dev.aegis.analyzer.cli;

import java.nio.file.Path;
import java.util.Locale;

public final class CliParser {
    public CliRequest parse(String[] args) {
        if (args == null || args.length == 0) {
            throw new CliParseException("Missing command. Use 'analyze --project <path>'.");
        }

        String commandToken = args[0].trim().toLowerCase(Locale.ROOT);
        if (commandToken.equals("help") || commandToken.equals("--help") || commandToken.equals("-h")) {
            return CliRequest.help();
        }

        AnalyzerCommand command = switch (commandToken) {
            case "analyze" -> AnalyzerCommand.ANALYZE;
            case "graph" -> AnalyzerCommand.GRAPH;
            case "impact" -> AnalyzerCommand.IMPACT;
            default -> throw new CliParseException("Unknown command '%s'.".formatted(args[0]));
        };

        Path projectPath = null;
        OutputFormat outputFormat = OutputFormat.JSON;
        String target = null;
        int maxDepth = 10;

        for (int index = 1; index < args.length; index++) {
            String option = args[index];

            switch (option) {
                case "--help", "-h" -> {
                    return CliRequest.help();
                }
                case "--project", "-p" -> {
                    index = requireValue(args, index, option);
                    projectPath = Path.of(args[index]).toAbsolutePath().normalize();
                }
                case "--format" -> {
                    index = requireValue(args, index, option);
                    outputFormat = OutputFormat.fromCliValue(args[index]);
                }
                case "--target", "-t" -> {
                    index = requireValue(args, index, option);
                    target = args[index];
                }
                case "--max-depth" -> {
                    index = requireValue(args, index, option);
                    maxDepth = parseMaxDepth(args[index]);
                }
                default -> throw new CliParseException("Unknown option '%s'.".formatted(option));
            }
        }

        if (projectPath == null) {
            throw new CliParseException("Missing required option '--project <path>'.");
        }

        return switch (command) {
            case ANALYZE -> CliRequest.analyze(projectPath, outputFormat);
            case GRAPH -> CliRequest.graph(projectPath, outputFormat);
            case IMPACT -> {
                if (target == null || target.isBlank()) {
                    throw new CliParseException("Missing required option '--target <node-id-or-qualified-name>'.");
                }
                yield CliRequest.impact(projectPath, outputFormat, target, maxDepth);
            }
            case HELP -> throw new CliParseException("Help command does not accept options.");
        };
    }

    private int requireValue(String[] args, int optionIndex, String optionName) {
        int valueIndex = optionIndex + 1;
        if (valueIndex >= args.length || args[valueIndex].isBlank()) {
            throw new CliParseException("Option '%s' requires a value.".formatted(optionName));
        }
        return valueIndex;
    }

    private int parseMaxDepth(String value) {
        try {
            int maxDepth = Integer.parseInt(value);
            if (maxDepth < 1) {
                throw new CliParseException("Option '--max-depth' must be at least 1.");
            }
            return maxDepth;
        } catch (NumberFormatException exception) {
            throw new CliParseException("Option '--max-depth' must be a positive integer.");
        }
    }
}
