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

                record OrderSummary(String id) {
                }
                """);

        ParsedProject parsedProject = parser.parse(projectDir, List.of("src/main/java"));

        assertEquals(1, parsedProject.fileCount());
        assertEquals(3, parsedProject.typeCount());
        assertEquals(2, parsedProject.methodCount());
        assertEquals(1, parsedProject.fieldCount());
        assertTrue(parsedProject.diagnostics().isEmpty());

        ParsedJavaFile javaFile = parsedProject.files().getFirst();
        assertEquals("com.example.demo", javaFile.packageName());
        assertTrue(javaFile.imports().contains("java.util.List"));

        ParsedType controller = javaFile.types().stream()
                .filter(type -> type.simpleName().equals("OrderController"))
                .findFirst()
                .orElseThrow();

        assertEquals(TypeKind.CLASS, controller.kind());
        assertTrue(controller.annotations().contains("RestController"));
        assertEquals("OrderService", controller.fields().getFirst().type());
        assertEquals("List<String>", controller.methods().getFirst().returnType());
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
        assertFalse(parsedProject.diagnostics().isEmpty());
        assertTrue(parsedProject.diagnostics().stream()
                .anyMatch(diagnostic -> diagnostic.severity() == DiagnosticSeverity.ERROR));
    }
}
