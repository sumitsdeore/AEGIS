import * as vscode from "vscode";

import type { DependencyGraph } from "../types/analyzer";

export interface GraphPanel {
  show(graph: DependencyGraph): void;
  dispose(): void;
}

interface OpenSourceMessage {
  readonly type: "openSource";
  readonly nodeId: string;
}

export class GraphWebviewPanel implements GraphPanel {
  private panel: vscode.WebviewPanel | undefined;
  private graph: DependencyGraph | undefined;

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public show(graph: DependencyGraph): void {
    this.graph = graph;
    if (this.panel === undefined) {
      this.panel = vscode.window.createWebviewPanel(
        "aegis.dependencyGraph",
        "AEGIS Dependency Graph",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")]
        }
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      }, undefined, this.context.subscriptions);
      this.panel.webview.onDidReceiveMessage(
        (message: unknown) => this.handleMessage(message),
        undefined,
        this.context.subscriptions
      );
      this.panel.webview.html = this.htmlFor(this.panel.webview, graph);
      return;
    }

    this.panel.reveal(vscode.ViewColumn.Beside);
    void this.panel.webview.postMessage({ type: "graph", graph });
  }

  public dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
    this.graph = undefined;
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isOpenSourceMessage(message) || this.graph === undefined) {
      return;
    }

    const node = this.graph.nodes.find((candidate) => candidate.id === message.nodeId);
    if (node === undefined || node.sourcePath.length === 0) {
      return;
    }

    const sourceUri = vscode.Uri.joinPath(vscode.Uri.file(this.graph.projectPath), ...node.sourcePath.split("/"));
    await vscode.commands.executeCommand("vscode.open", sourceUri);
  }

  private htmlFor(webview: vscode.Webview, graph: DependencyGraph): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "graph.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "graph.css"));
    const nonce = createNonce();
    const graphJson = JSON.stringify(graph).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>AEGIS Dependency Graph</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__AEGIS_GRAPH__ = ${graphJson};</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function isOpenSourceMessage(message: unknown): message is OpenSourceMessage {
  return typeof message === "object"
    && message !== null
    && "type" in message
    && "nodeId" in message
    && (message as { readonly type: unknown }).type === "openSource"
    && typeof (message as { readonly nodeId: unknown }).nodeId === "string";
}

function createNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let index = 0; index < 32; index++) {
    nonce += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return nonce;
}
