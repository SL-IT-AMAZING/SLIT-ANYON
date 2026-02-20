# Anyon Architecture Quick Reference

## Data Model Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐         ┌──────────────┐    ┌────────────────┐ │
│  │    apps     │◄────────┤    chats     │    │   messages     │ │
│  ├─────────────┤         ├──────────────┤    ├────────────────┤ │
│  │ id (PK)     │         │ id           │    │ id             │ │
│  │ name        │         │ appId (FK)   │◄───┤ chatId (FK)    │ │
│  │ path        │         │ title        │    │ role           │ │
│  │ displayName │         │ createdAt    │    │ content        │ │
│  │ themeId ◄───┐         └──────────────┘    │ commitHash     │ │
│  │ isFavorite  │         ┌──────────────┐    │ aiMessagesJson │ │
│  │ ...         │         │   versions   │    │ ...            │ │
│  └─────────────┘         ├──────────────┤    └────────────────┘ │
│        ▲                  │ id           │                        │
│        │                  │ appId (FK)   │                        │
│        └──────────────────│ commitHash   │                        │
│                           │ createdAt    │                        │
│  ┌─────────────┐          └──────────────┘                        │
│  │ customThemes│                                                  │
│  ├─────────────┤    ┌──────────────────────────┐                 │
│  │ id (PK)     │    │  language_model_providers│                 │
│  │ name        │    ├──────────────────────────┤                 │
│  │ description │    │ id, name, api_base_url   │                 │
│  │ prompt      │    └──────────────────────────┘                 │
│  │ createdAt   │             ▲                                    │
│  │ updatedAt   │             │                                    │
│  └─────────────┘      ┌──────────────────┐                       │
│                        │ language_models  │                       │
│                        ├──────────────────┤                       │
│                        │ id, displayName  │                       │
│                        │ providerId (FK)  │                       │
│                        └──────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

## IPC Architecture

```
┌─────────────────────────┐
│   RENDERER PROCESS      │
│   (React Frontend)      │
├─────────────────────────┤
│  Components using:      │
│  - ipc.app.getApp()     │
│  - ipc.template.*       │
│  - ipc.visual.*         │
│                         │
│  React Query for:       │
│  - useQuery (reads)     │
│  - useMutation (writes) │
└────────────┬────────────┘
             │ IPC Channel
             ▼
┌─────────────────────────────────────────────────────────────┐
│   ELECTRON MAIN PROCESS                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Handlers (ipcMain.handle):                                 │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  app_handlers    │  │ themes_handlers │  │ visual_*   │ │
│  ├──────────────────┤  ├─────────────────┤  ├────────────┤ │
│  │ create-app       │  │ get-themes      │  │ apply-*    │ │
│  │ get-app          │  │ set-app-theme   │  │ analyze-*  │ │
│  │ list-apps        │  │ get-custom-*    │  └────────────┘ │
│  │ delete-app       │  │ create-custom-* │                  │
│  │ edit-app-file    │  │ generate-theme* │                  │
│  │ read-app-file    │  │ save-theme-*    │                  │
│  │ search-app-files │  └─────────────────┘                  │
│  │ ...              │                                        │
│  └──────────────────┘                                        │
│         ▼                      ▼                      ▼       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Database (SQLite via Drizzle ORM)                      │ │
│  │ File System Operations                                 │ │
│  │ Git Operations                                         │ │
│  │ External Services (Supabase, Vercel, GitHub)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Apps → Templates → Themes Pipeline

```
┌──────────────┐
│  Templates   │ (src/shared/templates.ts)
│  ────────────┤
│ • React      │ Built-in templates with
│ • Next.js    │ tech stack + features
│ • 5 community│
└──────┬───────┘
       │ user selects
       ▼
┌──────────────────────┐
│  Create App          │
│  ─────────────────   │
│ From Template?       │
│ Clone repo → init git│
│ Create in filesystem │
│ Add to apps table    │
└──────┬───────────────┘
       │ app.id created
       ▼
┌──────────────────────┐
│  Select Theme        │
│  ─────────────────   │
│ • Built-in: "default"
│ • Custom: "custom:123"
│ Stored in apps.themeId
└──────┬───────────────┘
       │ theme selected
       ▼
┌──────────────────────────┐
│  AI Generates Code       │
│  ──────────────────────  │
│ System prompt includes:  │
│ • Theme rules (colors,   │
│   spacing, shapes)       │
│ • Component guidelines   │
│ AI follows constraints   │
└──────┬───────────────────┘
       │ code generated
       ▼
┌──────────────────────────┐
│  Visual Editing (Live)   │
│  ──────────────────────  │
│ User clicks component    │
│ CSS changes → Tailwind   │
│ Git commit per change    │
└──────────────────────────┘
```

## Theme System Details

```
┌─────────────────────────────────────────────────────────────┐
│  THEME TYPES                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Built-in Themes:                                           │
│  ───────────────────────                                    │
│  Interface: Theme {                                         │
│    id: "default" | "minimal" | ...                         │
│    name: string                                             │
│    description: string                                      │
│    icon: string                                             │
│    prompt: string  ◄─ LLM system message                   │
│  }                                                          │
│                                                              │
│  Custom Themes:                                             │
│  ──────────────                                             │
│  Stored in: customThemes table                             │
│  ID format: "custom:123" (custom: + numeric id)           │
│  Can be generated from:                                     │
│    • Images (1-5 max, 10MB total)                         │
│    • Website URLs (via web crawl)                         │
│  Generation modes:                                          │
│    • "inspired" (abstract principles)                      │
│    • "high-fidelity" (recreate specific design)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Visual Editing Component ID Format

```
┌────────────────────────────────────────────────────────────┐
│ COMPONENT ID: src/components/Button.tsx:Button:primary-1   │
├────────────────────────────────────────────────────────────┤
│         │                      │        │                  │
│         ▼                      ▼        ▼                  │
│    relative file path     component   element ID           │
│    (in app directory)       name   (unique in component)   │
└────────────────────────────────────────────────────────────┘

Visual Editing Change:
───────────────────────
{
  componentId: "src/components/Button.tsx:Button:primary-1",
  relativePath: "src/components/Button.tsx",
  lineNumber: 42,
  styles: {
    margin: { top: "1rem", left: "0.5rem" },
    padding: { ... },
    backgroundColor: "#f0f0f0",
    text: { fontSize: "14px", fontWeight: "600" }
  },
  textContent: "Click me" (optional)
}

Processing:
───────────
1. Convert CSS → Tailwind classes
2. Extract class prefixes (m-, p-, bg-, text-)
3. Read file, find line 42
4. Update className attribute
5. Write file back
6. Git add + git commit
```

## Contract-Driven IPC Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ src/ipc/types/app.ts                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ // Define schemas using Zod                                │
│ const CreateAppParamsSchema = z.object({ ... })           │
│ const AppSchema = z.object({ ... })                        │
│                                                              │
│ // Define contract                                          │
│ const appContracts = {                                      │
│   createApp: defineContract({                              │
│     channel: "create-app",                                 │
│     input: CreateAppParamsSchema,                          │
│     output: CreateAppResultSchema,                         │
│   })                                                        │
│ }                                                           │
│                                                              │
│ // Generate type-safe client                               │
│ export const appClient = createClient(appContracts)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Usage in React:
───────────────
import { ipc } from "@/ipc/types"

const result = await ipc.app.createApp({ name: "My App" })
// ✓ TypeScript knows result type
// ✓ Parameters are validated at runtime

Handler (auto-registered):
─────────────────────────
ipcMain.handle("create-app", (event, params) => {
  // params validated by Zod
  // errors thrown → rejected Promise
})
```

## React Query Integration Pattern

```
┌──────────────────────────────────────────────────────────┐
│ useQuery (for reads)                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ const query = useQuery({                                │
│   queryKey: queryKeys.apps.detail({ appId }),          │
│   queryFn: () => ipc.app.getApp({ appId }),           │
│   enabled: !!appId,                                     │
│ });                                                      │
│                                                          │
│ // Access data                                          │
│ if (query.isLoading) return <Loading />               │
│ if (query.error) return <Error />                      │
│ return <AppDetail app={query.data} />                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ useMutation (for writes)                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ const mutation = useMutation({                          │
│   mutationFn: (params) =>                              │
│     ipc.template.setAppTheme(params),                 │
│   onSuccess: () => {                                    │
│     queryClient.invalidateQueries({                    │
│       queryKey: queryKeys.appTheme.all                 │
│     });                                                 │
│   },                                                    │
│   onError: (error) => showError(error.message),       │
│ });                                                      │
│                                                          │
│ return (                                                │
│   <button onClick={() =>                               │
│     mutation.mutate({ appId, themeId })              │
│   }>                                                     │
│     Set Theme                                           │
│   </button>                                             │
│ );                                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Key File Locations Reference

```
DATABASE & ORM:
├── src/db/schema.ts                 ← Drizzle ORM schema (tables, relations)
├── drizzle/migrations/*.sql         ← SQL migrations

IPC CONTRACTS:
├── src/ipc/types/
│   ├── app.ts                       ← App CRUD contracts
│   ├── templates.ts                 ← Template/Theme contracts
│   ├── visual-editing.ts            ← Visual editing contracts
│   └── index.ts                     ← Re-exports all clients + ipc namespace
├── src/ipc/contracts/core.ts        ← defineContract(), createClient()

IPC HANDLERS:
├── src/ipc/handlers/
│   ├── app_handlers.ts              ← App operations
│   ├── chat_stream_handlers.ts      ← Chat streaming
│   └── ...
├── src/pro/main/ipc/handlers/
│   ├── themes_handlers.ts           ← Theme operations
│   ├── visual_editing_handlers.ts   ← Visual editing

SHARED DATA:
├── src/shared/templates.ts          ← Built-in templates data
├── src/shared/themes.ts             ← Built-in themes data

UTILITIES:
├── src/ipc/utils/theme_utils.ts     ← getThemePromptById(), isCustomThemeId()
├── src/utils/style-utils.ts         ← stylesToTailwind(), extractClassPrefixes()

HOOKS:
├── src/hooks/useAppTheme.ts         ← Hook for reading app theme
├── src/lib/queryKeys.ts             ← React Query key factory

FRONTEND:
├── src/pages/home.tsx               ← Main app list
├── src/pages/library.tsx            ← Prompt library (not components!)
├── src/components/CustomThemeDialog.tsx ← Theme creation UI
└── src/components/preview_panel/VisualEditingToolbar.tsx
```

## Common Tasks

### To get an app:

```typescript
import { ipc } from "@/ipc/types";
const app = await ipc.app.getApp({ appId: 123 });
```

### To set app theme:

```typescript
await ipc.template.setAppTheme({ appId: 123, themeId: "custom:456" });
// themeId: "default" for built-in
// themeId: "custom:123" for custom (numeric ID)
// themeId: null for no theme
```

### To generate theme from images:

```typescript
const result = await ipc.template.generateThemePrompt({
  imagePaths: ["/tmp/anyon-theme-images/123...jpg"],
  keywords: "modern minimal",
  generationMode: "inspired",
  model: "claude-opus-4.5",
});
// returns { prompt: string }
```

### To apply visual changes:

```typescript
await ipc.visual.applyChanges({
  appId: 123,
  changes: [
    {
      componentId: "src/Button.tsx:Button:primary",
      relativePath: "src/Button.tsx",
      lineNumber: 42,
      styles: { backgroundColor: "#f0f0f0" },
    },
  ],
});
// Automatically: converts CSS to Tailwind, writes file, commits to git
```
