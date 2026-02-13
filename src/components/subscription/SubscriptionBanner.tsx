import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Sparkles, Zap } from "lucide-react";

const TIER_CONFIG: Record<
  string,
  {
    label: string;
    colorClass: string;
    barClass: string;
    nextTier: string | null;
    nextLabel: string | null;
    Icon: typeof Sparkles;
  }
> = {
  starter: {
    label: "Starter",
    colorClass: "text-emerald-500",
    barClass: "bg-emerald-500",
    nextTier: "pro",
    nextLabel: "Pro",
    Icon: Sparkles,
  },
  pro: {
    label: "Pro",
    colorClass: "text-indigo-500",
    barClass: "bg-indigo-500",
    nextTier: "power",
    nextLabel: "Power",
    Icon: Sparkles,
  },
  power: {
    label: "Power",
    colorClass: "text-amber-500",
    barClass: "bg-amber-500",
    nextTier: null,
    nextLabel: null,
    Icon: Zap,
  },
};

export function SubscriptionBanner() {
  const { isAuthenticated } = useAuth();
  const { isPaid, plan, usage, startCheckout } = useEntitlement();

  if (!isAuthenticated) return null;

  if (isPaid) {
    const tier = TIER_CONFIG[plan];
    if (!tier) return null;

    const usagePercent =
      usage && usage.creditsLimit > 0
        ? (usage.creditsUsed / usage.creditsLimit) * 100
        : 0;
    const isLow = usagePercent > 80;
    const isExhausted = usage ? usage.creditsUsed >= usage.creditsLimit : false;

    return (
      <div className="rounded-md border border-border bg-muted/50 p-2">
        <div className="flex items-center gap-1.5">
          <tier.Icon className={`size-3.5 ${tier.colorClass}`} />
          <span className="text-xs font-medium">{tier.label}</span>
        </div>
        {usage && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Credits</span>
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
              <p className="mt-1 text-xs text-amber-500">Overage active</p>
            )}
            {isExhausted && plan !== "power" && tier.nextTier && (
              <button
                type="button"
                className={`mt-1 text-xs ${tier.colorClass} underline-offset-4 hover:underline`}
                onClick={() => startCheckout(tier.nextTier!)}
              >
                Upgrade to {tier.nextLabel}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
      onClick={() => startCheckout("starter")}
    >
      <Sparkles className="size-3.5" />
      <span className="text-xs">Upgrade to Starter</span>
    </Button>
  );
}
