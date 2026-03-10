import { selectedAppIdAtom } from "@/atoms/appAtoms";
import {
  pendingPlanImplementationAtom,
  pendingPlanningArtifactImplementationAtom,
} from "@/atoms/planAtoms";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/types";
import { planClient } from "@/ipc/types/plan";
import { useAtomValue, useSetAtom } from "jotai";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

function getPlanSlugFromPath(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop();
  if (!fileName?.endsWith(".md")) return null;
  return fileName.replace(/\.md$/, "");
}

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
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const selectedChatId = useAtomValue(selectedChatIdAtom);
  const setPendingArtifactImplementation = useSetAtom(
    pendingPlanningArtifactImplementationAtom,
  );
  const setPendingPlanImplementation = useSetAtom(pendingPlanImplementationAtom);
  const [isStarting, setIsStarting] = useState(false);
  const notes = notesProp || node?.properties?.notes || "";

  const handleStartBuilding = async () => {
    if (!selectedAppId || !selectedChatId || isStarting) return;

    setIsStarting(true);
    try {
      const founderBrief = await ipc.planningArtifact.getPlanningArtifactForChat({
        appId: selectedAppId,
        chatId: selectedChatId,
        artifactType: "founder_brief",
      });

      if (founderBrief) {
        await ipc.planningArtifact.updatePlanningArtifact({
          appId: selectedAppId,
          id: founderBrief.id,
          artifactType: "founder_brief",
          metadata: {
            ...founderBrief.metadata,
            status: "approved",
            source: "builder-exit-card",
          },
        });
        setPendingArtifactImplementation({
          chatId: selectedChatId,
          title: founderBrief.title,
          artifactId: founderBrief.id,
          artifactType: "founder_brief",
        });
        return;
      }

      const internalSpec =
        await ipc.planningArtifact.getPlanningArtifactForChat({
          appId: selectedAppId,
          chatId: selectedChatId,
          artifactType: "internal_build_spec",
        });

      if (internalSpec) {
        await ipc.planningArtifact.updatePlanningArtifact({
          appId: selectedAppId,
          id: internalSpec.id,
          artifactType: "internal_build_spec",
          metadata: {
            ...internalSpec.metadata,
            status: "approved",
            source: "builder-exit-card",
          },
        });
        setPendingArtifactImplementation({
          chatId: selectedChatId,
          title: internalSpec.title,
          artifactId: internalSpec.id,
          artifactType: "internal_build_spec",
        });
        return;
      }

      const plan = await planClient.getPlanForChat({
        appId: selectedAppId,
        chatId: selectedChatId,
      });
      if (plan) {
        const planSlug = getPlanSlugFromPath(`${plan.id}.md`);
        if (planSlug) {
          setPendingPlanImplementation({
            chatId: selectedChatId,
            title: plan.title,
            planSlug,
          });
        }
      }
    } finally {
      setIsStarting(false);
    }
  };

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
      <div className="mt-3 flex justify-start">
        <Button size="sm" onClick={handleStartBuilding} disabled={isStarting}>
          {isStarting ? "Starting build..." : "Start Building"}
        </Button>
      </div>
    </ToolCallCard>
  );
}
