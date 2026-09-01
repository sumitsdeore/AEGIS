/**
 * TypeScript mirror of the analyzer engine's JSON contract.
 *
 * Every interface here corresponds 1:1 to a Java record in
 * `analyzer-engine/src/main/java/dev/aegis/analyzer`. Jackson serializes record
 * components using their declared names and enums using `name()`, so the wire
 * format uses UPPER_SNAKE enum values.
 *
 * Keep this file in lockstep with the Java records. If a record gains a
 * component, add it here and extend `isAnalyzerResponse` below.
 */

/** Mirrors `core.AnalysisStatus`. */
export type AnalysisStatus = "SUCCESS" | "ERROR";

/** Mirrors `core.DiagnosticSeverity`. */
export type DiagnosticSeverity = "INFO" | "WARNING" | "ERROR";

/** Mirrors `scanner.BuildTool`. */
export type BuildTool = "MAVEN" | "GRADLE" | "UNKNOWN";

/** Mirrors `parser.TypeKind`. */
export type TypeKind = "CLASS" | "INTERFACE" | "ENUM" | "RECORD" | "ANNOTATION";

/** Mirrors `core.Diagnostic`. */
export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly message: string;
}

/** Mirrors `parser.ParseDiagnostic`. */
export interface ParseDiagnostic {
  readonly severity: DiagnosticSeverity;
  readonly sourcePath: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
}

/** Mirrors `parser.SourceRange`. A range of all zeroes means "unknown". */
export interface SourceRange {
  readonly beginLine: number;
  readonly beginColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/** Mirrors `parser.ParsedAnnotation`. */
export interface ParsedAnnotation {
  readonly name: string;
  readonly arguments: Readonly<Record<string, string>>;
}

/** Mirrors `parser.ParsedParameter`. */
export interface ParsedParameter {
  readonly name: string;
  readonly type: string;
}

/** Mirrors `parser.ParsedField`. */
export interface ParsedField {
  readonly name: string;
  readonly type: string;
  readonly modifiers: readonly string[];
  readonly annotations: readonly string[];
  readonly annotationDetails?: readonly ParsedAnnotation[];
  readonly sourceRange: SourceRange;
}

/** Mirrors `parser.ParsedMethod`. */
export interface ParsedMethod {
  readonly name: string;
  readonly returnType: string;
  readonly parameters: readonly ParsedParameter[];
  readonly modifiers: readonly string[];
  readonly annotations: readonly string[];
  readonly annotationDetails?: readonly ParsedAnnotation[];
  readonly sourceRange: SourceRange;
}

/**
 * Mirrors `parser.ParsedType`.
 *
 * Captures type declaration, modifiers, annotations, superclass, implemented
 * interfaces, member fields, and methods.
 */
export interface ParsedType {
  readonly qualifiedName: string;
  readonly simpleName: string;
  readonly packageName: string;
  readonly kind: TypeKind;
  /** Path relative to the project root, as produced by the analyzer. */
  readonly sourcePath: string;
  readonly modifiers: readonly string[];
  readonly annotations: readonly string[];
  readonly annotationDetails?: readonly ParsedAnnotation[];
  readonly superclass?: string | null;
  readonly interfaces?: readonly string[];
  readonly fields: readonly ParsedField[];
  readonly methods: readonly ParsedMethod[];
  readonly sourceRange: SourceRange;
}

/** Mirrors `parser.ParsedJavaFile`. */
export interface ParsedJavaFile {
  readonly sourceRoot: string;
  /** Path relative to the *source root*, not the project root. */
  readonly relativePath: string;
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly types: readonly ParsedType[];
  readonly diagnostics: readonly ParseDiagnostic[];
}

/** Mirrors `parser.ParsedProject`. */
export interface ParsedProject {
  readonly projectPath: string;
  readonly fileCount: number;
  readonly typeCount: number;
  readonly methodCount: number;
  readonly fieldCount: number;
  readonly files: readonly ParsedJavaFile[];
  readonly diagnostics: readonly ParseDiagnostic[];
}

/** Mirrors `scanner.ProjectScanResult`. */
export interface ProjectScanResult {
  readonly projectPath: string;
  readonly buildTool: BuildTool;
  readonly sourceRoots: readonly string[];
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Mirrors `core.AnalyzerResponse`.
 *
 * `project` and `parsedProject` are null when the analyzer failed before
 * scanning (for example on a CLI parse error), so both are optional here.
 */
export interface AnalyzerResponse {
  readonly status: AnalysisStatus;
  readonly command: string;
  readonly message: string;
  /** ISO-8601 instant, e.g. `2026-08-31T10:15:30.123Z`. */
  readonly generatedAt: string;
  readonly project?: ProjectScanResult | null;
  readonly parsedProject?: ParsedProject | null;
  readonly diagnostics: readonly Diagnostic[];
}

// ---------------------------------------------------------------------------
// Runtime validation
//
// The analyzer is an external process, so its stdout is untrusted input. These
// guards keep malformed payloads from reaching the dashboard as `undefined`
// property accesses.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/**
 * Narrows untrusted parsed JSON to an `AnalyzerResponse`.
 *
 * Deliberately shallow: it validates the envelope fields the extension always
 * reads, and tolerates nested shape drift so a newer analyzer that adds fields
 * still works with an older extension.
 */
export function isAnalyzerResponse(value: unknown): value is AnalyzerResponse {
  if (!isRecord(value)) {
    return false;
  }

  const statusValid = value["status"] === "SUCCESS" || value["status"] === "ERROR";
  const commandValid = typeof value["command"] === "string";
  const messageValid = typeof value["message"] === "string";
  const generatedAtValid = typeof value["generatedAt"] === "string";
  const diagnosticsValid = Array.isArray(value["diagnostics"]);

  return statusValid && commandValid && messageValid && generatedAtValid && diagnosticsValid;
}

/** True when the response carries a usable parsed project. */
export function hasParsedProject(
  response: AnalyzerResponse
): response is AnalyzerResponse & { parsedProject: ParsedProject } {
  const parsed: unknown = response.parsedProject;
  return isRecord(parsed) && Array.isArray(parsed["files"]);
}

/** Flattens every type across every parsed file, in stable order. */
export function collectTypes(parsedProject: ParsedProject): ParsedType[] {
  const types: ParsedType[] = [];
  for (const file of parsedProject.files) {
    for (const type of file.types) {
      types.push(type);
    }
  }
  return types;
}

/** Total import count across the project, used for parser coverage metrics. */
export function countImports(parsedProject: ParsedProject): number {
  return parsedProject.files.reduce(
    (total, file) => total + (isStringArray(file.imports) ? file.imports.length : 0),
    0
  );
}
