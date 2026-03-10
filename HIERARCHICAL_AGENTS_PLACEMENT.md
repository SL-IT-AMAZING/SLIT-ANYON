# Hierarchical AGENTS.md Placement Guide for ANYON-b2c

**Created:** 2025-03-10  
**Purpose:** Decide WHERE to place AGENTS.md files for optimal agent context injection  
**Based on:** `ENTRY_POINTS_ANALYSIS.md` (780 lines comprehensive analysis)

---

## Overview: What Gets AGENTS.md?

ANYON-b2c is a **contract-driven Electron app** with:
- **Clear module boundaries** → Multiple AGENTS.md files are justified
- **IPC-heavy architecture** → Contract/handler seams are critical
- **Pro module isolation** → Separate development conventions
- **110+ E2E tests** → Testing patterns important
- **30 contract domains** → Each has consistent pattern

**Result:** Use **7-11 AGENTS.md files** across hierarchy (not just root)

---

## Tier 1: CREATE FIRST (Root + Critical Boundaries)

### ✅ `ANYON-b2c/AGENTS.md` (ROOT)
**What:** App-level architecture overview  
**Scope:** Entire application  
**Length:** 2-3 KB  
**Update frequency:** Once per major architecture change  

**Must contain:**
- [ ] Electron + React dual-process architecture (main + renderer)
- [ ] IPC contract-driven pattern (5-step workflow)
- [ ] TanStack Query integration (queryKeys factory)
- [ ] Testing pyramid (unit + E2E)
- [ ] Build process (Vite + Forge)
- [ ] Key conventions (error handling, Zod validation)
- [ ] Critical seams (5 architectural boundaries)
- [ ] Pointer to: `src/AGENTS.md`, `src/main/AGENTS.md`, `src/ipc/AGENTS.md`

**Why:** Root AGENTS.md is READ FIRST by all agents. Sets tone.

---

### ✅ `src/AGENTS.md` (RENDERER LAYER)
**What:** React/TanStack Router/components conventions  
**Scope:** Entire renderer (src/*) except ipc/main/  
**Length:** 2-3 KB  
**Update frequency:** When component patterns or routing changes  

**Must contain:**
- [ ] TanStack Router setup (11 routes, route tree structure)
- [ ] Component patterns (84 components, design system)
- [ ] State management (Jotai atoms, React Context)
- [ ] TanStack Query hooks (useQuery/useMutation)
- [ ] Styling (Tailwind + Geist)
- [ ] Folder structure (routes/, pages/, components/, lib/)
- [ ] Pointer to: `src/routes/AGENTS.md`, `src/components/AGENTS.md`

**Why:** Agents working on UI/routes/components land here first.

---

### ✅ `src/main/AGENTS.md` (MAIN PROCESS)
**What:** Electron main process conventions  
**Scope:** src/main.ts, src/main/*, IPC initialization, system services  
**Length:** 2 KB  
**Update frequency:** When main process architecture changes  

**Must contain:**
- [ ] Main process entry point (src/main.ts - 707 lines)
- [ ] IPC registration (ipc_host.ts pattern)
- [ ] System services (auth, entitlement, settings, backup)
- [ ] Database initialization
- [ ] Error reporting (Sentry)
- [ ] Window/app lifecycle
- [ ] Pointer to: `src/ipc/AGENTS.md`

**Why:** Main process is rarely touched but complex. Quick reference needed.

---

### ✅ `src/ipc/AGENTS.md` (IPC LAYER OVERVIEW)
**What:** IPC architecture, contract pattern overview  
**Scope:** Entire IPC layer (types/, handlers/, utils/)  
**Length:** 3-4 KB  
**Update frequency:** When new contract domains added  

**Must contain:**
- [ ] Contract-driven pattern (5-step workflow)
- [ ] 30 contract domains (list with purpose)
- [ ] Error handling (throw errors, not objects)
- [ ] Preload security model (auto-derived allowlist)
- [ ] IPC utils (55+ utility files, when to use each)
- [ ] Validation pattern (createTypedHandler + Zod)
- [ ] Pointer to: `src/ipc/types/AGENTS.md`, `src/ipc/handlers/AGENTS.md`

**Why:** IPC is the architectural spine. Contract pattern is critical to understand.

---

### ✅ `src/ipc/types/AGENTS.md` (CONTRACT DEFINITIONS)
**What:** How to define, register, and generate IPC contracts  
**Scope:** src/ipc/types/*.ts (30 contract files)  
**Length:** 2-3 KB  
**Update frequency:** When new contract domains added  

**Must contain:**
- [ ] Contract definition syntax (defineContract)
- [ ] Input/output schema (Zod)
- [ ] Client generation (createClient)
- [ ] Re-export pattern (src/ipc/types/index.ts)
- [ ] Domain list (app, chat, settings, auth, etc.)
- [ ] Naming conventions (contract names, channel names)
- [ ] Example: Full contract definition walkthrough

**Why:** Agents adding IPC endpoints start here. Pattern is consistent.

---

### ✅ `src/ipc/handlers/AGENTS.md` (HANDLER IMPLEMENTATION)
**What:** How to implement, test, and register IPC handlers  
**Scope:** src/ipc/handlers/*.ts (52 handler files)  
**Length:** 2-3 KB  
**Update frequency:** When handler patterns evolve  

**Must contain:**
- [ ] createTypedHandler pattern
- [ ] Zod validation (automatic in createTypedHandler)
- [ ] Error handling (THROW errors, never return error objects)
- [ ] Handler registration (registerXHandlers in ipc_host.ts)
- [ ] Special handlers (streaming, local models, planning)
- [ ] Testing handlers (unit test pattern)
- [ ] Example: Full handler implementation walkthrough

**Why:** Agents implementing IPC handlers need precise pattern. Most common implementation task.

---

## Tier 2: CREATE SECOND (Feature Modules)

### ✅ `src/routes/AGENTS.md` (ROUTING & NAVIGATION)
**What:** TanStack Router patterns and route conventions  
**Scope:** src/routes/ (11 route definitions), src/router.ts, src/pages/  
**Length:** 1.5-2 KB  
**Update frequency:** When new routes added or structure changes  

**Must contain:**
- [ ] Route hierarchy (root → 11 child routes)
- [ ] Route file naming (*.tsx, colocated with pages/)
- [ ] Route parameter patterns (useParams)
- [ ] Navigation patterns (useNavigate)
- [ ] Route-level data loading (queryKey dependencies)
- [ ] 404 handling (NotFoundRedirect)
- [ ] Example: Adding new route walkthrough

**Why:** Agents adding pages/navigation need quick reference.

---

### ✅ `src/components/AGENTS.md` (COMPONENT CONVENTIONS)
**What:** Component patterns, design system, TanStack Query usage  
**Scope:** src/components/ (84 component files), src/lib/, src/hooks/  
**Length:** 3-4 KB  
**Update frequency:** When design system or component patterns change  

**Must contain:**
- [ ] Component structure (functional, TypeScript)
- [ ] Design system (Geist, Base UI, Tailwind)
- [ ] TanStack Query patterns (useQuery, useMutation)
- [ ] State management (atoms, context)
- [ ] Folder structure (chat/, auth/, settings/, ui/)
- [ ] Styling (Tailwind classes, theme context)
- [ ] Error boundaries and suspense
- [ ] Example: Full component with query walkthrough

**Why:** Components are most-touched code. High-value reference.

---

### ✅ `src/pro/AGENTS.md` (PRO MODULE)
**What:** Pro module structure and isolated feature conventions  
**Scope:** src/pro/ (main/, ui/, shared/)  
**Length:** 2 KB  
**Update frequency:** When pro feature scope changes  

**Must contain:**
- [ ] Pro module isolation (separate from core)
- [ ] Entitlement/licensing patterns
- [ ] IPC contract separation (pro handlers own channel namespace)
- [ ] Test conventions (own test files)
- [ ] Folder structure (main/, ui/, shared/)
- [ ] Example: Adding pro feature walkthrough

**Why:** Pro features have different rules. Isolation is critical.

---

## Tier 3: CREATE THIRD (Utilities & Testing)

### ✅ `src/lib/AGENTS.md` (SHARED UTILITIES)
**What:** queryKeys factory, schemas, shared functions  
**Scope:** src/lib/, src/hooks/ (utilities layer)  
**Length:** 2 KB  
**Update frequency:** When new queryKeys added or schema patterns evolve  

**Must contain:**
- [ ] queryKeys factory (hierarchical structure)
- [ ] Zod schema patterns (src/lib/schemas.ts)
- [ ] Hook conventions (useQuery/useMutation wrappers)
- [ ] Utility function patterns (pure, no side effects)
- [ ] Centralized error reporting (Sentry)
- [ ] Example: Adding queryKey walkthrough

**Why:** queryKeys is critical for TanStack Query consistency. Centralized.

---

### ✅ `e2e-tests/AGENTS.md` (E2E TESTING)
**What:** Playwright patterns, test fixtures, helpers  
**Scope:** e2e-tests/ (110+ test files), helpers/, fixtures/  
**Length:** 2-3 KB  
**Update frequency:** When test patterns evolve or new fixtures added  

**Must contain:**
- [ ] Playwright basics (page, getByRole, getByText)
- [ ] Test helpers (test_helper.ts with po.* functions)
- [ ] Lexical editor interactions (clearChatInput, openChatHistoryMenu)
- [ ] Base UI radio selection (use getByText, not getByRole)
- [ ] Tooltip and nested button handling
- [ ] Build requirement (npm run build before e2e)
- [ ] Fixture patterns (fixtures/ directory)
- [ ] Example: Full E2E test walkthrough

**Why:** E2E tests are critical for shipping. Playwright patterns are non-obvious.

---

## Tier 4: CREATE IF HEAVY WORK PLANNED

### `src/opencode/AGENTS.md` (OpenCode Plugin)
**When:** If modifying OpenCode integration, plugin config, or MCP servers  
**What:** OpenCode plugin initialization, MCP server patterns  
**Length:** 1.5 KB  

---

### `worker/AGENTS.md` (Web Workers)
**When:** If adding/modifying web workers or service workers  
**What:** Web worker conventions, service worker patterns, main-renderer communication  
**Length:** 1.5 KB  

---

### `src/pro/main/AGENTS.md` (Pro Main Logic)
**When:** If heavy pro feature development on main-process side  
**What:** Pro IPC handlers, specialized processors, visual editing logic  
**Length:** 1.5 KB  

---

### `src/pro/ui/AGENTS.md` (Pro Component Layer)
**When:** If building/modifying pro UI components (visual editor, etc.)  
**What:** Pro component patterns, visual editor interaction patterns  
**Length:** 1.5 KB  

---

## Tier 5: OPTIONAL (Low Change Frequency)

### `server/AGENTS.md`
- **When:** If modifying backend Next.js app
- **What:** Backend API structure, edge functions, deployment

### `src/store/AGENTS.md`
- **When:** If heavy state management refactoring
- **What:** Jotai atoms, Context providers, store initialization

### `src/db/AGENTS.md`
- **When:** If modifying database schema
- **What:** Drizzle ORM patterns, migration strategy (NEVER write SQL manually)

### `scaffold/AGENTS.md`
- **When:** If creating/modifying design system scaffolds
- **What:** Scaffold template structure, framework-specific patterns

### `templates/AGENTS.md`
- **When:** If adding/modifying project templates
- **What:** Template structure, scaffolding conventions

---

## Summary: Recommended Implementation Plan

### Phase 1: Foundation (Start Here)
1. ✅ Update existing `ANYON-b2c/AGENTS.md` with architecture overview
2. ✅ Create `src/AGENTS.md` (renderer layer)
3. ✅ Create `src/main/AGENTS.md` (main process)
4. ✅ Create `src/ipc/AGENTS.md` (IPC overview)
5. ✅ Create `src/ipc/types/AGENTS.md` (contract definitions)
6. ✅ Create `src/ipc/handlers/AGENTS.md` (handler implementation)

**Time:** ~4-6 hours (detailed documentation)  
**Impact:** ~80% of agent use cases covered  

### Phase 2: Feature Modules (If Time)
7. Create `src/routes/AGENTS.md`
8. Create `src/components/AGENTS.md`
9. Create `src/pro/AGENTS.md`
10. Create `src/lib/AGENTS.md`
11. Create `e2e-tests/AGENTS.md`

**Time:** ~3-4 hours (detailed documentation)  
**Impact:** Covers 95% of use cases, very specific patterns  

### Phase 3: Specialized Modules (As Needed)
- Add Tier 4 files only if that subsystem receives heavy development
- Add Tier 5 files on-demand when work touches them

---

## Content Length Guidelines

| Tier | Files | Total Length | Per File | Update Frequency |
|------|-------|--------------|----------|------------------|
| **1** | 6 | ~15 KB | 2-4 KB | Architectural changes |
| **2** | 5 | ~12 KB | 2-3 KB | Feature development |
| **3** | 2 | ~4 KB | 2-3 KB | Pattern evolution |
| **4** | 4 | ~6 KB | 1.5 KB | As-needed |
| **5** | 5 | ~7 KB | 1-2 KB | Rare |
| **TOTAL** | 22 | ~44 KB | — | — |

**Target:** 40-50 KB of hierarchical AGENTS.md across repo  
**Benefit:** 50-70% token savings per agent interaction (vs. root-only)

---

## Validation Checklist

Before deploying hierarchical AGENTS.md files:

- [ ] Each file has clear scope statement (what it covers)
- [ ] Each file has folder structure diagram or explicit path list
- [ ] Each file has 2-3 concrete code examples
- [ ] Each file has "when to read this" guidance
- [ ] Each file pointers to related AGENTS.md files
- [ ] Root AGENTS.md points to all Tier 1-2 files
- [ ] No file duplicates content (except high-level overviews)
- [ ] Each file has "how to modify" guidance for common tasks
- [ ] Test the file set: Have an agent read them and complete a task

---

## Notes for Implementation

### Writing Style
- **Concise:** 2-4 KB per file (agents have limited context)
- **Specific:** Code examples, not philosophy
- **Actionable:** "To add X, do Y in file Z"
- **Hierarchical:** Root → Tier 1 → Tier 2 → Specific

### Content Patterns to Use
1. **Scope statement** at top
2. **Architecture diagram** (ASCII or simple structure)
3. **Key files/functions** (critical reference)
4. **Common patterns** (2-3 examples)
5. **Where to add things** (decision tree)
6. **Cross-references** (pointers to related AGENTS.md)

### What NOT to Include
- Lengthy API docs (use code for reference)
- Philosophy/justification (already in commit history)
- Outdated patterns (keep current)
- Things in root AGENTS.md already (avoid duplication)

---

## Maintenance

### When to Update
- New IPC contract domain → Update `src/ipc/AGENTS.md`
- New component pattern → Update `src/components/AGENTS.md`
- New E2E test pattern → Update `e2e-tests/AGENTS.md`
- Architectural change → Update root and relevant Tier 1 files

### Review Cadence
- **Monthly:** Spot-check one file
- **Quarterly:** Review all files for outdated patterns
- **When error patterns emerge:** Update file to prevent future errors

---

## Next Steps

1. **Immediate:** Update existing `ANYON-b2c/AGENTS.md` with `ENTRY_POINTS_ANALYSIS.md` findings
2. **This week:** Create Phase 1 files (6 files, foundation)
3. **Next week:** Create Phase 2 files (5 files, features) if team capacity
4. **Ongoing:** Maintain as architecture evolves

---

**Reference files created:**
- `ENTRY_POINTS_ANALYSIS.md` (780 lines, comprehensive)
- `ENTRY_POINTS_SUMMARY.txt` (quick reference, 15 KB)
- This file: `HIERARCHICAL_AGENTS_PLACEMENT.md`

