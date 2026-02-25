/**
 * Config Loader — reads ~/.config/opencode/oh-my-opencode.json
 *
 * Compatible with OMO's Zod schema. Falls back gracefully on missing
 * or malformed file. Caches the parsed config until explicitly invalidated.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import log from "electron-log";
import { z } from "zod";

const logger = log.scope("config-loader");

// ---------------------------------------------------------------------------
// Zod schemas — ported from oh-my-opencode/src/config/schema.ts
// Only the subset needed for agent runtime. Full OMO schema can be expanded
// incrementally as later phases require more fields.
// ---------------------------------------------------------------------------

const PermissionValue = z.enum(["ask", "allow", "deny"]);
const BashPermission = z.union([
  PermissionValue,
  z.record(z.string(), PermissionValue),
]);

const AgentPermissionSchema = z.object({
  edit: PermissionValue.optional(),
  bash: BashPermission.optional(),
  webfetch: PermissionValue.optional(),
  doom_loop: PermissionValue.optional(),
  external_directory: PermissionValue.optional(),
});

export const AgentOverrideConfigSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  permission: AgentPermissionSchema.optional(),
});

export const AgentOverridesSchema = z.object({
  build: AgentOverrideConfigSchema.optional(),
  plan: AgentOverrideConfigSchema.optional(),
  Sisyphus: AgentOverrideConfigSchema.optional(),
  "Sisyphus-Junior": AgentOverrideConfigSchema.optional(),
  "OpenCode-Builder": AgentOverrideConfigSchema.optional(),
  "Prometheus (Planner)": AgentOverrideConfigSchema.optional(),
  "Metis (Plan Consultant)": AgentOverrideConfigSchema.optional(),
  "Momus (Plan Reviewer)": AgentOverrideConfigSchema.optional(),
  oracle: AgentOverrideConfigSchema.optional(),
  librarian: AgentOverrideConfigSchema.optional(),
  explore: AgentOverrideConfigSchema.optional(),
  "multimodal-looker": AgentOverrideConfigSchema.optional(),
  Atlas: AgentOverrideConfigSchema.optional(),
});

export const CategoryConfigSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional(),
  thinking: z
    .object({
      type: z.enum(["enabled", "disabled"]),
      budgetTokens: z.number().optional(),
    })
    .optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
  textVerbosity: z.enum(["low", "medium", "high"]).optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  prompt_append: z.string().optional(),
  is_unstable_agent: z.boolean().optional(),
});

export const CategoriesConfigSchema = z.record(
  z.string(),
  CategoryConfigSchema,
);

export const SisyphusAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
});

export const ClaudeCodeConfigSchema = z.object({
  mcp: z.boolean().optional(),
  commands: z.boolean().optional(),
  skills: z.boolean().optional(),
  agents: z.boolean().optional(),
  hooks: z.boolean().optional(),
  plugins: z.boolean().optional(),
  plugins_override: z.record(z.string(), z.boolean()).optional(),
});

export const RalphLoopConfigSchema = z.object({
  enabled: z.boolean().default(false),
  default_max_iterations: z.number().min(1).max(1000).default(100),
  state_dir: z.string().optional(),
});

export const BackgroundTaskConfigSchema = z.object({
  defaultConcurrency: z.number().min(1).optional(),
  providerConcurrency: z.record(z.string(), z.number().min(1)).optional(),
  modelConcurrency: z.record(z.string(), z.number().min(1)).optional(),
  staleTimeoutMs: z.number().min(60000).optional(),
});

export const ExperimentalConfigSchema = z.object({
  aggressive_truncation: z.boolean().optional(),
  auto_resume: z.boolean().optional(),
  truncate_all_tool_outputs: z.boolean().optional(),
});

export const NotificationConfigSchema = z.object({
  force_enable: z.boolean().optional(),
});

export const GitMasterConfigSchema = z.object({
  commit_footer: z.boolean().default(true),
  include_co_authored_by: z.boolean().default(true),
});

export const SkillDefinitionSchema = z.object({
  description: z.string().optional(),
  template: z.string().optional(),
  from: z.string().optional(),
  model: z.string().optional(),
  agent: z.string().optional(),
  subtask: z.boolean().optional(),
  "argument-hint": z.string().optional(),
  license: z.string().optional(),
  compatibility: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  "allowed-tools": z.array(z.string()).optional(),
  disable: z.boolean().optional(),
});

const SkillEntrySchema = z.union([z.boolean(), SkillDefinitionSchema]);

const SkillSourceSchema = z.union([
  z.string(),
  z.object({
    path: z.string(),
    recursive: z.boolean().optional(),
    glob: z.string().optional(),
  }),
]);

export const SkillsConfigSchema = z.union([
  z.array(z.string()),
  z
    .record(z.string(), SkillEntrySchema)
    .and(
      z
        .object({
          sources: z.array(SkillSourceSchema).optional(),
          enable: z.array(z.string()).optional(),
          disable: z.array(z.string()).optional(),
        })
        .partial(),
    ),
]);

export const HookNameSchema = z.enum([
  "todo-continuation-enforcer",
  "context-window-monitor",
  "session-recovery",
  "session-notification",
  "comment-checker",
  "grep-output-truncator",
  "tool-output-truncator",
  "directory-agents-injector",
  "directory-readme-injector",
  "empty-task-response-detector",
  "think-mode",
  "anthropic-context-window-limit-recovery",
  "rules-injector",
  "background-notification",
  "auto-update-checker",
  "startup-toast",
  "keyword-detector",
  "agent-usage-reminder",
  "non-interactive-env",
  "interactive-bash-session",
  "thinking-block-validator",
  "ralph-loop",
  "compaction-context-injector",
  "claude-code-hooks",
  "auto-slash-command",
  "edit-error-recovery",
  "delegate-task-retry",
  "prometheus-md-only",
  "start-work",
  "atlas",
]);

export const BuiltinAgentNameSchema = z.enum([
  "Sisyphus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "Metis (Plan Consultant)",
  "Momus (Plan Reviewer)",
  "Atlas",
]);

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "frontend-ui-ux",
  "git-master",
]);

export const BuiltinCommandNameSchema = z.enum(["init-deep", "start-work"]);

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------

export const OhMyOpenCodeConfigSchema = z.object({
  $schema: z.string().optional(),
  disabled_mcps: z.array(z.string()).optional(),
  disabled_agents: z.array(BuiltinAgentNameSchema).optional(),
  disabled_skills: z.array(BuiltinSkillNameSchema).optional(),
  disabled_hooks: z.array(HookNameSchema).optional(),
  disabled_commands: z.array(BuiltinCommandNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesConfigSchema.optional(),
  claude_code: ClaudeCodeConfigSchema.optional(),
  sisyphus_agent: SisyphusAgentConfigSchema.optional(),
  experimental: ExperimentalConfigSchema.optional(),
  auto_update: z.boolean().optional(),
  skills: SkillsConfigSchema.optional(),
  ralph_loop: RalphLoopConfigSchema.optional(),
  background_task: BackgroundTaskConfigSchema.optional(),
  notification: NotificationConfigSchema.optional(),
  git_master: GitMasterConfigSchema.optional(),
});

export type OhMyOpenCodeConfig = z.infer<typeof OhMyOpenCodeConfigSchema>;
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type CategoriesConfig = z.infer<typeof CategoriesConfigSchema>;
export type HookName = z.infer<typeof HookNameSchema>;
export type BackgroundTaskConfig = z.infer<typeof BackgroundTaskConfigSchema>;
export type RalphLoopConfig = z.infer<typeof RalphLoopConfigSchema>;
export type GitMasterConfig = z.infer<typeof GitMasterConfigSchema>;
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>;

// ---------------------------------------------------------------------------
// Config loader
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), ".config", "opencode");
const CONFIG_FILENAME = "oh-my-opencode.json";

let _cachedConfig: OhMyOpenCodeConfig | null = null;
let _cachedConfigPath: string | null = null;

/**
 * Resolve the config file path.
 * Allows override via `ANYON_OMO_CONFIG` env var for testing.
 */
export function getConfigPath(): string {
  return (
    process.env.ANYON_OMO_CONFIG ??
    path.join(DEFAULT_CONFIG_DIR, CONFIG_FILENAME)
  );
}

/**
 * Load and parse the OMO config file.
 * Returns a valid config or a default empty config on failure.
 * Result is cached until `invalidateConfigCache()` is called.
 */
export function loadOmoConfig(configPath?: string): OhMyOpenCodeConfig {
  const resolvedPath = configPath ?? getConfigPath();

  // Return cached if path matches
  if (_cachedConfig && _cachedConfigPath === resolvedPath) {
    return _cachedConfig;
  }

  try {
    if (!fs.existsSync(resolvedPath)) {
      logger.log(`OMO config not found at ${resolvedPath} — using defaults`);
      _cachedConfig = {};
      _cachedConfigPath = resolvedPath;
      return _cachedConfig;
    }

    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw);
    const result = OhMyOpenCodeConfigSchema.safeParse(parsed);

    if (result.success) {
      logger.log(`Loaded OMO config from ${resolvedPath}`);
      _cachedConfig = result.data;
    } else {
      logger.warn(
        `OMO config validation errors at ${resolvedPath}:`,
        result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      );
      // Use the raw parsed data anyway — Zod passthrough-like behavior
      // so partially valid configs still work
      _cachedConfig = parsed as OhMyOpenCodeConfig;
    }
  } catch (err) {
    logger.error(
      `Failed to load OMO config from ${resolvedPath}:`,
      err instanceof Error ? err.message : err,
    );
    _cachedConfig = {};
  }

  _cachedConfigPath = resolvedPath;
  return _cachedConfig;
}

/** Invalidate the cached config (forces re-read on next `loadOmoConfig()`). */
export function invalidateConfigCache(): void {
  _cachedConfig = null;
  _cachedConfigPath = null;
}

/** Get a specific agent override from config. */
export function getAgentOverride(
  config: OhMyOpenCodeConfig,
  agentName: string,
): AgentOverrideConfig | undefined {
  if (!config.agents) return undefined;
  return (config.agents as Record<string, AgentOverrideConfig | undefined>)[
    agentName
  ];
}

/** Get a specific category config. */
export function getCategoryConfig(
  config: OhMyOpenCodeConfig,
  categoryName: string,
): CategoryConfig | undefined {
  return config.categories?.[categoryName];
}

/** Check if a hook is disabled in config. */
export function isHookDisabled(
  config: OhMyOpenCodeConfig,
  hookName: string,
): boolean {
  return config.disabled_hooks?.includes(hookName as HookName) ?? false;
}
