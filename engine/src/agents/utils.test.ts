/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { AgentConfig } from "@opencode-ai/sdk";
import { clearSkillCache } from "../features/opencode-skill-loader/skill-content";
import * as shared from "../shared";
import * as connectedProvidersCache from "../shared/connected-providers-cache";
import * as modelAvailability from "../shared/model-availability";
import { createBuiltinAgents } from "./builtin-agents";

const TEST_DEFAULT_MODEL = "anthropic/claude-opus-4-6";

describe("createBuiltinAgents with model overrides", () => {
  test("Conductor with default model has thinking config when all models available", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
      ]),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor.model).toBe("anthropic/claude-opus-4-6");
      expect(agents.conductor.thinking).toEqual({
        type: "enabled",
        budgetTokens: 32000,
      });
      expect(agents.conductor.reasoningEffort).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("Conductor with GPT model override has reasoningEffort, no thinking", async () => {
    // #given
    const overrides = {
      conductor: { model: "github-copilot/gpt-5.2" },
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    );

    // #then
    expect(agents.conductor.model).toBe("github-copilot/gpt-5.2");
    expect(agents.conductor.reasoningEffort).toBe("medium");
    expect(agents.conductor.thinking).toBeUndefined();
  });

  test("Taskmaster uses uiSelectedModel", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.2", "anthropic/claude-sonnet-4-6"]),
    );
    const uiSelectedModel = "openai/gpt-5.2";

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel,
      );

      // #then
      expect(agents.taskmaster).toBeDefined();
      expect(agents.taskmaster.model).toBe("openai/gpt-5.2");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("user config model takes priority over uiSelectedModel for conductor", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.2", "anthropic/claude-sonnet-4-6"]),
    );
    const uiSelectedModel = "openai/gpt-5.2";
    const overrides = {
      conductor: { model: "google/antigravity-claude-opus-4-5-thinking" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel,
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe(
        "google/antigravity-claude-opus-4-5-thinking",
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("user config model takes priority over uiSelectedModel for taskmaster", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.2", "anthropic/claude-sonnet-4-6"]),
    );
    const uiSelectedModel = "openai/gpt-5.2";
    const overrides = {
      taskmaster: { model: "google/antigravity-claude-opus-4-5-thinking" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel,
      );

      // #then
      expect(agents.taskmaster).toBeDefined();
      expect(agents.taskmaster.model).toBe(
        "google/antigravity-claude-opus-4-5-thinking",
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("Conductor is created on first run when no availableModels or cache exist", async () => {
    // #given
    const systemDefaultModel = "anthropic/claude-opus-4-6";
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        systemDefaultModel,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe("anthropic/claude-opus-4-6");
    } finally {
      cacheSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  test("Advisor uses connected provider fallback when availableModels is empty and cache exists", async () => {
    // #given - connected providers cache has "openai", which matches advisor's first fallback entry
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["openai"]);

    // #when
    const agents = await createBuiltinAgents(
      [],
      {},
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    );

    // #then - advisor resolves via connected cache fallback to openai/gpt-5.2 (not system default)
    expect(agents.advisor.model).toBe("openai/gpt-5.2");
    expect(agents.advisor.reasoningEffort).toBe("medium");
    expect(agents.advisor.thinking).toBeUndefined();
    cacheSpy.mockRestore?.();
  });

  test("Advisor created without model field when no cache exists (first run scenario)", async () => {
    // #given - no cache at all (first run)
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);

    // #when
    const agents = await createBuiltinAgents(
      [],
      {},
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - advisor should be created with system default model (fallback to systemDefaultModel)
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.model).toBe(TEST_DEFAULT_MODEL);
    cacheSpy.mockRestore?.();
  });

  test("Advisor with GPT model override has reasoningEffort, no thinking", async () => {
    // #given
    const overrides = {
      advisor: { model: "openai/gpt-5.2" },
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    );

    // #then
    expect(agents.advisor.model).toBe("openai/gpt-5.2");
    expect(agents.advisor.reasoningEffort).toBe("medium");
    expect(agents.advisor.textVerbosity).toBe("high");
    expect(agents.advisor.thinking).toBeUndefined();
  });

  test("Advisor with Claude model override has thinking, no reasoningEffort", async () => {
    // #given
    const overrides = {
      advisor: { model: "anthropic/claude-sonnet-4" },
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    );

    // #then
    expect(agents.advisor.model).toBe("anthropic/claude-sonnet-4");
    expect(agents.advisor.thinking).toEqual({
      type: "enabled",
      budgetTokens: 32000,
    });
    expect(agents.advisor.reasoningEffort).toBeUndefined();
    expect(agents.advisor.textVerbosity).toBeUndefined();
  });

  test("non-model overrides are still applied after factory rebuild", async () => {
    // #given
    const overrides = {
      conductor: { model: "github-copilot/gpt-5.2", temperature: 0.5 },
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    );

    // #then
    expect(agents.conductor.model).toBe("github-copilot/gpt-5.2");
    expect(agents.conductor.temperature).toBe(0.5);
  });

  test("createBuiltinAgents excludes disabled skills from availableSkills", async () => {
    // #given
    const disabledSkills = new Set(["playwright"]);

    // #when
    const agents = await createBuiltinAgents(
      [],
      {},
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      disabledSkills,
    );

    // #then
    expect(agents.conductor.prompt).not.toContain("playwright");
    expect(agents.conductor.prompt).toContain("frontend-ui-ux");
    expect(agents.conductor.prompt).toContain("git-master");
  });

  test("includes custom agents in orchestrator prompts when provided via config", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
        "openai/gpt-5.2",
      ]),
    );

    const customAgentSummaries = [
      {
        name: "researcher",
        description: "Research agent for deep analysis",
        hidden: false,
      },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      expect(agents.conductor.prompt).toContain("researcher");
      expect(agents.craftsman.prompt).toContain("researcher");
      expect(agents.taskmaster.prompt).toContain("researcher");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("excludes hidden custom agents from orchestrator prompts", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );

    const customAgentSummaries = [
      {
        name: "hidden-agent",
        description: "Should never show",
        hidden: true,
      },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      expect(agents.conductor.prompt).not.toContain("hidden-agent");
      expect(agents.craftsman.prompt).not.toContain("hidden-agent");
      expect(agents.taskmaster.prompt).not.toContain("hidden-agent");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("excludes disabled custom agents from orchestrator prompts", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );

    const customAgentSummaries = [
      {
        name: "disabled-agent",
        description: "Should never show",
        disabled: true,
      },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      expect(agents.conductor.prompt).not.toContain("disabled-agent");
      expect(agents.craftsman.prompt).not.toContain("disabled-agent");
      expect(agents.taskmaster.prompt).not.toContain("disabled-agent");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("excludes custom agents when disabledAgents contains their name (case-insensitive)", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );

    const disabledAgents = ["Deep-Researcher"];
    const customAgentSummaries = [
      {
        name: "deep-researcher",
        description: "Should never show",
      },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        disabledAgents,
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      expect(agents.conductor.prompt).not.toContain("deep-researcher");
      expect(agents.craftsman.prompt).not.toContain("deep-researcher");
      expect(agents.taskmaster.prompt).not.toContain("deep-researcher");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("deduplicates custom agents case-insensitively", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );

    const customAgentSummaries = [
      { name: "Deep-Researcher", description: "First" },
      { name: "deep-researcher", description: "Second" },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      const matches =
        (agents.conductor?.prompt ?? "").match(/Custom agent: deep-researcher/gi) ?? [];
      expect(matches.length).toBe(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("sanitizes custom agent strings for markdown tables", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );

    const customAgentSummaries = [
      {
        name: "table-agent",
        description: "Line1\nAlpha | Beta",
      },
    ];

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries,
      );

      // #then
      expect(agents.conductor.prompt).toContain("Line1 Alpha \\| Beta");
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe("createBuiltinAgents without systemDefaultModel", () => {
  test("agents created via connected cache fallback even without systemDefaultModel", async () => {
    // #given - connected cache has "openai", which matches advisor's fallback chain
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["openai"]);

    // #when
    const agents = await createBuiltinAgents([], {}, undefined, undefined);

    // #then - connected cache enables model resolution despite no systemDefaultModel
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.model).toBe("openai/gpt-5.2");
    cacheSpy.mockRestore?.();
  });

  test("agents NOT created when no cache and no systemDefaultModel (first run without defaults)", async () => {
    // #given
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);

    // #when
    const agents = await createBuiltinAgents([], {}, undefined, undefined);

    // #then
    expect(agents.advisor).toBeUndefined();
    cacheSpy.mockRestore?.();
  });

  test("conductor created via connected cache fallback when all providers available", async () => {
    // #given
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue([
      "anthropic",
      "kimi-for-coding",
      "opencode",
      "zai-coding-plan",
    ]);
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
      ]),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        undefined,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe("anthropic/claude-opus-4-6");
    } finally {
      cacheSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});

describe("createBuiltinAgents with requiresProvider gating (craftsman)", () => {
  test("craftsman is created when provider-models cache connected list includes required provider", async () => {
    // #given
    const connectedCacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["anthropic"]);
    const providerModelsSpy = spyOn(
      connectedProvidersCache,
      "readProviderModelsCache",
    ).mockReturnValue({
      connected: ["openai"],
      models: {},
      updatedAt: new Date().toISOString(),
    });
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockImplementation(
      async (_, options) => {
        const providers = options?.connectedProviders ?? [];
        return providers.includes("openai")
          ? new Set(["openai/gpt-5.3-codex"])
          : new Set(["anthropic/claude-opus-4-6"]);
      },
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeDefined();
    } finally {
      connectedCacheSpy.mockRestore();
      providerModelsSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  test("craftsman is not created when no required provider is connected", async () => {
    // #given - only anthropic models available, not in craftsman requiresProvider
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6"]),
    );
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["anthropic"]);

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
      cacheSpy.mockRestore();
    }
  });

  test("craftsman is created when openai provider is connected", async () => {
    // #given - openai provider has models available
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.3-codex"]),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("craftsman IS created when github-copilot is connected with a GPT model", async () => {
    // #given - github-copilot provider has gpt-5.3-codex available
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/gpt-5.3-codex"]),
    );
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then - github-copilot is now a valid provider for craftsman
      expect(agents.craftsman).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
      cacheSpy.mockRestore();
    }
  });

  test("craftsman is created when opencode provider is connected", async () => {
    // #given - opencode provider has models available
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["opencode/gpt-5.3-codex"]),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("craftsman is created on first run when no availableModels or cache exist", async () => {
    // #given
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeDefined();
      expect(agents.craftsman.model).toBe("openai/gpt-5.3-codex");
    } finally {
      cacheSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  test("craftsman is created when explicit config provided even if provider unavailable", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6"]),
    );
    const overrides = {
      craftsman: { model: "anthropic/claude-opus-4-6" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.craftsman).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe("Craftsman environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.3-codex"]),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  async function buildAgents(disableFlag?: boolean) {
    return createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      disableFlag,
    );
  }

  test("includes <anyon-env> tag when disable flag is unset", async () => {
    // #when
    const agents = await buildAgents(undefined);

    // #then
    expect(agents.craftsman).toBeDefined();
    expect(agents.craftsman.prompt).toContain("<anyon-env>");
  });

  test("includes <anyon-env> tag when disable flag is false", async () => {
    // #when
    const agents = await buildAgents(false);

    // #then
    expect(agents.craftsman).toBeDefined();
    expect(agents.craftsman.prompt).toContain("<anyon-env>");
  });

  test("omits <anyon-env> tag when disable flag is true", async () => {
    // #when
    const agents = await buildAgents(true);

    // #then
    expect(agents.craftsman).toBeDefined();
    expect(agents.craftsman.prompt).not.toContain("<anyon-env>");
  });
});

describe("Conductor and Researcher environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "google/gemini-3-flash"]),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  async function buildAgents(disableFlag?: boolean) {
    return createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      disableFlag,
    );
  }

  test("includes <anyon-env> for conductor and researcher when disable flag is unset", async () => {
    const agents = await buildAgents(undefined);

    expect(agents.conductor).toBeDefined();
    expect(agents.researcher).toBeDefined();
    expect(agents.conductor.prompt).toContain("<anyon-env>");
    expect(agents.researcher.prompt).toContain("<anyon-env>");
  });

  test("includes <anyon-env> for conductor and researcher when disable flag is false", async () => {
    const agents = await buildAgents(false);

    expect(agents.conductor).toBeDefined();
    expect(agents.researcher).toBeDefined();
    expect(agents.conductor.prompt).toContain("<anyon-env>");
    expect(agents.researcher.prompt).toContain("<anyon-env>");
  });

  test("omits <anyon-env> for conductor and researcher when disable flag is true", async () => {
    const agents = await buildAgents(true);

    expect(agents.conductor).toBeDefined();
    expect(agents.researcher).toBeDefined();
    expect(agents.conductor.prompt).not.toContain("<anyon-env>");
    expect(agents.researcher.prompt).not.toContain("<anyon-env>");
  });
});

describe("Taskmaster is unaffected by environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6", "openai/gpt-5.2"]),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test("taskmaster prompt is unchanged and never contains <anyon-env>", async () => {
    const agentsDefault = await createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
    );

    const agentsDisabled = await createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );

    expect(agentsDefault.taskmaster).toBeDefined();
    expect(agentsDisabled.taskmaster).toBeDefined();
    expect(agentsDefault.taskmaster.prompt).not.toContain("<anyon-env>");
    expect(agentsDisabled.taskmaster.prompt).not.toContain("<anyon-env>");
    expect(agentsDisabled.taskmaster.prompt).toBe(agentsDefault.taskmaster.prompt);
  });
});

describe("createBuiltinAgents with requiresAnyModel gating (conductor)", () => {
  test("conductor is created when at least one fallback model is available", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["anthropic/claude-opus-4-6"]),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("conductor is created on first run when no availableModels or cache exist", async () => {
    // #given
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(),
    );

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe("anthropic/claude-opus-4-6");
    } finally {
      cacheSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  test("conductor is created when explicit config provided even if no models available", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(),
    );
    const overrides = {
      conductor: { model: "anthropic/claude-opus-4-6" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("conductor is not created when no fallback model is available and provider not connected", async () => {
    // #given - only openai/gpt-5.2 available, not in conductor fallback chain
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.2"]),
    );
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue([]);

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
      cacheSpy.mockRestore();
    }
  });

  test("conductor uses user-configured plugin model even when not in cache or fallback chain", async () => {
    // #given - user configures a model from a plugin provider (like antigravity)
    // that is NOT in the availableModels cache and NOT in the fallback chain
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.2"]),
    );
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["openai"]);
    const overrides = {
      conductor: { model: "google/antigravity-claude-opus-4-5-thinking" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe(
        "google/antigravity-claude-opus-4-5-thinking",
      );
    } finally {
      fetchSpy.mockRestore();
      cacheSpy.mockRestore();
    }
  });

  test("conductor uses user-configured plugin model when availableModels is empty but cache exists", async () => {
    // #given - connected providers cache exists but models cache is empty
    // This reproduces the exact scenario where provider-models.json has models: {}
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(),
    );
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(["google", "openai", "opencode"]);
    const overrides = {
      conductor: { model: "google/antigravity-claude-opus-4-5-thinking" },
    };

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        {},
      );

      // #then
      expect(agents.conductor).toBeDefined();
      expect(agents.conductor.model).toBe(
        "google/antigravity-claude-opus-4-5-thinking",
      );
    } finally {
      fetchSpy.mockRestore();
      cacheSpy.mockRestore();
    }
  });
});

describe("buildAgent with category and skills", () => {
  const { buildAgent } = require("./agent-builder");
  const TEST_MODEL = "anthropic/claude-opus-4-6";

  beforeEach(() => {
    clearSkillCache();
  });

  afterEach(() => {
    clearSkillCache();
  });

  test("agent with category inherits category settings", () => {
    // #given - agent factory that sets category but no model
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "visual-engineering",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then - category's built-in model is applied
    expect(agent.model).toBe("google/gemini-3.1-pro");
  });

  test("agent with category and existing model keeps existing model", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "visual-engineering",
          model: "custom/model",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then - explicit model takes precedence over category
    expect(agent.model).toBe("custom/model");
  });

  test("agent with category inherits variant", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "custom-category",
        }) as AgentConfig,
    };

    const categories = {
      "custom-category": {
        model: "openai/gpt-5.2",
        variant: "xhigh",
      },
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL, categories);

    // #then
    expect(agent.model).toBe("openai/gpt-5.2");
    expect(agent.variant).toBe("xhigh");
  });

  test("agent with skills has content prepended to prompt", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux"],
          prompt: "Original prompt content",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer");
    expect(agent.prompt).toContain("Original prompt content");
    expect(agent.prompt).toMatch(
      /Designer-Turned-Developer[\s\S]*Original prompt content/s,
    );
  });

  test("agent with multiple skills has all content prepended", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux"],
          prompt: "Agent prompt",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer");
    expect(agent.prompt).toContain("Agent prompt");
  });

  test("agent without category or skills works as before", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          model: "custom/model",
          temperature: 0.5,
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    expect(agent.model).toBe("custom/model");
    expect(agent.temperature).toBe(0.5);
    expect(agent.prompt).toBe("Base prompt");
  });

  test("agent with category and skills applies both", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "ultrabrain",
          skills: ["frontend-ui-ux"],
          prompt: "Task description",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then - category's built-in model and skills are applied
    expect(agent.model).toBe("openai/gpt-5.3-codex");
    expect(agent.variant).toBe("xhigh");
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer");
    expect(agent.prompt).toContain("Task description");
  });

  test("agent with non-existent category has no effect", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "non-existent",
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    // Note: The factory receives model, but if category doesn't exist, it's not applied
    // The agent's model comes from the factory output (which doesn't set model)
    expect(agent.model).toBeUndefined();
    expect(agent.prompt).toBe("Base prompt");
  });

  test("agent with non-existent skills only prepends found ones", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux", "non-existent-skill"],
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer");
    expect(agent.prompt).toContain("Base prompt");
  });

  test("agent with empty skills array keeps original prompt", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: [],
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then
    expect(agent.prompt).toBe("Base prompt");
  });

  test("agent with agent-browser skill resolves when browserProvider is set", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["agent-browser"],
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when - browserProvider is "agent-browser"
    const agent = buildAgent(
      source["test-agent"],
      TEST_MODEL,
      undefined,
      undefined,
      "agent-browser",
    );

    // #then - agent-browser skill content should be in prompt
    expect(agent.prompt).toContain("agent-browser");
    expect(agent.prompt).toContain("Base prompt");
  });

  test("agent with agent-browser skill NOT resolved when browserProvider not set", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["agent-browser"],
          prompt: "Base prompt",
        }) as AgentConfig,
    };

    // #when - no browserProvider (defaults to playwright)
    const agent = buildAgent(source["test-agent"], TEST_MODEL);

    // #then - agent-browser skill not found, only base prompt remains
    expect(agent.prompt).toBe("Base prompt");
    expect(agent.prompt).not.toContain("agent-browser open");
  });
});

describe("override.category expansion in createBuiltinAgents", () => {
  test("standard agent override with category expands category properties", async () => {
    // #given
    const overrides = {
      advisor: { category: "ultrabrain" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - ultrabrain category: model=openai/gpt-5.3-codex, variant=xhigh
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.model).toBe("openai/gpt-5.3-codex");
    expect(agents.advisor.variant).toBe("xhigh");
  });

  test("standard agent override with category AND direct variant - direct wins", async () => {
    // #given - ultrabrain has variant=xhigh, but direct override says "max"
    const overrides = {
      advisor: { category: "ultrabrain", variant: "max" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - direct variant overrides category variant
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.variant).toBe("max");
  });

  test("standard agent override with category AND direct reasoningEffort - direct wins", async () => {
    // #given - custom category has reasoningEffort=xhigh, direct override says "low"
    const categories = {
      "test-cat": {
        model: "openai/gpt-5.2",
        reasoningEffort: "xhigh" as const,
      },
    };
    const overrides = {
      advisor: { category: "test-cat", reasoningEffort: "low" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      categories,
    );

    // #then - direct reasoningEffort wins over category
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.reasoningEffort).toBe("low");
  });

  test("standard agent override with category applies reasoningEffort from category when no direct override", async () => {
    // #given - custom category has reasoningEffort, no direct reasoningEffort in override
    const categories = {
      "reasoning-cat": {
        model: "openai/gpt-5.2",
        reasoningEffort: "high" as const,
      },
    };
    const overrides = {
      advisor: { category: "reasoning-cat" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
      categories,
    );

    // #then - category reasoningEffort is applied
    expect(agents.advisor).toBeDefined();
    expect(agents.advisor.reasoningEffort).toBe("high");
  });

  test("conductor override with category expands category properties", async () => {
    // #given
    const overrides = {
      conductor: { category: "ultrabrain" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - ultrabrain category: model=openai/gpt-5.3-codex, variant=xhigh
    expect(agents.conductor).toBeDefined();
    expect(agents.conductor.model).toBe("openai/gpt-5.3-codex");
    expect(agents.conductor.variant).toBe("xhigh");
  });

  test("taskmaster override with category expands category properties", async () => {
    // #given
    const overrides = {
      taskmaster: { category: "ultrabrain" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - ultrabrain category: model=openai/gpt-5.3-codex, variant=xhigh
    expect(agents.taskmaster).toBeDefined();
    expect(agents.taskmaster.model).toBe("openai/gpt-5.3-codex");
    expect(agents.taskmaster.variant).toBe("xhigh");
  });

  test("override with non-existent category has no effect on config", async () => {
    // #given
    const overrides = {
      advisor: { category: "non-existent-category" } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - no category-specific variant/reasoningEffort applied from non-existent category
    expect(agents.advisor).toBeDefined();
    const agentsWithoutOverride = await createBuiltinAgents(
      [],
      {},
      undefined,
      TEST_DEFAULT_MODEL,
    );
    expect(agents.advisor.model).toBe(agentsWithoutOverride.advisor.model);
  });
});

describe("agent override tools migration", () => {
  test("tools: { x: false } is migrated to permission: { x: deny }", async () => {
    // #given
    const overrides = {
      scout: { tools: { "jetbrains_*": false } } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then
    expect(agents.scout).toBeDefined();
    const permission = agents.scout.permission as Record<string, string>;
    expect(permission["jetbrains_*"]).toBe("deny");
  });

  test("tools: { x: true } is migrated to permission: { x: allow }", async () => {
    // #given
    const overrides = {
      researcher: { tools: { "jetbrains_get_*": true } } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then
    expect(agents.researcher).toBeDefined();
    const permission = agents.researcher.permission as Record<string, string>;
    expect(permission["jetbrains_get_*"]).toBe("allow");
  });

  test("tools config is removed after migration", async () => {
    // #given
    const overrides = {
      scout: { tools: { some_tool: false } } as any,
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then
    expect(agents.scout).toBeDefined();
    expect((agents.scout as any).tools).toBeUndefined();
  });
});

describe("Deadlock prevention - fetchAvailableModels must not receive client", () => {
  test("createBuiltinAgents should call fetchAvailableModels with undefined client to prevent deadlock", async () => {
    // #given - This test ensures we don't regress on issue #1301
    // Passing client to fetchAvailableModels during createBuiltinAgents (called from config handler)
    // causes deadlock:
    // - Plugin init waits for server response (client.provider.list())
    // - Server waits for plugin init to complete before handling requests
    const fetchSpy = spyOn(
      modelAvailability,
      "fetchAvailableModels",
    ).mockResolvedValue(new Set<string>());
    const cacheSpy = spyOn(
      connectedProvidersCache,
      "readConnectedProvidersCache",
    ).mockReturnValue(null);

    const mockClient = {
      provider: { list: () => Promise.resolve({ data: { connected: [] } }) },
      model: { list: () => Promise.resolve({ data: [] }) },
    };

    // #when - Even when client is provided, fetchAvailableModels must be called with undefined
    await createBuiltinAgents(
      [],
      {},
      undefined,
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      mockClient, // client is passed but should NOT be forwarded to fetchAvailableModels
    );

    // #then - fetchAvailableModels must be called with undefined as first argument (no client)
    // This prevents the deadlock described in issue #1301
    expect(fetchSpy).toHaveBeenCalled();
    const firstCallArgs = fetchSpy.mock.calls[0];
    expect(firstCallArgs[0]).toBeUndefined();

    fetchSpy.mockRestore?.();
    cacheSpy.mockRestore?.();
  });
  test("Craftsman variant override respects user config over hardcoded default", async () => {
    // #given - user provides variant in config
    const overrides = {
      craftsman: { variant: "high" },
    };

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - user variant takes precedence over hardcoded "medium"
    expect(agents.craftsman).toBeDefined();
    expect(agents.craftsman.variant).toBe("high");
  });

  test("Craftsman uses default variant when no user override provided", async () => {
    // #given - no variant override in config
    const overrides = {};

    // #when
    const agents = await createBuiltinAgents(
      [],
      overrides,
      undefined,
      TEST_DEFAULT_MODEL,
    );

    // #then - default "medium" variant is applied
    expect(agents.craftsman).toBeDefined();
    expect(agents.craftsman.variant).toBe("medium");
  });
});
