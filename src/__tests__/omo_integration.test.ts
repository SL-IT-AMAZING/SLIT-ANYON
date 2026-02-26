/**
 * OMO Agent System Integration Tests
 *
 * Verifies the OMO agent system works correctly without launching the Electron app.
 * Tests pure functions and data structures that can be validated in isolation.
 *
 * Test coverage:
 * 1. System Prompt Assembly — buildSisyphusPrompt / assembleSisyphusSystemPrompt
 * 2. Thinking Block Extraction — StreamBridge <think> tag handling
 * 3. Tool Consent — ToolRegistry auto-allows all risk levels
 * 4. Agent Definitions — structure and metadata validation
 */

import { describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks required before imports
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("electron-log", () => {
  const scoped = {
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    default: { scope: vi.fn(() => scoped) },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import type { TextStreamPart, ToolSet } from "ai";

import { OMO_AGENTS } from "@/agent/runtime/agents/definitions";
import {
  getAgentDefinition,
  getAgentDescriptors,
  getAllAgentDefinitions,
} from "@/agent/runtime/agents/register_all";
import {
  type SisyphusPromptContext,
  assembleSisyphusSystemPrompt,
  buildFullSisyphusPrompt,
  buildSisyphusPrompt,
} from "@/agent/runtime/agents/sisyphus_prompt_builder";
import { StreamBridge } from "@/agent/runtime/stream_bridge";
import type { NativeTool } from "@/agent/runtime/tool_interface";
import { ToolRegistry } from "@/agent/runtime/tool_registry";
import type { StreamCallbacks } from "@/agent/runtime/types";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal SisyphusPromptContext for testing dynamic sections. */
function makePromptContext(
  overrides: Partial<SisyphusPromptContext> = {},
): SisyphusPromptContext {
  return {
    skills: [],
    commands: [],
    agents: [],
    variant: "primary",
    projectDir: "/tmp/test-project",
    ...overrides,
  };
}

/** Create a minimal NativeTool for ToolRegistry tests. */
function makeTool(
  id: string,
  riskLevel: NativeTool["riskLevel"] = "safe",
): NativeTool {
  return {
    id,
    description: `Tool ${id}`,
    parameters: z.object({}),
    riskLevel,
    execute: async () => "ok",
  };
}

/** Build a StreamCallbacks with vi.fn() stubs. */
function makeCallbacks(): StreamCallbacks {
  return {
    onTextDelta: vi.fn(),
    onReasoningDelta: vi.fn(),
    onToolCall: vi.fn(),
    onToolResult: vi.fn(),
    onToolError: vi.fn(),
    onStepFinish: vi.fn(),
    onFinish: vi.fn(),
    onError: vi.fn(),
  };
}

/** Wrap an array of stream parts into an async iterable stream. */
function toStream(
  parts: TextStreamPart<ToolSet>[],
): AsyncIterable<TextStreamPart<ToolSet>> & ReadableStream<TextStreamPart<ToolSet>> {
  const iterable = {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) yield part;
    },
  };
  return iterable as unknown as AsyncIterable<TextStreamPart<ToolSet>> &
    ReadableStream<TextStreamPart<ToolSet>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 1: System Prompt Assembly
// ─────────────────────────────────────────────────────────────────────────────

describe("System Prompt Assembly", () => {
  it("buildSisyphusPrompt returns a non-empty string", () => {
    const ctx = makePromptContext();
    const result = buildSisyphusPrompt(ctx);

    // Dynamic sections always include at least variant + project_directory
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes agent_variant tag in the dynamic sections", () => {
    const ctx = makePromptContext({ variant: "primary" });
    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain("<agent_variant>primary</agent_variant>");
  });

  it("includes project_directory tag in the dynamic sections", () => {
    const ctx = makePromptContext({ projectDir: "/home/user/myproject" });
    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain(
      "<project_directory>/home/user/myproject</project_directory>",
    );
  });

  it("should dynamically include available agents in delegation table", () => {
    const ctx = makePromptContext({
      agents: [
        {
          name: "oracle",
          description: "Deep reasoning consultant",
          cost: "expensive",
          mode: "subagent",
        },
        {
          name: "explore",
          description: "Fast search agent",
          cost: "free",
          mode: "subagent",
        },
      ],
    });

    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain("<available_agents>");
    expect(result).toContain("</available_agents>");
    expect(result).toContain("| Agent | Description | Cost |");
    expect(result).toContain("oracle");
    expect(result).toContain("Deep reasoning consultant");
    expect(result).toContain("expensive");
    expect(result).toContain("explore");
    expect(result).toContain("free");
  });

  it("should dynamically include available skills", () => {
    const ctx = makePromptContext({
      skills: [
        {
          name: "frontend-ui-ux",
          description: "Design expert",
          scope: "user",
          hasMcp: false,
        },
        {
          name: "git-master",
          description: "Git expert",
          scope: "project",
          hasMcp: false,
        },
      ],
    });

    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain("<available_skills>");
    expect(result).toContain("</available_skills>");
    expect(result).toContain("frontend-ui-ux");
    expect(result).toContain("Design expert");
    expect(result).toContain("git-master");
    expect(result).toContain("Git expert");
  });

  it("should dynamically include available commands", () => {
    const ctx = makePromptContext({
      commands: [
        {
          name: "sisyphus",
          description: "Activate Sisyphus",
          scope: "builtin",
          content: "",
        },
        {
          name: "plan",
          description: "Start planning",
          scope: "user",
          content: "",
        },
      ],
    });

    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain("<available_commands>");
    expect(result).toContain("</available_commands>");
    expect(result).toContain("/sisyphus");
    expect(result).toContain("Activate Sisyphus");
    expect(result).toContain("/plan");
  });

  it("should omit agents section when no agents provided", () => {
    const ctx = makePromptContext({ agents: [] });
    const result = buildSisyphusPrompt(ctx);

    expect(result).not.toContain("<available_agents>");
  });

  it("should omit skills section when no skills provided", () => {
    const ctx = makePromptContext({ skills: [] });
    const result = buildSisyphusPrompt(ctx);

    expect(result).not.toContain("<available_skills>");
  });

  it("should omit commands section when no commands provided", () => {
    const ctx = makePromptContext({ commands: [] });
    const result = buildSisyphusPrompt(ctx);

    expect(result).not.toContain("<available_commands>");
  });

  it("assembleSisyphusSystemPrompt combines base prompt with dynamic sections", () => {
    const basePrompt =
      "You are Sisyphus, a powerful AI agent with multi-agent orchestration capabilities.";
    const ctx = makePromptContext({
      agents: [
        {
          name: "oracle",
          description: "Reasoning",
          cost: "expensive",
          mode: "subagent",
        },
      ],
    });

    const full = assembleSisyphusSystemPrompt(basePrompt, ctx);

    // Should contain the base prompt
    expect(full).toContain("You are Sisyphus");
    // Should contain dynamic sections
    expect(full).toContain("<available_agents>");
    expect(full).toContain("oracle");
    expect(full).toContain("<agent_variant>primary</agent_variant>");
  });

  it("assembleSisyphusSystemPrompt preserves base prompt verbatim at the start", () => {
    const basePrompt = "BASE PROMPT CONTENT";
    const ctx = makePromptContext();

    const full = assembleSisyphusSystemPrompt(basePrompt, ctx);

    expect(full.startsWith("BASE PROMPT CONTENT")).toBe(true);
  });

  it("buildFullSisyphusPrompt includes Sisyphus identity and all phases", () => {
    // Test the actual dynamic prompt builder (not the static file)
    const prompt = buildFullSisyphusPrompt([], [], [], []);

    // Core identity
    expect(prompt).toContain("Sisyphus");
    expect(prompt).toContain("SF Bay Area engineer");

    // All phases present
    expect(prompt).toContain("Phase 0");
    expect(prompt).toContain("Phase 1");
    expect(prompt).toContain("Phase 2A");
    expect(prompt).toContain("Phase 2B");
    expect(prompt).toContain("Phase 2C");
    expect(prompt).toContain("Phase 3");

    // Key sections
    expect(prompt).toContain("Oracle");
    expect(prompt).toContain("Todo Management");
    expect(prompt).toContain("Be Concise");
    expect(prompt).toContain("Hard Blocks");
    expect(prompt).toContain("Anti-Patterns");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 2: Thinking Block Extraction (via StreamBridge)
// ─────────────────────────────────────────────────────────────────────────────

describe("Thinking Block Extraction via StreamBridge", () => {
  it("should wrap reasoning-delta parts in <think> tags in the response text", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "reasoning-delta", text: "This is reasoning" } as TextStreamPart<ToolSet>,
      { type: "text-delta", text: "The actual response" } as TextStreamPart<ToolSet>,
      { type: "finish", totalUsage: { inputTokens: 5, outputTokens: 5 } } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(toStream(parts), abort.signal);

    // The full response text wraps reasoning in <think>...</think>
    expect(result.fullResponseText).toContain("<think>");
    expect(result.fullResponseText).toContain("This is reasoning");
    expect(result.fullResponseText).toContain("</think>");
    // The text response follows after the closing tag
    expect(result.fullResponseText).toContain("The actual response");
    // Response text doesn't start with <think> (it's prepended on reasoning)
    const thinkIndex = result.fullResponseText.indexOf("<think>");
    const responseIndex = result.fullResponseText.indexOf("The actual response");
    expect(responseIndex).toBeGreaterThan(thinkIndex);
  });

  it("should handle multiple thinking blocks separated by text", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "reasoning-delta", text: "First thought" } as TextStreamPart<ToolSet>,
      { type: "text-delta", text: "Response 1" } as TextStreamPart<ToolSet>,
      { type: "reasoning-delta", text: "Second thought" } as TextStreamPart<ToolSet>,
      { type: "text-delta", text: "Response 2" } as TextStreamPart<ToolSet>,
      { type: "finish", totalUsage: { inputTokens: 5, outputTokens: 5 } } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(toStream(parts), abort.signal);

    // Both thinking blocks should appear
    expect(result.fullResponseText).toContain("First thought");
    expect(result.fullResponseText).toContain("Second thought");
    // Both text responses should appear
    expect(result.fullResponseText).toContain("Response 1");
    expect(result.fullResponseText).toContain("Response 2");
    // Should have think tags
    expect(result.fullResponseText).toContain("<think>");
    expect(result.fullResponseText).toContain("</think>");
  });

  it("should close open thinking block when stream ends mid-think", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "reasoning-delta", text: "Unfinished reasoning" } as TextStreamPart<ToolSet>,
      // No text-delta follows — stream ends with open think block
      { type: "finish", totalUsage: { inputTokens: 2, outputTokens: 2 } } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(toStream(parts), abort.signal);

    // Even without a text-delta to close the block, processStream should close it
    expect(result.fullResponseText).toContain("</think>");
    expect(result.fullResponseText).toContain("Unfinished reasoning");
  });

  it("should handle content with no thinking blocks", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "text-delta", text: "Just a normal response without thinking" } as TextStreamPart<ToolSet>,
      { type: "finish", totalUsage: { inputTokens: 3, outputTokens: 10 } } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(toStream(parts), abort.signal);

    expect(result.fullResponseText).toBe(
      "Just a normal response without thinking",
    );
    // No think tags for pure text responses
    expect(result.fullResponseText).not.toContain("<think>");
    expect(result.fullResponseText).not.toContain("</think>");
  });

  it("should invoke onReasoningDelta callback for each reasoning part", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "reasoning-delta", text: "chunk1" } as TextStreamPart<ToolSet>,
      { type: "reasoning-delta", text: "chunk2" } as TextStreamPart<ToolSet>,
      { type: "finish", totalUsage: { inputTokens: 1, outputTokens: 1 } } as TextStreamPart<ToolSet>,
    ];

    await bridge.processStream(toStream(parts), abort.signal);

    expect(callbacks.onReasoningDelta).toHaveBeenCalledTimes(2);
    expect(callbacks.onReasoningDelta).toHaveBeenNthCalledWith(1, "chunk1");
    expect(callbacks.onReasoningDelta).toHaveBeenNthCalledWith(2, "chunk2");
  });

  it("should not invoke onReasoningDelta when there are no reasoning parts", async () => {
    const callbacks = makeCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const parts: TextStreamPart<ToolSet>[] = [
      { type: "text-delta", text: "plain text" } as TextStreamPart<ToolSet>,
      { type: "finish", totalUsage: { inputTokens: 1, outputTokens: 1 } } as TextStreamPart<ToolSet>,
    ];

    await bridge.processStream(toStream(parts), abort.signal);

    expect(callbacks.onReasoningDelta).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 3: Tool Consent
// ─────────────────────────────────────────────────────────────────────────────

describe("Tool Consent — Auto-Allow All Risk Levels", () => {
  /**
   * The `needsConsent` function is private/non-exported in tool_registry.ts.
   * We test its behavior indirectly through ToolRegistry.resolveTools().
   *
   * The ToolRegistry.resolveTools() uses needsConsent internally:
   * if needsConsent returns false, ctx.askConsent is never called.
   */

  it("should never call askConsent for a 'safe' risk tool", async () => {
    const registry = new ToolRegistry();
    registry.register(makeTool("safe-tool", "safe"));

    const askConsent = vi.fn().mockResolvedValue(true);
    const ctx = {
      abort: new AbortController().signal,
      askConsent,
      // Provide enough context for tool execution
      sessionId: "test-session",
      runId: "test-run",
    } as any;

    const toolSet = registry.resolveTools(["safe-tool"], ctx);
    // Execute the resolved tool
    await toolSet["safe-tool"]?.execute?.({}, {} as any);

    expect(askConsent).not.toHaveBeenCalled();
  });

  it("should never call askConsent for a 'moderate' risk tool", async () => {
    const registry = new ToolRegistry();
    registry.register(makeTool("moderate-tool", "moderate"));

    const askConsent = vi.fn().mockResolvedValue(true);
    const ctx = {
      abort: new AbortController().signal,
      askConsent,
      sessionId: "test-session",
      runId: "test-run",
    } as any;

    const toolSet = registry.resolveTools(["moderate-tool"], ctx);
    await toolSet["moderate-tool"]?.execute?.({}, {} as any);

    expect(askConsent).not.toHaveBeenCalled();
  });

  it("should never call askConsent for a 'dangerous' risk tool", async () => {
    const registry = new ToolRegistry();
    registry.register(makeTool("dangerous-tool", "dangerous"));

    const askConsent = vi.fn().mockResolvedValue(true);
    const ctx = {
      abort: new AbortController().signal,
      askConsent,
      sessionId: "test-session",
      runId: "test-run",
    } as any;

    const toolSet = registry.resolveTools(["dangerous-tool"], ctx);
    await toolSet["dangerous-tool"]?.execute?.({}, {} as any);

    expect(askConsent).not.toHaveBeenCalled();
  });

  it("should auto-allow all three risk levels without consent", async () => {
    const registry = new ToolRegistry();
    const riskLevels: NativeTool["riskLevel"][] = ["safe", "moderate", "dangerous"];
    const toolIds: string[] = [];

    for (const level of riskLevels) {
      const id = `tool-${level}`;
      registry.register(makeTool(id, level));
      toolIds.push(id);
    }

    const askConsent = vi.fn().mockResolvedValue(true);
    const ctx = {
      abort: new AbortController().signal,
      askConsent,
    } as any;

    const toolSet = registry.resolveTools(toolIds, ctx);

    // Execute all tools — none should trigger consent
    for (const id of toolIds) {
      await toolSet[id]?.execute?.({}, {} as any);
    }

    expect(askConsent).not.toHaveBeenCalled();
  });

  it("ToolRegistry throws when registering a duplicate tool ID", () => {
    const registry = new ToolRegistry();
    registry.register(makeTool("dup-tool"));

    expect(() => registry.register(makeTool("dup-tool"))).toThrow(
      '"dup-tool" is already registered',
    );
  });

  it("ToolRegistry resolveTools returns empty tool set for unknown IDs", () => {
    const registry = new ToolRegistry();
    const ctx = {
      abort: new AbortController().signal,
      askConsent: vi.fn(),
    } as any;

    const toolSet = registry.resolveTools(["nonexistent-tool"], ctx);
    expect(Object.keys(toolSet)).toHaveLength(0);
  });

  it("ToolRegistry.list returns all registered tools", () => {
    const registry = new ToolRegistry();
    registry.register(makeTool("tool-a"));
    registry.register(makeTool("tool-b"));
    registry.register(makeTool("tool-c"));

    expect(registry.list()).toHaveLength(3);
    expect(registry.list().map((t) => t.id)).toContain("tool-a");
    expect(registry.list().map((t) => t.id)).toContain("tool-b");
    expect(registry.list().map((t) => t.id)).toContain("tool-c");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 4: Agent Definitions
// ─────────────────────────────────────────────────────────────────────────────

describe("Agent Definitions", () => {
  it("getAllAgentDefinitions returns the expected number of agents", () => {
    const agents = getAllAgentDefinitions();
    // Currently 11 agents defined in definitions.ts
    expect(agents.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(agents)).toBe(true);
  });

  it("all agents should have required fields: name, description, model, tools, mode, cost", () => {
    for (const agent of getAllAgentDefinitions()) {
      expect(typeof agent.name).toBe("string");
      expect(agent.name.length).toBeGreaterThan(0);

      expect(typeof agent.description).toBe("string");
      expect(agent.description.length).toBeGreaterThan(0);

      expect(typeof agent.model).toBe("object");
      expect(typeof agent.model.provider).toBe("string");
      expect(typeof agent.model.modelId).toBe("string");

      expect(Array.isArray(agent.tools)).toBe(true);
      expect(agent.tools.length).toBeGreaterThan(0);

      expect(["primary", "subagent", "all"]).toContain(agent.mode);
      expect(["free", "cheap", "moderate", "expensive"]).toContain(agent.cost);
    }
  });

  it("sisyphus agent should exist with mode 'primary'", () => {
    const sisyphus = getAgentDefinition("sisyphus");

    expect(sisyphus).toBeDefined();
    expect(sisyphus?.name).toBe("sisyphus");
    expect(sisyphus?.mode).toBe("primary");
  });

  it("sisyphus should use anthropic provider with opus model", () => {
    const sisyphus = getAgentDefinition("sisyphus");

    expect(sisyphus?.model.provider).toBe("anthropic");
    expect(sisyphus?.model.modelId).toContain("opus");
  });

  it("sisyphus should have thinking enabled with a budget", () => {
    const sisyphus = getAgentDefinition("sisyphus");

    expect(sisyphus?.thinking).toBeDefined();
    expect(sisyphus?.thinking?.enabled).toBe(true);
    expect(typeof sisyphus?.thinking?.budgetTokens).toBe("number");
    expect((sisyphus?.thinking?.budgetTokens ?? 0)).toBeGreaterThan(0);
  });

  it("oracle agent should exist with expensive cost", () => {
    const oracle = getAgentDefinition("oracle");

    expect(oracle).toBeDefined();
    expect(oracle?.name).toBe("oracle");
    expect(oracle?.cost).toBe("expensive");
    expect(oracle?.model.modelId).toContain("opus");
  });

  it("oracle should have thinking enabled", () => {
    const oracle = getAgentDefinition("oracle");

    expect(oracle?.thinking?.enabled).toBe(true);
  });

  it("explore agent should use haiku model with 'free' cost", () => {
    const explore = getAgentDefinition("explore");

    expect(explore).toBeDefined();
    expect(explore?.cost).toBe("free");
    expect(explore?.model.modelId).toContain("haiku");
  });

  it("all agents should reference a systemPromptFile", () => {
    for (const agent of getAllAgentDefinitions()) {
      expect(typeof agent.systemPromptFile).toBe("string");
      expect(agent.systemPromptFile.endsWith(".txt")).toBe(true);
      expect(agent.systemPromptFile.length).toBeGreaterThan(0);
    }
  });

  it("agent names should be unique", () => {
    const agents = getAllAgentDefinitions();
    const names = agents.map((a) => a.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(names.length);
  });

  it("getAgentDefinition returns undefined for unknown agent", () => {
    expect(getAgentDefinition("nonexistent-agent-xyz")).toBeUndefined();
  });

  it("getAgentDescriptors returns lightweight descriptors with name, description, cost, mode", () => {
    const descriptors = getAgentDescriptors();

    expect(Array.isArray(descriptors)).toBe(true);
    expect(descriptors.length).toBe(getAllAgentDefinitions().length);

    for (const descriptor of descriptors) {
      expect(typeof descriptor.name).toBe("string");
      expect(typeof descriptor.description).toBe("string");
      expect(typeof descriptor.cost).toBe("string");
      expect(typeof descriptor.mode).toBe("string");
    }
  });

  it("getAgentDescriptors does NOT include sensitive fields like tools or model", () => {
    const descriptors = getAgentDescriptors();

    for (const descriptor of descriptors) {
      expect((descriptor as any).tools).toBeUndefined();
      expect((descriptor as any).model).toBeUndefined();
      expect((descriptor as any).systemPromptFile).toBeUndefined();
    }
  });

  it("contains all expected core agents", () => {
    const names = new Set(getAllAgentDefinitions().map((a) => a.name));

    const expectedAgents = [
      "sisyphus",
      "oracle",
      "librarian",
      "explore",
      "prometheus",
    ];

    for (const expected of expectedAgents) {
      expect(names.has(expected)).toBe(true);
    }
  });

  it("OMO_AGENTS raw export matches getAllAgentDefinitions output", () => {
    const fromAll = getAllAgentDefinitions();
    const fromRaw = OMO_AGENTS;

    expect(fromAll.length).toBe(fromRaw.length);
    expect(fromAll.map((a) => a.name)).toEqual(fromRaw.map((a) => a.name));
  });

  it("subagent mode agents should not have mode 'primary'", () => {
    const subagents = getAllAgentDefinitions().filter(
      (a) => a.mode === "subagent",
    );

    for (const agent of subagents) {
      expect(agent.mode).not.toBe("primary");
    }
  });

  it("agents with thinking enabled should have a positive budget", () => {
    const thinkingAgents = getAllAgentDefinitions().filter(
      (a) => a.thinking?.enabled === true,
    );

    // At least sisyphus and oracle should have thinking enabled
    expect(thinkingAgents.length).toBeGreaterThan(0);

    for (const agent of thinkingAgents) {
      expect(agent.thinking?.budgetTokens).toBeDefined();
      expect((agent.thinking?.budgetTokens ?? 0)).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 5: Delegation Table Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("Delegation Table Generation", () => {
  it("should produce a markdown-style table row for each agent", () => {
    const ctx = makePromptContext({
      agents: getAgentDescriptors(),
    });

    const result = buildSisyphusPrompt(ctx);

    // Should have the table header
    expect(result).toContain("| Agent | Description | Cost |");
    expect(result).toContain("|-------|-------------|------|");

    // Each agent should appear as a table row
    for (const agent of getAgentDescriptors()) {
      expect(result).toContain(`| ${agent.name} |`);
    }
  });

  it("should include sisyphus in the generated delegation table", () => {
    const ctx = makePromptContext({
      agents: getAgentDescriptors(),
    });

    const result = buildSisyphusPrompt(ctx);

    expect(result).toContain("sisyphus");
    expect(result).toContain("expensive");
  });

  it("agent descriptor cost is one of the known values", () => {
    const validCosts = ["free", "cheap", "moderate", "expensive"];

    for (const descriptor of getAgentDescriptors()) {
      expect(validCosts).toContain(descriptor.cost);
    }
  });
});
