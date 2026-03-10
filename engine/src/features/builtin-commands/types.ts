import type { CommandDefinition } from "../claude-code-command-loader";

export type BuiltinCommandName =
  | "init-deep"
  | "persist-loop"
  | "cancel-persist"
  | "anyon-loop"
  | "refactor"
  | "start-work"
  | "stop-continuation"
  | "handoff";

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[];
}

export type BuiltinCommands = Record<string, CommandDefinition>;
