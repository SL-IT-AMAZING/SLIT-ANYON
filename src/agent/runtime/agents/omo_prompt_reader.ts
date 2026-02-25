import fs from "node:fs";
import path from "node:path";

const OMO_PROMPTS_DIR = path.join(__dirname, "../../../prompts/omo-agents");

/**
 * Read an OMO agent prompt file from prompts/omo-agents/.
 * Returns the file contents trimmed, or empty string if not found.
 */
export function readPromptFile(fileName: string): string {
  try {
    return fs.readFileSync(path.join(OMO_PROMPTS_DIR, fileName), "utf8").trim();
  } catch {
    return "";
  }
}
