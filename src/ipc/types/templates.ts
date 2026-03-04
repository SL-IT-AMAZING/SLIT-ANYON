import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

// =============================================================================
// Template Schemas
// =============================================================================

// Import the shared Template type
// Note: The actual Template type is defined in shared/templates.ts
// We create a compatible Zod schema here
export const TemplateTypeSchema = z.enum(["html", "nextjs"]);
export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  imageUrl: z.string(),
  path: z.string(),
  type: TemplateTypeSchema.optional(),
  techStack: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  longDescription: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const TemplateCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const TemplateRegistrySchema = z.object({
  version: z.number(),
  categories: z.array(TemplateCategorySchema),
  templates: z.array(TemplateSchema),
});

export type TemplateRegistry = z.infer<typeof TemplateRegistrySchema>;

// Theme schema (similar structure)
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  prompt: z.string(),
});

export type Theme = z.infer<typeof ThemeSchema>;

export const SetAppThemeParamsSchema = z.object({
  appId: z.number(),
  themeId: z.string().nullable(),
});

export type SetAppThemeParams = z.infer<typeof SetAppThemeParamsSchema>;

export const GetAppThemeParamsSchema = z.object({
  appId: z.number(),
});

export type GetAppThemeParams = z.infer<typeof GetAppThemeParamsSchema>;

export const GetTemplateContentParamsSchema = z.object({
  templatePath: z.string(),
});

export type GetTemplateContentParams = z.infer<
  typeof GetTemplateContentParamsSchema
>;

export const GetTemplateContentResultSchema = z.object({
  html: z.string(),
});

export type GetTemplateContentResult = z.infer<
  typeof GetTemplateContentResultSchema
>;

// =============================================================================
// Template/Theme Contracts
// =============================================================================

export const templateContracts = {
  getTemplates: defineContract({
    channel: "get-templates",
    input: z.void(),
    output: TemplateRegistrySchema,
  }),

  getTemplateContent: defineContract({
    channel: "get-template-content",
    input: GetTemplateContentParamsSchema,
    output: GetTemplateContentResultSchema,
  }),

  getThemes: defineContract({
    channel: "get-themes",
    input: z.void(),
    output: z.array(ThemeSchema),
  }),

  setAppTheme: defineContract({
    channel: "set-app-theme",
    input: SetAppThemeParamsSchema,
    output: z.void(),
  }),

  getAppTheme: defineContract({
    channel: "get-app-theme",
    input: GetAppThemeParamsSchema,
    output: z.string().nullable(),
  }),
} as const;

// =============================================================================
// Template Client
// =============================================================================

export const templateClient = createClient(templateContracts);
