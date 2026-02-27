import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  line: z.number(),
  character: z.number(),
  includeDeclaration: z.boolean().optional(),
});

type LspFindReferencesInput = z.infer<typeof parameters>;

export const lspFindReferencesTool: NativeTool<LspFindReferencesInput> = {
  id: "mcp_lsp_find_references",
  description: "Find symbol references via language server",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
