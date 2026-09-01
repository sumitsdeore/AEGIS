import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { isAnalyzerResponse } from "../types/analyzer";
import type { AnalyzerResponse, Diagnostic } from "../types/analyzer";
import type {
  AnalysisResult,
  AnalyzerRequest,
  AnalyzerService,
  Logger
} from "../types/service";
import type { AegisConfiguration } from "./configuration";
import type { AnalyzerLocator } from "./analyzerLocator";

/**
 * How long a terminated analyzer is given to shut down before it is killed
 * outright. Long enough for a JVM to run its shutdown hooks, short enough that
 * a user who pressed Cancel is not still being held up by the process they
 * cancelled.
 */
const KILL_GRACE_MS = 3000;

/**
 * Runs the AEGIS analyzer engine as a child process and adapts its JSON output.
 *
 * This replaces the Milestone 1 stub that unconditionally returned
 * `status: "unavailable"`.
 */
export class LocalAnalyzerService implements AnalyzerService {
  constructor(
    private readonly locator: AnalyzerLocator,
    private readonly readConfiguration: () => AegisConfiguration,
    private readonly logger: Logger,
    private readonly extensionPath: string
  ) {}

  async analyzeProject(request: AnalyzerRequest): Promise<AnalysisResult> {
    const configuration = this.readConfiguration();
    const startedAt = Date.now();

    const located = await this.locator.locate(configuration, request.workspacePath);

    if (located.kind === "missing") {
      this.logger.warn(`Analyzer unavailable (${located.reason}): ${located.message}`);
      if (located.searchedPaths && located.searchedPaths.length > 0) {
        this.logger.info(`Searched for the analyzer jar in: ${located.searchedPaths.join(", ")}`);
      }

      return this.unavailableResult(
        located.message,
        located.reason,
        configuration,
        Date.now() - startedAt
      );
    }

    const { javaRuntime, jarPath } = located.location;
    this.logger.info(
      `Running analyzer: ${javaRuntime.executable} (${javaRuntime.rawVersion}) with ${jarPath}`
    );

    try {
      const execution = await runAnalyzerProcess({
        javaExecutable: javaRuntime.executable,
        jarPath,
        projectPath: request.workspacePath,
        timeoutMs: configuration.timeoutMs,
        isCancellationRequested: request.isCancellationRequested,
        logger: this.logger
      });

      const durationMs = Date.now() - startedAt;

      if (execution.kind === "cancelled") {
        return {
          outcome: "error",
          message: "Analysis was cancelled.",
          diagnostics: [{ severity: "WARNING", message: "Analysis was cancelled by the user." }],
          source: "analyzer",
          durationMs,
          analyzerJarPath: jarPath,
          javaVersion: javaRuntime.rawVersion
        };
      }

      if (execution.kind === "timeout") {
        const message = `The analyzer did not finish within ${configuration.timeoutMs} ms and was stopped.`;
        this.logger.error(message);
        return {
          outcome: "error",
          message,
          diagnostics: [
            { severity: "ERROR", message },
            {
              severity: "INFO",
              message: "Increase `aegis.analyzer.timeoutMs` for very large projects."
            }
          ],
          source: "analyzer",
          durationMs,
          analyzerJarPath: jarPath,
          javaVersion: javaRuntime.rawVersion
        };
      }

      if (execution.kind === "spawn-failed") {
        this.logger.error("Failed to start the analyzer process.", execution.error);
        return this.unavailableResult(
          `Could not start the analyzer process: ${execution.error.message}`,
          "no-java",
          configuration,
          durationMs
        );
      }

      return this.adaptProcessOutput(execution, {
        durationMs,
        jarPath,
        javaVersion: javaRuntime.rawVersion,
        configuration
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.logger.error("Analyzer invocation failed unexpectedly.", error);
      return {
        outcome: "error",
        message: "The analyzer failed unexpectedly. See the AEGIS output channel for details.",
        diagnostics: [{ severity: "ERROR", message: describeError(error) }],
        source: "analyzer",
        durationMs,
        analyzerJarPath: jarPath,
        javaVersion: javaRuntime.rawVersion
      };
    }
  }

  /**
   * Converts a completed process into an AnalysisResult.
   *
   * The analyzer exits with code 1 whenever it reports ERROR status, yet still
   * writes a well-formed JSON body. stdout is therefore always parsed first and
   * the exit code is only used as a fallback signal.
   */
  private adaptProcessOutput(
    execution: ProcessCompleted,
    context: {
      durationMs: number;
      jarPath: string;
      javaVersion: string;
      configuration: AegisConfiguration;
    }
  ): AnalysisResult {
    const { durationMs, jarPath, javaVersion } = context;

    if (execution.stderr.trim().length > 0) {
      this.logger.warn(`Analyzer stderr: ${execution.stderr.trim()}`);
    }

    // An old JRE fails before producing any JSON; name the real cause.
    if (/UnsupportedClassVersionError/.test(execution.stderr)) {
      return this.unavailableResult(
        "The analyzer jar was built for a newer Java version than the runtime in use. " +
          "Point `aegis.java.path` at a JDK 21+ installation.",
        "java-too-old",
        context.configuration,
        durationMs
      );
    }

    const response = extractAnalyzerResponse(execution.stdout);

    if (!response) {
      const detail =
        execution.stdout.trim().length === 0
          ? "The analyzer produced no output."
          : "The analyzer produced output that could not be parsed as JSON.";
      this.logger.error(`${detail} Exit code: ${execution.exitCode ?? "unknown"}.`);

      return {
        outcome: "error",
        message: detail,
        diagnostics: [
          { severity: "ERROR", message: detail },
          ...(execution.stderr.trim().length > 0
            ? [{ severity: "ERROR" as const, message: execution.stderr.trim().slice(0, 2000) }]
            : [])
        ],
        source: "analyzer",
        durationMs,
        analyzerJarPath: jarPath,
        javaVersion
      };
    }

    const outcome = response.status === "SUCCESS" ? "success" : "error";
    this.logger.info(
      `Analyzer finished with status ${response.status} in ${durationMs} ms: ${response.message}`
    );

    return {
      outcome,
      message: response.message,
      diagnostics: response.diagnostics ?? [],
      response,
      source: "analyzer",
      durationMs,
      analyzerJarPath: jarPath,
      javaVersion
    };
  }

  /**
   * Builds the result used when the analyzer cannot run at all.
   *
   * When sample-data fallback is enabled the dashboard still gets a payload so
   * the UI is explorable, but it is tagged `source: "sample"` and the dashboard
   * renders a prominent badge. Real and sample data are never conflated.
   */
  private unavailableResult(
    message: string,
    reason: string,
    configuration: AegisConfiguration,
    durationMs: number
  ): AnalysisResult {
    const diagnostics: Diagnostic[] = [
      { severity: "WARNING", message },
      {
        severity: "INFO",
        message: "Run `mvn package` in `analyzer-engine/` to build the analyzer jar."
      }
    ];

    if (!configuration.useSampleDataWhenUnavailable) {
      return {
        outcome: "unavailable",
        message,
        diagnostics,
        source: "analyzer",
        durationMs
      };
    }

    const sample = this.loadSampleResponse();
    if (!sample) {
      return {
        outcome: "unavailable",
        message,
        diagnostics,
        source: "analyzer",
        durationMs
      };
    }

    this.logger.info(`Falling back to bundled sample analysis data (reason: ${reason}).`);

    return {
      outcome: "unavailable",
      message,
      diagnostics: [
        ...diagnostics,
        {
          severity: "INFO",
          message: "Showing bundled sample data so the dashboard remains explorable."
        }
      ],
      response: sample,
      source: "sample",
      durationMs
    };
  }

  private loadSampleResponse(): AnalyzerResponse | undefined {
    const samplePath = path.join(this.extensionPath, "resources", "sample-analysis.json");

    try {
      const raw = fs.readFileSync(samplePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (isAnalyzerResponse(parsed)) {
        return parsed;
      }
      this.logger.warn(`Bundled sample analysis at ${samplePath} did not match the expected shape.`);
    } catch (error) {
      this.logger.warn(`Could not read bundled sample analysis: ${describeError(error)}`);
    }

    return undefined;
  }
}

interface ProcessCompleted {
  readonly kind: "completed";
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
}

type ProcessOutcome =
  | ProcessCompleted
  | { readonly kind: "timeout" }
  | { readonly kind: "cancelled" }
  | { readonly kind: "spawn-failed"; readonly error: Error };

interface RunOptions {
  readonly javaExecutable: string;
  readonly jarPath: string;
  readonly projectPath: string;
  readonly timeoutMs: number;
  readonly isCancellationRequested?: () => boolean;
  readonly logger: Logger;
}

/**
 * Spawns `java -jar <jar> analyze --project <path> --format json`.
 *
 * `spawn` is used rather than `exec` so that a project large enough to overflow
 * a shell buffer streams safely, and so no argument passes through a shell.
 */
function runAnalyzerProcess(options: RunOptions): Promise<ProcessOutcome> {
  return new Promise((resolve) => {
    const args = [
      "-jar",
      options.jarPath,
      "analyze",
      "--project",
      options.projectPath,
      "--format",
      "json"
    ];

    let child;
    try {
      child = spawn(options.javaExecutable, args, {
        cwd: options.projectPath,
        windowsHide: true
      });
    } catch (error) {
      resolve({ kind: "spawn-failed", error: toError(error) });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    let closed = false;

    const finish = (outcome: ProcessOutcome): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutTimer);
      clearInterval(cancellationPoll);
      resolve(outcome);
    };

    /*
     * SIGTERM asks the JVM to exit; it is not obliged to comply. Without an
     * escalation an analyzer that ignores the signal outlives the run that gave
     * up on it and goes on holding a file lock on the project the user is still
     * editing. The escalation timer only decides how an orphan dies, never
     * whether this promise settles, so it is deliberately left out of `finish`
     * and unref'd: it must survive the resolve, and it must not hold the event
     * loop open on the way to shutdown.
     */
    const terminate = (): void => {
      child.kill("SIGTERM");
      const escalation = setTimeout(() => {
        if (!closed) {
          child.kill("SIGKILL");
        }
      }, KILL_GRACE_MS);
      escalation.unref();
    };

    const timeoutTimer = setTimeout(() => {
      terminate();
      finish({ kind: "timeout" });
    }, options.timeoutMs);

    // Cooperative cancellation: the VS Code progress token is polled rather
    // than awaited so a long-running analysis stays responsive to Cancel.
    const cancellationPoll = setInterval(() => {
      if (options.isCancellationRequested?.() === true) {
        terminate();
        finish({ kind: "cancelled" });
      }
    }, 250);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => finish({ kind: "spawn-failed", error: toError(error) }));

    child.on("close", (exitCode) => {
      closed = true;
      finish({ kind: "completed", stdout, stderr, exitCode });
    });
  });
}

/**
 * Pulls the JSON object out of analyzer stdout.
 *
 * The JVM can interleave warnings (for example, "Picked up JAVA_TOOL_OPTIONS")
 * with program output, so the body is sliced between the first `{` and the last
 * `}` instead of assuming stdout is pure JSON.
 */
export function extractAnalyzerResponse(stdout: string): AnalyzerResponse | undefined {
  if (stdout.trim().length === 0) {
    return undefined;
  }

  const direct = tryParse(stdout);
  if (direct) {
    return direct;
  }

  const firstBrace = stdout.indexOf("{");
  const lastBrace = stdout.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return undefined;
  }

  return tryParse(stdout.slice(firstBrace, lastBrace + 1));
}

function tryParse(candidate: string): AnalyzerResponse | undefined {
  try {
    const parsed: unknown = JSON.parse(candidate);
    return isAnalyzerResponse(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function describeError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}
