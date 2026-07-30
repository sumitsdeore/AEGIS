package dev.aegis.analyzer.impact;

import dev.aegis.analyzer.graph.DependencyGraph;
import dev.aegis.analyzer.graph.EdgeKind;
import dev.aegis.analyzer.graph.GraphEdge;
import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.graph.NodeKind;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GraphImpactAnalyzerTest {
    private final GraphImpactAnalyzer analyzer = new GraphImpactAnalyzer();

    @Test
    void findsDirectAndIndirectDependentsWithShortestPaths() {
        GraphNode service = typeNode("com.example.orders.OrderService", "OrderService");
        GraphNode controller = typeNode("com.example.orders.OrderController", "OrderController");
        GraphNode repository = typeNode("com.example.orders.OrderRepository", "OrderRepository");
        GraphNode serviceAnnotation = GraphNode.annotationNode("Service");
        GraphNode controllerAnnotation = GraphNode.annotationNode("RestController");
        GraphNode controllerField = new GraphNode(
                "field:com.example.orders.OrderController#orderService",
                "orderService",
                "com.example.orders.OrderController.orderService",
                NodeKind.FIELD,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderController.java",
                Map.of("fieldType", "OrderService")
        );
        GraphNode repositoryField = new GraphNode(
                "field:com.example.orders.OrderService#orderRepository",
                "orderRepository",
                "com.example.orders.OrderService.orderRepository",
                NodeKind.FIELD,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of("fieldType", "OrderRepository")
        );
        DependencyGraph graph = DependencyGraph.of("/workspace/orders", List.of(
                service,
                controller,
                repository,
                serviceAnnotation,
                controllerAnnotation,
                controllerField,
                repositoryField
        ), List.of(
                GraphEdge.of(service.id(), serviceAnnotation.id(), EdgeKind.ANNOTATED_WITH, "Service"),
                GraphEdge.of(controller.id(), controllerAnnotation.id(), EdgeKind.ANNOTATED_WITH, "RestController"),
                GraphEdge.of(controller.id(), controllerField.id(), EdgeKind.HAS_FIELD, "orderService"),
                GraphEdge.of(controllerField.id(), service.id(), EdgeKind.FIELD_TYPE, "OrderService"),
                GraphEdge.of(service.id(), repositoryField.id(), EdgeKind.HAS_FIELD, "orderRepository"),
                GraphEdge.of(repositoryField.id(), repository.id(), EdgeKind.FIELD_TYPE, "OrderRepository")
        ));

        ImpactAnalysis result = analyzer.analyze(graph, service.qualifiedName(), 10);

        assertEquals(service.id(), result.target().id());
        assertEquals(List.of("annotation:Service", repository.id()), result.directDependencies().stream().map(GraphNode::id).toList());
        assertEquals(1, result.directDependents().size());
        assertEquals(controllerField.id(), result.directDependents().getFirst().node().id());
        assertEquals(1, result.indirectDependents().size());
        assertEquals(controller.id(), result.indirectDependents().getFirst().node().id());
        assertEquals(List.of(service.id(), controllerField.id(), controller.id()), result.indirectDependents().getFirst().path().nodeIds());
        assertEquals(List.of(controller.id()), result.impactedApis().stream().map(node -> node.node().id()).toList());
        assertEquals(List.of("com.example.orders"), result.impactedPackages());
        assertEquals(1, result.summary().directDependentCount());
        assertEquals(1, result.summary().indirectDependentCount());
        assertEquals(1, result.summary().impactedApiCount());
    }

    @Test
    void limitsReverseTraversalToRequestedDepth() {
        DependencyGraph graph = graphWithControllerDependingOnService();

        ImpactAnalysis result = analyzer.analyze(graph, "type:com.example.orders.OrderService", 1);

        assertEquals(1, result.directDependents().size());
        assertEquals(0, result.indirectDependents().size());
    }

    @Test
    void rejectsUnknownTarget() {
        ImpactAnalysisException exception = assertThrows(
                ImpactAnalysisException.class,
                () -> analyzer.analyze(graphWithControllerDependingOnService(), "missing.Target", 2)
        );

        assertEquals("Impact target 'missing.Target' was not found in the dependency graph.", exception.getMessage());
    }

    private DependencyGraph graphWithControllerDependingOnService() {
        GraphNode service = typeNode("com.example.orders.OrderService", "OrderService");
        GraphNode controller = typeNode("com.example.orders.OrderController", "OrderController");
        GraphNode controllerField = new GraphNode(
                "field:com.example.orders.OrderController#orderService",
                "orderService",
                "com.example.orders.OrderController.orderService",
                NodeKind.FIELD,
                "com.example.orders",
                "",
                Map.of()
        );
        return DependencyGraph.of("/workspace/orders", List.of(service, controller, controllerField), List.of(
                GraphEdge.of(controller.id(), controllerField.id(), EdgeKind.HAS_FIELD, "orderService"),
                GraphEdge.of(controllerField.id(), service.id(), EdgeKind.FIELD_TYPE, "OrderService")
        ));
    }

    private GraphNode typeNode(String qualifiedName, String simpleName) {
        return GraphNode.typeNode(
                qualifiedName,
                simpleName,
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/%s.java".formatted(simpleName),
                Map.of()
        );
    }
}
