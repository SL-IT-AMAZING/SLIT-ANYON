# Agent Name Collision Risk - Detailed Code Examples

This document provides specific code examples for each collision risk identified.

---

## 1. BUILDER (50 matches, 39 files) — HIGH RISK 🔴

### Core Files at Risk

#### File: `agents/agent-builder.ts` (Main builder)
```typescript
// This entire file is about building agents
export function buildAgent(config: AgentConfig): Agent {
  // Core functionality for agent construction
}
```

#### File: `plugin-handlers/agent-config-handler.ts`
```typescript
const builderEnabled = params.pluginConfig.euler_agent?.default_builder_enabled ?? false;
if (builderEnabled) {
  // Enable builder feature
}
```

#### File: `agents/dynamic-agent-prompt-builder.ts`
```typescript
export function buildCategorySkillsDelegationGuide(...) { }
export function buildAvailableAgentsList(...) { }
export type AvailableCategory = ...
```

#### File: `tools/delegate-task/prompt-builder.ts`
```typescript
export function buildSystemContent(skills: Skill[]): string {
  // Build the system prompt with skills
}
```

#### File: `hooks/anthropic-context-window-limit-recovery/message-builder.ts`
```typescript
export function sanitizeEmptyMessagesBeforeSummarize() { }
export const PLACEHOLDER_TEXT = ...
export function formatBytes(bytes: number): string { }
```

### Why This Is Dangerous

If you rename an agent to "builder", these searches will match:
- `const builder = new Builder()` (variable names)
- `import { buildAgent } from './agent-builder'` (import statements)
- Function calls to `buildSystemContent()`, `buildAgent()`, etc.
- Configuration: `default_builder_enabled`

**Scope of damage:** 39 files, 50 matches, mostly in critical infrastructure

---

## 2. EXECUTOR (112 matches, 57 files) — HIGH RISK 🔴

### Core Files at Risk

#### File: `tools/delegate-task/executor.ts`
```typescript
export type { ExecutorContext, ParentContext } from "./executor-types";

interface ExecutorContext {
  client: AnyonClient;
  manager: BackgroundManager;
  userCategories: Category[];
  eulerJuniorModel?: string;
}
```

#### File: `tools/delegate-task/sync-executor.ts`
```typescript
export async function executeSync(
  args: DelegateTaskInput,
  executorCtx: ExecutorContext
): Promise<TaskResult> {
  // Create session → send prompt → poll → fetch result
}
```

#### File: `tools/call-anyon-agent/background-agent-executor.ts`
```typescript
export async function executeBackgroundAgent(
  prompt: string,
  options: ExecutorOptions
): Promise<void> {
  // Async execution via BackgroundManager
}
```

#### File: `features/tmux-subagent/action-executor.ts`
```typescript
export async function executeAction(
  action: PaneAction,
  deps: ActionExecutorDeps
): Promise<ActionResult> {
  // Execute tmux actions
}
```

#### File: `hooks/auto-slash-command/executor.ts`
```typescript
export async function executeSlashCommand(
  parsed: ParsedCommand,
  options: ExecutorOptions
): Promise<CommandResult> {
  // Route and execute slash commands
}
```

### Why This Is Dangerous

The word "executor" is deeply embedded in:
- Function signatures: `executeAction()`, `executeSync()`, `executeBackgroundAgent()`
- Type definitions: `ExecutorContext`, `ExecutorOptions`, `ActionExecutorDeps`
- File names: Multiple files ending in `-executor.ts`
- Parameter names: `executorCtx`, `executorOptions`

Searching for "executor" would be everywhere. Renaming would break:
- All imports of executor types
- All function calls to execute*() methods
- All type annotations referencing ExecutorContext
- All variable references to executorCtx

**Scope of damage:** 57 files, 112 matches, architectural pattern used throughout

---

## 3. ORCHESTRATOR (64 matches, 25 files) — HIGH RISK 🔴

### Active Use Case (NOT Collision, but Semantic Conflict)

#### File: `agents/AGENTS.md`
```markdown
| **Euler**  | Main orchestrator, plans + delegates |
| **Turing** | Todo-list orchestrator |
```

#### File: `agents/builtin-agents/turing-agent.ts`
```typescript
const orchestratorOverride = agentOverrides["turing"];
let orchestratorConfig = createTuringAgent({...});
orchestratorConfig = applyOverrides(
  orchestratorConfig,
  orchestratorOverride,
  ...
);
```

#### File: `agents/euler-gemini-overlays.ts`
```typescript
**The user chose an orchestrator model specifically because they 
want delegation and parallel execution. If you do work yourself, 
you are failing your purpose.**
```

#### File: `hooks/turing/system-reminder-templates.ts`
```typescript
As an orchestrator, you should:
- Delegate to specialists
- Use parallel execution
- Never do work you could delegate
```

#### File: `shared/migration.test.ts`
```typescript
test("migrates orchestrator-euler to turing", () => {
  const hooks = ["orchestrator-euler", "comment-checker"];
  const migrated = migrateHooks(hooks);
  expect(migrated).toContain("turing");
  expect(migrated).not.toContain("orchestrator-euler");
});
```

### Why This Is Dangerous

"Orchestrator" is already a **semantic role** in the system:
- Turing is the "orchestrator" (delegates tasks, manages todos)
- Euler is the "main orchestrator" (plans and delegates)
- They are conceptually different from "executors"
- Migration code maps old names to new ones

If you rename an agent to "orchestrator":
- Tests about orchestrator behavior break (which orchestrator?)
- Migration logic becomes ambiguous
- Configuration for "orchestrator" agents becomes confusing
- Prompts saying "you are an orchestrator" conflict with agent name

**Scope of damage:** 25 files, 64 matches, semantic role conflict

---

## 4. PLANNER (55 matches, 17 files) — HIGH RISK 🔴

### Active Use Case (Configuration + Semantic Role)

#### File: `config/schema/euler-agent.ts`
```typescript
planner_enabled: z.boolean().optional(),
```

#### File: `plugin-handlers/agent-config-handler.ts`
```typescript
const plannerEnabled = 
  params.pluginConfig.euler_agent?.planner_enabled ?? true;

const shouldDemotePlan = plannerEnabled && replacePlan;

if (plannerEnabled) {
  // Feature handling for planner
}
```

#### File: `hooks/keyword-detector/turbo/source-detector.ts`
```typescript
/**
 * Checks if agent is a planner-type agent.
 * Planners don't need turbo injection (they ARE the planner).
 */
export function isPlanner(agentName: string): boolean {
  if (lowerName.includes("newton") || lowerName.includes("planner"))
    return "planner";
}
```

#### File: `hooks/keyword-detector/turbo/index.ts`
```typescript
case "planner":
  return getPlannerTurboMessage(params);
```

#### File: `hooks/keyword-detector/turbo/planner.ts`
```typescript
/**
 * Turbo message section for planner agents (Newton).
 * Planner agents should NOT be told to call plan agent - they ARE the planner.
 */
const TURBO_PLANNER_SECTION = `
You ARE the planner. You ARE NOT an implementer. 
You DO NOT write code. You DO NOT execute tasks.
`;
```

#### File: `agents/newton/identity-constraints.ts`
```typescript
I understand you want quick results, but I'm Newton - a dedicated planner.
```

### Why This Is Dangerous

"Planner" is already:
- A **config schema flag**: `planner_enabled`
- A **semantic role**: Newton is the planner
- **Feature detection logic**: Turbo module checks for "planner" in agent names
- **Hook system**: Separate turbo section for planner vs executor agents

If you rename an agent to "planner":
- Configuration becomes ambiguous: is `planner_enabled` for the new agent?
- Feature detection breaks: is this an agent called "planner" or a planner-type agent?
- Turbo injection logic would fail
- Newton's identity conflicts with a new agent name

**Scope of damage:** 17 files, 55 matches, config schema + feature detection

---

## 5. WORKER (23 matches, 7 files) — MEDIUM RISK 🟡

### Node.js Threading Infrastructure

#### File: `features/opencode-skill-loader/blocking.ts`
```typescript
import { Worker, MessageChannel, receiveMessageOnPort } from "worker_threads";

const worker = new Worker(new URL("./discover-worker.ts", import.meta.url), {
  workerData: { signalBuffer: signal.buffer },
});

worker.postMessage({ port: port2, input }, [port2]);
worker.terminate();
```

#### File: `features/opencode-skill-loader/discover-worker.ts`
```typescript
import { workerData, parentPort } from "worker_threads";

const { signalBuffer } = workerData as { signalBuffer: SharedArrayBuffer };
```

#### File: `features/opencode-skill-loader/async-loader.ts`
```typescript
const worker = async () => {
  // ... work
};

const workers = Array.from(
  Array(8),
  () => worker(),
);

await Promise.all(workers);
```

#### File: `features/builtin-skills/skills/playwright.ts`
```typescript
Persists cookies, localStorage, IndexedDB, service workers, cache, 
login sessions across browser restarts.
```

### Why This Is MEDIUM Risk (Not HIGH)

- **Limited scope:** Only 7 files affected
- **Threading context:** Variable names like `worker` are semantic (it's actually a Worker thread)
- **Tesla context:** Tesla describes itself as "worker" in prompts, but that's descriptive, not a naming conflict
- **Low ambiguity:** Context makes it clear these are threading constructs, not agents

Renaming would affect:
- Variable names: `const worker = new Worker(...)`
- Type imports: `Worker` from `worker_threads`
- File names potentially: `discover-worker.ts`

But it wouldn't break infrastructure because:
- `Worker` is namespaced from `worker_threads`
- Variable names can change without semantic impact
- No config flags or feature detection depend on "worker"

---

## 6. ADVISOR (8 matches, 7 files) — MEDIUM RISK 🟡

### Category Type Usage

#### File: `agents/types.ts`
```typescript
export const AGENT_TYPES = ["executor", "advisor", "specialist"] as const;
export type AgentType = typeof AGENT_TYPES[number];
```

#### File: `agents/socrates.ts`
```typescript
export const SOCRATES_AGENT: Agent = {
  name: "socrates",
  category: "advisor",
  // ...
};

const SOCRATES_SYSTEM_PROMPT = `
You are a strategic technical advisor with deep reasoning capabilities, 
operating as a specialized consultant within an AI-assisted development environment.
`;
```

#### File: `agents/turing/agent.ts`
```typescript
export const TURING_AGENT: Agent = {
  category: "advisor",
  // ...
};
```

#### File: `agents/nietzsche.ts`
```typescript
export const NIETZSCHE_AGENT: Agent = {
  category: "advisor",
  // ...
};
```

#### File: `tools/delegate-task/constants.ts`
```typescript
Strategic advisor mindset:
- Provide domain-specific guidance
- Ask clarifying questions
- Think strategically about trade-offs
```

### Why This Is MEDIUM Risk

- **Category conflict:** "advisor" is already a category type
- **Agent references:** Socrates and Nietzsche use `category: "advisor"`
- **Type definition:** `AgentType = "executor" | "advisor" | ...`
- **Prompt content:** "strategic advisor" appears in system prompts

If you rename an agent to "advisor":
- Ambiguity: is "advisor" a category or an agent name?
- Potential naming conflict with type definitions
- Would require renaming the category type

But manageable because:
- Only 7 files affected
- Contained to agent definitions and type system
- No config flags depend on "advisor" as a name
- Could refactor by renaming the category

---

## 7. SCOUT (0 matches) — SAFE ✅

**No conflicts found in entire codebase.**

Perfect for renaming to.

---

## 8. INSPECTOR (0 matches) — SAFE ✅

**No conflicts found in entire codebase.**

Perfect for renaming to.

---

## 9. ANALYST (0 matches) — SAFE ✅

**No conflicts found in entire codebase.**

Perfect for renaming to.

---

## 10. CRITIC (57 matches, but all adjectival) — SAFE ✅

### Only Adjective/Adverb Usage

#### File: `hooks/turing/system-reminder-templates.ts`
```typescript
3. For EACH file, **critically** ask:
   - What could go wrong?
   - What's the failure mode?
```

#### File: `agents/socrates.ts`
```typescript
For code reviews: surface **critical** issues, not every nitpick
```

#### File: `tools/delegate-task/constants.ts`
```typescript
- Identifies **critical** path for project timeline
```

#### File: `features/context-injector/types.ts`
```typescript
export type ContextPriority = "critical" | "high" | "normal" | "low";
```

### Why This Is SAFE

All 57 matches use "critic/critical/critically" as:
- **Adjective:** "critical issues", "critical path"
- **Adverb:** "critically ask"
- **Priority level:** "critical" in enum

None use "critic" as:
- A noun (agent name)
- A pattern name
- A configuration flag
- A type or function name

Safe to rename an agent to "critic" because:
- No variable/function named `critic`
- No type named `Critic`
- No import conflicts
- Adjective usage won't match agent name search

---

## 11. RESEARCHER (10 matches, test-only) — SAFE ✅

### Test File Usage Only

#### File: `agents/utils.test.ts`
```typescript
const customAgents = [
  { name: "researcher", description: "Second" },
];

// In tests:
expect(agents.euler.prompt).toContain("researcher");
expect(agents.tesla.prompt).toContain("researcher");
expect(agents.turing.prompt).toContain("researcher");

// Pattern matching in tests:
(agents.euler?.prompt ?? "").match(/Custom agent: researcher/gi) ?? []
```

### Why This Is SAFE

- **Test-only:** All 10 matches are in `agents/utils.test.ts`
- **Mock data:** "researcher" is used as a custom agent example
- **No infrastructure:** No real code paths depend on this
- **No types:** No type definitions for "researcher"
- **No config:** No configuration using "researcher"

Safe to rename an agent to "researcher" because:
- Only existing in test mocks
- Can update test to use different name
- No production impact

---

## Summary Table with Examples

| Name | Risk | Reason | Example Files |
|------|------|--------|---|
| **builder** | HIGH | Core pattern | agent-builder.ts, prompt-builder.ts, message-builder.ts |
| **executor** | HIGH | Architecture | sync-executor.ts, action-executor.ts, ExecutorContext type |
| **orchestrator** | HIGH | Active role | Turing = orchestrator, migration logic |
| **planner** | HIGH | Config + role | planner_enabled flag, Newton = planner |
| **worker** | MEDIUM | Threading | worker_threads, Worker class, skill loader |
| **advisor** | MEDIUM | Category type | category: "advisor", Socrates, Nietzsche |
| **scout** | SAFE | None | — |
| **inspector** | SAFE | None | — |
| **analyst** | SAFE | None | — |
| **critic** | SAFE | Adjective only | "critical", "critically" (not noun) |
| **researcher** | SAFE | Test only | agents/utils.test.ts mock data |

