/**
 * A zero-dependency test harness.
 *
 * The extension deliberately ships no test framework: the sandbox this project is
 * developed in cannot reach the npm registry, and a project that can only be
 * verified after a successful `npm install` is a project that quietly stops being
 * verified. This is small enough to read in one sitting and runs under plain
 * `node dist/test/runTests.js`.
 */

interface TestCase {
  readonly name: string;
  readonly run: () => void | Promise<void>;
}

interface Suite {
  readonly name: string;
  readonly cases: TestCase[];
}

const suites: Suite[] = [];
let active: Suite | undefined;

export function suite(name: string, body: () => void): void {
  const created: Suite = { name, cases: [] };
  suites.push(created);

  const previous = active;
  active = created;
  try {
    body();
  } finally {
    active = previous;
  }
}

export function test(name: string, run: () => void | Promise<void>): void {
  if (!active) {
    throw new Error(`test("${name}") was declared outside of a suite()`);
  }
  active.cases.push({ name, run });
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

export function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(
      `${message ?? "values differ"}\n    expected: ${format(expected)}\n    actual:   ${format(actual)}`
    );
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  const actualJson = stableStringify(actual);
  const expectedJson = stableStringify(expected);

  if (actualJson !== expectedJson) {
    throw new AssertionError(
      `${message ?? "structures differ"}\n    expected: ${expectedJson}\n    actual:   ${actualJson}`
    );
  }
}

export function assertIncludes(haystack: string, needle: string, message?: string): void {
  if (!haystack.includes(needle)) {
    throw new AssertionError(
      `${message ?? "substring not found"}\n    looking for: ${format(needle)}`
    );
  }
}

export function assertExcludes(haystack: string, needle: string, message?: string): void {
  if (haystack.includes(needle)) {
    throw new AssertionError(
      `${message ?? "substring unexpectedly present"}\n    found: ${format(needle)}`
    );
  }
}

/** Asserts a numeric value falls inside an inclusive range. */
export function assertBetween(actual: number, min: number, max: number, message?: string): void {
  if (!(actual >= min && actual <= max)) {
    throw new AssertionError(
      `${message ?? "value out of range"}\n    expected between ${min} and ${max}, got ${actual}`
    );
  }
}

export async function runAll(): Promise<number> {
  let passed = 0;
  const failures: { suite: string; test: string; error: unknown }[] = [];

  for (const currentSuite of suites) {
    write(`\n  ${currentSuite.name}\n`);

    for (const testCase of currentSuite.cases) {
      try {
        await testCase.run();
        passed += 1;
        write(`    ✓ ${testCase.name}\n`);
      } catch (error) {
        failures.push({ suite: currentSuite.name, test: testCase.name, error });
        write(`    ✗ ${testCase.name}\n`);
      }
    }
  }

  write(`\n  ${passed} passed, ${failures.length} failed\n`);

  for (const failure of failures) {
    write(`\n  FAIL ${failure.suite} > ${failure.test}\n`);
    const error = failure.error;
    write(`    ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  }

  write("\n");
  return failures.length;
}

function write(text: string): void {
  process.stdout.write(text);
}

function format(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/** Key-sorted stringify so object key order never causes a spurious failure. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nested: unknown) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const record = nested as Record<string, unknown>;
      return Object.keys(record)
        .sort()
        .reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = record[key];
          return accumulator;
        }, {});
    }
    return nested;
  });
}
