import * as path from "path";
import * as vscode from "vscode";

import type { CommandContext } from "./commandContext";

/**
 * Chooses which folder to analyze.
 *
 * Single-root workspaces resolve silently. Multi-root workspaces prompt, because
 * silently analyzing the first folder is the kind of behaviour that makes people
 * distrust the numbers on screen.
 */
export async function resolveTargetFolder(context: CommandContext): Promise<vscode.Uri | undefined> {
  const folders = context.workspaceService.getWorkspaceFolders();

  if (folders.length === 0) {
    const choice = await vscode.window.showWarningMessage(
      "AEGIS needs an open folder to analyze.",
      "Open Folder"
    );
    if (choice === "Open Folder") {
      await vscode.commands.executeCommand("vscode.openFolder");
    }
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  // Prefer the folder already on screen so the prompt starts where the user is.
  const activeFolder = vscode.window.activeTextEditor
    ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri
    : undefined;

  const items = folders.map((folder) => ({
    label: path.basename(folder.fsPath),
    description: folder.fsPath === activeFolder?.fsPath ? "$(eye) active editor" : undefined,
    detail: folder.fsPath,
    folder
  }));

  items.sort((left, right) => Number(Boolean(right.description)) - Number(Boolean(left.description)));

  const picked = await vscode.window.showQuickPick(items, {
    title: "AEGIS: choose a project to analyze",
    placeHolder: "This workspace has more than one root folder",
    matchOnDetail: true
  });

  return picked?.folder;
}
