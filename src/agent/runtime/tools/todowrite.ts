import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  todos: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      priority: z.number().optional(),
    }),
  ),
});

type TodoWriteInput = z.infer<typeof parameters>;

export const todoWriteTool: NativeTool<TodoWriteInput> = {
  id: "todowrite",
  description: "Create or update the current todo list",
  parameters,
  riskLevel: "safe",
  async execute() {
    return "Todos updated successfully";
  },
};
