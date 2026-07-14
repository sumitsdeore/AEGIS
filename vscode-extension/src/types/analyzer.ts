export type AnalyzerStatus = "success" | "unavailable" | "error";

export interface AnalyzeProjectRequest {
  readonly workspacePath: string;
}

export interface AnalyzerDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly message: string;
}

export interface AnalyzeProjectResult {
  readonly status: AnalyzerStatus;
  readonly message: string;
  readonly diagnostics: readonly AnalyzerDiagnostic[];
}

export interface ImpactGraphRequest {
  readonly workspacePath: string;
}

export interface ImpactGraphResult {
  readonly status: AnalyzerStatus;
  readonly message: string;
}
