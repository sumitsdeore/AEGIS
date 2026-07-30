import type * as vscode from "vscode";

import type { Logger } from "../logging/outputChannelLogger";
import {
  parseAnalyzerCommandResponse,
  type AnalyzeProjectRequest,
  type AnalyzeProjectResult,
  type AnalyzerDiagnostic,
  type ImpactGraphRequest,
  type ImpactGraphResult
} from "../types/analyzer";
import { AnalyzerJarResolver } from "./analyzerJarResolver";
import { JavaAnalyzerProcessRunner, type AnalyzerProcessRunner } from "./analyzerProcessRunner";

export interface AnalyzerService {
  analyzeProject(request: AnalyzeProjectRequest): Promise<AnalyzeProjectResult>;
  getImpactGraph(request: ImpactGraphRequest): Promise<ImpactGraphResult>;
}

interface AnalyzerUnavailableResult {
  readonly status: "unavailable";
  readonly message: string;
  readonly diagnostics: readonly AnalyzerDiagnostic[];
}

export class LocalAnalyzerService implements AnalyzerService {
  private readonly jarResolver: AnalyzerJarResolver;
  private readonly processRunner: AnalyzerProcessRunner;

  public constructor(
    context: vscode.ExtensionContext,
    private readonly logger: Logger,
    processRunner: AnalyzerProcessRunner = new JavaAnalyzerProcessRunner()
  ) {
    this.jarResolver = new AnalyzerJarResolver(context.extensionPath);
    this.processRunner = processRunner;
  }

  public async analyzeProject(request: AnalyzeProjectRequest): Promise<AnalyzeProjectResult> {
    const response = await this.execute(request.workspacePath, "analyze");
    if (response.status === "unavailable") {
      return response;
    }

    return {
      status: response.status === "SUCCESS" ? "success" : "error",
      message: response.message,
      diagnostics: response.diagnostics
    };
  }

  public async getImpactGraph(request: ImpactGraphRequest): Promise<ImpactGraphResult> {
    const response = await this.execute(request.workspacePath, "graph");
    if (response.status === "unavailable") {
      return response;
    }

    if (response.status === "SUCCESS" && response.dependencyGraph === undefined) {
      const message = "Analyzer completed without a dependency graph.";
      this.logger.error(message);
      return { status: "error", message, diagnostics: response.diagnostics };
    }

    return {
      status: response.status === "SUCCESS" ? "success" : "error",
      message: response.message,
      diagnostics: response.diagnostics,
      dependencyGraph: response.dependencyGraph
    };
  }

  private async execute(
    workspacePath: string,
    command: "analyze" | "graph"
  ): Promise<ReturnType<typeof parseAnalyzerCommandResponse> | AnalyzerUnavailableResult> {
    const resolution = this.jarResolver.resolve(workspacePath);
    if (resolution.jarPath === undefined) {
      this.logger.warn(resolution.message);
      return {
        status: "unavailable",
        message: resolution.message,
        diagnostics: [{ severity: "error", message: resolution.message }]
      };
    }

    this.logger.info(`Running analyzer command '${command}' for ${workspacePath}.`);

    try {
      const output = await this.processRunner.run(resolution.jarPath, workspacePath, command);
      const response = parseAnalyzerCommandResponse(JSON.parse(output) as unknown);
      this.logDiagnostics(response.diagnostics);
      return response;
    } catch (error) {
      const message = `AEGIS analyzer execution failed: ${errorMessage(error)}`;
      this.logger.error(message, error);
      return {
        status: "ERROR",
        command,
        message,
        diagnostics: [{ severity: "error", message }]
      };
    }
  }

  private logDiagnostics(diagnostics: readonly AnalyzerDiagnostic[]): void {
    for (const diagnostic of diagnostics) {
      const message = `${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`;
      if (diagnostic.severity === "error") {
        this.logger.error(message);
      } else if (diagnostic.severity === "warning") {
        this.logger.warn(message);
      } else {
        this.logger.info(message);
      }
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
