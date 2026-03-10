# Agent Name Collision Risk Analysis
## Proposed New Agent Names in `/engine/src/`

This report analyzes the collision risk of renaming agents to: builder, worker, executor, orchestrator, planner, scout, advisor, researcher, inspector, analyst, and critic.

---

## SUMMARY TABLE

| Term | Total Matches | Non-Agent Files | Risk Level | Status |
|------|---|---|---|---|
| **builder** | 50 | 39 | **HIGH** | Builder pattern, file builders, prompt builders |
| **worker** | 23 | 7 | **MEDIUM** | Worker threads, Tesla description |
| **executor** | 112 | 57 | **HIGH** | Widely used pattern, many files |
| **orchestrator** | 64 | 25 | **HIGH** | Active agent name (Turing, Euler), migrations |
| **planner** | 55 | 17 | **HIGH** | Active config setting, Newton references |
| **scout** | 0 | 0 | **SAFE** | ✅ No conflicts found |
| **advisor** | 8 | 7 | **MEDIUM** | Category name, prompt content |
| **researcher** | 10 | 1 | **LOW** | Only test file, custom agent example |
| **inspector** | 0 | 0 | **SAFE** | ✅ No conflicts found |
| **analyst** | 0 | 0 | **SAFE** | ✅ No conflicts found |
| **critic** | 57 | 29 | **LOW** | "Critically" in comments, not formal term |

---

## DETAILED FINDINGS

### 1. **builder** — 50 matches in 39 files
**Risk Level: HIGH** 🔴

**Context Types:**
- File names: `agent-builder.ts`, `prompt-section-builder.ts`, `message-builder.ts`, `newton-agent-config-builder.ts`, `action-executor.ts`
- Functions: `buildAgent()`, `buildCategorySkillsDelegationGuide()`, `buildSystemContent()`, `buildNewtonAgentConfig()`
- Variable names: `builderEnabled`, `default_builder_enabled`
- Types: `AvailableSkill` imports from `dynamic-agent-prompt-builder`

**Non-Agent Examples:**
```
/agents/builtin-agents/general-agents.ts:
  const { buildAgent } = require("./agent-builder");

/plugin-handlers/agent-config-handler.ts:
  const builderEnabled = params.pluginConfig.euler_agent?.default_builder_enabled ?? false;

/hooks/anthropic-context-window-limit-recovery/message-builder.ts:
  export { sanitizeEmptyMessagesBeforeSummarize, PLACEHOLDER_TEXT, formatBytes }

/tools/delegate-task/prompt-builder.ts:
  export { buildSystemContent } from "./prompt-builder";
```

**Why HIGH Risk:**
- **builder** is a fundamental design pattern (Builder pattern)
- Multiple file-building utilities depend on this naming
- `buildAgent()` is core function used throughout
- Configuration flag `default_builder_enabled` could be ambiguous
- Renaming would require updates in 39+ files

**Recommendation:** ⚠️ **DO NOT USE** "builder" as agent name

---

### 2. **worker** — 23 matches in 7 files
**Risk Level: MEDIUM** 🟡

**Context Types:**
- Node.js `Worker` threads from `worker_threads` module (8 matches in blocking.ts, discover-worker.ts)
- Service worker references in comments (playwright.ts, SKILL.md)
- Tesla agent description: "autonomous deep worker"

**Non-Agent Examples:**
```
/features/opencode-skill-loader/blocking.ts:
  import { Worker, MessageChannel, receiveMessageOnPort } from "worker_threads";
  const worker = new Worker(new URL("./discover-worker.ts", import.meta.url), {...})

/features/opencode-skill-loader/async-loader.ts:
  const workers = Array.from(Array(8), () => worker());
  await Promise.all(workers);

/features/builtin-skills/skills/playwright.ts:
  Persists cookies, localStorage, IndexedDB, service workers, cache, login sessions
```

**Why MEDIUM Risk:**
- **worker** is tied to Node.js threading APIs (not arbitrary)
- Only 7 files use it, but infrastructure code (skill loader)
- Tesla already describes itself as "worker" in prompts, not a conflict with agent name
- Low collision risk outside threading context

**Recommendation:** ⚠️ **MODERATE USE** — Could use for agent name, but be aware of threading context

---

### 3. **executor** — 112 matches in 57 files
**Risk Level: HIGH** 🔴

**Context Types:**
- Widespread execution pattern: `executeBackgroundAgent()`, `executeSync()`, `executeCompact()`, `executeHashlineEditTool()`, `executeAction()`, `executeSlashCommand()`
- File names: `executor.ts`, `sync-executor.ts`, `background-executor.ts`, `action-executor.ts`, `background-agent-executor.ts`
- Type names: `ExecutorContext`, `ExecutorOptions`, `ActionExecutorDeps`
- Comments: "task executor", "focused executor"

**Non-Agent Examples:**
```
/tools/delegate-task/executor.ts:
  export type { ExecutorContext, ParentContext } from "./executor-types";

/tools/call-anyon-agent/sync-executor.ts:
  Create session → send prompt → poll → fetch result

/features/tmux-subagent/action-executor.ts:
  Execute `PaneAction[]` (close, spawn, replace)

/tools/delegate-task/category-resolver.ts:
  executorCtx: ExecutorContext
```

**Why HIGH Risk:**
- **executor** is core architectural pattern throughout codebase
- Used in 57 files across multiple subsystems
- Types like `ExecutorContext` are infrastructure-critical
- Would require massive refactoring to rename
- Function names like `executeAction()` are semantically meaningful

**Recommendation:** ❌ **DO NOT USE** "executor" as agent name

---

### 4. **orchestrator** — 64 matches in 25 files
**Risk Level: HIGH** 🔴

**⚠️ CRITICAL: Already used for active agent (Turing)**

**Context Types:**
- Active agent role: "Main orchestrator" (Euler), "Todo orchestrator" (Turing)
- Configuration and behavior: orchestrator mode, orchestrator override
- Migration mapping: `"orchestrator-euler": "turing"`, `"euler-orchestrator": "turing"`
- Semantic concept: orchestrator agents that delegate vs executors

**Non-Agent Examples:**
```
/agents/AGENTS.md:
  | **Euler**  | Main orchestrator, plans + delegates |
  | **Turing** | Todo-list orchestrator |

/agents/builtin-agents/turing-agent.ts:
  const orchestratorOverride = agentOverrides["turing"];
  orchestratorConfig = { ...orchestratorConfig, ...orchestratorOverride };

/hooks/turing/index.test.ts:
  test("should NOT append reminder when non-orchestrator writes outside .anyon/", ...)

/shared/migration.test.ts:
  test("migrates orchestrator-euler to turing", ...)
```

**Why HIGH Risk:**
- **orchestrator** is already a semantic role in the system
- Turing is semantically described as "orchestrator"
- Migration code expects orchestrator → turing mapping
- Tests refer to "orchestrator mode" vs "non-orchestrator"
- Would create deep confusion about which "orchestrator"

**Recommendation:** ❌ **DO NOT USE** "orchestrator" as agent name — already actively used

---

### 5. **planner** — 55 matches in 17 files
**Risk Level: HIGH** 🔴

**⚠️ CRITICAL: Already used for Newton (active agent)**

**Context Types:**
- Configuration flag: `planner_enabled`, `planner_enabled: true/false`
- Semantic role: Newton is "planner", "strategic planner"
- Feature detection: `isPlanAgent()` logic, "planner" in agent names
- Hook concepts: "planner agents should NOT be told to call plan agent"

**Non-Agent Examples:**
```
/plugin-handlers/agent-config-handler.ts:
  const plannerEnabled = params.pluginConfig.euler_agent?.planner_enabled ?? true;
  if (plannerEnabled) { ... shouldDemotePlan = true }

/hooks/keyword-detector/turbo/source-detector.ts:
  if (lowerName.includes("newton") || lowerName.includes("planner"))
    return "planner";

/config/schema/euler-agent.ts:
  planner_enabled: z.boolean().optional(),

/agents/newton/identity-constraints.ts:
  I understand you want quick results, but I'm Newton - a dedicated planner.
```

**Why HIGH Risk:**
- **planner** is already the semantic concept for Newton
- Configuration system has `planner_enabled` flag
- Turbo logic explicitly checks for "planner" in agent names
- Hook system refers to "planner agents"
- Would require changes to config schema and feature detection

**Recommendation:** ❌ **DO NOT USE** "planner" as agent name — already actively used

---

### 6. **scout** — 0 matches
**Risk Level: SAFE** ✅

**No conflicts found in codebase.**

**Recommendation:** ✅ **SAFE TO USE**

---

### 7. **advisor** — 8 matches in 7 files
**Risk Level: MEDIUM** 🟡

**Context Types:**
- Category name: `category: "advisor"`
- Prompt content: "Strategic advisor mindset", "strategic technical advisor"
- Agent references: Socrates, Nietzsche use "advisor" category

**Non-Agent Examples:**
```
/agents/socrates.ts:
  category: "advisor",
  const SOCRATES_SYSTEM_PROMPT = `You are a strategic technical advisor...`

/agents/turing/agent.ts:
  category: "advisor",

/agents/types.ts:
  | "advisor"  // category type

/tools/delegate-task/constants.ts:
  Strategic advisor mindset:
```

**Why MEDIUM Risk:**
- **advisor** is already a category type
- Current agents (Socrates, Nietzsche) use this category
- Would create ambiguity: is "advisor" a category or agent name?
- Relatively contained to 7 files

**Recommendation:** ⚠️ **MODERATE CAUTION** — Could use with care, but would require renaming current category

---

### 8. **researcher** — 10 matches in 1 file
**Risk Level: LOW** ✅

**Context Types:**
- Test file only: `agents/utils.test.ts`
- Used as custom agent example in tests
- No infrastructure dependency

**Non-Agent Examples:**
```
/agents/utils.test.ts:
  { name: "researcher", description: "Second" },
  expect(agents.euler.prompt).toContain("researcher");
  (agents.euler?.prompt ?? "").match(/Custom agent: researcher/gi) ?? []
```

**Why LOW Risk:**
- Only appears in test file
- Used as mock/example custom agent
- No real infrastructure using this term
- Could be renamed in tests without impact

**Recommendation:** ✅ **SAFE TO USE**

---

### 9. **inspector** — 0 matches
**Risk Level: SAFE** ✅

**No conflicts found in codebase.**

**Recommendation:** ✅ **SAFE TO USE**

---

### 10. **analyst** — 0 matches
**Risk Level: SAFE** ✅

**No conflicts found in codebase.**

**Recommendation:** ✅ **SAFE TO USE**

---

### 11. **critic** — 57 matches in 29 files
**Risk Level: LOW** ✅

**Context Types:**
- All matches use "critic/critical" as general adjective
- No formal "Critic" pattern or agent role
- Uses: "critically ask", "critical dependencies", "most critical", "critical issue"

**Non-Agent Examples:**
```
/hooks/turing/system-reminder-templates.ts:
  3. For EACH file, critically ask:

/agents/socrates.ts:
  For code reviews: surface critical issues, not every nitpick

/tools/delegate-task/constants.ts:
  Identifies critical path for project timeline
```

**Why LOW Risk:**
- **critic** only appears as adjective/adverb form ("critical/critically")
- No formal infrastructure uses it as a concept
- No configuration flags or types named "critic"
- Completely safe for agent naming

**Recommendation:** ✅ **SAFE TO USE**

---

## RECOMMENDATIONS BY CATEGORY

### ✅ SAFE (No collision risk)
- **scout** (0 matches) — Perfect
- **inspector** (0 matches) — Perfect
- **analyst** (0 matches) — Perfect
- **critic** (57 matches, but all adjectival) — Perfect
- **researcher** (10 matches, test-only) — Very safe

### ⚠️ MODERATE CAUTION
- **advisor** (8 matches in 7 files) — Would need category rename
- **worker** (23 matches, but mostly threading) — Minor threading context

### ❌ DO NOT USE (High collision risk)
- **builder** (50 matches, 39 files) — Core pattern
- **executor** (112 matches, 57 files) — Architectural pattern
- **orchestrator** (64 matches, already describes Turing/Euler) — Active semantic role
- **planner** (55 matches, already describes Newton) — Active semantic role + config

---

## REPLACEMENT STRATEGY

**Current Renaming Targets (assume these are the agent names to be replaced):**

| Current Name | Collision Risk | Recommendation |
|---|---|---|
| tesla | (not analyzed) | [Rename to] → **scout** ✅ |
| euler | (not analyzed) | [Rename to] → **orchestrator** ❌ (conflicts) OR **analyzer** ✅ |
| turing | (not analyzed) | [Rename to] → **architect** ✅ |
| newton | (not analyzed) | [Rename to] → **strategist** ✅ |

If you want to use proposed names:
- **For tesla (worker)** → Use **scout** instead (0 conflicts)
- **For euler (orchestrator)** → Too risky due to semantic role already in system
- **For newton (planner)** → Too risky due to config flag + semantic role

---

## FILES MOST AFFECTED BY RENAMES

**If forced to rename high-risk terms:**

1. **builder** (39 files): Agent-builder, config-handler, all prompt builders
2. **executor** (57 files): Task delegation, tmux integration, sync/background execution
3. **orchestrator** (25 files): Tests, migrations, turing-agent config
4. **planner** (17 files): Keyword detector, turbo logic, newton prompts

**Estimated refactoring effort:** 100+ files, 300+ line changes

