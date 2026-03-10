import { describe, expect, it } from "bun:test";
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper";

describe("remapAgentKeysToDisplayNames", () => {
  it("remaps known agent keys to display names", () => {
    // given agents with lowercase keys
    const agents = {
      conductor: { prompt: "test", mode: "primary" },
      advisor: { prompt: "test", mode: "subagent" },
    };

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents);

    // then known agents get display name keys only
    expect(result["Builder"]).toBeDefined();
    expect(result["Advisor"]).toBeDefined();
    expect(result["conductor"]).toBeUndefined();
  });

  it("preserves unknown agent keys unchanged", () => {
    // given agents with a custom key
    const agents = {
      "custom-agent": { prompt: "custom" },
    };

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents);

    // then custom key is unchanged
    expect(result["custom-agent"]).toBeDefined();
  });

  it("remaps all core agents to display names", () => {
    // given all core agents
    const agents = {
      conductor: {},
      craftsman: {},
      strategist: {},
      taskmaster: {},
      analyst: {},
      critic: {},
      worker: {},
    };

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents);

    // then all get display name keys without lowercase duplicates
    expect(result["Builder"]).toBeDefined();
    expect(result["conductor"]).toBeUndefined();
    expect(result["Craftsman"]).toBeDefined();
    expect(result["craftsman"]).toBeUndefined();
    expect(result["Strategist"]).toBeDefined();
    expect(result["strategist"]).toBeUndefined();
    expect(result["Taskmaster"]).toBeDefined();
    expect(result["taskmaster"]).toBeUndefined();
    expect(result["Analyst"]).toBeDefined();
    expect(result["analyst"]).toBeUndefined();
    expect(result["Critic"]).toBeDefined();
    expect(result["critic"]).toBeUndefined();
    expect(result["Worker"]).toBeDefined();
    expect(result["worker"]).toBeUndefined();
  });
});
