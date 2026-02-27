import {
  NATIVE_AGENTS,
  findNativeAgent,
  getDefaultAgent,
  getNativeAgents,
} from "@/agent/runtime/agent_config";
import { describe, expect, it } from "vitest";

describe("agent_config", () => {
  it("NATIVE_AGENTS has exactly 3 agents", () => {
    expect(NATIVE_AGENTS).toHaveLength(3);
    expect(NATIVE_AGENTS.map((a) => a.name)).toEqual([
      "Sisyphus",
      "Hephaestus",
      "Atlas",
    ]);
  });

  it("getDefaultAgent returns Sisyphus", () => {
    const agent = getDefaultAgent();
    expect(agent.name).toBe("Sisyphus");
    expect(agent.tools.length).toBeGreaterThan(0);
  });

  it("findNativeAgent is case-insensitive", () => {
    expect(findNativeAgent("sisyphus")?.name).toBe("Sisyphus");
    expect(findNativeAgent("ATLAS")?.name).toBe("Atlas");
  });

  it("findNativeAgent returns undefined for unknown names", () => {
    expect(findNativeAgent("unknown-agent")).toBeUndefined();
  });

  it("getNativeAgents returns filtered agents with expected shape", () => {
    const agents = getNativeAgents();

    expect(agents).toHaveLength(3);
    for (const agent of agents) {
      expect(agent.native).toBe(true);
      expect(agent.mode).toBe("primary");
      expect(typeof agent.name).toBe("string");
      expect(typeof agent.description).toBe("string");
      expect(typeof agent.color).toBe("string");
    }
  });
});
