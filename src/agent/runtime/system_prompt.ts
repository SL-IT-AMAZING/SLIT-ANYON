import fs from "node:fs";
import path from "node:path";

import type { AgentConfig } from "./types";

export interface SystemPromptInput {
  modelProvider: string;
  modelId: string;
  agentConfig: AgentConfig;
  appPath: string;
  customRules?: string;
  themePrompt?: string;
  supabaseContext?: string;
  anyonMcpPrompt?: string;
}

const PROMPTS_DIR = path.join(__dirname, "../../prompts/agent");

function readPromptFile(fileName: string): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, fileName), "utf8").trim();
}

const PROMPTS = {
  anthropic: () => readPromptFile("anthropic.txt"),
  anthropicSpoof: () => readPromptFile("anthropic_spoof.txt"),
  beast: () => readPromptFile("beast.txt"),
  gemini: () => readPromptFile("gemini.txt"),
  qwen: () => readPromptFile("qwen.txt"),
  codexHeader: () => readPromptFile("codex_header.txt"),
  copilotGpt5: () => readPromptFile("copilot-gpt-5.txt"),
};

export function selectProviderPrompt(
  modelProvider: string,
  modelId: string,
): string {
  const provider = modelProvider.toLowerCase();
  const model = modelId.toLowerCase();

  if (provider.includes("anthropic") && model.includes("claude")) {
    return [PROMPTS.anthropicSpoof(), PROMPTS.anthropic()].join("\n\n");
  }
  if (
    provider.includes("google") ||
    provider.includes("gemini") ||
    model.includes("gemini")
  ) {
    return PROMPTS.gemini();
  }
  if (provider.includes("qwen") || model.includes("qwen")) {
    return PROMPTS.qwen();
  }
  if (provider.includes("copilot") && model.includes("gpt-5")) {
    return PROMPTS.copilotGpt5();
  }
  if (model.includes("gpt-5")) {
    return PROMPTS.codexHeader();
  }
  if (model.includes("gpt-") || model.includes("o1") || model.includes("o3")) {
    return PROMPTS.beast();
  }

  return PROMPTS.anthropic();
}

export function buildEnvironmentBlock(appPath: string): string {
  const isGitRepo = fs.existsSync(path.join(appPath, ".git"));

  return [
    "Here is some useful information about the environment you are running in:",
    "<env>",
    `  Working directory: ${appPath}`,
    `  Is directory a git repo: ${isGitRepo ? "yes" : "no"}`,
    `  Platform: ${process.platform}`,
    `  Today's date: ${new Date().toDateString()}`,
    "</env>",
  ].join("\n");
}

export function assembleSystemPrompt(input: SystemPromptInput): string[] {
  const parts: string[] = [];

  parts.push(selectProviderPrompt(input.modelProvider, input.modelId));
  parts.push(buildEnvironmentBlock(input.appPath));

  if (input.agentConfig.prompt?.trim()) {
    parts.push(input.agentConfig.prompt.trim());
  }
  if (input.customRules?.trim()) {
    parts.push(input.customRules.trim());
  }
  if (input.themePrompt?.trim()) {
    parts.push(input.themePrompt.trim());
  }
  if (input.supabaseContext?.trim()) {
    parts.push(input.supabaseContext.trim());
  }
  if (input.anyonMcpPrompt?.trim()) {
    parts.push(input.anyonMcpPrompt.trim());
  }

  return parts;
}
