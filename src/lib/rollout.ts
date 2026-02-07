import crypto from "node:crypto";
import { app } from "electron";

interface RolloutConfig {
  version: string;
  rolloutPercentage: number;
}

/**
 * Returns a stable rollout bucket (0–99) derived from `app.getPath('userData')`.
 * Deterministic: same machine always maps to the same bucket.
 */
export function getUserRolloutBucket(): number {
  const machineId = app.getPath("userData");
  const hash = crypto.createHash("md5").update(machineId).digest("hex");
  return parseInt(hash.substring(0, 8), 16) % 100;
}

/**
 * Checks remote rollout config to decide whether this user should receive an update.
 *
 * Fail-open: returns `true` on any fetch/parse error so updates are never blocked
 * by config infrastructure issues. Only gates the specific version in the config;
 * unrecognized versions pass through.
 */
export async function shouldApplyUpdate(
  currentVersion: string,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://api.dyad.sh/v1/update/rollout-config.json",
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return true;
    }

    const config: unknown = await response.json();

    if (
      typeof config !== "object" ||
      config === null ||
      !("version" in config) ||
      !("rolloutPercentage" in config)
    ) {
      return true;
    }

    const { version, rolloutPercentage } = config as RolloutConfig;

    if (typeof version !== "string" || typeof rolloutPercentage !== "number") {
      return true;
    }

    if (version !== currentVersion) {
      return true;
    }

    const bucket = getUserRolloutBucket();
    return bucket < rolloutPercentage;
  } catch {
    return true;
  }
}
