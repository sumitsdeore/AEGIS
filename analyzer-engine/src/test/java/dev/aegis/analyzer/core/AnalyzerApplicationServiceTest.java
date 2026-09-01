package dev.aegis.analyzer.core;

import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.BuildTool;
import dev.aegis.analyzer.scanner.ProjectScanResult;
import dev.aegis.analyzer.scanner.ProjectScanner;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
                (projectPath, sourceRoots) -> ParsedProject.fromFiles(projectPath.toString(), List.of(), List.of())
        );

        AnalyzerResponse response = service.execute(new String[]{"analyze", "--project", "."});

        assertEquals(AnalysisStatus.SUCCESS, response.status());
        assertEquals("analyze", response.command());
        assertEquals("Project accepted for analysis.", response.message());
        assertNotNull(response.project());
        assertNotNull(response.parsedProject());
        assertEquals(3, response.diagnostics().size());
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
                }
        );

        AnalyzerResponse response = service.execute(new String[]{"analyze"});

        assertEquals(AnalysisStatus.ERROR, response.status());
        assertEquals("unknown", response.command());
        assertNull(response.project());
        assertEquals("Missing required option '--project <path>'.", response.message());
    }
}
