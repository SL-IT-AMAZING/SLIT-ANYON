import type { OpenCodeAgent } from "@/ipc/utils/opencode_api";

import type { AgentConfig } from "./types";

export const NATIVE_AGENTS: AgentConfig[] = [
  {
    name: "Sisyphus",
    description: "Full-featured coding agent with all tools",
    steps: 100,
    tools: [
      "read",
      "write",
      "edit",
      "bash",
      "glob",
      "grep",
      "list",
      "todoread",
      "todowrite",
      "websearch",
      "webfetch",
      "codesearch",
      "apply_patch",
      "question",
    ],
    mode: "primary",
    color: "#6366f1",
  },
  {
    name: "Hephaestus",
    description: "Code-focused builder",
    steps: 100,
    tools: [
      "read",
      "write",
      "edit",
      "bash",
      "glob",
      "grep",
      "list",
      "apply_patch",
    ],
    mode: "primary",
    color: "#ef4444",
  },
  {
    name: "Atlas",
    description: "Read-only explorer and planner",
    steps: 20,
    tools: ["read", "glob", "grep", "list", "bash", "todoread", "todowrite"],
    mode: "primary",
    color: "#22c55e",
  },
];

export function getDefaultAgent(): AgentConfig {
  return NATIVE_AGENTS[0];
}

export function findNativeAgent(name: string): AgentConfig | undefined {
  return NATIVE_AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

export function getNativeAgents(): OpenCodeAgent[] {
  return NATIVE_AGENTS.filter((a) => a.mode !== "subagent").map((a) => ({
    name: a.name,
    description: a.description,
    mode: a.mode,
    native: true,
    color: a.color,
  }));
}
