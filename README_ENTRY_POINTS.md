# ANYON-b2c: Entry Points & Architecture Analysis - README

**Created:** 2025-03-10  
**Purpose:** Comprehensive architectural analysis to guide hierarchical AGENTS.md file creation

---

## 📋 What's Included

This analysis consists of **3 documents** (57 KB total):

### 1. **ENTRY_POINTS_ANALYSIS.md** (30 KB) - COMPREHENSIVE
**Best for:** Deep understanding of the entire architecture

**Contains:**
- ✅ All 3 primary entry points identified (main.ts, renderer.tsx, engine/index.ts)
- ✅ IPC architecture breakdown (30 contract domains, 52 handlers)
- ✅ Module structure (pro, opencode, agent, routes, components)
- ✅ React/TanStack Query integration pattern
- ✅ Database (Drizzle ORM, SQLite)
- ✅ Testing strategy (40 unit tests, 110+ E2E tests)
- ✅ Build process (Electron Forge, Vite x4 targets)
- ✅ Worker/thread layer, admin integrations
- ✅ Templates & scaffolds
- ✅ Module conventions & patterns
- ✅ **Hierarchical AGENTS.md placement tree** (XII)
- ✅ Critical architectural seams (5 major boundaries)
- ✅ File structure insights for agent placement
- ✅ 16 detailed sections with diagrams and code examples

**Read this if:** You need complete architectural understanding

---

### 2. **ENTRY_POINTS_SUMMARY.txt** (13 KB) - QUICK REFERENCE
**Best for:** Quick lookup, executive summary, decision making

**Contains:**
- ✅ Primary entry points (3) - one-line summaries
- ✅ IPC architecture (30 domains) - quick list
- ✅ Module structure (ASCII diagram showing main/renderer separation)
- ✅ Contract-driven IPC workflow (5-step pattern)
- ✅ React Query integration pattern
- ✅ Testing strategy (3-level pyramid)
- ✅ Build targets & Vite configuration
- ✅ Hierarchical AGENTS.md placement (5 tiers)
- ✅ Critical architectural seams (5 boundaries)
- ✅ High-value quick reference (where to look for X)
- ✅ Key files by purpose (16-file lookup table)

**Read this if:** You need quick answers or planning decisions

---

### 3. **HIERARCHICAL_AGENTS_PLACEMENT.md** (14 KB) - ACTION PLAN
**Best for:** Deciding WHERE to create AGENTS.md files and WHAT to put in them

**Contains:**
- ✅ Tier 1: Root + Critical Boundaries (6 files to create FIRST)
  - `ANYON-b2c/AGENTS.md` - root overview
  - `src/AGENTS.md` - renderer layer
  - `src/main/AGENTS.md` - main process
  - `src/ipc/AGENTS.md` - IPC overview
  - `src/ipc/types/AGENTS.md` - contract definitions
  - `src/ipc/handlers/AGENTS.md` - handler implementation

- ✅ Tier 2: Feature Modules (5 files to create second)
  - `src/routes/AGENTS.md` - routing
  - `src/components/AGENTS.md` - components
  - `src/pro/AGENTS.md` - pro module
  - `src/lib/AGENTS.md` - utilities
  - `e2e-tests/AGENTS.md` - E2E testing

- ✅ Tier 3-5: Specialized/Low-frequency modules (as needed)
  - When to create, suggested content, minimal files

- ✅ Implementation plan (phases, time estimates)
- ✅ Content length guidelines (per-file recommendations)
- ✅ Validation checklist
- ✅ Writing style guidelines
- ✅ Maintenance strategy

**Read this if:** You're IMPLEMENTING the hierarchical AGENTS.md structure

---

## 🎯 How to Use These Documents

### Scenario 1: "I need to understand the architecture"
1. Read: **ENTRY_POINTS_SUMMARY.txt** (15 min)
2. Deep dive: **ENTRY_POINTS_ANALYSIS.md** sections I-V (30 min)
3. Reference: Return to ENTRY_POINTS_ANALYSIS.md for specifics

### Scenario 2: "I need to decide WHERE to put AGENTS.md files"
1. Read: **HIERARCHICAL_AGENTS_PLACEMENT.md** entirely (20 min)
2. Reference: **ENTRY_POINTS_SUMMARY.txt** tier structure
3. Use: Checklist at end of placement guide

### Scenario 3: "I'm implementing new feature X"
1. Identify: Which module X touches (use quick reference table)
2. Read: Relevant AGENTS.md file from HIERARCHICAL_AGENTS_PLACEMENT.md
3. Consult: ENTRY_POINTS_ANALYSIS.md for pattern details

### Scenario 4: "I need to modify IPC/main process/components"
1. Read: **ENTRY_POINTS_ANALYSIS.md** section II (IPC)
2. Or read: Section III (Feature modules)
3. Or read: Section IV (Renderer)
4. Use: Code examples and patterns shown

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Contract domains identified | 30 |
| IPC handler files analyzed | 52 |
| Component files cataloged | 84 |
| E2E test files | 110+ |
| Unit test files | 40 |
| Primary entry points | 3 |
| Critical architectural seams | 5 |
| Recommended AGENTS.md files | 7-11 (Tiers 1-3) |
| Total analysis content | ~57 KB |

---

## 🏗️ Architecture Overview (Visual)

```
ANYON-b2c (Electron App with OpenCode Plugin)
├── MAIN PROCESS (src/main.ts - 707 lines)
│   ├── IPC Layer (src/ipc/)
│   │   ├── Types (30 contract domains)
│   │   ├── Handlers (52 handler files)
│   │   ├── Utils (55+ utility files)
│   │   └── Contracts (core.ts)
│   ├── Database (src/db/ + drizzle/)
│   ├── Services (auth, entitlement, settings)
│   └── System integrations (Supabase, Vercel)
│
├── RENDERER PROCESS (src/renderer.tsx)
│   ├── Routing (TanStack Router, 11 routes)
│   ├── Components (84 components, design system)
│   ├── State (Jotai atoms, React Context)
│   ├── Data Fetching (TanStack Query, 30 domain clients)
│   ├── Utilities (hooks, lib, utils)
│   └── Styling (Tailwind + Geist)
│
├── PRO MODULE (src/pro/ - isolated)
│   ├── Main (IPC handlers, utils)
│   ├── UI (React components)
│   └── Shared (types, schemas)
│
├── PLUGIN CONTEXT (engine/src/ - separate)
│   ├── Agents (Euler, Tesla, Newton, Socrates)
│   ├── Hooks (50+ OpenCode hooks)
│   ├── Config (plugin setup)
│   └── MCP (Model Context Protocol)
│
├── TESTING
│   ├── Unit (src/__tests__/ - 40 files)
│   └── E2E (e2e-tests/ - 110+ Playwright tests)
│
└── BUILD
    ├── Vite (4 targets: main, preload, renderer, worker)
    └── Electron Forge (packaging)
```

---

## 🔑 Key Insights

### 1. Contract-Driven IPC is Architectural Core
- 30 domains, each with contract + handler + client
- Pattern is **rigid** and **consistent**
- Critical for agents to understand this 5-step workflow

### 2. Module Boundaries are Clear
- **Main process** (src/main.ts) vs **Renderer** (src/renderer.tsx)
- **Pro module** (src/pro/) is isolated
- **Engine/plugin** (engine/) is separate from app
- Each boundary deserves its own AGENTS.md

### 3. IPC Errors Must Be Understood
- Handlers **THROW** errors, not return them
- TanStack Query catches in `onError` callback
- This pattern is critical for agent implementation

### 4. TanStack Query is the Data Layer
- All reads go through `useQuery(queryKey, queryFn)`
- Query keys centralized in `src/lib/queryKeys.ts`
- Mutations via `useMutation(mutationFn, { onSuccess })`
- Pattern is **rigid** across 84 components

### 5. Testing Requires Build
- E2E tests need `npm run build` before running
- Agents often forget this—explicit AGENTS.md helps
- 110+ tests means patterns are important

---

## 🚀 Next Steps

### Immediate (Today)
- [ ] Read ENTRY_POINTS_SUMMARY.txt (quick context)
- [ ] Decide: Are you implementing or just understanding?
- [ ] If implementing: Start with HIERARCHICAL_AGENTS_PLACEMENT.md

### Short-term (This Week)
- [ ] Implement Tier 1 AGENTS.md files (6 files)
  - Root + src/AGENTS.md + src/main/AGENTS.md + src/ipc/* (3 files)
  - Estimated time: 4-6 hours
  - Impact: 80% of use cases covered

### Medium-term (Next Week)
- [ ] Implement Tier 2 AGENTS.md files (5 files)
  - src/routes/, src/components/, src/pro/, src/lib/, e2e-tests/
  - Estimated time: 3-4 hours
  - Impact: 95% of use cases covered

### Ongoing
- [ ] Maintain AGENTS.md files as architecture evolves
- [ ] Review quarterly for outdated patterns
- [ ] Update when new modules/patterns emerge

---

## 📚 File References

**Key source files mentioned:**
- `src/main.ts` - Electron entry point (707 lines)
- `src/renderer.tsx` - React entry point
- `src/router.ts` - TanStack Router config (46 lines, 11 routes)
- `src/ipc/ipc_host.ts` - IPC registration point
- `src/ipc/types/index.ts` - Unified IPC client export
- `src/lib/queryKeys.ts` - TanStack Query key factory
- `src/preload.ts` - Security allowlist
- `forge.config.ts` - Electron build config
- `vitest.config.ts` - Unit test config (happy-dom)
- `playwright.config.ts` - E2E test config
- `engine/src/index.ts` - OpenCode plugin entry

---

## ❓ FAQ

**Q: Do I need to read all 3 documents?**  
A: No. Use the scenario guide above. Most people start with SUMMARY.txt, then read the placement guide.

**Q: Which file has code examples?**  
A: ENTRY_POINTS_ANALYSIS.md (section II-XI have full examples)

**Q: How do I know if I understand the architecture?**  
A: Take the ENTRY_POINTS_SUMMARY.txt and write out:
- 5-step IPC contract workflow (from memory)
- TanStack Query integration pattern
- 3 primary entry points
- 5 critical architectural seams

**Q: Can I skip the engine/ module?**  
A: Yes, unless you're working on the OpenCode plugin. It's separate from the main app.

**Q: Why 7-11 AGENTS.md files instead of 1 root?**  
A: Token efficiency. Agents only load relevant AGENTS.md file → smaller context → faster inference.

**Q: When should I update AGENTS.md files?**  
A: When architecture changes or new patterns emerge. Not every commit.

---

## 📞 Document Version

- **Created:** 2025-03-10
- **Analysis depth:** Comprehensive (30K+ main analysis)
- **Repository:** ANYON-b2c (Electron app with OpenCode plugin)
- **Model:** Claude Haiku 4.5 (exploration/mapping role)

---

**Next file to read based on your goal:**
- 🎯 **Need quick overview?** → ENTRY_POINTS_SUMMARY.txt
- 🏗️ **Need full architecture?** → ENTRY_POINTS_ANALYSIS.md
- 📝 **Ready to implement?** → HIERARCHICAL_AGENTS_PLACEMENT.md

