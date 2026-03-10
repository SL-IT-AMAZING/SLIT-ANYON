import { z } from "zod";

export const BuiltinAgentNameSchema = z.enum([
  "conductor",
  "craftsman",
  "strategist",
  "advisor",
  "researcher",
  "scout",
  "inspector",
  "analyst",
  "critic",
  "taskmaster",
]);

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "frontend-ui-ux",
  "git-master",
]);

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "conductor",
  "craftsman",
  "worker",
  "OpenCode-Builder",
  "strategist",
  "analyst",
  "critic",
  "advisor",
  "researcher",
  "scout",
  "inspector",
  "taskmaster",
]);

export const AgentNameSchema = BuiltinAgentNameSchema;
export type AgentName = z.infer<typeof AgentNameSchema>;

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>;
