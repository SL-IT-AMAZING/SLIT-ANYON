# ANYON-b2c: Entry Points & Module Boundaries Analysis

**Generated:** 2025-03-10  
**Scope:** Root app, engine, IPC, workflows, testing, packaging  
**Purpose:** Hierarchical AGENTS.md file placement guidance

---

## I. PRIMARY ENTRY POINTS

### 1.1 **Electron Application Root** (`src/main.ts`)
- **Role:** Electron main process entry point (707 lines)
- **Key Init:** Database, IPC handlers, window management, auto-update
- **Key Imports:**
  - `ipc/ipc_host.ts` → registers all IPC handlers
  - `ipc/deep_link_data.ts` → protocol handlers
  - `main/auth.ts` → OAuth flow
  - `main/entitlement.ts` → license/entitlement sync
  - `main/settings.ts` → user settings persistence (getSettingsFilePath, readSettings, writeSettings)
  - `backup_manager.ts` → BackupManager class
  - `lib/sentry.ts` → error reporting init
  - `utils/performance_monitor.ts` → perf tracking (startPerformanceMonitoring, stopPerformanceMonitoring)

**AGENTS.md placement:** `src/main/AGENTS.md` (new - main process orchestration)

### 1.2 **Renderer Entry** (`src/renderer.tsx` + `src/router.ts`)
- **renderer.tsx:** React DOM mount point
- **router.ts:** TanStack Router root configuration (46 lines)
  - Imports all 12 route definitions
  - Exports `router` and `NotFoundRedirect` component
- **Routes root:** `src/routes/root.tsx` (all route hierarchy)
- **Pages:** `src/pages/` (10 page components)

**AGENTS.md placement:** `src/routes/AGENTS.md` (rendering patterns, routing)

### 1.3 **Engine Module** (`engine/src/index.ts`)
- **Role:** OpenCode plugin for Anyon orchestration (SEPARATE from main app)
- **Key Entry:** `AnyonPlugin: Plugin` exported as default
- **Sub-modules:**
  - `agents/` → Discipline agents (Euler, Tesla, Newton, Socrates)
  - `cli/` → CLI config management
  - `config/` → Config schema and loading
  - `features/` → Feature flags, activation gates
  - `hooks/` → Plugin hooks (50+ OpenCode hooks)
  - `mcp/` → Model Context Protocol integrations
  - `plugin/` → Plugin lifecycle, interface
  - `shared/` → Engine utilities

**Key pattern:** Engine loads project config via `initConfigContext()`, creates managers/tools/hooks, exports plugin interface

**AGENTS.md placement:** `engine/src/AGENTS.md` (already exists - engine is separate repo context)

---

## II. IPC ARCHITECTURE (Contract-Driven)

### 2.1 **IPC Contracts** (`src/ipc/types/*.ts`)
**Single source of truth:** Each domain has own contract file + auto-generated client

**30 Domain Contracts:**
- **App Operations:** `app.ts`, `app_upgrade.ts`
- **Chat:** `chat.ts`, `chat_stream.ts` (streaming)
- **Settings & Config:** `settings.ts`, `system.ts`
- **Authentication:** `auth.ts`, `entitlement.ts`, `security.ts`
- **LM & Models:** `language_model.ts` (provider config)
- **AI/Agents:** `agent.ts`, `plan.ts`, `planning_artifacts.ts`, `proposals.ts`
- **Integrations:** `github.ts`, `vercel.ts`, `supabase.ts`, `mcp.ts`
- **Design System:** `design_systems.ts`, `liked_themes.ts`, `templates.ts`
- **Visual Editing:** `visual-editing.ts`, `capacitor.ts`
- **Import & Context:** `import.ts`, `context.ts`
- **UI/Help:** `help.ts`, `version.ts`, `upgrade.ts`, `misc.ts`, `free_agent_quota.ts`

**Pattern:** 
```ts
// Contract definition + auto-generated client
export const myContract = defineContract("channel-name", { input: InputSchema, output: OutputSchema });
export const myClient = createClient([myContract]);
```

**Re-exported via:** `src/ipc/types/index.ts` as unified `ipc` namespace

**AGENTS.md placement:** `src/ipc/types/AGENTS.md` (contract definitions, client generation, validation)

### 2.2 **IPC Handlers** (`src/ipc/handlers/*.ts`)
**Matching pattern:** Each contract has corresponding `*_handlers.ts` file

**52 Handler Files:**
- Base utilities: `base.ts` (createTypedHandler), `safe_handle.ts`, `shell_handler.ts`
- Domain handlers: `app_handlers.ts`, `chat_handlers.ts`, `settings_handlers.ts`, `auth_handlers.ts`, etc.
- Special-purpose: 
  - `planning_artifact_storage.ts` → storage for planning/proposals
  - `builder_wave_plan.ts` + `planUtils.ts` → plan building logic
  - `local_model_handlers.ts` + `local_model_ollama_handler.ts` + `local_model_lmstudio_handler.ts` → local model support

**Key Pattern:**
```ts
// Handler uses createTypedHandler for automatic Zod validation
export const registerMyHandlers = () => {
  ipcMain.handle("channel-name", createTypedHandler(myContract, async (input) => {
    if (!valid(input)) throw new Error("Invalid input");
    return result;
  }));
};
```
**Error handling:** Handlers MUST `throw new Error("message")`, NOT return error objects

**AGENTS.md placement:** `src/ipc/handlers/AGENTS.md` (handler implementation patterns, error handling)

### 2.3 **IPC Infrastructure**
- **Registration:** `src/ipc/ipc_host.ts` (4.5 KB)
  - Calls all `registerXHandlers()` functions from handler modules
  - Single point where all handlers are wired
- **Preload allowlist:** `src/preload.ts` + `src/ipc/preload/channels.ts`
  - Auto-derived from contracts
  - Security-critical: whitelist of allowed IPC channels
- **Utilities:** `src/ipc/utils/` (55+ utility files)
  - `vendor_binary_utils.ts` → resolve native binaries (ripgrep, git, node)
  - `opencode_server.ts` → OpenCode server lifecycle
  - `git_utils.ts` → git operations
  - `test_utils.ts` → E2E test helpers (IS_TEST_BUILD)
  - `proxy_server.ts` → proxy injection for requests
  - `opencode_config_setup.ts` → OpenCode config initialization
  - Many others for specialized operations

**AGENTS.md placement:** `src/ipc/AGENTS.md` (IPC layer overview, contract pattern, preload security)

---

## III. MAJOR FEATURE MODULES

### 3.1 **Pro Module** (`src/pro/`)
**Separate paid features:** Visual editing, advanced refactoring, search/replace

**Structure:**
```
src/pro/
├── CONTRIBUTING.md         ← Pro module contribution guide
├── LICENSE                 ← Pro module license
├── main/
│   ├── ipc/
│   │   ├── processors/     → Specialized processors (search_replace_processor.ts)
│   │   └── ...            → Pro-specific contracts + handlers
│   ├── prompts/            → Pro-specific system prompts
│   ├── utils/              → Pro utilities (visual_editing_utils.ts)
│   └── ...test.ts         → Pro-specific tests
├── ui/
│   └── components/         → Pro React components (visual editor, etc.)
└── shared/                 → Shared types/schemas
```

**Key files:**
- `main/ipc/processors/search_replace_processor.ts` → search/replace logic
- `main/utils/visual_editing_utils.ts` → visual editor operations (with test file)
- Test conventions: `*.test.ts` files colocated with source

**Key insight:** Pro module mirrors main app structure (main + ui), has own test files

**AGENTS.md placement:** 
- `src/pro/AGENTS.md` (pro module overview)
- `src/pro/main/AGENTS.md` (pro main-process logic)
- `src/pro/ui/AGENTS.md` (pro component layer)

### 3.2 **OpenCode Integration** (`src/opencode/`)
**Role:** Configuration and MCP server initialization for OpenCode integration

**Structure:**
```
src/opencode/
└── mcp/           → MCP server implementations
```

**Key operations:** Plugin initialization, config loading, MCP setup

**AGENTS.md placement:** `src/opencode/AGENTS.md` (OpenCode plugin integration, MCP patterns)

### 3.3 **Agent Tools** (`src/agent/tools/`)
**Purpose:** Tool definitions for agentic operations

**Key pattern:** Tools exported from `src/agent/tools/index.ts`

**AGENTS.md placement:** `src/agent/AGENTS.md` (agent/tool infrastructure)

---

## IV. RENDERER/REACT LAYER

### 4.1 **App Shell & Layout**
- `src/app/layout.tsx` → React root layout
- `src/app/TitleBar.tsx` → Window title bar component

### 4.2 **Routing**
- **Router entry:** `src/router.ts` (46 lines)
  ```ts
  const routeTree = rootRoute.addChildren([
    homeRoute, themesRoute, hubRoute, templateDetailRoute, connectRoute, 
    chatRoute, appDetailsRoute, appsRoute, appDetailRoute, settingsRoute
  ]);
  export const router = createRouter({ routeTree, defaultNotFoundComponent, defaultErrorComponent });
  ```
- **Routes definition:** `src/routes/` (11 files)
  - `root.tsx` → root route (parent)
  - Domain routes: `home.tsx`, `chat.tsx`, `connect.ts`, `apps.tsx`, `app-detail.tsx`, `app-details.tsx`, `settings.tsx`, `themes.ts`, `hub.ts`, `template-detail.tsx`
- **Pages:** `src/pages/` (10 page components, used by routes)

**Route hierarchy:**
```
root 
  ├── home
  ├── chat
  ├── connect
  ├── apps
  ├── app-detail
  ├── app-details
  ├── settings
  ├── themes
  ├── hub
  └── template-detail
```

**AGENTS.md placement:** `src/routes/AGENTS.md` (routing patterns, TanStack Router conventions)

### 4.3 **Component Hierarchy**
- **Total components:** 84 component files in `src/components/`
- **Key subdirs:**
  - `chat/` → Chat UI components (messages, input, history)
  - `chat-v2/` → Updated chat UI (v2 rewrite in progress)
  - `auth/` → Authentication UI components
  - `settings/` → Settings panels and forms
  - `subscription/` → Subscription/payment UI
  - `preview_panel/` → Preview panel components
  - `ui/` → Base UI components (Geist, Base UI wrappers)

**State Management Pattern:** TanStack Query (useQuery/useMutation) with:
- Query keys factory: `src/lib/queryKeys.ts` (centralized, hierarchical)
- IPC client methods: domain-specific (appClient, settingsClient, etc.)
- Error handling: onError callbacks for toast notifications

**AGENTS.md placement:** `src/components/AGENTS.md` (component conventions, design system, TanStack Query patterns)

### 4.4 **Styling & Design**
- `src/styles/` → Global CSS/Tailwind configuration
- Component styling: inline Tailwind classes
- Theme management: context-based system (with dark/light mode)
- CSS utilities for consistent spacing, colors, typography

**AGENTS.md placement:** `src/styles/AGENTS.md` (only if heavy theming/styling work planned)

### 4.5 **Store & State**
- `src/atoms/` → Jotai atoms (global state like selected app, chat mode)
- `src/contexts/` → React Context providers (theme, auth state)
- `src/store/` → Store configuration and setup

**Pattern:** Atoms for simple state, Context for complex nested state

**AGENTS.md placement:** `src/store/AGENTS.md` (state management patterns, atom conventions)

---

## V. UTILITIES & SHARED

### 5.1 **React Hooks** (`src/hooks/`)
**Pattern:** useQuery/useMutation wrappers around IPC domain clients

### 5.2 **Utilities** (`src/utils/`)
**Pattern:** Pure functions, no side effects where possible

### 5.3 **Libraries** (`src/lib/`)
**Key files:**
- `queryKeys.ts` → TanStack Query key factory (hierarchical structure)
- `schemas.ts` → Zod validation schemas
- `sentry.ts` → Sentry error reporting configuration
- `rollout.ts` → Feature rollout logic (getUserRolloutBucket)

**AGENTS.md placement:** `src/lib/AGENTS.md` (shared utilities, queryKeys structure, schemas)

### 5.4 **Shared (Root Level)** (`/shared/`)
**Minimal cross-app utilities (6 files):**
- `normalizePath.ts` → path normalization
- `ports.ts` → port utilities
- `xmlEscape.ts` → XML escaping
- `VirtualFilesystem.ts` → virtual file system
- `sanitizeVisibleOutput.ts` → output sanitization
- `tsc_types.ts` → TypeScript types

**Scope:** Shared between main app and server

---

## VI. DATABASE

### 6.1 **Database Setup** (`src/db/`)
**Pattern:** Drizzle ORM with SQLite

**Key operations:**
- `getDatabasePath()` → get SQLite database file path
- `initializeDatabase()` → initialize database connection and run migrations

**Migrations:** `drizzle/` directory
- **Auto-generated:** `npm run db:generate` creates migration files
- **Never manual:** DO NOT write migration files by hand
- **Migration structure:** Numbered files (0001_*.sql, 0002_*.sql, etc.)
- **Snapshots:** `drizzle/meta/_journal.json` tracks migration history

**Key convention:** `npm run db:generate` after schema changes, NOT manual SQL

**AGENTS.md placement:** `src/db/AGENTS.md` (only if modifying schema/migrations heavily)

---

## VII. TESTING

### 7.1 **Unit Tests** (`src/__tests__/`)
**40 test files** covering:
- Utility functions (duration_utils, github_utils, path_utils)
- Schema validation (schemas_pro_access, import_validation, create_app_dialog_validation)
- Message parsing (ai_messages_utils, messagesListUtils, formatMessagesForSummary)
- Theme filtering and rendering
- Component rendering (renderModel.test.tsx)
- Router/navigation (router_routes.test.ts)

**Configuration:** `vitest.config.ts`
```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
  },
});
```

**Pattern:** Tests colocated with source files

**Run:** `npm run test` or `npm run test:watch`

### 7.2 **E2E Tests** (`e2e-tests/`)
**110+ Playwright test files** covering:
- Full app workflows (chat, import, export)
- Multi-step user flows (setup, configuration, execution)
- Integration tests (GitHub, Vercel, Supabase)
- Visual tests (component selection, preview)

**Key convention:** **Must run `npm run build` before `npm run e2e`**
- E2E tests run against the built app binary, not source code
- Build artifacts in `.vite/build/` and packaged app

**Configuration:** `playwright.config.ts`

**Helper infrastructure:**
- `e2e-tests/helpers/` → test helper functions
- `e2e-tests/fixtures/` → test data/fixtures
- `test_helper.ts` → common test utilities (e.g., `po.clearChatInput()`, `po.openChatHistoryMenu()`)

**Run:** 
```sh
npm run build                                  # Required before E2E
PLAYWRIGHT_HTML_OPEN=never npm run e2e        # Run E2E tests
DEBUG=pw:browser PLAYWRIGHT_HTML_OPEN=never npm run e2e  # Debug
```

**AGENTS.md placement:** `e2e-tests/AGENTS.md` (E2E testing patterns, Playwright conventions, fixtures)

### 7.3 **Test Infrastructure** (`testing/`)
- Test helpers and utilities
- Shared test fixtures

---

## VIII. BUILD & PACKAGING

### 8.1 **Electron Build Config** (`forge.config.ts`)
**Purpose:** Configure Electron app packaging and distribution

**Output:** Packaged app in `out/` directory

**Build artifacts:**
- Main: `.vite/build/main.js` (main process)
- Preload: `.vite/build/preload.js` (preload script)
- Renderer: `.vite/build/renderer/` (React app)
- Assets: `drizzle/`, `scaffold/`, `worker/` directories included

**Configuration patterns:**
- Ignore node_modules (except specific modules)
- Include vendor binaries (drizzle, scaffold, worker)
- Codesigning for Windows/macOS

### 8.2 **Vite Configs** (4 files)
- `vite.main.config.mts` → Main process bundling (Node.js target)
- `vite.preload.config.mts` → Preload script bundling
- `vite.renderer.config.mts` → Renderer (React) bundling (Browser target)
- `vite.worker.config.mts` → Web Worker bundling

**Pattern:** Each has own target environment and entry point

### 8.3 **Worker/Thread Layer** (`worker/` + `workers/`)
- **JavaScript workers:** `worker/` (8 client/utility scripts)
  - `anyon-component-selector-client.js` → Visual editor component selection
  - `anyon-screenshot-client.js` → Screenshot capture
  - `anyon-visual-editor-client.js` → Visual editing client
  - `proxy_server.js` → Proxy server injection
  - `anyon-sw.js` → Service worker
  - Other utility scripts

- **TypeScript workers:** `workers/tsc/` → TypeScript compilation workers
  - `tsconfig.json` for worker TypeScript config

**AGENTS.md placement:** `worker/AGENTS.md` (web worker conventions, main-renderer bridge)

---

## IX. ADMIN INTEGRATIONS

### 9.1 **Supabase Admin** (`src/supabase_admin/`)
**Purpose:** Backend auth, database, edge functions

**Key operations:**
- OAuth return handlers (supabase_return_handler.ts in main.ts)
- User data sync
- Database operations

### 9.2 **Vercel Admin** (`src/vercel_admin/`)
**Purpose:** Vercel integration for deployments

**Key operations:**
- OAuth return handlers (vercel_return_handler.ts in main.ts)
- Deployment configuration

### 9.3 **Server** (`server/`)
**Separate Next.js backend app**
- Vercel deployment target
- Drizzle ORM for database (separate schema from main app)
- Edge functions for API endpoints
- Own package.json, tsconfig, environment

**AGENTS.md placement:** `server/AGENTS.md` (backend service architecture, Next.js patterns)

---

## X. TEMPLATES & SCAFFOLDS

### 10.1 **Templates** (`templates/`)
**20+ framework templates**
- Pre-built starter apps
- Framework-specific (React, Vue, Astro, Next.js, Svelte, etc.)
- Each has own src/, tsconfig, package.json

**Purpose:** Users can create new apps from templates

**AGENTS.md placement:** `templates/AGENTS.md` (if creating/modifying templates)

### 10.2 **Scaffolds** (`scaffold*/`)
**6 design system scaffolds:**
- `scaffold/` → Base
- `scaffold-mui/` → Material-UI
- `scaffold-daisyui/` → daisyUI
- `scaffold-chakra/` → Chakra UI
- `scaffold-mantine/` → Mantine
- `scaffold-nextjs/` → Next.js
- `scaffold-antd/` → Ant Design

**Pattern:** Each has own:
- `package.json` with framework dependencies
- `vite.config.ts` for bundling
- `tsconfig.json` for TypeScript
- `src/` with component library starter code

**Purpose:** Design system component libraries for projects

**AGENTS.md placement:** `scaffold/AGENTS.md` (design system scaffold conventions)

---

## XI. MODULE CONVENTIONS & PATTERNS

### 11.1 **Contract-Driven IPC**
**Workflow:**
1. **Define contract** in `src/ipc/types/<domain>.ts`
   ```ts
   export const myContract = defineContract("channel-name", {
     input: InputSchema,
     output: OutputSchema
   });
   export const myClient = createClient([myContract]);
   ```

2. **Export client** from same file

3. **Re-export** in `src/ipc/types/index.ts`
   ```ts
   export { myClient, myContract } from "./my_domain.ts";
   export const ipc = { ... }; // unified namespace
   ```

4. **Implement handler** in `src/ipc/handlers/<domain>_handlers.ts`
   ```ts
   export const registerMyDomainHandlers = () => {
     ipcMain.handle("channel-name", createTypedHandler(myContract, async (input) => {
       // Zod validation happens automatically in createTypedHandler
       // Throw on error
       return result;
     }));
   };
   ```

5. **Register handler** in `src/ipc/ipc_host.ts`
   ```ts
   registerMyDomainHandlers();
   ```

6. **Preload allowlist** auto-derived from contracts (no manual registration)

### 11.2 **React Query Integration**
**Pattern:**
- All keys in `src/lib/queryKeys.ts` (centralized factory)
- useQuery for reads with:
  - `queryKey: queryKeys.domain.detail({ id })`
  - `queryFn: () => domainClient.getDetail({ id })`
  - Conditional `enabled` if dependent on state
- useMutation for writes with:
  - `mutationFn: (input) => domainClient.create(input)`
  - `onSuccess` to invalidate related queries
  - `onError` for error handling

**Error handling:** Handlers throw errors → TanStack Query captures → onError callback shows toast

### 11.3 **Error Handling**
**Rule:** Handlers throw errors, NOT return error objects

```ts
// ✅ CORRECT
export const myHandler = createTypedHandler(contract, async (input) => {
  if (!input.valid) throw new Error("Invalid input");
  return result;
});

// ❌ WRONG
export const myHandler = createTypedHandler(contract, async (input) => {
  if (!input.valid) return { success: false, error: "Invalid input" };
  return { success: true, data: result };
});
```

### 11.4 **Testing**
**Pattern:**
- Unit tests colocated with source (`src/**/*.test.ts`)
- E2E tests in separate directory (`e2e-tests/`)
- Rebuild before E2E: `npm run build` (critical!)
- Use Playwright helpers for Lexical editor: `po.clearChatInput()`, `po.openChatHistoryMenu()`

---

## XII. HIERARCHICAL AGENTS.md PLACEMENT SUMMARY

**Recommended structure for hierarchical AGENTS.md files:**

```
ANYON-b2c/
├── AGENTS.md                          ← ROOT (app overview, all-hands conventions)
│                                         - Electron + React architecture
│                                         - IPC pattern overview
│                                         - TanStack Query integration
│                                         - Testing philosophy
│
├── src/
│   ├── AGENTS.md                      ← RENDERER LAYER (React, routing, components)
│   │                                     - TanStack Router patterns
│   │                                     - Component conventions
│   │                                     - State management (atoms, context)
│   │                                     - Styling guidelines
│   │
│   ├── main/
│   │   └── AGENTS.md                  ← MAIN PROCESS (Electron, IPC, system services)
│   │                                     - Main process lifecycle
│   │                                     - IPC registration
│   │                                     - Database initialization
│   │                                     - System integrations
│   │
│   ├── ipc/
│   │   ├── AGENTS.md                  ← IPC LAYER OVERVIEW
│   │   │                                 - Contract-driven pattern
│   │   │                                 - Security model (preload)
│   │   │                                 - Error handling
│   │   │
│   │   ├── types/
│   │   │   └── AGENTS.md              ← CONTRACT DEFINITIONS
│   │   │                                 - How to define contracts
│   │   │                                 - Client generation
│   │   │                                 - Validation (Zod)
│   │   │                                 - Contract domains overview
│   │   │
│   │   └── handlers/
│   │       └── AGENTS.md              ← HANDLER IMPLEMENTATION
│   │                                     - createTypedHandler pattern
│   │                                     - Error handling (throw errors)
│   │                                     - Handler registration
│   │                                     - Special handlers (streaming, local models)
│   │
│   ├── pro/
│   │   ├── AGENTS.md                  ← PRO MODULE (paid features)
│   │   │                                 - Pro feature isolation
│   │   │                                 - Licensing/entitlement
│   │   │
│   │   ├── main/
│   │   │   └── AGENTS.md              ← PRO MAIN-PROCESS LOGIC
│   │   │
│   │   └── ui/
│   │       └── AGENTS.md              ← PRO COMPONENT LAYER
│   │
│   ├── opencode/
│   │   └── AGENTS.md                  ← OPENCODE PLUGIN INTEGRATION
│   │                                     - Plugin initialization
│   │                                     - MCP server patterns
│   │
│   ├── agent/
│   │   └── AGENTS.md                  ← AGENT TOOLS INFRASTRUCTURE
│   │
│   ├── routes/
│   │   └── AGENTS.md                  ← ROUTING & NAVIGATION
│   │                                     - TanStack Router setup
│   │                                     - Route hierarchy
│   │                                     - Navigation patterns
│   │
│   ├── components/
│   │   ├── AGENTS.md                  ← COMPONENT CONVENTIONS
│   │   │                                 - Design system overview
│   │   │                                 - Component patterns
│   │   │                                 - TanStack Query usage
│   │   │
│   │   ├── chat/
│   │   │   └── AGENTS.md              ← CHAT UI (if complex refactoring)
│   │   │
│   │   └── chat-v2/
│   │       └── AGENTS.md              ← CHAT V2 REWRITE (if active)
│   │
│   ├── lib/
│   │   └── AGENTS.md                  ← SHARED UTILITIES
│   │                                     - queryKeys factory
│   │                                     - Schemas (Zod)
│   │                                     - Shared functions
│   │
│   ├── db/
│   │   └── AGENTS.md                  ← DATABASE (if heavy schema work)
│   │                                     - Drizzle patterns
│   │                                     - Migration strategy
│   │
│   ├── store/
│   │   └── AGENTS.md                  ← STATE MANAGEMENT
│   │                                     - Jotai atoms
│   │                                     - React Context
│   │
│   └── styles/
│       └── AGENTS.md                  ← STYLING (if redesign underway)
│
├── e2e-tests/
│   └── AGENTS.md                      ← E2E TESTING
│                                         - Playwright conventions
│                                         - Test fixtures
│                                         - Helper utilities
│                                         - Build requirement
│
├── worker/
│   └── AGENTS.md                      ← WEB WORKERS
│                                         - Worker conventions
│                                         - Main-renderer bridge
│                                         - Service worker patterns
│
├── server/
│   └── AGENTS.md                      ← BACKEND SERVICE
│                                         - Next.js patterns
│                                         - API route structure
│                                         - Edge functions
│
├── engine/
│   └── src/
│       └── AGENTS.md                  ← ENGINE (plugin context)
│
└── scaffold/
    └── AGENTS.md                      ← DESIGN SYSTEM SCAFFOLDS
```

---

## XIII. CRITICAL ARCHITECTURAL SEAMS

### Seam 1: Main → Renderer IPC Boundary
**Location:** `src/preload.ts` + `src/ipc/ipc_host.ts`
- **Security-critical:** Preload script whitelists allowed channels
- **Contract-driven:** No manual channel registration (auto-derived)
- **Error handling:** Handlers throw; TanStack Query catches in renderer

### Seam 2: Component ↔ IPC Integration
**Location:** `src/components/` + `src/lib/queryKeys.ts`
- Pattern: useQuery/useMutation → IpcClient methods
- No direct `ipcRenderer.invoke` in components
- Query key factory for consistency and invalidation

### Seam 3: Pro Module Separation
**Location:** `src/pro/` (isolated)
- Paid features entirely separate
- Own IPC handlers + contracts
- Own test conventions
- Licensed/entitlement-gated

### Seam 4: Engine/Plugin Boundary
**Location:** `engine/src/index.ts`
- Separate plugin context (NOT bundled in main app)
- Exports `AnyonPlugin` for OpenCode integration
- Cannot import from main app

### Seam 5: Build Process Separation
**Location:** `forge.config.ts` + `vite.*.config.mts`
- Vite plugins for Electron (main + preload + renderer + worker)
- SQLite + drizzle migrations (auto-generated)
- Templates/scaffolds are separate build targets
- Rebuild required before E2E tests

---

## XIV. TOOL CONVENTIONS

| Tool | Location | Pattern |
|------|----------|---------|
| **IPC** | `src/ipc/` | Contract-driven (Zod validation) |
| **State** | `src/atoms/`, `src/store/` | Jotai atoms + React Context |
| **Async** | `src/lib/queryKeys.ts` | TanStack Query (useQuery/useMutation) |
| **Routing** | `src/router.ts` | TanStack Router (11 routes) |
| **DB** | `src/db/`, `drizzle/` | Drizzle ORM + SQLite |
| **Testing** | `src/__tests__/`, `e2e-tests/` | Vitest (happy-dom) + Playwright |
| **Build** | `forge.config.ts`, `vite.*.config.mts` | Electron Forge + Vite 4 |
| **Styling** | `src/styles/` | Tailwind CSS + Geist design system |
| **Components** | `src/components/` | React functional + Base UI primitives |
| **Validation** | `src/lib/schemas.ts` | Zod (runtime + TypeScript) |

---

## XV. FILE STRUCTURE INSIGHTS FOR AGENT PLACEMENT

### High-Frequency Change Areas (AGENTS.md highly recommended)
- ✅ `src/components/` → Components, design system changes
- ✅ `src/routes/` → Navigation, routing additions
- ✅ `src/ipc/` → New IPC contracts, handlers (contract-driven boundary critical)
- ✅ `e2e-tests/` → E2E test patterns, new workflows
- ✅ `src/pro/` → Pro feature isolation, paid feature development

### Medium-Frequency Change Areas (Root AGENTS.md often sufficient)
- `src/lib/` → Shared utilities, queryKeys additions
- `src/store/` → State management changes
- `src/main/` → Main process changes (less frequent than renderer)

### Low-Frequency Change Areas (Root AGENTS.md sufficient)
- `shared/` → Minimal cross-app utilities
- `server/` → Separate backend service
- `drizzle/` → Auto-generated migrations (never manual)
- `scaffold*/` → Template scaffolds

### Stable Reference (Update only when architecture changes)
- `src/main.ts` → Main process bootstrap (single entry point)
- `src/renderer.tsx` → React root (single entry point)
- `forge.config.ts` → Build config (rarely changes)
- `package.json` → Dependencies (reviewed in lockfile)

---

## XVI. QUICK REFERENCE: KEY FILE LOCATIONS

| Purpose | Primary Files | Secondary Files |
|---------|---------------|-----------------|
| **IPC Contract** | `src/ipc/types/domain.ts` | `src/ipc/types/index.ts` |
| **IPC Handler** | `src/ipc/handlers/domain_handlers.ts` | `src/ipc/ipc_host.ts` |
| **React Hook** | `src/hooks/useDomain.ts` | `src/lib/queryKeys.ts` |
| **Component** | `src/components/DomainComponent.tsx` | `src/styles/` (global styles) |
| **Route** | `src/routes/domain.tsx` | `src/router.ts` |
| **Page** | `src/pages/domain.tsx` | `src/routes/domain.tsx` |
| **Atom/State** | `src/atoms/domain.ts` | `src/store/` (config) |
| **Unit Test** | `src/domain.test.ts` | `vitest.config.ts` |
| **E2E Test** | `e2e-tests/domain.spec.ts` | `playwright.config.ts` |
| **Utility** | `src/utils/domain.ts` | `src/lib/` (core libs) |
| **Database** | `drizzle/schema.ts` | `src/db/index.ts` |

