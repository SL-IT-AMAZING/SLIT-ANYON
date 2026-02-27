import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import log from "electron-log";
import { BUILTIN_COMMANDS } from "./builtin_commands";
import type {
  Command,
  CommandContext,
  CommandDescriptor,
  ParsedCommand,
} from "./types";

const logger = log.scope("command-registry");

export class CommandRegistry {
  private commands = new Map<string, Command>();

  /** Discovery from disk + builtins */
  async discover(projectDir: string): Promise<void> {
    // 1. Register builtins first
    for (const cmd of BUILTIN_COMMANDS) {
      this.commands.set(cmd.name.toLowerCase(), cmd);
    }

    // 2. Scan disk paths (user-level, then project-level so project overrides user)
    const discoveryPaths = [
      {
        basePath: path.join(os.homedir(), ".claude", "commands"),
        scope: "user" as const,
      },
      {
        basePath: path.join(projectDir, ".claude", "commands"),
        scope: "project" as const,
      },
    ];

    for (const { basePath, scope } of discoveryPaths) {
      await this.scanDirectory(basePath, scope);
    }

    logger.info(`Discovered ${this.commands.size} commands`);
  }

  /** Register a command programmatically */
  register(command: Command): void {
    this.commands.set(command.name.toLowerCase(), command);
  }

  /** Parse user input for slash command */
  parseCommand(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith("/")) return null;

    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) {
      return { command: trimmed.slice(1).toLowerCase(), args: "" };
    }
    return {
      command: trimmed.slice(1, spaceIdx).toLowerCase(),
      args: trimmed.slice(spaceIdx + 1).trim(),
    };
  }

  /** Execute a command by name */
  async execute(
    name: string,
    args: string,
    ctx: CommandContext,
  ): Promise<string> {
    const cmd = this.commands.get(name.toLowerCase());
    if (!cmd) {
      const available = this.list()
        .map((c) => `/${c.name}`)
        .join(", ");
      return `Unknown command: /${name}. Available commands: ${available}`;
    }

    if (cmd.execute) {
      return cmd.execute(args, ctx);
    }

    // Template-based command: return the template content
    if (cmd.template) {
      return cmd.template;
    }

    return `Command /${name} has no handler or template.`;
  }

  /** Get a command by name */
  get(name: string): Command | undefined {
    return this.commands.get(name.toLowerCase());
  }

  /** List all commands as descriptors */
  list(): CommandDescriptor[] {
    return [...this.commands.values()].map((c) => ({
      name: c.name,
      description: c.description,
      scope: c.scope,
    }));
  }

  private async scanDirectory(
    basePath: string,
    scope: Command["scope"],
  ): Promise<void> {
    if (!fs.existsSync(basePath)) return;

    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

        try {
          const filePath = path.join(basePath, entry.name);
          const content = fs.readFileSync(filePath, "utf-8");
          const name = path.basename(entry.name, ".md");

          // Override builtin if same name (project/user commands take priority)
          this.commands.set(name.toLowerCase(), {
            name,
            description:
              this.extractDescription(content) ?? `Custom command: ${name}`,
            scope,
            path: filePath,
            template: content,
          });
        } catch (err) {
          logger.warn(
            `Failed to load command ${entry.name}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    } catch (err) {
      logger.debug(
        `Cannot scan ${basePath}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  private extractDescription(content: string): string | undefined {
    // Try to extract description from first line or frontmatter
    const firstLine = content.split("\n")[0]?.trim();
    if (
      firstLine &&
      !firstLine.startsWith("#") &&
      !firstLine.startsWith("---")
    ) {
      return firstLine.slice(0, 100);
    }
    return undefined;
  }
}
