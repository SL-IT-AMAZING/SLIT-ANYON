import { POLAR_METER_ID, polar } from "./polar.ts";

/**
 * Model weight multipliers for adjusted token tracking.
 * Opus costs 2x, Sonnet 1x, Haiku and free models 0x.
 */
const MODEL_WEIGHTS: Record<string, number> = {
  // Opus models (2x weight)
  "claude-opus-4": 2,
  "claude-opus-4-0514": 2,
  // Sonnet models (1x weight)
  "claude-sonnet-4": 1,
  "claude-sonnet-4-0514": 1,
  "claude-sonnet-4.5": 1,
  // Haiku models (free)
  "claude-haiku-3.5": 0,
  // Free/local models (0x - no metering)
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
  if (lower.includes("opus")) return 2;
  if (lower.includes("sonnet")) return 1;
  if (lower.includes("haiku")) return 0;

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
