import { describe, test, expect } from "bun:test";
import { createAdvisorAgent } from "./advisor";
import { createResearcherAgent } from "./researcher";
import { createScoutAgent } from "./scout";
import { createCriticAgent } from "./critic";
import { createAnalystAgent } from "./analyst";
import { createTaskmasterAgent } from "./taskmaster";

const TEST_MODEL = "anthropic/claude-sonnet-4-5";

describe("read-only agent tool restrictions", () => {
  const FILE_WRITE_TOOLS = ["write", "edit", "apply_patch"];

  describe("Advisor", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createAdvisorAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny");
      }
    });

    test("denies task but allows call_anyon_agent for research", () => {
      // given
      const agent = createAdvisorAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      expect(permission["task"]).toBe("deny");
      expect(permission["call_anyon_agent"]).toBeUndefined();
    });
  });

  describe("Researcher", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createResearcherAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny");
      }
    });
  });

  describe("Explore", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createScoutAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny");
      }
    });
  });

  describe("Critic", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createCriticAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny");
      }
    });
  });

  describe("Analyst", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createAnalystAgent(TEST_MODEL);

      // when
      const permission = agent.permission as Record<string, string>;

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny");
      }
    });
  });

  describe("Taskmaster", () => {
    test("allows delegation tools for orchestration", () => {
      // given
      const agent = createTaskmasterAgent({ model: TEST_MODEL });

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>;

      // then
      expect(permission["task"]).toBeUndefined();
      expect(permission["call_anyon_agent"]).toBeUndefined();
    });
  });
});
