import { describe, expect, it, vi } from "vitest";
import { resolveSelectedAgentName } from "../ipc/utils/opencode_provider";

vi.mock("../ipc/utils/opencode_server", () => ({
  openCodeServer: {
    ensureRunning: vi.fn(),
  },
}));

describe("resolveSelectedAgentName", () => {
  it("returns exact agent name when available", () => {
    const resolved = resolveSelectedAgentName("Sisyphus", [
      { name: "Sisyphus" },
      { name: "Atlas" },
    ]);

    expect(resolved).toBe("Sisyphus");
  });

  it("falls back to base-name match for decorated names", () => {
    const resolved = resolveSelectedAgentName("Sisyphus", [
      { name: "Sisyphus (Ultraworker)" },
      { name: "Atlas" },
    ]);

    expect(resolved).toBe("Sisyphus (Ultraworker)");
  });

  it("returns undefined when no matching agent exists", () => {
    const resolved = resolveSelectedAgentName("Unknown Agent", [
      { name: "Sisyphus" },
      { name: "Atlas" },
    ]);

    expect(resolved).toBeUndefined();
  });
});
