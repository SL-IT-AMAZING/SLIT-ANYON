import {
  checkCreditsForModel,
  getEntitlements,
  getUsage,
  openCustomerPortal,
  startCheckout,
  syncEntitlements,
} from "../../main/entitlement";
import { entitlementContracts } from "../types/entitlement";
import { createTypedHandler } from "./base";

export function registerEntitlementHandlers() {
  createTypedHandler(entitlementContracts.getEntitlements, async () => {
    return getEntitlements();
  });

  createTypedHandler(entitlementContracts.syncEntitlements, async () => {
    return syncEntitlements();
  });

  createTypedHandler(entitlementContracts.startCheckout, async (_, input) => {
    return startCheckout(input.planId);
  });

  createTypedHandler(entitlementContracts.openCustomerPortal, async () => {
    return openCustomerPortal();
  });

  createTypedHandler(entitlementContracts.getUsage, async () => {
    return getUsage();
  });

  createTypedHandler(entitlementContracts.checkCredits, async (_, input) => {
    return checkCreditsForModel(input.modelId);
  });
}
