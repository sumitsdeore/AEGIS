package dev.aegis.analyzer.core;

import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.graph.DependencyGraph;
import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.graph.NodeKind;
import dev.aegis.analyzer.impact.ImpactAnalysis;
import dev.aegis.analyzer.impact.ImpactSummary;
import dev.aegis.analyzer.risk.RiskAssessment;
import dev.aegis.analyzer.risk.RiskLevel;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.BuildTool;
import dev.aegis.analyzer.scanner.ProjectScanResult;
import dev.aegis.analyzer.scanner.ProjectScanner;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

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
    void returnsImpactResponseForValidImpactRequest() {
        GraphNode serviceNode = GraphNode.typeNode(
                "com.example.orders.OrderService",
                "OrderService",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of()
        );
        ProjectScanner scanner = projectPath -> new ProjectScanResult(
                projectPath.toString(), BuildTool.MAVEN, List.of("src/main/java"), List.of()
        );
        AnalyzerApplicationService service = new AnalyzerApplicationService(
                new CliParser(),
                scanner,
                (projectPath, sourceRoots) -> ParsedProject.fromFiles(projectPath.toString(), List.of(), List.of()),
                parsedProject -> DependencyGraph.of(parsedProject.projectPath(), List.of(serviceNode), List.of()),
                (graph, target, maxDepth) -> new ImpactAnalysis(
                        serviceNode, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                        new ImpactSummary(0, 0, 0, 0, 0, 0, 0)
                )
        );

        AnalysisResponse response = service.execute(new String[]{
                "impact", "--project", ".", "--target", serviceNode.id()
        });
        ImpactAnalysisResponse impactResponse = assertInstanceOf(ImpactAnalysisResponse.class, response);

        assertEquals(AnalysisStatus.SUCCESS, impactResponse.status());
        assertEquals("impact", impactResponse.command());
        assertEquals(serviceNode.id(), impactResponse.impactAnalysis().target().id());
        assertEquals(3, impactResponse.diagnostics().size());
    }

    @Test
    void returnsRiskResponseForValidRiskRequest() {
        GraphNode serviceNode = GraphNode.typeNode(
                "com.example.orders.OrderService",
                "OrderService",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of()
        );
        ImpactAnalysis impactAnalysis = new ImpactAnalysis(
                serviceNode, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                new ImpactSummary(0, 0, 0, 0, 0, 0, 0)
        );
        ProjectScanner scanner = projectPath -> new ProjectScanResult(
                projectPath.toString(), BuildTool.MAVEN, List.of("src/main/java"), List.of()
        );
        AnalyzerApplicationService service = new AnalyzerApplicationService(
                new CliParser(),
                scanner,
                (projectPath, sourceRoots) -> ParsedProject.fromFiles(projectPath.toString(), List.of(), List.of()),
                parsedProject -> DependencyGraph.of(parsedProject.projectPath(), List.of(serviceNode), List.of()),
                (graph, target, maxDepth) -> impactAnalysis,
                ignored -> new RiskAssessment(serviceNode, 0, RiskLevel.LOW, impactAnalysis.summary(), List.of())
        );

        AnalysisResponse response = service.execute(new String[]{
                "risk", "--project", ".", "--target", serviceNode.id()
        });
        RiskAssessmentResponse riskResponse = assertInstanceOf(RiskAssessmentResponse.class, response);

        assertEquals(AnalysisStatus.SUCCESS, riskResponse.status());
        assertEquals("risk", riskResponse.command());
        assertEquals(0, riskResponse.riskAssessment().score());
        assertEquals(3, riskResponse.diagnostics().size());
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
