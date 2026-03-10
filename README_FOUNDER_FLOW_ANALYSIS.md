# Founder-First Flow Analysis: Documentation Index

This analysis maps ANYON-B2C's current internal architecture (drafts → plans → start-work → execution) and evaluates how the proposed founder-first user flow fits against the engine architecture.

## 📄 Documents in This Analysis

### 1. **MAPPING_SUMMARY.md** ⭐ START HERE
**What it is:** Executive summary with key findings, architecture overview, and recommendations.

**Key sections:**
- What Was Requested
- Current System Overview (Interview → Plan → Execute flow)
- Core Files & Their Roles (table of responsibilities)
- End-to-End Flow Diagram
- Natural Fit: What Already Exists
- Conflicts & Constraints (plan mutability issue)
- Implementation Phases (4-5 weeks estimate)
- Risk Assessment
- Bottom Line Recommendation

**Time to read:** 10 minutes
**Best for:** Understanding the big picture before diving into details

---

### 2. **FOUNDER_FLOW_ANALYSIS.md** 
**What it is:** Comprehensive technical analysis with detailed implementation checklist.

**Key sections:**
- Complete end-to-end current flow
- Detailed file-by-file breakdown:
  - Plan Storage & Persistence (IPC layer)
  - Thesis State & Session Management
  - Plan Generation (Strategist/Newton Agent)
  - Start-Work Command Flow
  - Execution (Taskmaster)
- Key States & Transitions
- Proposed Founder-First Flow vs. Current
- Where Proposed Flow Fits/Conflicts
- Most Relevant Files for Implementation (15 current + 6 new)
- Full Data Flow Diagrams
- Integration Checklist (Phase 1-5)
- Risk Analysis & Mitigation Table
- Summary Table (Current vs. Proposed impacts)

**Time to read:** 25 minutes
**Best for:** Complete understanding, implementation planning

---

### 3. **ARCHITECTURE_DIAGRAM.txt**
**What it is:** Visual ASCII diagrams of the entire architecture across 5 layers.

**Key sections:**
- Layer 1: Desktop Application (Electron + React)
- Layer 2: Main Process (Electron Main)
- Layer 3: Engine (oh-my-opencode Plugin)
- Layer 4: File System (.anyon/ directory structure, current vs. proposed)
- Layer 5: Execution Flow (Taskmaster Agent)
- State Machine Diagrams (Current vs. Proposed)
- Key Integration Points Table
- Critical Constraint: Plan File Mutability

**Time to read:** 15 minutes
**Best for:** Visual learners, understanding component interactions

---

### 4. **FOUNDER_FLOW_QUICK_REF.txt**
**What it is:** Quick reference guide for developers building the feature.

**Key sections:**
- End-to-End Flow (ASCII diagram)
- Critical Constraint: Plans Are Self-Modifying
- Where Proposed Flow Naturally Fits (✅/⚠️/🔴)
- Most Critical Files to Modify (layer-by-layer)
- Proposed Data Flow (DETAILED Phase 1-5)
- File Layout Comparison (Current vs. Proposed)
- Integration Priorities (Phase A-D, 4-5 weeks total)
- Risk Summary
- What Happens if You Don't Implement Drafts
- Bottom Line

**Time to read:** 8 minutes
**Best for:** Quick lookup during development

---

## 🎯 What We Found

### Current System
```
Interview (AI) → Plan Generation (1-pass) → Save → Accept → Execute
```

**Key insight:** Plans are instantly saved, no iteration phase. Taskmaster modifies plan files in-place during execution.

### Proposed Flow
```
Interview → Draft Spec → Edit → Finalize → Execute
```

**Key requirement:** Support iterative spec refinement before execution begins.

---

## ✅ Natural Fits (Reusable)

1. ✅ Analyst consultation (already in plan-generation.ts)
2. ✅ Gap classification (CRITICAL/MINOR/AMBIGUOUS)
3. ✅ Self-review checklist
4. ✅ Markdown plan format (extensible)
5. ✅ Plan update handlers (IPC already supports)
6. ✅ Thesis state infrastructure

---

## 🔴 Main Challenge

**Plan File Mutability:**
- Taskmaster READS plan file (spec)
- Taskmaster WRITES plan file (marks tasks done)
- If user edits while executing → Corruption

**Solution:** Separate checkpoint file (`.execution`)
- Spec file: `.anyon/plans/plan-{name}.md` (read-only during execution)
- Checkpoint file: `.anyon/plans/plan-{name}.execution` (write-only by Taskmaster)

---

## 🛠️ Implementation Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| A | 1-2 weeks | Draft infrastructure (DraftPlanSchema, handlers) |
| B | 2-3 weeks | Strategist integration (/edit-spec, /finalize-spec) |
| C | 1-2 weeks | Execution safety (checkpoint file, plan locking) |
| D | 1 week | Validation & E2E tests |
| **TOTAL** | **4-5 weeks** | |

---

## 📚 Most Important Files to Understand

### Tier 1: Must Understand First
- `src/ipc/types/plan.ts` — IPC contracts
- `src/ipc/handlers/plan_handlers.ts` — Plan persistence
- `engine/src/agents/strategist/plan-generation.ts` — Plan generation
- `engine/src/hooks/start-work/start-work-hook.ts` — Execution trigger
- `engine/src/features/thesis-state/storage.ts` — Session state

### Tier 2: Important but Secondary
- `engine/src/agents/strategist/plan-template.ts` — Plan structure
- `src/atoms/planAtoms.ts` — React state
- `engine/src/agents/taskmaster/agent.ts` — Execution orchestration

### Files to Add (New)
- `engine/src/features/plan-execution/checkpoint.ts` — Checkpoint file management
- React hook: `useDraftPlan()` in `src/hooks/`

---

## 🎓 How to Use These Documents

**If you have 5 minutes:**
→ Read MAPPING_SUMMARY.md "Bottom Line" section

**If you have 15 minutes:**
→ Read MAPPING_SUMMARY.md completely
→ Skim QUICK_REF.txt

**If you have 30 minutes:**
→ Read MAPPING_SUMMARY.md
→ Read ARCHITECTURE_DIAGRAM.txt
→ Check QUICK_REF.txt for file locations

**If you're implementing:**
→ Start with MAPPING_SUMMARY.md for context
→ Use FOUNDER_FLOW_ANALYSIS.md for detailed spec
→ Reference QUICK_REF.txt during coding
→ Consult ARCHITECTURE_DIAGRAM.txt for interactions

**If you're reviewing:**
→ Read MAPPING_SUMMARY.md
→ Cross-reference specific files in FOUNDER_FLOW_ANALYSIS.md
→ Use ARCHITECTURE_DIAGRAM.txt to verify component interactions

---

## 💡 Key Insights

### 1. No Draft Infrastructure Currently Exists
The system saves plans immediately upon generation. There is no iterative refinement phase.

### 2. Analyst Consultation Already Exists
The gap classification and self-review logic is already implemented. Can be leveraged for draft finalization.

### 3. Plan Mutability is the Main Constraint
Taskmaster needs to modify files during execution, but users need to edit specs before execution. Solution: separate checkpoint files.

### 4. Architecture is Extensible
- YAML frontmatter already supports metadata
- IPC layer is flexible (can add new handlers)
- Thesis state already tracks sessions
- No fundamental conflicts

### 5. Feasible in 4-5 Weeks
With proper planning, draft support can be added without major refactoring:
- Phase A (1-2w): Schema + handlers
- Phase B (2-3w): Strategist integration + UI
- Phase C (1-2w): Execution safeguards
- Phase D (1w): Testing + polish

---

## 🔗 Repository Structure

```
ANYON-B2C/
├── src/                     ← Desktop App (Electron + React)
│   ├── ipc/                ← IPC contracts & handlers
│   │   ├── types/plan.ts   ← Plan IPC contracts
│   │   └── handlers/plan_handlers.ts ← Plan persistence
│   ├── hooks/              ← React hooks
│   ├── atoms/              ← Jotai atoms (state)
│   └── ...
│
├── engine/                  ← oh-my-opencode Plugin
│   └── src/
│       ├── agents/         ← AI agents
│       │   └── strategist/ ← Plan generation
│       ├── features/       ← Modules
│       │   ├── thesis-state/ ← Session management
│       │   └── builtin-commands/ ← /start-work command
│       ├── hooks/          ← Lifecycle hooks
│       │   └── start-work/ ← /start-work handler
│       └── ...
│
├── .anyon/                 ← Project metadata
│   ├── plans/              ← Plans (frozen)
│   ├── plans.draft/        ← [NEW] Draft specs
│   ├── thesis.json         ← Active session state
│   └── evidence/           ← Execution artifacts
│
└── Documentation/
    ├── MAPPING_SUMMARY.md          ← Executive summary ⭐
    ├── FOUNDER_FLOW_ANALYSIS.md    ← Detailed technical
    ├── ARCHITECTURE_DIAGRAM.txt    ← Visual diagrams
    └── FOUNDER_FLOW_QUICK_REF.txt  ← Developer reference
```

---

## ❓ FAQ

**Q: Can the current system be modified without breaking existing plans?**
A: Yes. Draft support is additive. Existing plans continue to work via the current `.anyon/plans/` directory.

**Q: How long will execution take?**
A: 4-5 weeks for full implementation (phases A-D). Phase A+B (core feature) = 3-4 weeks.

**Q: What's the biggest risk?**
A: Plan file corruption if user edits while Taskmaster is executing. Mitigated by checkpoint file approach.

**Q: Do we need to change the IPC layer significantly?**
A: No. Add 4 new handlers (getDraft, createDraft, updateDraft, finalizeDraft), extend existing schemas.

**Q: Can multiple users work on the same draft?**
A: Current design: single draft per thesis.json. Can be extended to multiple drafts with session-aware locking.

---

## 🚀 Next Steps

1. **Review** MAPPING_SUMMARY.md for alignment on approach
2. **Plan** Phase A (1-2 weeks): Draft infrastructure
   - Add DraftPlanSchema to `src/ipc/types/plan.ts`
   - Implement handlers in `src/ipc/handlers/plan_handlers.ts`
   - Create `.anyon/plans.draft/` directory logic
3. **Design** Phase B (2-3 weeks): Strategist integration
   - Modify NEWTON_PLAN_GENERATION to save drafts
   - Add /finalize-spec command
   - Build spec editor UI
4. **Implement** Phase C (1-2 weeks): Execution safety
   - Add checkpoint file mechanism
   - Add plan locking during execution
5. **Test** Phase D (1 week): E2E validation

---

## 📞 Questions?

Refer to the specific documents above for:
- **Architecture questions** → ARCHITECTURE_DIAGRAM.txt
- **Implementation details** → FOUNDER_FLOW_ANALYSIS.md
- **Quick lookups** → FOUNDER_FLOW_QUICK_REF.txt
- **Executive decision-making** → MAPPING_SUMMARY.md

---

**Analysis completed:** 2026-03-08
**Documents generated:** 4 (77 KB total)
**Coverage:** End-to-end current flow, proposed flow, integration points, risks, timeline
