# AEGIS

AEGIS is a developer intelligence platform for understanding the impact of Java and Spring Boot code changes before refactoring.

The project is being built milestone by milestone:

1. VS Code extension skeleton
2. Java analyzer engine
3. Spring Boot parsing with JavaParser
4. Dependency graph generation
5. JSON graph export
6. Extension-to-analyzer communication
7. Impact analysis
8. Risk scoring
9. Interactive graph visualization
10. Marketplace polish, tests, documentation, and publishing

## Repository Layout

```text
aegis/
├── vscode-extension/
├── analyzer-engine/
├── shared/
├── sample-project/
├── docs/
└── README.md
```

Milestone 1 provides the VS Code extension shell in `vscode-extension/`.

Milestone 2 provides the standalone Java analyzer engine foundation in `analyzer-engine/`.

Milestone 3 adds JavaParser-based Java source parsing to the analyzer engine.

Milestone 4 adds deterministic dependency graph generation from the parsed source model.
