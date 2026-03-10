import type { InstallConfig } from "../types";
import { generateModelConfig } from "../model-fallback";

export function generateAnyonConfig(
  installConfig: InstallConfig,
): Record<string, unknown> {
  return generateModelConfig(installConfig);
}
