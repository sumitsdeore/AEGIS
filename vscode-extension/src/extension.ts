import type * as vscode from "vscode";

import { registerAnalyzeProjectCommand } from "./commands/analyzeProjectCommand";
import { registerShowImpactGraphCommand } from "./commands/showImpactGraphCommand";
import { OutputChannelLogger } from "./logging/outputChannelLogger";
import { LocalAnalyzerService } from "./services/analyzerService";
import { GraphWebviewPanel } from "./services/graphWebviewPanel";
import { VsCodeWorkspaceService } from "./services/workspaceService";

export function activate(context: vscode.ExtensionContext): void {
  const logger = new OutputChannelLogger("AEGIS");
  const workspaceService = new VsCodeWorkspaceService();
  const analyzerService = new LocalAnalyzerService(context, logger);
  const graphPanel = new GraphWebviewPanel(context);

  context.subscriptions.push(logger);
  context.subscriptions.push(graphPanel);

  logger.info("AEGIS extension activated.");

  registerAnalyzeProjectCommand(context, workspaceService, analyzerService, logger);
  registerShowImpactGraphCommand(context, workspaceService, analyzerService, logger, graphPanel);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}
