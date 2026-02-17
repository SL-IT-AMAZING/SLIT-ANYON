import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, LogIn, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

type PlanId = "starter" | "pro" | "power";

const PLAN_IDS: PlanId[] = ["starter", "pro", "power"];

const PLAN_ACCENT: Record<
  PlanId,
  { text: string; border: string; bg: string }
> = {
  starter: {
    text: "text-emerald-500",
    border: "border-emerald-500",
    bg: "bg-emerald-500/10",
  },
  pro: {
    text: "text-indigo-500",
    border: "border-indigo-500",
    bg: "bg-indigo-500/10",
  },
  power: {
    text: "text-amber-500",
    border: "border-amber-500",
    bg: "bg-amber-500/10",
  },
};

export function PricingPlansPanel() {
  const { t } = useTranslation("app");
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { plan, startCheckout, isCheckoutPending, isPaid, openCustomerPortal } =
    useEntitlement();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.tabs.pricingPlans")}
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

  const handleCheckout = async (planId: PlanId) => {
    await startCheckout(planId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.tabs.pricingPlans")}
        </h2>
        {isPaid && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => openCustomerPortal()}
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            {t("billing.manageBilling")}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          {t("billing.currentPlanBadge")}:{" "}
          <span className="font-medium text-foreground">
            {t(`billing.currentPlan.${plan}`)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLAN_IDS.map((planId) => {
          const isCurrentPlan = plan === planId;
          const accent = PLAN_ACCENT[planId];
          const features = t(`billing.plans.${planId}.features`, {
            returnObjects: true,
          }) as string[];

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-lg border p-4 transition-colors",
                isCurrentPlan
                  ? `${accent.border} ${accent.bg}`
                  : "border-border bg-card hover:border-muted-foreground/30",
              )}
            >
              {isCurrentPlan && (
                <span
                  className={cn(
                    "absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-xs font-medium",
                    accent.bg,
                    accent.text,
                  )}
                >
                  {t("billing.currentPlanBadge")}
                </span>
              )}

              <div className="mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className={cn("size-4", accent.text)} />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`billing.plans.${planId}.name`)}
                  </h3>
                </div>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {t(`billing.plans.${planId}.price`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`billing.plans.${planId}.summary`)}
                </p>
              </div>

              <ul className="mb-4 flex-1 space-y-1.5">
                {Array.isArray(features) &&
                  features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check
                        className={cn("mt-0.5 size-3 shrink-0", accent.text)}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
              </ul>

              {isCurrentPlan ? (
                <Button variant="outline" size="sm" disabled className="w-full">
                  {t("billing.currentPlanBadge")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isCheckoutPending}
                  onClick={() => handleCheckout(planId)}
                >
                  {t("billing.upgradeCta")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
