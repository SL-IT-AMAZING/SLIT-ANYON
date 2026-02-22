import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

// =============================================================================
// Language Model Schemas
// =============================================================================

export const LanguageModelProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  hasFreeTier: z.boolean().optional(),
  websiteUrl: z.string().optional(),
  gatewayPrefix: z.string().optional(),
  secondary: z.boolean().optional(),
  envVarName: z.string().optional(),
  apiBaseUrl: z.string().optional(),
  type: z.enum(["custom", "local", "cloud"]),
  isCustom: z.boolean().optional(),
  isConnected: z.boolean().optional(),
});

export type LanguageModelProvider = z.infer<typeof LanguageModelProviderSchema>;

export const LanguageModelSchema = z.object({
  id: z.number().optional(),
  apiName: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
  maxOutputTokens: z.number().optional(),
  contextWindow: z.number().optional(),
  temperature: z.number().optional(),
  dollarSigns: z.number().optional(),
  type: z.enum(["custom", "local", "cloud"]).optional(),
});

export type LanguageModel = z.infer<typeof LanguageModelSchema>;

export const LocalModelSchema = z.object({
  provider: z.enum(["ollama", "lmstudio"]),
  modelName: z.string(),
  displayName: z.string(),
});

export type LocalModel = z.infer<typeof LocalModelSchema>;

// =============================================================================
// Language Model Contracts
// =============================================================================

export const languageModelContracts = {
  getProviders: defineContract({
    channel: "get-language-model-providers",
    input: z.object({ appPath: z.string().optional() }),
    output: z.array(LanguageModelProviderSchema),
  }),

  getModels: defineContract({
    channel: "get-language-models",
    input: z.object({
      providerId: z.string(),
      appPath: z.string().optional(),
    }),
    output: z.array(LanguageModelSchema),
  }),

  getModelsByProviders: defineContract({
    channel: "get-language-models-by-providers",
    input: z.object({ appPath: z.string().optional() }),
    output: z.record(z.string(), z.array(LanguageModelSchema)),
  }),

  listOllamaModels: defineContract({
    channel: "local-models:list-ollama",
    input: z.void(),
    output: z.object({ models: z.array(LocalModelSchema) }),
  }),

  listLMStudioModels: defineContract({
    channel: "local-models:list-lmstudio",
    input: z.void(),
    output: z.object({ models: z.array(LocalModelSchema) }),
  }),
  getOpenCodeAgents: defineContract({
    channel: "get-opencode-agents",
    input: z.object({ appPath: z.string().optional() }),
    output: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        mode: z.enum(["primary", "subagent", "all"]),
        native: z.boolean(),
        hidden: z.boolean().optional(),
        color: z.string().optional(),
        variant: z.string().optional(),
        model: z
          .object({
            providerID: z.string(),
            modelID: z.string(),
          })
          .optional(),
      }),
    ),
  }),
} as const;

// =============================================================================
// Language Model Client
// =============================================================================

export const languageModelClient = createClient(languageModelContracts);
