/**
 * Directory README Injector Hook — Injects README.md from the project dir.
 *
 * Reads README.md from `ctx.directory` and injects its content
 * so the agent has project overview context available.
 */
import fs from "node:fs";
import path from "node:path";

import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:directory-readme-injector");

/** Typed view of the output we may mutate. */
interface MessagesOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Maximum README size to inject (to avoid blowing up the context). */
const MAX_README_SIZE = 8_000;

export function registerDirectoryReadmeInjectorHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (_input, output, ctx) => {
    if (!ctx.directory) return;

    const readmePath = path.join(ctx.directory, "README.md");
    let content: string;

    try {
      content = fs.readFileSync(readmePath, "utf-8").trim();
    } catch {
      // No README — nothing to inject
      return;
    }

    if (!content) return;

    // Truncate overly large READMEs to avoid context bloat
    if (content.length > MAX_README_SIZE) {
      content = content.slice(0, MAX_README_SIZE) + "\n\n... (truncated)";
    }

    const out = output as MessagesOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content: `Project README from: ${ctx.directory}/README.md\n${content}`,
    });

    logger.log(
      `[${ctx.sessionId}] Injected README.md (${content.length} chars)`,
    );
  };

  registry.register(
    "messages.transform",
    "directory-readme-injector",
    handler,
    16,
    "global",
  );
}
