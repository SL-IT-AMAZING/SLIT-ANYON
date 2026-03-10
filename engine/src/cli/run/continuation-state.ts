import { getPlanProgress, readThesisState } from "../../features/thesis-state";
import {
  getActiveContinuationMarkerReason,
  isContinuationMarkerActive,
  readContinuationMarker,
} from "../../features/run-continuation-state";
import { readState as readPersistLoopState } from "../../hooks/persist-loop/storage";

export interface ContinuationState {
  hasActiveThesis: boolean;
  hasActivePersistLoop: boolean;
  hasHookMarker: boolean;
  hasTodoHookMarker: boolean;
  hasActiveHookMarker: boolean;
  activeHookMarkerReason: string | null;
}

export function getContinuationState(
  directory: string,
  sessionID: string,
): ContinuationState {
  const marker = readContinuationMarker(directory, sessionID);

  return {
    hasActiveThesis: hasActiveThesisContinuation(directory, sessionID),
    hasActivePersistLoop: hasActivePersistLoopContinuation(
      directory,
      sessionID,
    ),
    hasHookMarker: marker !== null,
    hasTodoHookMarker: marker?.sources.todo !== undefined,
    hasActiveHookMarker: isContinuationMarkerActive(marker),
    activeHookMarkerReason: getActiveContinuationMarkerReason(marker),
  };
}

function hasActiveThesisContinuation(
  directory: string,
  sessionID: string,
): boolean {
  const thesis = readThesisState(directory);
  if (!thesis) return false;
  if (!thesis.session_ids.includes(sessionID)) return false;

  const progress = getPlanProgress(thesis.active_plan);
  return !progress.isComplete;
}

function hasActivePersistLoopContinuation(
  directory: string,
  sessionID: string,
): boolean {
  const state = readPersistLoopState(directory);
  if (!state || !state.active) return false;

  if (state.session_id && state.session_id !== sessionID) {
    return false;
  }

  return true;
}
