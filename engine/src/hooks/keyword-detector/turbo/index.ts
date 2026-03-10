/**
 * Turbo message module - routes to appropriate message based on agent/model.
 *
 * Routing:
 * 1. Planner agents (strategist, plan) → planner.ts
 * 2. GPT 5.2 models → gpt5.2.ts
 * 3. Gemini models → gemini.ts
 * 4. Default (Claude, etc.) → default.ts (optimized for Claude series)
 */

export {
  isPlannerAgent,
  isGptModel,
  isGeminiModel,
  getTurboSource,
} from "./source-detector";
export type { TurboSource } from "./source-detector";
export { TURBO_PLANNER_SECTION, getPlannerTurboMessage } from "./planner";
export { TURBO_GPT_MESSAGE, getGptTurboMessage } from "./gpt5.2";
export { TURBO_GEMINI_MESSAGE, getGeminiTurboMessage } from "./gemini";
export { TURBO_DEFAULT_MESSAGE, getDefaultTurboMessage } from "./default";

import { getTurboSource } from "./source-detector";
import { getPlannerTurboMessage } from "./planner";
import { getGptTurboMessage } from "./gpt5.2";
import { getDefaultTurboMessage } from "./default";
import { getGeminiTurboMessage } from "./gemini";

/**
 * Gets the appropriate turbo message based on agent and model context.
 */
export function getTurboMessage(agentName?: string, modelID?: string): string {
  const source = getTurboSource(agentName, modelID);

  switch (source) {
    case "planner":
      return getPlannerTurboMessage();
    case "gpt":
      return getGptTurboMessage();
    case "gemini":
      return getGeminiTurboMessage();
    case "default":
    default:
      return getDefaultTurboMessage();
  }
}
