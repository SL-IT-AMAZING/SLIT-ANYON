import { z } from "zod";

import type { NativeTool } from "../tool_interface";

export const planEnterTool: NativeTool<Record<string, never>> = {
  id: "plan_enter",
  description:
    "Switch to plan mode for research and planning. In plan mode, the agent focuses on creating plans saved to .sisyphus/ directory without making code changes. Use this when the task requires planning before implementation.",
  parameters: z.object({}),
  riskLevel: "safe",
  async execute(_input, context) {
    const answers = await context.askQuestion({
      questions: [
        {
          question:
            "Would you like to switch to plan mode for research and planning?",
          header: "Plan Mode",
          options: [
            {
              label: "Yes",
              description: "Switch to plan agent for research and planning",
            },
            {
              label: "No",
              description: "Stay with current agent to continue making changes",
            },
          ],
        },
      ],
    });

    const answer = answers[0]?.selectedOptions?.[0];
    if (answer === "No" || !answer) {
      return "User declined to switch to plan mode. Continue with current task.";
    }

    return "User confirmed switching to plan mode. Focus on creating plans in .sisyphus/ directory. Do NOT modify source code files — only create/edit .md plan files in .sisyphus/ directory.";
  },
};

export const planExitTool: NativeTool<Record<string, never>> = {
  id: "plan_exit",
  description:
    "Exit plan mode and switch back to build/implementation mode. Use this when the plan is complete and ready for implementation.",
  parameters: z.object({}),
  riskLevel: "safe",
  async execute(_input, context) {
    const answers = await context.askQuestion({
      questions: [
        {
          question:
            "Plan is complete. Would you like to switch to build mode and start implementing?",
          header: "Build Mode",
          options: [
            {
              label: "Yes",
              description:
                "Switch to build agent and start implementing the plan",
            },
            {
              label: "No",
              description: "Stay in plan mode to continue refining the plan",
            },
          ],
        },
      ],
    });

    const answer = answers[0]?.selectedOptions?.[0];
    if (answer === "No" || !answer) {
      return "User declined to switch to build mode. Continue refining the plan.";
    }

    return "User approved switching to build mode. The plan has been approved. Execute the plan now — you may create and modify source code files.";
  },
};
