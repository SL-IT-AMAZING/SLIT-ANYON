import type {
  PlanningArtifact,
  PlanningArtifactType,
} from "@/ipc/types/planning_artifacts";
import { atom } from "jotai";

export interface PlanningArtifactState {
  artifactsByKey: Map<string, PlanningArtifact>;
}

export const planningArtifactStateAtom = atom<PlanningArtifactState>({
  artifactsByKey: new Map(),
});

export function getPlanningArtifactKey(params: {
  chatId: number;
  artifactType: PlanningArtifactType;
}) {
  return `${params.chatId}:${params.artifactType}`;
}
