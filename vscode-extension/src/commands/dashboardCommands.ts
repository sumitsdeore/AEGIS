import * as vscode from "vscode";

import { buildDashboardState } from "../model/dashboardModel";
import type { RiskBand } from "../model/graph";
import { analyzeProject } from "./analyzeProject";
import type { CommandContext } from "./commandContext";

/**
 * Commands that surface the dashboard.
 *
 * All of them share one rule: if nothing has been analyzed yet, run an analysis
 * rather than opening an empty view or showing a "not implemented" toast.
 */

/** `AEGIS: Open Dashboard` */
export async function openDashboard(context: CommandContext): Promise<void> {
  await ensureAnalysis(context);
  context.dashboard.reveal("overview");
}

/** `AEGIS: Show Impact Graph` - the same panel, opened on the graph tab. */
export async function showImpactGraph(context: CommandContext): Promise<void> {
  await ensureAnalysis(context);
  context.dashboard.reveal("graph");
}

/** `AEGIS: Show Spring Insights` */
export async function showSpringInsights(context: CommandContext): Promise<void> {
  await ensureAnalysis(context);
  context.dashboard.reveal("spring");
}

/**
 * `AEGIS: Reveal Type in Impact Graph`.
 *
 * A searchable jump list ordered by risk, so the highest-leverage types are the
 * first thing offered rather than an alphabetical wall.
 */
export async function revealType(context: CommandContext): Promise<void> {
  await ensureAnalysis(context);

  const stored = context.store.get();
  const state = buildDashboardState(
    stored?.result,
    stored?.workspacePath,
    context.readConfiguration().highRiskThreshold
  );

  if (state.kind === "empty" || state.graph.nodes.length === 0) {
    await vscode.window.showInformationMessage(
      "No types are available yet. Run AEGIS: Analyze Project first."
    );
    return;
  }

  const items = [...state.graph.nodes]
    .sort((left, right) => right.risk.score - left.risk.score)
    .map((node) => ({
      label: `${riskIcon(node.risk.band)} ${node.simpleName}`,
      description: `risk ${node.risk.score} · in ${node.fanIn} · out ${node.fanOut} · reach ${node.impactReach}`,
      detail: node.id,
      id: node.id
    }));

  const picked = await vscode.window.showQuickPick(items, {
    title: "AEGIS: reveal a type in the impact graph",
    placeHolder: "Ordered by composite risk score",
    matchOnDetail: true,
    matchOnDescription: true
  });

  if (picked) {
    context.dashboard.focusType(picked.id);
  }
}

/** `AEGIS: Clear Analysis` - forget the snapshot without reloading the window. */
export function clearAnalysis(context: CommandContext): void {
  context.store.clear();
  context.logger.info("Cleared the stored analysis snapshot.");
}

/**
 * Runs an analysis when the store is empty so every entry point works from a
 * cold start. Already-stored results are reused: re-running the analyzer on every
 * view switch would be slow and could show two views disagreeing.
 */
async function ensureAnalysis(context: CommandContext): Promise<void> {
  if (context.store.get()) {
    return;
  }

  await analyzeProject(context, { quiet: true });
}

function riskIcon(band: RiskBand): string {
  switch (band) {
    case "high":
      return "$(flame)";
    case "elevated":
      return "$(warning)";
    case "moderate":
      return "$(info)";
    default:
      return "$(circle-small)";
  }
}
