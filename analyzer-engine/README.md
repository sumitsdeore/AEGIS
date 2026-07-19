# AEGIS Analyzer Engine

The analyzer engine is a standalone Java 21 CLI used by the AEGIS VS Code extension.

It currently supports:

- CLI command parsing
- Project path validation
- Maven and Gradle build tool detection
- Conventional source root detection
- JavaParser-based parsing for packages, imports, classes, interfaces, enums, records, annotations, fields, methods, parameters, modifiers, and source ranges
- Deterministic dependency graph generation
- JSON output
- Unit tests for core behavior

## Commands

```bash
mvn test
mvn package
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar analyze --project /path/to/project
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar graph --project /path/to/project
```

`analyze` returns the project scan, parsed source model, dependency graph, and diagnostics.
`graph` returns only the dependency graph and diagnostics, which keeps the JSON payload focused for visualization consumers.
