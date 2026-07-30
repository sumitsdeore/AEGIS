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

export interface DependencyGraphNode {
  readonly id: string;
  readonly label: string;
  readonly qualifiedName: string;
  readonly kind: string;
  readonly packageName: string;
  readonly sourcePath: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface DependencyGraphEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly kind: string;
  readonly label: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface DependencyGraph {
  readonly projectPath: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodes: readonly DependencyGraphNode[];
  readonly edges: readonly DependencyGraphEdge[];
}

export interface ImpactGraphResult {
  readonly status: AnalyzerStatus;
  readonly message: string;
  readonly diagnostics: readonly AnalyzerDiagnostic[];
  readonly dependencyGraph?: DependencyGraph;
}

export interface AnalyzerCommandResponse {
  readonly status: "SUCCESS" | "ERROR";
  readonly command: string;
  readonly message: string;
  readonly diagnostics: readonly AnalyzerDiagnostic[];
  readonly dependencyGraph?: DependencyGraph;
}

export function parseAnalyzerCommandResponse(value: unknown): AnalyzerCommandResponse {
  if (!isRecord(value)) {
    throw new Error("Analyzer response must be a JSON object.");
  }

  const status = value.status;
  if (status !== "SUCCESS" && status !== "ERROR") {
    throw new Error("Analyzer response has an invalid status.");
  }

  if (typeof value.command !== "string" || typeof value.message !== "string") {
    throw new Error("Analyzer response is missing command or message text.");
  }

  const diagnostics = parseDiagnostics(value.diagnostics);
  const dependencyGraph = value.dependencyGraph === undefined || value.dependencyGraph === null
    ? undefined
    : parseDependencyGraph(value.dependencyGraph);

  return {
    status,
    command: value.command,
    message: value.message,
    diagnostics,
    dependencyGraph
  };
}

function parseDiagnostics(value: unknown): readonly AnalyzerDiagnostic[] {
  if (!Array.isArray(value)) {
    throw new Error("Analyzer response is missing diagnostics.");
  }

  return value.map((diagnostic, index) => {
    if (!isRecord(diagnostic) || typeof diagnostic.message !== "string") {
      throw new Error(`Analyzer diagnostic at index ${index} is invalid.`);
    }

    return { severity: parseDiagnosticSeverity(diagnostic.severity, index), message: diagnostic.message };
  });
}

function parseDependencyGraph(value: unknown): DependencyGraph {
  if (!isRecord(value)
    || typeof value.projectPath !== "string"
    || typeof value.nodeCount !== "number"
    || typeof value.edgeCount !== "number"
    || !Array.isArray(value.nodes)
    || !Array.isArray(value.edges)) {
    throw new Error("Analyzer response contains an invalid dependency graph.");
  }

  return {
    projectPath: value.projectPath,
    nodeCount: value.nodeCount,
    edgeCount: value.edgeCount,
    nodes: value.nodes.map(parseGraphNode),
    edges: value.edges.map(parseGraphEdge)
  };
}

function parseGraphNode(value: unknown, index: number): DependencyGraphNode {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || typeof value.label !== "string"
    || typeof value.qualifiedName !== "string"
    || typeof value.kind !== "string"
    || typeof value.packageName !== "string"
    || typeof value.sourcePath !== "string") {
    throw new Error(`Dependency graph node at index ${index} is invalid.`);
  }

  return {
    id: value.id,
    label: value.label,
    qualifiedName: value.qualifiedName,
    kind: value.kind,
    packageName: value.packageName,
    sourcePath: value.sourcePath,
    metadata: parseMetadata(value.metadata, `Dependency graph node at index ${index}`)
  };
}

function parseGraphEdge(value: unknown, index: number): DependencyGraphEdge {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || typeof value.sourceId !== "string"
    || typeof value.targetId !== "string"
    || typeof value.kind !== "string"
    || typeof value.label !== "string") {
    throw new Error(`Dependency graph edge at index ${index} is invalid.`);
  }

  return {
    id: value.id,
    sourceId: value.sourceId,
    targetId: value.targetId,
    kind: value.kind,
    label: value.label,
    metadata: parseMetadata(value.metadata, `Dependency graph edge at index ${index}`)
  };
}

function parseMetadata(value: unknown, context: string): Readonly<Record<string, string>> {
  if (!isRecord(value)) {
    throw new Error(`${context} has invalid metadata.`);
  }

  const metadata: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") {
      throw new Error(`${context} has invalid metadata.`);
    }

    metadata[key] = item;
  }

  return metadata;
}

function parseDiagnosticSeverity(value: unknown, index: number): AnalyzerDiagnostic["severity"] {
  switch (value) {
    case "INFO":
      return "info";
    case "WARNING":
      return "warning";
    case "ERROR":
      return "error";
    default:
      throw new Error(`Analyzer diagnostic at index ${index} has an invalid severity.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
