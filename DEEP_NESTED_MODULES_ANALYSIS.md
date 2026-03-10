# ANYON-b2c: Deep Nested Modules with Distinct Boundaries (Depth 4+)

## Executive Summary
**Total IPC handler domains:** 30+ contract-driven modules  
**Engine hooks:** 44 distinct hook modules  
**Engine tools:** 16 tool modules  
**Engine features:** 19 feature modules  
**Frontend components:** ~37 TSX files in chat layer alone  

---

## CRITICAL MODULES NEEDING CHILD AGENTS.MD

### TIER 1: Large Handler Domains (>1000 LOC)

#### **`src/ipc/handlers/` (12,829 LOC total, 50 files)**
**Concern:** IPC request-response handlers for 30 domain contracts  
**Boundary Markers:**
- Contract-driven architecture (1:1 handler per domain)
- Each handler registers with `createTypedHandler(contract, handler)`
- Domain-specific validation, error handling, permissions checks
- Shared utilities: `safe_handle.ts`, `base.ts`

**High-Complexity Domains (need child AGENTS.md):**
- `app_handlers.ts` (2,370 LOC) — App lifecycle, upgrades, migrations
- `github_handlers.ts` (1,420 LOC) — GitHub API integration, PR/issue management
- `vercel_handlers.ts` (1,535 LOC) — Deployment pipelines, project sync
- `chat_stream_handlers.ts` (1,141 LOC) — Real-time streaming, turn management

**Recommendation:** Create `src/ipc/handlers/AGENTS.md` covering:
- Contract-handler registration pattern
- Error/permission boundaries per domain
- Query invalidation strategy
- Cross-handler state coordination

---

#### **`src/pro/` (3,260 LOC, sub-structure: main/ipc + ui/components)**
**Concern:** Pro feature isolation layer  
**Boundary Markers:**
- Separate from main app (own IPC layer)
- Visual editing processors: `search_replace_processor.ts` (complex DSL)
- Annotation system in `src/pro/ui/components/Annotator`
- Processors handle specialized transformation logic

**Architecture:**
```
src/pro/
├── main/ipc/
│   ├── handlers/        (visual editing)
│   ├── processors/      (DSL parsing, search-replace)
│   └── prompts/
├── ui/components/       (Annotator, pro-specific UI)
└── shared/
```

**Recommendation:** Create `src/pro/AGENTS.md` covering:
- Search-replace DSL syntax and constraints
- Visual editing semantic boundaries
- Pro feature flag coordination
- Isolated IPC contracts

---

#### **`engine/src/features/builtin-skills/` (5 sub-modules)**
**Concern:** Skill definitions with embedded MCPs  
**Boundary Markers:**
- Each skill carries domain-specific system instructions
- Skills register at boot-time with metadata
- Some embed MCP servers (playwright, git, dev-browser)
- Skills: `git-master`, `frontend-ui-ux`, `dev-browser`, `agent-browser`

**Structure:**
```
engine/src/features/builtin-skills/
├── dev-browser/         (browser automation)
├── git-master/          (git operations)
├── frontend-ui-ux/      (UI/design tasks)
├── skills/              (metadata definitions)
└── index.ts             (exports)
```

**Recommendation:** Create `engine/src/features/builtin-skills/AGENTS.md` covering:
- Skill registration and lifecycle
- MCP server embedding patterns
- Permission boundaries per skill
- Inter-skill dependencies

---

### TIER 2: Hook Modules (44 distinct hooks)

#### **`engine/src/hooks/` (44 hook modules)**
**Concern:** Message interception, context injection, state management  
**Boundary Markers:**
- Each hook listens to specific message phases
- Some form sub-hierarchies (e.g., `keyword-detector/` with analyze/search/turbo)
- Complex hooks: `claude-code-hooks/`, `auto-update-checker/`, `session-recovery/`
- Hooks can have their own event bus and state persistence

**High-Complexity Hook Clusters (need attention):**
- `claude-code-hooks/handlers/` — Integration with Claude Code message flow
- `auto-update-checker/` — Background polling, notification state
- `session-recovery/storage/` — Persistent session restoration
- `keyword-detector/` — Multi-strategy pattern matching (analyze/search/turbo)
- `directory-agents-injector/` — Dynamic AGENTS.md generation
- `directory-readme-injector/` — Dynamic README context injection

**Recommendation:** Create `engine/src/hooks/AGENTS.md` covering:
- Hook lifecycle and phase ordering
- Message transformation contracts
- State isolation between hooks
- Async coordination patterns

---

### TIER 3: Tool Modules (16 distinct tools)

#### **`engine/src/tools/` (16 tool modules)**
**Concern:** Agent-callable functions with safety boundaries  
**Boundary Markers:**
- Each tool validates input schema (Zod)
- Some tools have sub-modules (e.g., `background-task`, `session-manager/shared`)
- Tools: `glob`, `grep`, `bash`, `lsp`, `ast-grep`, `task`, `delegate-task`

**Architecture Pattern:**
```
engine/src/tools/
├── shared/              (common validation, logging)
├── glob/                (file pattern matching)
├── grep/                (content search)
├── interactive-bash/    (tmux-backed REPL)
├── hashline-edit/       (hash-anchored edits)
├── lsp/                 (IDE precision refactoring)
├── ast-grep/            (AST-aware rewrites)
└── ...
```

**Recommendation:** Create `engine/src/tools/AGENTS.md` covering:
- Tool input/output contracts (Zod schemas)
- Execution sandboxing constraints
- Error recovery patterns
- Rate limiting, timeout handling

---

### TIER 4: Feature Modules (19 distinct features)

#### **`engine/src/features/` (19 modules)**
**Concern:** Vertical slices of orchestrator functionality  
**Key Modules:**
- `builtin-skills/` — Skill registration (covered above)
- `builtin-commands/` — Slash-command handlers
- `claude-code-*-loaders` — Plugin/agent/MCP/command discovery
- `background-agent/spawner/` — Parallel agent orchestration
- `skill-mcp-manager/` — On-demand MCP lifecycle
- `opencode-skill-loader/merger/` — Skill merge conflict resolution

**Recommendation:** Create `engine/src/features/AGENTS.md` covering:
- Feature lifecycle and initialization order
- Loader patterns (agent, command, MCP, plugin discovery)
- Skill discovery and conflict resolution
- State synchronization between features

---

## E2E TEST INFRASTRUCTURE (Depth 4+ Fixtures)

### **`e2e-tests/fixtures/` (14 fixture domains)**
**Concern:** Test scenario templates with reproducible state  
**Boundary Markers:**
- Import-app fixtures for different project types (astro, nextjs, minimal)
- Engine fixtures for local agent testing
- Context management fixtures (exclude, manual, src)
- Security review fixtures, image fixtures

**Sub-structure:**
```
e2e-tests/fixtures/
├── import-app/
│   ├── minimal/                   (empty project template)
│   ├── minimal-with-ai-rules/     (with .ai-rules)
│   ├── astro/                     (framework-specific)
│   ├── select-component/          (component selection test)
│   ├── context-manage/            (exclude/manual/src patterns)
│   └── version-integrity/         (upgrade test)
├── engine/
│   └── local-agent/               (agent discovery test)
├── azure/                         (cloud credential test)
├── gateway/                       (edge case test)
├── security-review/               (permission boundaries)
└── backups/                       (snapshot restoration)
```

**Recommendation:** Create `e2e-tests/fixtures/AGENTS.md` covering:
- Fixture template conventions
- Import-app categorization
- Test data setup patterns
- Fixture isolation and cleanup

---

## FRONTEND COMPONENT HIERARCHY (Depth 4+)

### **`src/components/chat-v2/` (37 TSX, ~1200 LOC)`**
**Concern:** Chat UI composition with custom hooks  
**Boundary Markers:**
- Lexical editor integration (custom contenteditable handling)
- Turn grouping logic
- Message rendering pipeline
- Tools (function calls) integration

**Likely Sub-modules:**
- Input handlers (Lexical-specific)
- Turn grouping logic
- Message rendering
- Tool display

**Recommendation:** If chat-v2 has sub-directories, create `src/components/chat-v2/AGENTS.md` covering:
- Lexical editor lifecycle and quirks
- Message state mutations
- Turn grouping determinism

---

### **`src/components/chat/` (45 TSX components)**
**Concern:** Legacy chat implementation (potentially parallel to chat-v2)  
**Status:** If this exists alongside chat-v2, clarify deprecation strategy  

**Recommendation:** Determine co-existence strategy before documenting.

---

## IPC CONTRACT ARCHITECTURE

### **`src/ipc/types/` (30 domain contracts + utilities)**
**Concern:** Single source of truth for channel names, schemas, clients  
**Boundary Markers:**
- Each contract: `defineContract()` + auto-generated client
- Re-exported from `index.ts` for unified namespace
- Zod schemas enforce runtime validation

**High-Complexity Contracts:**
- `chat.ts` — Streaming, history, turn grouping
- `planning_artifacts.ts` — Artifact storage with schema versioning
- `vercel.ts` — Deployment pipelines
- `github.ts` — PR/issue management
- `visual-editing.ts` — Pro feature isolation

**Recommendation:** Create `src/ipc/types/AGENTS.md` covering:
- Contract definition pattern
- Schema versioning strategy
- Event vs. invoke vs. stream semantics
- Query key factory coordination

---

## ENGINE BUILTIN SKILLS (Specific)

### **`engine/src/features/builtin-skills/skills/`**
**Concern:** Skill metadata and prompt injection  
**Current Status:** Skills directory has 7 files (dev-browser, frontend-ui-ux, git-master, playwright, etc.)

**Likely Pattern:**
- Skill metadata (name, description, MCP servers)
- System instruction overrides
- Per-skill permission scopes

**Recommendation:** If skills grow beyond 7, consider `engine/src/features/builtin-skills/skills/AGENTS.md` for:
- Skill naming conventions
- Metadata schema
- Per-skill MCP discovery

---

## TEMPLATES AREA (Preview Apps)

### **`templates/` (3 template groups, each ~1000 LOC)`**
**Concern:** Reusable SaaS landing page templates  
**Structure:**
```
templates/
├── brillance-saas-landing-page/
│   ├── app/
│   ├── components/ui/
│   ├── hooks/
│   ├── lib/
│   ├── preview/
│   └── styles/
├── brutalist-ai-saas-landing-page/
│   └── components/bento/
└── pointer-ai-landing-page/
    └── components/bento/
```

**Boundary Markers:**
- Each template is self-contained (no cross-template imports)
- Bento component pattern (card-based layouts)
- Preview infrastructure for live editing

**Recommendation:** Create `templates/AGENTS.md` covering:
- Template contribution checklist
- Preview infrastructure expectations
- Component reusability conventions

---

## MONOREPO PACKAGES

### **`packages/@anyon/` (2 component taggers)**
**Concern:** Shared npm packages for component discovery  
**Modules:**
- `nextjs-webpack-component-tagger/`
- `react-vite-component-tagger/`

**Boundary Markers:**
- Separate package.json, published to npm
- Framework-specific (Next.js/webpack vs. Vite/React)
- Integrated into design system auto-import

**Recommendation:** Create `packages/AGENTS.md` covering:
- Package release workflow
- Framework compatibility matrix
- Version coordination across monorepo

---

## NOT REQUIRING CHILD AGENTS.MD

These are shallow or reference-only:
- `.github/workflows/` — CI/CD (reference existing tools)
- `testing/fake-llm-server/` — Single utility, minimal structure
- `src/i18n/locales/` — Data files (en/, ko/)
- `src/lib/` — Utility modules (no deep nesting at depth 4+)
- `public/` — Static assets
- `scaffold*/` — Deprecated templates

---

## SUMMARY TABLE

| Module | Type | Depth | Domains | Recommendation |
|--------|------|-------|---------|-----------------|
| `src/ipc/handlers/` | Handlers | 4 | 50 files, 30 contracts | **YES — handlers/AGENTS.md** |
| `src/ipc/types/` | Contracts | 4 | 30 domains | Cross-ref from ipc/AGENTS.md |
| `src/pro/` | Feature | 4 | main/ipc + ui | **YES — pro/AGENTS.md** |
| `src/components/chat-v2/` | Components | 4 | 37 TSX | **Conditional — if sub-dirs** |
| `engine/src/hooks/` | Hooks | 4 | 44 modules | **YES — hooks/AGENTS.md** |
| `engine/src/tools/` | Tools | 4 | 16 modules | **YES — tools/AGENTS.md** |
| `engine/src/features/` | Features | 4 | 19 modules | **YES — features/AGENTS.md** |
| `engine/src/features/builtin-skills/` | Skills | 5 | 5 skills | **Conditional — if scaling** |
| `e2e-tests/fixtures/` | Tests | 4 | 14 fixture types | **YES — fixtures/AGENTS.md** |
| `templates/` | SaaS | 4 | 3 template groups | **YES — templates/AGENTS.md** |
| `packages/@anyon/` | NPM | 4 | 2 taggers | **YES — packages/AGENTS.md** |

---

## RECOMMENDED CHILD AGENTS.MD CREATION ORDER

**Priority 1 (Critical path, heavily modified):**
1. `src/ipc/handlers/AGENTS.md` — 50 handler files, 30 contracts
2. `engine/src/hooks/AGENTS.md` — 44 distinct hooks
3. `engine/src/tools/AGENTS.md` — 16 tool modules

**Priority 2 (Feature-specific, isolation boundaries):**
4. `src/pro/AGENTS.md` — Pro feature isolation
5. `engine/src/features/AGENTS.md` — Feature lifecycle coordination
6. `e2e-tests/fixtures/AGENTS.md` — Test infra

**Priority 3 (Shared/templates, lower change rate):**
7. `templates/AGENTS.md` — Template conventions
8. `packages/AGENTS.md` — Monorepo coordination
9. `src/components/chat-v2/AGENTS.md` — *If* chat-v2 has subdirectories

---

## ARCHITECTURAL INSIGHTS

### IPC-Driven Architecture
- **Single source of truth:** `src/ipc/types/` contracts
- **Handler pattern:** `createTypedHandler(contract, handler)` with Zod validation
- **Client pattern:** Auto-generated clients from contracts
- **Query keys:** Centralized `queryKeys` factory in `src/lib/queryKeys.ts`

### Engine Plugin Architecture
- **Feature system:** 19 vertical features (builtin-skills, hooks, tools)
- **Hook system:** 44 message-phase interceptors with state isolation
- **Tool system:** 16 agent-callable functions with safety bounds
- **Skill system:** Domain-tuned agents with embedded MCPs

### Test Architecture
- **E2E fixtures:** Template-based project scenarios
- **Import-app variants:** Minimal → framework-specific → with context management
- **Isolation:** Each fixture is self-contained, no cross-contamination

---

**Generated:** 2026-03-10 | AGENTS.md Hierarchy Pass
