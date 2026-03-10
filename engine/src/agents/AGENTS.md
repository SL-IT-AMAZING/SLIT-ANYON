# src/agents/ — 11 Agent Definitions

**Generated:** 2026-03-02

## OVERVIEW

Agent factories following `createXXXAgent(model) → AgentConfig` pattern. Each has static `mode` property. Built via `buildAgent()` compositing factory + categories + skills.

## AGENT INVENTORY

| Agent | Model | Temp | Mode | Fallback Chain | Purpose |
|-------|-------|------|------|----------------|---------|
| **Conductor** | claude-opus-4-6 | 0.1 | all | kimi-k2.5 → glm-5 → big-pickle | Main orchestrator, plans + delegates |
| **Craftsman** | gpt-5.3-codex | 0.1 | all | gpt-5.2 (copilot) | Autonomous deep worker |
| **Advisor** | gpt-5.2 | 0.1 | subagent | gemini-3.1-pro → claude-opus-4-6 | Read-only consultation |
| **Researcher** | kimi-k2.5 | 0.1 | subagent | gemini-3-flash → gpt-5.2 → glm-4.6v | External docs/code search |
| **Scout** | grok-code-fast-1 | 0.1 | subagent | minimax-m2.5 → claude-haiku-4-5 → gpt-5-nano | Contextual grep |
| **Inspector** | gemini-3-flash | 0.1 | subagent | minimax-m2.5 → big-pickle | PDF/image analysis |
| **Analyst** | claude-opus-4-6 | **0.3** | subagent | gpt-5.2 → kimi-k2.5 → gemini-3.1-pro | Pre-planning consultant |
| **Critic** | gpt-5.2 | 0.1 | subagent | claude-opus-4-6 → gemini-3.1-pro | Plan reviewer |
| **Taskmaster** | kimi-k2.5 | 0.1 | primary | claude-sonnet-4-6 → gpt-5.2 | Todo-list orchestrator |
| **Strategist** | claude-opus-4-6 | 0.1 | — | kimi-k2.5 → gpt-5.2 → gemini-3.1-pro | Strategic planner (internal) |
| **Worker** | claude-sonnet-4-6 | 0.1 | all | user-configurable | Category-spawned executor |

## TOOL RESTRICTIONS

| Agent | Denied Tools |
|-------|-------------|
| Oracle | write, edit, task, call_omo_agent |
| Librarian | write, edit, task, call_omo_agent |
| Explore | write, edit, task, call_omo_agent |
| Multimodal-Looker | ALL except read |
| Taskmaster | task, call_omo_agent |
| Momus | write, edit, task |

## STRUCTURE

```
agents/
├── conductor.ts           # 559 LOC, main orchestrator
├── craftsman.ts           # 507 LOC, autonomous worker
├── advisor.ts             # Read-only consultant
├── researcher.ts          # External search
├── scout.ts               # Codebase grep
├── inspector.ts           # Vision/PDF
├── analyst.ts             # Pre-planning
├── critic.ts              # Plan review
├── taskmaster/agent.ts    # Todo orchestrator
├── types.ts               # AgentFactory, AgentMode
├── agent-builder.ts       # buildAgent() composition
├── utils.ts               # Agent utilities
├── builtin-agents.ts      # createBuiltinAgents() registry
└── builtin-agents/        # maybeCreateXXXConfig conditional factories
    ├── conductor-agent.ts
    ├── craftsman-agent.ts
    ├── taskmaster-agent.ts
    ├── general-agents.ts  # collectPendingBuiltinAgents
    └── available-skills.ts
```

## FACTORY PATTERN

```typescript
const createXXXAgent: AgentFactory = (model: string) => ({
  instructions: "...",
  model,
  temperature: 0.1,
  // ...config
})
createXXXAgent.mode = "subagent" // or "primary" or "all"
```

Model resolution: `AGENT_MODEL_REQUIREMENTS` in `shared/model-requirements.ts` defines fallback chains per agent.

## MODES

- **primary**: Respects UI-selected model, uses fallback chain
- **subagent**: Uses own fallback chain, ignores UI selection
- **all**: Available in both contexts (Worker)
