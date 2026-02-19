export interface ProviderConfig {
  baseUrl: string;
  authHeaders: (apiKey: string) => Record<string, string>;
  envVar: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    authHeaders: (key) => ({ "x-api-key": key }),
    envVar: "ANTHROPIC_API_KEY",
  },
  openai: {
    baseUrl: "https://api.openai.com",
    authHeaders: (key) => ({ Authorization: `Bearer ${key}` }),
    envVar: "OPENAI_API_KEY",
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com",
    authHeaders: (key) => ({ "x-goog-api-key": key }),
    envVar: "GOOGLE_API_KEY",
  },
  xai: {
    baseUrl: "https://api.x.ai",
    authHeaders: (key) => ({ Authorization: `Bearer ${key}` }),
    envVar: "XAI_API_KEY",
  },
};

export function getProviderConfig(provider: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[provider] ?? null;
}

export function getProviderApiKey(provider: string): string | null {
  const config = getProviderConfig(provider);
  if (!config) return null;
  return process.env[config.envVar] || null;
}

export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_CONFIGS);
}
