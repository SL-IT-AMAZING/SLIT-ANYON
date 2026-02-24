import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      header: z.string(),
      options: z.array(
        z.object({
          label: z.string(),
          description: z.string(),
        }),
      ),
      multiple: z.boolean().optional(),
    }),
  ),
});

type QuestionInput = z.infer<typeof parameters>;

export const questionTool: NativeTool<QuestionInput> = {
  id: "question",
  description: "Ask the user structured questions",
  parameters,
  riskLevel: "safe",
  async execute(input, ctx) {
    const answers = await ctx.askQuestion({ questions: input.questions });
    return answers
      .map(
        (answer) => `${answer.question}: ${answer.selectedOptions.join(", ")}`,
      )
      .join("\n");
  },
};
