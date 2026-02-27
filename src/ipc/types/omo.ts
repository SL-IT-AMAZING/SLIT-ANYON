import { z } from "zod";
import {
  createClient,
  createEventClient,
  defineContract,
  defineEvent,
} from "../contracts/core";

export const OmoAgentInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(["primary", "subagent"]),
  modelId: z.string(),
  icon: z.string().optional(),
});
export type OmoAgentInfo = z.infer<typeof OmoAgentInfoSchema>;

export const OmoBackgroundTaskSchema = z.object({
  taskId: z.string(),
  agentName: z.string(),
  description: z.string(),
  status: z.enum(["pending", "running", "completed", "error", "cancelled"]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
});
export type OmoBackgroundTask = z.infer<typeof OmoBackgroundTaskSchema>;

export const OmoSkillInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  scope: z.enum(["builtin", "user", "project", "opencode"]),
  active: z.boolean(),
});
export type OmoSkillInfo = z.infer<typeof OmoSkillInfoSchema>;

export const OmoCommandInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  scope: z.enum(["builtin", "user", "project"]),
});
export type OmoCommandInfo = z.infer<typeof OmoCommandInfoSchema>;

export const omoContracts = {
  listAgents: defineContract({
    channel: "omo:agent:list",
    input: z.object({}),
    output: z.array(OmoAgentInfoSchema),
  }),

  selectAgent: defineContract({
    channel: "omo:agent:select",
    input: z.object({ chatId: z.number(), agentId: z.string() }),
    output: z.object({ success: z.boolean() }),
  }),

  listBackgroundTasks: defineContract({
    channel: "omo:background:list",
    input: z.object({ chatId: z.number() }),
    output: z.array(OmoBackgroundTaskSchema),
  }),

  getBackgroundOutput: defineContract({
    channel: "omo:background:output",
    input: z.object({ taskId: z.string() }),
    output: z.object({ output: z.string().nullable() }),
  }),

  cancelBackgroundTask: defineContract({
    channel: "omo:background:cancel",
    input: z.object({ taskId: z.string() }),
    output: z.object({ success: z.boolean() }),
  }),

  listSkills: defineContract({
    channel: "omo:skill:list",
    input: z.object({ projectDir: z.string().optional() }),
    output: z.array(OmoSkillInfoSchema),
  }),

  loadSkill: defineContract({
    channel: "omo:skill:load",
    input: z.object({ skillName: z.string() }),
    output: z.object({ success: z.boolean() }),
  }),

  listCommands: defineContract({
    channel: "omo:command:list",
    input: z.object({}),
    output: z.array(OmoCommandInfoSchema),
  }),
} as const;

export const omoEvents = {
  backgroundTaskUpdate: defineEvent({
    channel: "omo:background:task-update",
    payload: OmoBackgroundTaskSchema,
  }),
} as const;

export const omoClient = createClient(omoContracts);
export const omoEventClient = createEventClient(omoEvents);
