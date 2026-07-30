package dev.aegis.analyzer.core;

import dev.aegis.analyzer.cli.AnalyzerCommand;
import dev.aegis.analyzer.cli.CliParseException;
import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.cli.CliRequest;
import dev.aegis.analyzer.graph.DependencyGraph;
import dev.aegis.analyzer.graph.DependencyGraphBuilder;
import dev.aegis.analyzer.impact.GraphImpactAnalyzer;
import dev.aegis.analyzer.impact.ImpactAnalysis;
import dev.aegis.analyzer.impact.ImpactAnalysisException;
import dev.aegis.analyzer.impact.ImpactAnalyzer;
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
    private static final String USAGE = "Usage: analyze --project <path> [--format json] | graph --project <path> [--format json] | impact --project <path> --target <node-id-or-qualified-name> [--max-depth <positive-integer>] [--format json]";

    private final CliParser cliParser;
    private final ProjectScanner projectScanner;
    private final JavaSourceParser javaSourceParser;
    private final DependencyGraphBuilder dependencyGraphBuilder;
    private final ImpactAnalyzer impactAnalyzer;

    public AnalyzerApplicationService(
            CliParser cliParser,
            ProjectScanner projectScanner,
            JavaSourceParser javaSourceParser,
            DependencyGraphBuilder dependencyGraphBuilder
    ) {
        this(cliParser, projectScanner, javaSourceParser, dependencyGraphBuilder, new GraphImpactAnalyzer());
    }

    public AnalyzerApplicationService(
            CliParser cliParser,
            ProjectScanner projectScanner,
            JavaSourceParser javaSourceParser,
            DependencyGraphBuilder dependencyGraphBuilder,
            ImpactAnalyzer impactAnalyzer
    ) {
        this.cliParser = Objects.requireNonNull(cliParser, "cliParser must not be null");
        this.projectScanner = Objects.requireNonNull(projectScanner, "projectScanner must not be null");
        this.javaSourceParser = Objects.requireNonNull(javaSourceParser, "javaSourceParser must not be null");
        this.dependencyGraphBuilder = Objects.requireNonNull(dependencyGraphBuilder, "dependencyGraphBuilder must not be null");
        this.impactAnalyzer = Objects.requireNonNull(impactAnalyzer, "impactAnalyzer must not be null");
    }

    public AnalysisResponse execute(String[] args) {
        String commandName = "unknown";
        try {
            CliRequest request = cliParser.parse(args);
            commandName = request.command().name().toLowerCase();
            if (request.command() == AnalyzerCommand.HELP) {
                return AnalyzerResponse.success(
                        "help",
                        USAGE,
                        null,
                        null,
                        null,
                        List.of(Diagnostic.info("AEGIS analyzer engine accepts JSON output only in this milestone."))
                );
            }

            Path projectPath = request.projectPath().orElseThrow(() ->
                    new CliParseException("Missing required option '--project <path>'."));
            AnalysisArtifacts artifacts = analyzeProject(projectPath);

            if (request.command() == AnalyzerCommand.GRAPH) {
                return GraphExportResponse.success(
                        "Dependency graph exported.",
                        artifacts.dependencyGraph(),
                        graphDiagnostics(artifacts)
                );
            }

            if (request.command() == AnalyzerCommand.IMPACT) {
                ImpactAnalysis impactAnalysis = impactAnalyzer.analyze(
                        artifacts.dependencyGraph(),
                        request.target().orElseThrow(() -> new CliParseException("Missing required option '--target <node-id-or-qualified-name>'.")),
                        request.maxDepth()
                );
                return ImpactAnalysisResponse.success(impactAnalysis, impactDiagnostics(artifacts, impactAnalysis));
            }

            List<Diagnostic> diagnostics = new ArrayList<>();
            diagnostics.add(Diagnostic.info("Project scan completed."));
            diagnostics.addAll(artifacts.scanResult().diagnostics());
            diagnostics.add(Diagnostic.info(
                    "Parsed %d Java file(s), %d type(s), %d method(s), and %d field(s).".formatted(
                            artifacts.parsedProject().fileCount(),
                            artifacts.parsedProject().typeCount(),
                            artifacts.parsedProject().methodCount(),
                            artifacts.parsedProject().fieldCount()
                    )
            ));
            diagnostics.add(Diagnostic.info(
                    "Built dependency graph with %d node(s) and %d edge(s).".formatted(
                            artifacts.dependencyGraph().nodeCount(),
                            artifacts.dependencyGraph().edgeCount()
                    )
            ));
            diagnostics.addAll(artifacts.parsedProject().diagnostics().stream().map(this::toDiagnostic).toList());

            return AnalyzerResponse.success(
                    "analyze",
                    "Project accepted for analysis.",
                    artifacts.scanResult(),
                    artifacts.parsedProject(),
                    artifacts.dependencyGraph(),
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
                    commandName,
                    exception.getMessage(),
                    List.of(Diagnostic.error(exception.getMessage()))
            );
        } catch (ImpactAnalysisException exception) {
            return AnalyzerResponse.error(
                    commandName,
                    exception.getMessage(),
                    List.of(Diagnostic.error(exception.getMessage()))
            );
        }
    }

    private AnalysisArtifacts analyzeProject(Path projectPath) {
        ProjectScanResult scanResult = projectScanner.scan(projectPath);
        ParsedProject parsedProject = javaSourceParser.parse(Path.of(scanResult.projectPath()), scanResult.sourceRoots());
        DependencyGraph dependencyGraph = dependencyGraphBuilder.build(parsedProject);

        return new AnalysisArtifacts(scanResult, parsedProject, dependencyGraph);
    }

    private List<Diagnostic> graphDiagnostics(AnalysisArtifacts artifacts) {
        List<Diagnostic> diagnostics = new ArrayList<>();
        diagnostics.add(Diagnostic.info("Project scan completed."));
        diagnostics.addAll(artifacts.scanResult().diagnostics());
        diagnostics.add(Diagnostic.info(
                "Exported dependency graph with %d node(s) and %d edge(s).".formatted(
                        artifacts.dependencyGraph().nodeCount(),
                        artifacts.dependencyGraph().edgeCount()
                )
        ));
        diagnostics.addAll(artifacts.parsedProject().diagnostics().stream().map(this::toDiagnostic).toList());
        return diagnostics;
    }

    private List<Diagnostic> impactDiagnostics(AnalysisArtifacts artifacts, ImpactAnalysis impactAnalysis) {
        List<Diagnostic> diagnostics = new ArrayList<>(graphDiagnostics(artifacts));
        diagnostics.add(Diagnostic.info(
                "Impact analysis found %d direct and %d indirect dependent node(s).".formatted(
                        impactAnalysis.summary().directDependentCount(),
                        impactAnalysis.summary().indirectDependentCount()
                )
        ));
        return diagnostics;
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

    private record AnalysisArtifacts(
            ProjectScanResult scanResult,
            ParsedProject parsedProject,
            DependencyGraph dependencyGraph
    ) {
        private AnalysisArtifacts {
            Objects.requireNonNull(scanResult, "scanResult must not be null");
            Objects.requireNonNull(parsedProject, "parsedProject must not be null");
            Objects.requireNonNull(dependencyGraph, "dependencyGraph must not be null");
        }
    }
}
