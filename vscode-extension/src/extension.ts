import * as vscode from "vscode";

import { analyzeProject } from "./commands/analyzeProject";
import type { CommandContext } from "./commands/commandContext";
import { registerCommands } from "./commands/registerCommands";
import { DashboardPanel } from "./dashboard/dashboardPanel";
import { OutputChannelLogger } from "./logging/outputChannelLogger";
import { AnalysisStore } from "./services/analysisStore";
import { LocalAnalyzerService } from "./services/analyzerService";
import { AnalyzerLocator } from "./services/analyzerLocator";
import { CONFIGURATION_SECTION, readConfiguration } from "./services/configuration";
import { VsCodeWorkspaceService } from "./services/workspaceService";
import { AegisStatusBar } from "./ui/statusBar";

/**
 * Activation entry point.
 *
 * Composition happens here and nowhere else: every collaborator is constructed
 * once, wired explicitly, and pushed onto `context.subscriptions` so deactivation
 * is handled by VS Code rather than by hand.
 */
export function activate(context: vscode.ExtensionContext): void {
  const initialConfiguration = readConfiguration();

  const logger = new OutputChannelLogger("AEGIS", initialConfiguration.verboseLogging);
  const workspaceService = new VsCodeWorkspaceService();
  const store = new AnalysisStore();
  const locator = new AnalyzerLocator(context.extensionPath);

  const analyzerService = new LocalAnalyzerService(
    locator,
    // Read on every call rather than capturing: settings can change mid-session
    // and an analysis should always use the current jar path and timeout.
    () => readConfiguration(workspaceService.getWorkspaceRoot()),
    logger,
    context.extensionPath
  );

  const dashboard = new DashboardPanel(
    context.extensionUri,
    store,
    logger,
    () => readConfiguration(workspaceService.getWorkspaceRoot()).highRiskThreshold
  );

  const statusBar = new AegisStatusBar(
    store,
    () => readConfiguration(workspaceService.getWorkspaceRoot()).highRiskThreshold
  );

  const commandContext: CommandContext = {
    analyzerService,
    workspaceService,
    store,
    dashboard,
    logger,
    readConfiguration
  };

  context.subscriptions.push(
    logger,
    store,
    dashboard,
    statusBar,
    ...registerCommands(commandContext),
    // Drives the `aegis.hasAnalysis` clauses in package.json so commands that
    // need a snapshot stay out of the palette until one exists.
    store.onDidChange((stored) => {
      void vscode.commands.executeCommand("setContext", "aegis.hasAnalysis", stored !== undefined);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(CONFIGURATION_SECTION)) {
        return;
      }

      const updated = readConfiguration(workspaceService.getWorkspaceRoot());
      logger.setVerbose(updated.verboseLogging);
      logger.info("AEGIS configuration changed; re-rendering the dashboard.");

      // The risk threshold feeds the risk bands, so an open dashboard would show
      // stale colours until the next analysis without this refresh.
      dashboard.refresh();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      // The stored snapshot belongs to a folder that may no longer be open.
      const stored = store.get();
      const stillOpen = workspaceService
        .getWorkspaceFolders()
        .some((folder) => folder.fsPath === stored?.workspacePath);

      if (stored && !stillOpen) {
        logger.info("The analyzed folder was closed; clearing the stored analysis.");
        store.clear();
      }
    })
  );

  logger.info(
    `AEGIS activated. Analyzer: ${initialConfiguration.analyzerJarPath || "auto-discover"}, ` +
      `risk threshold: ${initialConfiguration.highRiskThreshold}.`
  );

  void vscode.commands.executeCommand("setContext", "aegis.hasAnalysis", false);

  if (initialConfiguration.analyzeOnStartup) {
    // Deliberately quiet and deliberately not awaited: activation must not block
    // on a multi-second analyzer run, and opening a project should not steal focus.
    void analyzeProject(commandContext, { quiet: true }).then(
      (result) => {
        if (result) {
          logger.info(`Startup analysis finished with outcome "${result.outcome}".`);
        }
      },
      (error: unknown) => logger.error("Startup analysis failed.", error)
    );
  }
}

export function deactivate(): void {
  // Everything is registered on `context.subscriptions`; VS Code disposes it.
}
