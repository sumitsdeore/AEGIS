import * as vscode from "vscode";

import type { Logger } from "../logging/outputChannelLogger";
import type { AnalyzerService } from "../services/analyzerService";
import type { GraphPanel } from "../services/graphWebviewPanel";
import type { WorkspaceService } from "../services/workspaceService";

export function registerShowImpactGraphCommand(
  context: vscode.ExtensionContext,
  workspaceService: WorkspaceService,
  analyzerService: AnalyzerService,
  logger: Logger,
  graphPanel: GraphPanel
): void {
  const disposable = vscode.commands.registerCommand("aegis.showImpactGraph", async () => {
    const workspaceRoot = workspaceService.getWorkspaceRoot();

    if (!workspaceRoot) {
      const message = "Open a workspace folder before showing the AEGIS impact graph.";
      logger.warn(message);
      await vscode.window.showWarningMessage(message);
      return;
    }

    logger.info(`Opening impact graph for ${workspaceRoot.fsPath}`);

    try {
      const result = await analyzerService.getImpactGraph({
        workspacePath: workspaceRoot.fsPath
      });

      if (result.status === "success" && result.dependencyGraph) {
        logger.info(
          `Dependency graph ready: ${result.dependencyGraph.nodeCount} node(s), ${result.dependencyGraph.edgeCount} edge(s).`
        );
        graphPanel.show(result.dependencyGraph);
        return;
      }

      await vscode.window.showErrorMessage(result.message, "Show Logs").then((selection) => {
        if (selection === "Show Logs") {
          logger.show();
        }
      });
    } catch (error) {
      const message = "AEGIS impact graph failed unexpectedly.";
      logger.error(message, error);
      await vscode.window.showErrorMessage(`${message} See the AEGIS output channel for details.`);
    }
  });

  context.subscriptions.push(disposable);
}
