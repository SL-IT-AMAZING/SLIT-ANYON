import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

import { writeAppScopedOpenCodeConfig } from "./app_scoped_opencode_config";

const tempDirs: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("ensureAppScopedOpenCodeConfig", () => {
  test("creates app-scoped config with Anyon-only plugin entry and mirrored anyon config", () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-home-"));
    const tempUserData = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-userdata-"));
    tempDirs.push(tempHome, tempUserData);

    const defaultConfigDir = path.join(tempHome, ".config", "opencode");
    fs.mkdirSync(defaultConfigDir, { recursive: true });
    fs.writeFileSync(
      path.join(defaultConfigDir, "anyon.jsonc"),
      '{"agents":{"Builder":{"model":"test"}}}\n',
    );

    const configDir = writeAppScopedOpenCodeConfig({
      userDataDir: tempUserData,
      homeDir: tempHome,
    });
    const opencodeConfig = JSON.parse(
      fs.readFileSync(path.join(configDir, "opencode.json"), "utf-8"),
    ) as { plugin?: string[] };
    const anyonConfig = fs.readFileSync(
      path.join(configDir, "anyon.jsonc"),
      "utf-8",
    );

    expect(opencodeConfig.plugin).toEqual(["@anyon-cli/anyon@latest"]);
    expect(anyonConfig).toContain('"Builder"');
  });
});
