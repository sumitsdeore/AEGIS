/**
 * Renders the dashboard to a standalone HTML file for visual review.
 *
 * The webview normally inherits its typography and contrast from VS Code, so the
 * stylesheet declares fallbacks for every `--vscode-*` variable it reads. That is
 * what makes this possible: the same renderer the extension uses can be opened in
 * an ordinary browser, which is the only way to eyeball the dark theme without an
 * Extension Host.
 *
 * Usage: npm run compile && node scripts/renderDashboardPreview.js [outFile]
 */

const fs = require("fs");
const path = require("path");

const extensionRoot = path.join(__dirname, "..");
const dist = path.join(extensionRoot, "dist");

const { renderDashboardHtml } = require(path.join(dist, "dashboard", "dashboardHtml.js"));
const { buildDashboardState } = require(path.join(dist, "model", "dashboardModel.js"));

const samplePath = path.join(extensionRoot, "resources", "sample-analysis.json");
const response = JSON.parse(fs.readFileSync(samplePath, "utf8"));

const result = {
  outcome: "success",
  message: response.message,
  diagnostics: [],
  response,
  source: "analyzer",
  durationMs: 1842,
  analyzerJarPath: path.join(extensionRoot, "resources", "aegis-analyzer.jar"),
  javaVersion: "21.0.2"
};

const state = buildDashboardState(result, response.project.projectPath, 70);
const html = renderDashboardHtml(state, {
  nonce: "preview-nonce",
  cspSource: "vscode-webview://preview"
});

const outFile = process.argv[2] ?? path.join(extensionRoot, "dist", "dashboard-preview.html");
fs.writeFileSync(outFile, html, "utf8");

process.stdout.write(`Wrote ${outFile} (${html.length} bytes)\n`);
