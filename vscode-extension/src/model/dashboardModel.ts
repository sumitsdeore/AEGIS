import type { AnalysisResult } from "../types/service";
import type {
  BuildTool,
  Diagnostic,
  DiagnosticSeverity,
  ParsedProject,
  TypeKind
} from "../types/analyzer";
import { collectTypes, countImports, hasParsedProject } from "../types/analyzer";
import type { DependencyGraph } from "./graph";
import { buildDependencyGraph } from "./graph";
import type { SpringInsights } from "./insights";
import { deriveSpringInsights } from "./insights";

/**
 * Assembles the single payload the dashboard webview renders.
 *
 * All derivation happens here in the extension host rather than in the webview,
 * so the webview stays a pure renderer and the same model can be reused by other
 * views or exported to JSON.
 */

export interface ProjectMetrics {
  readonly fileCount: number;
  readonly typeCount: number;
  readonly methodCount: number;
  readonly fieldCount: number;
  readonly importCount: number;
  readonly packageCount: number;
  readonly averageMethodsPerType: number;
  readonly averageFieldsPerType: number;
  readonly largestType?: { readonly name: string; readonly memberCount: number };
  readonly kindBreakdown: readonly { readonly kind: TypeKind; readonly count: number }[];
}

export interface HealthSummary {
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  /** Files that produced at least one parse error. */
  readonly filesWithParseErrors: number;
  /** Share of files that parsed without error, 0-100. */
  readonly parseSuccessRate: number;
  readonly diagnostics: readonly Diagnostic[];
}

export interface DashboardModel {
  readonly generatedAt: string;
  readonly source: "analyzer" | "sample";
  readonly outcome: AnalysisResult["outcome"];
  readonly statusMessage: string;
  readonly projectPath: string;
  readonly projectName: string;
  readonly buildTool: BuildTool;
  readonly sourceRoots: readonly string[];
  readonly durationMs: number;
  readonly javaVersion?: string;
  readonly analyzerJarPath?: string;
  readonly metrics: ProjectMetrics;
  readonly health: HealthSummary;
  readonly spring: SpringInsights;
  readonly graph: DependencyGraph;
  readonly highRiskThreshold: number;
}

/** Model used when no analysis has run yet, or when the analyzer produced nothing. */
export interface EmptyDashboardModel {
  readonly kind: "empty";
  readonly outcome: AnalysisResult["outcome"] | "idle";
  readonly statusMessage: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly projectPath?: string;
}

export type DashboardState =
  | ({ readonly kind: "populated" } & DashboardModel)
  | EmptyDashboardModel;

export function buildDashboardState(
  result: AnalysisResult | undefined,
  workspacePath: string | undefined,
  highRiskThreshold: number
): DashboardState {
  if (!result) {
    return {
      kind: "empty",
      outcome: "idle",
      statusMessage: "No analysis has run yet. Run AEGIS: Analyze Project to get started.",
      diagnostics: [],
      projectPath: workspacePath
    };
  }

  const response = result.response;
  if (!response || !hasParsedProject(response)) {
    return {
      kind: "empty",
      outcome: result.outcome,
      statusMessage: result.message,
      diagnostics: result.diagnostics,
      projectPath: workspacePath
    };
  }

  const parsedProject = response.parsedProject;
  const spring = deriveSpringInsights(parsedProject);
  const graph = buildDependencyGraph(parsedProject, spring, highRiskThreshold);
  const projectPath = response.project?.projectPath ?? parsedProject.projectPath ?? workspacePath ?? "";

  return {
    kind: "populated",
    generatedAt: response.generatedAt,
    source: result.source,
    outcome: result.outcome,
    statusMessage: result.message,
    projectPath,
    projectName: basename(projectPath),
    buildTool: response.project?.buildTool ?? "UNKNOWN",
    sourceRoots: response.project?.sourceRoots ?? [],
    durationMs: result.durationMs,
    javaVersion: result.javaVersion,
    analyzerJarPath: result.analyzerJarPath,
    metrics: computeMetrics(parsedProject),
    health: computeHealth(parsedProject, result.diagnostics),
    spring,
    graph,
    highRiskThreshold
  };
}

function computeMetrics(parsedProject: ParsedProject): ProjectMetrics {
  const types = collectTypes(parsedProject);
  const packages = new Set(types.map((type) => type.packageName));
  const kindTally = new Map<TypeKind, number>();

  let largestType: { name: string; memberCount: number } | undefined;

  for (const type of types) {
    kindTally.set(type.kind, (kindTally.get(type.kind) ?? 0) + 1);

    const memberCount = type.methods.length + type.fields.length;
    if (!largestType || memberCount > largestType.memberCount) {
      largestType = { name: type.simpleName, memberCount };
    }
  }

  const typeCount = Math.max(1, types.length);

  return {
    fileCount: parsedProject.fileCount,
    typeCount: types.length,
    methodCount: parsedProject.methodCount,
    fieldCount: parsedProject.fieldCount,
    importCount: countImports(parsedProject),
    packageCount: packages.size,
    averageMethodsPerType: round1(parsedProject.methodCount / typeCount),
    averageFieldsPerType: round1(parsedProject.fieldCount / typeCount),
    largestType,
    kindBreakdown: [...kindTally.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((left, right) => right.count - left.count)
  };
}

function computeHealth(
  parsedProject: ParsedProject,
  runDiagnostics: readonly Diagnostic[]
): HealthSummary {
  const tally: Record<DiagnosticSeverity, number> = { INFO: 0, WARNING: 0, ERROR: 0 };

  for (const diagnostic of runDiagnostics) {
    if (diagnostic.severity in tally) {
      tally[diagnostic.severity] += 1;
    }
  }

  const filesWithParseErrors = parsedProject.files.filter((file) =>
    file.diagnostics.some((diagnostic) => diagnostic.severity === "ERROR")
  ).length;

  const parseSuccessRate =
    parsedProject.fileCount === 0
      ? 100
      : Math.round(((parsedProject.fileCount - filesWithParseErrors) / parsedProject.fileCount) * 100);

  return {
    errorCount: tally.ERROR,
    warningCount: tally.WARNING,
    infoCount: tally.INFO,
    filesWithParseErrors,
    parseSuccessRate,
    diagnostics: runDiagnostics
  };
}

function basename(candidate: string): string {
  if (!candidate) {
    return "Unknown project";
  }
  const segments = candidate.split(/[\\/]/).filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? candidate;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
