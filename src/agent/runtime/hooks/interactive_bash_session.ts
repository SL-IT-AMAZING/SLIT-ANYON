/**
 * Interactive Bash Session Hook — Manages tmux session state.
 *
 * Before a tool execution that involves interactive_bash or tmux,
 * this hook tracks active tmux sessions so the runtime can manage
 * their lifecycle and avoid orphaned sessions.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:interactive-bash-session");

/** Typed view of the input for tool execution. */
interface BashInput {
  toolName?: string;
  toolInput?: {
    tmux_command?: string;
    command?: string;
  };
}

/** Typed view of the output we may mutate. */
interface BashOutput {
  activeTmuxSessions?: string[];
  tmuxSessionCreated?: string;
}

/**
 * Track active tmux sessions per agent session.
 * Keyed by sessionId → set of tmux session names.
 */
const activeSessions = new Map<string, Set<string>>();

/** Extract a tmux session name from a tmux command string. */
function extractSessionName(tmuxCommand: string): string | null {
  // Match patterns like: "new-session -d -s my-session"
  const newSessionMatch = tmuxCommand.match(/new-session\s+.*-s\s+(\S+)/);
  if (newSessionMatch) return newSessionMatch[1];

  // Match patterns like: "send-keys -t my-session"
  const targetMatch = tmuxCommand.match(/-t\s+(\S+)/);
  if (targetMatch) return targetMatch[1].split(":")[0]; // Strip window/pane

  return null;
}

/** Check if a tmux command creates a new session. */
function isNewSession(tmuxCommand: string): boolean {
  return tmuxCommand.includes("new-session");
}

/** Check if a tmux command kills a session. */
function isKillSession(tmuxCommand: string): boolean {
  return (
    tmuxCommand.includes("kill-session") || tmuxCommand.includes("kill-server")
  );
}

export function registerInteractiveBashSessionHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as BashInput;
    const toolName = inp.toolName?.toLowerCase();

    // Only handle interactive_bash / tmux tools
    if (
      toolName !== "interactive_bash" &&
      toolName !== "tmux" &&
      toolName !== "mcp_interactive_bash"
    ) {
      return;
    }

    const tmuxCommand = inp.toolInput?.tmux_command ?? inp.toolInput?.command;
    if (typeof tmuxCommand !== "string") return;

    const sessionName = extractSessionName(tmuxCommand);
    if (!sessionName) return;

    // Get or create session tracker for this agent session
    let sessions = activeSessions.get(ctx.sessionId);
    if (!sessions) {
      sessions = new Set();
      activeSessions.set(ctx.sessionId, sessions);
    }

    if (isNewSession(tmuxCommand)) {
      sessions.add(sessionName);
      const out = output as BashOutput;
      out.tmuxSessionCreated = sessionName;
      logger.log(
        `[${ctx.sessionId}] Tracking new tmux session: ${sessionName}`,
      );
    } else if (isKillSession(tmuxCommand)) {
      sessions.delete(sessionName);
      logger.log(`[${ctx.sessionId}] Removed tmux session: ${sessionName}`);
    }

    const out = output as BashOutput;
    out.activeTmuxSessions = [...sessions];
  };

  registry.register(
    "tool.execute.before",
    "interactive-bash-session",
    handler,
    40,
    "session",
  );
}
