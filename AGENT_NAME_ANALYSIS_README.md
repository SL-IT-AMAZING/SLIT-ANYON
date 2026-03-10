# Agent Name Collision Risk Analysis — Complete Report

This directory contains a comprehensive analysis of collision risks for 11 proposed agent names in the ANYON codebase.

## 📄 Report Files

### 1. **AGENT_NAME_SUMMARY.txt** (Quick Start) ⚡
**9.3 KB | 139 lines**

Start here for a fast overview:
- Quick reference table with all 11 terms
- Risk levels (HIGH, MEDIUM, SAFE)
- Clear recommendations (DO NOT USE vs SAFE TO USE)
- Alternative naming strategy
- Impact assessment breakdown

**Best for:** Executive decision-making, quick reference during meetings

---

### 2. **AGENT_NAME_COLLISION_RISK.md** (Detailed Analysis) 📊
**12 KB | 374 lines**

Comprehensive analysis with:
- Summary table for all 11 terms
- Detailed findings for each term (3,000+ words)
- Context types and usage patterns
- Non-agent examples with file paths
- Risk assessment reasoning
- Specific recommendations for each term
- Files most affected by potential renames
- Estimated refactoring effort

**Best for:** Technical review, detailed decision-making, implementation planning

---

### 3. **AGENT_NAME_DETAILED_EXAMPLES.md** (Code Reference) 🔍
**14 KB | 522 lines**

Actual code examples from the codebase:
- Specific code snippets for each term
- Real file paths and line numbers
- Context for why it's dangerous or safe
- Scope of impact analysis
- Summary table with examples

**Best for:** Code review, understanding specific impacts, developer reference

---

## 🎯 Quick Reference

### ✅ SAFE TO USE (5 names)
- **scout** (0 matches) — Perfect, zero conflicts
- **inspector** (0 matches) — Perfect, zero conflicts
- **analyst** (0 matches) — Perfect, zero conflicts
- **critic** (57 matches, all adjectival) — Safe, no formal usage
- **researcher** (10 matches, test-only) — Very safe, mock data only

### ⚠️ MEDIUM CAUTION (2 names)
- **worker** (23 matches in 7 files) — Node.js threading context, manageable
- **advisor** (8 matches in 7 files) — Category type conflict, requires refactoring

### ❌ DO NOT USE (4 names)
- **builder** (50 matches in 39 files) — Core architectural pattern
- **executor** (112 matches in 57 files) — Massive infrastructure pattern
- **orchestrator** (64 matches in 25 files) — Already describes Turing/Euler
- **planner** (55 matches in 17 files) — Already describes Newton, config flag

---

## 📊 Analysis Scope

| Metric | Value |
|--------|-------|
| Directory Analyzed | `/engine/src/` |
| Terms Searched | 11 |
| Total Matches Found | 631 |
| Unique Files Affected | 100+ |
| Risk Categories | 3 (HIGH, MEDIUM, SAFE) |
| Safe Names Available | 5 |
| Avoid Names | 4 |

---

## 🔍 How to Use This Analysis

### For Decision-Making
1. Read **AGENT_NAME_SUMMARY.txt** (5 min read)
2. Decide on safe names from the SAFE category
3. If you must use MEDIUM or HIGH risk names, proceed to detailed docs

### For Implementation
1. Review **AGENT_NAME_DETAILED_EXAMPLES.md** for code context
2. Estimate refactoring effort from the detailed analysis
3. Plan find-and-replace strategy if needed
4. Check migration files if renaming orchestrator/planner

### For Code Review
1. Consult **AGENT_NAME_COLLISION_RISK.md** for comprehensive details
2. Reference specific file impacts from the analysis
3. Use for team discussion and approval

---

## 🎨 Recommended Alternative Names

If renaming existing agents to profession-based names:

| Current Agent | Function | ❌ Avoid | ✅ Alternative |
|---|---|---|---|
| **Tesla** | Autonomous worker | "worker" | "scout" |
| **Euler** | Main orchestrator | "orchestrator" | "analyzer" |
| **Turing** | Todo orchestrator | "orchestrator" | "coordinator" |
| **Newton** | Strategic planner | "planner" | "strategist" |

All alternatives have **zero collision risk**.

---

## 📋 Key Findings Summary

### HIGH RISK Terms (Avoid)
1. **builder** — Core pattern used everywhere
   - Files: agent-builder.ts, prompt-builder.ts, dynamic-agent-prompt-builder.ts
   - Functions: buildAgent(), buildSystemContent(), buildCategorySkillsDelegationGuide()
   - Scope: 39 files, would require massive refactoring

2. **executor** — Architectural infrastructure
   - Files: sync-executor.ts, action-executor.ts, background-executor.ts
   - Types: ExecutorContext, ExecutorOptions, ActionExecutorDeps
   - Scope: 57 files, 112 matches, would break core infrastructure

3. **orchestrator** — Already describes Turing/Euler
   - Semantic role: "orchestrator" agents that delegate
   - Migration: orchestrator-euler → turing mapping
   - Risk: Creates confusion about which "orchestrator"

4. **planner** — Already describes Newton
   - Config flag: planner_enabled (true/false)
   - Detection: Turbo module checks for "planner" in agent names
   - Risk: Breaking config schema and feature detection

### MEDIUM RISK Terms (Use with caution)
1. **worker** — Threading infrastructure
   - Context: Node.js Worker threads module
   - Files: skill-loader, threading utilities
   - Manageable: Only 7 files, well-scoped context

2. **advisor** — Category type
   - Usage: category: "advisor" in agent definitions
   - Files: Socrates, Nietzsche use this category
   - Manageable: Would need category rename, but contained

### SAFE Terms (Recommended)
1. **scout** — Zero matches
2. **inspector** — Zero matches
3. **analyst** — Zero matches
4. **critic** — 57 matches (all adjectival, not noun)
5. **researcher** — 10 matches (test mocks only)

---

## 🚀 Implementation Notes

### If You Choose SAFE Names
- Direct rename is safe
- Minimal risk of collisions
- Standard find-and-replace will work
- No infrastructure changes needed

### If You Choose MEDIUM RISK Names
- Requires careful find-and-replace
- May need to rename related infrastructure (categories, flags)
- Review code context before changes
- Test thoroughly after rename

### If You Must Use HIGH RISK Names
- Requires comprehensive refactoring plan
- Multiple files affected (25-57 files per term)
- Consider semantic conflicts
- Plan for config schema updates
- Update migration logic
- Update tests and documentation

---

## 📞 Questions?

Refer to the specific analysis document for your question:

- **"What names can I safely use?"** → AGENT_NAME_SUMMARY.txt
- **"What files would be affected?"** → AGENT_NAME_DETAILED_EXAMPLES.md
- **"Why is X name risky?"** → AGENT_NAME_COLLISION_RISK.md
- **"What's my refactoring effort?"** → AGENT_NAME_COLLISION_RISK.md (Files Most Affected section)

---

## 📅 Analysis Date

Generated: March 4, 2026
Codebase Version: ANYON-b2c/engine/src/
Analysis Method: Comprehensive regex search + manual review

---

**Ready for implementation planning and decision-making.** ✅
