import type {
  AnalyzeProjectRequest,
  AnalyzeProjectResult,
  ImpactGraphRequest,
  ImpactGraphResult
} from "../types/analyzer";

export interface AnalyzerService {
  analyzeProject(request: AnalyzeProjectRequest): Promise<AnalyzeProjectResult>;
  getImpactGraph(request: ImpactGraphRequest): Promise<ImpactGraphResult>;
}

export class LocalAnalyzerService implements AnalyzerService {
  public async analyzeProject(request: AnalyzeProjectRequest): Promise<AnalyzeProjectResult> {
    return {
      status: "unavailable",
      message: `Analyzer process integration is planned for Milestone 6. Workspace: ${request.workspacePath}`,
      diagnostics: [
        {
          severity: "info",
          message: "The Java analyzer engine is available as a standalone CLI in analyzer-engine."
        }
      ]
    };
  }

  public async getImpactGraph(request: ImpactGraphRequest): Promise<ImpactGraphResult> {
    return {
      status: "unavailable",
      message: `Impact graph webview integration is planned for Milestone 9. Workspace: ${request.workspacePath}`
    };
  }
}
