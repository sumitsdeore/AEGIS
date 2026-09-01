import * as vscode from "vscode";

import type { Logger } from "../types/service";

/**
 * Logger backed by a VS Code output channel.
 *
 * Reconstructed from the Milestone 1 compiled output, with the addition of
 * `debug` gating so verbose analyzer plumbing can be traced without drowning
 * the channel during normal use.
 */
export class OutputChannelLogger implements Logger, vscode.Disposable {
  private readonly outputChannel: vscode.OutputChannel;
  private verbose: boolean;

  constructor(channelName: string, verbose = false) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
    this.verbose = verbose;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  info(message: string): void {
    this.append("INFO", message);
  }

  warn(message: string): void {
    this.append("WARN", message);
  }

  /** Only emitted when verbose logging is enabled in settings. */
  debug(message: string): void {
    if (this.verbose) {
      this.append("DEBUG", message);
    }
  }

  error(message: string, error?: unknown): void {
    this.append("ERROR", message);

    if (error instanceof Error) {
      this.outputChannel.appendLine(error.stack ?? error.message);
      return;
    }

    if (error !== undefined) {
      this.outputChannel.appendLine(String(error));
    }
  }

  show(): void {
    this.outputChannel.show(true);
  }

  dispose(): void {
    this.outputChannel.dispose();
  }

  private append(level: string, message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] [${level}] ${message}`);
  }
}
