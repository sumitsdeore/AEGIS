package dev.aegis.analyzer.exporter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aegis.analyzer.core.AnalyzerResponse;
import dev.aegis.analyzer.core.Diagnostic;
import dev.aegis.analyzer.core.GraphExportResponse;
import dev.aegis.analyzer.core.ImpactAnalysisResponse;
import dev.aegis.analyzer.core.RiskAssessmentResponse;
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
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class JsonResponseWriterTest {
    @Test
    void writesAnalyzerResponseAsJson() throws IOException {
        AnalyzerResponse response = AnalyzerResponse.success(
                "analyze",
                "Project accepted for analysis.",
                new ProjectScanResult("/workspace/sample", BuildTool.MAVEN, List.of("src/main/java"), List.of()),
                ParsedProject.fromFiles("/workspace/sample", List.of(), List.of()),
                DependencyGraph.of("/workspace/sample", List.of(), List.of()),
                List.of(Diagnostic.info("Project scan completed."))
        );

        String json = JsonResponseWriter.createDefault().write(response);
        JsonNode root = new ObjectMapper().readTree(json);

        assertEquals("SUCCESS", root.get("status").asText());
        assertEquals("MAVEN", root.get("project").get("buildTool").asText());
        assertEquals(0, root.get("parsedProject").get("fileCount").asInt());
        assertEquals(0, root.get("dependencyGraph").get("nodeCount").asInt());
    }

    @Test
    void writesGraphExportResponseWithoutFullAnalysisPayload() throws IOException {
        GraphExportResponse response = GraphExportResponse.success(
                "Dependency graph exported.",
                DependencyGraph.of("/workspace/sample", List.of(), List.of()),
                List.of(Diagnostic.info("Exported dependency graph with 0 node(s) and 0 edge(s)."))
        );

        String json = JsonResponseWriter.createDefault().write(response);
        JsonNode root = new ObjectMapper().readTree(json);

        assertEquals("SUCCESS", root.get("status").asText());
        assertEquals("graph", root.get("command").asText());
        assertEquals(0, root.get("dependencyGraph").get("nodeCount").asInt());
        assertFalse(root.has("project"));
        assertFalse(root.has("parsedProject"));
    }

    @Test
    void writesImpactResponseWithoutFullAnalysisPayload() throws IOException {
        GraphNode target = GraphNode.typeNode(
                "com.example.orders.OrderService",
                "OrderService",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of()
        );
        ImpactAnalysisResponse response = ImpactAnalysisResponse.success(
                new ImpactAnalysis(
                        target, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                        new ImpactSummary(0, 0, 0, 0, 0, 0, 0)
                ),
                List.of(Diagnostic.info("Impact analysis found 0 direct and 0 indirect dependent node(s)."))
        );

        String json = JsonResponseWriter.createDefault().write(response);
        JsonNode root = new ObjectMapper().readTree(json);

        assertEquals("SUCCESS", root.get("status").asText());
        assertEquals("impact", root.get("command").asText());
        assertEquals(target.id(), root.get("impactAnalysis").get("target").get("id").asText());
        assertFalse(root.has("project"));
        assertFalse(root.has("dependencyGraph"));
    }

    @Test
    void writesRiskResponseWithoutFullAnalysisPayload() throws IOException {
        GraphNode target = GraphNode.typeNode(
                "com.example.orders.OrderService",
                "OrderService",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of()
        );
        RiskAssessmentResponse response = RiskAssessmentResponse.success(
                new RiskAssessment(
                        target,
                        5,
                        RiskLevel.LOW,
                        new ImpactSummary(0, 0, 0, 0, 0, 0, 0),
                        List.of(new dev.aegis.analyzer.risk.RiskComponent(
                                dev.aegis.analyzer.risk.RiskFactor.LAYER_IMPORTANCE,
                                5,
                                20,
                                "Unclassified layer importance contributes 5 point(s)."
                        ))
                ),
                List.of(Diagnostic.info("Risk score is 5/100 (LOW)."))
        );

        String json = JsonResponseWriter.createDefault().write(response);
        JsonNode root = new ObjectMapper().readTree(json);

        assertEquals("SUCCESS", root.get("status").asText());
        assertEquals("risk", root.get("command").asText());
        assertEquals(5, root.get("riskAssessment").get("score").asInt());
        assertFalse(root.has("impactAnalysis"));
        assertFalse(root.has("dependencyGraph"));
    }
}
