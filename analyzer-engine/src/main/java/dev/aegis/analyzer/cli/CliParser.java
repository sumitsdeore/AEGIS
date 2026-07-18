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
            default -> throw new CliParseException("Unknown command '%s'.".formatted(args[0]));
        };

        if (command != AnalyzerCommand.ANALYZE && command != AnalyzerCommand.GRAPH) {
            throw new CliParseException("Unknown command '%s'.".formatted(args[0]));
        }

        Path projectPath = null;
        OutputFormat outputFormat = OutputFormat.JSON;

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
                default -> throw new CliParseException("Unknown option '%s'.".formatted(option));
            }
        }

        if (projectPath == null) {
            throw new CliParseException("Missing required option '--project <path>'.");
        }

        if (command == AnalyzerCommand.GRAPH) {
            return CliRequest.graph(projectPath, outputFormat);
        }

        return CliRequest.analyze(projectPath, outputFormat);
    }

    private int requireValue(String[] args, int optionIndex, String optionName) {
        int valueIndex = optionIndex + 1;
        if (valueIndex >= args.length || args[valueIndex].isBlank()) {
            throw new CliParseException("Option '%s' requires a value.".formatted(optionName));
        }
        return valueIndex;
    }
}
