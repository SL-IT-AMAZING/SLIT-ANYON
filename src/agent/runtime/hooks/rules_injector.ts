/**
 * Rules Injector Hook — Reads AGENTS.md + CLAUDE.md and injects as context.
 *
 * Scans the project directory for:
 *   - AGENTS.md (project root)
 *   - .claude/CLAUDE.md (project-level Claude config)
 *   - ~/.claude/CLAUDE.md (user-level Claude config)
 *
 * Found content is prepended to the messages array so the agent
 * always has access to project-specific rules and configuration.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:rules-injector");

/** Typed view of the output we may mutate. */
interface MessagesOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Safely read a file, returning empty string on failure. */
function safeReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    // File doesn't exist or is unreadable — that's fine
    return "";
  }
}

/** Build the set of rule files to check for a given project directory. */
function getRuleFilePaths(
  projectDir: string,
): Array<{ label: string; filePath: string }> {
  const homeDir = os.homedir();

  return [
    {
      label: "AGENTS.md",
      filePath: path.join(projectDir, "AGENTS.md"),
    },
    {
      label: ".claude/CLAUDE.md (project)",
      filePath: path.join(projectDir, ".claude", "CLAUDE.md"),
    },
    {
      label: "~/.claude/CLAUDE.md (user)",
      filePath: path.join(homeDir, ".claude", "CLAUDE.md"),
    },
  ];
}

export function registerRulesInjectorHook(registry: HookRegistry): void {
  const handler: HookHandler = async (_input, output, ctx) => {
    const ruleFiles = getRuleFilePaths(ctx.directory);
    const out = output as MessagesOutput;

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    let injected = 0;
    for (const { label, filePath } of ruleFiles) {
      const content = safeReadFile(filePath);
      if (!content) continue;

      out.injectedMessages.push({
        role: "system",
        content: `Instructions from: ${label}\n${content}`,
      });
      injected++;
    }

    if (injected > 0) {
      logger.log(
        `[${ctx.sessionId}] Injected ${injected} rule file(s) from ${ctx.directory}`,
      );
    }
  };

  registry.register(
    "messages.transform",
    "rules-injector",
    handler,
    10,
    "global",
  );
}
