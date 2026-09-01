package dev.aegis.analyzer.core;

import dev.aegis.analyzer.cli.AnalyzerCommand;
import dev.aegis.analyzer.cli.CliParseException;
import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.cli.CliRequest;
import dev.aegis.analyzer.parser.JavaSourceParser;
import dev.aegis.analyzer.parser.ParseDiagnostic;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.ProjectScanException;
import dev.aegis.analyzer.scanner.ProjectScanResult;
import dev.aegis.analyzer.scanner.ProjectScanner;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public final class AnalyzerApplicationService {
    private static final String USAGE = "Usage: analyze --project <path> [--format json]";

    private final CliParser cliParser;
    private final ProjectScanner projectScanner;
    private final JavaSourceParser javaSourceParser;

    public AnalyzerApplicationService(
            CliParser cliParser,
            ProjectScanner projectScanner,
            JavaSourceParser javaSourceParser
    ) {
        this.cliParser = Objects.requireNonNull(cliParser, "cliParser must not be null");
        this.projectScanner = Objects.requireNonNull(projectScanner, "projectScanner must not be null");
        this.javaSourceParser = Objects.requireNonNull(javaSourceParser, "javaSourceParser must not be null");
    }

    public AnalyzerResponse execute(String[] args) {
        try {
            CliRequest request = cliParser.parse(args);
            if (request.command() == AnalyzerCommand.HELP) {
                return AnalyzerResponse.success(
                        "help",
                        USAGE,
                        null,
                        List.of(Diagnostic.info("AEGIS analyzer engine accepts JSON output only in this milestone."))
                );
            }

            Path projectPath = request.projectPath().orElseThrow(() ->
                    new CliParseException("Missing required option '--project <path>'."));
            ProjectScanResult scanResult = projectScanner.scan(projectPath);
            ParsedProject parsedProject = javaSourceParser.parse(Path.of(scanResult.projectPath()), scanResult.sourceRoots());

            List<Diagnostic> diagnostics = new ArrayList<>();
            diagnostics.add(Diagnostic.info("Project scan completed."));
            diagnostics.addAll(scanResult.diagnostics());
            diagnostics.add(Diagnostic.info(
                    "Parsed %d Java file(s), %d type(s), %d method(s), and %d field(s).".formatted(
                            parsedProject.fileCount(),
                            parsedProject.typeCount(),
                            parsedProject.methodCount(),
                            parsedProject.fieldCount()
                    )
            ));
            diagnostics.addAll(parsedProject.diagnostics().stream()
                    .map(this::toDiagnostic)
                    .toList());

            return AnalyzerResponse.success(
                    "analyze",
                    "Project accepted for analysis.",
                    scanResult,
                    parsedProject,
                    diagnostics
            );
        } catch (CliParseException exception) {
            return AnalyzerResponse.error(
                    "unknown",
                    exception.getMessage(),
                    List.of(Diagnostic.error(USAGE))
            );
        } catch (ProjectScanException exception) {
            return AnalyzerResponse.error(
                    "analyze",
                    exception.getMessage(),
                    List.of(Diagnostic.error(exception.getMessage()))
            );
        }
    }

    private Diagnostic toDiagnostic(ParseDiagnostic parseDiagnostic) {
        String location = parseDiagnostic.sourcePath().isBlank()
                ? ""
                : "%s:%d:%d: ".formatted(parseDiagnostic.sourcePath(), parseDiagnostic.line(), parseDiagnostic.column());
        String message = "%s%s".formatted(location, parseDiagnostic.message());

        return switch (parseDiagnostic.severity()) {
            case INFO -> Diagnostic.info(message);
            case WARNING -> Diagnostic.warning(message);
            case ERROR -> Diagnostic.error(message);
        };
    }
}
