/**
 * Directory Agents Injector Hook — Injects hierarchical AGENTS.md files.
 *
 * Walks the directory tree from the project root upward and inward,
 * looking for AGENTS.md files at each level. Found content is injected
 * as instructions so agents respect per-directory coding guidelines.
 */
import fs from "node:fs";
import path from "node:path";

import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:directory-agents-injector");

/** Typed view of the output we may mutate. */
interface MessagesOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Maximum depth to walk when searching for AGENTS.md files. */
const MAX_WALK_DEPTH = 5;

/**
 * Walk from `startDir` upwards to the filesystem root, collecting
 * AGENTS.md files found along the way. Stops after MAX_WALK_DEPTH levels
 * or at the root.
 */
function collectAgentsFiles(
  startDir: string,
): Array<{ dirPath: string; content: string }> {
  const results: Array<{ dirPath: string; content: string }> = [];
  let current = path.resolve(startDir);
  let depth = 0;

  while (depth < MAX_WALK_DEPTH) {
    const agentsPath = path.join(current, "AGENTS.md");
    try {
      const content = fs.readFileSync(agentsPath, "utf-8").trim();
      if (content) {
        results.push({ dirPath: current, content });
      }
    } catch {
      // File not found — continue walking
    }

    const parent = path.dirname(current);
    if (parent === current) break; // Reached filesystem root
    current = parent;
    depth++;
  }

  // Reverse so outermost (root) AGENTS.md comes first
  return results.reverse();
}

export function registerDirectoryAgentsInjectorHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (_input, output, ctx) => {
    if (!ctx.directory) return;

    const agentsFiles = collectAgentsFiles(ctx.directory);
    if (agentsFiles.length === 0) return;

    const out = output as MessagesOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    for (const { dirPath, content } of agentsFiles) {
      out.injectedMessages.push({
        role: "system",
        content: `Instructions from: ${dirPath}/AGENTS.md\n${content}`,
      });
    }

    logger.log(
      `[${ctx.sessionId}] Injected ${agentsFiles.length} AGENTS.md file(s)`,
    );
  };

  registry.register(
    "messages.transform",
    "directory-agents-injector",
    handler,
    15,
    "global",
  );
}
