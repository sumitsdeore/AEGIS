package dev.aegis.analyzer.scanner;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DefaultProjectScannerTest {
    private final DefaultProjectScanner scanner = new DefaultProjectScanner();

    @TempDir
    Path tempDir;

    @Test
    void detectsMavenProjectAndSourceRoots() throws IOException {
        Files.createFile(tempDir.resolve("pom.xml"));
        Files.createDirectories(tempDir.resolve("src/main/java"));
        Files.createDirectories(tempDir.resolve("src/test/java"));

        ProjectScanResult result = scanner.scan(tempDir);

        assertEquals(tempDir.toAbsolutePath().normalize().toString(), result.projectPath());
        assertEquals(BuildTool.MAVEN, result.buildTool());
        assertEquals(2, result.sourceRoots().size());
        assertTrue(result.sourceRoots().contains("src/main/java"));
        assertTrue(result.sourceRoots().contains("src/test/java"));
    }

    @Test
    void detectsGradleProject() throws IOException {
        Files.createFile(tempDir.resolve("build.gradle.kts"));

        ProjectScanResult result = scanner.scan(tempDir);

        assertEquals(BuildTool.GRADLE, result.buildTool());
    }

    @Test
    void returnsWarningsForUnknownProjectShape() {
        ProjectScanResult result = scanner.scan(tempDir);

        assertEquals(BuildTool.UNKNOWN, result.buildTool());
        assertTrue(result.sourceRoots().isEmpty());
        assertEquals(2, result.diagnostics().size());
    }

    @Test
    void rejectsMissingProjectPath() {
        Path missingPath = tempDir.resolve("missing");

        ProjectScanException exception = assertThrows(
                ProjectScanException.class,
                () -> scanner.scan(missingPath)
        );

        assertTrue(exception.getMessage().contains("Project path does not exist"));
    }

    @Test
    void rejectsFileAsProjectPath() throws IOException {
        Path filePath = Files.createFile(tempDir.resolve("README.md"));

        ProjectScanException exception = assertThrows(
                ProjectScanException.class,
                () -> scanner.scan(filePath)
        );

        assertTrue(exception.getMessage().contains("Project path must be a directory"));
    }
}
