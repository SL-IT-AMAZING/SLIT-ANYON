# FOUNDER-FIRST FLOW: MAPPING SUMMARY

## What Was Requested

Map the current internal flow for:
1. **Drafts** (iterative spec refinement)
2. **Plans** (frozen, executable todo lists)
3. **Thesis state** (session management)
4. **Start-work execution** (orchestration)

Then evaluate where the proposed **founder-first flow** (long ideation → comprehensive spec → todos → execution) fits against the current engine architecture.

---

## What We Found

### The System Today

**Current flow is NOT draft-oriented:**
```
Interview (AI questions) 
  → Plan generation (instant, single-pass) 
  → Plan saved to `.anyon/plans/{slug}.md` 
  → User clicks "Accept" → Redirects to new chat 
  → `/start-work` command loads plan 
  → Taskmaster executes (reads plan, updates checkboxes)
```

**Key insight:** Plans are both **readable** (by Taskmaster) AND **writable** (by Taskmaster during execution). This creates a constraint for draft-aware systems.

### Core Files & Their Roles

| Component | Files | Responsibility |
|-----------|-------|-----------------|
| **Plan Storage** | `src/ipc/types/plan.ts`<br>`src/ipc/handlers/plan_handlers.ts`<br>`src/ipc/handlers/planUtils.ts` | CRUD operations, markdown parsing, frontmatter extraction |
| **Thesis State** | `engine/src/features/thesis-state/*` | Active plan tracking, session management, checkpoint file |
| **Plan Generation** | `engine/src/agents/strategist/plan-generation.ts`<br>`engine/src/agents/strategist/plan-template.ts` | Interview → gap classification → self-review → summary |
| **Start-Work** | `engine/src/hooks/start-work/start-work-hook.ts`<br>`engine/src/features/builtin-commands/templates/start-work.ts` | Hook injection, plan discovery, thesis.json creation |
| **Execution** | `engine/src/agents/taskmaster/agent.ts`<br>`engine/src/hooks/thesis-continuation-injector.ts` | Task delegation, checkpoint updates |
| **React UI** | `src/atoms/planAtoms.ts`<br>`src/hooks/usePlan.ts` | In-memory state, plan loading from disk |

---

## End-to-End Flow (Current)

```
┌─────────────────────────────────────────────────────────────────────┐
│ DESKTOP APP (Electron + React)                                      │
│                                                                     │
│  User selects "Plan Mode" chat mode                                │
│  User types: "/plan {request}"                                     │
│      ↓                                                              │
│  Sends to Engine: planClient.createPlan() via IPC                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ENGINE (oh-my-opencode Plugin)                                      │
│                                                                     │
│  [Strategist Agent]                                                 │
│    Phase 1: Interview (asks clarifying questions)                  │
│    Phase 2: Generate plan (markdown template)                      │
│    Phase 2b: Self-review (classify gaps: CRITICAL/MINOR/AMBIGUOUS) │
│    Phase 2c: Optional Critic review                                │
│      ↓                                                              │
│  planClient.createPlan() → Saves to .anyon/plans/{slug}.md         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PLAN PERSISTENCE LAYER                                              │
│                                                                     │
│  File: .anyon/plans/chat-{id}-{title}-{timestamp}.md               │
│  Structure:                                                         │
│    ---                                                              │
│    title: "Plan Title"                                              │
│    summary: "Description"                                           │
│    chatId: 42                                                       │
│    createdAt: "2026-03-08T14:30:00Z"                               │
│    updatedAt: "2026-03-08T14:30:00Z"                               │
│    ---                                                              │
│                                                                     │
│    # Plan Title                                                     │
│    ## TL;DR                                                         │
│    ## Context                                                       │
│    ## Work Objectives                                               │
│    ## Verification Strategy                                         │
│    ## Execution Strategy                                            │
│    ## TODOs                                                         │
│    - [ ] 1. Task with acceptance criteria + QA scenarios            │
│    - [ ] 2. Task...                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACCEPTS PLAN (Desktop UI)                                     │
│                                                                     │
│  Clicks "Accept Plan" button → Redirects to NEW chat               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ START-WORK PHASE                                                    │
│                                                                     │
│  User types: /start-work {plan-name}                               │
│      ↓                                                              │
│  [start-work-hook.ts triggers]                                     │
│    1. Detects /start-work in message                               │
│    2. Searches .anyon/plans/ for matching plan file                │
│    3. If multiple plans: asks user to select                       │
│    4. Creates .anyon/thesis.json:                                  │
│       {                                                             │
│         "active_plan": "/absolute/path/plan.md",                  │
│         "started_at": "ISO-timestamp",                             │
│         "session_ids": ["session-123"],                            │
│         "plan_name": "Plan Name",                                  │
│         "worktree_path": "/path/to/git/worktree"                  │
│       }                                                             │
│    5. Injects context into next chat message                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ EXECUTION PHASE (Taskmaster Agent)                                  │
│                                                                     │
│  1. Reads plan file from disk                                      │
│  2. Parses markdown:                                               │
│     - Counts checkboxes: - [ ] (unchecked), - [x] (checked)       │
│     - Extracts tasks with acceptance criteria                      │
│     - Extracts QA scenarios                                         │
│  3. Delegates tasks by category (visual, ultrabrain, quick, etc)   │
│  4. For each task:                                                 │
│     - Executes implementation                                      │
│     - Runs QA scenarios from spec                                  │
│     - Saves evidence to .anyon/evidence/task-{N}-{scenario}.ext    │
│  5. MARKS TASK DONE by editing plan file IN-PLACE:                │
│     - [ ] → - [x]   (checkbox updated in plan file)               │
│  6. Final verification wave (4 parallel reviews):                  │
│     - Plan compliance audit (advisor agent)                        │
│     - Code quality review (linter)                                 │
│     - Real QA execution (playwright)                               │
│     - Scope fidelity check (deep agent)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current State Architecture

### Thesis State (`.anyon/thesis.json`)

```json
{
  "active_plan": "/absolute/path/.anyon/plans/plan-name.md",
  "started_at": "2026-03-08T14:30:00Z",
  "session_ids": ["session-123", "session-456"],
  "plan_name": "Plan Name",
  "agent": "taskmaster",
  "worktree_path": "/absolute/path/to/git/worktree"
}
```

**Key invariants:**
- Single active plan per project
- Thesis.json created on `/start-work`, tracks session history
- Worktree_path NOT session-specific (shared across sessions)

### Plan Progress Tracking

Plans are markdown with checkboxes:
- Unchecked: `- [ ]` or `- [ ]`
- Checked: `- [x]` or `- [X]`
- Progress: `completed / total = (count of [x]) / (count of [ ] + [x])`
- Complete: `(total === 0) || (completed === total)`

---

## Proposed Founder-First Flow

The user wants:
1. **Long ideation session** (specify requirements, tech stack, architecture)
2. **Iterative spec refinement** (user reads plan, asks for edits)
3. **Frozen spec** (when ready, convert to executable plan)
4. **One-run execution** (Taskmaster executes to completion)

### Proposed End-to-End

```
User: "I want to build a dashboard"
  ↓
[PHASE 1: Interview]
  Strategist asks questions
  User answers
  ↓
[PHASE 2: Draft Spec Generation]
  Strategist generates markdown spec
  SAVES TO: .anyon/plans.draft/spec-{slug}.md   ← NEW
  Metadata:
    - status: "draft"      ← NEW
    - version: 1          ← NEW
  ↓
[PHASE 2.5: Iterative Refinement]  ← NEW
  User reads spec in chat
  User: "/edit-spec work-objectives"
  Strategist regenerates section
  User sees updated spec
  User: "good, keep going"
  Loop until "/finalize-spec"
  ↓
[PHASE 3: Finalization]  ← NEW
  User: "/finalize-spec"
  Analyst consults for gaps
  Strategist asks critical Qs
  Strategist: Copies spec → .anyon/plans/plan-{slug}.md
    - status: "accepted"
    - frozen: true
  ↓
[PHASE 4: Execute]
  User: "/start-work dashboard"
  Taskmaster executes
  (Same as current system)
```

---

## Natural Fit: What Already Exists

✅ **Can reuse immediately:**
1. Analyst consultation (plan-generation.ts lines 57-87)
2. Gap classification (CRITICAL/MINOR/AMBIGUOUS)
3. Self-review checklist
4. Markdown format (extensible with metadata)
5. Plan update handlers (`planClient.updatePlan()`)
6. Thesis state infrastructure

---

## Conflicts & Constraints

### 🔴 Biggest Issue: Plans Are Self-Modifying

```
Problem:
  Taskmaster READS plan.md
  Taskmaster UPDATES plan.md (marks [x])
  If user edits draft WHILE executing → CORRUPTION
```

**Solution:**
- Use separate `.execution` checkpoint file
- Taskmaster reads from `plan.md` (spec)
- Taskmaster writes to `plan.{name}.execution` (checkpoints only)
- No user edits allowed during execution

### ⚠️ Other Constraints

| Constraint | Impact | Solution |
|-----------|--------|----------|
| Single active plan per thesis.json | Can't have multiple drafts + 1 executing | Allow 1 draft active + 1 executing (separate fields in thesis.json) |
| No plan versioning | Can't compare "spec v1" to "spec v2" | Use git commits with diffs, or manual version file |
| Plan format includes execution data | Spec mixed with checkboxes | Separate: spec in .md, checkpoints in .execution |

---

## Most Relevant Files for Implementation

### Tier 1: IPC Contracts (Must Modify)
- `src/ipc/types/plan.ts` — Add `DraftPlanSchema`, `PlanStatusEnum`
- `src/ipc/handlers/plan_handlers.ts` — Add `getDraft()`, `updateDraft()`, `finalizeDraft()`

### Tier 2: Strategist Integration (Must Modify)
- `engine/src/agents/strategist/plan-generation.ts` — Save as draft by default
- `engine/src/agents/strategist/plan-template.ts` — Add draft instructions

### Tier 3: Thesis State (Should Modify)
- `engine/src/features/thesis-state/types.ts` — Add `draft_plan_path`, `status`
- `engine/src/features/thesis-state/storage.ts` — Read/write draft metadata

### Tier 4: Start-Work Validation (Should Modify)
- `engine/src/hooks/start-work/start-work-hook.ts` — Reject draft plans

### Tier 5: Execution Safeguards (Must Add)
- New file: `engine/src/features/plan-execution/checkpoint.ts` — `.execution` file handling

### Tier 6: React UI (Optional but Good UX)
- `src/atoms/planAtoms.ts` — Add `draftPlanAtom`
- `src/hooks/usePlan.ts` — Add `useDraftPlan()` hook

---

## Data Layout: Current vs. Proposed

### Current
```
.anyon/
├─ plans/
│  └─ chat-42-dashboard-1709874600000.md   ← Immediately saved
└─ thesis.json   ← Created on /start-work
```

### Proposed
```
.anyon/
├─ plans/
│  ├─ plan-dashboard-v1.md   ← status: "accepted", immutable
│  └─ plan-dashboard-v1.execution   ← Checkpoint file (checkboxes only)
├─ plans.draft/   ← NEW
│  ├─ spec-dashboard-v1.md   ← status: "draft", editable, version 1
│  ├─ spec-dashboard-v2.md   ← status: "draft", editable, version 2
│  └─ spec-dashboard-v3.md   ← status: "draft", editable, version 3
└─ thesis.json
   {
     "active_plan": ".../plan-dashboard-v1.md",
     "draft_plan": ".../spec-dashboard-v3.md",   ← NEW
     "status": "executing"   ← NEW
   }
```

---

## Implementation Phases

### Phase 1: Foundation (1-2 weeks)
- [ ] Add `DraftPlanSchema` to IPC types
- [ ] Create `getDraft()`, `createDraft()`, `updateDraft()` handlers
- [ ] Create `.anyon/plans.draft/` directory logic
- [ ] Add draft metadata (status, version) to YAML frontmatter

### Phase 2: Strategist Integration (2-3 weeks)
- [ ] Modify `NEWTON_PLAN_GENERATION` to save drafts by default
- [ ] Add `/finalize-spec` command
- [ ] Add `/edit-spec {section}` command (section-level regen)
- [ ] Build spec editor UI (inline or panel)

### Phase 3: Execution Safety (1-2 weeks)
- [ ] Create `.execution` checkpoint file mechanism
- [ ] Prevent `/start-work` on draft plans
- [ ] Lock plan during execution (block user edits)

### Phase 4: Validation & Polish (1 week)
- [ ] E2E tests: draft → edit → finalize → execute
- [ ] Version history / diff display
- [ ] Error recovery on interruption

**Total estimate: 4-5 weeks**

---

## Risk Assessment

### High Risk
- **Plan corruption** (user edits during execution)
  - Mitigation: Separate `.execution` checkpoint file

### Medium Risk
- **User confusion** (2 plan types instead of 1)
  - Mitigation: Clear UI labels (DRAFT / READY / EXECUTING)
- **Draft proliferation** (accumulating old specs)
  - Mitigation: Show only 3-5 recent drafts in UI

### Low Risk
- **Analyst consultation missing** — Already exists
- **Markdown extensibility** — Format already flexible
- **IPC handler complexity** — Pattern already established

---

## Bottom Line

### ✅ The proposed flow maps cleanly onto the existing architecture

1. **Strategist** already does interview + gap classification
2. **Plan format** already supports metadata (YAML frontmatter)
3. **IPC handlers** already support create/update/delete
4. **Thesis state** already tracks sessions

### ⚠️ Main new complexity: managing plan mutability

- Current: Plan file is read + written during execution
- Proposed: Need to separate spec (immutable) from checkpoints (mutable)
- Solution: Simple `.execution` checkpoint file (low risk)

### 🎯 Recommendation

Implement the proposed flow in 4-5 weeks:
1. Add draft infrastructure (1 week)
2. Integrate with Strategist (2 weeks)
3. Add execution safeguards (1 week)
4. Test + polish (1 week)

The architecture **already supports** the founder-first ideal — just needs the UI/UX layer on top.

