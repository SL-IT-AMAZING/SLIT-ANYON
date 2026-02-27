import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({});

type BackgroundStatusInput = z.infer<typeof parameters>;

export const backgroundStatusTool: NativeTool<BackgroundStatusInput> = {
  id: "mcp_background_status",
  description: "Get status for all background tasks",
  parameters,
  riskLevel: "safe",
  execute: async (_input, context) => {
    if (!context.backgroundManager) {
      return "BackgroundManager is not available in this runtime.";
    }

    const tasks = context.backgroundManager.getAllTasks();
    if (tasks.length === 0) {
      return "No background tasks.";
    }

    const rows = tasks
      .map((task) => {
        const end = task.completedAt ?? Date.now();
        const duration = Math.max(0, end - task.startedAt);
        const description = task.description.replace(/\|/g, "\\|");
        return `| ${task.id} | ${task.agentName} | ${task.status} | ${description} | ${duration}ms |`;
      })
      .join("\n");

    return `| Task ID | Agent | Status | Description | Duration |\n|---|---|---|---|---|\n${rows}`;
  },
};
