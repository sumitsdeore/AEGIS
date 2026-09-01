package dev.aegis.analyzer.parser;

import dev.aegis.analyzer.core.DiagnosticSeverity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JavaParserSourceParserTest {
    private final JavaParserSourceParser parser = new JavaParserSourceParser();

    @TempDir
    Path projectDir;

    @Test
    void parsesJavaSourceStructure() throws IOException {
        Path sourceRoot = projectDir.resolve("src/main/java");
        Path packageDir = sourceRoot.resolve("com/example/demo");
        Files.createDirectories(packageDir);
        Files.writeString(packageDir.resolve("OrderController.java"), """
                package com.example.demo;

                import java.util.List;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class OrderController {
                    private final OrderService orderService;

                    public OrderController(OrderService orderService) {
                        this.orderService = orderService;
                    }

                    @GetMapping("/orders")
                    public List<String> listOrders(String status) {
                        return orderService.listOrders(status);
                    }
                }

                interface OrderService {
                    List<String> listOrders(String status);
                }

                enum OrderState {
                    OPEN,
                    CLOSED
                }

                record OrderSummary(String id) {
                }
                """);

        ParsedProject parsedProject = parser.parse(projectDir, List.of("src/main/java"));

        assertEquals(1, parsedProject.fileCount());
        assertEquals(4, parsedProject.typeCount());
        assertEquals(2, parsedProject.methodCount());
        assertEquals(1, parsedProject.fieldCount());
        assertTrue(parsedProject.diagnostics().isEmpty());

        ParsedJavaFile javaFile = parsedProject.files().getFirst();
        assertEquals("com.example.demo", javaFile.packageName());
        assertTrue(javaFile.imports().contains("java.util.List"));
        assertTrue(javaFile.imports().contains("org.springframework.web.bind.annotation.RestController"));

        ParsedType controller = javaFile.types().stream()
                .filter(type -> type.simpleName().equals("OrderController"))
                .findFirst()
                .orElseThrow();

        assertEquals(TypeKind.CLASS, controller.kind());
        assertEquals("com.example.demo.OrderController", controller.qualifiedName());
        assertTrue(controller.annotations().contains("RestController"));
        assertTrue(controller.modifiers().contains("public"));
        assertEquals(1, controller.fields().size());
        assertEquals("orderService", controller.fields().getFirst().name());
        assertEquals("OrderService", controller.fields().getFirst().type());
        assertEquals(1, controller.methods().size());

        ParsedMethod method = controller.methods().getFirst();
        assertEquals("listOrders", method.name());
        assertEquals("List<String>", method.returnType());
        assertEquals("status", method.parameters().getFirst().name());
        assertEquals("String", method.parameters().getFirst().type());
        assertTrue(method.annotations().contains("GetMapping"));
        assertTrue(method.sourceRange().beginLine() > 0);

        ParsedType summary = javaFile.types().stream()
                .filter(type -> type.simpleName().equals("OrderSummary"))
                .findFirst()
                .orElseThrow();

        assertEquals(TypeKind.RECORD, summary.kind());
    }

    @Test
    void recordsDiagnosticsForMalformedJavaFile() throws IOException {
        Path sourceRoot = projectDir.resolve("src/main/java");
        Files.createDirectories(sourceRoot);
        Files.writeString(sourceRoot.resolve("Broken.java"), """
                package broken;

                public class Broken {
                    public void run(
                }
                """);

        ParsedProject parsedProject = parser.parse(projectDir, List.of("src/main/java"));

        assertEquals(1, parsedProject.fileCount());
        assertEquals(0, parsedProject.typeCount());
        assertFalse(parsedProject.diagnostics().isEmpty());
        assertTrue(parsedProject.diagnostics().stream()
                .anyMatch(diagnostic -> diagnostic.severity() == DiagnosticSeverity.ERROR));
    }

    @Test
    void returnsWarningWhenNoSourceRootsAreAvailable() {
        ParsedProject parsedProject = parser.parse(projectDir, List.of());

        assertEquals(0, parsedProject.fileCount());
        assertEquals(1, parsedProject.diagnostics().size());
        assertEquals(DiagnosticSeverity.WARNING, parsedProject.diagnostics().getFirst().severity());
    }
}
