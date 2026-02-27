import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig } from "@/agent/runtime/types";

const fsMocks = vi.hoisted(() => ({
  readFileSync: vi.fn<(filePath: string, encoding: string) => string>(),
  existsSync: vi.fn<(filePath: string) => boolean>(),
}));

vi.mock("node:fs", () => ({
  default: {
    readFileSync: fsMocks.readFileSync,
    existsSync: fsMocks.existsSync,
  },
  readFileSync: fsMocks.readFileSync,
  existsSync: fsMocks.existsSync,
}));

import {
  assembleSystemPrompt,
  buildEnvironmentBlock,
  readPromptFile,
  selectProviderPrompt,
} from "@/agent/runtime/system_prompt";

describe("system_prompt", () => {
  beforeEach(() => {
    fsMocks.readFileSync.mockReset();
    fsMocks.existsSync.mockReset();

    fsMocks.readFileSync.mockImplementation((filePath: string) => {
      return `prompt:${path.basename(filePath)}\n`;
    });
    fsMocks.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("selectProviderPrompt returns anthropic spoof + anthropic for claude", () => {
    const prompt = selectProviderPrompt("Anthropic", "claude-3-7-sonnet");
    expect(prompt).toBe("prompt:anthropic_spoof.txt\n\nprompt:anthropic.txt");
  });

  it("selectProviderPrompt returns gemini prompt for google and gemini", () => {
    expect(selectProviderPrompt("google", "any-model")).toBe(
      "prompt:gemini.txt",
    );
    expect(selectProviderPrompt("other", "gemini-2.0-flash")).toBe(
      "prompt:gemini.txt",
    );
  });

  it("selectProviderPrompt returns qwen prompt", () => {
    expect(selectProviderPrompt("qwen", "model")).toBe("prompt:qwen.txt");
    expect(selectProviderPrompt("other", "qwen2.5-coder")).toBe(
      "prompt:qwen.txt",
    );
  });

  it("selectProviderPrompt returns copilot-gpt-5 prompt", () => {
    const prompt = selectProviderPrompt("copilot", "gpt-5");
    expect(prompt).toBe("prompt:copilot-gpt-5.txt");
  });

  it("selectProviderPrompt returns codex header for gpt-5 without copilot", () => {
    const prompt = selectProviderPrompt("openai", "gpt-5-mini");
    expect(prompt).toBe("prompt:codex_header.txt");
  });

  it("selectProviderPrompt returns beast for gpt-4", () => {
    const prompt = selectProviderPrompt("openai", "gpt-4.1");
    expect(prompt).toBe("prompt:beast.txt");
  });

  it("selectProviderPrompt falls back to anthropic for unknown providers", () => {
    const prompt = selectProviderPrompt("unknown-provider", "model-x");
    expect(prompt).toBe("prompt:anthropic.txt");
  });

  it("buildEnvironmentBlock includes app path, platform, date, and git status", () => {
    const now = new Date(2026, 0, 2, 12, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const appPath = "/tmp/project";
    const envBlock = buildEnvironmentBlock(appPath);

    expect(fsMocks.existsSync).toHaveBeenCalledWith(path.join(appPath, ".git"));
    expect(envBlock).toContain(`Working directory: ${appPath}`);
    expect(envBlock).toContain("Is directory a git repo: yes");
    expect(envBlock).toContain(`Platform: ${process.platform}`);
    expect(envBlock).toContain(`Today's date: ${now.toDateString()}`);
  });

  it("assembleSystemPrompt composes provider prompt, env block and optional parts", () => {
    const now = new Date(2026, 0, 3, 12, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const agentConfig: AgentConfig = {
      name: "Primary",
      description: "desc",
      steps: 5,
      tools: ["read"],
      mode: "primary",
      prompt: "  follow repo conventions  ",
    };

    const parts = assembleSystemPrompt({
      modelProvider: "openai",
      modelId: "gpt-4.1",
      agentConfig,
      appPath: "/repo/app",
      customRules: "  custom rules  ",
      themePrompt: "  theme details  ",
      supabaseContext: "  supabase context  ",
      anyonMcpPrompt: "  mcp prompt  ",
    });

    expect(parts[0]).toBe("prompt:beast.txt");
    expect(parts[1]).toContain("Working directory: /repo/app");
    expect(parts[2]).toBe("follow repo conventions");
    expect(parts[3]).toBe("custom rules");
    expect(parts[4]).toBe("theme details");
    expect(parts[5]).toBe("supabase context");
    expect(parts[6]).toBe("mcp prompt");
  });

  it("readPromptFile reads the prompt from prompts/agent path", () => {
    readPromptFile("beast.txt");

    expect(fsMocks.readFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/prompts[\\/]+agent[\\/]+beast\.txt$/),
      "utf8",
    );
  });
});
