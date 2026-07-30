import { spawn } from "node:child_process";

export interface AnalyzerProcessRunner {
  run(jarPath: string, projectPath: string, command: "analyze" | "graph"): Promise<string>;
}

export class JavaAnalyzerProcessRunner implements AnalyzerProcessRunner {
  private static readonly timeoutMilliseconds = 120_000;

  public run(jarPath: string, projectPath: string, command: "analyze" | "graph"): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("java", ["-jar", jarPath, command, "--project", projectPath, "--format", "json"], {
        cwd: projectPath,
        windowsHide: true
      });
      let stdout = "";
      let stderr = "";
      let settled = false;

      const settle = (action: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        action();
      };

      const timeout = setTimeout(() => {
        child.kill();
        settle(() => reject(new Error(`Analyzer timed out after ${JavaAnalyzerProcessRunner.timeoutMilliseconds / 1000} seconds.`)));
      }, JavaAnalyzerProcessRunner.timeoutMilliseconds);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.once("error", (error) => {
        settle(() => reject(new Error(`Unable to start Java analyzer: ${error.message}`)));
      });
      child.once("close", (code) => {
        if (code !== 0) {
          settle(() => reject(new Error(`Analyzer exited with code ${code ?? "unknown"}: ${stderr.trim()}`)));
          return;
        }

        settle(() => resolve(stdout));
      });
    });
  }
}
