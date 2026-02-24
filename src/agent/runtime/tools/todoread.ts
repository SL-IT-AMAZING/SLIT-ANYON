import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({});

type TodoReadInput = z.infer<typeof parameters>;

export const todoReadTool: NativeTool<TodoReadInput> = {
  id: "todoread",
  description: "Read the current todo list",
  parameters,
  riskLevel: "safe",
  async execute() {
    return JSON.stringify([]);
  },
};
