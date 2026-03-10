import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  _resetForTesting,
  clearSessionAgent,
  setMainSession,
  updateSessionAgent,
} from "../../features/claude-code-session-state";
import * as sessionState from "../../features/claude-code-session-state";
import { ContextCollector } from "../../features/context-injector";
import * as sharedModule from "../../shared";
import { createKeywordDetectorHook } from "./index";

describe("keyword-detector message transform", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>;
  let logSpy: ReturnType<typeof spyOn>;
  let getMainSessionSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetForTesting();
    logCalls = [];
    logSpy = spyOn(sharedModule, "log").mockImplementation(
      (msg: string, data?: unknown) => {
        logCalls.push({ msg, data });
      },
    );
  });

  afterEach(() => {
    logSpy?.mockRestore();
    getMainSessionSpy?.mockRestore();
    _resetForTesting();
  });

  function createMockPluginInput() {
    return {
      client: {
        tui: {
          showToast: async () => {},
        },
      },
    } as any;
  }

  test("should prepend turbo message to text part", async () => {
    // given - a fresh ContextCollector and keyword-detector hook
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session-123";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo do something" }],
    };

    // when - keyword detection runs
    await hook["chat.message"]({ sessionID }, output);

    // then - message should be prepended to text part with separator and original text
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("---");
    expect(textPart!.text).toContain("do something");
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS");
  });

  test("should prepend search message to text part", async () => {
    // given - mock getMainSessionID to return our session (isolate from global state)
    const collector = new ContextCollector();
    const sessionID = "search-test-session";
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(
      sessionID,
    );
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "search for the bug" }],
    };

    // when - keyword detection runs
    await hook["chat.message"]({ sessionID }, output);

    // then - search message should be prepended to text part
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("---");
    expect(textPart!.text).toContain("for the bug");
    expect(textPart!.text).toContain("[search-mode]");
  });

  test("should NOT transform when no keywords detected", async () => {
    // given - no keywords in message
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "just a normal message" }],
    };

    // when - keyword detection runs
    await hook["chat.message"]({ sessionID }, output);

    // then - text should remain unchanged
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toBe("just a normal message");
  });
});

describe("keyword-detector session filtering", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetForTesting();
    logCalls = [];
    logSpy = spyOn(sharedModule, "log").mockImplementation(
      (msg: string, data?: unknown) => {
        logCalls.push({ msg, data });
      },
    );
  });

  afterEach(() => {
    logSpy?.mockRestore();
    _resetForTesting();
  });

  function createMockPluginInput(options: { toastCalls?: string[] } = {}) {
    const toastCalls = options.toastCalls ?? [];
    return {
      client: {
        tui: {
          showToast: async (opts: any) => {
            toastCalls.push(opts.body.title);
          },
        },
      },
    } as any;
  }

  test("should skip non-turbo keywords in non-main session (using mainSessionID check)", async () => {
    // given - main session is set, different session submits search keyword
    const mainSessionID = "main-123";
    const subagentSessionID = "subagent-456";
    setMainSession(mainSessionID);

    const hook = createKeywordDetectorHook(createMockPluginInput());
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "search mode 찾아줘" }],
    };

    // when - non-main session triggers keyword detection
    await hook["chat.message"]({ sessionID: subagentSessionID }, output);

    // then - search keyword should be filtered out based on mainSessionID comparison
    const skipLog = logCalls.find((c) =>
      c.msg.includes("Skipping non-turbo keywords in non-main session"),
    );
    expect(skipLog).toBeDefined();
  });

  test("should allow turbo keywords in non-main session", async () => {
    // given - main session is set, different session submits turbo keyword
    const mainSessionID = "main-123";
    const subagentSessionID = "subagent-456";
    setMainSession(mainSessionID);

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo mode" }],
    };

    // when - non-main session triggers turbo keyword
    await hook["chat.message"]({ sessionID: subagentSessionID }, output);

    // then - turbo should still work (variant set to max)
    expect(output.message.variant).toBe("max");
    expect(toastCalls).toContain("Turbo Mode Activated");
  });

  test("should allow all keywords in main session", async () => {
    // given - main session submits search keyword
    const mainSessionID = "main-123";
    setMainSession(mainSessionID);

    const hook = createKeywordDetectorHook(createMockPluginInput());
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "search mode 찾아줘" }],
    };

    // when - main session triggers keyword detection
    await hook["chat.message"]({ sessionID: mainSessionID }, output);

    // then - search keyword should be detected (output unchanged but detection happens)
    // Note: search keywords don't set variant, they inject messages via context-injector
    // This test verifies the detection logic runs without filtering
    expect(output.message.variant).toBeUndefined(); // search doesn't set variant
  });

  test("should allow all keywords when mainSessionID is not set", async () => {
    // given - no main session set (early startup or standalone mode)
    setMainSession(undefined);

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo search" }],
    };

    // when - any session triggers keyword detection
    await hook["chat.message"]({ sessionID: "any-session" }, output);

    // then - all keywords should work
    expect(output.message.variant).toBe("max");
    expect(toastCalls).toContain("Turbo Mode Activated");
  });

  test("should override existing variant when turbo keyword is used", async () => {
    // given - main session set with pre-existing variant from TUI
    setMainSession("main-123");

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: { variant: "low" } as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo mode" }],
    };

    // when - turbo keyword triggers
    await hook["chat.message"]({ sessionID: "main-123" }, output);

    // then - turbo should override TUI variant to max
    expect(output.message.variant).toBe("max");
    expect(toastCalls).toContain("Turbo Mode Activated");
  });
});

describe("keyword-detector word boundary", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetForTesting();
    logCalls = [];
    logSpy = spyOn(sharedModule, "log").mockImplementation(
      (msg: string, data?: unknown) => {
        logCalls.push({ msg, data });
      },
    );
  });

  afterEach(() => {
    logSpy?.mockRestore();
    _resetForTesting();
  });

  function createMockPluginInput(options: { toastCalls?: string[] } = {}) {
    const toastCalls = options.toastCalls ?? [];
    return {
      client: {
        tui: {
          showToast: async (opts: any) => {
            toastCalls.push(opts.body.title);
          },
        },
      },
    } as any;
  }

  test("should NOT trigger turbo on partial matches like 'StatefulWidget' containing 'ulw'", async () => {
    // given - text contains 'ulw' as part of another word (StatefulWidget)
    setMainSession(undefined);

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "refactor the StatefulWidget component" }],
    };

    // when - message with partial 'ulw' match is processed
    await hook["chat.message"]({ sessionID: "any-session" }, output);

    // then - turbo should NOT be triggered
    expect(output.message.variant).toBeUndefined();
    expect(toastCalls).not.toContain("Turbo Mode Activated");
  });

  test("should trigger turbo on standalone 'ulw' keyword", async () => {
    // given - text contains standalone 'ulw'
    setMainSession(undefined);

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "ulw do this task" }],
    };

    // when - message with standalone 'ulw' is processed
    await hook["chat.message"]({ sessionID: "any-session" }, output);

    // then - turbo should be triggered
    expect(output.message.variant).toBe("max");
    expect(toastCalls).toContain("Turbo Mode Activated");
  });

  test("should NOT trigger turbo on file references containing 'ulw' substring", async () => {
    // given - file reference contains 'ulw' as substring
    setMainSession(undefined);

    const toastCalls: string[] = [];
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
    );
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        { type: "text", text: "@StatefulWidget.tsx please review this file" },
      ],
    };

    // when - message referencing file with 'ulw' substring is processed
    await hook["chat.message"]({ sessionID: "any-session" }, output);

    // then - turbo should NOT be triggered
    expect(output.message.variant).toBeUndefined();
    expect(toastCalls).not.toContain("Turbo Mode Activated");
  });
});

describe("keyword-detector system-reminder filtering", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetForTesting();
    logCalls = [];
    logSpy = spyOn(sharedModule, "log").mockImplementation(
      (msg: string, data?: unknown) => {
        logCalls.push({ msg, data });
      },
    );
  });

  afterEach(() => {
    logSpy?.mockRestore();
    _resetForTesting();
  });

  function createMockPluginInput() {
    return {
      client: {
        tui: {
          showToast: async () => {},
        },
      },
    } as any;
  }

  test("should NOT trigger search mode from keywords inside <system-reminder> tags", async () => {
    // given - message contains search keywords only inside system-reminder tags
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<system-reminder>
The system will search for the file and find all occurrences.
Please locate and scan the directory.
</system-reminder>`,
        },
      ],
    };

    // when - keyword detection runs on system-reminder content
    await hook["chat.message"]({ sessionID }, output);

    // then - should NOT trigger search mode (text should remain unchanged)
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).not.toContain("[search-mode]");
    expect(textPart!.text).toContain("<system-reminder>");
  });

  test("should NOT trigger analyze mode from keywords inside <system-reminder> tags", async () => {
    // given - message contains analyze keywords only inside system-reminder tags
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<system-reminder>
You should investigate and examine the code carefully.
Research the implementation details.
</system-reminder>`,
        },
      ],
    };

    // when - keyword detection runs on system-reminder content
    await hook["chat.message"]({ sessionID }, output);

    // then - should NOT trigger analyze mode
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).not.toContain("[analyze-mode]");
    expect(textPart!.text).toContain("<system-reminder>");
  });

  test("should detect keywords in user text even when system-reminder is present", async () => {
    // given - message contains both system-reminder and user search keyword
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<system-reminder>
System will find and locate files.
</system-reminder>

Please search for the bug in the code.`,
        },
      ],
    };

    // when - keyword detection runs on mixed content
    await hook["chat.message"]({ sessionID }, output);

    // then - should trigger search mode from user text only
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("[search-mode]");
    expect(textPart!.text).toContain("Please search for the bug in the code.");
  });

  test("should handle multiple system-reminder tags in message", async () => {
    // given - message contains multiple system-reminder blocks with keywords
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<system-reminder>
First reminder with search and find keywords.
</system-reminder>

User message without keywords.

<system-reminder>
Second reminder with investigate and examine keywords.
</system-reminder>`,
        },
      ],
    };

    // when - keyword detection runs on message with multiple system-reminders
    await hook["chat.message"]({ sessionID }, output);

    // then - should NOT trigger any mode (only user text exists, no keywords)
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).not.toContain("[search-mode]");
    expect(textPart!.text).not.toContain("[analyze-mode]");
  });

  test("should handle case-insensitive system-reminder tags", async () => {
    // given - message contains system-reminder with different casing
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<SYSTEM-REMINDER>
System will search and find files.
</SYSTEM-REMINDER>`,
        },
      ],
    };

    // when - keyword detection runs on uppercase system-reminder
    await hook["chat.message"]({ sessionID }, output);

    // then - should NOT trigger search mode
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).not.toContain("[search-mode]");
  });

  test("should handle multiline system-reminder content with search keywords", async () => {
    // given - system-reminder with multiline content containing various search keywords
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "test-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        {
          type: "text",
          text: `<system-reminder>
Commands executed:
- find: searched for pattern
- grep: located file
- scan: completed

Please scout the codebase and discover patterns.
</system-reminder>`,
        },
      ],
    };

    // when - keyword detection runs on multiline system-reminder
    await hook["chat.message"]({ sessionID }, output);

    // then - should NOT trigger search mode
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).not.toContain("[search-mode]");
  });
});

describe("keyword-detector agent-specific turbo messages", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    _resetForTesting();
    logCalls = [];
    logSpy = spyOn(sharedModule, "log").mockImplementation(
      (msg: string, data?: unknown) => {
        logCalls.push({ msg, data });
      },
    );
  });

  afterEach(() => {
    logSpy?.mockRestore();
    _resetForTesting();
  });

  function createMockPluginInput() {
    return {
      client: {
        tui: {
          showToast: async () => {},
        },
      },
    } as any;
  }

  test("should skip turbo injection when agent is strategist", async () => {
    // given - collector and strategist agent
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "strategist-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo plan this feature" }],
    };

    // when - turbo keyword detected with strategist agent
    await hook["chat.message"]({ sessionID, agent: "strategist" }, output);

    // then - turbo should be skipped for planner agents, text unchanged
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toBe("turbo plan this feature");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
    expect(textPart!.text).not.toContain(
      "YOU MUST LEVERAGE ALL AVAILABLE AGENTS",
    );
  });

  test("should skip turbo injection when agent name contains 'planner'", async () => {
    // given - collector and agent with 'planner' in name
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "planner-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "ulw create a work plan" }],
    };

    // when - turbo keyword detected with planner agent
    await hook["chat.message"](
      { sessionID, agent: "Strategist (Planner)" },
      output,
    );

    // then - turbo should be skipped, text unchanged
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toBe("ulw create a work plan");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
  });

  test("should skip turbo injection when agent name contains 'plan' token", async () => {
    //#given - collector and agent name that includes a plan token
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "plan-agent-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo draft a plan" }],
    };

    //#when - turbo keyword detected with plan-like agent name
    await hook["chat.message"]({ sessionID, agent: "Plan Agent" }, output);

    //#then - turbo should be skipped, text unchanged
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toBe("turbo draft a plan");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
  });

  test("should use normal turbo message when agent is Conductor", async () => {
    // given - collector and Conductor agent
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "conductor-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo implement this feature" }],
    };

    // when - turbo keyword detected with Conductor agent
    await hook["chat.message"]({ sessionID, agent: "conductor" }, output);

    // then - should use normal turbo message with agent utilization instructions
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
    expect(textPart!.text).toContain("---");
    expect(textPart!.text).toContain("implement this feature");
  });

  test("should use normal turbo message when agent is undefined", async () => {
    // given - collector with no agent specified
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "no-agent-session";
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo do something" }],
    };

    // when - turbo keyword detected without agent
    await hook["chat.message"]({ sessionID }, output);

    // then - should use normal turbo message (default behavior)
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
    expect(textPart!.text).toContain("---");
    expect(textPart!.text).toContain("do something");
  });

  test("should skip turbo for strategist but inject for conductor", async () => {
    // given - two sessions, one with strategist, one with conductor
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);

    // First session with strategist
    const strategistSessionID = "strategist-first";
    const strategistOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo plan" }],
    };
    await hook["chat.message"](
      { sessionID: strategistSessionID, agent: "strategist" },
      strategistOutput,
    );

    // Second session with conductor
    const conductorSessionID = "conductor-second";
    const conductorOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo implement" }],
    };
    await hook["chat.message"](
      { sessionID: conductorSessionID, agent: "conductor" },
      conductorOutput,
    );

    // then - strategist should have no injection, conductor should have normal turbo
    const strategistTextPart = strategistOutput.parts.find(
      (p) => p.type === "text",
    );
    expect(strategistTextPart!.text).toBe("turbo plan");

    const conductorTextPart = conductorOutput.parts.find(
      (p) => p.type === "text",
    );
    expect(conductorTextPart!.text).toContain(
      "YOU MUST LEVERAGE ALL AVAILABLE AGENTS",
    );
    expect(conductorTextPart!.text).toContain("---");
    expect(conductorTextPart!.text).toContain("implement");
  });

  test("should use session state agent over stale input.agent (bug fix)", async () => {
    // given - same session, agent switched from strategist to conductor in session state
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "same-session-agent-switch";

    // Simulate: session state was updated to conductor (by index.ts updateSessionAgent)
    updateSessionAgent(sessionID, "conductor");

    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo implement this" }],
    };

    // when - hook receives stale input.agent="strategist" but session state says "Conductor"
    await hook["chat.message"]({ sessionID, agent: "strategist" }, output);

    // then - should use Conductor from session state, NOT strategist from stale input
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
    expect(textPart!.text).toContain("---");
    expect(textPart!.text).toContain("implement this");

    // cleanup
    clearSessionAgent(sessionID);
  });

  test("should fall back to input.agent when session state is empty and skip turbo for strategist", async () => {
    // given - no session state, only input.agent available
    const collector = new ContextCollector();
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector);
    const sessionID = "no-session-state";

    // Ensure no session state
    clearSessionAgent(sessionID);

    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "turbo plan this" }],
    };

    // when - hook receives input.agent="strategist" with no session state
    await hook["chat.message"]({ sessionID, agent: "strategist" }, output);

    // then - strategist fallback from input.agent, turbo skipped
    const textPart = output.parts.find((p) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart!.text).toBe("turbo plan this");
    expect(textPart!.text).not.toContain(
      "YOU ARE A PLANNER, NOT AN IMPLEMENTER",
    );
  });
});
