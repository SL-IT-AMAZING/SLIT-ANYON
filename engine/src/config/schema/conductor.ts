import { z } from "zod";

export const EulerTasksConfigSchema = z.object({
  /** Absolute or relative storage path override. When set, bypasses global config dir. */
  storage_path: z.string().optional(),
  /** Force task list ID (alternative to env TURBO_TASK_LIST_ID) */
  task_list_id: z.string().optional(),
  /** Enable Claude Code path compatibility mode */
  claude_code_compat: z.boolean().default(false),
});

export const EulerConfigSchema = z.object({
  tasks: EulerTasksConfigSchema.optional(),
});

export type EulerTasksConfig = z.infer<typeof EulerTasksConfigSchema>;
export type EulerConfig = z.infer<typeof EulerConfigSchema>;
