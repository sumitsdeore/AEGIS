package dev.aegis.analyzer.scanner;

import java.nio.file.Path;

public interface ProjectScanner {
    ProjectScanResult scan(Path projectPath);
}
