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

        ProjectScanResult result = scanner.scan(tempDir);

        assertEquals(BuildTool.MAVEN, result.buildTool());
        assertEquals(1, result.sourceRoots().size());
        assertTrue(result.sourceRoots().contains("src/main/java"));
    }

    @Test
    void rejectsMissingProjectPath() {
        Path missingPath = tempDir.resolve("missing");

        ProjectScanException exception = assertThrows(ProjectScanException.class, () -> scanner.scan(missingPath));

        assertTrue(exception.getMessage().contains("Project path does not exist"));
    }
}
