import { CheckoutPlanDialog } from "@/components/subscription/CheckoutPlanDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { CreditCard, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function getCurrentPlanLabelKey(plan: string) {
  switch (plan) {
    case "starter":
      return "billing.currentPlan.starter" as const;
    case "pro":
      return "billing.currentPlan.pro" as const;
    case "power":
      return "billing.currentPlan.power" as const;
    default:
      return "billing.currentPlan.free" as const;
  }
}

export function AccountMenu() {
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const { t } = useTranslation("app");
  const { user, logout, isLogoutPending } = useAuth();
  const { isPaid, plan, usage, openCustomerPortal } = useEntitlement();

  if (!user) return null;

  const initial = (user.displayName ?? user.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="w-full justify-start gap-2 px-2" />
        }
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-6 rounded-full" />
          ) : (
            initial
          )}
        </div>
        <span className="truncate text-sm">
          {user.displayName ?? user.email ?? t("billing.account")}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">
            {user.displayName ?? t("billing.account")}
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t(getCurrentPlanLabelKey(plan))}
          </p>
          {isPaid && usage && (
            <p className="text-xs text-muted-foreground">
              {t("billing.usage", {
                used: usage.creditsUsed.toLocaleString(),
                limit: usage.creditsLimit.toLocaleString(),
              })}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        {isPaid && (
          <DropdownMenuItem onClick={() => openCustomerPortal()}>
            <CreditCard className="mr-2 size-4" />
            {t("billing.actions.billingAndRefunds")}
          </DropdownMenuItem>
        )}
        {!isPaid && (
          <DropdownMenuItem onClick={() => setIsPlanDialogOpen(true)}>
            <Sparkles className="mr-2 size-4" />
            {t("billing.actions.upgrade")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => logout()} disabled={isLogoutPending}>
          <LogOut className="mr-2 size-4" />
          {t("billing.actions.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CheckoutPlanDialog
        isOpen={isPlanDialogOpen}
        onClose={() => setIsPlanDialogOpen(false)}
      />
    </DropdownMenu>
  );
}
