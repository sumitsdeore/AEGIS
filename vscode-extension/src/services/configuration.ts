import * as vscode from "vscode";

/** Strongly typed view over the `aegis.*` settings contributed in package.json. */
export interface AegisConfiguration {
  /** Explicit analyzer jar path. Empty means "auto-discover". */
  readonly analyzerJarPath: string;
  /** Explicit java executable or JAVA_HOME. Empty means "auto-discover". */
  readonly javaPath: string;
  /** Hard timeout for the analyzer process. */
  readonly timeoutMs: number;
  /** Fall back to bundled sample data when the analyzer cannot run. */
  readonly useSampleDataWhenUnavailable: boolean;
  /** Automatically analyze when a Java workspace is opened. */
  readonly analyzeOnStartup: boolean;
  /** Minimum composite risk score to highlight a type as high risk. */
  readonly highRiskThreshold: number;
  /** Emit DEBUG lines to the AEGIS output channel. */
  readonly verboseLogging: boolean;
}

export const CONFIGURATION_SECTION = "aegis";

const DEFAULTS: AegisConfiguration = {
  analyzerJarPath: "",
  javaPath: "",
  timeoutMs: 120_000,
  useSampleDataWhenUnavailable: true,
  analyzeOnStartup: false,
  highRiskThreshold: 70,
  verboseLogging: false
};

/**
 * Reads AEGIS settings, clamping numeric values so a hand-edited settings.json
 * cannot produce a zero timeout or an out-of-range threshold.
 */
export function readConfiguration(scope?: vscode.Uri): AegisConfiguration {
  const configuration = vscode.workspace.getConfiguration(CONFIGURATION_SECTION, scope ?? null);

  return {
    analyzerJarPath: configuration.get<string>("analyzer.jarPath", DEFAULTS.analyzerJarPath).trim(),
    javaPath: configuration.get<string>("java.path", DEFAULTS.javaPath).trim(),
    timeoutMs: clamp(
      configuration.get<number>("analyzer.timeoutMs", DEFAULTS.timeoutMs),
      5_000,
      600_000,
      DEFAULTS.timeoutMs
    ),
    useSampleDataWhenUnavailable: configuration.get<boolean>(
      "dashboard.useSampleDataWhenUnavailable",
      DEFAULTS.useSampleDataWhenUnavailable
    ),
    analyzeOnStartup: configuration.get<boolean>("analyzeOnStartup", DEFAULTS.analyzeOnStartup),
    highRiskThreshold: clamp(
      configuration.get<number>("risk.highThreshold", DEFAULTS.highRiskThreshold),
      1,
      100,
      DEFAULTS.highRiskThreshold
    ),
    verboseLogging: configuration.get<boolean>("verboseLogging", DEFAULTS.verboseLogging)
  };
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}
