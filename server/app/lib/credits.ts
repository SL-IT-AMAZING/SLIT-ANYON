import { POLAR_METER_ID, polar } from "./polar";

const MODEL_WEIGHTS: Record<string, number> = {
  "claude-opus-4-6": 5,
  "claude-opus-4": 5,
  "claude-opus-4-0514": 5,
  "claude-sonnet-4-5": 1,
  "claude-sonnet-4": 1,
  "claude-sonnet-4-0514": 1,
  "claude-haiku-4-5": 0.3,
  "claude-haiku-3.5": 0.3,
  "gpt-5.2": 1,
  "gpt-5.2-codex": 1,
  "gemini-3-pro": 0.5,
  "gemini-3-pro-preview": 0.5,
  "gemini-3-flash": 0.1,
  "gemini-3-flash-preview": 0.1,
  "grok-code-fast-1": 0.1,
  "big-pickle": 0,
  "glm-4-flash": 0,
};

/**
 * Returns the credit weight multiplier for a given model.
 * Unknown models default to 1x (charged as Sonnet-equivalent).
 */
export function getModelWeight(modelId: string): number {
  if (modelId in MODEL_WEIGHTS) return MODEL_WEIGHTS[modelId];

  const lower = modelId.toLowerCase();
  if (lower.includes("opus")) return 5;
  if (lower.includes("sonnet")) return 1;
  if (lower.includes("haiku")) return 0.3;
  if (lower.includes("flash") || lower.includes("grok")) return 0.1;
  if (lower.includes("gemini") && lower.includes("pro")) return 0.5;

  return 1;
}

/**
 * Ingests token consumption to Polar's metering system.
 * Applies model weight multiplier before sending.
 */
export async function ingestTokenUsage(
  externalCustomerId: string,
  rawTokens: number,
  modelId: string,
): Promise<void> {
  const weight = getModelWeight(modelId);
  if (weight === 0) return;

  const adjustedTokens = Math.ceil(rawTokens * weight);

  if (!POLAR_METER_ID) {
    console.warn("POLAR_METER_ID not set - skipping usage ingestion");
    return;
  }

  try {
    await polar.events.ingest({
      events: [
        {
          name: "credit.consumed",
          externalCustomerId,
          metadata: { amount: adjustedTokens },
          timestamp: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error("Failed to ingest token usage to Polar:", error);
  }
}
