import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  line: z.number(),
  character: z.number(),
});

type LspGotoDefinitionInput = z.infer<typeof parameters>;

export const lspGotoDefinitionTool: NativeTool<LspGotoDefinitionInput> = {
  id: "mcp_lsp_goto_definition",
  description: "Find symbol definition via language server",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
