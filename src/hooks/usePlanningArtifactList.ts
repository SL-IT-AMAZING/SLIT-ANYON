import { useMemo } from "react";
import { usePlan } from "./usePlan";
import { usePlanningArtifact } from "./usePlanningArtifact";

export function usePlanningArtifactList() {
  const { savedArtifact: draft } = usePlanningArtifact({ artifactType: "draft" });
  const { savedArtifact: founderBrief } = usePlanningArtifact({
    artifactType: "founder_brief",
  });
  const { savedArtifact: internalSpec } = usePlanningArtifact({
    artifactType: "internal_build_spec",
  });
  const { savedArtifact: userFlowSpec } = usePlanningArtifact({
    artifactType: "user_flow_spec",
  });
  const { savedPlan } = usePlan();

  const artifacts = useMemo(
    () => [
      draft
        ? {
            key: "draft",
            label: "Draft",
            title: draft.title,
            status: draft.metadata.status ?? "draft",
            content: draft.content,
          }
        : null,
      founderBrief
        ? {
            key: "founder_brief",
            label: "Founder Brief",
            title: founderBrief.title,
            status: founderBrief.metadata.status ?? "draft",
            content: founderBrief.content,
          }
        : null,
      internalSpec
        ? {
            key: "internal_build_spec",
            label: "Internal Spec",
            title: internalSpec.title,
            status: internalSpec.metadata.status ?? "draft",
            content: internalSpec.content,
          }
        : null,
      userFlowSpec
        ? {
            key: "user_flow_spec",
            label: "User Flows",
            title: userFlowSpec.title,
            status: userFlowSpec.metadata.status ?? "draft",
            content: userFlowSpec.content,
          }
        : null,
      savedPlan
        ? {
            key: "wave_plan",
            label: "Wave Plan",
            title: savedPlan.title,
            status: "active",
            content: savedPlan.content,
          }
        : null,
    ].filter(Boolean),
    [draft, founderBrief, internalSpec, userFlowSpec, savedPlan],
  );

  return {
    artifacts,
    hasArtifacts: artifacts.length > 0,
  };
}
