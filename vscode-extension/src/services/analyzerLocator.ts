import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import type { AegisConfiguration } from "./configuration";

/**
 * The analyzer engine is compiled with `--release 21`, so an older JRE will
 * throw UnsupportedClassVersionError. We detect that up front and explain it,
 * rather than surfacing a raw stack trace.
 */
export const REQUIRED_JAVA_MAJOR = 21;

export interface JavaRuntime {
  readonly executable: string;
  /** Feature version, e.g. 21. Undefined when `java -version` was unparseable. */
  readonly majorVersion?: number;
  readonly rawVersion: string;
}

export type LocateFailureReason = "no-java" | "java-too-old" | "no-jar";

export interface AnalyzerLocation {
  readonly javaRuntime: JavaRuntime;
  readonly jarPath: string;
}

export type LocateResult =
  | { readonly kind: "found"; readonly location: AnalyzerLocation }
  | {
      readonly kind: "missing";
      readonly reason: LocateFailureReason;
      readonly message: string;
      /** Populated for `java-too-old` so the message can name the version found. */
      readonly javaRuntime?: JavaRuntime;
      /** Directories that were searched, for the "no-jar" diagnostic. */
      readonly searchedPaths?: readonly string[];
    };

/**
 * Resolves the java executable and analyzer jar needed to run an analysis.
 *
 * Discovery is explicit-first so a user override always wins:
 *   java: `aegis.java.path` -> JAVA_HOME/bin/java -> `java` on PATH
 *   jar:  `aegis.analyzer.jarPath` -> <workspace>/analyzer-engine/target -> bundled
 */
export class AnalyzerLocator {
  constructor(private readonly extensionPath: string) {}

  async locate(configuration: AegisConfiguration, workspacePath: string): Promise<LocateResult> {
    const javaRuntime = await this.resolveJavaRuntime(configuration);
    if (!javaRuntime) {
      return {
        kind: "missing",
        reason: "no-java",
        message:
          "No Java runtime was found. Install JDK 21 or newer, or set `aegis.java.path` to a java executable."
      };
    }

    if (javaRuntime.majorVersion !== undefined && javaRuntime.majorVersion < REQUIRED_JAVA_MAJOR) {
      return {
        kind: "missing",
        reason: "java-too-old",
        javaRuntime,
        message:
          `The analyzer engine requires Java ${REQUIRED_JAVA_MAJOR} or newer, but Java ` +
          `${javaRuntime.majorVersion} was found at ${javaRuntime.executable}. ` +
          "Set `aegis.java.path` to a JDK 21+ installation."
      };
    }

    const searchedPaths = this.candidateJarPaths(configuration, workspacePath);
    const jarPath = searchedPaths.find((candidate) => isReadableFile(candidate));

    if (!jarPath) {
      return {
        kind: "missing",
        reason: "no-jar",
        searchedPaths,
        message:
          "The analyzer engine jar was not found. Build it with `mvn package` in `analyzer-engine/`, " +
          "or set `aegis.analyzer.jarPath`."
      };
    }

    return { kind: "found", location: { javaRuntime, jarPath } };
  }

  /**
   * Candidate jar locations, highest precedence first.
   *
   * Shaded builds also emit `original-*.jar`, which lacks bundled dependencies
   * and would fail at runtime with NoClassDefFoundError, so it is never chosen.
   */
  private candidateJarPaths(configuration: AegisConfiguration, workspacePath: string): string[] {
    const candidates: string[] = [];

    if (configuration.analyzerJarPath) {
      candidates.push(path.resolve(expandHome(configuration.analyzerJarPath)));
    }

    const workspaceTarget = path.join(workspacePath, "analyzer-engine", "target");
    candidates.push(...discoverJarsIn(workspaceTarget));
    candidates.push(...discoverJarsIn(path.join(workspacePath, "target")));
    candidates.push(...discoverJarsIn(path.join(this.extensionPath, "resources", "analyzer")));

    return dedupe(candidates);
  }

  private async resolveJavaRuntime(
    configuration: AegisConfiguration
  ): Promise<JavaRuntime | undefined> {
    for (const executable of this.candidateJavaExecutables(configuration)) {
      const probed = await probeJavaVersion(executable);
      if (probed) {
        return probed;
      }
    }

    return undefined;
  }

  private candidateJavaExecutables(configuration: AegisConfiguration): string[] {
    const binary = process.platform === "win32" ? "java.exe" : "java";
    const candidates: string[] = [];

    if (configuration.javaPath) {
      const configured = path.resolve(expandHome(configuration.javaPath));
      // Accept either a direct executable or a JAVA_HOME-style directory.
      candidates.push(configured, path.join(configured, "bin", binary));
    }

    const javaHome = process.env["JAVA_HOME"];
    if (javaHome && javaHome.trim().length > 0) {
      candidates.push(path.join(javaHome.trim(), "bin", binary));
    }

    // Bare name resolves via PATH in the spawned process.
    candidates.push(binary);

    return dedupe(candidates);
  }
}

/**
 * Runs `java -version` and extracts the feature version.
 *
 * Java writes its version banner to stderr, and the format has changed across
 * releases (`1.8.0_401` vs `21.0.2`), so both shapes are handled.
 */
export function probeJavaVersion(executable: string): Promise<JavaRuntime | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: JavaRuntime | undefined): void => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    let child;
    try {
      child = spawn(executable, ["-version"], { windowsHide: true });
    } catch {
      finish(undefined);
      return;
    }

    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });

    child.on("error", () => finish(undefined));

    let probeClosed = false;
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      const escalation = setTimeout(() => {
        if (!probeClosed) {
          child.kill("SIGKILL");
        }
      }, 3000);
      escalation.unref();
      finish(undefined);
    }, 10_000);

    child.on("close", () => {
      probeClosed = true;
      clearTimeout(timer);
      const rawVersion = output.trim();
      if (rawVersion.length === 0) {
        finish(undefined);
        return;
      }

      finish({
        executable,
        majorVersion: parseJavaMajorVersion(rawVersion),
        rawVersion: rawVersion.split(/\r?\n/)[0] ?? rawVersion
      });
    });
  });
}

/** Extracts the Java feature version from a `java -version` banner. */
export function parseJavaMajorVersion(banner: string): number | undefined {
  const quoted = /version\s+"([^"]+)"/.exec(banner);
  const versionText = quoted?.[1] ?? banner;

  // Legacy scheme: 1.8.0_401 -> 8
  const legacy = /^1\.(\d+)/.exec(versionText);
  if (legacy) {
    const parsed = Number.parseInt(legacy[1], 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  // Modern scheme: 21, 21.0.2, 22-ea
  const modern = /(\d+)/.exec(versionText);
  if (modern) {
    const parsed = Number.parseInt(modern[1], 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function discoverJarsIn(directory: string): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(directory);
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.endsWith(".jar"))
    .filter((entry) => !entry.startsWith("original-"))
    .filter((entry) => !entry.endsWith("-sources.jar") && !entry.endsWith("-javadoc.jar"))
    .sort()
    .map((entry) => path.join(directory, entry));
}

function isReadableFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function expandHome(candidate: string): string {
  if (candidate === "~" || candidate.startsWith(`~${path.sep}`) || candidate.startsWith("~/")) {
    const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "";
    return path.join(home, candidate.slice(1));
  }
  return candidate;
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}
