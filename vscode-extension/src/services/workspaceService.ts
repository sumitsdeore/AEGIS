import * as vscode from "vscode";

export interface WorkspaceService {
  getWorkspaceRoot(): vscode.Uri | undefined;
}

export class VsCodeWorkspaceService implements WorkspaceService {
  public getWorkspaceRoot(): vscode.Uri | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    return workspaceFolders[0].uri;
  }
}
