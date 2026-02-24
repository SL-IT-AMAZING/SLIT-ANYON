import * as path from "node:path";

import { z } from "zod";

import { applyHunksToFiles, parsePatch, type Hunk } from "./patch_parser";
import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  patchText: z.string(),
});

type ApplyPatchInput = z.infer<typeof parameters>;

function resolveHunkPaths(hunks: Hunk[], cwd: string): Hunk[] {
  return hunks.map((hunk) => {
    if (hunk.type === "add") {
      return {
        ...hunk,
        path: path.resolve(cwd, hunk.path),
      };
    }

    if (hunk.type === "delete") {
      return {
        ...hunk,
        path: path.resolve(cwd, hunk.path),
      };
    }

    return {
      ...hunk,
      path: path.resolve(cwd, hunk.path),
      move_path: hunk.move_path ? path.resolve(cwd, hunk.move_path) : undefined,
    };
  });
}

export const applyPatchTool: NativeTool<ApplyPatchInput> = {
  id: "apply_patch",
  description: "Apply a structured multi-file patch to the filesystem",
  parameters,
  riskLevel: "dangerous",
  execute: async (input, ctx) => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const { hunks } = parsePatch(input.patchText);
    const resolvedHunks = resolveHunkPaths(hunks, ctx.appPath);
    const result = await applyHunksToFiles(resolvedHunks, ctx.appPath);

    return `Applied patch: ${result.added.length} files added, ${result.modified.length} modified, ${result.deleted.length} deleted`;
  },
};
