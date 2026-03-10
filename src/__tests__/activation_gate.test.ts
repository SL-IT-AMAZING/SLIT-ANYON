import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, test, vi } from "vitest";

const engineActivationGatePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../engine/src/activation-gate.ts",
);

const describeIfEnginePresent = fs.existsSync(engineActivationGatePath)
  ? describe
  : describe.skip;

async function loadActivationGate() {
  return import(pathToFileURL(engineActivationGatePath).href);
}

describeIfEnginePresent("isAnyonActivated", () => {
  test("returns false when activation env is missing", async () => {
    vi.stubEnv("ANYON_ACTIVE", undefined);
    const { isAnyonActivated } = await loadActivationGate();
    expect(isAnyonActivated()).toBe(false);
  });

  test("returns true when activation env is set to 1", async () => {
    vi.stubEnv("ANYON_ACTIVE", "1");
    const { isAnyonActivated } = await loadActivationGate();
    expect(isAnyonActivated()).toBe(true);
  });
});
