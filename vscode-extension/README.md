# AEGIS VS Code Extension

AEGIS helps Java and Spring Boot developers understand the impact of code changes before refactoring.

## Current Capabilities

- `AEGIS: Analyze Project` runs the local Java analyzer against the active workspace.
- `AEGIS: Show Impact Graph` requests the dependency graph and reports its size in the AEGIS output channel.
- The extension communicates with the analyzer through a local Java process and typed JSON responses.
- The VSIX package bundles the analyzer JAR so installed extensions run without a separate setup.

The interactive graph view is planned for Milestone 9.

## Development

```bash
cd ../analyzer-engine
mvn package

cd ../vscode-extension
npm install
npm run compile
npm test
npm run lint
```

During extension development, AEGIS automatically uses the JAR from `../analyzer-engine/target` when it is available.

## Packaging

```bash
npm run package
```

The package command compiles the extension, stages the built analyzer at `resources/analyzer/aegis-analyzer-engine.jar`, and creates the VSIX file.

To use a different analyzer build, set `aegis.analyzer.jarPath` in VS Code settings. Relative paths are resolved from the workspace folder.
