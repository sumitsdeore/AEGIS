import type * as vscode from "vscode";

import type { DashboardPanel } from "../dashboard/dashboardPanel";
import type { AegisConfiguration } from "../services/configuration";
import type { AnalysisStore } from "../services/analysisStore";
import type { AnalyzerService, Logger, WorkspaceService } from "../types/service";

/**
 * The collaborators every AEGIS command needs.
 *
 * Passing this explicitly instead of reaching for module-level singletons keeps
 * each command unit-testable with fakes and makes the dependency direction of the
 * extension obvious from a single file.
 */
export interface CommandContext {
  readonly analyzerService: AnalyzerService;
  readonly workspaceService: WorkspaceService;
  readonly store: AnalysisStore;
  readonly dashboard: DashboardPanel;
  readonly logger: Logger;
  readonly readConfiguration: (scope?: vscode.Uri) => AegisConfiguration;
}
