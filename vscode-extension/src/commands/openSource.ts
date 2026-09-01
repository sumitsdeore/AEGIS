import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { hasParsedProject } from "../types/analyzer";
import type { CommandContext } from "./commandContext";

/**
 * `AEGIS: Open Source File` - the handler behind clicking a row in the dashboard.
 *
 * The analyzer reports `sourcePath` relative to the project root it was pointed
 * at, so the path has to be re-anchored here. Source-root-relative paths are
 * tried as a fallback because a future analyzer change (or a nested module) could
 * legitimately produce them, and silently failing to open a file feels like a bug
 * even when the data is at fault.
 */
export async function openSource(
  context: CommandContext,
  rawPath: unknown,
  rawLine: unknown
): Promise<void> {
  if (typeof rawPath !== "string" || rawPath.trim().length === 0) {
    context.logger.warn("aegis.openSource was invoked without a source path.");
    return;
  }

  const line = typeof rawLine === "number" && Number.isFinite(rawLine)
    ? Math.max(1, Math.floor(rawLine))
    : 1;

  const resolved = await resolveSourceFile(context, rawPath.trim());

  if (!resolved) {
    context.logger.warn(`Could not locate a file on disk for source path "${rawPath}".`);
    await vscode.window.showWarningMessage(
      `AEGIS could not find "${rawPath}" on disk. The analysis may be out of date - try re-analyzing the project.`
    );
    return;
  }

  const document = await vscode.workspace.openTextDocument(resolved);
  const editor = await vscode.window.showTextDocument(document, { preview: false });

  // Clamp to the document: a stale analysis can point past the current end.
  const targetLine = Math.min(line - 1, Math.max(0, document.lineCount - 1));
  const position = new vscode.Position(targetLine, 0);

  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}

async function resolveSourceFile(
  context: CommandContext,
  sourcePath: string
): Promise<vscode.Uri | undefined> {
  if (path.isAbsolute(sourcePath)) {
    return (await exists(sourcePath)) ? vscode.Uri.file(sourcePath) : undefined;
  }

  const stored = context.store.get();
  const response = stored?.result.response;

  const roots: string[] = [];

  if (stored) {
    roots.push(stored.workspacePath);
  }

  if (response?.project?.projectPath) {
    roots.push(response.project.projectPath);
  }

  if (response && hasParsedProject(response) && response.parsedProject.projectPath) {
    roots.push(response.parsedProject.projectPath);
  }

  const workspaceRoot = context.workspaceService.getWorkspaceRoot();
  if (workspaceRoot) {
    roots.push(workspaceRoot.fsPath);
  }

  const sourceRoots = response?.project?.sourceRoots ?? [];

  for (const root of dedupe(roots)) {
    const direct = path.resolve(root, sourcePath);
    if (await exists(direct)) {
      return vscode.Uri.file(direct);
    }

    for (const sourceRoot of sourceRoots) {
      const nested = path.resolve(root, sourceRoot, sourcePath);
      if (await exists(nested)) {
        return vscode.Uri.file(nested);
      }
    }
  }

  // Last resort: ask VS Code's index. Cheap, and rescues nested-module layouts.
  const matches = await vscode.workspace.findFiles(
    `**/${path.basename(sourcePath)}`,
    "**/{node_modules,target,build,.git}/**",
    2
  );

  return matches.length === 1 ? matches[0] : undefined;
}

async function exists(candidate: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(candidate);
    return stats.isFile();
  } catch {
    return false;
  }
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
