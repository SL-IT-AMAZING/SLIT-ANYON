import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";

export const writeTool: NativeTool<{
  content: string;
  filePath: string;
}> = {
  id: "write",
  description: "Write text content to a file path.",
  parameters: z.object({
    content: z.string(),
    filePath: z.string(),
  }),
  riskLevel: "dangerous",
  async execute(input, ctx) {
    const resolvedPath = path.isAbsolute(input.filePath)
      ? input.filePath
      : path.join(ctx.appPath, input.filePath);

    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    let existed = true;
    try {
      await fs.access(resolvedPath);
    } catch {
      existed = false;
    }

    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, input.content, "utf8");

    if (existed) {
      return "Wrote file successfully (overwrote existing file).";
    }

    return "Wrote file successfully (created new file).";
  },
};
