package dev.aegis.analyzer.core;

import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.graph.DependencyGraph;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.BuildTool;
import dev.aegis.analyzer.scanner.ProjectScanResult;
import dev.aegis.analyzer.scanner.ProjectScanner;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class AnalyzerApplicationServiceTest {
    @Test
    void returnsSuccessForValidAnalyzeRequest() {
        ProjectScanner scanner = projectPath -> new ProjectScanResult(
                projectPath.toString(),
                BuildTool.MAVEN,
                List.of("src/main/java"),
                List.of(Diagnostic.info("Detected build tool: MAVEN."))
        );
        AnalyzerApplicationService service = new AnalyzerApplicationService(
                new CliParser(),
                scanner,
                (projectPath, sourceRoots) -> ParsedProject.fromFiles(projectPath.toString(), List.of(), List.of()),
                parsedProject -> DependencyGraph.of(parsedProject.projectPath(), List.of(), List.of())
        );

        AnalysisResponse response = service.execute(new String[]{"analyze", "--project", "."});
        AnalyzerResponse analyzeResponse = assertInstanceOf(AnalyzerResponse.class, response);

        assertEquals(AnalysisStatus.SUCCESS, analyzeResponse.status());
        assertNotNull(analyzeResponse.project());
        assertNotNull(analyzeResponse.parsedProject());
        assertNotNull(analyzeResponse.dependencyGraph());
        assertEquals(4, analyzeResponse.diagnostics().size());
    }

    @Test
    void returnsGraphOnlyResponseForValidGraphRequest() {
        ProjectScanner scanner = projectPath -> new ProjectScanResult(
                projectPath.toString(),
                BuildTool.MAVEN,
                List.of("src/main/java"),
                List.of(Diagnostic.info("Detected build tool: MAVEN."))
        );
        AnalyzerApplicationService service = new AnalyzerApplicationService(
                new CliParser(),
                scanner,
                (projectPath, sourceRoots) -> ParsedProject.fromFiles(projectPath.toString(), List.of(), List.of()),
                parsedProject -> DependencyGraph.of(parsedProject.projectPath(), List.of(), List.of())
        );

        AnalysisResponse response = service.execute(new String[]{"graph", "--project", "."});
        GraphExportResponse graphResponse = assertInstanceOf(GraphExportResponse.class, response);

        assertEquals(AnalysisStatus.SUCCESS, graphResponse.status());
        assertEquals("graph", graphResponse.command());
        assertEquals("Dependency graph exported.", graphResponse.message());
        assertNotNull(graphResponse.dependencyGraph());
        assertEquals(3, graphResponse.diagnostics().size());
    }

    @Test
    void returnsErrorForInvalidCliRequest() {
        AnalyzerApplicationService service = new AnalyzerApplicationService(
                new CliParser(),
                projectPath -> {
                    throw new AssertionError("Scanner should not run for invalid CLI input.");
                },
                (projectPath, sourceRoots) -> {
                    throw new AssertionError("Parser should not run for invalid CLI input.");
                },
                parsedProject -> {
                    throw new AssertionError("Graph builder should not run for invalid CLI input.");
                }
        );

        AnalysisResponse response = service.execute(new String[]{"analyze"});
        AnalyzerResponse errorResponse = assertInstanceOf(AnalyzerResponse.class, response);

        assertEquals(AnalysisStatus.ERROR, errorResponse.status());
        assertEquals("unknown", errorResponse.command());
        assertNull(errorResponse.project());
        assertNull(errorResponse.parsedProject());
        assertNull(errorResponse.dependencyGraph());
    }
}
