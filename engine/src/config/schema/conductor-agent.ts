import { z } from "zod";

export const EulerAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
});

export type EulerAgentConfig = z.infer<typeof EulerAgentConfigSchema>;
