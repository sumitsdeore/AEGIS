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
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar impact --project /path/to/project --target type:com.example.orders.OrderService
java -jar target/aegis-analyzer-engine-0.1.0-SNAPSHOT.jar risk --project /path/to/project --target type:com.example.orders.OrderService
```

`analyze` returns the project scan, parsed source model, dependency graph, and diagnostics.
`graph` returns only the dependency graph and diagnostics, which keeps the JSON payload focused for visualization consumers.
`impact` traverses reverse dependency relationships from a graph node ID or unique qualified name and returns direct and indirect dependents, explainable paths, Spring-layer groups, and impacted packages.
`risk` calculates a deterministic 0-100 risk score from fan-in, fan-out, public exposure, transitive impact, package exposure, and Spring layer importance.
