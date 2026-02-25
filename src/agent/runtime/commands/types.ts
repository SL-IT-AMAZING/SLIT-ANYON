/**
 * Command system types for OMO native port.
 * Slash commands are discovered from disk + builtins and executed via CommandRegistry.
 */

export interface Command {
  name: string; // e.g., "sisyphus" (without leading /)
  description: string;
  scope: "user" | "project" | "builtin";
  path?: string; // File path (for disk commands)
  template?: string; // Command template content (markdown)
  execute?: (args: string, ctx: CommandContext) => Promise<string>;
}

export interface CommandContext {
  chatId: number;
  sessionId: number;
  appPath: string;
  // These will be populated later when we wire up Sprint 2
  // For now, they're optional to avoid circular dependencies
}

export interface CommandDescriptor {
  name: string;
  description: string;
  scope: string;
}

export interface ParsedCommand {
  command: string; // command name without /
  args: string; // everything after the command name
}
