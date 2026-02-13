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

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  starter: "Starter Plan",
  pro: "Pro Plan",
  power: "Power Plan",
};

export function AccountMenu() {
  const { user, logout, isLogoutPending } = useAuth();
  const { isPaid, plan, usage, openCustomerPortal, startCheckout } =
    useEntitlement();

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
          {user.displayName ?? user.email ?? "Account"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.displayName ?? "Account"}</p>
          {user.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {PLAN_LABELS[plan] ?? "Free Plan"}
          </p>
          {isPaid && usage && (
            <p className="text-xs text-muted-foreground">
              {usage.creditsUsed.toLocaleString()} /{" "}
              {usage.creditsLimit.toLocaleString()} credits
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        {isPaid && (
          <DropdownMenuItem onClick={() => openCustomerPortal()}>
            <CreditCard className="mr-2 size-4" />
            Manage Subscription
          </DropdownMenuItem>
        )}
        {!isPaid && (
          <DropdownMenuItem onClick={() => startCheckout("starter")}>
            <Sparkles className="mr-2 size-4" />
            Upgrade
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => logout()} disabled={isLogoutPending}>
          <LogOut className="mr-2 size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
