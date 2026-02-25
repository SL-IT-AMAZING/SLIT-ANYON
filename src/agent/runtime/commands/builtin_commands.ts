import type { Command } from "./types";

/**
 * Builtin slash commands -- these are available in every ANYON session.
 * Each command has a name, description, and optional template/handler.
 * Templates are injected into the agent's context when the command is invoked.
 */
export const BUILTIN_COMMANDS: Command[] = [
  {
    name: "sisyphus",
    description: "Activate Sisyphus multi-agent orchestration mode",
    scope: "builtin",
    template:
      "Activate Sisyphus multi-agent orchestration mode for this task. Use todo tracking, agent delegation, and verification.",
  },
  {
    name: "ultrawork",
    description:
      "Activate maximum performance mode with parallel agent orchestration",
    scope: "builtin",
    template:
      "Activate maximum performance mode (ULTRAWORK). Parallelize everything. Launch multiple subagents concurrently. Never wait when you can work.",
  },
  {
    name: "plan",
    description: "Start a planning session with Prometheus",
    scope: "builtin",
    template:
      "Start a strategic planning session. Interview the user about requirements, then create a comprehensive implementation plan.",
  },
  {
    name: "review",
    description: "Review a plan with Momus",
    scope: "builtin",
    template:
      "Review the current plan with critical evaluation. Find flaws, gaps, and ambiguities. Rate each issue by severity.",
  },
  {
    name: "ralph-loop",
    description:
      "Start self-referential development loop until task completion",
    scope: "builtin",
    template:
      "Activate Ralph Loop -- continue working until ALL tasks are complete. Do not stop with incomplete work. Verify task completion before finishing.",
  },
  {
    name: "cancel-ralph",
    description: "Cancel active Ralph Loop",
    scope: "builtin",
    template: "Cancel the active Ralph Loop for this session.",
  },
  {
    name: "ulw-loop",
    description:
      "Start ultrawork loop -- continues until completion with ultrawork mode",
    scope: "builtin",
    template:
      "Start ultrawork loop -- activate maximum performance mode and continue until all tasks are complete.",
  },
  {
    name: "init-deep",
    description: "Initialize hierarchical AGENTS.md knowledge base",
    scope: "builtin",
    template:
      "Initialize a hierarchical AGENTS.md knowledge base for this project. Create documentation structure for agent collaboration.",
  },
  {
    name: "start-work",
    description: "Start Sisyphus work session from Prometheus plan",
    scope: "builtin",
    template:
      "Start executing the Prometheus plan. Load the plan file, create todos from plan items, and begin implementation.",
  },
  {
    name: "deepsearch",
    description: "Perform a thorough search across the codebase",
    scope: "builtin",
    template:
      "Perform a thorough, deep search across the entire codebase. Use multiple search strategies (grep, glob, AST) to find all relevant code.",
  },
  {
    name: "analyze",
    description: "Perform deep analysis and investigation",
    scope: "builtin",
    template:
      "Perform deep analysis and investigation of the specified target. Examine all angles, trace dependencies, and provide comprehensive findings.",
  },
  {
    name: "prometheus",
    description: "Start strategic planning with interview workflow",
    scope: "builtin",
    template:
      "Start a Prometheus strategic planning session. Interview the user about their requirements before creating a plan.",
  },
  {
    name: "orchestrator",
    description: "Activate Orchestrator-Sisyphus for complex multi-step tasks",
    scope: "builtin",
    template:
      "Activate orchestrator mode. Delegate all substantive work to specialized subagents. Coordinate, don't implement directly.",
  },
  {
    name: "handoff",
    description:
      "Create a detailed context summary for continuing work in a new session",
    scope: "builtin",
    template:
      "Create a detailed handoff document summarizing: current state, completed work, remaining tasks, key decisions, and important context for the next session.",
  },
  {
    name: "refactor",
    description:
      "Intelligent refactoring with LSP, AST-grep, and TDD verification",
    scope: "builtin",
    template:
      "Perform intelligent refactoring. Use LSP for safe renames, AST-grep for pattern matching, and verify with tests after each change.",
  },
  {
    name: "stop-continuation",
    description:
      "Stop all continuation mechanisms (ralph loop, todo continuation, boulder)",
    scope: "builtin",
    template:
      "Stop all active continuation mechanisms for this session: Ralph Loop, todo continuation, and boulder state.",
  },
  {
    name: "remember-learnings",
    description: "Save learnings to project knowledge base",
    scope: "builtin",
    template:
      "Save the key learnings from this session to the project's AGENTS.md or knowledge base.",
  },
];
