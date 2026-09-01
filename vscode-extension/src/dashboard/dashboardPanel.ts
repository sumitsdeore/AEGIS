import * as crypto from "crypto";
import * as vscode from "vscode";

import { DASHBOARD_BUTTON_COMMANDS } from "../commands/commandIds";
import { buildDashboardState } from "../model/dashboardModel";
import type { AnalysisStore } from "../services/analysisStore";
import type { Logger } from "../types/service";
import { renderDashboardHtml } from "./dashboardHtml";
import type { DashboardTab } from "./dashboardHtml";

/**
 * Owns the single AEGIS dashboard webview.
 *
 * Only one panel is ever alive: re-running `AEGIS: Open Dashboard` reveals the
 * existing panel rather than stacking duplicates that would drift out of sync.
 *
 * The webview is a pure renderer. Everything it can ask for is expressed as a
 * message, and every message is validated here before it reaches the rest of the
 * extension, because webview content must be treated as untrusted input.
 *
 * Two things make the messaging reliable. Which tab is selected is rendered into
 * the markup rather than posted afterwards, because assigning `webview.html`
 * reloads the document and a message posted into a document that is still
 * loading is discarded. And anything that genuinely has to be a message — a
 * request to focus one node in the graph — waits for the webview to announce
 * itself with `ready`.
 */

export type TabName = DashboardTab;

/** Messages the webview is allowed to send. Anything else is logged and dropped. */
type InboundMessage =
  | { readonly type: "ready" }
  | { readonly type: "tabChanged"; readonly tab: TabName }
  | { readonly type: "command"; readonly command: string }
  | { readonly type: "openSource"; readonly sourcePath: string; readonly line?: number };

/** Messages the host sends into the webview. */
type OutboundMessage =
  | { readonly type: "activateTab"; readonly tab: TabName }
  | { readonly type: "focusType"; readonly id: string };

/**
 * Commands the dashboard buttons may invoke. An allow-list, not a pass-through:
 * without it a compromised webview could execute arbitrary VS Code commands. The
 * set is shared with the renderer's tests so a button can never reference a
 * command the host would silently refuse.
 */
const ALLOWED_COMMANDS = new Set<string>(DASHBOARD_BUTTON_COMMANDS);

const TAB_NAMES: readonly TabName[] = ["overview", "graph", "spring"];

export class DashboardPanel implements vscode.Disposable {
  private static readonly viewType = "aegis.dashboard";

  private panel: vscode.WebviewPanel | undefined;
  private activeTab: TabName = "overview";
  /** Cleared on every render; set again when the reloaded document reports in. */
  private webviewReady = false;
  /** Messages issued before the webview was ready, replayed once it is. */
  private queued: OutboundMessage[] = [];
  private readonly disposables: vscode.Disposable[] = [];


  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly store: AnalysisStore,
    private readonly logger: Logger,
    private readonly highRiskThreshold: () => number
  ) {
    // Keep the open panel in step with the store so a re-analysis triggered from
    // the palette, the status bar, or the dashboard itself all land the same way.
    this.disposables.push(this.store.onDidChange(() => this.refresh()));
  }

  /** True when a dashboard is currently open. */
  get isOpen(): boolean {
    return this.panel !== undefined;
  }

  /** Opens the dashboard, or reveals and refreshes it when already open. */
  reveal(tab?: TabName): void {
    if (this.panel) {
      this.panel.reveal(this.panel.viewColumn ?? vscode.ViewColumn.One, false);

      // Switching tabs on a live document is a message, not a re-render: the
      // graph's layout, zoom and selected node all survive it. The store's own
      // change event re-renders when the data actually changes.
      if (tab && tab !== this.activeTab) {
        this.activeTab = tab;
        this.postOrQueue({ type: "activateTab", tab });
      }
      return;
    }

    if (tab) {
      this.activeTab = tab;
    }

    this.panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      "AEGIS Dashboard",
      { viewColumn: vscode.ViewColumn.One, preserveFocus: false },
      {
        enableScripts: true,
        // Survives tab backgrounding: the force layout and the selected node stay
        // put instead of being thrown away and recomputed on every switch.
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "resources")]
      }
    );

    this.panel.iconPath = {
      light: vscode.Uri.joinPath(this.extensionUri, "resources", "icon-light.svg"),
      dark: vscode.Uri.joinPath(this.extensionUri, "resources", "icon-dark.svg")
    };

    // Held in `disposables` rather than relying on the panel to tear its own
    // emitters down, so a closed-and-reopened dashboard cannot accumulate
    // listeners bound to panels that no longer exist.
    this.disposables.push(
      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.webviewReady = false;
        this.queued = [];
      }),
      this.panel.webview.onDidReceiveMessage((message: unknown) => {
        void this.handleMessage(message);
      })
    );

    this.refresh();
  }

  /** Re-renders from the current store snapshot. No-op when closed. */
  refresh(): void {
    const panel = this.panel;
    if (!panel) {
      return;
    }

    const stored = this.store.get();
    const state = buildDashboardState(
      stored?.result,
      stored?.workspacePath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      this.highRiskThreshold()
    );

    // Assigning `html` reloads the document, so the incoming script is a
    // different script from the one that may have said `ready` a moment ago.
    this.webviewReady = false;

    panel.webview.html = renderDashboardHtml(state, {
      nonce: createNonce(),
      cspSource: panel.webview.cspSource,
      activeTab: this.activeTab
    });
  }

  /** Scrolls the graph to a type and selects it. Opens the dashboard if needed. */
  focusType(qualifiedName: string): void {
    this.reveal("graph");
    this.postOrQueue({ type: "focusType", id: qualifiedName });
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
    this.queued = [];

    for (const disposable of this.disposables.splice(0)) {
      disposable.dispose();
    }
  }

  /**
   * Sends a message, or holds it until the webview reports `ready`.
   *
   * Only the most recent request of each type is kept: a burst of "reveal this
   * type" clicks during startup should end on the type asked for last, not
   * replay every one of them.
   */
  private postOrQueue(message: OutboundMessage): void {
    const panel = this.panel;
    if (!panel) {
      return;
    }

    if (this.webviewReady) {
      void panel.webview.postMessage(message);
      return;
    }

    this.queued = this.queued.filter((queued) => queued.type !== message.type);
    this.queued.push(message);
  }

  private flushQueue(): void {
    const panel = this.panel;
    const messages = this.queued.splice(0);
    if (!panel) {
      return;
    }

    for (const message of messages) {
      void panel.webview.postMessage(message);
    }
  }

  private async handleMessage(message: unknown): Promise<void> {
    const parsed = parseInboundMessage(message);
    if (!parsed) {
      this.logger.warn(`Dashboard sent an unrecognised message: ${safeStringify(message)}`);
      return;
    }

    if (parsed.type === "ready") {
      this.webviewReady = true;
      this.flushQueue();
      return;
    }

    if (parsed.type === "tabChanged") {
      // Remembered so a re-analysis re-renders the panel the reader was on.
      this.activeTab = parsed.tab;
      return;
    }

    if (parsed.type === "command") {
      if (!ALLOWED_COMMANDS.has(parsed.command)) {
        this.logger.warn(`Dashboard requested a command outside the allow-list: ${parsed.command}`);
        return;
      }

      await vscode.commands.executeCommand(parsed.command);
      return;
    }

    await vscode.commands.executeCommand("aegis.openSource", parsed.sourcePath, parsed.line ?? 1);
  }
}

function parseInboundMessage(value: unknown): InboundMessage | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.type === "ready") {
    return { type: "ready" };
  }

  if (candidate.type === "tabChanged" && isTabName(candidate.tab)) {
    return { type: "tabChanged", tab: candidate.tab };
  }

  if (candidate.type === "command" && typeof candidate.command === "string") {
    return { type: "command", command: candidate.command };
  }

  if (candidate.type === "openSource" && typeof candidate.sourcePath === "string") {
    const line = typeof candidate.line === "number" && Number.isFinite(candidate.line)
      ? Math.max(1, Math.floor(candidate.line))
      : 1;
    return { type: "openSource", sourcePath: candidate.sourcePath, line };
  }

  return undefined;
}

function isTabName(value: unknown): value is TabName {
  return typeof value === "string" && (TAB_NAMES as readonly string[]).includes(value);
}

/**
 * Fresh nonce per render. The dashboard's CSP omits `unsafe-inline`, so the
 * inline style and script blocks are only executed because they carry this value.
 */
function createNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
