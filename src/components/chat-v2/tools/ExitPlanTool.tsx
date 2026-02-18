import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface ExitPlanToolProps {
  notes?: string;
  node?: any;
  status?: ToolCallStatus;
  className?: string;
}

export function ExitPlanTool({
  notes: notesProp,
  node,
  className,
}: ExitPlanToolProps) {
  const { t } = useTranslation("chat");
  const notes = notesProp || node?.properties?.notes || "";

  const content = notes ? (
    <div className="text-sm text-muted-foreground">{notes}</div>
  ) : null;

  return (
    <ToolCallCard
      icon={LogOut}
      title={t("tools.planAccepted")}
      subtitle={t("tools.openingNewChat")}
      status="completed"
      defaultExpanded={!!content}
      className={className}
    >
      {content}
    </ToolCallCard>
  );
}
