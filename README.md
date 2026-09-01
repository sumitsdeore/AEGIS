# AEGIS

AEGIS is a developer intelligence platform for understanding the impact of Java
and Spring Boot code changes before refactoring.

The analyzer engine and the VS Code extension are both in place: AEGIS parses a
project, builds its dependency graph, scores each type for refactoring risk, and
presents the result in a dashboard. What remains is marketplace polish —
publishing metadata, a license, and an icon.

## Repository Layout

```text
aegis/
├── vscode-extension/   # VS Code extension: commands, dashboard, risk model
├── analyzer-engine/    # Java 21 analyzer: scanning, JavaParser, JSON output
└── README.md
```

`analyzer-engine/` scans a project, parses its Java sources with JavaParser, and
prints a single JSON envelope describing the packages, types, methods, fields,
annotations and imports it found.

`vscode-extension/` spawns that jar, validates the JSON it produced, and derives
everything the UI shows from it: the dependency graph, cycle and layering
analysis, composite risk scores, and the Spring stereotype and endpoint views. It
falls back to a bundled sample analysis — labelled as such — when no JDK 21+ or
jar is available, so the dashboard is inspectable without a Java toolchain.

See [`vscode-extension/README.md`](vscode-extension/README.md) for the command
surface, settings, and the limits of what is inferred versus measured.

## Known gaps

The analyzer records annotation *names* but not their arguments, so
`@GetMapping("/orders")` yields the verb but not the path; the dashboard reports
endpoints by verb and handler and says the URL paths are unavailable rather than
inventing a route table. It also does not yet emit `extends`/`implements` edges or
resolved symbol bindings, so graph edges are inferred from project-internal
imports, field types, and method signatures. Capturing annotation members and
inheritance in the parser would make both the route table and the graph
authoritative.

