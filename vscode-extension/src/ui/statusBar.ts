import * as vscode from "vscode";

import { buildDashboardState } from "../model/dashboardModel";
import type { AnalysisStore } from "../services/analysisStore";

/**
 * Status bar entry: a persistent, glanceable summary of the last analysis.
 *
 * This is the only always-visible AEGIS surface, so it doubles as the discovery
 * path for the dashboard - clicking it opens the panel.
 */
export class AegisStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly subscription: vscode.Disposable;

  constructor(
    private readonly store: AnalysisStore,
    private readonly highRiskThreshold: () => number
  ) {
    this.item = vscode.window.createStatusBarItem("aegis.status", vscode.StatusBarAlignment.Right, 100);
    this.item.name = "AEGIS";
    this.item.command = "aegis.openDashboard";
    this.subscription = this.store.onDidChange(() => this.render());
    this.render();
    this.item.show();
  }

  private render(): void {
    const stored = this.store.get();

    if (!stored) {
      this.item.text = "$(telescope) AEGIS";
      this.item.tooltip = "AEGIS: no analysis yet. Click to analyze this project.";
      this.item.backgroundColor = undefined;
      return;
    }

    const state = buildDashboardState(stored.result, stored.workspacePath, this.highRiskThreshold());

    if (state.kind === "empty") {
      this.item.text = "$(telescope) AEGIS $(error)";
      this.item.tooltip = `AEGIS: ${state.statusMessage}`;
      this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
      return;
    }

    const highRisk = state.graph.nodes.filter((node) => node.risk.band === "high").length;
    const sampleMarker = state.source === "sample" ? " $(beaker)" : "";

    this.item.text = `$(telescope) ${state.metrics.typeCount} types · ${highRisk} high risk${sampleMarker}`;

    // A MarkdownString keeps the tooltip readable at this level of detail.
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.appendMarkdown(`**AEGIS — ${state.projectName}**\n\n`);
    if (state.source === "sample") {
      tooltip.appendMarkdown("$(beaker) _Bundled sample data — not this project._\n\n");
    }
    tooltip.appendMarkdown(
      [
        `- ${state.metrics.fileCount} files, ${state.metrics.typeCount} types, ${state.metrics.methodCount} methods`,
        `- ${state.graph.edges.length} dependency edges, ${state.graph.cycles.length} cycle(s)`,
        `- ${highRisk} high-risk type(s) at threshold ${state.highRiskThreshold}`,
        `- Parse health ${state.health.parseSuccessRate}% · ${state.health.errorCount} error(s)`,
        `- Ran in ${(state.durationMs / 1000).toFixed(1)}s`
      ].join("\n")
    );
    tooltip.appendMarkdown("\n\nClick to open the dashboard.");

    this.item.tooltip = tooltip;
    this.item.backgroundColor =
      state.health.errorCount > 0
        ? new vscode.ThemeColor("statusBarItem.warningBackground")
        : undefined;
  }

  dispose(): void {
    this.subscription.dispose();
    this.item.dispose();
  }
}
