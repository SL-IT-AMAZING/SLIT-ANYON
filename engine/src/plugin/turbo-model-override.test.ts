import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import * as sessionStateModule from "../features/claude-code-session-state";
import * as sharedModule from "../shared";
import * as dbOverrideModule from "./turbo-db-model-override";
import {
  applyTurboModelOverrideOnMessage,
  detectTurbo,
  resolveTurboOverride,
} from "./turbo-model-override";

describe("detectTurbo", () => {
  test("should detect turbo keyword", () => {
    expect(detectTurbo("turbo do something")).toBe(true);
  });

  test("should detect ulw keyword", () => {
    expect(detectTurbo("ulw fix the bug")).toBe(true);
  });

  test("should be case insensitive", () => {
    expect(detectTurbo("TURBO do something")).toBe(true);
  });

  test("should not detect in code blocks", () => {
    const textWithCodeBlock = ["check this:", "```", "turbo mode", "```"].join(
      "\n",
    );
    expect(detectTurbo(textWithCodeBlock)).toBe(false);
  });

  test("should not detect in inline code", () => {
    expect(detectTurbo("the `turbo` mode is cool")).toBe(false);
  });

  test("should not detect when keyword absent", () => {
    expect(detectTurbo("just do something normal")).toBe(false);
  });
});

describe("resolveTurboOverride", () => {
  function createOutput(text: string, agentName?: string) {
    return {
      message: (agentName ? { agent: agentName } : {}) as Record<
        string,
        unknown
      >,
      parts: [{ type: "text", text }],
    };
  }

  function createConfig(
    agentName: string,
    turbo: { model?: string; variant?: string },
  ) {
    return {
      agents: {
        [agentName]: { turbo },
      },
    } as unknown as Parameters<typeof resolveTurboOverride>[0];
  }

  test("should resolve override when turbo keyword detected", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
      variant: "max",
    });
  });

  test("should return null when no keyword detected", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("just do something normal");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toBeNull();
  });

  test("should return null when agent name is undefined", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, undefined, output);

    //#then
    expect(result).toBeNull();
  });

  test("should use message.agent when input agent is undefined", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("turbo do something", "conductor");

    //#when
    const result = resolveTurboOverride(config, undefined, output);

    //#then
    expect(result).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
      variant: undefined,
    });
  });

  test("should return null when agents config is missing", () => {
    //#given
    const config = {} as Parameters<typeof resolveTurboOverride>[0];
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toBeNull();
  });

  test("should return null when agent has no turbo config", () => {
    //#given
    const config = {
      agents: { conductor: { model: "anthropic/claude-sonnet-4-6" } },
    } as unknown as Parameters<typeof resolveTurboOverride>[0];
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toBeNull();
  });

  test("should resolve variant-only override when turbo.model is not set", () => {
    //#given
    const config = createConfig("conductor", { variant: "max" });
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toEqual({ variant: "max" });
  });

  test("should handle model string with multiple slashes", () => {
    //#given
    const config = createConfig("conductor", { model: "openai/gpt-5.3/codex" });
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toEqual({
      providerID: "openai",
      modelID: "gpt-5.3/codex",
      variant: undefined,
    });
  });

  test("should return null when model string has no slash", () => {
    //#given
    const config = createConfig("conductor", { model: "just-a-model" });
    const output = createOutput("turbo do something");

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toBeNull();
  });

  test("should resolve display name to config key", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("ulw do something");

    //#when
    const result = resolveTurboOverride(config, "Conductor (Turbo)", output);

    //#then
    expect(result).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
      variant: "max",
    });
  });

  test("should handle multiple text parts by joining them", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        { type: "text", text: "hello " },
        { type: "image", text: undefined },
        { type: "text", text: "turbo now" },
      ],
    };

    //#when
    const result = resolveTurboOverride(config, "conductor", output);

    //#then
    expect(result).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
      variant: undefined,
    });
  });

  test("should use session agent when input and message agents are undefined", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("turbo do something");
    const getSessionAgentSpy = spyOn(
      sessionStateModule,
      "getSessionAgent",
    ).mockReturnValue("conductor");

    //#when
    const result = resolveTurboOverride(config, undefined, output, "ses_test");

    //#then
    expect(getSessionAgentSpy).toHaveBeenCalledWith("ses_test");
    expect(result).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
      variant: "max",
    });

    getSessionAgentSpy.mockRestore();
  });
});

describe("applyTurboModelOverrideOnMessage", () => {
  let logSpy: ReturnType<typeof spyOn>;
  let dbOverrideSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    logSpy = spyOn(sharedModule, "log").mockImplementation(() => {});
    dbOverrideSpy = spyOn(
      dbOverrideModule,
      "scheduleDeferredModelOverride",
    ).mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy?.mockRestore();
    dbOverrideSpy?.mockRestore();
  });

  function createMockTui() {
    return {
      showToast: async () => {},
    };
  }

  function createOutput(
    text: string,
    options?: {
      existingModel?: { providerID: string; modelID: string };
      agentName?: string;
      messageId?: string;
    },
  ) {
    return {
      message: {
        ...(options?.existingModel ? { model: options.existingModel } : {}),
        ...(options?.agentName ? { agent: options.agentName } : {}),
        ...(options?.messageId ? { id: options.messageId } : {}),
      } as Record<string, unknown>,
      parts: [{ type: "text", text }],
    };
  }

  function createConfig(
    agentName: string,
    turbo: { model?: string; variant?: string },
  ) {
    return {
      agents: {
        [agentName]: { turbo },
      },
    } as unknown as Parameters<typeof applyTurboModelOverrideOnMessage>[0];
  }

  test("should schedule deferred DB override when message ID present", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("turbo do something", { messageId: "msg_123" });
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(dbOverrideSpy).toHaveBeenCalledWith(
      "msg_123",
      { providerID: "anthropic", modelID: "claude-opus-4-6" },
      "max",
    );
  });

  test("should override keyword-detector variant with configured turbo variant on deferred path", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "extended",
    });
    const output = createOutput("turbo do something", { messageId: "msg_123" });
    output.message["variant"] = "max";
    output.message["thinking"] = "max";
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(dbOverrideSpy).toHaveBeenCalledWith(
      "msg_123",
      { providerID: "anthropic", modelID: "claude-opus-4-6" },
      "extended",
    );
    expect(output.message["variant"]).toBe("extended");
    expect(output.message["thinking"]).toBe("extended");
  });

  test("should NOT mutate output.message.model when message ID present", () => {
    //#given
    const sonnetModel = {
      providerID: "anthropic",
      modelID: "claude-sonnet-4-6",
    };
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("turbo do something", {
      existingModel: sonnetModel,
      messageId: "msg_123",
    });
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(output.message.model).toEqual(sonnetModel);
  });

  test("should fall back to direct mutation when no message ID", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("turbo do something");
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(output.message.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
    });
    expect(output.message["variant"]).toBe("max");
    expect(dbOverrideSpy).not.toHaveBeenCalled();
  });

  test("should apply variant-only override when no message ID", () => {
    //#given
    const config = createConfig("conductor", { variant: "high" });
    const output = createOutput("turbo do something");
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(output.message.model).toBeUndefined();
    expect(output.message["variant"]).toBe("high");
    expect(dbOverrideSpy).not.toHaveBeenCalled();
  });

  test("should not apply override when no keyword detected", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("just do something normal", {
      messageId: "msg_123",
    });
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled();
  });

  test("should log the model transition with deferred DB tag", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const existingModel = {
      providerID: "anthropic",
      modelID: "claude-sonnet-4-6",
    };
    const output = createOutput("turbo do something", {
      existingModel,
      messageId: "msg_123",
    });
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("deferred DB"),
      expect.objectContaining({ agent: "conductor" }),
    );
  });

  test("should call showToast on override", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
    });
    const output = createOutput("turbo do something", { messageId: "msg_123" });
    let toastCalled = false;
    const tui = {
      showToast: async () => {
        toastCalled = true;
      },
    };

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(toastCalled).toBe(true);
  });

  test("should resolve display name to config key with deferred path", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("ulw do something", { messageId: "msg_123" });
    const tui = createMockTui();

    //#when
    applyTurboModelOverrideOnMessage(config, "Conductor (Turbo)", output, tui);

    //#then
    expect(dbOverrideSpy).toHaveBeenCalledWith(
      "msg_123",
      { providerID: "anthropic", modelID: "claude-opus-4-6" },
      "max",
    );
  });

  test("should skip override trigger when current model already matches turbo model", () => {
    //#given
    const config = createConfig("conductor", {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
    });
    const output = createOutput("turbo do something", {
      existingModel: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      messageId: "msg_123",
    });
    let toastCalled = false;
    const tui = {
      showToast: async () => {
        toastCalled = true;
      },
    };

    //#when
    applyTurboModelOverrideOnMessage(config, "conductor", output, tui);

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled();
    expect(toastCalled).toBe(false);
  });
});
