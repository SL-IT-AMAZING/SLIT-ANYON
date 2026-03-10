import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import {
  getPlanningArtifactKey,
  planningArtifactStateAtom,
} from "@/atoms/planningArtifactAtoms";
import {
  type PlanningArtifactType,
  planningArtifactClient,
} from "@/ipc/types/planning_artifacts";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export function usePlanningArtifact({
  artifactType,
  enabled = true,
}: {
  artifactType: PlanningArtifactType;
  enabled?: boolean;
}) {
  const chatId = useAtomValue(selectedChatIdAtom);
  const appId = useAtomValue(selectedAppIdAtom);
  const artifactState = useAtomValue(planningArtifactStateAtom);
  const setArtifactState = useSetAtom(planningArtifactStateAtom);

  const artifactKey = chatId
    ? getPlanningArtifactKey({ chatId, artifactType })
    : null;
  const hasArtifactInMemory = artifactKey
    ? artifactState.artifactsByKey.has(artifactKey)
    : false;

  const { data: savedArtifact, isLoading } = useQuery({
    queryKey: queryKeys.planningArtifacts.forChat({
      appId: appId ?? null,
      chatId: chatId ?? null,
      artifactType,
    }),
    queryFn: async () => {
      if (!appId || !chatId) return null;
      return planningArtifactClient.getPlanningArtifactForChat({
        appId,
        chatId,
        artifactType,
      });
    },
    enabled: !!appId && !!chatId && !hasArtifactInMemory && enabled,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!savedArtifact || !chatId || !artifactKey || hasArtifactInMemory) return;

    setArtifactState((prev) => {
      const next = new Map(prev.artifactsByKey);
      next.set(artifactKey, savedArtifact);
      return {
        ...prev,
        artifactsByKey: next,
      };
    });
  }, [
    artifactKey,
    chatId,
    hasArtifactInMemory,
    savedArtifact,
    setArtifactState,
  ]);

  return {
    savedArtifact,
    hasArtifactInMemory,
    isLoading,
  };
}
