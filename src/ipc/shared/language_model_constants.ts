import { LanguageModel } from "@/ipc/types";

export const PROVIDERS_THAT_SUPPORT_THINKING: string[] = [];

export interface ModelOption {
  name: string;
  displayName: string;
  description: string;
  dollarSigns?: number;
  temperature?: number;
  tag?: string;
  tagColor?: string;
  maxOutputTokens?: number;
  contextWindow?: number;
}

export const MODEL_OPTIONS: Record<string, ModelOption[]> = {
  opencode: [
    {
      name: "claude-sonnet-4-20250514",
      displayName: "Claude Sonnet 4",
      description: "Default model via OpenCode CLI",
      maxOutputTokens: 32_000,
      contextWindow: 200_000,
      temperature: 0,
    },
  ],
};

export const TURBO_MODELS: LanguageModel[] = [];

export const FREE_OPENROUTER_MODEL_NAMES: string[] = [];

export const PROVIDER_TO_ENV_VAR: Record<string, string> = {};

export const CLOUD_PROVIDERS: Record<
  string,
  {
    displayName: string;
    hasFreeTier?: boolean;
    websiteUrl?: string;
    gatewayPrefix: string;
    secondary?: boolean;
  }
> = {};

export const LOCAL_PROVIDERS: Record<
  string,
  {
    displayName: string;
    hasFreeTier: boolean;
  }
> = {
  opencode: {
    displayName: "OpenCode CLI",
    hasFreeTier: true,
  },
};
