import { ipc } from "@/ipc/types";
import type {
  CreditCheckResult,
  EntitlementState,
  UsageInfo,
} from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { showError } from "@/lib/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useEntitlement() {
  const queryClient = useQueryClient();

  const { data: entitlementData, isLoading: isEntitlementLoading } = useQuery({
    queryKey: queryKeys.entitlement.state,
    queryFn: () => ipc.entitlement.getEntitlements(),
  });

  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: queryKeys.entitlement.usage,
    queryFn: () => ipc.entitlement.getUsage(),
    enabled: !!entitlementData?.isActive,
  });

  const syncMutation = useMutation({
    mutationFn: () => ipc.entitlement.syncEntitlements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => ipc.entitlement.startCheckout({ planId }),
    onError: (error: Error) => {
      showError(error);
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => ipc.entitlement.openCustomerPortal(),
    onError: (error: Error) => {
      showError(error);
    },
  });

  const checkCreditsMutation = useMutation({
    mutationFn: (modelId: string) => ipc.entitlement.checkCredits({ modelId }),
    onError: (error: Error) => {
      showError(error);
    },
  });

  const syncEntitlements = async (): Promise<void> => {
    await syncMutation.mutateAsync();
  };

  const startCheckout = async (planId: string): Promise<void> => {
    await checkoutMutation.mutateAsync(planId);
  };

  const openCustomerPortal = async (): Promise<void> => {
    await portalMutation.mutateAsync();
  };

  const checkCredits = async (modelId: string): Promise<CreditCheckResult> => {
    return checkCreditsMutation.mutateAsync(modelId);
  };

  return {
    entitlement: (entitlementData ?? null) as EntitlementState | null,
    usage: (usageData ?? null) as UsageInfo | null,
    isLoading: isEntitlementLoading || isUsageLoading,
    isPaid:
      entitlementData?.plan !== "free" && entitlementData?.isActive === true,
    plan: entitlementData?.plan ?? "free",
    isStarter:
      entitlementData?.plan === "starter" && entitlementData?.isActive === true,
    isPro:
      entitlementData?.plan === "pro" && entitlementData?.isActive === true,
    isPower:
      entitlementData?.plan === "power" && entitlementData?.isActive === true,
    syncEntitlements,
    startCheckout,
    openCustomerPortal,
    checkCredits,
    isCheckoutPending: checkoutMutation.isPending,
  };
}
