import * as vscode from "vscode";

import type { Logger } from "../logging/outputChannelLogger";
import type { AnalyzerService } from "../services/analyzerService";
import type { WorkspaceService } from "../services/workspaceService";

export function registerAnalyzeProjectCommand(
  context: vscode.ExtensionContext,
  workspaceService: WorkspaceService,
  analyzerService: AnalyzerService,
  logger: Logger
): void {
  const disposable = vscode.commands.registerCommand("aegis.analyzeProject", async () => {
    const workspaceRoot = workspaceService.getWorkspaceRoot();

    if (!workspaceRoot) {
      const message = "Open a workspace folder before running AEGIS analysis.";
      logger.warn(message);
      await vscode.window.showWarningMessage(message);
      return;
    }

    logger.info(`Starting project analysis for ${workspaceRoot.fsPath}`);

    try {
      const result = await analyzerService.analyzeProject({
        workspacePath: workspaceRoot.fsPath
      });

      const showMessage = result.status === "success"
        ? vscode.window.showInformationMessage
        : vscode.window.showErrorMessage;
      await showMessage(result.message, "Show Logs").then((selection) => {
        if (selection === "Show Logs") {
          logger.show();
        }
      });
    } catch (error) {
      const message = "AEGIS analysis failed unexpectedly.";
      logger.error(message, error);
      await vscode.window.showErrorMessage(`${message} See the AEGIS output channel for details.`);
    }
  });

  context.subscriptions.push(disposable);
}
