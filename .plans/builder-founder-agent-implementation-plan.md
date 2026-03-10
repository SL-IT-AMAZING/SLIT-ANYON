# Builder Founder-Agent Implementation Plan

## Goal

Replace the current developer-facing multi-agent planning/execution experience with a founder-facing `Builder` flow that:

1. accepts vague product ideas in natural language,
2. spends meaningful time clarifying the service concept through product-focused questions,
3. extracts and documents user flows as the primary planning artifact,
4. produces a founder-readable brief plus a deeper internal execution spec,
5. converts the approved spec into wave-based todos,
6. executes each wave autonomously using the existing thesis/taskmaster/continuation engine,
7. keeps technical implementation details hidden from non-technical users.

## Product Principles

- The most important output of conversation is a clear map of the service's user flows.
- The system speaks in product language, not developer language.
- The user approves a concise founder brief, not a giant internal implementation plan.
- The engine may use long internal specs, but execution starts from an approved MVP wave, not the entire lifetime vision.
- `Builder` is the only founder-facing main agent identity.
- `Craftsman` remains the implementation worker.
- Strategist/Taskmaster/thesis/continuation mechanics remain internal until later cleanup.

## Target Experience

### Founder-Facing Flow

1. User opens the app and describes an idea loosely.
2. `Builder` asks product questions over a long conversation.
3. `Builder` progressively extracts:
   - target user types,
   - core user goals,
   - entry points,
   - key actions,
   - decision points,
   - failure/friction points,
   - admin/operator flows,
   - MVP boundary,
   - non-goals.
4. `Builder` writes a living draft behind the scenes.
5. When the conversation is sufficiently clear, `Builder` presents a concise `Founder Brief` for approval.
6. After approval, the system generates an `Internal Build Spec` and wave-based execution todos.
7. User starts building from the approved wave.
8. Existing execution machinery runs the build cycle until the wave is complete.
9. User reviews the result in the app preview and continues with the next wave.

### Internal Artifacts

- `Founder Brief` - user-readable summary of the service
- `User Flow Spec` - structured flow documentation extracted from conversation
- `Internal Build Spec` - execution-oriented plan with implementation detail
- `Wave Todo Plan` - checkbox-based execution plan for thesis/taskmaster flow

## Scope

### In Scope

- Introduce `Builder` as the founder-facing agent identity
- Rework planning flow around long-form ideation + flow extraction
- Make user-flow documentation a first-class planning output
- Add a draft/refinement stage before plan finalization
- Split founder-facing brief from execution-facing internal spec
- Convert approved specs into wave-based todo plans
- Reuse existing `start-work`, `thesis.json`, continuation, and execution machinery
- Keep preview/reporting behavior compatible with existing product surfaces

### Out of Scope

- Rebuilding the preview system
- Replacing the execution engine from scratch
- Full deletion of Taskmaster/Strategist internals in the first implementation pass
- Full-agent renaming cleanup across every internal file on day one
- Browser-demo workflow as a required product feature

## Existing Architecture To Reuse

### Engine Planning and Execution

- `engine/src/agents/strategist/interview-mode.ts`
- `engine/src/agents/strategist/plan-generation.ts`
- `engine/src/agents/strategist/plan-template.ts`
- `engine/src/hooks/start-work/start-work-hook.ts`
- `engine/src/features/thesis-state/storage.ts`
- `engine/src/agents/taskmaster/agent.ts`
- `engine/src/agents/taskmaster/default.ts`
- `engine/src/hooks/taskmaster/`
- `engine/src/hooks/todo-continuation-enforcer/`
- `engine/src/hooks/persist-loop/`

### Product/UI Planning Surfaces

- `src/ipc/types/plan.ts`
- `src/ipc/handlers/plan_handlers.ts`
- `src/ipc/handlers/planUtils.ts`
- `src/hooks/usePlan.ts`
- `src/atoms/planAtoms.ts`

## Architecture Decision

### Decision

Implement a surface-level merge first:

- expose `Builder` as the single founder-facing planning/building agent,
- keep Strategist interview logic and Taskmaster execution logic as internal capabilities,
- preserve thesis/start-work/continuation infrastructure,
- add a new draft and flow-documentation layer above the existing execution plan system.

### Why

- Lowest-risk path using code that already exists
- Preserves the strongest execution machinery already in the repo
- Avoids breaking continuation and thesis state systems prematurely
- Lets the product UX change before the internals are aggressively simplified

### Locked First-Pass Decisions

- `Builder` is a first-pass founder-facing alias over the existing `conductor` execution identity, not a full internal replacement on day one.
- `Craftsman` remains the implementation worker.
- Strategist and Taskmaster remain internal capabilities in the first pass.
- Execution-compatible plans remain markdown files in `.anyon/plans/` because thesis progress parsing already depends on that contract.
- Founder-facing draft and brief artifacts must not be the same file that execution mutates during checkbox updates.
- Founder acceptance in the app must flow into the existing implementation kickoff path, with a Builder-labeled UX wrapper over the current internal command path.

## Deliverables

1. `Builder` agent design and registration
2. Founder conversation flow and prompting rules
3. Draft-spec lifecycle before final plan freeze
4. Structured user-flow extraction model and markdown format
5. Founder Brief artifact
6. Internal Build Spec artifact
7. Wave planner that converts approved spec into executable todo plan
8. Updated start-build UX using existing execution engine
9. Validation coverage for planning, draft-finalize, and wave execution handoff

## Persistence and Artifact Model

### Canonical Storage Model

#### 1. Draft Spec

- Purpose: mutable conversation-backed ideation artifact
- Suggested location: `.anyon/drafts/chat-{chatId}-{slug}.md`
- Ownership: one active draft per planning chat
- Lifecycle: create -> update many times -> finalize or discard
- Must include metadata for:
  - `chatId`
  - `status: draft`
  - `version`
  - `updatedAt`
  - linked founder brief id if generated

#### 2. Founder Brief

- Purpose: approval artifact shown to founder
- Suggested location: `.anyon/briefs/chat-{chatId}-{slug}.md`
- Ownership: derived from a draft, replaceable until approval
- Lifecycle: generate -> revise -> approve
- Must include metadata for:
  - `chatId`
  - `draftId`
  - `status: pending_approval | approved | superseded`
  - `approvedAt`

#### 3. Internal Build Spec

- Purpose: detailed planning artifact for wave generation
- Suggested location: `.anyon/specs/chat-{chatId}-{slug}.md`
- Ownership: derived from approved founder brief
- Lifecycle: generated after approval, updated only by deliberate re-planning
- Must include metadata for:
  - `chatId`
  - `briefId`
  - `status: active | superseded`
  - `waveCount`

#### 4. Wave Todo Plan

- Purpose: execution-compatible markdown plan consumed by thesis/taskmaster flow
- Required location: `.anyon/plans/`
- Naming rule: continue chat-scoped slugging compatibility or add a deterministic wave suffix while preserving parser compatibility
- Lifecycle: generated from internal build spec, then mutated during execution via checkbox updates
- Must include metadata for:
  - `chatId`
  - `specId`
  - `waveIndex`
  - `status: queued | active | complete`

### Why This Split Is Required

- Current execution edits checkbox plans in place.
- Current plan retrieval is chat-keyed and slug-based.
- Current thesis progress depends on checkbox counting from markdown in `.anyon/plans/`.
- Therefore founder draft/brief artifacts must be separate from the executable wave plan.

## Execution Kickoff Contract

### First-Pass Kickoff Decision

- Keep the existing internal implementation kickoff path alive.
- Founder-facing UI should present a Builder action such as `Start building`.
- That action may still map internally to the current implementation command path (`/implement-plan=` and/or `/start-work`) during the first pass.
- The founder must never be required to understand those internal commands.

### Required Handoff States

1. founder brief approved
2. internal build spec generated
3. wave 1 execution plan created in `.anyon/plans/`
4. pending implementation state set for the current chat/app
5. existing engine starts execution without exposing Taskmaster/thesis language

### Repo Surfaces That Must Be Updated Together

- `src/hooks/usePlanImplementation.ts`
- `src/atoms/planAtoms.ts`
- `src/ipc/types/plan.ts`
- `src/ipc/handlers/plan_handlers.ts`
- `engine/src/hooks/start-work/start-work-hook.ts`
- `engine/src/features/builtin-commands/templates/start-work.ts`

## Implementation Phases

### Phase 1 - Define Builder as the Founder-Facing Main Agent

#### Objective

Create the new top-level agent identity and make it the intended founder entry point without deleting existing execution internals.

#### Tasks

- Add `Builder` to agent schemas, display names, config handling, and priority ordering.
- Implement first pass as a founder-facing alias over `conductor`, with internal cleanup deferred.
- Update agent picker / agent selection logic so the visible main agents become `Builder` and `Craftsman`.
- Hide or de-emphasize Strategist and Taskmaster from the primary founder UX.
- Update hardcoded fallback names, icons, and translation/display layers in the renderer.

#### Likely Files

- `engine/src/config/schema/agent-names.ts`
- `engine/src/shared/agent-display-names.ts`
- `engine/src/plugin-handlers/agent-priority-order.ts`
- `engine/src/plugin-handlers/agent-config-handler.ts`
- `engine/src/agents/builtin-agents.ts`
- `engine/src/agents/builtin-agents/conductor-agent.ts`
- `src/components/AgentPicker.tsx`

#### Acceptance Criteria

- The product can present `Builder` as the main founder-facing choice.
- Existing engine behavior does not regress when execution begins.
- Taskmaster/Strategist remain available internally even if hidden from the default surface.
- The renderer no longer relies on outdated hardcoded main-agent names in fallback surfaces.

---

### Phase 2 - Rebuild the Planning Conversation Around User Flows

#### Objective

Shift planning from generic implementation questioning to deep service-flow extraction.

#### Required Behavior

`Builder` must treat the service's user flows as the most important planning output.

#### Conversation Outputs

For each major service concept, extract and persist:

- who the users are,
- what each user type is trying to do,
- the sequence of steps they take,
- where they enter the product,
- what data/content they create or consume,
- what happens after success,
- what can go wrong,
- what administrators/operators need,
- what is MVP versus later.

#### Tasks

- Define a `Builder` system prompt and behavioral rules.
- Reuse Strategist interview logic but rewrite it for founder/product language.
- Add explicit user-flow extraction structure instead of only task/implementation planning.
- Add draft persistence for long conversations.
- Add “enough clarity to summarize” thresholds that move the session from ideation to synthesis.

#### Likely Files

- `engine/src/agents/conductor.ts` or new `engine/src/agents/builder.ts`
- `engine/src/agents/strategist/interview-mode.ts`
- `engine/src/agents/strategist/identity-constraints.ts` if present
- `engine/src/agents/analyst.ts`
- `engine/src/agents/dynamic-agent-prompt-builder.ts`
- `engine/src/hooks/keyword-detector/`

#### Acceptance Criteria

- The agent asks product questions, not technical implementation questions.
- The agent can produce a structured list of service user flows from conversation.
- The agent avoids developer jargon unless absolutely necessary.
- The draft can survive long ideation sessions without prematurely freezing into execution.

---

### Phase 3 - Add Draft Spec Infrastructure Before Final Plan Freeze

#### Objective

Introduce an iterative draft stage so the founder can refine the product concept before generating an execution plan.

#### Tasks

- Add a draft storage concept separate from accepted plans.
- Allow iterative updates to the draft during conversation.
- Support a clear transition from `draft` to `approved founder brief` to `internal execution plan`.
- Prevent execution from starting off an unapproved draft.
- Define exact filename, metadata, ownership, and retrieval rules for draft/brief/spec/wave artifacts.

#### Recommended Artifact Model

- `Draft Spec`
  - mutable
  - conversation-driven
  - contains raw user flow exploration and evolving scope
- `Founder Brief`
  - concise
  - approval artifact
  - plain-language only
- `Internal Build Spec`
  - execution-facing
  - detailed
  - may contain implementation constraints and verification detail

#### Likely Files

- `src/ipc/types/plan.ts`
- `src/ipc/handlers/plan_handlers.ts`
- `src/ipc/handlers/planUtils.ts`
- `src/atoms/planAtoms.ts`
- `src/hooks/usePlan.ts`
- new draft-focused IPC/types/atoms if needed
- `src/ipc/types/index.ts`
- `src/ipc/ipc_host.ts`
- `src/lib/queryKeys.ts`

#### Acceptance Criteria

- Draft specs can be saved, updated, and resumed.
- Founder approval is explicit and separate from execution.
- Existing plan execution does not accidentally mutate the founder brief.
- Retrieval rules are deterministic for both chat-scoped planning and app-scoped execution handoff.

---

### Phase 4 - Make User Flow Documentation First-Class

#### Objective

Create a durable planning format centered on user flows, not just engineering tasks.

#### Founder Brief Structure

- Product summary
- Target users
- Core promise/value
- Primary user flows
- Secondary/supporting flows
- Admin/operator flows
- MVP scope
- Later scope / not now
- Assumptions and defaults applied
- Open decisions (if any)

#### Internal User Flow Spec Structure

- Flow inventory table
- Entry triggers
- Step-by-step interaction flows
- Alternate branches
- Error/empty/edge states
- Data/content touched by each flow
- Required product rules
- Preview checkpoints per flow

#### Tasks

- Define markdown templates for founder brief and user-flow spec.
- Ensure the agent updates these artifacts incrementally.
- Ensure the final build plan references the user flows explicitly.

#### Acceptance Criteria

- Every approved service concept has documented primary and secondary flows.
- Build tasks can be traced back to named user flows.
- Founder-facing summaries stay readable and short.

---

### Phase 5 - Generate Wave-Based Internal Build Specs and Todo Plans

#### Objective

Convert approved service/user-flow specs into safe, executable waves rather than a single full-product one-shot.

#### Tasks

- Define a wave slicing strategy:
  - Wave 1: narrow MVP path / first end-to-end usable slice
  - Wave 2+: adjacent flows, refinement, admin/support, polish
- Convert each wave into checkbox todos compatible with existing thesis/taskmaster flow.
- Preserve heavy internal detail for execution while keeping founder UX simple.
- Ensure each wave has acceptance and verification rules.
- Lock the wave-plan contract to `.anyon/plans/*.md` with checkbox semantics compatible with thesis-state parsing.
- Add explicit dependency markers between waves and within wave tasks.

#### Likely Files

- `engine/src/agents/strategist/plan-template.ts`
- `engine/src/agents/strategist/plan-generation.ts`
- `engine/src/features/thesis-state/storage.ts`
- `engine/src/features/builtin-commands/templates/start-work.ts`
- `src/hooks/usePlanImplementation.ts`

#### Acceptance Criteria

- Approved specs can produce a wave-based execution plan.
- The first wave is small enough to implement with confidence but meaningful enough to feel like visible progress.
- Existing checkbox parsing remains compatible.
- The engine can still discover and resume wave plans using existing thesis-state logic.

---

### Phase 6 - Reuse Existing Execution Engine Behind Builder

#### Objective

Keep the current autonomous build loop, but make it feel like `Builder` is still in charge from the founder's point of view.

#### Tasks

- Ensure the founder-facing flow no longer depends on the user understanding `/plan`, `taskmaster`, `thesis`, or internal plan-file concepts.
- Wrap or simplify the build kickoff UX.
- Keep `start-work`, thesis state, and continuation hooks working.
- Preserve hard session switching internally if needed in the first pass, but keep Builder as the stable visible identity.
- Remove or rewrite founder-visible command/prompt text that exposes Conductor/Strategist/Taskmaster/thesis terminology.

#### Likely Files

- `engine/src/hooks/start-work/start-work-hook.ts`
- `engine/src/features/builtin-commands/templates/start-work.ts`
- `engine/src/hooks/taskmaster/`
- `engine/src/hooks/todo-continuation-enforcer/`
- `engine/src/hooks/persist-loop/`
- `src/hooks/usePlanImplementation.ts`
- `src/atoms/planAtoms.ts`

#### Acceptance Criteria

- Founder-facing build initiation is simple.
- Existing execution loops still run to completion.
- The system can resume interrupted work using thesis state.
- Founder-visible messaging no longer leaks internal engine terms in normal operation.

---

### Phase 7 - Progress, Review, and Iteration Loop

#### Objective

Make the product feel alive after each build cycle without requiring the user to understand internal execution machinery.

#### Tasks

- Define founder-facing progress language:
  - what the system is building now,
  - what user flow became available,
  - what remains in this wave,
  - what needs founder input next.
- Ensure the result of a build cycle maps back to the approved user flows.
- Add next-step recommendations for “continue this wave”, “start next wave”, or “revise scope”.

#### Acceptance Criteria

- A founder can understand what was built in business/product terms.
- Progress reporting references user flows, not internal engine concepts.

---

### Phase 8 - Validation and Safety

#### Objective

Guarantee the new flow is reliable, resumable, and does not regress the existing execution engine.

#### Required Validation Areas

- long conversation persistence,
- draft save/update/resume,
- founder brief approval,
- internal plan generation,
- wave todo generation,
- start-work handoff,
- thesis state resume,
- task continuation after idle,
- interruption/re-entry handling,
- agent visibility and routing,
- no accidental exposure of developer jargon in founder mode.

#### Likely Tests

- unit tests for draft/plan transforms,
- unit tests for flow extraction,
- integration tests for plan finalization,
- hook tests for start-work and continuation,
- e2e founder journey from ideation to first wave execution.

## Suggested File Additions

- `engine/src/agents/builder.ts` or equivalent founder-facing prompt module
- `engine/src/agents/strategist/founder-flow-template.ts`
- `src/ipc/types/draft-plan.ts` if separating draft contracts cleanly
- `src/ipc/handlers/draft_plan_handlers.ts`
- `src/hooks/useDraftPlan.ts`
- `src/atoms/draftPlanAtoms.ts`
- `.anyon/` templates or explicit markdown generators for draft/brief/spec artifacts

## Suggested File Modifications

- `engine/src/agents/conductor.ts`
- `engine/src/agents/strategist/interview-mode.ts`
- `engine/src/agents/strategist/plan-generation.ts`
- `engine/src/agents/strategist/plan-template.ts`
- `engine/src/hooks/start-work/start-work-hook.ts`
- `engine/src/features/thesis-state/storage.ts`
- `engine/src/plugin-handlers/agent-config-handler.ts`
- `engine/src/plugin-handlers/agent-priority-order.ts`
- `src/ipc/types/plan.ts`
- `src/ipc/handlers/plan_handlers.ts`
- `src/ipc/handlers/planUtils.ts`
- `src/hooks/usePlan.ts`
- `src/atoms/planAtoms.ts`

## Risks and Mitigations

### Risk 1 - Overlong Ideation Without Convergence

If `Builder` keeps talking without converging, the product feels intelligent but never ships.

Mitigation:

- Add explicit clarity thresholds.
- Summarize regularly.
- Move from discovery to synthesis when user flows become stable.

### Risk 2 - Founder Approves What They Cannot Actually Validate

If the founder sees only a giant internal spec, approval is meaningless.

Mitigation:

- Separate founder brief from internal build spec.
- Keep approval focused on user, flow, value, and MVP scope.

### Risk 3 - One Wrong Assumption Gets Executed Too Aggressively

The continuation engine is strong enough to implement the wrong thing very efficiently.

Mitigation:

- Execute by wave.
- Keep high-cost decisions explicit.
- Freeze scope before build.

### Risk 4 - Internal Execution Artifacts Leak Into Founder UX

Terms like `thesis`, `taskmaster`, `todo list`, or `/start-work` can make the system feel like a developer tool.

Mitigation:

- Keep those concepts internal.
- Present product-language progress only.

### Risk 5 - Draft and Executable Plan Mutability Collide

Execution today mutates checkbox plans directly.

Mitigation:

- Separate mutable draft and founder brief from execution-tracking plan/checkpoint artifacts.

### Risk 6 - Builder Naming and Routing Collide With Existing Build/OpenCode-Builder Paths

The repo already has `build` and `OpenCode-Builder` in overridable agent names.

Mitigation:

- Decide and document first-pass naming/alias strategy before implementation starts.
- Update renderer fallback names and display mappings together with engine config.

### Risk 7 - Founder Flow and Existing Accept-Plan Flow Diverge

The renderer already has a pending implementation handoff after plan acceptance.

Mitigation:

- Rework acceptance and kickoff as one coherent Builder flow instead of bolting a second parallel acceptance system on top.

## Milestone Breakdown

### Milestone 1 - Builder Identity and Founder Conversation Rules

- Builder appears as the primary founder-facing agent
- Product-language prompting in place
- User-flow extraction rules defined

### Milestone 2 - Draft and Founder Brief Workflow

- Drafts can be iteratively refined
- Founder brief can be explicitly approved
- User flows become first-class documents

### Milestone 3 - Internal Build Spec and Wave Planning

- Approved brief converts into internal execution spec
- Wave-based todos generated
- Existing execution engine can start from new artifacts

### Milestone 4 - Full Ideation-to-Build Cycle

- Founder can go from vague idea to approved brief to first autonomous build wave
- Thesis/taskmaster/continuation pipeline works without leaking internal complexity

## Definition of Done

- A founder can describe a vague service idea and be guided through a long clarification conversation.
- The system extracts and documents the service's user flows as a core artifact.
- The founder approves a concise brief rather than a giant engineering plan.
- The system produces a deeper internal spec and wave-based execution plan.
- Existing autonomous execution infrastructure successfully builds the approved first wave.
- Internal execution mechanics remain largely hidden from the founder-facing UX.
- Validation covers planning, finalization, handoff, resume, and continuation behavior.

## Recommended Execution Order

1. Phase 1 - Builder identity
2. Phase 2 - founder conversation and flow extraction
3. Phase 3 - draft infrastructure
4. Phase 4 - founder brief + user-flow documents
5. Phase 5 - wave planner
6. Phase 6 - execution handoff integration
7. Phase 7 - founder-facing progress layer
8. Phase 8 - validation and polish

## Dependency Graph

### Serial Blockers

1. Builder identity decision and visible routing
2. artifact persistence model
3. founder conversation + flow extraction model
4. founder brief approval contract
5. internal build spec + wave plan generation
6. execution kickoff integration
7. founder-visible progress cleanup
8. validation + polish

### Parallelizable Work After Blockers Clear

#### Wave A - Naming and Surface Prep

- agent picker updates
- display-name/config wiring
- hidden/internal agent surfacing decisions

#### Wave B - Draft/Brief/Spec Infrastructure

- IPC contracts
- handlers
- atoms/hooks
- query key additions

#### Wave C - Prompt and Planning Logic

- Builder prompt
- Strategist interview adaptation
- flow extraction templates
- founder brief generation

#### Wave D - Execution Handoff

- plan-to-implementation transition
- start-work wrapper
- thesis compatibility checks
- continuation message cleanup

#### Wave E - Validation

- unit tests
- integration tests
- e2e founder journey

## TDD and Verification Strategy

### RED/GREEN/REFACTOR Order

1. Add tests for artifact transforms and storage contracts before implementation.
2. Add tests for founder brief generation and flow extraction before prompt/template integration settles.
3. Add tests for acceptance -> implementation kickoff before wiring the final handoff.
4. Add thesis compatibility tests before changing execution-plan generation.
5. Add e2e founder journey coverage after the core flow is stable.

### Mandatory Verification Per Tranche

- relevant unit tests
- relevant integration tests
- `bun run typecheck`
- relevant renderer/engine test suites
- `npm run build` or project build command for touched surfaces

## Atomic Commit Strategy

1. `feat(builder): add founder-facing Builder identity and picker wiring`
2. `feat(planning): add draft and founder brief persistence model`
3. `feat(builder): add user-flow extraction and founder brief generation`
4. `feat(planning): generate internal build spec and wave plans`
5. `feat(execution): connect Builder approval flow to existing execution engine`
6. `refactor(copy): remove internal-engine terminology from founder-visible messaging`
7. `test(builder): add founder journey and handoff coverage`

## Notes For Execution

- Preserve existing execution machinery first; redesign UX before deleting internals.
- Treat user-flow extraction quality as the most important planning quality metric.
- Optimize for founder confidence, not developer-visible sophistication.
- Use the app's existing preview as the natural output of each execution wave.
