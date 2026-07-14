package dev.aegis.analyzer.parser;

import java.nio.file.Path;
import java.util.List;

public interface JavaSourceParser {
    ParsedProject parse(Path projectPath, List<String> sourceRoots);
}
