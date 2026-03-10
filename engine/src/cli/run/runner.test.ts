/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";
import type { AnyonConfig } from "../../config";
import { resolveRunAgent, waitForEventProcessorShutdown } from "./runner";

const createConfig = (overrides: Partial<AnyonConfig> = {}): AnyonConfig => ({
  ...overrides,
});

describe("resolveRunAgent", () => {
  it("uses CLI agent over env and config", () => {
    // given
    const config = createConfig({ default_run_agent: "strategist" });
    const env = { OPENCODE_DEFAULT_AGENT: "Taskmaster" };

    // when
    const agent = resolveRunAgent(
      { message: "test", agent: "Craftsman" },
      config,
      env,
    );

    // then
    expect(agent).toBe("Craftsman");
  });

  it("uses env agent over config", () => {
    // given
    const config = createConfig({ default_run_agent: "strategist" });
    const env = { OPENCODE_DEFAULT_AGENT: "Taskmaster" };

    // when
    const agent = resolveRunAgent({ message: "test" }, config, env);

    // then
    expect(agent).toBe("Taskmaster");
  });

  it("uses config agent over default", () => {
    // given
    const config = createConfig({ default_run_agent: "Strategist" });

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("Strategist");
  });

  it("falls back to conductor when none set", () => {
    // given
    const config = createConfig();

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("Builder");
  });

  it("skips disabled conductor for next available core agent", () => {
    // given
    const config = createConfig({ disabled_agents: ["conductor"] });

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("Craftsman");
  });

  it("maps display-name style default_run_agent values to canonical display names", () => {
    // given
    const config = createConfig({ default_run_agent: "Builder" });

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("Builder");
  });
});

describe("waitForEventProcessorShutdown", () => {
  it("returns quickly when event processor completes", async () => {
    //#given
    const eventProcessor = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 25);
    });
    const start = performance.now();

    //#when
    await waitForEventProcessorShutdown(eventProcessor, 200);

    //#then
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it("times out and continues when event processor does not complete", async () => {
    //#given
    const eventProcessor = new Promise<void>(() => {});
    const timeoutMs = 200;
    const start = performance.now();

    //#when
    await waitForEventProcessorShutdown(eventProcessor, timeoutMs);

    //#then
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 10);
  });
});
