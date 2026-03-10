import { describe, expect, test } from "bun:test";
import type { AnyonConfig } from "../config";
import {
  applyAgentVariant,
  resolveAgentVariant,
  resolveVariantForModel,
} from "./agent-variant";

describe("resolveAgentVariant", () => {
  test("returns undefined when agent name missing", () => {
    // given
    const config = {} as AnyonConfig;

    // when
    const variant = resolveAgentVariant(config);

    // then
    expect(variant).toBeUndefined();
  });

  test("returns agent override variant", () => {
    // given
    const config = {
      agents: {
        conductor: { variant: "low" },
      },
    } as AnyonConfig;

    // when
    const variant = resolveAgentVariant(config, "conductor");

    // then
    expect(variant).toBe("low");
  });

  test("returns category variant when agent uses category", () => {
    // given
    const config = {
      agents: {
        conductor: { category: "ultrabrain" },
      },
      categories: {
        ultrabrain: { model: "openai/gpt-5.2", variant: "xhigh" },
      },
    } as AnyonConfig;

    // when
    const variant = resolveAgentVariant(config, "conductor");

    // then
    expect(variant).toBe("xhigh");
  });
});

describe("applyAgentVariant", () => {
  test("sets variant when message is undefined", () => {
    // given
    const config = {
      agents: {
        conductor: { variant: "low" },
      },
    } as AnyonConfig;
    const message: { variant?: string } = {};

    // when
    applyAgentVariant(config, "conductor", message);

    // then
    expect(message.variant).toBe("low");
  });

  test("does not override existing variant", () => {
    // given
    const config = {
      agents: {
        conductor: { variant: "low" },
      },
    } as AnyonConfig;
    const message = { variant: "max" };

    // when
    applyAgentVariant(config, "conductor", message);

    // then
    expect(message.variant).toBe("max");
  });
});

describe("resolveVariantForModel", () => {
  test("returns agent override variant when configured", () => {
    // given - use a model in conductor chain (claude-opus-4-6 has default variant "max")
    // to verify override takes precedence over fallback chain
    const config = {
      agents: {
        conductor: { variant: "high" },
      },
    } as AnyonConfig;
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" };

    // when
    const variant = resolveVariantForModel(config, "conductor", model);

    // then
    expect(variant).toBe("high");
  });

  test("returns correct variant for anthropic provider", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" };

    // when
    const variant = resolveVariantForModel(config, "conductor", model);

    // then
    expect(variant).toBe("max");
  });

  test("returns correct variant for openai provider (craftsman agent)", () => {
    // #given craftsman has openai/gpt-5.3-codex with variant "medium" in its chain
    const config = {} as AnyonConfig;
    const model = { providerID: "openai", modelID: "gpt-5.3-codex" };

    // #when
    const variant = resolveVariantForModel(config, "craftsman", model);

    // then
    expect(variant).toBe("medium");
  });

  test("returns undefined for provider not in conductor chain", () => {
    // #given openai is not in conductor fallback chain anymore
    const config = {} as AnyonConfig;
    const model = { providerID: "openai", modelID: "gpt-5.2" };

    // when
    const variant = resolveVariantForModel(config, "conductor", model);

    // then
    expect(variant).toBeUndefined();
  });

  test("returns undefined for provider not in chain", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "unknown-provider", modelID: "some-model" };

    // when
    const variant = resolveVariantForModel(config, "conductor", model);

    // then
    expect(variant).toBeUndefined();
  });

  test("returns undefined for unknown agent", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" };

    // when
    const variant = resolveVariantForModel(config, "nonexistent-agent", model);

    // then
    expect(variant).toBeUndefined();
  });

  test("returns variant for zai-coding-plan provider without variant", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "zai-coding-plan", modelID: "glm-5" };

    // when
    const variant = resolveVariantForModel(config, "conductor", model);

    // then
    expect(variant).toBeUndefined();
  });

  test("falls back to category chain when agent has no requirement", () => {
    // given
    const config = {
      agents: {
        "custom-agent": { category: "ultrabrain" },
      },
    } as AnyonConfig;
    const model = { providerID: "openai", modelID: "gpt-5.3-codex" };

    // when
    const variant = resolveVariantForModel(config, "custom-agent", model);

    // then
    expect(variant).toBe("xhigh");
  });

  test("returns correct variant for advisor agent with openai", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "openai", modelID: "gpt-5.2" };

    // when
    const variant = resolveVariantForModel(config, "advisor", model);

    // then
    expect(variant).toBe("high");
  });

  test("returns correct variant for advisor agent with anthropic", () => {
    // given
    const config = {} as AnyonConfig;
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" };

    // when
    const variant = resolveVariantForModel(config, "advisor", model);

    // then
    expect(variant).toBe("max");
  });
});
