# AGENTS.md Coverage Analysis: Root App Side Domains
**Date:** March 10, 2026  
**Focus:** src/components, src/ipc, src/hooks, routes/pages, and settings/chat domains

---

## Executive Summary

The ANYON root app has **5 strong subdirectory candidates** for dedicated AGENTS.md files. Each represents a distinct domain with specialized concerns, substantial codebase, and integration patterns that deserve their own guidance.

---

## Candidate Domains (Ranked by Importance)

### 1. **`src/ipc/`** — IPC Contract-Driven Architecture [HIGHEST PRIORITY]
**Status:** CRITICAL — Deserves dedicated AGENTS.md  
**Size:** 146 files | ~12,829 LOC in handlers  
**Justification:** This is the **security boundary and data contract layer**.

**Key Subdirectories:**
- `ipc/types/` (31 files, ~4,591 LOC) — Contract definitions + auto-generated clients
- `ipc/handlers/` (54 files, ~12,829 LOC) — IPC handler implementations
- `ipc/contracts/` — Core contract definitions
- `ipc/preload/` — Security allowlist
- `ipc/services/` — Shared handler utilities

**Why Separate AGENTS.md:**
- **Contract-driven pattern:** Every IPC endpoint must be defined in contracts, not ad-hoc
- **Security-critical:** IPC boundary with strict allowlist validation
- **Specialized workflow:** Define contract → auto-generate client → register handler
- **Type safety:** Zod validation, TypeScript contracts, client auto-generation
- **Many cross-cutting handler files** (54 handler files with distinct domains: app, chat, auth, mcp, settings, etc.)
- **Shared patterns:** `createTypedHandler()`, error propagation, stream handling

**Critical Guidance Needed:**
- How to add a new IPC endpoint (contract-first flow)
- Handler registration and validation patterns
- Stream vs invoke vs event patterns
- Preload allowlist auto-derivation
- Error handling conventions (throw Error, not {success: false})

---

### 2. **`src/components/chat/` + `src/components/chat-v2/`** — Chat UI Domain
**Status:** CRITICAL — Deserves dedicated AGENTS.md  
**Size:** Chat: 45 files, 8,009 LOC | Chat-v2: 28 files, 4,909 LOC  
**Justification:** Large, complex, interconnected UI domain with streaming patterns.

**Key Components:**
- **Chat (legacy):** ChatInput, ChatMessage, ChatActivity, LexicalChatInput, MessagesList
- **Chat-v2 (new):** Composer, Thread, SessionTurn, ToolCall, TaskDelegationTool
- Both depend on: `useStreamChat` hook, Lexical editor, Monaco code editor

**Why Separate AGENTS.md:**
- **Streaming integration:** Both use `ipc.chatStream.*` for chunked message streaming
- **Two parallel implementations:** Chat (legacy) and Chat-v2 (new) coexist
- **Editor complexity:** Lexical (contenteditable) + Monaco (code blocks)
- **Playwright testing quirks:** Base UI Radio, Lexical clearing behavior documented in AGENTS.md
- **Heavy hook integration:** useStreamChat (4451 LOC), useChats, useCountTokens
- **Planning artifacts integration:** Chat-v2 has PlanningArtifactPanel integration
- **Tool/task handling:** TaskDelegationTool, BasicTool, ToolCall patterns
- **Message formatting:** Markdown parsing, code highlighting, attachment support

**Critical Guidance Needed:**
- Lexical editor patterns and testing (already in root AGENTS.md, but deserves expansion)
- When to use Chat vs Chat-v2
- Streaming message handling lifecycle
- Tool/task rendering patterns (v2 specialty)
- Playwright E2E test patterns (clear, type safely, history nav)
- Atom/state management for chat (selectedAppIdAtom integration)

---

### 3. **`src/hooks/`** — React Query + IPC Integration Hooks
**Status:** HIGH PRIORITY — Deserves dedicated AGENTS.md  
**Size:** 63 files | ~4,451 LOC  
**Justification:** Dense collection of domain-specific hooks implementing React Query + IPC patterns.

**Key Hook Categories:**
- **Data fetching:** useLoadApp, useLoadApps, useDesignSystems, useTemplates, useThemes
- **Mutations:** useCreateApp, useRunApp, useCommitChanges, useDirectDeploy
- **Streaming:** useStreamChat (4451 LOC), useCheckProblems
- **Settings/Config:** useSettings, useEntitlement, useFreeAgentQuota, useLanguageModelProviders
- **File operations:** useAttachments, useLoadAppFile, useContextPaths
- **Planning:** usePlan, usePlanImplementation, usePlanningArtifact (new), usePlanningArtifactImplementation
- **Search:** useSearchApps, useSearchChats, useCheckName

**Why Separate AGENTS.md:**
- **Consistent pattern:** All hooks follow useQuery + useMutation pattern
- **Query key factory:** All must use centralized `queryKeys` (363 LOC)
- **IPC integration:** Every hook bridges React Query ↔ IPC boundary
- **Invalidation patterns:** Complex query cache invalidation (parent/child hierarchy)
- **New planning artifact hooks:** usePlanningArtifact, usePlanningArtifactList, usePlanningArtifactImplementation (fresh patterns to codify)
- **Streaming edge cases:** useStreamChat has abort/cleanup/retry logic

**Critical Guidance Needed:**
- Hook template: useQuery + useMutation pattern
- How queryKeys factory works (hierarchical invalidation)
- When to use enabled/initialData/meta options
- Error handling in hooks (throw from handler → caught by Query)
- Streaming hook patterns (abort signals, cleanup)
- Testing hooks with useQuery mocks
- New: Planning artifact hook patterns

---

### 4. **`src/components/settings/`** — Settings UI + Configuration Domain
**Status:** MEDIUM-HIGH PRIORITY — Deserves dedicated AGENTS.md  
**Size:** 3 main files + 8 panels | ~748 LOC  
**Justification:** Growing settings domain with distinct panel architecture and provider/model complexity.

**Structure:**
```
settings/
├── SettingsDialog.tsx (main dialog)
├── ToolsMcpSettings.tsx (MCP tools config)
└── panels/
    ├── AIPanel.tsx (model selection)
    ├── GeneralPanel.tsx (app preferences)
    ├── BillingPanel.tsx (subscription info)
    ├── ExperimentsPanel.tsx (feature flags)
    ├── PricingPlansPanel.tsx (plan comparison)
    ├── IntegrationsPanel.tsx (external services)
    └── WorkflowPanel.tsx (workflow settings)
```

**Why Separate AGENTS.md:**
- **Panel architecture:** Each panel is a distinct feature area (AI, billing, workflow, experiments)
- **Provider/model complexity:** AIPanel manages language model provider selection + local models
- **Billing/entitlement integration:** PricingPlansPanel, BillingPanel use entitlement hooks
- **Growing domain:** Planning artifact settings, MCP tools settings expanding
- **Settings IPC contract:** Uses settings handlers + settingsSearchIndex
- **Different from generic UI:** Custom logic per panel, not just form fields

**Critical Guidance Needed:**
- How to add a new settings panel
- AIPanel: provider selection + model discovery patterns
- Settings IPC integration (useSettings hook)
- Settings search index (settingsSearchIndex.ts)
- Entitlement/subscription state handling
- Experiment flags and rollout patterns

---

### 5. **`src/routes/` + `src/pages/`** — Router & Page Structure
**Status:** MEDIUM PRIORITY — Deserves dedicated AGENTS.md  
**Size:** 11 route definitions | 10 page components (~1,000 LOC combined)  
**Justification:** TanStack Router (not React Router/Next) with specific patterns.

**Current Routes:**
```
/ (home)
├── home.tsx
├── chat.tsx
├── apps.tsx
├── app-detail.tsx
├── themes.tsx
├── hub.tsx
├── connect.tsx
├── settings.tsx
├── template-detail.tsx
└── (legacy) app-details.tsx
```

**Why Separate AGENTS.md:**
- **TanStack Router not React Router:** Uses route definitions + createRouter
- **Route patterns:** Search params (useSearch), nested layouts (rootRoute + children)
- **Layout composition:** Root layout with sidebar, header patterns
- **Page-level hooks:** Each page uses domain hooks (useLoadApp, useChats, etc.)
- **Auth routing:** Some pages gated behind auth (chat, settings)
- **Deep linking:** Connect route has custom URL handling (connectRoute)
- **Upcoming:** Planning artifacts page (new feature)

**Critical Guidance Needed:**
- TanStack Router basics for this project
- How to add a new route (route file + router.ts registration)
- Search params handling (useSearch)
- Page-level data loading patterns (useLoaderData)
- Auth guards / conditional routing
- Navigation patterns (useNavigate)

---

## Non-Candidates (Why NOT Separate)

### ❌ `src/components/ui/`
**Reason:** Primitive design system components (button, card, dialog, etc.)  
- Mostly generic, well-documented in Storybook
- No domain-specific patterns
- No integration complexity
- Covered by general React component best practices

### ❌ `src/components/auth/`
**Reason:** Small domain (likely Supabase auth wrapper)
- Likely <100 LOC
- Not frequently modified
- Auth patterns are standard OAuth/session handling

### ❌ `src/components/preview_panel/`
**Reason:** Single-purpose visual editing panel
- Specialized but not frequently edited
- Clear from context what it does

### ❌ `src/lib/`
**Reason:** Shared utilities, not a distinct domain
- queryKeys is central but not large enough for separate guide
- Other utils (toast, error, schemas) are straightforward
- Could reference from hooks AGENTS.md

### ❌ `src/atoms/`
**Reason:** Jotai atom definitions are self-documenting
- Simple state containers
- Clear naming convention

### ❌ `src/utils/`
**Reason:** Pure utility functions
- No complex patterns to teach

---

## Implementation Roadmap

### Phase 1: Immediate (This Sprint)
1. **`src/ipc/AGENTS.md`** — Contract-driven IPC architecture
   - Expand from root AGENTS.md IPC section
   - Add: contract definition template, handler registration pattern, client usage
   
2. **`src/components/chat/AGENTS.md`** — Chat UI domain
   - Include: streaming patterns, both Chat versions, testing quirks
   - Reference: Lexical + Monaco complexity

### Phase 2: Following Sprint
3. **`src/hooks/AGENTS.md`** — React Query + IPC hooks
   - Template for useQuery/useMutation
   - queryKeys factory deep dive
   - New planning artifact hooks patterns

4. **`src/components/settings/AGENTS.md`** — Settings UI
   - Panel architecture
   - AIPanel provider/model patterns
   - Entitlement integration

### Phase 3: Polish
5. **`src/routes/AGENTS.md`** — Router & page structure
   - TanStack Router in this project
   - Page loading patterns
   - Navigation best practices

---

## Cross-Domain References

These domains should cross-reference each other:
- **IPC** → cites handlers for chat/app/settings
- **Hooks** → cites queryKeys factory, ipc client calls
- **Chat** → cites useStreamChat hook, ipc.chatStream contract
- **Settings** → cites useSettings hook, SettingsDialog panel pattern
- **Routes** → cites page-level hooks, data loading

---

## Specialized Guidance Already in Root AGENTS.md

These can be referenced from domain AGENTS.md files but don't need their own files:

- ✅ **IPC architecture expectations** (contract-driven, three patterns)
- ✅ **React Query + IPC integration pattern** (useQuery, useMutation, error handling)
- ✅ **Lexical editor in Playwright** (clear, type, history menu)
- ✅ **Base UI Radio selection** (getByText workaround)
- ✅ **Pre-commit checks & testing**
- ✅ **Database (Drizzle) patterns**

---

## Summary Table

| Domain | Priority | Size | Why Separate |
|--------|----------|------|--------------|
| **src/ipc/** | 🔴 CRITICAL | 146 files, 12.8K LOC | Security boundary, contract-driven, 54 handler files, specialized workflow |
| **src/components/chat/** | 🔴 CRITICAL | 73 files, 12.9K LOC | Streaming patterns, Chat + Chat-v2 coexistence, Lexical/Monaco complexity |
| **src/hooks/** | 🟡 HIGH | 63 files, 4.4K LOC | React Query + IPC pattern, queryKeys factory, planning artifact hooks |
| **src/components/settings/** | 🟡 MEDIUM-HIGH | 11 files, 748 LOC | Panel architecture, growing domain, provider/entitlement complexity |
| **src/routes/** | 🟡 MEDIUM | 11 routes, ~1K LOC | TanStack Router, page patterns, upcoming planning artifacts page |

---

## Next Steps

1. Review this analysis with team
2. Prioritize Phase 1 (IPC + Chat)
3. Create templates for each domain AGENTS.md
4. Add links from root AGENTS.md to domain guides
5. Maintain consistency with root AGENTS.md structure
