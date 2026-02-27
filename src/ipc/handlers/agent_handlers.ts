import { createTypedHandler } from "./base";
import { agentContracts } from "../types/agent";
import { resolveAgentQuestion } from "../../agent/runtime/question";

export function registerAgentHandlers() {
  createTypedHandler(
    agentContracts.respondToQuestion,
    async (_event, input) => {
      resolveAgentQuestion(input.requestId, input.answers);
    },
  );
}
