import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

export const PlanningArtifactTypeSchema = z.enum([
  "draft",
  "founder_brief",
  "internal_build_spec",
  "user_flow_spec",
]);

export type PlanningArtifactType = z.infer<typeof PlanningArtifactTypeSchema>;

export const PlanningArtifactSchema = z.object({
  id: z.string(),
  appId: z.number(),
  chatId: z.number(),
  artifactType: PlanningArtifactTypeSchema,
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  metadata: z.record(z.string(), z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlanningArtifact = z.infer<typeof PlanningArtifactSchema>;

export const CreatePlanningArtifactParamsSchema = z.object({
  appId: z.number(),
  chatId: z.number(),
  artifactType: PlanningArtifactTypeSchema,
  title: z.string(),
  summary: z.string().optional(),
  content: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type CreatePlanningArtifactParams = z.infer<
  typeof CreatePlanningArtifactParamsSchema
>;

export const UpdatePlanningArtifactParamsSchema = z.object({
  appId: z.number(),
  id: z.string(),
  artifactType: PlanningArtifactTypeSchema,
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type UpdatePlanningArtifactParams = z.infer<
  typeof UpdatePlanningArtifactParamsSchema
>;

export const planningArtifactContracts = {
  createPlanningArtifact: defineContract({
    channel: "planning-artifact:create",
    input: CreatePlanningArtifactParamsSchema,
    output: z.string(),
  }),

  getPlanningArtifact: defineContract({
    channel: "planning-artifact:get",
    input: z.object({
      appId: z.number(),
      artifactId: z.string(),
      artifactType: PlanningArtifactTypeSchema,
    }),
    output: PlanningArtifactSchema,
  }),

  getPlanningArtifactForChat: defineContract({
    channel: "planning-artifact:get-for-chat",
    input: z.object({
      appId: z.number(),
      chatId: z.number(),
      artifactType: PlanningArtifactTypeSchema,
    }),
    output: PlanningArtifactSchema.nullable(),
  }),

  listPlanningArtifactsForChat: defineContract({
    channel: "planning-artifact:list-for-chat",
    input: z.object({ appId: z.number(), chatId: z.number() }),
    output: z.array(PlanningArtifactSchema),
  }),

  updatePlanningArtifact: defineContract({
    channel: "planning-artifact:update",
    input: UpdatePlanningArtifactParamsSchema,
    output: z.void(),
  }),

  deletePlanningArtifact: defineContract({
    channel: "planning-artifact:delete",
    input: z.object({
      appId: z.number(),
      artifactId: z.string(),
      artifactType: PlanningArtifactTypeSchema,
    }),
    output: z.void(),
  }),
} as const;

export const planningArtifactClient = createClient(planningArtifactContracts);
