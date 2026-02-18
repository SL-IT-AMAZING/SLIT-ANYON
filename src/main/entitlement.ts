import { shell } from "electron";
import log from "electron-log";
import { updateOmocConfig } from "../ipc/utils/opencode_config_setup";
import { oauthEndpoints } from "../lib/oauthConfig";
import { refreshSession } from "./auth";
import { readSettings, writeSettings } from "./settings";

const logger = log.scope("entitlement");

// ── Dev bypass ───────────────────────────────────────────────────────────────
// Set ANYON_BYPASS_ENTITLEMENT=1 to skip all billing checks during development.
// Usage:  ANYON_BYPASS_ENTITLEMENT=1 npm start
// Or use: npm run dev:free
const BYPASS_ENTITLEMENT = process.env.ANYON_BYPASS_ENTITLEMENT === "1";

if (BYPASS_ENTITLEMENT) {
  logger.warn("⚠️  Entitlement bypass enabled — all billing checks disabled");
}

const BYPASS_ENTITLEMENT_STATE: EntitlementState = {
  plan: "pro",
  isActive: true,
  expiresAt: null,
  polarSubscriptionId: null,
  syncedAt: new Date().toISOString(),
};

const BYPASS_USAGE: UsageInfo = {
  creditsUsed: 0,
  creditsLimit: 999_999_999,
  resetAt: null,
  overageRate: null,
};

/**
 * Model intelligence tier classification.
 * Light = cost-effective models (Flash, Haiku, Mini variants)
 * Pro = premium models (Sonnet, Opus, GPT-5, Gemini Pro, etc.)
 */
export type ModelTier = "light" | "pro";

/**
 * Light-tier model patterns. If a model name matches any of these patterns,
 * it's classified as "light". Everything else is "pro".
 */
const LIGHT_MODEL_PATTERNS = [
  "flash",
  "haiku",
  "mini",
  "gpt-4o-mini",
  "deepseek",
  "grok",
  "glm",
] as const;

/** Model preset type for oh-my-opencode config */
export type ModelPreset = {
  agents: Record<string, { model: string; variant?: string }>;
  categories: Record<string, { model: string; variant?: string }>;
};

/**
 * Pro preset: best-case oh-my-opencode config (max20 equivalent).
 * Used for pro and power plan subscribers.
 */
export const PRO_PRESET: ModelPreset = {
  agents: {
    Sisyphus: { model: "anthropic/claude-opus-4-6" },
    oracle: { model: "openai/gpt-5.2", variant: "high" },
    explore: { model: "opencode/grok-code-fast-1" },
    librarian: { model: "opencode/glm-4.7" },
    "multimodal-looker": { model: "google/gemini-3-pro-preview" },
    "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
    "Metis (Plan Consultant)": { model: "anthropic/claude-opus-4-6" },
    "Momus (Plan Reviewer)": { model: "openai/gpt-5.2", variant: "medium" },
    Atlas: { model: "anthropic/claude-opus-4-6" },
  },
  categories: {
    "visual-engineering": { model: "google/gemini-3-pro-preview" },
    ultrabrain: { model: "openai/gpt-5.2-codex" },
    artistry: { model: "google/gemini-3-pro-preview", variant: "max" },
    quick: { model: "anthropic/claude-haiku-4-5" },
    "unspecified-low": { model: "anthropic/claude-sonnet-4-5" },
    "unspecified-high": { model: "anthropic/claude-opus-4-6" },
    writing: { model: "google/gemini-3-flash-preview" },
  },
} as const;

/**
 * Light preset: standard oh-my-opencode config.
 * Used for free and starter plan subscribers.
 * Only unspecified-high category agents are downgraded (Opus → Sonnet).
 */
export const LIGHT_PRESET: ModelPreset = {
  agents: {
    Sisyphus: { model: "anthropic/claude-sonnet-4-5" },
    oracle: { model: "openai/gpt-5.2", variant: "high" },
    explore: { model: "opencode/grok-code-fast-1" },
    librarian: { model: "opencode/glm-4.7" },
    "multimodal-looker": { model: "google/gemini-3-pro-preview" },
    "Prometheus (Planner)": { model: "anthropic/claude-sonnet-4-5" },
    "Metis (Plan Consultant)": { model: "anthropic/claude-sonnet-4-5" },
    "Momus (Plan Reviewer)": { model: "openai/gpt-5.2", variant: "medium" },
    Atlas: { model: "anthropic/claude-sonnet-4-5" },
  },
  categories: {
    "visual-engineering": { model: "google/gemini-3-pro-preview" },
    ultrabrain: { model: "openai/gpt-5.2-codex" },
    artistry: { model: "google/gemini-3-pro-preview", variant: "max" },
    quick: { model: "anthropic/claude-haiku-4-5" },
    "unspecified-low": { model: "anthropic/claude-sonnet-4-5" },
    "unspecified-high": { model: "anthropic/claude-sonnet-4-5" },
    writing: { model: "google/gemini-3-flash-preview" },
  },
} as const;

/**
 * Determines the intelligence tier for a given model.
 * Used for credit consumption rates and plan-based access control.
 */
export function getModelTier(modelName: string): ModelTier {
  const lower = modelName.toLowerCase();
  for (const pattern of LIGHT_MODEL_PATTERNS) {
    if (lower.includes(pattern)) return "light";
  }
  return "pro";
}

function getAnonKey(): string {
  const key = process.env.ANYON_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "ANYON_SUPABASE_ANON_KEY is not set. Cannot call Edge Functions.",
    );
  }
  return key;
}

const CACHE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 2 * 60 * 1000;

export interface EntitlementState {
  plan: "free" | "starter" | "pro" | "power";
  isActive: boolean;
  expiresAt: string | null;
  polarSubscriptionId: string | null;
  syncedAt: string | null;
}

export interface UsageInfo {
  creditsUsed: number;
  creditsLimit: number;
  resetAt: string | null;
  overageRate: number | null;
}

const FREE_STATE: EntitlementState = {
  plan: "free",
  isActive: false,
  expiresAt: null,
  polarSubscriptionId: null,
  syncedAt: null,
};

function getAccessToken(): string | null {
  const settings = readSettings();
  const token = settings.auth?.accessToken;
  if (!token?.value) return null;
  return normalizeAccessToken(token.value);
}

function normalizeAccessToken(value: string): string {
  const normalized = value.trim();
  return normalized.startsWith("Bearer ")
    ? normalized.slice(7).trim()
    : normalized;
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(
        parts[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const expiry = getJwtExpiryMs(token);
  if (!expiry) {
    return false;
  }
  return Date.now() >= expiry - ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

function tokenPreview(token: string): string {
  return token.length > 12
    ? `${token.slice(0, 6)}...${token.slice(-4)} (len=${token.length})`
    : `invalid-length(${token.length})`;
}

async function getActiveAccessToken(operation: string): Promise<string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("You must be logged in to continue");
  }

  if (!isTokenExpired(accessToken)) {
    return accessToken;
  }

  logger.warn(`Access token looks expired for ${operation}; refreshing first`);

  const refreshed = await refreshSession();
  if (!refreshed.accessToken) {
    throw new Error(
      `Session refresh failed during ${operation}. Please sign in again.`,
    );
  }

  return normalizeAccessToken(refreshed.accessToken);
}

async function requestWithAuthRefresh(
  operation: string,
  request: (token: string) => Promise<Response>,
): Promise<Response> {
  const accessToken = await getActiveAccessToken(operation);

  logger.debug(`Sending ${operation} request with auth token`, {
    operation,
    token: tokenPreview(accessToken),
  });

  let response = await request(accessToken);
  if (response.status !== 401) {
    return response;
  }

  logger.warn(`Got 401 for ${operation}, attempting auth token refresh`);

  try {
    const refreshed = await refreshSession();
    if (refreshed.accessToken) {
      logger.info(`Refreshed auth token for ${operation}`);
      response = await request(normalizeAccessToken(refreshed.accessToken));
      if (response.status === 401) {
        logger.warn(
          `Still unauthorized after token refresh for ${operation}; please re-login`,
        );
      } else {
        logger.info(`${operation} request succeeded after refresh`);
      }
    }
  } catch (error) {
    logger.warn(`Failed to refresh session before ${operation}`, error);
  }

  return response;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = await response
    .clone()
    .json()
    .catch(() => ({}) as Record<string, unknown>);
  if (typeof payload?.error === "string" && payload.error.length > 0) {
    return payload.error;
  }

  const responseText = await response
    .clone()
    .text()
    .catch(() => "")
    .then((text) => text.slice(0, 200));

  if (responseText) {
    return `${fallback}: ${response.status} ${response.statusText} - ${responseText}`;
  }

  return `${fallback}: ${response.status} ${response.statusText}`;
}

function getCachedEntitlements(): EntitlementState | null {
  const settings = readSettings();
  const cache = settings.entitlementCache;
  if (!cache?.syncedAt) return null;

  const syncedAt = new Date(cache.syncedAt).getTime();
  if (Date.now() - syncedAt > CACHE_TTL_MS) {
    return null;
  }

  return {
    plan: cache.plan ?? "free",
    isActive: cache.isActive ?? false,
    expiresAt: cache.expiresAt ?? null,
    polarSubscriptionId: cache.polarSubscriptionId ?? null,
    syncedAt: cache.syncedAt,
  };
}

function saveCachedEntitlements(state: EntitlementState): void {
  writeSettings({
    entitlementCache: {
      plan: state.plan,
      isActive: state.isActive,
      expiresAt: state.expiresAt ?? undefined,
      polarSubscriptionId: state.polarSubscriptionId ?? undefined,
      syncedAt: state.syncedAt ?? undefined,
    },
  });
}

export async function getEntitlements(): Promise<EntitlementState> {
  if (BYPASS_ENTITLEMENT) return BYPASS_ENTITLEMENT_STATE;

  const cached = getCachedEntitlements();
  if (cached) return cached;

  return syncEntitlements();
}

export async function syncEntitlements(): Promise<EntitlementState> {
  if (BYPASS_ENTITLEMENT) {
    saveCachedEntitlements(BYPASS_ENTITLEMENT_STATE);
    return BYPASS_ENTITLEMENT_STATE;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    logger.info("No auth token — clearing cache and returning free state");
    saveCachedEntitlements(FREE_STATE);
    return FREE_STATE;
  }

  try {
    const response = await requestWithAuthRefresh("entitlement sync", (token) =>
      fetch(oauthEndpoints.auth.entitlements, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: getAnonKey(),
        },
      }),
    );

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn("Auth token expired during entitlement sync");
        return getCachedEntitlements() ?? FREE_STATE;
      }
      throw new Error(
        await getErrorMessage(response, "Entitlement sync failed"),
      );
    }

    const data = (await response.json()) as EntitlementState;
    const state: EntitlementState = {
      plan: data.plan ?? "free",
      isActive: data.isActive ?? false,
      expiresAt: data.expiresAt ?? null,
      polarSubscriptionId: data.polarSubscriptionId ?? null,
      syncedAt: new Date().toISOString(),
    };

    saveCachedEntitlements(state);

    applyModelPreset(state.plan).catch((err) =>
      logger.error("Failed to apply model preset after sync:", err),
    );

    return state;
  } catch (error) {
    logger.error("Failed to sync entitlements:", error);
    return getCachedEntitlements() ?? FREE_STATE;
  }
}

/**
 * Applies the appropriate model preset to the oh-my-opencode config
 * based on the user's subscription plan.
 */
export async function applyModelPreset(
  plan: "free" | "starter" | "pro" | "power",
): Promise<void> {
  const preset = plan === "pro" || plan === "power" ? PRO_PRESET : LIGHT_PRESET;
  try {
    updateOmocConfig(preset);
    logger.info(
      `Applied ${plan === "pro" || plan === "power" ? "Pro" : "Light"} model preset for plan: ${plan}`,
    );
  } catch (error) {
    logger.error("Failed to apply model preset:", error);
  }
}

export async function startCheckout(
  planId: string,
): Promise<{ checkoutUrl: string }> {
  const requestCheckout = async (token: string) => {
    return fetch(oauthEndpoints.auth.checkout, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        apikey: getAnonKey(),
      },
      body: JSON.stringify({ planId }),
    });
  };

  const response = await requestWithAuthRefresh("checkout", requestCheckout);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Checkout failed"));
  }

  const data = (await response.json()) as { checkoutUrl: string };
  await shell.openExternal(data.checkoutUrl);
  return data;
}

export async function openCustomerPortal(): Promise<{ portalUrl: string }> {
  const requestPortal = async (token: string) => {
    return fetch(oauthEndpoints.auth.customerPortal, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: getAnonKey(),
      },
    });
  };

  const response = await requestWithAuthRefresh(
    "customer portal",
    requestPortal,
  );
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Portal request failed"));
  }

  const data = (await response.json()) as { portalUrl: string };
  await shell.openExternal(data.portalUrl);
  return data;
}

export async function getUsage(): Promise<UsageInfo> {
  if (BYPASS_ENTITLEMENT) return BYPASS_USAGE;

  const requestUsage = async (token: string) => {
    return fetch(oauthEndpoints.auth.usage, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: getAnonKey(),
      },
    });
  };

  try {
    const response = await requestWithAuthRefresh("usage fetch", requestUsage);
    if (!response.ok) {
      if (response.status === 401) {
        return {
          creditsUsed: 0,
          creditsLimit: 0,
          resetAt: null,
          overageRate: null,
        };
      }
      throw new Error(await getErrorMessage(response, "Usage fetch failed"));
    }

    return (await response.json()) as UsageInfo;
  } catch (error) {
    logger.error("Failed to fetch usage:", error);
    return {
      creditsUsed: 0,
      creditsLimit: 0,
      resetAt: null,
      overageRate: null,
    };
  }
}

export function isProActive(): boolean {
  const cached = getCachedEntitlements();
  if (!cached) return false;
  return cached.plan === "pro" && cached.isActive;
}

export function isPaidPlanActive(): boolean {
  const cached = getCachedEntitlements();
  if (!cached) return false;
  return cached.plan !== "free" && cached.isActive;
}

export function getPlanTier(): "free" | "starter" | "pro" | "power" {
  const cached = getCachedEntitlements();
  if (!cached) return "free";
  return cached.isActive ? cached.plan : "free";
}

export interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
  creditsRemaining: number;
  plan: "free" | "starter" | "pro" | "power";
  usagePercent: number;
  modelTier: ModelTier;
}

export async function checkCreditsForModel(
  modelName: string,
): Promise<CreditCheckResult> {
  if (BYPASS_ENTITLEMENT) {
    return {
      allowed: true,
      creditsRemaining: Number.POSITIVE_INFINITY,
      plan: "pro",
      usagePercent: 0,
      modelTier: getModelTier(modelName),
    };
  }

  const plan = getPlanTier();
  const tier = getModelTier(modelName);

  // Pro models require pro or power plan
  if (tier === "pro" && (plan === "free" || plan === "starter")) {
    return {
      allowed: false,
      reason:
        "Pro intelligence requires a Pro plan or higher. Upgrade to use premium models.",
      creditsRemaining: 0,
      plan,
      usagePercent: 0,
      modelTier: tier,
    };
  }

  // Free plan: allow Light models with limited credits
  if (plan === "free") {
    const usage = await getUsage();
    const creditsRemaining = Math.max(
      0,
      usage.creditsLimit - usage.creditsUsed,
    );
    const usagePercent =
      usage.creditsLimit > 0
        ? (usage.creditsUsed / usage.creditsLimit) * 100
        : 0;

    if (creditsRemaining <= 0) {
      return {
        allowed: false,
        reason:
          "You've used all your free credits. Upgrade to Starter for more credits.",
        creditsRemaining: 0,
        plan,
        usagePercent,
        modelTier: tier,
      };
    }

    return {
      allowed: true,
      creditsRemaining,
      plan,
      usagePercent,
      modelTier: tier,
    };
  }

  // Paid plans: check credits
  const usage = await getUsage();
  const creditsRemaining = Math.max(0, usage.creditsLimit - usage.creditsUsed);
  const usagePercent =
    usage.creditsLimit > 0 ? (usage.creditsUsed / usage.creditsLimit) * 100 : 0;

  // Power plan: always allowed (overage billing)
  if (plan === "power") {
    return {
      allowed: true,
      creditsRemaining,
      plan,
      usagePercent,
      modelTier: tier,
    };
  }

  // Starter/Pro with credits exhausted
  if (creditsRemaining <= 0) {
    return {
      allowed: false,
      reason:
        "You've used all your credits for this billing period. Upgrade your plan or wait for credits to reset.",
      creditsRemaining,
      plan,
      usagePercent,
      modelTier: tier,
    };
  }

  return {
    allowed: true,
    creditsRemaining,
    plan,
    usagePercent,
    modelTier: tier,
  };
}

/**
 * Reports token usage to the server for Polar metering.
 * Includes model tier so the server can apply tier-based credit rates.
 * Fire-and-forget: failures are logged but don't block the user.
 */
export async function reportTokenUsage(
  rawTokens: number,
  modelId: string,
): Promise<void> {
  if (BYPASS_ENTITLEMENT) return;

  const accessToken = getAccessToken();
  if (!accessToken) return; // Not logged in, skip

  const tier = getModelTier(modelId);

  try {
    await fetch(oauthEndpoints.auth.usageIngest, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: getAnonKey(),
      },
      body: JSON.stringify({ rawTokens, modelId, tier }),
    });
  } catch (error) {
    logger.error("Failed to report token usage:", error);
  }
}
