import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { cn } from "@/lib/utils";
import { Brain, CreditCard, Settings, Sparkles, Workflow } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AIPanel } from "./panels/AIPanel";
import { BillingPanel } from "./panels/BillingPanel";
import { GeneralPanel } from "./panels/GeneralPanel";
import { PricingPlansPanel } from "./panels/PricingPlansPanel";
import { WorkflowPanel } from "./panels/WorkflowPanel";

type SettingsTab = "general" | "workflow" | "ai" | "billing" | "pricingPlans";

const NAV_SECTIONS = [
  {
    titleKey: "settings.sections.general" as const,
    items: [
      {
        id: "general" as const,
        icon: Settings,
        labelKey: "settings.tabs.general" as const,
      },
      {
        id: "workflow" as const,
        icon: Workflow,
        labelKey: "settings.tabs.workflow" as const,
      },
      { id: "ai" as const, icon: Brain, labelKey: "settings.tabs.ai" as const },
    ],
  },

  {
    titleKey: "settings.sections.account" as const,
    items: [
      {
        id: "billing" as const,
        icon: CreditCard,
        labelKey: "settings.tabs.billing" as const,
      },
      {
        id: "pricingPlans" as const,
        icon: Sparkles,
        labelKey: "settings.tabs.pricingPlans" as const,
      },
    ],
  },
];

const TAB_PANELS: Record<SettingsTab, React.ComponentType> = {
  general: GeneralPanel,
  workflow: WorkflowPanel,
  ai: AIPanel,
  billing: BillingPanel,
  pricingPlans: PricingPlansPanel,
};

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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useTranslation("app");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { isAuthenticated, user } = useAuth();
  const { plan } = useEntitlement();

  const ActivePanel = TAB_PANELS[activeTab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <DialogContent
        className="sm:max-w-4xl w-[900px] h-[600px] p-0 gap-0 overflow-hidden !flex flex-col data-open:!animate-none data-closed:!animate-none data-open:!duration-0 data-closed:!duration-0"
        overlayClassName="data-open:!animate-none data-closed:!animate-none data-open:!duration-0 data-closed:!duration-0"
        showCloseButton
      >
        <DialogTitle className="sr-only">{t("settings.title")}</DialogTitle>
        <div className="flex flex-1 min-h-0">
          <aside className="flex w-56 shrink-0 min-h-0 flex-col border-r border-border bg-muted/30">
            {isAuthenticated && user && (
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="size-8 rounded-full"
                      />
                    ) : (
                      (user.displayName ?? user.email ?? "?")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.displayName ?? user.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(getCurrentPlanLabelKey(plan))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="min-h-0 flex-1">
              <nav className="p-2 space-y-3">
                {NAV_SECTIONS.map((section, sectionIdx) => (
                  <div key={section.titleKey}>
                    {sectionIdx > 0 && <Separator className="mb-3" />}
                    <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t(section.titleKey)}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                            activeTab === item.id
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                          )}
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          <div className="min-h-0 flex-1 min-w-0 overflow-y-auto">
            <div className="p-6">
              <ActivePanel />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
