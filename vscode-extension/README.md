# AEGIS for VS Code

AEGIS reads a Java or Spring Boot project and tells you what a change is likely to
break before you make it. It parses your sources with the AEGIS analyzer engine,
derives a dependency graph, scores each type for refactoring risk, and presents
the result in a single dark-themed dashboard.

## What the dashboard shows

**Overview** covers the shape and health of the project: file, type, method and
field counts, per-type averages, type composition, the largest type, parse
success rate, and the architecture signals worth acting on — dependency cycles,
layering violations, and isolated types. It closes with a table of the types
carrying the highest refactoring risk, each with its dependents, transitive
impact reach, and score.

**Impact graph** is a force-directed view of the project's types, coloured by
architectural layer and sized by risk. Scroll to zoom, drag the background to
pan, drag a node to reposition it, click to inspect its dependents and
dependencies, and double-click to open the source. Filter by name, layer, or risk
band; the toolbar reports how many types match so an over-narrow filter never
looks like a rendering failure.

**Spring insights** tallies stereotypes, lists HTTP endpoints by verb and
handler, and counts `@Transactional`, `@Scheduled` and `@Bean` methods along with
the most-used annotations.

Every derived number states how it was derived. The graph's edges come from
project-internal imports, field types, and method signatures, because the
analyzer does not yet emit inheritance edges or resolved symbol bindings — the
dashboard says so rather than presenting inference as ground truth. Likewise,
Spring repositories detected by naming convention are labelled as heuristics, and
because the analyzer captures annotation *names* but not their arguments, the
endpoint list reports verbs and handlers and states plainly that URL paths are
unavailable.

## Commands

All commands are under the **AEGIS** category in the command palette.

| Command | What it does |
| --- | --- |
| `AEGIS: Analyze Project` | Runs the analyzer over the workspace. Cancellable. |
| `AEGIS: Open Dashboard` | Opens the dashboard (`Ctrl+Alt+A` / `Cmd+Alt+A`). |
| `AEGIS: Show Impact Graph` | Opens the dashboard on the graph panel. |
| `AEGIS: Show Spring Insights` | Opens the dashboard on the Spring panel. |
| `AEGIS: Reveal Type` | Picks a type, highest risk first, and reveals it in the graph. |
| `AEGIS: Export Analysis` | Writes the raw analyzer response plus the derived model to JSON. |
| `AEGIS: Clear Analysis` | Discards the current snapshot. |
| `AEGIS: Show Logs` | Opens the AEGIS output channel. |
| `AEGIS: Open Settings` | Jumps to the AEGIS settings. |

Commands that need a completed run — Reveal Type, Export Analysis, Clear Analysis
— stay hidden from the palette until one exists, so they cannot be invoked into
failure. The status bar shows the type count and how many types are high risk,
with a tooltip carrying the full summary.

## Requirements

The analyzer engine is compiled for **Java 21**, so a JDK 21 or newer runtime is
required to analyse a real project. AEGIS looks for one in this order:

1. `aegis.java.path`
2. `JAVA_HOME/bin/java`
3. `java` on `PATH`

and for the analyzer jar in this order:

1. `aegis.analyzer.jarPath`
2. `<workspace>/analyzer-engine/target/`
3. `<workspace>/target/`
4. the jar bundled with the extension

Build the jar with `mvn package` in `analyzer-engine/`. Shaded builds also emit
`original-*.jar`, which lacks its bundled dependencies; AEGIS never selects it.

If no suitable Java or jar is found, AEGIS says which one was missing and where
it looked, and — unless you turn off `aegis.dashboard.useSampleDataWhenUnavailable`
— populates the dashboard from a bundled sample project so you can still see what
the tool does. Sample data is labelled as such throughout, and the status bar
marks it, so it is never mistaken for your own project.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `aegis.analyzer.jarPath` | `""` | Explicit path to the analyzer jar. |
| `aegis.java.path` | `""` | Java executable or JDK home to run the analyzer with. |
| `aegis.analyzer.timeoutMs` | `120000` | Time limit for a run, clamped to 5s–10min. |
| `aegis.dashboard.useSampleDataWhenUnavailable` | `true` | Fall back to the bundled sample when the analyzer cannot run. |
| `aegis.analyzeOnStartup` | `false` | Analyse quietly when a Java workspace opens. |
| `aegis.risk.highThreshold` | `70` | Score at which a type is flagged high risk. |
| `aegis.verboseLogging` | `false` | Log the exact analyzer command line and timings. |

## Development

```bash
npm install
npm run compile
npm run lint
npm test
```

`npm test` runs under plain node, with no Extension Host and no test framework:
every suite exercises pure model, parsing or rendering code. That keeps it cheap
enough to run on every change. It also cross-checks `package.json` against the
code, so a command contributed in one but not the other fails the build instead
of becoming a palette entry that silently does nothing.

Two development scripts are not shipped in the VSIX:

```bash
node scripts/generateSampleAnalysis.js      # regenerate resources/sample-analysis.json
node scripts/renderDashboardPreview.js      # write dist/dashboard-preview.html
```

The dashboard stylesheet declares a fallback for every `--vscode-*` variable it
reads, so `dashboard-preview.html` opens in an ordinary browser. That is the
quickest way to review a visual change without launching an Extension Host.
