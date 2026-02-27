/**
 * Auto Slash Command Hook — Auto-detects and parses /commands from messages.
 *
 * Checks if an incoming user message starts with a "/" and parses it
 * into a command name and arguments. The parsed command is placed into
 * the output for the runtime to dispatch.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:auto-slash-command");

/** Known slash commands that this hook recognizes. */
const KNOWN_COMMANDS = new Set([
  "plan",
  "review",
  "sisyphus",
  "ultrawork",
  "deepsearch",
  "analyze",
  "ralph-loop",
  "cancel-ralph",
  "start-work",
  "handoff",
  "refactor",
  "init-deep",
  "orchestrator",
  "prometheus",
  "remember-learnings",
]);

/** Typed view of the input from a chat message. */
interface CommandInput {
  message?: string;
  content?: string;
}

/** Typed view of the output we may mutate. */
interface CommandOutput {
  slashCommand?: {
    name: string;
    args: string;
    raw: string;
  };
  isSlashCommand?: boolean;
}

/** Parse a slash command from a message string. */
function parseSlashCommand(
  message: string,
): { name: string; args: string } | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("/")) return null;

  // Extract command name (everything after / until first space)
  const spaceIdx = trimmed.indexOf(" ", 1);
  const name =
    spaceIdx === -1
      ? trimmed.slice(1).toLowerCase()
      : trimmed.slice(1, spaceIdx).toLowerCase();

  if (!name) return null;

  // Only recognize known commands
  if (!KNOWN_COMMANDS.has(name)) return null;

  const args = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

  return { name, args };
}

export function registerAutoSlashCommandHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as CommandInput;
    const text = inp.message ?? inp.content;

    if (typeof text !== "string") return;

    const parsed = parseSlashCommand(text);
    if (!parsed) return;

    logger.log(
      `[${ctx.sessionId}] Detected slash command: /${parsed.name} ${parsed.args ? `(args: ${parsed.args.slice(0, 50)})` : "(no args)"}`,
    );

    const out = output as CommandOutput;
    out.isSlashCommand = true;
    out.slashCommand = {
      name: parsed.name,
      args: parsed.args,
      raw: text,
    };
  };

  registry.register(
    "chat.message",
    "auto-slash-command",
    handler,
    25,
    "global",
  );
}
