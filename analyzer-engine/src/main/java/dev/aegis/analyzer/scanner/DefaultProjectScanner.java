package dev.aegis.analyzer.scanner;

import dev.aegis.analyzer.core.Diagnostic;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public final class DefaultProjectScanner implements ProjectScanner {
    @Override
    public ProjectScanResult scan(Path projectPath) {
        Objects.requireNonNull(projectPath, "projectPath must not be null");
        Path normalizedPath = projectPath.toAbsolutePath().normalize();

        if (!Files.exists(normalizedPath)) {
            throw new ProjectScanException("Project path does not exist: %s".formatted(normalizedPath));
        }

        if (!Files.isDirectory(normalizedPath)) {
            throw new ProjectScanException("Project path must be a directory: %s".formatted(normalizedPath));
        }

        if (!Files.isReadable(normalizedPath)) {
            throw new ProjectScanException("Project path is not readable: %s".formatted(normalizedPath));
        }

        BuildTool buildTool = detectBuildTool(normalizedPath);
        List<String> sourceRoots = detectSourceRoots(normalizedPath);
        List<Diagnostic> diagnostics = createDiagnostics(buildTool, sourceRoots);

        return new ProjectScanResult(
                normalizedPath.toString(),
                buildTool,
                sourceRoots,
                diagnostics
        );
    }

    private BuildTool detectBuildTool(Path projectPath) {
        if (Files.isRegularFile(projectPath.resolve("pom.xml"))) {
            return BuildTool.MAVEN;
        }

        if (Files.isRegularFile(projectPath.resolve("build.gradle"))
                || Files.isRegularFile(projectPath.resolve("build.gradle.kts"))) {
            return BuildTool.GRADLE;
        }

        return BuildTool.UNKNOWN;
    }

    private List<String> detectSourceRoots(Path projectPath) {
        List<String> candidates = List.of(
                "src/main/java",
                "src/test/java",
                "src/main/kotlin",
                "src/test/kotlin"
        );
        List<String> sourceRoots = new ArrayList<>();

        for (String candidate : candidates) {
            if (Files.isDirectory(projectPath.resolve(candidate))) {
                sourceRoots.add(candidate);
            }
        }

        return List.copyOf(sourceRoots);
    }

    private List<Diagnostic> createDiagnostics(BuildTool buildTool, List<String> sourceRoots) {
        List<Diagnostic> diagnostics = new ArrayList<>();

        if (buildTool == BuildTool.UNKNOWN) {
            diagnostics.add(Diagnostic.warning("No Maven or Gradle build file was detected."));
        } else {
            diagnostics.add(Diagnostic.info("Detected build tool: %s.".formatted(buildTool)));
        }

        if (sourceRoots.isEmpty()) {
            diagnostics.add(Diagnostic.warning("No conventional Java or Kotlin source roots were detected."));
        } else {
            diagnostics.add(Diagnostic.info("Detected %d conventional source root(s).".formatted(sourceRoots.size())));
        }

        return List.copyOf(diagnostics);
    }
}
