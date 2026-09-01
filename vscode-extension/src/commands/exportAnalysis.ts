import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { buildDashboardState } from "../model/dashboardModel";
import { hasParsedProject } from "../types/analyzer";
import type { CommandContext } from "./commandContext";

/**
 * `AEGIS: Export Analysis`.
 *
 * Writes both the raw analyzer response and the derived dashboard model. The raw
 * payload is what the jar actually said; the derived model is what the dashboard
 * showed. Exporting only one of them makes a bug report much harder to act on.
 */
export async function exportAnalysis(context: CommandContext): Promise<void> {
  const stored = context.store.get();

  if (!stored) {
    const choice = await vscode.window.showInformationMessage(
      "There is no analysis to export yet.",
      "Analyze Project"
    );
    if (choice === "Analyze Project") {
      await vscode.commands.executeCommand("aegis.analyzeProject");
    }
    return;
  }

  const state = buildDashboardState(
    stored.result,
    stored.workspacePath,
    context.readConfiguration().highRiskThreshold
  );

  const projectName = path.basename(stored.workspacePath) || "project";
  const stamp = stored.completedAt.toISOString().replace(/[:.]/g, "-");

  const target = await vscode.window.showSaveDialog({
    title: "Export AEGIS analysis",
    defaultUri: vscode.Uri.file(path.join(stored.workspacePath, `aegis-analysis-${projectName}-${stamp}.json`)),
    filters: { JSON: ["json"] }
  });

  if (!target) {
    return;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: "AEGIS VS Code extension",
    workspacePath: stored.workspacePath,
    run: {
      outcome: stored.result.outcome,
      message: stored.result.message,
      // Sample runs are labelled here too, so an exported file can never be
      // mistaken for a real measurement of the project.
      source: stored.result.source,
      durationMs: stored.result.durationMs,
      javaVersion: stored.result.javaVersion,
      analyzerJarPath: stored.result.analyzerJarPath,
      diagnostics: stored.result.diagnostics
    },
    analyzerResponse: stored.result.response ?? null,
    derivedModel: state
  };

  try {
    await fs.promises.writeFile(target.fsPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch (error) {
    context.logger.error(`Failed to export the analysis to ${target.fsPath}.`, error);
    await vscode.window.showErrorMessage(
      `AEGIS could not write ${target.fsPath}. See the AEGIS output channel for details.`
    );
    return;
  }

  const typeCount =
    stored.result.response && hasParsedProject(stored.result.response)
      ? stored.result.response.parsedProject.typeCount
      : 0;

  context.logger.info(`Exported analysis (${typeCount} type(s)) to ${target.fsPath}.`);

  const choice = await vscode.window.showInformationMessage(
    `Exported the AEGIS analysis to ${path.basename(target.fsPath)}.`,
    "Open File",
    "Reveal in Explorer"
  );

  if (choice === "Open File") {
    const document = await vscode.workspace.openTextDocument(target);
    await vscode.window.showTextDocument(document, { preview: false });
  } else if (choice === "Reveal in Explorer") {
    await vscode.commands.executeCommand("revealFileInOS", target);
  }
}
