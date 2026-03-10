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
import type { ReactNode } from "react";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

function getPlanSlug(planId: string) {
  return planId.replace(/\.md$/, "");
}

interface WritePlanToolProps {
  title?: string;
  summary?: string;
  complete?: string;
  artifactId?: string;
  artifactType?: "founder_brief" | "internal_build_spec";
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WritePlanTool({
  title: titleProp,
  summary: summaryProp,
  complete: completeProp,
  artifactId: artifactIdProp,
  artifactType: artifactTypeProp,
  node,
  status,
  children,
  className,
}: WritePlanToolProps) {
  const { t } = useTranslation("chat");
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const selectedChatId = useAtomValue(selectedChatIdAtom);
  const setPendingArtifactImplementation = useSetAtom(
    pendingPlanningArtifactImplementationAtom,
  );
  const setPendingPlanImplementation = useSetAtom(pendingPlanImplementationAtom);
  const [isAccepting, setIsAccepting] = useState(false);
  const planTitle = titleProp || node?.properties?.title || "";
  const summary = summaryProp || node?.properties?.summary || "";
  const complete = completeProp || node?.properties?.complete || "";
  const artifactId = artifactIdProp || node?.properties?.artifactId || "";
  const artifactType =
    artifactTypeProp ||
    (node?.properties?.artifactType as
      | "founder_brief"
      | "internal_build_spec"
      | undefined);

  const isInProgress = status === "running" || complete === "false";

  const handleAccept = async () => {
    if (!selectedAppId || !selectedChatId || isAccepting || isInProgress) return;

    setIsAccepting(true);
    try {
      if (artifactId && artifactType) {
        await ipc.planningArtifact.updatePlanningArtifact({
          appId: selectedAppId,
          id: artifactId,
          artifactType,
          metadata: {
            status: "approved",
            source: "builder-plan-card",
          },
        });
        setPendingArtifactImplementation({
          chatId: selectedChatId,
          title: planTitle,
          artifactId,
          artifactType,
        });
        return;
      }

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
            source: "builder-plan-card",
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
            source: "builder-plan-card",
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
        setPendingPlanImplementation({
          chatId: selectedChatId,
          title: plan.title,
          planSlug: getPlanSlug(plan.id),
        });
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const metadata = isInProgress
    ? [{ label: "status", value: "Shaping founder brief..." }]
    : undefined;

  const content = summary ? (
    <div className="text-sm text-muted-foreground italic">{summary}</div>
  ) : children ? (
    <div className="text-sm text-muted-foreground">{children}</div>
  ) : null;

  return (
    <ToolCallCard
      icon={ClipboardList}
      title={t("tools.writePlan")}
      subtitle={planTitle}
      status={status}
      metadata={metadata}
      defaultExpanded={!!content}
      className={className}
    >
      {content}
      {!isInProgress && (
        <div className="mt-3 flex justify-start">
          <Button size="sm" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? "Starting build..." : "Accept Plan"}
          </Button>
        </div>
      )}
    </ToolCallCard>
  );
}
