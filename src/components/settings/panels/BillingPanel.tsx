import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { CreditCard, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BillingPanel() {
  const { t } = useTranslation("app");
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { plan, isPaid, usage, openCustomerPortal } = useEntitlement();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.tabs.billing")}
        </h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted/30 p-8 text-center">
          <LogIn className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("billing.loginRequired")}
          </p>
          <Button onClick={() => loginWithGoogle()} variant="outline">
            {t("billing.loginButton")}
          </Button>
        </div>
      </div>
    );
  }

  const usagePercent =
    usage && usage.creditsLimit > 0
      ? (usage.creditsUsed / usage.creditsLimit) * 100
      : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.billing")}
      </h2>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("billing.currentPlanBadge")}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {t(`billing.currentPlan.${plan}`)}
            </p>
          </div>
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCustomerPortal()}
            >
              <CreditCard className="mr-2 size-4" />
              {t("billing.manageBilling")}
            </Button>
          )}
        </div>

        {isPaid && usage && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>{t("billing.credits")}</span>
              <span>
                {t("billing.usage", {
                  used: usage.creditsUsed.toLocaleString(),
                  limit: usage.creditsLimit.toLocaleString(),
                })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
