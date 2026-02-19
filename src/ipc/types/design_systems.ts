import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

export const DesignSystemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string(),
  libraryName: z.string(),
  thumbnailPath: z.string(),
  category: z.string(),
  tier: z.number(),
  scaffoldDir: z.string(),
  previewDir: z.string(),
  defaultPlatform: z.string(),
  tags: z.array(z.string()),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
  }),
  componentCount: z.number(),
  componentStrategy: z.enum(["code-copy", "library-import"]),
  importPattern: z.string(),
  isBuiltin: z.boolean(),
  isAvailable: z.boolean(),
});

export type DesignSystemType = z.infer<typeof DesignSystemSchema>;

export const GetPreviewUrlParamsSchema = z.object({
  designSystemId: z.string(),
});

export const GetPreviewUrlResultSchema = z.object({
  url: z.string(),
  nonce: z.string(),
});

export const designSystemContracts = {
  getDesignSystems: defineContract({
    channel: "get-design-systems",
    input: z.void(),
    output: z.array(DesignSystemSchema),
  }),

  getPreviewUrl: defineContract({
    channel: "get-design-system-preview-url",
    input: GetPreviewUrlParamsSchema,
    output: GetPreviewUrlResultSchema,
  }),

  stopActivePreview: defineContract({
    channel: "stop-active-design-system-preview",
    input: z.void(),
    output: z.void(),
  }),
} as const;

export const designSystemClient = createClient(designSystemContracts);
