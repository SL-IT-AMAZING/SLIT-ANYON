import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

export const SubscriptionPlanSchema = z.enum([
  "free",
  "starter",
  "pro",
  "power",
]);

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const ModelTierSchema = z.enum(["light", "pro"]);
export type ModelTierType = z.infer<typeof ModelTierSchema>;

export const EntitlementStateSchema = z.object({
  plan: SubscriptionPlanSchema,
  isActive: z.boolean(),
  expiresAt: z.string().nullable(),
  polarSubscriptionId: z.string().nullable(),
  syncedAt: z.string().nullable(),
});

export type EntitlementState = z.infer<typeof EntitlementStateSchema>;

export const UsageInfoSchema = z.object({
  creditsUsed: z.number(),
  creditsLimit: z.number(),
  resetAt: z.string().nullable(),
  overageRate: z.number().nullable(),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;

export const CreditCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  creditsRemaining: z.number(),
  plan: SubscriptionPlanSchema,
  usagePercent: z.number(),
  modelTier: ModelTierSchema,
});

export type CreditCheckResult = z.infer<typeof CreditCheckResultSchema>;

export const StartCheckoutInputSchema = z.object({
  planId: z.string(),
});

/**
 * Entitlement contracts define the IPC interface for subscription and usage state.
 */
export const entitlementContracts = {
  /**
   * Get current entitlement state from local cache.
   */
  getEntitlements: defineContract({
    channel: "entitlement:get",
    input: z.void(),
    output: EntitlementStateSchema,
  }),

  /**
   * Force synchronization of entitlements with the server.
   */
  syncEntitlements: defineContract({
    channel: "entitlement:sync",
    input: z.void(),
    output: EntitlementStateSchema,
  }),

  /**
   * Start Polar checkout flow for a plan.
   * Returns a checkout URL to open externally.
   */
  startCheckout: defineContract({
    channel: "entitlement:checkout",
    input: StartCheckoutInputSchema,
    output: z.object({ checkoutUrl: z.string() }),
  }),

  /**
   * Open Polar customer portal.
   * Returns a portal URL to open externally.
   */
  openCustomerPortal: defineContract({
    channel: "entitlement:portal",
    input: z.void(),
    output: z.object({ portalUrl: z.string() }),
  }),

  /**
   * Get current usage metrics for the authenticated user.
   */
  getUsage: defineContract({
    channel: "entitlement:usage",
    input: z.void(),
    output: UsageInfoSchema,
  }),

  checkCredits: defineContract({
    channel: "entitlement:check-credits",
    input: z.object({ modelId: z.string() }),
    output: CreditCheckResultSchema,
  }),
} as const;

export const entitlementClient = createClient(entitlementContracts);

export type GetEntitlementsInput = z.infer<
  (typeof entitlementContracts)["getEntitlements"]["input"]
>;

export type GetEntitlementsOutput = z.infer<
  (typeof entitlementContracts)["getEntitlements"]["output"]
>;

export type SyncEntitlementsInput = z.infer<
  (typeof entitlementContracts)["syncEntitlements"]["input"]
>;

export type SyncEntitlementsOutput = z.infer<
  (typeof entitlementContracts)["syncEntitlements"]["output"]
>;

export type StartCheckoutInput = z.infer<
  (typeof entitlementContracts)["startCheckout"]["input"]
>;

export type StartCheckoutOutput = z.infer<
  (typeof entitlementContracts)["startCheckout"]["output"]
>;

export type OpenCustomerPortalInput = z.infer<
  (typeof entitlementContracts)["openCustomerPortal"]["input"]
>;

export type OpenCustomerPortalOutput = z.infer<
  (typeof entitlementContracts)["openCustomerPortal"]["output"]
>;

export type GetUsageInput = z.infer<
  (typeof entitlementContracts)["getUsage"]["input"]
>;

export type GetUsageOutput = z.infer<
  (typeof entitlementContracts)["getUsage"]["output"]
>;

export type CheckCreditsInput = z.infer<
  (typeof entitlementContracts)["checkCredits"]["input"]
>;

export type CheckCreditsOutput = z.infer<
  (typeof entitlementContracts)["checkCredits"]["output"]
>;
