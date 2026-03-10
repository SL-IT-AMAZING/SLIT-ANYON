# ANYON-B2C: Current Internal Flow for Drafts → Plans → Start-Work

## EXECUTIVE SUMMARY

**The system has NO dedicated "draft" flow currently.** Plans move directly from generation to immediate persistence. The proposed founder-first flow (long ideation → single comprehensive spec → todos → execution) requires new infrastructure to support iterative spec refinement before execution begins.

---

## 1. END-TO-END CURRENT FLOW

```
Desktop App (Renderer)
    ↓
User switches to "Plan Mode"
    ↓
Chat sends message → Engine (Strategist/Newton Agent)
    ↓
[PHASE 1: Interview]
    Interview questions
    User answers → Chat continues
    ↓
[PHASE 2: Plan Generation - AUTO-TRIGGERED]
    Strategist generates plan
    Analyst consults for gaps
    Plan written to `.anyon/plans/{name}.md`
    ↓
[PHASE 2b: Self-Review & Gap Classification]
    Strategist reviews gaps (CRITICAL/MINOR/AMBIGUOUS)
    Auto-resolves minor gaps
    Asks user for critical decisions
    ↓
[PHASE 2c: High-Accuracy Optional]
    User chooses: Start Work OR Critic Review
    (If Critic: PHASE 3 loops back to Phase 2)
    ↓
[PHASE 3: Plan Acceptance]
    Plan saved to disk (permanent)
    Redirect to NEW chat
    ↓
[START-WORK Command: /start-work {plan-name}]
    Hook: start-work-hook.ts injects context
    Searches `.anyon/plans/` for matching plan file
    Creates `.anyon/thesis.json` (active work state)
    Reads plan, starts executing tasks
    ↓
[EXECUTION: Taskmaster Agent]
    Reads plan markdown
    Parses checkbox tasks
    Delegates each task to appropriate agent
    Collects evidence in `.anyon/evidence/`
    ↓
[FINAL VERIFICATION: 4-Wave Parallel Review]
    Plan Compliance Audit (advisor)
    Code Quality Review (linter)
    Real Manual QA (playwright)
    Scope Fidelity Check (deep agent)
    ↓
[COMPLETION: Task Marked Done]
    All checkboxes checked
    Evidence validated
    Work session complete
```

---

## 2. CRITICAL FILES & THEIR ROLES

### 2.1 PLAN STORAGE & PERSISTENCE

| File | Layer | Role |
|------|-------|------|
| `src/ipc/types/plan.ts` | Type Contracts | Defines PlanSchema, PlanUpdateSchema, PlanQuestionnaireSchema; Zod validation; IPC channels |
| `src/ipc/handlers/plan_handlers.ts` | Main-Process Handlers | CRUD for plans: create, read, update, delete to `.anyon/plans/*.md` |
| `src/ipc/handlers/planUtils.ts` | Main-Process Utils | Markdown parsing (frontmatter + content), slugify, gitignore management |
| `src/hooks/usePlan.ts` | Renderer Hook | React Query wrapper; loads saved plan from disk into memory; syncs via Jotai atom |
| `src/atoms/planAtoms.ts` | State Management | `planStateAtom`: plans by chat ID; `acceptedChatIds`; `pendingQuestionnaireAtom` |

**Data Storage:**
- Plans written as Markdown with YAML frontmatter to `.anyon/plans/{slug}.md`
- Frontmatter keys: `title`, `summary`, `chatId`, `createdAt`, `updatedAt`
- Content: Full plan markdown (TL;DR, Context, Objectives, Tasks, Verification)

### 2.2 THESIS STATE & SESSION MANAGEMENT

| File | Layer | Role |
|------|-------|------|
| `engine/src/features/thesis-state/types.ts` | Type Definitions | `ThesisState`: active_plan path, session_ids array, started_at, worktree_path, agent |
| `engine/src/features/thesis-state/storage.ts` | Storage | Read/write `.anyon/thesis.json`; parse plan progress (checkbox counting) |
| `engine/src/hooks/start-work/start-work-hook.ts` | Chat Lifecycle Hook | Injected on every message; detects `/start-work` command; finds plans; creates/updates thesis.json |

**Data Storage:**
- Thesis state persisted to `.anyon/thesis.json` (project root)
- Single active plan per project at a time
- Session IDs tracked (multiple Claude Code sessions can work on same plan)

### 2.3 PLAN GENERATION (STRATEGIST/NEWTON)

| File | Layer | Purpose |
|------|-------|---------|
| `engine/src/agents/strategist/plan-generation.ts` | Agent Prompt | PHASE 2 workflow: Analyst consultation → auto-generation → gap classification → self-review → summary |
| `engine/src/agents/strategist/plan-template.ts` | Template | Markdown template for generated plans; includes TL;DR, Context, Objectives, TODOs, Verification, Commit Strategy |
| `engine/src/hooks/keyword-detector/` | Hook | Detects `/plan` command in user input; auto-routes to Strategist |

**Plan Structure (Template):**
```markdown
# {Plan Title}

## TL;DR
- Quick summary
- Deliverables
- Estimated effort
- Parallel execution info

## Context
- Original request
- Interview summary
- Research findings
- Analyst review

## Work Objectives
- Core objective
- Concrete deliverables
- Definition of done
- Must have / Must NOT have

## Verification Strategy
- Test infrastructure
- QA policy
- Agent-executed scenarios

## Execution Strategy
- Parallel execution waves
- Dependency matrix
- Agent dispatch summary

## TODOs
- [ ] 1. Task with acceptance criteria + QA scenarios
- [ ] 2. Task...
- [ ] N. Final verification wave

## Success Criteria
```

### 2.4 START-WORK COMMAND FLOW

| File | Layer | Role |
|------|-------|------|
| `engine/src/hooks/start-work/start-work-hook.ts` | Lifecycle Hook | Intercepts `/start-work [plan-name]` messages; context injection |
| `engine/src/features/builtin-commands/templates/start-work.ts` | Command Template | System prompt for `/start-work` execution; worktree setup, thesis.json creation |
| `engine/src/config/schema/start-work.ts` | Configuration | `auto_commit: boolean` (default: true) |

**Hook Behavior:**
1. User types `/start-work` or `/start-work {plan-name}`
2. Hook injected into chat output (BEFORE AI sees it)
3. Context added: list of available plans, current plan progress, session ID
4. If no explicit plan name: auto-select (1 plan) or ask user (multiple plans)
5. If existing thesis.json: resume (append session ID)
6. If new: create thesis.json, clear old state

**Worktree Management:**
- Plans executed inside git worktree (not main branch)
- User can specify `--worktree <path>` or hook prompts for worktree setup
- Thesis.json tracks `worktree_path` for isolation

### 2.5 EXECUTION (TASKMASTER)

| File | Layer | Role |
|------|-------|------|
| `engine/src/agents/taskmaster/agent.ts` | Agent Definition | Orchestrates task execution; reads plan markdown; delegates by category |
| `engine/src/hooks/thesis-continuation-injector.ts` | Hook | Maintains thesis state; continues from last incomplete task on resume |

**Execution Loop:**
1. Taskmaster reads plan file (markdown with checkbox tasks)
2. Parses unchecked tasks: `- [ ] Task N: ...`
3. Delegates task to appropriate agent (category-based)
4. Executes QA scenarios from task spec
5. Saves evidence to `.anyon/evidence/task-{N}-{scenario}.ext`
6. Marks task done: `- [x] Task N: ...`
7. Loop until all tasks complete or user interrupts

---

## 3. KEY STATES & TRANSITIONS

### State Lifecycle (Single Chat)

```
Chat Created
    ↓
User enters "Plan Mode" (chat mode selector)
    ↓
[PLAN GENERATION PHASE]
    - Strategist interviews user
    - Phase 2 triggered (auto or user says "Create plan")
    - Generates plan to `.anyon/plans/{slug}.md`
    - (Plan is NOW PERSISTENT — can't iterate easily)
    ↓
[ACCEPTANCE/REDIRECT PHASE]
    - User clicks "Accept Plan" button
    - Plan moves from chat-specific to project-wide
    - App redirects to NEW chat (leaving plan-chat behind)
    ↓
[START-WORK PHASE]
    - User types `/start-work {plan-name}`
    - Creates `.anyon/thesis.json`
    - Agent system switches to Taskmaster
    - Execution begins
```

### Checkboxes in Plan File

Plans are markdown with checkboxes. Progress tracked by counting:
- **Unchecked**: `- [ ]` or `- [ ]` or `-  [ ]`
- **Checked**: `- [x]` or `- [X]`
- **Formula**: `isComplete = (total === 0) || (completed === total)`

Taskmaster updates checkboxes by editing plan file.

### Session ID & Multi-Session Continuity

- Each Claude Code session gets unique `sessionID`
- Thesis.json stores array of `session_ids` that have touched this plan
- If same plan resumed in different session: append new session ID to array
- **Critical**: Worktree_path is NOT session-specific (shared across sessions)

---

## 4. PROPOSED FOUNDER-FIRST FLOW & INTEGRATION POINTS

### Proposed Flow

```
User starts chat
    ↓
User writes long request (ideation)
    ↓
User requests: "/plan {request}" (or auto-triggers on certain markers)
    ↓
[PHASE 1: Interview + Research]
    Strategist interviews
    Researcher finds patterns
    ↓
[PHASE 2: ITERATIVE SPEC REFINEMENT (NEW)]
    Plan generated in DRAFT form (separate from `.anyon/plans/`)
    User reviews spec
    User makes edits/asks clarifications
    Spec EVOLVES without committing
    ↓
[PHASE 2.5: ANALYST REVIEW → DECISION (NEW)]
    When user says "Create the plan" → Analyst consults
    Gaps classified, user answers critical Qs
    ↓
[PHASE 3: FINAL PLAN → EXECUTION-READY]
    Spec → Plan with todos (checksboxes)
    Saved to `.anyon/plans/` (NOW IMMUTABLE)
    Optional: Critic review
    ↓
[START-WORK]
    Execute plan exactly as current system does
```

### Where Proposed Flow Conflicts/Fits

#### ✅ **Natural Fit:**
1. **Analyst consultation** (PHASE 2b) already exists — can enhance it
2. **Gap classification** (CRITICAL/MINOR/AMBIGUOUS) already exists
3. **Self-review checklist** already exists — can leverage
4. **Markdown plan format** is extensible (add metadata for draft status)
5. **IPC plan handlers** already support create/update — can use for drafts
6. **Thesis state** can track draft phase (pre-acceptance state)

#### ⚠️ **Needs New Infrastructure:**

| Component | Current | Needed | Notes |
|-----------|---------|--------|-------|
| Draft Storage | Single `.anyon/plans/` | Add `.anyon/plans.draft/` or metadata in plan | Separate draft from executable plans |
| Draft Lifecycle | Plan → Accept (1 step) | Plan → Draft → Edit → Accept (3+ steps) | Need edit/revert/finalize workflow |
| Spec Versioning | Auto-overwrite | Version history / diffs | User needs to see what changed |
| Freeze Point | None (plan always mutable) | Mark "ready-to-execute" | Clear boundary between ideation & execution |
| User Edits | Not expected | Text-based or structured | Diff/merge strategy needed |

#### 🔴 **Architectural Constraints:**

1. **Plan file is both readable AND executable** — Taskmaster parses and modifies checkboxes in-place
   - **Risk**: If user edits draft plan during execution, checkbox updates get corrupted
   - **Solution**: Lock plan file during execution, or use separate execution file

2. **Single active plan per thesis.json**
   - **Risk**: Can't have multiple draft plans being refined simultaneously
   - **Solution**: Allow multiple draft plans; thesis.json only tracks ONE active (execution-phase) plan

3. **No plan versioning**
   - **Risk**: Can't compare "spec at ideation" vs "spec at acceptance"
   - **Solution**: Git-track plans in .anyon/plans/ (with diffs in commits)

---

## 5. MOST RELEVANT FILES FOR PROPOSED FLOW

### Core Plan IPC Layer
- `src/ipc/types/plan.ts` — Add `DraftPlanSchema`, `PlanStatusEnum` ("draft"|"accepted"|"executing"|"complete")
- `src/ipc/handlers/plan_handlers.ts` — Add `getDraft()`, `createDraft()`, `updateDraft()`, `finalizeDraft()`
- `src/ipc/handlers/planUtils.ts` — Add version/status metadata parsing

### Strategist (Generation)
- `engine/src/agents/strategist/plan-generation.ts` — Add explicit "save as draft" step
- `engine/src/agents/strategist/plan-template.ts` — Add draft iteration instructions

### Thesis State (Lifecycle)
- `engine/src/features/thesis-state/types.ts` — Add `draft_plan_path`, `status: "ideation"|"ready"`
- `engine/src/features/thesis-state/storage.ts` — Support reading/writing draft state

### Start-Work (Execution)
- `engine/src/hooks/start-work/start-work-hook.ts` — Add check: "Is plan draft or ready-to-execute?"
- `engine/src/features/builtin-commands/templates/start-work.ts` — Add validation before execution

### React (Desktop UI)
- `src/atoms/planAtoms.ts` — Add `draftPlanAtom`, `specEditorOpenAtom`
- `src/hooks/usePlan.ts` — Add `useDraftPlan()` hook for loading/saving drafts

---

## 6. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop (Renderer)                         │
│                                                               │
│  User Chat Input → [Plan Mode Selector]                     │
│       ↓                                                       │
│  `/plan {request}`  → [Strategist via IPC]                  │
│       ↓                                                       │
│  Interview + Research (AI agents in Engine)                  │
│       ↓                                                       │
│  [CURRENT] Plan generated → .anyon/plans/{slug}.md SAVED      │
│  [PROPOSED] Draft generated → .anyon/plans.draft/{slug}.md    │
│       ↓ (if draft)                                            │
│  User reads spec in chat                                      │
│       ↓                                                       │
│  [PROPOSED] "/edit-spec" or inline editing                    │
│       ↓                                                       │
│  [PROPOSED] "/finalize-spec" → Analyst review → frozen       │
│       ↓                                                       │
│  Plan → `.anyon/plans/` (executable)                          │
│       ↓ (auto or user trigger)                               │
│  Redirect to new chat + `/start-work {plan}`                 │
│       ↓                                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Engine (oh-my-opencode Plugin)                   │
│                                                               │
│  [Strategist Agent]                                           │
│   ├─ Phase 1: Interview                                       │
│   ├─ Phase 2: Generate + Gap Classify                         │
│   └─ Phase 2.5: Self-Review (Analyst)                         │
│       ↓                                                       │
│  [PROPOSED] Spec Refinement Loop:                             │
│   ├─ User edits (via edit-spec tool)                          │
│   ├─ Regenerate sections (not full plan)                      │
│   └─ Repeat until "finalize" command                          │
│       ↓                                                       │
│  [Create Plan from Frozen Spec]                              │
│   └─ IPC: planClient.createPlan()                             │
│       ↓                                                       │
│  [Taskmaster Agent] (on start-work)                           │
│   ├─ Read plan from disk                                      │
│   ├─ Delegate tasks by category                              │
│   ├─ Update checkboxes                                        │
│   └─ Collect evidence                                         │
│       ↓                                                       │
│  [Final Verification Wave]                                    │
│   ├─ Advisor: Plan compliance audit                           │
│   ├─ Critic: Code quality                                     │
│   ├─ Agent: Real QA                                           │
│   └─ Deep: Scope fidelity                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Disk Storage (Project Root)                      │
│                                                               │
│  .anyon/                                                      │
│  ├─ plans/                 ← Frozen execution-ready plans      │
│  │   ├─ plan-1.md (status: "accepted", immutable)            │
│  │   └─ plan-2.md (status: "executing")                      │
│  │                                                            │
│  ├─ plans.draft/           ← [NEW] Iterative specs            │
│  │   ├─ spec-1.md (version: 3, editable)                     │
│  │   └─ spec-2.md (version: 1, editable)                     │
│  │                                                            │
│  ├─ thesis.json            ← Active work state                │
│  │   {                                                        │
│  │     active_plan: ".../plan-2.md",                          │
│  │     draft_plan: ".../spec-1.md" [PROPOSED],               │
│  │     status: "executing" [PROPOSED]                         │
│  │   }                                                        │
│  │                                                            │
│  └─ evidence/              ← Task execution proof             │
│      ├─ task-1-happy-path.txt                                 │
│      └─ task-2-error-case.txt                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. INTEGRATION CHECKLIST FOR PROPOSED FLOW

### Phase 1: Draft Infrastructure
- [ ] Create `.anyon/plans.draft/` directory handling
- [ ] Add `DraftPlanSchema` to `src/ipc/types/plan.ts`
- [ ] Implement `createDraft()`, `updateDraft()`, `getDraft()` handlers
- [ ] Add draft lifecycle metadata (version, status, created_at)

### Phase 2: Spec Refinement UI/UX
- [ ] Build spec editor UI (inline or side panel) in renderer
- [ ] Add `/edit-spec {section}` command to Strategist
- [ ] Create section-level regeneration (not full plan)
- [ ] Track version history / diffs

### Phase 3: Finalization → Execution
- [ ] Add `/finalize-spec` command
- [ ] Analyst consultation automatically triggered
- [ ] Frozen plan saved to `.anyon/plans/` 
- [ ] Update thesis.json with `status: "ready-to-execute"`

### Phase 4: Execution Safeguards
- [ ] Prevent `/start-work` on draft plans
- [ ] Lock plan file during execution (no user edits)
- [ ] Separate execution checkboxes from spec content

### Phase 5: Validation & Testing
- [ ] E2E test: draft → edit → finalize → execute flow
- [ ] Concurrent draft handling (multiple spec versions)
- [ ] Error recovery (resume after interruption)

---

## 8. RISK ANALYSIS & MITIGATION

| Risk | Current System | Proposed Flow | Mitigation |
|------|---|---|---|
| **Plan corruption** | Taskmaster edits plan in-place | Draft & execution use separate files | Lock plan during execution; use `.execution` variant |
| **User confusion** | 1 type of plan | 2 types (draft + execution) | Clear UI labels + state indicator |
| **Spec thrashing** | Can't happen (instant accept) | User edits forever | Timeout? Version limit? Auto-finalize after N edits? |
| **Multi-draft chaos** | Single active plan | Multiple drafts possible | Limit to 1 active draft; others archived |
| **Lost work on reject** | Plan always kept (unless deleted) | If user closes chat before finalize | Save draft on every edit; offer resume on reopen |

---

## SUMMARY TABLE

| Aspect | Current | Proposed | Impact |
|--------|---------|----------|--------|
| **Plan Generation** | Instant, single pass | Iterative, multi-pass | +UX polish, -speed to execution |
| **Spec Permanence** | Frozen on accept | Frozen on finalize (after edits) | +user confidence, +complexity |
| **Storage** | `.anyon/plans/` | `.anyon/plans/` + `.anyon/plans.draft/` | +disk usage, +clarity |
| **State Tracking** | thesis.json (simple) | thesis.json (draft_plan, status fields) | +completeness, +scope |
| **Execution** | Immediate after accept | After finalize + optional review | +rigor, +latency |
| **Integration Points** | 15 core files | 15 existing + 6 new | +maintainability, +test surface |

