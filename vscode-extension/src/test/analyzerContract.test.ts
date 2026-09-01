import { parseJavaMajorVersion } from "../services/analyzerLocator";
import { extractAnalyzerResponse } from "../services/analyzerService";
import { collectTypes, countImports, hasParsedProject, isAnalyzerResponse } from "../types/analyzer";
import { assert, assertEqual, suite, test } from "./harness";
import { loadSampleResponse, makeProject, makeResponse } from "./fixtures";

suite("analyzer contract", () => {
  test("parses modern Java version banners", () => {
    assertEqual(parseJavaMajorVersion('openjdk version "21.0.2" 2024-01-16'), 21);
    assertEqual(parseJavaMajorVersion('java version "17.0.9" 2023-10-17 LTS'), 17);
    assertEqual(parseJavaMajorVersion('openjdk version "24-ea" 2025-03-18'), 24);
  });

  test("parses legacy 1.x Java version banners", () => {
    // 1.8.0_401 means Java 8, not Java 1. Getting this wrong would reject every
    // modern JDK as "too old" or accept an ancient one as new enough.
    assertEqual(parseJavaMajorVersion('java version "1.8.0_401"'), 8);
    assertEqual(parseJavaMajorVersion('java version "1.7.0_80"'), 7);
  });

  test("returns undefined for banners it cannot understand", () => {
    assertEqual(parseJavaMajorVersion(""), undefined);
    assertEqual(parseJavaMajorVersion("command not found: java"), undefined);
  });

  test("extracts JSON from clean analyzer stdout", () => {
    const response = makeResponse(makeProject([{ qualifiedName: "a.B" }]));
    const extracted = extractAnalyzerResponse(JSON.stringify(response));

    assert(extracted !== undefined, "expected the response to be extracted");
    assertEqual(extracted?.status, "SUCCESS");
  });

  test("extracts JSON even when the JVM interleaves noise", () => {
    // Real JVMs prepend lines like this whenever JAVA_TOOL_OPTIONS is set, which
    // makes a plain JSON.parse of stdout fail.
    const response = makeResponse(makeProject([{ qualifiedName: "a.B" }]));
    const noisy = [
      "Picked up JAVA_TOOL_OPTIONS: -Dfile.encoding=UTF-8",
      JSON.stringify(response),
      "OpenJDK 64-Bit Server VM warning: shutting down"
    ].join("\n");

    assertEqual(extractAnalyzerResponse(noisy)?.command, "analyze");
  });

  test("returns undefined for empty or unparseable stdout", () => {
    assertEqual(extractAnalyzerResponse(""), undefined);
    assertEqual(extractAnalyzerResponse("   \n  "), undefined);
    assertEqual(extractAnalyzerResponse("Exception in thread \"main\""), undefined);
    assertEqual(extractAnalyzerResponse("{ not json at all }"), undefined);
  });

  test("rejects payloads missing required envelope fields", () => {
    assertEqual(isAnalyzerResponse(null), false);
    assertEqual(isAnalyzerResponse([]), false);
    assertEqual(isAnalyzerResponse({ status: "SUCCESS" }), false);
    assertEqual(
      isAnalyzerResponse({
        status: "MAYBE",
        command: "analyze",
        message: "",
        generatedAt: "",
        diagnostics: []
      }),
      false,
      "an unknown status must not be accepted"
    );
  });

  test("accepts a payload that adds unknown fields", () => {
    // Forward compatibility: a newer analyzer must not break an older extension.
    assertEqual(
      isAnalyzerResponse({
        status: "SUCCESS",
        command: "analyze",
        message: "ok",
        generatedAt: "2026-08-30T00:00:00Z",
        diagnostics: [],
        somethingNewFromTheFuture: { nested: true }
      }),
      true
    );
  });

  test("hasParsedProject distinguishes a scan-only failure from a full run", () => {
    const withProject = makeResponse(makeProject([{ qualifiedName: "a.B" }]));
    assertEqual(hasParsedProject(withProject), true);

    const cliFailure = {
      status: "ERROR" as const,
      command: "analyze",
      message: "Unknown option --nope",
      generatedAt: "2026-08-30T00:00:00Z",
      project: null,
      parsedProject: null,
      diagnostics: []
    };
    assertEqual(hasParsedProject(cliFailure), false);
  });

  test("the bundled sample fixture satisfies the contract the extension enforces", () => {
    const sample = loadSampleResponse();

    assertEqual(isAnalyzerResponse(sample), true, "sample-analysis.json must validate");
    assert(hasParsedProject(sample), "sample must carry a parsed project");

    if (!hasParsedProject(sample)) {
      return;
    }

    const parsed = sample.parsedProject;
    const types = collectTypes(parsed);

    assertEqual(types.length, parsed.typeCount, "declared typeCount must match the actual types");
    assertEqual(parsed.files.length, parsed.fileCount, "declared fileCount must match the files");
    assertEqual(
      types.reduce((total, type) => total + type.methods.length, 0),
      parsed.methodCount,
      "declared methodCount must match the actual methods"
    );
    assertEqual(
      types.reduce((total, type) => total + type.fields.length, 0),
      parsed.fieldCount,
      "declared fieldCount must match the actual fields"
    );
    assert(countImports(parsed) > 0, "sample should exercise import-based resolution");

    // sourcePath is project-relative in the analyzer; openSource depends on it.
    for (const type of types) {
      assert(
        !type.sourcePath.startsWith("/") && type.sourcePath.endsWith(".java"),
        `sourcePath must be project-relative: ${type.sourcePath}`
      );
    }
  });
});
