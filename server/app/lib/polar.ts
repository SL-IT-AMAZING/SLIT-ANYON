import { Polar } from "@polar-sh/sdk";

const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;

if (!polarAccessToken) {
  console.warn(
    "POLAR_ACCESS_TOKEN not set - payment features will be unavailable",
  );
}

export const polar = new Polar({
  accessToken: polarAccessToken ?? "",
});

export const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? "";
export const POLAR_METER_ID = process.env.POLAR_METER_ID ?? "";
export const POLAR_ORG_ID = process.env.POLAR_ORG_ID ?? "";

export const POLAR_PRODUCT_IDS = {
  starter: process.env.POLAR_PRODUCT_ID_STARTER ?? "",
  pro: process.env.POLAR_PRODUCT_ID_PRO ?? "",
  power: process.env.POLAR_PRODUCT_ID_POWER ?? "",
} as const;

export type PlanTier = "free" | "starter" | "pro" | "power";

/**
 * Maps a Polar product ID back to a plan tier name.
 * Returns "free" if the product ID is not recognized.
 */
export function productIdToPlan(productId: string): PlanTier {
  for (const [plan, id] of Object.entries(POLAR_PRODUCT_IDS)) {
    if (id === productId) return plan as PlanTier;
  }
  return "free";
}

/**
 * Maps a plan tier name to its Polar product ID.
 * Returns null for "free" tier or unrecognized plans.
 */
export function planToProductId(plan: string): string | null {
  if (plan === "starter") return POLAR_PRODUCT_IDS.starter || null;
  if (plan === "pro") return POLAR_PRODUCT_IDS.pro || null;
  if (plan === "power") return POLAR_PRODUCT_IDS.power || null;
  return null;
}
