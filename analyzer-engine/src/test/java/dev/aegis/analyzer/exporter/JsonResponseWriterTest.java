package dev.aegis.analyzer.exporter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aegis.analyzer.core.AnalyzerResponse;
import dev.aegis.analyzer.core.Diagnostic;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.scanner.BuildTool;
import dev.aegis.analyzer.scanner.ProjectScanResult;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JsonResponseWriterTest {
    @Test
    void writesAnalyzerResponseAsJson() throws IOException {
        AnalyzerResponse response = AnalyzerResponse.success(
                "analyze",
                "Project accepted for analysis.",
                new ProjectScanResult(
                        "/workspace/sample",
                        BuildTool.MAVEN,
                        List.of("src/main/java"),
                        List.of(Diagnostic.info("Detected build tool: MAVEN."))
                ),
                ParsedProject.fromFiles("/workspace/sample", List.of(), List.of()),
                List.of(Diagnostic.info("Project scan completed."))
        );

        String json = JsonResponseWriter.createDefault().write(response);
        JsonNode root = new ObjectMapper().readTree(json);

        assertEquals("SUCCESS", root.get("status").asText());
        assertEquals("analyze", root.get("command").asText());
        assertEquals("MAVEN", root.get("project").get("buildTool").asText());
        assertEquals(0, root.get("parsedProject").get("fileCount").asInt());
        assertEquals("src/main/java", root.get("project").get("sourceRoots").get(0).asText());
    }
}
