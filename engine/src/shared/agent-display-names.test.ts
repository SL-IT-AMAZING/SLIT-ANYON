import { describe, expect, it } from "bun:test";
import {
  AGENT_DISPLAY_NAMES,
  getAgentConfigKey,
  getAgentDisplayName,
} from "./agent-display-names";

describe("getAgentDisplayName", () => {
  it("returns display name for lowercase config key (new format)", () => {
    // given config key "conductor"
    const configKey = "conductor";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    expect(result).toBe("Builder");
  });

  it("returns original key for unknown agents (case-insensitive passthrough)", () => {
    // given config key "Euler" (not a current config key)
    const configKey = "Euler";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Euler" (not found in AGENT_DISPLAY_NAMES, passthrough)
    expect(result).toBe("Euler");
  });

  it("returns original key for unknown agents (fallback)", () => {
    // given config key "custom-agent"
    const configKey = "custom-agent";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "custom-agent" (original key unchanged)
    expect(result).toBe("custom-agent");
  });

  it("returns display name for taskmaster", () => {
    // given config key "taskmaster"
    const configKey = "taskmaster";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Taskmaster"
    expect(result).toBe("Taskmaster");
  });

  it("returns display name for strategist", () => {
    // given config key "strategist"
    const configKey = "strategist";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Strategist"
    expect(result).toBe("Strategist");
  });

  it("returns display name for worker", () => {
    // given config key "worker"
    const configKey = "worker";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Worker"
    expect(result).toBe("Worker");
  });

  it("returns display name for analyst", () => {
    // given config key "analyst"
    const configKey = "analyst";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Analyst"
    expect(result).toBe("Analyst");
  });

  it("returns display name for critic", () => {
    // given config key "critic"
    const configKey = "critic";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Critic"
    expect(result).toBe("Critic");
  });

  it("returns display name for advisor", () => {
    // given config key "advisor"
    const configKey = "advisor";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Advisor"
    expect(result).toBe("Advisor");
  });

  it("returns display name for researcher", () => {
    // given config key "researcher"
    const configKey = "researcher";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Researcher"
    expect(result).toBe("Researcher");
  });

  it("returns display name for scout", () => {
    // given config key "scout"
    const configKey = "scout";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Scout"
    expect(result).toBe("Scout");
  });

  it("returns display name for inspector", () => {
    // given config key "inspector"
    const configKey = "inspector";

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey);

    // then returns "Inspector"
    expect(result).toBe("Inspector");
  });
});

describe("getAgentConfigKey", () => {
  it("resolves legacy display name to config key", () => {
    // given legacy display name "Euler (Turboer)"
    // when getAgentConfigKey called
    // then returns "conductor"
    expect(getAgentConfigKey("Euler (Turboer)")).toBe("conductor");
  });

  it("resolves Builder display name to conductor config key", () => {
    expect(getAgentConfigKey("Builder")).toBe("conductor");
  });

  it("resolves legacy display name case-insensitively", () => {
    // given legacy display name in different case
    // when getAgentConfigKey called
    // then returns "taskmaster"
    expect(getAgentConfigKey("turing (plan executor)")).toBe("taskmaster");
  });

  it("passes through lowercase config keys unchanged", () => {
    // given lowercase config key "strategist"
    // when getAgentConfigKey called
    // then returns "strategist"
    expect(getAgentConfigKey("strategist")).toBe("strategist");
  });

  it("returns lowercased unknown agents", () => {
    // given unknown agent name
    // when getAgentConfigKey called
    // then returns lowercased
    expect(getAgentConfigKey("Custom-Agent")).toBe("custom-agent");
  });

  it("resolves all legacy agent display names", () => {
    // given all legacy display names
    // when/then each resolves to its config key
    expect(getAgentConfigKey("Tesla (Deep Agent)")).toBe("craftsman");
    expect(getAgentConfigKey("Newton (Plan Builder)")).toBe("strategist");
    expect(getAgentConfigKey("Turing (Plan Executor)")).toBe("taskmaster");
    expect(getAgentConfigKey("Lovelace (Plan Consultant)")).toBe("analyst");
    expect(getAgentConfigKey("Nietzsche (Plan Critic)")).toBe("critic");
    expect(getAgentConfigKey("Euler-Junior")).toBe("worker");
  });
});

describe("AGENT_DISPLAY_NAMES", () => {
  it("contains all expected agent mappings", () => {
    // given expected mappings
    const expectedMappings = {
      conductor: "Builder",
      craftsman: "Craftsman",
      strategist: "Strategist",
      taskmaster: "Taskmaster",
      worker: "Worker",
      analyst: "Analyst",
      critic: "Critic",
      advisor: "Advisor",
      researcher: "Researcher",
      scout: "Scout",
      inspector: "Inspector",
    };

    // when checking the constant
    // then contains all expected mappings
    expect(AGENT_DISPLAY_NAMES).toEqual(expectedMappings);
  });
});
