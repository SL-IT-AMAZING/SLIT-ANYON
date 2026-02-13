import { shell } from "electron";
import log from "electron-log";
import { oauthEndpoints } from "../lib/oauthConfig";
import { readSettings, writeSettings } from "./settings";

const logger = log.scope("entitlement");

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
  return token.value;
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
  const cached = getCachedEntitlements();
  if (cached) return cached;

  return syncEntitlements();
}

export async function syncEntitlements(): Promise<EntitlementState> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    logger.info("No auth token — clearing cache and returning free state");
    saveCachedEntitlements(FREE_STATE);
    return FREE_STATE;
  }

  try {
    const response = await fetch(oauthEndpoints.auth.entitlements, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: getAnonKey(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn("Auth token expired during entitlement sync");
        return getCachedEntitlements() ?? FREE_STATE;
      }
      throw new Error(`Entitlement sync failed: ${response.status}`);
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
    return state;
  } catch (error) {
    logger.error("Failed to sync entitlements:", error);
    return getCachedEntitlements() ?? FREE_STATE;
  }
}

export async function startCheckout(
  planId: string,
): Promise<{ checkoutUrl: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("You must be logged in to subscribe");
  }

  const response = await fetch(oauthEndpoints.auth.checkout, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      apikey: getAnonKey(),
    },
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as Record<string, string>).error ??
        `Checkout failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { checkoutUrl: string };

  await shell.openExternal(data.checkoutUrl);
  return data;
}

export async function openCustomerPortal(): Promise<{ portalUrl: string }> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("You must be logged in to manage your subscription");
  }

  const response = await fetch(oauthEndpoints.auth.customerPortal, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: getAnonKey(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as Record<string, string>).error ??
        `Portal request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { portalUrl: string };

  await shell.openExternal(data.portalUrl);
  return data;
}

export async function getUsage(): Promise<UsageInfo> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      creditsUsed: 0,
      creditsLimit: 0,
      resetAt: null,
      overageRate: null,
    };
  }

  try {
    const response = await fetch(oauthEndpoints.auth.usage, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: getAnonKey(),
      },
    });

    if (!response.ok) {
      throw new Error(`Usage fetch failed: ${response.status}`);
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
}

export async function checkCreditsForModel(
  modelName: string,
): Promise<CreditCheckResult> {
  void modelName;
  const plan = getPlanTier();

  if (plan === "free") {
    return {
      allowed: false,
      reason:
        "This model requires a paid plan. Upgrade to Starter to get started.",
      creditsRemaining: 0,
      plan,
      usagePercent: 0,
    };
  }

  const usage = await getUsage();
  const creditsRemaining = Math.max(0, usage.creditsLimit - usage.creditsUsed);
  const usagePercent =
    usage.creditsLimit > 0 ? (usage.creditsUsed / usage.creditsLimit) * 100 : 0;

  if (plan === "power") {
    return { allowed: true, creditsRemaining, plan, usagePercent };
  }

  if (creditsRemaining <= 0) {
    return {
      allowed: false,
      reason:
        "You've used all your credits for this billing period. Upgrade your plan or wait for credits to reset.",
      creditsRemaining,
      plan,
      usagePercent,
    };
  }

  return { allowed: true, creditsRemaining, plan, usagePercent };
}

/**
 * Reports token usage to the server for Polar metering.
 * Fire-and-forget: failures are logged but don't block the user.
 */
export async function reportTokenUsage(
  rawTokens: number,
  modelId: string,
): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) return; // Not logged in, skip

  try {
    await fetch(oauthEndpoints.auth.usageIngest, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: getAnonKey(),
      },
      body: JSON.stringify({ rawTokens, modelId }),
    });
  } catch (error) {
    logger.error("Failed to report token usage:", error);
  }
}
