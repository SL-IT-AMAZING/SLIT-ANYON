import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  line: z.number(),
  character: z.number(),
});

type LspPrepareRenameInput = z.infer<typeof parameters>;

export const lspPrepareRenameTool: NativeTool<LspPrepareRenameInput> = {
  id: "mcp_lsp_prepare_rename",
  description: "Check if a symbol can be renamed",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
