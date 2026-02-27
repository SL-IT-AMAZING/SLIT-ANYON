// POC coverage for prompt injection, delegation, and lifecycle behavior.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock electron-log FIRST
vi.mock("electron-log", () => {
  const scoped = {
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return { default: { scope: vi.fn(() => scoped) } };
});

// Mock electron
vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  app: { getPath: vi.fn(() => "/tmp") },
}));

const runtimeControl = vi.hoisted(() => ({
  loopResult: "completed" as "completed" | "aborted" | "max-steps",
  responseText: "sub-agent response text",
  loopDelay: 0,
}));

vi.mock("@/agent/runtime/agent_runtime", () => ({
  AgentRuntime: class MockAgentRuntime {
    async loop(): Promise<"completed" | "aborted" | "max-steps"> {
      if (runtimeControl.loopDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, runtimeControl.loopDelay));
      }
      return runtimeControl.loopResult;
    }

    getAccumulatedResponseText(): string {
      return runtimeControl.responseText;
    }

    abort(): void {}

    getCumulativeTokens(): { input: number; output: number } {
      return { input: 0, output: 0 };
    }
  },
}));

import type { ToolRegistry } from "@/agent/runtime/tool_registry";
import type { SpawnParams } from "@/agent/runtime/background_manager";
import { BackgroundManager } from "@/agent/runtime/background_manager";
import {
  buildFullSisyphusPrompt,
  type AvailableAgent,
  type AvailableCategory,
  type AvailableSkill,
} from "@/agent/runtime/agents";
import { HookRegistry, type HookContext } from "@/agent/runtime/hook_system";
import {
  buildEnvironmentBlock,
} from "@/agent/runtime/system_prompt";
import {
  createPrimaryRunContext,
  createSubAgentRunContext,
} from "@/agent/runtime/run_context";
import type { ContinuationRequest, QuestionAnswer } from "@/agent/runtime/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createHookContext(): HookContext {
  return {
    sessionId: "test-session",
    chatId: 1,
    agent: "sisyphus",
    directory: "/tmp/test",
    runId: "run-1",
  };
}

function createSpawnParams(
  overrides: Partial<SpawnParams> = {},
): SpawnParams {
  const parentRunContext = createPrimaryRunContext({ chatId: 1, agentName: "test-parent" });

  const params: SpawnParams = {
    agentName: "explore",
    prompt: "Test prompt",
    description: "Test task",
    parentRunContext,
    parentAbort: new AbortController().signal,
    runtimeFactory: (childRunContext, childAbort) => ({
      chatId: 1,
      assistantMessageId: -1,
      sessionId: 1,
      appPath: "/tmp/test",
      model: {} as never,
      systemPrompt: ["test"],
      registry: {
        resolveTools: () => ({}),
        list: () => [],
      } as unknown as ToolRegistry,
      toolContext: {
        sessionId: 1,
        chatId: 1,
        appPath: "/tmp/test",
        abort: childAbort.signal,
        askConsent: async () => true,
        askQuestion: async (): Promise<QuestionAnswer[]> => [],
        event: {} as Electron.IpcMainInvokeEvent,
      },
      callbacks: {
        onTextDelta: () => {},
        onReasoningDelta: () => {},
        onToolCall: () => {},
        onToolResult: () => {},
        onToolError: () => {},
        onStepFinish: () => {},
        onFinish: () => {},
        onError: () => {},
      },
      agentConfig: {
        name: "explore",
        description: "test",
        steps: Number.POSITIVE_INFINITY,
        tools: [],
        mode: "subagent",
      },
      runContext: childRunContext,
    }),
    runInBackground: false,
  };

  return { ...params, ...overrides };
}

const managersToDestroy: BackgroundManager[] = [];

function createBackgroundManager(): BackgroundManager {
  const bgm = new BackgroundManager({
    defaultConcurrency: 5,
    providerConcurrency: {},
  });
  managersToDestroy.push(bgm);
  return bgm;
}

beforeEach(() => {
  runtimeControl.loopResult = "completed";
  runtimeControl.responseText = "sub-agent response text";
  runtimeControl.loopDelay = 0;
  vi.clearAllMocks();
});

afterEach(() => {
  for (const manager of managersToDestroy.splice(0, managersToDestroy.length)) {
    manager.destroy();
  }
});

describe("POC 1: System Prompt Injection", () => {
  it("buildFullSisyphusPrompt produces non-empty prompt with Sisyphus identity", () => {
    const prompt = buildFullSisyphusPrompt([], [], [], []);

    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("Sisyphus");
    expect(prompt).toContain("Phase 0");
    expect(prompt).toContain("Phase 1");
    expect(prompt).toContain("Oracle");
  });

  it("system prompt includes all agent descriptions when agents provided", () => {
    const agents: AvailableAgent[] = [
      {
        name: "oracle",
        description: "Deep architecture and debugging consultant.",
        metadata: {
          category: "advisor",
          cost: "EXPENSIVE",
          triggers: [{ domain: "architecture", trigger: "complex design" }],
        },
      },
      {
        name: "explore",
        description: "Fast contextual codebase search.",
        metadata: {
          category: "exploration",
          cost: "FREE",
          triggers: [{ domain: "search", trigger: "find patterns quickly" }],
        },
      },
    ];

    const prompt = buildFullSisyphusPrompt(agents, [], [], []);

    expect(prompt).toContain("oracle");
    expect(prompt).toContain("Deep architecture and debugging consultant");
    expect(prompt).toContain("explore");
    expect(prompt).toContain("Fast contextual codebase search");
    expect(prompt).toContain("complex design");
    expect(prompt).toContain("find patterns quickly");
  });

  it("system prompt includes skill descriptions", () => {
    const agents: AvailableAgent[] = [
      {
        name: "oracle",
        description: "Oracle advisor",
        metadata: {
          category: "advisor",
          cost: "EXPENSIVE",
          triggers: [{ domain: "reasoning", trigger: "deep analysis" }],
        },
      },
    ];

    const skills: AvailableSkill[] = [
      {
        name: "frontend-ui-ux",
        description: "Designer-turned-developer focused on polished UI.",
        location: "user",
      },
      {
        name: "git-master",
        description: "Atomic commits, history hygiene, and workflow expertise.",
        location: "project",
      },
    ];

    const categories: AvailableCategory[] = [
      { name: "visual-engineering", description: "UI and interaction implementation" },
    ];

    const prompt = buildFullSisyphusPrompt(agents, [], skills, categories);

    expect(prompt).toContain("frontend-ui-ux");
    expect(prompt).toContain("Designer-turned-developer focused on polished UI");
    expect(prompt).toContain("git-master");
    expect(prompt).toContain("Atomic commits, history hygiene, and workflow expertise");
  });

  it("system prompt includes environment context block with date/time metadata", () => {
    const envBlock = buildEnvironmentBlock("/tmp/test");

    expect(envBlock).toContain("<env>");
    expect(envBlock).toContain("Working directory: /tmp/test");
    expect(envBlock).toContain("Today's date:");
    expect(envBlock).toContain("Platform:");
  });
});

describe("POC 2: Sub-Agent Delegation", () => {
  it("spawnAgent creates task and returns taskId", async () => {
    const bgm = createBackgroundManager();
    const taskId = await bgm.spawnAgent(createSpawnParams({ runInBackground: true }));

    expect(taskId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(bgm.getAllTasks().length).toBe(1);
  });

  it("foreground task completes and has result", async () => {
    const bgm = createBackgroundManager();
    runtimeControl.responseText = "foreground result";

    const taskId = await bgm.spawnAgent(createSpawnParams({ runInBackground: false }));
    const output = bgm.getTaskOutput(taskId);

    expect(output?.status).toBe("completed");
    expect(output?.result).toBe("foreground result");
  });

  it("background task runs asynchronously", async () => {
    const bgm = createBackgroundManager();
    runtimeControl.loopDelay = 30;

    const taskId = await bgm.spawnAgent(createSpawnParams({ runInBackground: true }));
    const immediateStatus = bgm.getTaskStatus(taskId);

    expect(["pending", "running"]).toContain(immediateStatus);

    await sleep(50);
    expect(bgm.getTaskStatus(taskId)).toBe("completed");
  });

  it("cancelTask aborts running task", async () => {
    const bgm = createBackgroundManager();
    runtimeControl.loopDelay = 5000;

    const taskId = await bgm.spawnAgent(createSpawnParams({ runInBackground: true }));
    bgm.cancelTask(taskId);

    expect(bgm.getTaskStatus(taskId)).toBe("cancelled");
  });

  it("getTaskOutput formats duration correctly", async () => {
    const bgm = createBackgroundManager();

    const taskId = await bgm.spawnAgent(createSpawnParams({ runInBackground: false }));
    const output = bgm.getTaskOutput(taskId);

    expect(output).toBeDefined();
    expect(output?.duration).toBeGreaterThanOrEqual(0);
  });
});

describe("POC 3: Lifecycle Loop", () => {
  it("HookRegistry fires hooks in correct order", async () => {
    const hookRegistry = new HookRegistry();
    const calls: string[] = [];

    hookRegistry.register("agent.step.before", "before-hook", async () => {
      calls.push("before");
      return undefined;
    });

    hookRegistry.register("agent.step.after", "after-hook", async () => {
      calls.push("after");
      return undefined;
    });

    const hookCtx = createHookContext();

    await hookRegistry.execute("agent.step.before", {}, {}, hookCtx);
    await hookRegistry.execute("agent.step.after", {}, {}, hookCtx);

    expect(calls).toEqual(["before", "after"]);
  });

  it("HookRegistry supports multiple hooks on same event", async () => {
    const hookRegistry = new HookRegistry();
    const calls: string[] = [];

    hookRegistry.register("agent.turn.stop", "first-hook", async () => {
      calls.push("first");
      return undefined;
    });

    hookRegistry.register("agent.turn.stop", "second-hook", async () => {
      calls.push("second");
      return undefined;
    });

    await hookRegistry.execute(
      "agent.turn.stop",
      { finishReason: "completed", autoContinueCount: 0, maxAutoContinues: 10 },
      { continuationQueue: [] as ContinuationRequest[] },
      createHookContext(),
    );

    expect(calls).toEqual(["first", "second"]);
  });

  it("ContinuationRequest is pushed by atlas hook pattern", () => {
    const continuationQueue: ContinuationRequest[] = [];

    const atlasLikeTurnStop = (
      queue: ContinuationRequest[],
      reason: string,
      content: string,
    ): void => {
      queue.push({ reason, content, visible: false });
    };

    atlasLikeTurnStop(
      continuationQueue,
      "atlas:1-incomplete-todos",
      "[SYSTEM REMINDER - TODO CONTINUATION] Continue with pending work.",
    );

    expect(continuationQueue).toHaveLength(1);
    expect(continuationQueue[0]?.reason).toBe("atlas:1-incomplete-todos");
    expect(continuationQueue[0]?.content).toContain("TODO CONTINUATION");
    expect(continuationQueue[0]?.visible).toBe(false);
  });

  it("RunContext tracks parent-child relationships", () => {
    const primary = createPrimaryRunContext({ chatId: 42, agentName: "sisyphus" });
    const child = createSubAgentRunContext({
      parentRunId: primary.runId,
      rootChatId: primary.rootChatId,
      chatId: primary.chatId,
      agentName: "explore",
    });

    expect(primary.isSubAgent).toBe(false);
    expect(child.isSubAgent).toBe(true);
    expect(child.parentRunId).toBe(primary.runId);
    expect(child.rootChatId).toBe(primary.rootChatId);
  });
});
