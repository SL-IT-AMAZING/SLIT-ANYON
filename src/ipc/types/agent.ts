import { z } from "zod";
import { createEventClient, defineEvent } from "../contracts/core";

// =============================================================================
// Agent Schemas
// =============================================================================

/**
 * Schema for agent todo item.
 */
export const AgentTodoSchema = z.object({
  id: z.string(),
  content: z.string(),
  status: z.enum(["pending", "in_progress", "completed"]),
});

export type AgentTodo = z.infer<typeof AgentTodoSchema>;

/**
 * Schema for agent todos update payload.
 */
export const AgentTodosUpdateSchema = z.object({
  chatId: z.number(),
  todos: z.array(AgentTodoSchema),
});

export type AgentTodosUpdatePayload = z.infer<typeof AgentTodosUpdateSchema>;

/**
 * Schema for problem item (from tsc).
 * Matches the Problem interface in shared/tsc_types.ts
 */
export const ProblemSchema = z.object({
  file: z.string(),
  line: z.number(),
  column: z.number(),
  message: z.string(),
  code: z.number(),
  snippet: z.string(),
});

export type Problem = z.infer<typeof ProblemSchema>;

/**
 * Schema for problem report.
 * Matches the ProblemReport interface in shared/tsc_types.ts
 */
export const ProblemReportSchema = z.object({
  problems: z.array(ProblemSchema),
});

export type ProblemReport = z.infer<typeof ProblemReportSchema>;

/**
 * Schema for agent problems update payload.
 */
export const AgentProblemsUpdateSchema = z.object({
  appId: z.number(),
  problems: ProblemReportSchema,
});

export type AgentProblemsUpdatePayload = z.infer<
  typeof AgentProblemsUpdateSchema
>;

// =============================================================================
// Agent Event Contracts (Main -> Renderer)
// =============================================================================

export const agentEvents = {
  /**
   * Emitted when the agent's todo list is updated.
   */
  todosUpdate: defineEvent({
    channel: "agent-tool:todos-update",
    payload: AgentTodosUpdateSchema,
  }),

  /**
   * Emitted when the agent's problems report is updated.
   */
  problemsUpdate: defineEvent({
    channel: "agent-tool:problems-update",
    payload: AgentProblemsUpdateSchema,
  }),
} as const;

// =============================================================================
// Agent Clients
// =============================================================================

/**
 * Type-safe event client for agent events.
 *
 * @example
 * const unsubscribe = agentEventClient.onTodosUpdate((payload) => {
 *   updateTodoList(payload.todos);
 * });
 * // Later: unsubscribe();
 */
export const agentEventClient = createEventClient(agentEvents);
