export const ALLOWED_AGENTS = [
  "scout",
  "researcher",
  "advisor",
  "craftsman",
  "analyst",
  "critic",
  "inspector",
] as const;

export const CALL_ANYON_AGENT_DESCRIPTION = `Spawn scout/researcher agent. run_in_background REQUIRED (true=async with task_id, false=sync).

Available: {agents}

Pass \`session_id=<id>\` to continue previous agent with full context. Prompts MUST be in English. Use \`background_output\` for async results.`;
