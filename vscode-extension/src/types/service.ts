/**
 * Extension-internal ports and result envelopes.
 *
 * These are deliberately separate from `types/analyzer.ts`: that file is the
 * analyzer's wire format, this one is how the extension talks to itself. Keeping
 * them apart means a change to the Java JSON never silently reshapes the UI.
 */

import type { Uri } from "vscode";
import type { AnalyzerResponse, Diagnostic } from "./analyzer";

/** Where an analysis result came from. Surfaced in the dashboard as a badge. */
export type AnalysisSource = "analyzer" | "sample";

/**
 * Outcome of an analysis attempt.
 *
 * - `success`  - the analyzer ran and reported SUCCESS.
 * - `unavailable` - the analyzer could not be run at all (no JDK, no jar).
 * - `error`    - the analyzer ran but reported ERROR, or its output was unusable.
 */
export type AnalysisOutcome = "success" | "unavailable" | "error";

export interface AnalyzerRequest {
  readonly workspacePath: string;
  /** Optional cooperative cancellation, wired to the VS Code progress UI. */
  readonly isCancellationRequested?: () => boolean;
}

export interface AnalysisResult {
  readonly outcome: AnalysisOutcome;
  readonly message: string;
  readonly diagnostics: readonly Diagnostic[];
  /** Present whenever the analyzer produced parseable JSON. */
  readonly response?: AnalyzerResponse;
  readonly source: AnalysisSource;
  /** Wall-clock duration of the analyzer process, in milliseconds. */
  readonly durationMs: number;
  /** Absolute path of the jar that produced this result, when known. */
  readonly analyzerJarPath?: string;
  /** Reported Java feature version, when it could be determined. */
  readonly javaVersion?: string;
}

export interface AnalyzerService {
  analyzeProject(request: AnalyzerRequest): Promise<AnalysisResult>;
}

export interface WorkspaceService {
  /** First workspace folder, or undefined when no folder is open. */
  getWorkspaceRoot(): Uri | undefined;
  /** All open workspace folders, for multi-root disambiguation. */
  getWorkspaceFolders(): readonly Uri[];
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
  show(): void;
}
