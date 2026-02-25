import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BackgroundManager } from "@/agent/runtime/background_manager";
import { CommandRegistry } from "@/agent/runtime/commands/command_registry";
import {
  ConcurrencyManager,
  type ConcurrencyConfig,
} from "@/agent/runtime/concurrency_manager";
import { ContextCollector } from "@/agent/runtime/context_collector";
import { TaskToastManager } from "@/agent/runtime/features/task_toast_manager";
import { HookRegistry, type HookContext } from "@/agent/runtime/hook_system";
import { loadMcpServerConfigs } from "@/agent/runtime/mcp/mcp_config_loader";
import { SessionStateManager } from "@/agent/runtime/session_state";
import { SkillLoader } from "@/agent/runtime/skills/skill_loader";
import {
  getAgentDefinition,
  getAgentDescriptors,
  getAllAgentDefinitions,
} from "@/agent/runtime/agents/register_all";

const runtimeControl = vi.hoisted(() => {
  type RuntimePlan = {
    loop: () => Promise<"completed" | "aborted" | "max-steps">;
    responseText: string;
  };

  return {
    queue: [] as RuntimePlan[],
    abortCalls: [] as number[],
    reset() {
      this.queue = [];
      this.abortCalls = [];
    },
    enqueue(plan: RuntimePlan) {
      this.queue.push(plan);
    },
  };
});

vi.mock("electron-log", () => {
  const scoped = {
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  return {
    default: {
      scope: vi.fn(() => scoped),
    },
  };
});

vi.mock("@/agent/runtime/agent_runtime", () => {
  return {
    AgentRuntime: class {
      private plan =
        runtimeControl.queue.shift() ??
        ({
          loop: async () => "completed",
          responseText: "default-response",
        } as const);

      async loop(): Promise<"completed" | "aborted" | "max-steps"> {
        return this.plan.loop();
      }

      getAccumulatedResponseText(): string {
        return this.plan.responseText;
      }

      abort(): void {
        runtimeControl.abortCalls.push(Date.now());
      }
    },
  };
});

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

function removeDirSafe(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function createHookCtx(): HookContext {
  return {
    sessionId: "session-1",
    chatId: 1,
    agent: "sisyphus",
    directory: "/tmp/project",
    runId: "run-1",
  };
}

function createParentRunContext() {
  return {
    runId: "run-root",
    rootChatId: 100,
    chatId: 100,
    agentName: "sisyphus",
    agentKind: "primary" as const,
    isSubAgent: false,
  };
}

describe("ConcurrencyManager", () => {
  it("creates with default config", () => {
    const manager = new ConcurrencyManager({});

    expect(manager.getLimit("anthropic")).toBe(3);
    expect(manager.getLimit("openai")).toBe(5);
    expect(manager.getLimit("unknown")).toBe(8);
  });

  it("creates with custom config", () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 2,
      providerConcurrency: { openai: 1 },
    });

    expect(manager.getLimit("openai")).toBe(1);
    expect(manager.getLimit("anthropic")).toBe(2);
    expect(manager.getLimit("other")).toBe(2);
  });

  it("acquire resolves and release method is available", async () => {
    const manager = new ConcurrencyManager({ defaultConcurrency: 2 });

    const result = await manager.acquire("openai");
    expect(result).toBeUndefined();
    expect(typeof manager.release).toBe("function");
  });

  it("acquire resolves immediately when under limit", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 3,
      providerConcurrency: { openai: 2 },
    });

    await expect(manager.acquire("openai")).resolves.toBeUndefined();
    expect(manager.getStatus().active.openai).toBe(1);
  });

  it("acquire queues when at limit", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 1,
      providerConcurrency: { openai: 1 },
    });

    await manager.acquire("openai");
    const second = manager.acquire("openai");
    expect(manager.getStatus().queued).toBe(1);

    manager.release("openai");
    await expect(second).resolves.toBeUndefined();
  });

  it("release allows next queued acquire", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 1,
      providerConcurrency: { openai: 1 },
    });

    await manager.acquire("openai");
    const second = manager.acquire("openai");
    const third = manager.acquire("openai");

    manager.release("openai");
    await second;
    expect(manager.getStatus().queued).toBe(1);

    manager.release("openai");
    await third;
    expect(manager.getStatus().queued).toBe(0);
  });

  it("respects per-provider concurrency limits", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 4,
      providerConcurrency: { openai: 1, anthropic: 2 },
    });

    await manager.acquire("openai");
    await manager.acquire("anthropic");
    await manager.acquire("anthropic");
    const queued = manager.acquire("openai");

    expect(manager.getStatus().active.openai).toBe(1);
    expect(manager.getStatus().active.anthropic).toBe(2);
    expect(manager.getStatus().queued).toBe(1);

    manager.release("openai");
    await queued;
  });

  it("destroy clears all queues and active state", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 1,
      providerConcurrency: { openai: 1 },
    });

    await manager.acquire("openai");
    void manager.acquire("openai");
    expect(manager.getStatus().queued).toBe(1);

    manager.destroy();
    expect(manager.getStatus().queued).toBe(0);
    expect(manager.getStatus().active.__total__).toBe(0);
  });

  it("uses default concurrency for unknown providers", async () => {
    const manager = new ConcurrencyManager({ defaultConcurrency: 2 });

    await manager.acquire("custom");
    await manager.acquire("custom");
    const queued = manager.acquire("custom");

    expect(manager.getStatus().active.custom).toBe(2);
    expect(manager.getStatus().queued).toBe(1);

    manager.release("custom");
    await queued;
  });

  it("supports multiple sequential acquire/release cycles", async () => {
    const manager = new ConcurrencyManager({
      defaultConcurrency: 1,
      providerConcurrency: { anthropic: 1 },
    });

    for (let i = 0; i < 5; i++) {
      await manager.acquire("anthropic");
      expect(manager.getStatus().active.anthropic).toBe(1);
      manager.release("anthropic");
      expect(manager.getStatus().active.anthropic).toBeUndefined();
    }
  });
});

describe("BackgroundManager", () => {
  beforeEach(() => {
    runtimeControl.reset();
  });

  it("creates successfully", () => {
    const manager = new BackgroundManager({ defaultConcurrency: 2 });

    expect(manager.getAllTasks()).toEqual([]);
    manager.destroy();
  });

  it("spawnAgent creates a task and tracks it", async () => {
    runtimeControl.enqueue({
      loop: async () => "completed",
      responseText: "done",
    });

    const manager = new BackgroundManager({ defaultConcurrency: 2 });
    const taskId = await manager.spawnAgent({
      agentName: "explore",
      prompt: "test",
      description: "desc",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    expect(taskId).toMatch(/^[0-9a-f-]+$/);
    expect(manager.getAllTasks()).toHaveLength(1);
    manager.destroy();
  });

  it("getTaskStatus returns task by ID", async () => {
    runtimeControl.enqueue({
      loop: async () => "completed",
      responseText: "x",
    });
    const manager = new BackgroundManager({ defaultConcurrency: 1 });

    const taskId = await manager.spawnAgent({
      agentName: "oracle",
      prompt: "p",
      description: "d",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    expect(manager.getTaskStatus(taskId)).toBeDefined();
    manager.destroy();
  });

  it("getAllTasks returns all tasks", async () => {
    runtimeControl.enqueue({
      loop: async () => "completed",
      responseText: "1",
    });
    runtimeControl.enqueue({
      loop: async () => "completed",
      responseText: "2",
    });
    const manager = new BackgroundManager({ defaultConcurrency: 2 });

    await manager.spawnAgent({
      agentName: "explore",
      prompt: "1",
      description: "a",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    await manager.spawnAgent({
      agentName: "librarian",
      prompt: "2",
      description: "b",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    expect(manager.getAllTasks()).toHaveLength(2);
    manager.destroy();
  });

  it("cancelTask marks task as cancelled", async () => {
    runtimeControl.enqueue({
      loop: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return "completed";
      },
      responseText: "later",
    });

    const manager = new BackgroundManager({ defaultConcurrency: 2 });
    const taskId = await manager.spawnAgent({
      agentName: "explore",
      prompt: "x",
      description: "x",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    manager.cancelTask(taskId);
    expect(manager.getTaskStatus(taskId)).toBe("cancelled");
    manager.destroy();
  });

  it("destroy cancels all tasks and clears map", async () => {
    runtimeControl.enqueue({
      loop: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return "completed";
      },
      responseText: "a",
    });
    runtimeControl.enqueue({
      loop: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return "completed";
      },
      responseText: "b",
    });

    const manager = new BackgroundManager({ defaultConcurrency: 2 });

    await manager.spawnAgent({
      agentName: "a",
      prompt: "1",
      description: "1",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });
    await manager.spawnAgent({
      agentName: "b",
      prompt: "2",
      description: "2",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    manager.destroy();
    expect(manager.getAllTasks()).toHaveLength(0);
  });

  it("task status transitions pending to running to completed", async () => {
    let releaseLoop: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      releaseLoop = resolve;
    });

    runtimeControl.enqueue({
      loop: async () => {
        await waiting;
        return "completed";
      },
      responseText: "ok",
    });

    const manager = new BackgroundManager({ defaultConcurrency: 1 });
    const taskId = await manager.spawnAgent({
      agentName: "explore",
      prompt: "x",
      description: "x",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: true,
    });

    await Promise.resolve();
    expect(["pending", "running"]).toContain(manager.getTaskStatus(taskId));

    releaseLoop?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(manager.getTaskStatus(taskId)).toBe("completed");
    manager.destroy();
  });

  it("getTaskOutput returns undefined for non-existent task", () => {
    const manager = new BackgroundManager({ defaultConcurrency: 1 });

    expect(manager.getTaskOutput("missing-task")).toBeUndefined();
    manager.destroy();
  });

  it("runInBackground false waits for completion", async () => {
    runtimeControl.enqueue({
      loop: async () => "completed",
      responseText: "sync",
    });

    const manager = new BackgroundManager({ defaultConcurrency: 1 });
    const taskId = await manager.spawnAgent({
      agentName: "explore",
      prompt: "p",
      description: "d",
      parentRunContext: createParentRunContext(),
      parentAbort: new AbortController().signal,
      runtimeFactory: () => ({}) as never,
      runInBackground: false,
    });

    expect(manager.getTaskStatus(taskId)).toBe("completed");
    manager.destroy();
  });

  it("cancelTask on missing ID is a no-op", () => {
    const manager = new BackgroundManager({ defaultConcurrency: 1 });

    expect(() => manager.cancelTask("unknown")).not.toThrow();
    manager.destroy();
  });
});

describe("SkillLoader", () => {
  let tempProject: string;
  let tempHome: string;

  beforeEach(() => {
    tempProject = createTempDir("skills-project");
    tempHome = createTempDir("skills-home");
    vi.spyOn(os, "homedir").mockReturnValue(tempHome);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDirSafe(tempProject);
    removeDirSafe(tempHome);
  });

  it("creates with project dir", () => {
    const loader = new SkillLoader(tempProject);
    expect(loader).toBeInstanceOf(SkillLoader);
  });

  it("list returns empty array before discover", () => {
    const loader = new SkillLoader(tempProject);
    expect(loader.list()).toEqual([]);
  });

  it("discover handles non-existent directories gracefully", async () => {
    const loader = new SkillLoader(path.join(tempProject, "does-not-exist"));

    await expect(loader.discover()).resolves.toBeUndefined();
    expect(loader.list().length).toBeGreaterThanOrEqual(4);
  });

  it("get returns undefined for unknown skill", () => {
    const loader = new SkillLoader(tempProject);

    expect(loader.get("missing-skill")).toBeUndefined();
  });

  it("discovers project file-based skills", async () => {
    const skillsDir = path.join(tempProject, ".claude", "skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, "reviewer.md"), "Review content");

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    const skill = loader.get("reviewer");
    expect(skill?.name).toBe("reviewer");
    expect(skill?.content).toBe("Review content");
    expect(skill?.scope).toBe("project");
  });

  it("discovers directory skills with index.md", async () => {
    const dirSkill = path.join(tempProject, ".claude", "skills", "planner");
    fs.mkdirSync(dirSkill, { recursive: true });
    fs.writeFileSync(path.join(dirSkill, "index.md"), "Plan content");

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    const skill = loader.get("planner");
    expect(skill?.name).toBe("planner");
    expect(skill?.content).toBe("Plan content");
  });

  it("loads mcp.json for directory skill", async () => {
    const dirSkill = path.join(tempProject, ".claude", "skills", "browser");
    fs.mkdirSync(dirSkill, { recursive: true });
    fs.writeFileSync(path.join(dirSkill, "index.md"), "Browser content");
    fs.writeFileSync(
      path.join(dirSkill, "mcp.json"),
      JSON.stringify({ name: "playwright", command: "npx", args: ["-y"] }),
    );

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    expect(loader.get("browser")?.mcp?.name).toBe("playwright");
  });

  it("handles invalid mcp.json gracefully", async () => {
    const dirSkill = path.join(tempProject, ".claude", "skills", "invalid-mcp");
    fs.mkdirSync(dirSkill, { recursive: true });
    fs.writeFileSync(path.join(dirSkill, "index.md"), "Invalid MCP skill");
    fs.writeFileSync(path.join(dirSkill, "mcp.json"), "{ invalid json");

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    expect(loader.get("invalid-mcp")?.mcp).toBeUndefined();
  });

  it("parses frontmatter metadata description", async () => {
    const skillsDir = path.join(tempProject, ".claude", "skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, "annotator.md"),
      "---\ndescription: Smart annotation\n---\nBody",
    );

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    expect(loader.get("annotator")?.description).toBe("Smart annotation");
  });

  it("project skill overrides user skill with same name", async () => {
    const userDir = path.join(tempHome, ".claude", "skills");
    const projectDir = path.join(tempProject, ".claude", "skills");
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(userDir, "dupe.md"), "user content");
    fs.writeFileSync(path.join(projectDir, "dupe.md"), "project content");

    const loader = new SkillLoader(tempProject);
    await loader.discover();

    expect(loader.get("dupe")?.content).toBe("project content");
  });
});

describe("CommandRegistry", () => {
  let tempProject: string;
  let tempHome: string;

  beforeEach(() => {
    tempProject = createTempDir("commands-project");
    tempHome = createTempDir("commands-home");
    vi.spyOn(os, "homedir").mockReturnValue(tempHome);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDirSafe(tempProject);
    removeDirSafe(tempHome);
  });

  it("creates successfully", () => {
    const registry = new CommandRegistry();
    expect(registry).toBeInstanceOf(CommandRegistry);
  });

  it("list returns empty array initially", () => {
    const registry = new CommandRegistry();
    expect(registry.list()).toEqual([]);
  });

  it("discover handles non-existent directories", async () => {
    const registry = new CommandRegistry();

    await expect(
      registry.discover(path.join(tempProject, "missing")),
    ).resolves.toBeUndefined();
    expect(registry.list().length).toBeGreaterThan(0);
  });

  it("get returns undefined for unknown command", () => {
    const registry = new CommandRegistry();
    expect(registry.get("missing")).toBeUndefined();
  });

  it("discover registers built-in commands", async () => {
    const registry = new CommandRegistry();
    await registry.discover(tempProject);

    expect(registry.get("sisyphus")).toBeDefined();
  });

  it("parseCommand parses command with args", () => {
    const registry = new CommandRegistry();

    expect(registry.parseCommand("/plan create roadmap")).toEqual({
      command: "plan",
      args: "create roadmap",
    });
  });

  it("parseCommand parses command without args", () => {
    const registry = new CommandRegistry();

    expect(registry.parseCommand("/review")).toEqual({
      command: "review",
      args: "",
    });
  });

  it("parseCommand returns null for plain input", () => {
    const registry = new CommandRegistry();

    expect(registry.parseCommand("hello")).toBeNull();
  });

  it("execute returns unknown command message", async () => {
    const registry = new CommandRegistry();

    const result = await registry.execute("unknown", "", {
      chatId: 1,
      sessionId: 1,
      appPath: "/tmp",
    });

    expect(result).toContain("Unknown command");
  });

  it("loads project markdown command and executes template", async () => {
    const cmdDir = path.join(tempProject, ".claude", "commands");
    fs.mkdirSync(cmdDir, { recursive: true });
    fs.writeFileSync(path.join(cmdDir, "hello.md"), "Custom hello template");

    const registry = new CommandRegistry();
    await registry.discover(tempProject);

    const result = await registry.execute("hello", "", {
      chatId: 1,
      sessionId: 1,
      appPath: "/tmp",
    });

    expect(result).toBe("Custom hello template");
  });
});

describe("HookRegistry", () => {
  it("creates successfully", () => {
    const registry = new HookRegistry();

    expect(registry.size).toBe(0);
  });

  it("register adds a hook", () => {
    const registry = new HookRegistry();

    registry.register("event", "hook-a", async () => {});
    expect(registry.listForPoint("event")).toEqual(["hook-a"]);
  });

  it("execute calls registered hooks", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn(async () => {});

    registry.register("event", "hook-a", handler);
    await registry.execute("event", { a: 1 }, {}, createHookCtx());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("execute passes correct arguments", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn(async () => {});
    const input = { hello: "world" };
    const output = { x: 1 };
    const ctx = createHookCtx();

    registry.register("event", "hook-a", handler);
    await registry.execute("event", input, output, ctx);

    expect(handler).toHaveBeenCalledWith(input, output, ctx);
  });

  it("multiple hooks on same event all fire", async () => {
    const registry = new HookRegistry();
    const a = vi.fn(async () => {});
    const b = vi.fn(async () => {});

    registry.register("event", "a", a);
    registry.register("event", "b", b);
    await registry.execute("event", {}, {}, createHookCtx());

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("unregister removes a hook", () => {
    const registry = new HookRegistry();

    registry.register("event", "a", async () => {});
    registry.unregister("event", "a");

    expect(registry.listForPoint("event")).toEqual([]);
  });

  it("after unregister hook no longer fires", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn(async () => {});

    registry.register("event", "a", handler);
    registry.unregister("event", "a");
    await registry.execute("event", {}, {}, createHookCtx());

    expect(handler).not.toHaveBeenCalled();
  });

  it("execute handles hook errors gracefully", async () => {
    const registry = new HookRegistry();
    const after = vi.fn(async () => {});

    registry.register("event", "fail", async () => {
      throw new Error("boom");
    });
    registry.register("event", "after", after);

    await expect(
      registry.execute("event", {}, {}, createHookCtx()),
    ).resolves.toBeUndefined();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("register supports scope parameter", () => {
    const registry = new HookRegistry();

    registry.register("event", "run-hook", async () => {}, 100, "run");
    expect(registry.getEntries("event")[0]?.scope).toBe("run");
  });

  it("register sorts hooks by priority", async () => {
    const registry = new HookRegistry();
    const seen: string[] = [];

    registry.register(
      "event",
      "low",
      async () => {
        seen.push("low");
      },
      200,
    );
    registry.register(
      "event",
      "high",
      async () => {
        seen.push("high");
      },
      10,
    );

    await registry.execute("event", {}, {}, createHookCtx());
    expect(seen).toEqual(["high", "low"]);
  });

  it("disable prevents hook execution", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn(async () => {});

    registry.register("event", "a", handler);
    registry.disable("a");
    await registry.execute("event", {}, {}, createHookCtx());

    expect(handler).not.toHaveBeenCalled();
  });

  it("enable restores hook execution", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn(async () => {});

    registry.register("event", "a", handler);
    registry.disable("a");
    registry.enable("a");
    await registry.execute("event", {}, {}, createHookCtx());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("unregisterAll removes matching names across points", () => {
    const registry = new HookRegistry();

    registry.register("event", "same", async () => {});
    registry.register("chat.message", "same", async () => {});
    registry.unregisterAll("same");

    expect(registry.listForPoint("event")).toEqual([]);
    expect(registry.listForPoint("chat.message")).toEqual([]);
  });

  it("execute respects abort signal from hook result", async () => {
    const registry = new HookRegistry();
    const second = vi.fn(async () => {});

    registry.register("event", "first", async () => ({ abort: true }), 1);
    registry.register("event", "second", second, 2);

    await registry.execute("event", {}, {}, createHookCtx());
    expect(second).not.toHaveBeenCalled();
  });

  it("clear removes all hooks and disabled flags", () => {
    const registry = new HookRegistry();

    registry.register("event", "a", async () => {});
    registry.disable("a");
    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.isEnabled("a")).toBe(true);
  });
});

describe("SessionStateManager", () => {
  it("creates successfully", () => {
    const manager = new SessionStateManager();

    expect(manager).toBeInstanceOf(SessionStateManager);
  });

  it("setState and getState work for session scope", () => {
    const manager = new SessionStateManager();

    manager.setState("key", "value", "session", "session-1");
    expect(manager.getState("key", "session", "session-1")).toBe("value");
  });

  it("setState and getState work for run scope", () => {
    const manager = new SessionStateManager();

    manager.setState("step", 2, "run", "run-1");
    expect(manager.getState("step", "run", "run-1")).toBe(2);
  });

  it("setState and getState work for global scope", () => {
    const manager = new SessionStateManager();

    manager.setState("theme", "dark", "global");
    expect(manager.getState("theme", "global")).toBe("dark");
  });

  it("getState returns undefined for non-existent key", () => {
    const manager = new SessionStateManager();

    expect(manager.getState("missing", "global")).toBeUndefined();
  });

  it("clearSession removes values for a session scope", () => {
    const manager = new SessionStateManager();

    manager.setState("a", 1, "session", "s1");
    manager.clearSession("s1");
    expect(manager.getState("a", "session", "s1")).toBeUndefined();
  });

  it("clearRunStore removes values for a run scope", () => {
    const manager = new SessionStateManager();

    manager.setState("a", 1, "run", "r1");
    manager.clearRunStore("r1");
    expect(manager.getState("a", "run", "r1")).toBeUndefined();
  });

  it("different scopes are isolated", () => {
    const manager = new SessionStateManager();

    manager.setState("k", "global", "global");
    manager.setState("k", "session", "session", "s1");
    manager.setState("k", "run", "run", "r1");

    expect(manager.getState("k", "global")).toBe("global");
    expect(manager.getState("k", "session", "s1")).toBe("session");
    expect(manager.getState("k", "run", "r1")).toBe("run");
  });

  it("throws when session/run scopeId is missing", () => {
    const manager = new SessionStateManager();

    expect(() => manager.setState("k", 1, "session")).toThrow();
    expect(() => manager.setState("k", 1, "run")).toThrow();
  });

  it("clear resets all scopes", () => {
    const manager = new SessionStateManager();

    manager.setState("g", 1, "global");
    manager.setState("s", 2, "session", "s1");
    manager.setState("r", 3, "run", "r1");
    manager.clear();

    expect(manager.getState("g", "global")).toBeUndefined();
    expect(manager.getState("s", "session", "s1")).toBeUndefined();
    expect(manager.getState("r", "run", "r1")).toBeUndefined();
  });
});

describe("ContextCollector", () => {
  it("creates successfully", () => {
    const collector = new ContextCollector();

    expect(collector).toBeInstanceOf(ContextCollector);
  });

  it("addContext stores context", () => {
    const collector = new ContextCollector();

    collector.addContext("rules", "Follow project rules");
    expect(collector.getContext("rules")?.content).toBe("Follow project rules");
  });

  it("getInjections returns all added contexts", () => {
    const collector = new ContextCollector();

    collector.addContext("a", "A");
    collector.addContext("b", "B");

    expect(collector.getInjections()).toHaveLength(2);
  });

  it("clear removes all contexts", () => {
    const collector = new ContextCollector();

    collector.addContext("a", "A");
    collector.clear();

    expect(collector.getInjections()).toEqual([]);
  });

  it("addContext replaces same key", () => {
    const collector = new ContextCollector();

    collector.addContext("dup", "first");
    collector.addContext("dup", "second");

    expect(collector.getContext("dup")?.content).toBe("second");
    expect(collector.size).toBe(1);
  });
});

describe("McpConfigLoader", () => {
  let tempProject: string;
  let tempHome: string;

  beforeEach(() => {
    tempProject = createTempDir("mcp-project");
    tempHome = createTempDir("mcp-home");
    vi.spyOn(os, "homedir").mockReturnValue(tempHome);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDirSafe(tempProject);
    removeDirSafe(tempHome);
  });

  it("returns empty array for non-existent project dir", () => {
    const result = loadMcpServerConfigs(path.join(tempProject, "missing"));

    expect(result).toEqual([]);
  });

  it("handles missing config files gracefully", () => {
    const result = loadMcpServerConfigs(tempProject);

    expect(result).toEqual([]);
  });

  it("loads project mcp configs from .opencode/mcp.json", () => {
    const mcpDir = path.join(tempProject, ".opencode");
    fs.mkdirSync(mcpDir, { recursive: true });
    fs.writeFileSync(
      path.join(mcpDir, "mcp.json"),
      JSON.stringify({
        mcp: {
          servers: {
            alpha: { command: "node", args: ["server.js"] },
          },
        },
      }),
    );

    const result = loadMcpServerConfigs(tempProject);
    expect(result).toEqual([
      {
        name: "alpha",
        command: "node",
        args: ["server.js"],
        env: undefined,
        cwd: undefined,
      },
    ]);
  });

  it("deduplicates by server name across files", () => {
    const userDir = path.join(tempHome, ".config", "opencode");
    const projectDir = path.join(tempProject, ".opencode");
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(
      path.join(userDir, "opencode.json"),
      JSON.stringify({
        mcpServers: {
          same: { command: "user-cmd", args: [] },
        },
      }),
    );

    fs.writeFileSync(
      path.join(projectDir, "mcp.json"),
      JSON.stringify({
        mcpServers: {
          same: { command: "project-cmd", args: [] },
        },
      }),
    );

    const result = loadMcpServerConfigs(tempProject);
    expect(result[0]?.command).toBe("user-cmd");
  });

  it("skips invalid server entries and normalizes env", () => {
    const projectDir = path.join(tempProject, ".opencode");
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, "mcp.json"),
      JSON.stringify({
        servers: {
          valid: { command: "node", args: [1], env: { A: 1 } },
          invalid: { args: [] },
        },
      }),
    );

    const result = loadMcpServerConfigs(tempProject);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "valid",
      command: "node",
      args: ["1"],
      env: { A: "1" },
      cwd: undefined,
    });
  });
});

describe("AgentDefinitions", () => {
  it("getAllAgentDefinitions returns 11 agents", () => {
    expect(getAllAgentDefinitions()).toHaveLength(11);
  });

  it("each agent has required fields", () => {
    for (const agent of getAllAgentDefinitions()) {
      expect(typeof agent.name).toBe("string");
      expect(typeof agent.description).toBe("string");
      expect(typeof agent.mode).toBe("string");
      expect(typeof agent.model.modelId).toBe("string");
    }
  });

  it("contains known agents", () => {
    const names = new Set(getAllAgentDefinitions().map((agent) => agent.name));

    expect(names.has("sisyphus")).toBe(true);
    expect(names.has("oracle")).toBe(true);
    expect(names.has("librarian")).toBe(true);
    expect(names.has("explore")).toBe(true);
  });

  it("getAgentDefinition returns specific agent", () => {
    const oracle = getAgentDefinition("oracle");

    expect(oracle?.name).toBe("oracle");
    expect(oracle?.model.modelId).toContain("opus");
  });

  it("getAgentDescriptors returns lightweight descriptors", () => {
    const descriptors = getAgentDescriptors();

    expect(descriptors).toHaveLength(11);
    expect(descriptors[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        description: expect.any(String),
      }),
    );
  });
});

describe("TaskToastManager", () => {
  it("creates successfully", () => {
    const manager = new TaskToastManager();

    expect(manager).toBeInstanceOf(TaskToastManager);
  });

  it("onTaskComplete stores notification", () => {
    const manager = new TaskToastManager();

    manager.onTaskComplete({
      taskId: "1",
      agentName: "explore",
      description: "done",
      status: "completed",
    });

    expect(manager.getRecent()).toHaveLength(1);
    expect(manager.getRecent()[0]?.status).toBe("completed");
  });

  it("onTaskError stores notification", () => {
    const manager = new TaskToastManager();

    manager.onTaskError({
      taskId: "2",
      agentName: "oracle",
      description: "failed",
      status: "error",
      error: "boom",
    });

    expect(manager.getRecent()).toHaveLength(1);
    expect(manager.getRecent()[0]?.error).toBe("boom");
  });

  it("getRecent returns latest notifications", () => {
    const manager = new TaskToastManager();

    for (let i = 0; i < 12; i++) {
      manager.onTaskComplete({
        taskId: String(i),
        agentName: "explore",
        description: `task-${i}`,
        status: "completed",
      });
    }

    const recent = manager.getRecent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0]?.taskId).toBe("9");
    expect(recent[2]?.taskId).toBe("11");
  });

  it("clear removes all notifications", () => {
    const manager = new TaskToastManager();

    manager.onTaskComplete({
      taskId: "1",
      agentName: "explore",
      description: "done",
      status: "completed",
    });
    manager.clear();

    expect(manager.getRecent()).toEqual([]);
  });
});

describe("BoulderState", () => {
  async function importBoulderWithDb(mockDb: {
    selectImpl?: () => { from: () => { where: () => Promise<unknown[]> } };
    deleteImpl?: () => { where: () => Promise<void> };
  }) {
    vi.resetModules();

    vi.doMock("drizzle-orm", () => ({
      eq: vi.fn(() => "where-clause"),
    }));

    vi.doMock("@/db", () => ({
      db: {
        select:
          mockDb.selectImpl ??
          (() => ({
            from: () => ({ where: async () => [] }),
          })),
        delete:
          mockDb.deleteImpl ??
          (() => ({
            where: async () => undefined,
          })),
      },
    }));

    vi.doMock("@/db/schema", () => ({
      todoItems: {
        chatId: "chatId",
      },
    }));

    return import("@/agent/runtime/features/boulder_state");
  }

  it("creates without errors", async () => {
    const { BoulderState } = await importBoulderWithDb({});

    expect(new BoulderState()).toBeInstanceOf(BoulderState);
  });

  it("save resolves without throwing", async () => {
    const { BoulderState } = await importBoulderWithDb({});
    const state = new BoulderState();

    await expect(
      state.save(1, "run-1", {
        totalTodos: 4,
        completedTodos: 1,
        pendingTodos: 3,
        isActive: true,
        startedAt: new Date().toISOString(),
      }),
    ).resolves.toBeUndefined();
  });

  it("load returns null gracefully when db throws", async () => {
    const { BoulderState } = await importBoulderWithDb({
      selectImpl: () => {
        throw new Error("db unavailable");
      },
    });

    const state = new BoulderState();
    await expect(state.load(1)).resolves.toBeNull();
  });

  it("load returns null when no todos found", async () => {
    const { BoulderState } = await importBoulderWithDb({
      selectImpl: () => ({
        from: () => ({ where: async () => [] }),
      }),
    });

    const state = new BoulderState();
    await expect(state.load(2)).resolves.toBeNull();
  });

  it("clear handles errors gracefully", async () => {
    const { BoulderState } = await importBoulderWithDb({
      deleteImpl: () => {
        throw new Error("delete failed");
      },
    });

    const state = new BoulderState();
    await expect(state.clear(1)).resolves.toBeUndefined();
  });
});

describe("McpJsonRpcClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  class FakeProcess extends EventEmitter {
    stdout = new PassThrough();
    stderr = new PassThrough();
    stdin = {
      writable: true,
      write: vi.fn(),
    };
  }

  function jsonRpcFrame(payload: unknown): string {
    const body = JSON.stringify(payload);
    return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  }

  it("sends request with content-length framing", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const pending = client.request("ping");
    expect(proc.stdin.write).toHaveBeenCalledTimes(1);

    const writeArg = (proc.stdin.write as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as string;
    expect(writeArg).toContain("Content-Length:");

    proc.stdout.write(jsonRpcFrame({ jsonrpc: "2.0", id: 1, result: "pong" }));
    await expect(pending).resolves.toBe("pong");
  });

  it("resolves request when result message arrives", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("get");
    proc.stdout.write(
      jsonRpcFrame({ jsonrpc: "2.0", id: 1, result: { ok: true } }),
    );

    await expect(req).resolves.toEqual({ ok: true });
  });

  it("rejects request on RPC error", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("fail");
    proc.stdout.write(
      jsonRpcFrame({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32603, message: "bad" },
      }),
    );

    await expect(req).rejects.toThrow("MCP error -32603: bad");
  });

  it("request times out", async () => {
    vi.useFakeTimers();

    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("slow", {}, 10);
    vi.advanceTimersByTime(11);

    await expect(req).rejects.toThrow("MCP request timeout");
    vi.useRealTimers();
  });

  it("notify writes message without id", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    client.notify("event", { x: 1 });
    const writeArg = (proc.stdin.write as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as string;
    expect(writeArg).toContain('"method":"event"');
    expect(writeArg).not.toContain('"id"');
  });

  it("destroy rejects pending requests", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("pending");
    client.destroy();

    await expect(req).rejects.toThrow("MCP client destroyed");
  });

  it("request throws when client already destroyed", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);
    client.destroy();

    await expect(client.request("x")).rejects.toThrow("MCP client destroyed");
  });

  it("process exit rejects pending requests", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("x");
    proc.emit("exit", 0);

    await expect(req).rejects.toThrow("MCP process exited");
    client.destroy();
  });

  it("ignores malformed frames and continues", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("x");
    proc.stdout.write("Content-Length: 6\r\n\r\n{oops}");
    proc.stdout.write(jsonRpcFrame({ jsonrpc: "2.0", id: 1, result: "ok" }));

    await expect(req).resolves.toBe("ok");
    client.destroy();
  });

  it("handles chunked incoming frames", async () => {
    const proc = new FakeProcess();
    const { McpJsonRpcClient } =
      await import("@/agent/runtime/mcp/mcp_json_rpc");
    const client = new McpJsonRpcClient(proc as never);

    const req = client.request("chunked");
    const frame = jsonRpcFrame({ jsonrpc: "2.0", id: 1, result: "chunk-ok" });

    proc.stdout.write(frame.slice(0, 12));
    proc.stdout.write(frame.slice(12));

    await expect(req).resolves.toBe("chunk-ok");
    client.destroy();
  });
});
