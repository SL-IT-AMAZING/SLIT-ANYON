import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  scope: z.enum(["document", "workspace"]),
  query: z.string().optional(),
  limit: z.number().optional(),
});

type LspSymbolsInput = z.infer<typeof parameters>;

export const lspSymbolsTool: NativeTool<LspSymbolsInput> = {
  id: "mcp_lsp_symbols",
  description: "List symbols from file or workspace",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
