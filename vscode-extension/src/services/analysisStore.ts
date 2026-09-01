import * as vscode from "vscode";

import type { AnalysisResult } from "../types/service";

export interface StoredAnalysis {
  readonly result: AnalysisResult;
  readonly workspacePath: string;
  readonly completedAt: Date;
}

/**
 * Holds the most recent analysis so the dashboard, the impact graph, and the
 * status bar all render the same snapshot.
 *
 * Without this, opening the dashboard would re-run the analyzer and the two
 * views could disagree.
 */
export class AnalysisStore implements vscode.Disposable {
  private current: StoredAnalysis | undefined;
  private readonly emitter = new vscode.EventEmitter<StoredAnalysis | undefined>();

  /** Fires whenever the stored analysis is replaced or cleared. */
  readonly onDidChange: vscode.Event<StoredAnalysis | undefined> = this.emitter.event;

  get(): StoredAnalysis | undefined {
    return this.current;
  }

  set(result: AnalysisResult, workspacePath: string): StoredAnalysis {
    const stored: StoredAnalysis = { result, workspacePath, completedAt: new Date() };
    this.current = stored;
    this.emitter.fire(stored);
    return stored;
  }

  clear(): void {
    this.current = undefined;
    this.emitter.fire(undefined);
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
