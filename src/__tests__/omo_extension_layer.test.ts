/**
 * Unit tests for the OMO Extension Layer (Phase 0).
 *
 * Covers:
 *  - HookRegistry (hook_system.ts)
 *  - AgentRegistry (agent_registry.ts)
 *  - ConfigLoader (config_loader.ts)
 *  - SessionStateManager (session_state.ts)
 *  - ContextCollector (context_collector.ts)
 */
import fs from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// HookRegistry
// ---------------------------------------------------------------------------
import {
  type HookContext,
  HookRegistry,
  getGlobalHookRegistry,
  resetGlobalHookRegistry,
} from "@/agent/runtime/hook_system";

const dummyHookCtx: HookContext = {
  sessionId: "test-session",
  chatId: 1,
  agent: "Sisyphus",
  directory: "/tmp/test",
};

describe("HookRegistry", () => {
  let registry: HookRegistry;

  beforeEach(() => {
    registry = new HookRegistry();
  });

  it("registers and executes a hook", async () => {
    const handler = vi.fn(async () => {});
    registry.register("chat.message", "test-hook", handler);

    await registry.execute("chat.message", { text: "hi" }, {}, dummyHookCtx);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      { text: "hi" },
      {},
      dummyHookCtx,
    );
  });

  it("executes hooks in priority order", async () => {
    const order: string[] = [];

    registry.register(
      "event",
      "low-priority",
      async () => {
        order.push("low");
      },
      200,
    );
    registry.register(
      "event",
      "high-priority",
      async () => {
        order.push("high");
      },
      10,
    );
    registry.register(
      "event",
      "medium-priority",
      async () => {
        order.push("medium");
      },
      100,
    );

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(order).toEqual(["high", "medium", "low"]);
  });

  it("skips disabled hooks", async () => {
    const handler = vi.fn(async () => {});
    registry.register("event", "disabled-hook", handler);
    registry.disable("disabled-hook");

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(handler).not.toHaveBeenCalled();
  });

  it("re-enables hooks after disable", async () => {
    const handler = vi.fn(async () => {});
    registry.register("event", "toggle-hook", handler);
    registry.disable("toggle-hook");
    registry.enable("toggle-hook");

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(handler).toHaveBeenCalledOnce();
  });

  it("isolates errors — one failing hook doesn't block others", async () => {
    const order: string[] = [];

    registry.register(
      "event",
      "before",
      async () => {
        order.push("before");
      },
      10,
    );
    registry.register(
      "event",
      "failing",
      async () => {
        throw new Error("boom");
      },
      50,
    );
    registry.register(
      "event",
      "after",
      async () => {
        order.push("after");
      },
      100,
    );

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(order).toEqual(["before", "after"]);
  });

  it("supports abort to stop remaining hooks", async () => {
    const order: string[] = [];

    registry.register(
      "event",
      "first",
      async () => {
        order.push("first");
        return { abort: true };
      },
      10,
    );
    registry.register(
      "event",
      "second",
      async () => {
        order.push("second");
      },
      20,
    );

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(order).toEqual(["first"]);
  });

  it("unregisters hooks", async () => {
    const handler = vi.fn(async () => {});
    registry.register("event", "removable", handler);
    registry.unregister("event", "removable");

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(handler).not.toHaveBeenCalled();
  });

  it("unregisters all hooks by name", async () => {
    const handler = vi.fn(async () => {});
    registry.register("event", "multi", handler);
    registry.register("chat.message", "multi", handler);
    registry.unregisterAll("multi");

    expect(registry.listForPoint("event")).not.toContain("multi");
    expect(registry.listForPoint("chat.message")).not.toContain("multi");
  });

  it("replaces duplicate registrations on same point", async () => {
    const handler1 = vi.fn(async () => {});
    const handler2 = vi.fn(async () => {});
    registry.register("event", "same-name", handler1);
    registry.register("event", "same-name", handler2);

    await registry.execute("event", {}, {}, dummyHookCtx);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("bulk disables hooks", () => {
    registry.register("event", "h1", vi.fn(async () => {}));
    registry.register("event", "h2", vi.fn(async () => {}));
    registry.disableMultiple(["h1", "h2"]);

    expect(registry.isEnabled("h1")).toBe(false);
    expect(registry.isEnabled("h2")).toBe(false);
  });

  it("reports size correctly", () => {
    registry.register("event", "a", vi.fn(async () => {}));
    registry.register("chat.message", "b", vi.fn(async () => {}));
    expect(registry.size).toBe(2);
  });

  it("clears all hooks", () => {
    registry.register("event", "a", vi.fn(async () => {}));
    registry.clear();
    expect(registry.size).toBe(0);
  });

  describe("global singleton", () => {
    afterEach(() => {
      resetGlobalHookRegistry();
    });

    it("returns the same instance", () => {
      const a = getGlobalHookRegistry();
      const b = getGlobalHookRegistry();
      expect(a).toBe(b);
    });

    it("resets properly", () => {
      const a = getGlobalHookRegistry();
      a.register("event", "test", vi.fn(async () => {}));
      resetGlobalHookRegistry();
      const b = getGlobalHookRegistry();
      expect(b.size).toBe(0);
    });
  });
});

import { NATIVE_AGENTS } from "@/agent/runtime/agent_config";
// ---------------------------------------------------------------------------
// AgentRegistry
// ---------------------------------------------------------------------------
import {
  AgentRegistry,
  getGlobalAgentRegistry,
  resetGlobalAgentRegistry,
  seedNativeAgents,
} from "@/agent/runtime/agent_registry";

describe("AgentRegistry", () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it("registers and retrieves an agent", () => {
    registry.register(NATIVE_AGENTS[0], {
      name: "Sisyphus",
      description: "test",
      mode: "primary",
      native: true,
    });

    const agent = registry.get("Sisyphus");
    expect(agent).toBeDefined();
    expect(agent!.name).toBe("Sisyphus");
  });

  it("case-insensitive lookup", () => {
    registry.register(NATIVE_AGENTS[0], {
      name: "Sisyphus",
      description: "test",
      mode: "primary",
      native: true,
    });

    expect(registry.get("sisyphus")).toBeDefined();
    expect(registry.get("SISYPHUS")).toBeDefined();
  });

  it("seeds native agents", () => {
    seedNativeAgents(registry);
    expect(registry.size).toBe(NATIVE_AGENTS.length);
    expect(registry.get("Sisyphus")).toBeDefined();
    expect(registry.get("Hephaestus")).toBeDefined();
    expect(registry.get("Atlas")).toBeDefined();
  });

  it("returns default agent (Sisyphus)", () => {
    seedNativeAgents(registry);
    const defaultAgent = registry.getDefault();
    expect(defaultAgent.name).toBe("Sisyphus");
  });

  it("lists non-hidden primary agents", () => {
    seedNativeAgents(registry);
    const list = registry.list({ mode: "primary" });
    expect(list.length).toBe(NATIVE_AGENTS.length);
    expect(list.every((d) => d.native)).toBe(true);
  });

  it("applies config overrides to disable an agent", () => {
    seedNativeAgents(registry);
    registry.applyOverrides({
      Atlas: { disable: true },
    });

    expect(registry.get("Atlas")).toBeUndefined();
  });

  it("applies temperature override", () => {
    seedNativeAgents(registry);
    registry.applyOverrides({
      Sisyphus: { temperature: 0.5 },
    });

    const agent = registry.get("Sisyphus");
    expect(agent?.temperature).toBe(0.5);
  });

  it("has() checks existence", () => {
    seedNativeAgents(registry);
    expect(registry.has("Sisyphus")).toBe(true);
    expect(registry.has("NonExistent")).toBe(false);
  });

  it("resolves model from descriptor", () => {
    registry.register(NATIVE_AGENTS[0], {
      name: "Sisyphus",
      description: "test",
      mode: "primary",
      native: true,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    });

    const model = registry.resolveModel("Sisyphus");
    expect(model).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
    });
  });

  it("resolves model from override (takes priority)", () => {
    registry.register(NATIVE_AGENTS[0], {
      name: "Sisyphus",
      description: "test",
      mode: "primary",
      native: true,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    });
    registry.applyOverrides({
      Sisyphus: { model: "openai/gpt-5.2" },
    });

    const model = registry.resolveModel("Sisyphus");
    expect(model).toEqual({
      providerID: "openai",
      modelID: "gpt-5.2",
    });
  });

  it("parses model string without provider prefix", () => {
    registry.register(NATIVE_AGENTS[0], {
      name: "Sisyphus",
      description: "test",
      mode: "primary",
      native: true,
    });
    registry.applyOverrides({
      Sisyphus: { model: "claude-sonnet-4-6" },
    });

    const model = registry.resolveModel("Sisyphus");
    expect(model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4-6",
    });
  });

  it("registers and resolves factory agents", () => {
    registry.registerFactory("dynamic-agent", () => ({
      name: "Dynamic",
      description: "A dynamic agent",
      steps: 50,
      tools: ["read", "write"],
      mode: "subagent" as const,
      descriptor: {
        name: "Dynamic",
        description: "A dynamic agent",
        mode: "subagent" as const,
        native: false,
      },
    }));

    const agent = registry.get("dynamic-agent");
    expect(agent).toBeDefined();
    expect(agent!.name).toBe("Dynamic");
    expect(agent!.steps).toBe(50);
  });

  it("clears all registrations", () => {
    seedNativeAgents(registry);
    registry.clear();
    expect(registry.size).toBe(0);
  });

  describe("global singleton", () => {
    afterEach(() => {
      resetGlobalAgentRegistry();
    });

    it("returns the same instance", () => {
      const a = getGlobalAgentRegistry();
      const b = getGlobalAgentRegistry();
      expect(a).toBe(b);
    });
  });
});

// ---------------------------------------------------------------------------
// ConfigLoader
// ---------------------------------------------------------------------------
import {
  OhMyOpenCodeConfigSchema,
  getAgentOverride,
  getCategoryConfig,
  getConfigPath,
  invalidateConfigCache,
  isHookDisabled,
  loadOmoConfig,
} from "@/agent/runtime/config_loader";

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
  };
});

describe("ConfigLoader", () => {
  beforeEach(() => {
    invalidateConfigCache();
    vi.restoreAllMocks();
  });

  it("returns empty config when file does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const config = loadOmoConfig("/nonexistent/path.json");
    expect(config).toEqual({});
  });

  it("parses valid config", () => {
    const testConfig = {
      disabled_hooks: ["ralph-loop"],
      agents: {
        Sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
    };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(testConfig));

    const config = loadOmoConfig("/test/config.json");
    expect(config.disabled_hooks).toEqual(["ralph-loop"]);
    expect(config.agents?.Sisyphus?.model).toBe("anthropic/claude-opus-4-6");
  });

  it("returns empty config on invalid JSON", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("not json {{{}");

    const config = loadOmoConfig("/test/bad.json");
    expect(config).toEqual({});
  });

  it("caches config on repeated calls with same path", () => {
    const testConfig = { auto_update: true };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(testConfig));

    const config1 = loadOmoConfig("/test/config.json");
    const config2 = loadOmoConfig("/test/config.json");

    expect(config1).toBe(config2); // Same reference = cached
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it("invalidates cache", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));

    loadOmoConfig("/test/config.json");
    invalidateConfigCache();
    loadOmoConfig("/test/config.json");

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
  });

  it("getConfigPath returns default path", () => {
    const configPath = getConfigPath();
    expect(configPath).toContain("oh-my-opencode.json");
    expect(configPath).toContain(".config");
  });

  it("getAgentOverride returns agent config", () => {
    const config = {
      agents: {
        oracle: { model: "openai/gpt-5.2" },
      },
    };
    expect(getAgentOverride(config, "oracle")?.model).toBe("openai/gpt-5.2");
  });

  it("getAgentOverride returns undefined for missing agent", () => {
    expect(getAgentOverride({}, "nonexistent")).toBeUndefined();
  });

  it("getCategoryConfig returns category", () => {
    const config = {
      categories: {
        ultrabrain: { model: "openai/gpt-5.2", variant: "high" },
      },
    };
    expect(getCategoryConfig(config, "ultrabrain")?.model).toBe(
      "openai/gpt-5.2",
    );
  });

  it("isHookDisabled checks disabled hooks", () => {
    const config = { disabled_hooks: ["ralph-loop" as const] };
    expect(isHookDisabled(config, "ralph-loop")).toBe(true);
    expect(isHookDisabled(config, "rules-injector")).toBe(false);
  });

  describe("Zod schema validation", () => {
    it("validates a full config", () => {
      const result = OhMyOpenCodeConfigSchema.safeParse({
        disabled_hooks: ["ralph-loop", "rules-injector"],
        agents: {
          Sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" },
          oracle: { model: "openai/gpt-5.2", variant: "high" },
        },
        categories: {
          ultrabrain: { model: "openai/gpt-5.2" },
        },
        ralph_loop: { enabled: true, default_max_iterations: 50 },
        background_task: { defaultConcurrency: 3 },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid agent override color", () => {
      const result = OhMyOpenCodeConfigSchema.safeParse({
        agents: {
          Sisyphus: { color: "not-a-hex" },
        },
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// SessionStateManager
// ---------------------------------------------------------------------------
import {
  SessionStateManager,
  getGlobalSessionState,
  resetGlobalSessionState,
} from "@/agent/runtime/session_state";

describe("SessionStateManager", () => {
  let manager: SessionStateManager;

  beforeEach(() => {
    manager = new SessionStateManager();
  });

  it("sets and gets main session", () => {
    manager.setMainSession("ses-123");
    expect(manager.getMainSessionId()).toBe("ses-123");
  });

  it("clears main session", () => {
    manager.setMainSession("ses-123");
    manager.setMainSession(undefined);
    expect(manager.getMainSessionId()).toBeUndefined();
  });

  it("tracks session agent", () => {
    manager.setSessionAgent("ses-1", "Sisyphus");
    expect(manager.getSessionAgent("ses-1")).toBe("Sisyphus");
  });

  it("updates session agent", () => {
    manager.setSessionAgent("ses-1", "Sisyphus");
    manager.updateSessionAgent("ses-1", "Oracle");
    expect(manager.getSessionAgent("ses-1")).toBe("Oracle");
  });

  it("auto-creates session on update if not found", () => {
    manager.updateSessionAgent("new-ses", "Atlas");
    expect(manager.getSessionAgent("new-ses")).toBe("Atlas");
  });

  it("clears a session", () => {
    manager.setSessionAgent("ses-1", "Sisyphus");
    manager.clearSession("ses-1");
    expect(manager.hasSession("ses-1")).toBe(false);
  });

  it("creates subagent session", () => {
    manager.setMainSession("main");
    manager.createSubagentSession("sub-1", "main", "explore");
    expect(manager.getSessionAgent("sub-1")).toBe("explore");
    expect(manager.getParentSessionId("sub-1")).toBe("main");
  });

  it("manages session metadata", () => {
    manager.setMainSession("ses-1");
    manager.setMetadata("ses-1", "key1", { value: 42 });
    expect(manager.getMetadata("ses-1", "key1")).toEqual({ value: 42 });

    manager.deleteMetadata("ses-1", "key1");
    expect(manager.getMetadata("ses-1", "key1")).toBeUndefined();
  });

  it("lists sessions", () => {
    manager.setMainSession("a");
    manager.setSessionAgent("b", "Atlas");
    expect(manager.listSessions().sort()).toEqual(["a", "b"]);
  });

  it("reports size", () => {
    manager.setMainSession("a");
    manager.setSessionAgent("b", "Atlas");
    expect(manager.size).toBe(2);
  });

  it("prunes stale sessions (preserves main)", () => {
    manager.setMainSession("main");
    manager.setSessionAgent("old", "Atlas");

    // Manually age the "old" session
    const info = manager.getSessionInfo("old");
    if (info) info.createdAt = Date.now() - 10_000;

    const pruned = manager.pruneStale(5_000);
    expect(pruned).toBe(1);
    expect(manager.hasSession("old")).toBe(false);
    expect(manager.hasSession("main")).toBe(true);
  });

  it("clears all", () => {
    manager.setMainSession("a");
    manager.setSessionAgent("b", "Atlas");
    manager.clear();
    expect(manager.size).toBe(0);
    expect(manager.getMainSessionId()).toBeUndefined();
  });

  describe("global singleton", () => {
    afterEach(() => {
      resetGlobalSessionState();
    });

    it("returns the same instance", () => {
      const a = getGlobalSessionState();
      const b = getGlobalSessionState();
      expect(a).toBe(b);
    });
  });
});

// ---------------------------------------------------------------------------
// ContextCollector
// ---------------------------------------------------------------------------
import {
  ContextCollector,
  getGlobalContextCollector,
  resetGlobalContextCollector,
} from "@/agent/runtime/context_collector";

describe("ContextCollector", () => {
  let collector: ContextCollector;

  beforeEach(() => {
    collector = new ContextCollector();
  });

  it("adds and retrieves context", () => {
    collector.addContext("rules", "Follow CLAUDE.md rules", { priority: 10 });
    expect(collector.size).toBe(1);
    expect(collector.getContext("rules")?.content).toBe(
      "Follow CLAUDE.md rules",
    );
  });

  it("skips empty content", () => {
    collector.addContext("empty", "  ");
    expect(collector.size).toBe(0);
  });

  it("deduplicates by key (replaces)", () => {
    collector.addContext("key", "first");
    collector.addContext("key", "second");
    expect(collector.size).toBe(1);
    expect(collector.getContext("key")?.content).toBe("second");
  });

  it("sorts by priority", () => {
    collector.addContext("low", "low", { priority: 200 });
    collector.addContext("high", "high", { priority: 10 });
    collector.addContext("mid", "mid", { priority: 100 });

    const strings = collector.getContentStrings();
    expect(strings).toEqual(["high", "mid", "low"]);
  });

  it("toPromptString joins with double newlines", () => {
    collector.addContext("a", "first", { priority: 1 });
    collector.addContext("b", "second", { priority: 2 });

    expect(collector.toPromptString()).toBe("first\n\nsecond");
  });

  it("returns empty string when no injections", () => {
    expect(collector.toPromptString()).toBe("");
  });

  it("toFormattedBlock wraps in XML tags", () => {
    collector.addContext("rules", "rule content", {
      source: "rules-injector",
    });

    const block = collector.toFormattedBlock();
    expect(block).toContain("<rules-injector>");
    expect(block).toContain("rule content");
    expect(block).toContain("</rules-injector>");
  });

  it("removes context by key", () => {
    collector.addContext("key", "content");
    collector.removeContext("key");
    expect(collector.size).toBe(0);
  });

  it("hasContext check", () => {
    collector.addContext("key", "content");
    expect(collector.hasContext("key")).toBe(true);
    expect(collector.hasContext("other")).toBe(false);
  });

  it("prunes stale injections", () => {
    collector.addContext("old", "old content");
    // Manually age the injection
    const injection = collector.getContext("old");
    if (injection) injection.addedAt = Date.now() - 10_000;

    const pruned = collector.pruneStale(5_000);
    expect(pruned).toBe(1);
    expect(collector.size).toBe(0);
  });

  it("clears all", () => {
    collector.addContext("a", "a");
    collector.addContext("b", "b");
    collector.clear();
    expect(collector.size).toBe(0);
  });

  describe("global singleton", () => {
    afterEach(() => {
      resetGlobalContextCollector();
    });

    it("returns the same instance", () => {
      const a = getGlobalContextCollector();
      const b = getGlobalContextCollector();
      expect(a).toBe(b);
    });
  });
});
