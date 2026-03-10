import { describe, expect, spyOn, test } from "bun:test";
import {
  _resetForTesting,
  updateSessionAgent,
} from "../../features/claude-code-session-state";
import { getAgentDisplayName } from "../../shared/agent-display-names";
import { createNoConductorGptHook } from "./index";

const EULER_DISPLAY = getAgentDisplayName("conductor");
const TESLA_DISPLAY = getAgentDisplayName("craftsman");

function createOutput() {
  return {
    message: {},
    parts: [],
  };
}

describe("no-conductor-gpt hook", () => {
  test("shows toast on every chat.message when conductor uses gpt model", async () => {
    // given - conductor (display name) with gpt model
    const showToast = spyOn({ fn: async () => ({}) }, "fn");
    const hook = createNoConductorGptHook({
      client: { tui: { showToast } },
    } as any);

    const output1 = createOutput();
    const output2 = createOutput();

    // when - chat.message is called repeatedly with display name
    await hook["chat.message"]?.(
      {
        sessionID: "ses_1",
        agent: EULER_DISPLAY,
        model: { providerID: "openai", modelID: "gpt-5.3-codex" },
      },
      output1,
    );
    await hook["chat.message"]?.(
      {
        sessionID: "ses_1",
        agent: EULER_DISPLAY,
        model: { providerID: "openai", modelID: "gpt-5.3-codex" },
      },
      output2,
    );

    // then - toast is shown for every message
    expect(showToast).toHaveBeenCalledTimes(2);
    expect(output1.message.agent).toBe(TESLA_DISPLAY);
    expect(output2.message.agent).toBe(TESLA_DISPLAY);
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use Conductor with GPT",
        message: expect.stringContaining("For GPT models, always use Craftsman."),
        variant: "error",
      },
    });
  });

  test("does not show toast for non-gpt model", async () => {
    // given - conductor with claude model
    const showToast = spyOn({ fn: async () => ({}) }, "fn");
    const hook = createNoConductorGptHook({
      client: { tui: { showToast } },
    } as any);

    const output = createOutput();

    // when - chat.message runs
    await hook["chat.message"]?.(
      {
        sessionID: "ses_2",
        agent: EULER_DISPLAY,
        model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      },
      output,
    );

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0);
    expect(output.message.agent).toBeUndefined();
  });

  test("does not show toast for non-conductor agent", async () => {
    // given - craftsman with gpt model
    const showToast = spyOn({ fn: async () => ({}) }, "fn");
    const hook = createNoConductorGptHook({
      client: { tui: { showToast } },
    } as any);

    const output = createOutput();

    // when - chat.message runs
    await hook["chat.message"]?.(
      {
        sessionID: "ses_3",
        agent: TESLA_DISPLAY,
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
      output,
    );

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0);
    expect(output.message.agent).toBeUndefined();
  });

  test("uses session agent fallback when input agent is missing", async () => {
    // given - session agent saved with display name (as OpenCode stores it)
    _resetForTesting();
    updateSessionAgent("ses_4", EULER_DISPLAY);
    const showToast = spyOn({ fn: async () => ({}) }, "fn");
    const hook = createNoConductorGptHook({
      client: { tui: { showToast } },
    } as any);

    const output = createOutput();

    // when - chat.message runs without input.agent
    await hook["chat.message"]?.(
      {
        sessionID: "ses_4",
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
      output,
    );

    // then - toast shown via session-agent fallback
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(output.message.agent).toBe(TESLA_DISPLAY);
  });
});
