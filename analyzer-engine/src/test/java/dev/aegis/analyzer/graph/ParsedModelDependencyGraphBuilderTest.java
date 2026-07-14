package dev.aegis.analyzer.graph;

import dev.aegis.analyzer.parser.JavaParserSourceParser;
import dev.aegis.analyzer.parser.ParsedProject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ParsedModelDependencyGraphBuilderTest {
    private final JavaParserSourceParser parser = new JavaParserSourceParser();
    private final ParsedModelDependencyGraphBuilder graphBuilder = new ParsedModelDependencyGraphBuilder();

    @TempDir
    Path projectDir;

    @Test
    void buildsGraphFromParsedProject() throws IOException {
        Path packageDir = projectDir.resolve("src/main/java/com/example/demo");
        Files.createDirectories(packageDir);
        Files.writeString(packageDir.resolve("OrderController.java"), """
                package com.example.demo;

                import java.util.List;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class OrderController {
                    private final OrderService orderService;

                    @GetMapping("/orders")
                    public List<String> listOrders(String status) {
                        return orderService.listOrders(status);
                    }
                }

                interface OrderService {
                    List<String> listOrders(String status);
                }
                """);

        ParsedProject parsedProject = parser.parse(projectDir, List.of("src/main/java"));
        DependencyGraph graph = graphBuilder.build(parsedProject);

        assertTrue(graph.nodeCount() > 0);
        assertTrue(graph.edgeCount() > 0);
        assertTrue(hasNode(graph, "package:com.example.demo", NodeKind.PACKAGE));
        assertTrue(hasNode(graph, "type:com.example.demo.OrderController", NodeKind.TYPE));
        assertTrue(hasNode(graph, "field:com.example.demo.OrderController#orderService", NodeKind.FIELD));
        assertTrue(hasNode(graph, "method:com.example.demo.OrderController#listOrders(String)", NodeKind.METHOD));
        assertTrue(hasNode(graph, "annotation:RestController", NodeKind.ANNOTATION));
        assertTrue(hasNode(graph, "external-type:List", NodeKind.EXTERNAL_TYPE));
        assertTrue(hasEdge(graph, "type:com.example.demo.OrderController", "package:com.example.demo", EdgeKind.DECLARES)
                || hasEdge(graph, "package:com.example.demo", "type:com.example.demo.OrderController", EdgeKind.DECLARES));
        assertTrue(hasEdge(graph, "type:com.example.demo.OrderController", "annotation:RestController", EdgeKind.ANNOTATED_WITH));
        assertTrue(hasEdge(graph, "field:com.example.demo.OrderController#orderService", "type:com.example.demo.OrderService", EdgeKind.FIELD_TYPE));
        assertTrue(hasEdge(graph, "method:com.example.demo.OrderController#listOrders(String)", "external-type:List", EdgeKind.RETURNS));
    }

    @Test
    void producesDeterministicNodeAndEdgeOrdering() throws IOException {
        Path packageDir = projectDir.resolve("src/main/java/com/example/demo");
        Files.createDirectories(packageDir);
        Files.writeString(packageDir.resolve("Alpha.java"), """
                package com.example.demo;

                public class Alpha {
                    private Beta beta;
                }
                """);
        Files.writeString(packageDir.resolve("Beta.java"), """
                package com.example.demo;

                public class Beta {
                }
                """);

        ParsedProject parsedProject = parser.parse(projectDir, List.of("src/main/java"));
        DependencyGraph first = graphBuilder.build(parsedProject);
        DependencyGraph second = graphBuilder.build(parsedProject);

        assertEquals(first.nodes(), second.nodes());
        assertEquals(first.edges(), second.edges());
    }

    private boolean hasNode(DependencyGraph graph, String id, NodeKind kind) {
        return graph.nodes().stream().anyMatch(node -> node.id().equals(id) && node.kind() == kind);
    }

    private boolean hasEdge(DependencyGraph graph, String sourceId, String targetId, EdgeKind kind) {
        return graph.edges().stream().anyMatch(edge ->
                edge.sourceId().equals(sourceId)
                        && edge.targetId().equals(targetId)
                        && edge.kind() == kind);
    }
}
