/**
 * Skill system types for OMO native port.
 */

export interface Skill {
  name: string;
  description: string;
  content: string; // Markdown prompt content
  scope: "user" | "project" | "global" | "opencode" | "builtin";
  path?: string; // File path (for disk skills)
  mcp?: SkillMcpConfig; // Optional MCP server
  metadata?: Record<string, string>;
}

export interface SkillMcpConfig {
  name: string; // MCP server name
  command: string; // e.g., "npx"
  args: string[]; // e.g., ["-y", "@playwright/mcp"]
  env?: Record<string, string>;
}

export interface SkillDescriptor {
  name: string;
  description: string;
  scope: string;
  hasMcp: boolean;
}
