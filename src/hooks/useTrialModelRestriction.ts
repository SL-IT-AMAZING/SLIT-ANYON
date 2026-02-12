import { isAnyonProEnabled } from "../lib/schemas";
import { useSettings } from "./useSettings";
import { useUserBudgetInfo } from "./useUserBudgetInfo";

export function useTrialModelRestriction() {
  const { userBudget, isLoadingUserBudget } = useUserBudgetInfo();
  const { settings } = useSettings();

  const isTrial =
    (userBudget?.isTrial && settings && isAnyonProEnabled(settings)) ?? false;

  return {
    isTrial,
    isLoadingTrialStatus: isLoadingUserBudget,
  };
}
