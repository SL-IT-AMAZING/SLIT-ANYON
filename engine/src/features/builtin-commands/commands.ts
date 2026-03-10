import type { CommandDefinition } from "../claude-code-command-loader";
import { HANDOFF_TEMPLATE } from "./templates/handoff";
import { INIT_DEEP_TEMPLATE } from "./templates/init-deep";
import {
  CANCEL_PERSIST_TEMPLATE,
  PERSIST_LOOP_TEMPLATE,
} from "./templates/persist-loop";
import { REFACTOR_TEMPLATE } from "./templates/refactor";
import { START_WORK_TEMPLATE } from "./templates/start-work";
import { STOP_CONTINUATION_TEMPLATE } from "./templates/stop-continuation";
import type { BuiltinCommandName, BuiltinCommands } from "./types";

const BUILTIN_COMMAND_DEFINITIONS: Record<
  BuiltinCommandName,
  Omit<CommandDefinition, "name">
> = {
  "init-deep": {
    description: "(builtin) Initialize hierarchical AGENTS.md knowledge base",
    template: `<command-instruction>
${INIT_DEEP_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[--create-new] [--max-depth=N]",
  },
  "persist-loop": {
    description:
      "(builtin) Start self-referential development loop until completion",
    template: `<command-instruction>
${PERSIST_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
    argumentHint:
      '"task description" [--completion-promise=TEXT] [--max-iterations=N] [--strategy=reset|continue]',
  },
  "anyon-loop": {
    description:
      "(builtin) Start turbo loop - continues until completion with turbo mode",
    template: `<command-instruction>
${PERSIST_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
    argumentHint:
      '"task description" [--completion-promise=TEXT] [--max-iterations=N] [--strategy=reset|continue]',
  },
  "cancel-persist": {
    description: "(builtin) Cancel active Persist Loop",
    template: `<command-instruction>
${CANCEL_PERSIST_TEMPLATE}
</command-instruction>`,
  },
  refactor: {
    description:
      "(builtin) Intelligent refactoring command with LSP, AST-grep, architecture analysis, codemap, and TDD verification.",
    template: `<command-instruction>
${REFACTOR_TEMPLATE}
</command-instruction>`,
    argumentHint:
      "<refactoring-target> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]",
  },
  "start-work": {
    description: "(builtin) Start Conductor work session from Strategist plan",
    agent: "taskmaster",
    template: `<command-instruction>
${START_WORK_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[plan-name]",
  },
  "stop-continuation": {
    description:
      "(builtin) Stop all continuation mechanisms (persist loop, todo continuation, thesis) for this session",
    template: `<command-instruction>
${STOP_CONTINUATION_TEMPLATE}
</command-instruction>`,
  },
  handoff: {
    description:
      "(builtin) Create a detailed context summary for continuing work in a new session",
    template: `<command-instruction>
${HANDOFF_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[goal]",
  },
};

// Legacy command aliases (kept for 1 major version)
const LEGACY_COMMAND_ALIASES: Record<string, BuiltinCommandName> = {
  "ralph-loop": "persist-loop",
  "cancel-ralph": "cancel-persist",
  "ulw-loop": "anyon-loop",
};

export function loadBuiltinCommands(
  disabledCommands?: BuiltinCommandName[],
): BuiltinCommands {
  const disabled = new Set(disabledCommands ?? []);
  const commands: BuiltinCommands = {};

  for (const [name, definition] of Object.entries(
    BUILTIN_COMMAND_DEFINITIONS,
  )) {
    if (!disabled.has(name as BuiltinCommandName)) {
      const { argumentHint: _argumentHint, ...openCodeCompatible } = definition;
      commands[name] = { ...openCodeCompatible, name } as CommandDefinition;
    }
  }

  for (const [alias, target] of Object.entries(LEGACY_COMMAND_ALIASES)) {
    const targetDef = BUILTIN_COMMAND_DEFINITIONS[target];
    if (targetDef && !disabled.has(target)) {
      const { argumentHint: _argumentHint, ...openCodeCompatible } = targetDef;
      commands[alias] = {
        ...openCodeCompatible,
        name: alias,
      } as CommandDefinition;
    }
  }

  return commands;
}
