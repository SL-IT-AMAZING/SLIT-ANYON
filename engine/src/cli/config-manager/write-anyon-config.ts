import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { parseJsonc } from "../../shared";
import type { ConfigMergeResult, InstallConfig } from "../types";
import { getConfigDir, getAnyonConfigPath } from "./config-context";
import { deepMergeRecord } from "./deep-merge-record";
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists";
import { formatErrorWithSuggestion } from "./format-error-with-suggestion";
import { generateAnyonConfig } from "./generate-anyon-config";

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0;
}

export function writeAnyonConfig(
  installConfig: InstallConfig,
): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists();
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    };
  }

  const anyonConfigPath = getAnyonConfigPath();

  try {
    const newConfig = generateAnyonConfig(installConfig);

    if (existsSync(anyonConfigPath)) {
      try {
        const stat = statSync(anyonConfigPath);
        const content = readFileSync(anyonConfigPath, "utf-8");

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(
            anyonConfigPath,
            JSON.stringify(newConfig, null, 2) + "\n",
          );
          return { success: true, configPath: anyonConfigPath };
        }

        const existing = parseJsonc<Record<string, unknown>>(content);
        if (
          !existing ||
          typeof existing !== "object" ||
          Array.isArray(existing)
        ) {
          writeFileSync(
            anyonConfigPath,
            JSON.stringify(newConfig, null, 2) + "\n",
          );
          return { success: true, configPath: anyonConfigPath };
        }

        const merged = deepMergeRecord(newConfig, existing);
        writeFileSync(anyonConfigPath, JSON.stringify(merged, null, 2) + "\n");
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          writeFileSync(
            anyonConfigPath,
            JSON.stringify(newConfig, null, 2) + "\n",
          );
          return { success: true, configPath: anyonConfigPath };
        }
        throw parseErr;
      }
    } else {
      writeFileSync(anyonConfigPath, JSON.stringify(newConfig, null, 2) + "\n");
    }

    return { success: true, configPath: anyonConfigPath };
  } catch (err) {
    return {
      success: false,
      configPath: anyonConfigPath,
      error: formatErrorWithSuggestion(err, "write anyon config"),
    };
  }
}
