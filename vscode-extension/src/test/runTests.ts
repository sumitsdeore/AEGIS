/**
 * Test entry point.
 *
 * Importing a suite module registers its cases as a side effect, so the imports
 * below are the test manifest. Run with `npm test` after `npm run compile`.
 *
 * Nothing here touches the `vscode` module: every suite exercises pure model,
 * rendering or parsing code. That is deliberate — it keeps the whole suite
 * runnable under plain node, without an Extension Host, which is what makes it
 * cheap enough to run on every change.
 */

import { runAll } from "./harness";

import "./analyzerContract.test";
import "./insights.test";
import "./graph.test";
import "./dashboard.test";
import "./manifest.test";

async function main(): Promise<void> {
  const failures = await runAll();
  process.exit(failures === 0 ? 0 : 1);
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `\n  the test runner itself failed:\n    ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n\n`
  );
  process.exit(1);
});
