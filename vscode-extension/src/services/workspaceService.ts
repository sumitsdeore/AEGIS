import * as vscode from "vscode";

import type { WorkspaceService } from "../types/service";

/**
 * Workspace lookup backed by the VS Code API.
 *
 * Reconstructed from the Milestone 1 compiled output and extended with
 * `getWorkspaceFolders` so commands can prompt when a multi-root workspace is
 * open instead of silently analyzing only the first folder.
 */
export class VsCodeWorkspaceService implements WorkspaceService {
  getWorkspaceRoot(): vscode.Uri | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    return workspaceFolders[0].uri;
  }

  getWorkspaceFolders(): readonly vscode.Uri[] {
    return (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri);
  }
}
