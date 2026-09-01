/**
 * The command ids this extension contributes.
 *
 * Deliberately in a module that does not import `vscode`, so the test suite -
 * which runs under plain node, outside an Extension Host - can assert that this
 * list and package.json's `contributes.commands` agree. A command declared in
 * one but not the other is the classic cause of "that menu item does nothing",
 * and it is invisible until someone clicks it.
 *
 * `registerCommands` keys its handler table by `CommandId`, so adding an entry
 * here without implementing it is a compile error rather than a runtime
 * surprise.
 */
export const COMMAND_IDS = [
  "aegis.analyzeProject",
  "aegis.openDashboard",
  "aegis.showImpactGraph",
  "aegis.showSpringInsights",
  "aegis.revealType",
  "aegis.exportAnalysis",
  "aegis.clearAnalysis",
  "aegis.showLogs",
  "aegis.openSettings",
  "aegis.openSource"
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

/**
 * Commands a dashboard button may ask the host to run.
 *
 * An allow-list, not a pass-through: the webview renders names taken from the
 * analysed source, so the host validates every inbound command rather than
 * trusting the message. `aegis.openSource` is intentionally absent - it takes
 * arguments, so it travels over its own message type where those arguments can
 * be validated too.
 */
export const DASHBOARD_BUTTON_COMMANDS: readonly CommandId[] = [
  "aegis.analyzeProject",
  "aegis.openDashboard",
  "aegis.showImpactGraph",
  "aegis.exportAnalysis",
  "aegis.showLogs"
];
