import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = {
  bundle: true,
  entryPoints: [path.join(extensionRoot, "src", "webview", "graphApp.tsx")],
  format: "iife",
  legalComments: "none",
  loader: { ".css": "css" },
  minify: true,
  outfile: path.join(extensionRoot, "media", "graph.js"),
  sourcemap: false,
  target: ["es2022"]
};

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log("Watching AEGIS graph webview assets.");
} else {
  await esbuild.build(options);
}
