import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export interface AnalyzerJarResolution {
  readonly jarPath?: string;
  readonly message: string;
}

export class AnalyzerJarResolver {
  public constructor(private readonly extensionPath: string) {}

  public resolve(workspacePath: string): AnalyzerJarResolution {
    const configuredPath = vscode.workspace.getConfiguration("aegis").get<string>("analyzer.jarPath", "").trim();
    if (configuredPath.length > 0) {
      const resolvedPath = this.resolveConfiguredPath(configuredPath, workspacePath);
      return isFile(resolvedPath)
        ? { jarPath: resolvedPath, message: `Using configured analyzer JAR: ${resolvedPath}` }
        : { message: `Configured AEGIS analyzer JAR was not found: ${resolvedPath}` };
    }

    const bundledJar = path.join(this.extensionPath, "resources", "analyzer", "aegis-analyzer-engine.jar");
    if (isFile(bundledJar)) {
      return { jarPath: bundledJar, message: `Using bundled analyzer JAR: ${bundledJar}` };
    }

    const developmentJar = path.resolve(
      this.extensionPath,
      "..",
      "analyzer-engine",
      "target",
      "aegis-analyzer-engine-0.1.0-SNAPSHOT.jar"
    );
    if (isFile(developmentJar)) {
      return { jarPath: developmentJar, message: `Using development analyzer JAR: ${developmentJar}` };
    }

    return {
      message: "AEGIS analyzer engine was not found. Build it with 'mvn package' in analyzer-engine, run 'npm run stage-analyzer', or configure 'aegis.analyzer.jarPath'."
    };
  }

  private resolveConfiguredPath(configuredPath: string, workspacePath: string): string {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(workspacePath, configuredPath);
  }
}

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
