import * as path from "path";
import * as vscode from "vscode";

import { hasParsedProject } from "../types/analyzer";
import type { AnalysisResult } from "../types/service";
import type { CommandContext } from "./commandContext";
import { resolveTargetFolder } from "./resolveTargetFolder";

export interface AnalyzeOptions {
  /**
   * Suppress the completion toast and do not force the dashboard open. Used by
   * the analyze-on-startup path so opening a project is never hijacked by AEGIS.
   */
  readonly quiet?: boolean;
  /** Analyze this folder instead of prompting. */
  readonly folder?: vscode.Uri;
}

/**
 * `AEGIS: Analyze Project`.
 *
 * Runs the analyzer jar for real, reports progress, honours the Cancel button,
 * stores the snapshot, and routes the user to whichever follow-up action is
 * actually useful for the outcome they got.
 */
export async function analyzeProject(
  context: CommandContext,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult | undefined> {
  const folder = options.folder ?? (await resolveTargetFolder(context));
  if (!folder) {
    return undefined;
  }

  const projectName = path.basename(folder.fsPath);
  let cancelled = false;

  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `AEGIS: analyzing ${projectName}`,
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: "Locating the analyzer and a compatible JDK…" });

      // The analyzer reports no intermediate progress, so switch the message once
      // rather than faking a percentage that would only mislead.
      const handoff = setTimeout(
        () => progress.report({ message: "Parsing sources and deriving impact…" }),
        700
      );

      try {
        return await context.analyzerService.analyzeProject({
          workspacePath: folder.fsPath,
          isCancellationRequested: () => token.isCancellationRequested
        });
      } finally {
        clearTimeout(handoff);
        cancelled = token.isCancellationRequested;
      }
    }
  );

  if (cancelled) {
    context.logger.info(`Analysis of ${folder.fsPath} was cancelled.`);
    return undefined;
  }

  context.store.set(result, folder.fsPath);
  await reportOutcome(context, result, options.quiet === true);

  return result;
}

async function reportOutcome(
  context: CommandContext,
  result: AnalysisResult,
  quiet: boolean
): Promise<void> {
  // Refresh an already-open dashboard even in quiet mode; only forcing a new
  // panel open is suppressed.
  if (!quiet || context.dashboard.isOpen) {
    context.dashboard.reveal();
  }

  if (quiet) {
    return;
  }

  if (result.outcome === "success" && result.response && hasParsedProject(result.response)) {
    const parsed = result.response.parsedProject;
    const seconds = (result.durationMs / 1000).toFixed(1);
    const summary =
      `AEGIS analyzed ${parsed.fileCount} file(s), ${parsed.typeCount} type(s) ` +
      `and ${parsed.methodCount} method(s) in ${seconds}s.`;

    const choice = await vscode.window.showInformationMessage(summary, "Open Dashboard", "Export JSON");
    if (choice === "Open Dashboard") {
      context.dashboard.reveal();
    } else if (choice === "Export JSON") {
      await vscode.commands.executeCommand("aegis.exportAnalysis");
    }
    return;
  }

  if (result.outcome === "unavailable") {
    const actions = result.source === "sample"
      ? ["Open Dashboard", "Configure Analyzer", "Show Logs"]
      : ["Configure Analyzer", "Show Logs"];

    const detail = result.source === "sample"
      ? `${result.message} Showing bundled sample data in the meantime.`
      : result.message;

    const choice = await vscode.window.showWarningMessage(detail, ...actions);
    if (choice === "Open Dashboard") {
      context.dashboard.reveal();
    } else if (choice === "Configure Analyzer") {
      await vscode.commands.executeCommand("workbench.action.openSettings", "aegis");
    } else if (choice === "Show Logs") {
      context.logger.show();
    }
    return;
  }

  const choice = await vscode.window.showErrorMessage(result.message, "Show Logs", "Open Dashboard");
  if (choice === "Show Logs") {
    context.logger.show();
  } else if (choice === "Open Dashboard") {
    context.dashboard.reveal();
  }
}
