import {
  checkCreditsForModel,
  getEntitlements,
  getUsage,
  openCustomerPortal,
  startCheckout,
  syncEntitlements,
} from "../../main/entitlement";
import { readSettings } from "../../main/settings";
import {
  getLanguageModelProviders,
  getLanguageModels,
} from "../shared/language_model_helpers";
import { entitlementContracts } from "../types/entitlement";
import { createTypedHandler } from "./base";

async function isFreeTierModel(modelId: string): Promise<boolean> {
  const settings = readSettings();
  const providers = await getLanguageModelProviders();

  const selectedProvider = providers.find(
    (provider) => provider.id === settings.selectedModel.provider,
  );
  if (
    settings.selectedModel.name === modelId &&
    selectedProvider?.hasFreeTier === true
  ) {
    return true;
  }

  const freeTierProviders = providers.filter(
    (provider) => provider.hasFreeTier === true,
  );

  for (const provider of freeTierProviders) {
    const models = await getLanguageModels({ providerId: provider.id });
    if (models.some((model) => model.apiName === modelId)) {
      return true;
    }
  }

  return false;
}

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
    if (await isFreeTierModel(input.modelId)) {
      return {
        allowed: true,
        creditsRemaining: 0,
        plan: "free" as const,
        usagePercent: 0,
      };
    }

    return checkCreditsForModel(input.modelId);
  });
}
