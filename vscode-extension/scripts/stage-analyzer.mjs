import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceJar = path.resolve(
  extensionRoot,
  "..",
  "analyzer-engine",
  "target",
  "aegis-analyzer-engine-0.1.0-SNAPSHOT.jar"
);
const destinationDirectory = path.join(extensionRoot, "resources", "analyzer");
const destinationJar = path.join(destinationDirectory, "aegis-analyzer-engine.jar");

try {
  await stat(sourceJar);
} catch {
  throw new Error(`Analyzer JAR not found at ${sourceJar}. Run 'mvn package' in analyzer-engine first.`);
}

await mkdir(destinationDirectory, { recursive: true });
await copyFile(sourceJar, destinationJar);
console.log(`Staged AEGIS analyzer JAR at ${destinationJar}`);
