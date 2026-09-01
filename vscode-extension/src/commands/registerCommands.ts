import * as vscode from "vscode";

import { analyzeProject } from "./analyzeProject";
import type { CommandContext } from "./commandContext";
import type { CommandId } from "./commandIds";
import {
  clearAnalysis,
  openDashboard,
  revealType,
  showImpactGraph,
  showSpringInsights
} from "./dashboardCommands";
import { exportAnalysis } from "./exportAnalysis";
import { openSource } from "./openSource";

/**
 * Single place where every contributed command is bound to its implementation.
 *
 * The table is keyed by `CommandId`, so the compiler rejects a command that is
 * declared but not implemented, and `commandIds.test.ts` rejects one that is
 * implemented but not contributed in package.json.
 */
export function registerCommands(context: CommandContext): vscode.Disposable[] {
  const handlers: Record<CommandId, (...args: unknown[]) => unknown> = {
    "aegis.analyzeProject": () => analyzeProject(context),
    "aegis.openDashboard": () => openDashboard(context),
    "aegis.showImpactGraph": () => showImpactGraph(context),
    "aegis.showSpringInsights": () => showSpringInsights(context),
    "aegis.revealType": () => revealType(context),
    "aegis.exportAnalysis": () => exportAnalysis(context),
    "aegis.clearAnalysis": () => clearAnalysis(context),
    "aegis.showLogs": () => context.logger.show(),
    "aegis.openSettings": () => vscode.commands.executeCommand("workbench.action.openSettings", "aegis"),
    "aegis.openSource": (sourcePath: unknown, line: unknown) => openSource(context, sourcePath, line)
  };

  return Object.entries(handlers).map(([id, handler]) =>
    vscode.commands.registerCommand(id, async (...args: unknown[]) => {
      try {
        await handler(...args);
      } catch (error) {
        // A command that throws leaves only an unhelpful generic VS Code toast, so
        // failures are logged with a stack and reported against the command name.
        context.logger.error(`Command ${id} failed.`, error);
        const choice = await vscode.window.showErrorMessage(
          `AEGIS: "${id}" failed. See the AEGIS output channel for details.`,
          "Show Logs"
        );
        if (choice === "Show Logs") {
          context.logger.show();
        }
      }
    })
  );
}
