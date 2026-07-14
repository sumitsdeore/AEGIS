import type * as vscode from "vscode";

import { registerAnalyzeProjectCommand } from "./commands/analyzeProjectCommand";
import { registerShowImpactGraphCommand } from "./commands/showImpactGraphCommand";
import { OutputChannelLogger } from "./logging/outputChannelLogger";
import { LocalAnalyzerService } from "./services/analyzerService";
import { VsCodeWorkspaceService } from "./services/workspaceService";

export function activate(context: vscode.ExtensionContext): void {
  const logger = new OutputChannelLogger("AEGIS");
  const workspaceService = new VsCodeWorkspaceService();
  const analyzerService = new LocalAnalyzerService();

  context.subscriptions.push(logger);

  logger.info("AEGIS extension activated.");

  registerAnalyzeProjectCommand(context, workspaceService, analyzerService, logger);
  registerShowImpactGraphCommand(context, workspaceService, analyzerService, logger);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}
