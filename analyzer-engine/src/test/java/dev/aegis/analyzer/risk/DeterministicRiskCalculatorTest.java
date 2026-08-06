package dev.aegis.analyzer.risk;

import dev.aegis.analyzer.graph.GraphNode;
import dev.aegis.analyzer.graph.NodeKind;
import dev.aegis.analyzer.impact.ImpactAnalysis;
import dev.aegis.analyzer.impact.ImpactSummary;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DeterministicRiskCalculatorTest {
    private final DeterministicRiskCalculator calculator = new DeterministicRiskCalculator();

    @Test
    void calculatesExplainableHighRiskScore() {
        GraphNode target = GraphNode.typeNode(
                "com.example.orders.OrderService",
                "OrderService",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderService.java",
                Map.of("modifiers", "public", "annotations", "Service")
        );
        ImpactAnalysis impactAnalysis = new ImpactAnalysis(
                target,
                List.of(typeNode("A"), typeNode("B")),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of("com.example.api", "com.example.orders"),
                new ImpactSummary(2, 3, 4, 0, 0, 0, 2)
        );

        RiskAssessment assessment = calculator.calculate(impactAnalysis);

        assertEquals(74, assessment.score());
        assertEquals(RiskLevel.HIGH, assessment.level());
        assertEquals(List.of(18, 6, 10, 20, 5, 15), assessment.components().stream().map(RiskComponent::score).toList());
        assertEquals(RiskFactor.FAN_IN, assessment.components().getFirst().factor());
        assertEquals(RiskFactor.LAYER_IMPORTANCE, assessment.components().getLast().factor());
    }

    @Test
    void calculatesLowRiskForInternalUnclassifiedType() {
        GraphNode target = GraphNode.typeNode(
                "com.example.orders.OrderFormatter",
                "OrderFormatter",
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/OrderFormatter.java",
                Map.of("modifiers", "", "annotations", "")
        );
        ImpactAnalysis impactAnalysis = new ImpactAnalysis(
                target,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                new ImpactSummary(0, 0, 0, 0, 0, 0, 0)
        );

        RiskAssessment assessment = calculator.calculate(impactAnalysis);

        assertEquals(5, assessment.score());
        assertEquals(RiskLevel.LOW, assessment.level());
    }

    private GraphNode typeNode(String simpleName) {
        return GraphNode.typeNode(
                "com.example.orders.%s".formatted(simpleName),
                simpleName,
                NodeKind.TYPE,
                "com.example.orders",
                "src/main/java/com/example/orders/%s.java".formatted(simpleName),
                Map.of()
        );
    }
}
