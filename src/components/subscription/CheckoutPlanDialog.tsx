import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useTranslation } from "react-i18next";

type PlanId = "starter" | "pro" | "power";

interface CheckoutPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_OPTIONS: PlanId[] = ["starter", "pro", "power"];

export function CheckoutPlanDialog({
  isOpen,
  onClose,
}: CheckoutPlanDialogProps) {
  const { t } = useTranslation("app");
  const { startCheckout, isCheckoutPending } = useEntitlement();

  const handleCheckout = async (planId: PlanId) => {
    await startCheckout(planId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("billing.choosePlanTitle")}</DialogTitle>
          <DialogDescription>
            {t("billing.choosePlanDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {PLAN_OPTIONS.map((planId) => (
            <Button
              key={planId}
              variant="outline"
              className="h-auto w-full justify-between px-3 py-3"
              disabled={isCheckoutPending}
              onClick={() => handleCheckout(planId)}
            >
              <span className="text-left">
                <span className="block text-sm font-medium">
                  {t(`billing.plans.${planId}.name`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`billing.plans.${planId}.summary`)}
                </span>
              </span>
              <span className="text-sm font-semibold">
                {t(`billing.plans.${planId}.price`)}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
