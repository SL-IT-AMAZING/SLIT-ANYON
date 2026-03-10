import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { setupOpenCodeConfig, updateAnyonConfig } from "./opencode_config_setup";

const tempHomes: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const tempHome of tempHomes.splice(0)) {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});

describe("opencode config setup", () => {
  test("does not create or inject Anyon into default OpenCode plugin config and writes anyon config", async () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-opencode-"));
    tempHomes.push(tempHome);
    vi.stubEnv("HOME", tempHome);

    await setupOpenCodeConfig();

    const configDir = path.join(tempHome, ".config", "opencode");
    expect(fs.existsSync(path.join(configDir, "opencode.json"))).toBe(false);
    const anyonConfig = JSON.parse(
      fs.readFileSync(path.join(configDir, "anyon.jsonc"), "utf-8"),
    ) as Record<string, unknown>;

    expect(Object.keys(anyonConfig)).toEqual(["agents", "categories"]);
  });

  test("preserves existing plugin entries while removing Anyon plugin entry", async () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-opencode-"));
    tempHomes.push(tempHome);
    vi.stubEnv("HOME", tempHome);

    const configDir = path.join(tempHome, ".config", "opencode");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "opencode.json"),
      JSON.stringify(
        { plugin: ["oh-my-opencode", "other-plugin", "@anyon-cli/anyon@latest"] },
        null,
        2,
      ),
    );

    await setupOpenCodeConfig();

    const opencodeConfig = JSON.parse(
      fs.readFileSync(path.join(configDir, "opencode.json"), "utf-8"),
    ) as { plugin?: string[] };

    expect(opencodeConfig.plugin).toEqual([
      "oh-my-opencode",
      "other-plugin",
    ]);
  });

  test("parses jsonc config and preserves commented plugin arrays while removing Anyon", async () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-opencode-"));
    tempHomes.push(tempHome);
    vi.stubEnv("HOME", tempHome);

    const configDir = path.join(tempHome, ".config", "opencode");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "opencode.jsonc"),
      `{
  // user plugin config
  "plugin": [
    "oh-my-opencode",
    "other-plugin",
  ]
}
`,
    );

    await setupOpenCodeConfig();

    const updated = fs.readFileSync(
      path.join(configDir, "opencode.jsonc"),
      "utf-8",
    );

    expect(updated).toContain('"oh-my-opencode"');
    expect(updated).toContain('"other-plugin"');
    expect(updated).not.toContain('"@anyon-cli/anyon@latest"');
  });

  test("updates anyon config presets without destroying existing keys", () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-opencode-"));
    tempHomes.push(tempHome);
    vi.stubEnv("HOME", tempHome);

    const configDir = path.join(tempHome, ".config", "opencode");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "anyon.jsonc"),
      JSON.stringify({ custom: { enabled: true } }, null, 2),
    );

    updateAnyonConfig({
      agents: { Builder: { model: "anthropic/claude-sonnet-4-5" } },
      categories: { quick: { model: "anthropic/claude-haiku-4-5" } },
    });

    const anyonConfig = JSON.parse(
      fs.readFileSync(path.join(configDir, "anyon.jsonc"), "utf-8"),
    ) as Record<string, unknown>;

    expect(anyonConfig).toHaveProperty("custom");
    expect(anyonConfig).toHaveProperty("agents");
    expect(anyonConfig).toHaveProperty("categories");
  });
});
