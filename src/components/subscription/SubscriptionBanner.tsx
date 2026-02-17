import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckoutPlanDialog } from "./CheckoutPlanDialog";

const TIER_CONFIG = {
  free: {
    labelKey: "billing.plans.free.name",
    colorClass: "text-zinc-400",
    barClass: "bg-zinc-400",
    nextLabelKey: "billing.plans.starter.name",
    Icon: Sparkles,
  },
  starter: {
    labelKey: "billing.plans.starter.name",
    colorClass: "text-emerald-500",
    barClass: "bg-emerald-500",
    nextLabelKey: "billing.plans.pro.name",
    Icon: Sparkles,
  },
  pro: {
    labelKey: "billing.plans.pro.name",
    colorClass: "text-indigo-500",
    barClass: "bg-indigo-500",
    nextLabelKey: "billing.plans.power.name",
    Icon: Sparkles,
  },
  power: {
    labelKey: "billing.plans.power.name",
    colorClass: "text-amber-500",
    barClass: "bg-amber-500",
    nextLabelKey: null,
    Icon: Zap,
  },
} as const;

function getTierConfig(plan: string) {
  if (
    plan === "free" ||
    plan === "starter" ||
    plan === "pro" ||
    plan === "power"
  ) {
    return TIER_CONFIG[plan];
  }
  return null;
}

export function SubscriptionBanner() {
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const { t } = useTranslation("app");
  const { isAuthenticated } = useAuth();
  const { isPaid, plan, usage } = useEntitlement();

  if (!isAuthenticated) return null;

  const tier = getTierConfig(plan);
  if (!tier) return null;

  const usagePercent =
    usage && usage.creditsLimit > 0
      ? (usage.creditsUsed / usage.creditsLimit) * 100
      : 0;
  const isLow = usagePercent > 80;
  const isExhausted = usage ? usage.creditsUsed >= usage.creditsLimit : false;

  return (
    <>
      <div className="rounded-md border border-border bg-muted/50 p-2">
        <div className="flex items-center gap-1.5">
          <tier.Icon className={`size-3.5 ${tier.colorClass}`} />
          <span className="text-xs font-medium">{t(tier.labelKey)}</span>
        </div>
        {usage && usage.creditsLimit > 0 && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("billing.credits")}</span>
              <span>
                {usage.creditsUsed.toLocaleString()} /{" "}
                {usage.creditsLimit.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted">
              <div
                className={`h-1 rounded-full transition-all ${isLow ? "bg-amber-500" : tier.barClass}`}
                style={{
                  width: `${Math.min(100, usagePercent)}%`,
                }}
              />
            </div>
            {isExhausted && plan === "power" && (
              <p className="mt-1 text-xs text-amber-500">
                {t("billing.overageActive")}
              </p>
            )}
            {isExhausted && plan !== "power" && tier.nextLabelKey && (
              <button
                type="button"
                className={`mt-1 text-xs ${tier.colorClass} underline-offset-4 hover:underline`}
                onClick={() => setIsPlanDialogOpen(true)}
              >
                {t("billing.upgradeTo", { plan: t(tier.nextLabelKey) })}
              </button>
            )}
          </div>
        )}
        {!isPaid && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1.5 h-7 w-full justify-start gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
            onClick={() => setIsPlanDialogOpen(true)}
          >
            <Sparkles className="size-3" />
            <span className="text-xs">{t("billing.actions.upgrade")}</span>
          </Button>
        )}
      </div>
      <CheckoutPlanDialog
        isOpen={isPlanDialogOpen}
        onClose={() => setIsPlanDialogOpen(false)}
      />
    </>
  );
}
