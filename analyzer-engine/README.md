# AEGIS Analyzer Engine

The analyzer engine is a standalone Java 21 CLI used by the AEGIS VS Code extension.

Milestone 2 establishes the executable foundation:

- CLI command parsing
- Project path validation
- Build tool detection for Maven and Gradle
- Conventional source root detection
- Deterministic JSON response output
- Unit tests for core behavior

Milestone 3 adds JavaParser-based source parsing:

- packages
- imports
- classes, interfaces, enums, records, and annotations
- methods, parameters, and fields
- annotations and modifiers
- source ranges
- parse diagnostics for malformed Java files

Dependency graph construction begins in a later milestone.

## Commands

```bash
mvn test
mvn package
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar analyze --project /path/to/project
```

The current CLI supports JSON output only:

```bash
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar analyze --project /path/to/project --format json
```
