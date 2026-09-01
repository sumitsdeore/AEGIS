import * as fs from "fs";
import * as path from "path";

import { COMMAND_IDS, DASHBOARD_BUTTON_COMMANDS } from "../commands/commandIds";
import { renderDashboardHtml } from "../dashboard/dashboardHtml";
import { buildDashboardState } from "../model/dashboardModel";
import { assert, assertDeepEqual, assertEqual, suite, test } from "./harness";

/**
 * Guards the contract between package.json and the code.
 *
 * The user-visible symptom of a break here is the worst kind: a command appears
 * in the palette and does nothing at all, or a button in the dashboard is
 * silently ignored. Neither shows up as an error anywhere.
 */

interface ContributedCommand {
  readonly command: string;
  readonly title: string;
  readonly category?: string;
  readonly icon?: unknown;
}

interface MenuEntry {
  readonly command: string;
  readonly when?: string;
}

interface PackageManifest {
  readonly main: string;
  readonly contributes: {
    readonly commands: ContributedCommand[];
    readonly menus?: Record<string, MenuEntry[]>;
    readonly keybindings?: { readonly command: string }[];
    readonly configuration?: { readonly properties: Record<string, unknown> };
  };
  readonly activationEvents?: string[];
  readonly scripts: Record<string, string>;
}

// __dirname is dist/test at runtime, so the extension root is two levels up.
const extensionRoot = path.join(__dirname, "..", "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(extensionRoot, "package.json"), "utf8")
) as PackageManifest;

suite("contributed command surface", () => {
  test("package.json contributes exactly the commands the code implements", () => {
    const contributed = manifest.contributes.commands.map((entry) => entry.command).sort();

    assertDeepEqual(contributed, [...COMMAND_IDS].sort());
  });

  test("every contributed command has a title and the AEGIS category", () => {
    for (const entry of manifest.contributes.commands) {
      assert(entry.title.length > 0, `${entry.command} has no title`);
      assertEqual(entry.category, "AEGIS", `${entry.command} should be grouped under AEGIS`);
    }
  });

  test("every menu and keybinding points at a real command", () => {
    const known = new Set<string>(COMMAND_IDS);

    for (const [menu, entries] of Object.entries(manifest.contributes.menus ?? {})) {
      for (const entry of entries) {
        assert(known.has(entry.command), `menu ${menu} references unknown command ${entry.command}`);
      }
    }

    for (const binding of manifest.contributes.keybindings ?? []) {
      assert(known.has(binding.command), `keybinding references unknown command ${binding.command}`);
    }
  });

  test("commands needing a prior analysis are gated in the palette", () => {
    // Offering "Export Analysis" before anything has been analysed produces a
    // command that can only fail, so these are hidden until a run exists.
    const palette = manifest.contributes.menus?.["commandPalette"] ?? [];
    const whenFor = new Map(palette.map((entry) => [entry.command, entry.when]));

    for (const command of ["aegis.revealType", "aegis.exportAnalysis", "aegis.clearAnalysis"]) {
      assertEqual(whenFor.get(command), "aegis.hasAnalysis", `${command} must be gated`);
    }

    // openSource is an internal target for dashboard clicks, not a palette entry.
    assertEqual(whenFor.get("aegis.openSource"), "false");
  });

  test("the manifest points at build outputs that the compiler actually produces", () => {
    const mainPath = path.join(extensionRoot, manifest.main);
    assert(fs.existsSync(mainPath), `main entry ${manifest.main} does not exist - run npm run compile`);

    const testScript = manifest.scripts["test"];
    const scriptTarget = /node\s+\.\/(\S+)/.exec(testScript ?? "")?.[1];
    assert(scriptTarget !== undefined, `could not read a target out of the test script: ${testScript}`);
    assert(
      fs.existsSync(path.join(extensionRoot, scriptTarget!)),
      `the test script points at ${scriptTarget!}, which does not exist`
    );
  });

  test("every declared setting is namespaced under aegis", () => {
    const properties = Object.keys(manifest.contributes.configuration?.properties ?? {});

    assert(properties.length > 0, "expected the extension to contribute settings");
    for (const property of properties) {
      assert(property.startsWith("aegis."), `${property} escapes the aegis namespace`);
    }
  });

  test("activation does not wait for a command to be invoked", () => {
    // The status bar and the hasAnalysis context key are only correct if the
    // extension is already active, so activation is tied to Java projects.
    const events = manifest.activationEvents ?? [];

    assert(events.length > 0, "expected activation events");
    for (const event of events) {
      assert(!event.startsWith("onCommand:"), `onCommand activation defeats the status bar: ${event}`);
    }
  });
});

suite("dashboard button wiring", () => {
  test("every button in the rendered dashboard is on the host's allow-list", () => {
    const sample = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "resources", "sample-analysis.json"), "utf8")
    );

    const populated = renderDashboardHtml(
      buildDashboardState(
        {
          outcome: "success",
          message: sample.message,
          diagnostics: [],
          response: sample,
          source: "analyzer",
          durationMs: 10
        },
        "/tmp/project",
        70
      ),
      { nonce: "n", cspSource: "vscode-webview://t" }
    );

    const empty = renderDashboardHtml(buildDashboardState(undefined, "/tmp/project", 70), {
      nonce: "n",
      cspSource: "vscode-webview://t"
    });

    const allowed = new Set<string>(DASHBOARD_BUTTON_COMMANDS);
    const referenced = new Set(
      [...populated.matchAll(/data-command="([^"]+)"/g), ...empty.matchAll(/data-command="([^"]+)"/g)].map(
        (match) => match[1]
      )
    );

    assert(referenced.size > 0, "the dashboard should expose action buttons");
    for (const command of referenced) {
      assert(allowed.has(command), `the host would refuse this button: ${command}`);
    }
  });

  test("the allow-list contains no command the extension does not implement", () => {
    const known = new Set<string>(COMMAND_IDS);
    for (const command of DASHBOARD_BUTTON_COMMANDS) {
      assert(known.has(command), `${command} is allow-listed but not implemented`);
    }
  });
});
