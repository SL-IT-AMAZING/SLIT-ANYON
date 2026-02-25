import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  line: z.number(),
  character: z.number(),
  newName: z.string(),
});

type LspRenameInput = z.infer<typeof parameters>;

export const lspRenameTool: NativeTool<LspRenameInput> = {
  id: "mcp_lsp_rename",
  description: "Rename a symbol via language server",
  parameters,
  riskLevel: "moderate",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
