import * as fs from "node:fs";
import * as path from "node:path";

import { z } from "zod";

import type { NativeTool } from "../tool_interface";

export const multieditTool: NativeTool<{
  filePath: string;
  edits: Array<{ oldString: string; newString: string }>;
}> = {
  id: "multiedit",
  description:
    "Apply multiple edits to a single file in one operation. Each edit replaces an exact string match. Edits are applied sequentially. More efficient than multiple separate edit calls for the same file.",
  parameters: z.object({
    filePath: z.string().describe("The absolute path to the file to modify"),
    edits: z
      .array(
        z.object({
          oldString: z.string().describe("The exact text to find and replace"),
          newString: z.string().describe("The replacement text"),
        }),
      )
      .describe("Array of edit operations to apply sequentially"),
  }),
  riskLevel: "dangerous",
  async execute(input, ctx) {
    const { filePath, edits } = input;

    if (!filePath) {
      return "Error: filePath is required";
    }
    if (!edits || edits.length === 0) {
      return "Error: at least one edit is required";
    }

    // Resolve path relative to app path
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(ctx.appPath, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return `Error: File not found: ${resolvedPath}`;
    }

    let content = fs.readFileSync(resolvedPath, "utf-8");
    const results: string[] = [];
    let appliedCount = 0;

    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      if (!edit.oldString && !edit.newString) {
        results.push(`Edit ${i + 1}: Skipped (empty old and new strings)`);
        continue;
      }

      if (edit.oldString === edit.newString) {
        results.push(
          `Edit ${i + 1}: Skipped (old and new strings are identical)`,
        );
        continue;
      }

      const idx = content.indexOf(edit.oldString);
      if (idx === -1) {
        results.push(`Edit ${i + 1}: Failed — oldString not found in file`);
        continue;
      }

      content =
        content.substring(0, idx) +
        edit.newString +
        content.substring(idx + edit.oldString.length);
      appliedCount++;
      results.push(`Edit ${i + 1}: Applied successfully`);
    }

    if (appliedCount > 0) {
      fs.writeFileSync(resolvedPath, content, "utf-8");
    }

    const relativePath = path.relative(ctx.appPath, resolvedPath);
    return `${appliedCount}/${edits.length} edits applied to ${relativePath}\n${results.join("\n")}`;
  },
};
