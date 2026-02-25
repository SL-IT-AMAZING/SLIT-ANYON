import type { CommandDescriptor } from "../commands/types";
import type { AgentVariant } from "../shared/agent_variant";
import type { SkillDescriptor } from "../skills/types";
import type { AgentDescriptor } from "./types";

/**
 * Context needed to build the Sisyphus system prompt dynamically.
 */
export interface SisyphusPromptContext {
  skills: SkillDescriptor[];
  commands: CommandDescriptor[];
  agents: AgentDescriptor[];
  variant: AgentVariant;
  projectDir: string;
}

/**
 * Build the dynamic portion of the Sisyphus system prompt.
 *
 * This generates XML-tagged sections that are appended to the base
 * system prompt loaded from `prompts/omo-agents/sisyphus.txt`.
 * Sections include available skills, commands, agents, variant, and project dir.
 */
export function buildSisyphusPrompt(ctx: SisyphusPromptContext): string {
  const sections: string[] = [];

  // 1. Available skills section
  if (ctx.skills.length > 0) {
    const skillList = ctx.skills
      .map(
        (s) =>
          `  - ${s.name}: ${s.description} (${s.scope}${s.hasMcp ? ", has MCP" : ""})`,
      )
      .join("\n");
    sections.push(`<available_skills>\n${skillList}\n</available_skills>`);
  }

  // 2. Available commands section
  if (ctx.commands.length > 0) {
    const cmdList = ctx.commands
      .map((c) => `  - /${c.name}: ${c.description} (${c.scope})`)
      .join("\n");
    sections.push(`<available_commands>\n${cmdList}\n</available_commands>`);
  }

  // 3. Available agents section
  if (ctx.agents.length > 0) {
    const agentList = ctx.agents
      .map((a) => `| ${a.name} | ${a.description} | ${a.cost} |`)
      .join("\n");
    sections.push(
      [
        "<available_agents>",
        "| Agent | Description | Cost |",
        "|-------|-------------|------|",
        agentList,
        "</available_agents>",
      ].join("\n"),
    );
  }

  // 4. Current variant
  sections.push(`<agent_variant>${ctx.variant}</agent_variant>`);

  // 5. Project directory
  sections.push(`<project_directory>${ctx.projectDir}</project_directory>`);

  return sections.join("\n\n");
}

/**
 * Combine the base prompt (from file) with the dynamic context sections.
 */
export function assembleSisyphusSystemPrompt(
  basePrompt: string,
  ctx: SisyphusPromptContext,
): string {
  const dynamicSections = buildSisyphusPrompt(ctx);
  return `${basePrompt}\n\n${dynamicSections}`;
}
