import { describe, expect, test } from "bun:test";
import { getAgentDisplayName } from "./agent-display-names";
import { migrateAgentNames } from "./migration";
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements";

describe("Agent Config Integration", () => {
  describe("Old format config migration", () => {
    test("migrates old format agent keys to lowercase", () => {
      // given - config with old format keys
      const oldConfig = {
        Conductor: { model: "anthropic/claude-opus-4-6" },
        Taskmaster: { model: "anthropic/claude-opus-4-6" },
        "Newton (Planner)": { model: "anthropic/claude-opus-4-6" },
        "Lovelace (Plan Consultant)": { model: "anthropic/claude-sonnet-4-6" },
        "Nietzsche (Plan Reviewer)": { model: "anthropic/claude-sonnet-4-6" },
      };

      // when - migration is applied
      const result = migrateAgentNames(oldConfig);

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("conductor");
      expect(result.migrated).toHaveProperty("taskmaster");
      expect(result.migrated).toHaveProperty("strategist");
      expect(result.migrated).toHaveProperty("analyst");
      expect(result.migrated).toHaveProperty("critic");

      // then - old keys are removed
      expect(result.migrated).not.toHaveProperty("Conductor");
      expect(result.migrated).not.toHaveProperty("Taskmaster");
      expect(result.migrated).not.toHaveProperty("Newton (Planner)");
      expect(result.migrated).not.toHaveProperty("Lovelace (Plan Consultant)");
      expect(result.migrated).not.toHaveProperty("Nietzsche (Plan Reviewer)");

      // then - values are preserved
      expect(result.migrated.conductor).toEqual({
        model: "anthropic/claude-opus-4-6",
      });
      expect(result.migrated.taskmaster).toEqual({
        model: "anthropic/claude-opus-4-6",
      });
      expect(result.migrated.strategist).toEqual({
        model: "anthropic/claude-opus-4-6",
      });

      // then - changed flag is true
      expect(result.changed).toBe(true);
    });

    test("preserves already lowercase keys", () => {
      // given - config with lowercase keys
      const config = {
        conductor: { model: "anthropic/claude-opus-4-6" },
        advisor: { model: "openai/gpt-5.2" },
        researcher: { model: "opencode/big-pickle" },
      };

      // when - migration is applied
      const result = migrateAgentNames(config);

      // then - keys remain unchanged
      expect(result.migrated).toEqual(config);

      // then - changed flag is false
      expect(result.changed).toBe(false);
    });

    test("handles mixed case config", () => {
      // given - config with mixed old and new format
      const mixedConfig = {
        Conductor: { model: "anthropic/claude-opus-4-6" },
        advisor: { model: "openai/gpt-5.2" },
        "Newton (Planner)": { model: "anthropic/claude-opus-4-6" },
        researcher: { model: "opencode/big-pickle" },
      };

      // when - migration is applied
      const result = migrateAgentNames(mixedConfig);

      // then - all keys are lowercase
      expect(result.migrated).toHaveProperty("conductor");
      expect(result.migrated).toHaveProperty("advisor");
      expect(result.migrated).toHaveProperty("strategist");
      expect(result.migrated).toHaveProperty("researcher");
      expect(
        Object.keys(result.migrated).every((key) => key === key.toLowerCase()),
      ).toBe(true);

      // then - changed flag is true
      expect(result.changed).toBe(true);
    });
  });

  describe("Display name resolution", () => {
    test("returns correct display names for all builtin agents", () => {
      // given - lowercase config keys
      const agents = [
        "conductor",
        "taskmaster",
        "strategist",
        "analyst",
        "critic",
        "advisor",
        "researcher",
        "scout",
        "inspector",
      ];

      // when - display names are requested
      const displayNames = agents.map((agent) => getAgentDisplayName(agent));

      // then - display names are correct
      expect(displayNames).toContain("Builder");
      expect(displayNames).toContain("Taskmaster");
      expect(displayNames).toContain("Strategist");
      expect(displayNames).toContain("Analyst");
      expect(displayNames).toContain("Critic");
      expect(displayNames).toContain("Advisor");
      expect(displayNames).toContain("Researcher");
      expect(displayNames).toContain("Scout");
      expect(displayNames).toContain("Inspector");
    });

    test("handles lowercase keys case-insensitively", () => {
      // given - various case formats of config keys
      const keys = ["conductor", "taskmaster", "strategist"];

      // when - display names are requested
      const displayNames = keys.map((key) => getAgentDisplayName(key));

      // then - correct display names are returned
      expect(displayNames[0]).toBe("Builder");
      expect(displayNames[1]).toBe("Taskmaster");
      expect(displayNames[2]).toBe("Strategist");
    });

    test("returns original key for unknown agents", () => {
      // given - unknown agent key
      const unknownKey = "custom-agent";

      // when - display name is requested
      const displayName = getAgentDisplayName(unknownKey);

      // then - original key is returned
      expect(displayName).toBe(unknownKey);
    });
  });

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS);

      // when - checking key format
      const allLowercase = agentKeys.every((key) => key === key.toLowerCase());

      // then - all keys are lowercase
      expect(allLowercase).toBe(true);
    });

    test("model requirements include all builtin agents", () => {
      // given - expected builtin agents
      const expectedAgents = [
        "conductor",
        "taskmaster",
        "strategist",
        "analyst",
        "critic",
        "advisor",
        "researcher",
        "explore",
        "inspector",
      ];

      // when - checking AGENT_MODEL_REQUIREMENTS
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS);

      // then - all expected agents are present
      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent);
      }
    });

    test("no uppercase keys in model requirements", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS);

      // when - checking for uppercase keys
      const uppercaseKeys = agentKeys.filter(
        (key) => key !== key.toLowerCase(),
      );

      // then - no uppercase keys exist
      expect(uppercaseKeys).toEqual([]);
    });
  });

  describe("End-to-end config flow", () => {
    test("old config migrates and displays correctly", () => {
      // given - old format config
      const oldConfig = {
        Conductor: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        "Newton (Planner)": { model: "anthropic/claude-opus-4-6" },
      };

      // when - config is migrated
      const result = migrateAgentNames(oldConfig);

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("conductor");
      expect(result.migrated).toHaveProperty("strategist");

      // when - display names are retrieved
      const conductorDisplay = getAgentDisplayName("conductor");
      const strategistDisplay = getAgentDisplayName("strategist");

      // then - display names are correct
      expect(conductorDisplay).toBe("Builder");
      expect(strategistDisplay).toBe("Strategist");

      // then - config values are preserved
      expect(result.migrated.conductor).toEqual({
        model: "anthropic/claude-opus-4-6",
        temperature: 0.1,
      });
      expect(result.migrated.strategist).toEqual({
        model: "anthropic/claude-opus-4-6",
      });
    });

    test("new config works without migration", () => {
      // given - new format config (already lowercase)
      const newConfig = {
        conductor: { model: "anthropic/claude-opus-4-6" },
        taskmaster: { model: "anthropic/claude-opus-4-6" },
      };

      // when - migration is applied (should be no-op)
      const result = migrateAgentNames(newConfig);

      // then - config is unchanged
      expect(result.migrated).toEqual(newConfig);

      // then - changed flag is false
      expect(result.changed).toBe(false);

      // when - display names are retrieved
      const conductorDisplay = getAgentDisplayName("conductor");
      const taskmasterDisplay = getAgentDisplayName("taskmaster");

      // then - display names are correct
      expect(conductorDisplay).toBe("Builder");
      expect(taskmasterDisplay).toBe("Taskmaster");
    });
  });
});
