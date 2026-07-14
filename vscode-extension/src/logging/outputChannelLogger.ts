import * as vscode from "vscode";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
  show(): void;
  dispose(): void;
}

export class OutputChannelLogger implements Logger {
  private readonly outputChannel: vscode.OutputChannel;

  public constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  public info(message: string): void {
    this.append("INFO", message);
  }

  public warn(message: string): void {
    this.append("WARN", message);
  }

  public error(message: string, error?: unknown): void {
    this.append("ERROR", message);

    if (error instanceof Error) {
      this.outputChannel.appendLine(error.stack ?? error.message);
      return;
    }

    if (error !== undefined) {
      this.outputChannel.appendLine(String(error));
    }
  }

  public show(): void {
    this.outputChannel.show(true);
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  private append(level: "INFO" | "WARN" | "ERROR", message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] [${level}] ${message}`);
  }
}
