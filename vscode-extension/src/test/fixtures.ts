import * as fs from "fs";
import * as path from "path";

import type {
  AnalyzerResponse,
  ParsedField,
  ParsedJavaFile,
  ParsedMethod,
  ParsedProject,
  ParsedType,
  SourceRange,
  TypeKind
} from "../types/analyzer";

/**
 * Builders for the analyzer's wire format.
 *
 * Written by hand rather than captured from a real run so a test can express
 * exactly one interesting property (a cycle, a layering violation, an ambiguous
 * simple name) without dragging thirty unrelated types along with it.
 */

const ORIGIN: SourceRange = { beginLine: 1, beginColumn: 1, endLine: 20, endColumn: 1 };

export function makeField(name: string, type: string, annotations: string[] = []): ParsedField {
  return { name, type, modifiers: ["private", "final"], annotations, sourceRange: ORIGIN };
}

export function makeMethod(
  name: string,
  returnType = "void",
  parameterTypes: string[] = [],
  annotations: string[] = []
): ParsedMethod {
  return {
    name,
    returnType,
    parameters: parameterTypes.map((type, index) => ({ name: `arg${index}`, type })),
    modifiers: ["public"],
    annotations,
    sourceRange: ORIGIN
  };
}

export interface TypeSpec {
  readonly qualifiedName: string;
  readonly kind?: TypeKind;
  readonly annotations?: string[];
  readonly fields?: ParsedField[];
  readonly methods?: ParsedMethod[];
  /** Imports declared by the file containing this type. */
  readonly imports?: string[];
}

export function makeType(spec: TypeSpec): ParsedType {
  const lastDot = spec.qualifiedName.lastIndexOf(".");
  const packageName = lastDot === -1 ? "" : spec.qualifiedName.slice(0, lastDot);
  const simpleName = spec.qualifiedName.slice(lastDot + 1);

  return {
    qualifiedName: spec.qualifiedName,
    simpleName,
    packageName,
    kind: spec.kind ?? "CLASS",
    sourcePath: `src/main/java/${spec.qualifiedName.split(".").join("/")}.java`,
    modifiers: ["public"],
    annotations: spec.annotations ?? [],
    fields: spec.fields ?? [],
    methods: spec.methods ?? [],
    sourceRange: ORIGIN
  };
}

/** One file per type, which is the common case in real Java projects. */
export function makeProject(specs: readonly TypeSpec[], projectPath = "/tmp/fixture"): ParsedProject {
  const files: ParsedJavaFile[] = specs.map((spec) => {
    const type = makeType(spec);
    return {
      sourceRoot: "src/main/java",
      relativePath: `${spec.qualifiedName.split(".").join("/")}.java`,
      packageName: type.packageName,
      imports: spec.imports ?? [],
      types: [type],
      diagnostics: []
    };
  });

  return {
    projectPath,
    fileCount: files.length,
    typeCount: files.reduce((total, file) => total + file.types.length, 0),
    methodCount: files.reduce(
      (total, file) => total + file.types.reduce((sum, type) => sum + type.methods.length, 0),
      0
    ),
    fieldCount: files.reduce(
      (total, file) => total + file.types.reduce((sum, type) => sum + type.fields.length, 0),
      0
    ),
    files,
    diagnostics: []
  };
}

export function makeResponse(parsedProject: ParsedProject): AnalyzerResponse {
  return {
    status: "SUCCESS",
    command: "analyze",
    message: `Parsed ${parsedProject.fileCount} file(s).`,
    generatedAt: "2026-08-30T00:00:00Z",
    project: {
      projectPath: parsedProject.projectPath,
      buildTool: "MAVEN",
      sourceRoots: ["src/main/java"],
      diagnostics: []
    },
    parsedProject,
    diagnostics: []
  };
}

/**
 * Loads the bundled fixture from `resources/`.
 *
 * Reading the real shipped file (rather than a copy) means these tests also guard
 * the fixture itself: if `generateSampleAnalysis.js` ever emits something the
 * extension cannot consume, the suite fails.
 */
export function loadSampleResponse(): AnalyzerResponse {
  // __dirname is dist/test at runtime, so the extension root is two levels up.
  const samplePath = path.join(__dirname, "..", "..", "resources", "sample-analysis.json");
  return JSON.parse(fs.readFileSync(samplePath, "utf8")) as AnalyzerResponse;
}
