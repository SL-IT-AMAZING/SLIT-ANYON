import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  filePath: z.string(),
  severity: z.string().optional(),
});

type LspDiagnosticsInput = z.infer<typeof parameters>;

export const lspDiagnosticsTool: NativeTool<LspDiagnosticsInput> = {
  id: "mcp_lsp_diagnostics",
  description: "Get diagnostics from language server",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "LSP tools require language server setup (Phase 8)";
  },
};
