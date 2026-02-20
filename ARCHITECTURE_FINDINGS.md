# Anyon: Apps, Templates, and UI Components Architecture

## Executive Summary

This is an **Electron app** that lets non-developers build web applications using AI assistance. The architecture is organized around **apps** (user projects), **templates** (project starters), **themes** (design systems), and **visual editing** (component styling).

---

## 1. CORE DATA MODEL

### 1.1 Database Schema (`src/db/schema.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│ Apps Table (core)                                           │
├──────────────┬─────────────────────────────────────────────┤
│ id (PK)      │ integer, auto-increment                     │
│ name         │ string (project name)                       │
│ path         │ string (file system path)                   │
│ displayName  │ string (AI-generated name like "Todo App")  │
│ themeId      │ text, nullable (design system reference)    │
│ isFavorite   │ boolean                                     │
│ createdAt    │ timestamp                                   │
│ updatedAt    │ timestamp                                   │
│ profileLearned │ boolean                                    │
│ chatContext  │ JSON (contextual data)                      │
│                                                             │
│ External integrations:                                      │
│ githubOrg, githubRepo, githubBranch                        │
│ supabaseProjectId, vercelProjectId, etc.                   │
└──────────────┴─────────────────────────────────────────────┘
```

**Key Relationships:**

- `Apps` → `Chats` (1 app can have many chats)
- `Apps` → `Versions` (git commit history tracking)
- `Apps` → `CustomThemes` (theme ID reference)

### 1.2 Custom Themes Table

```
┌──────────────────────────────┐
│ CustomThemes                 │
├──────────┬──────────────────┤
│ id (PK)  │ integer          │
│ name     │ string           │
│ description │ text, nullable │
│ prompt   │ text (long LLM prompt) │
│ createdAt │ timestamp        │
│ updatedAt │ timestamp        │
└──────────────────────────────┘
```

---

## 2. IPC CONTRACTS (Contract-Driven Architecture)

### 2.1 App Contracts (`src/ipc/types/app.ts`)

**Input/Output Zod Schemas:**

- `CreateAppParamsSchema`: `{ name, templateId? }`
- `AppBaseSchema`: Core fields from database
- `AppSchema`: Full app with computed fields (`files`, `resolvedPath`, etc.)
- `ListedAppSchema`: App without full computed fields
- `AppFileSearchResultSchema`: Search results with snippets

**IPC Channels (Contract-defined):**

```
Channel: "create-app"          → createApp(params)
Channel: "get-app"             → getApp(appId)
Channel: "list-apps"           → listApps()
Channel: "delete-app"          → deleteApp(appId)
Channel: "copy-app"            → copyApp(appId, newAppName, withHistory)
Channel: "rename-app"          → renameApp(appId, newName, newPath)
Channel: "run-app"             → runApp(appId)
Channel: "stop-app"            → stopApp(appId)
Channel: "restart-app"         → restartApp(appId, removeNodeModules?)
Channel: "edit-app-file"       → editAppFile(appId, filePath, content)
Channel: "read-app-file"       → readAppFile(appId, filePath)
Channel: "search-app-files"    → searchAppFiles(appId, query)
Channel: "change-app-location" → changeAppLocation(appId, parentDir)
```

### 2.2 Template Contracts (`src/ipc/types/templates.ts`)

**Core Types:**

```typescript
interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  isOfficial: boolean;
  category?: "apps" | "web" | "saas";
  techStack?: string[];
  tags?: string[];
}
```

**Theme Types (Parallel to Templates):**

```typescript
interface Theme {
  id: string; // "default" for built-in, "custom:123" for custom
  name: string;
  description: string;
  icon: string;
  prompt: string; // LLM system prompt (design rules)
}

interface CustomTheme {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Template IPC Channels:**

```
Channel: "get-templates"              → getTemplates()
Channel: "get-themes"                 → getThemes() [built-in themes]
Channel: "set-app-theme"              → setAppTheme(appId, themeId)
Channel: "get-app-theme"              → getAppTheme(appId)
Channel: "get-custom-themes"          → getCustomThemes()
Channel: "create-custom-theme"        → createCustomTheme(name, description, prompt)
Channel: "update-custom-theme"        → updateCustomTheme(id, name?, description?, prompt?)
Channel: "delete-custom-theme"        → deleteCustomTheme(id)
Channel: "generate-theme-prompt"      → generateThemePrompt(imagePaths, keywords, mode, model)
Channel: "generate-theme-from-url"    → generateThemeFromUrl(url, keywords, mode, model)
Channel: "save-theme-image"           → saveThemeImage(data, filename)
Channel: "cleanup-theme-images"       → cleanupThemeImages(paths)
```

### 2.3 Visual Editing Contracts (`src/ipc/types/visual-editing.ts`)

```typescript
interface VisualEditingChange {
  componentId: string;
  componentName: string;
  relativePath: string;
  lineNumber: number;
  styles: {
    margin?;
    padding?;
    dimensions?;
    border?;
    backgroundColor?;
    text?;
  };
  textContent?: string;
}
```

**Channels:**

```
Channel: "apply-visual-editing-changes"  → applyChanges(appId, changes[])
Channel: "analyze-component"             → analyzeComponent(appId, componentId)
                                            → { isDynamic, hasStaticText }
```

---

## 3. TEMPLATES ARCHITECTURE

### 3.1 Built-in Templates (`src/shared/templates.ts`)

```typescript
const localTemplatesData: Template[] = [
  {
    id: "react",
    title: "React.js Template",
    techStack: ["React", "Vite", "Tailwind", "TypeScript"],
    features: [...]
  },
  {
    id: "next",
    title: "Next.js Template",
    techStack: ["Next.js", "React", "Tailwind", "TypeScript"],
    ...
  },
  // ... + 5 community templates (SaaS starters, Portfolio, Blog, Dashboard, etc.)
]
```

**Categories:**

- `apps`: Full web applications
- `web`: Marketing/content sites
- `saas`: Commercial SaaS templates

### 3.2 Template Creation Flow

**File:** `src/ipc/handlers/createFromTemplate.ts`

- Handler: `createApp({ name, templateId? })`
- If `templateId` provided: Clones GitHub repo
- Creates new app directory with git init
- Links to Supabase/Vercel if configured

---

## 4. DESIGN SYSTEM & THEMES ARCHITECTURE

### 4.1 Built-in Theme System (`src/shared/themes.ts`)

```typescript
const DEFAULT_THEME = {
  id: "default",
  name: "Default Theme",
  prompt: `
    <theme>
    ### Core Principles
    - AESTHETICS ARE VERY IMPORTANT
    - Never ship default shadcn components
    - Always prefer rounded shapes
    - Establish clear color system
    - Apply motion with restraint
    </theme>
  `,
};
```

**Theme Prompt Structure:**

- Component Guidelines (override shadcn defaults)
- Typography rules (role-based, hierarchy)
- Color System (token-driven, no gradients, colorful)
- Motion & Interaction (restraint, purposeful)
- Layout (mobile-first)
- Contrast guidelines (explicit good/bad examples)

### 4.2 Custom Theme Generation (`src/pro/main/ipc/handlers/themes_handlers.ts`)

**Two Generation Modes:**

1. **"inspired"** mode: Extract abstract design principles (prevents cloning)
2. **"high-fidelity"** mode: Recreate specific visual system

**Two Input Methods:**

1. **Image-based**: Upload 1-5 images → LLM generates theme prompt
2. **URL-based**: Crawl website → Capture screenshot + markdown → Generate theme

**Model Support:**

```
- "gemini-3-pro" (Google)
- "claude-opus-4.5" (Anthropic)
- "gpt-5.2" (OpenAI)
```

**Security:**

- Prompt injection prevention (sanitize keywords, code blocks)
- SSRF protection (block localhost, internal IPs)
- Path traversal protection (temp directory isolation)
- Web crawl timeout (120 seconds)
- Image size limit (10MB)

### 4.3 Theme Application Flow

**File:** `src/hooks/useAppTheme.ts`

```typescript
export function useAppTheme(appId: number | undefined) {
  const query = useQuery({
    queryKey: queryKeys.appTheme.byApp({ appId }),
    queryFn: () => ipc.template.getAppTheme({ appId }),
    enabled: !!appId,
  });

  return { themeId, isLoading, error, invalidate };
}
```

**Theme ID Format:**

- Built-in: `"default"`, `"minimal"`, etc.
- Custom: `"custom:123"` (numeric database ID)

**Resolution Helper** (`src/ipc/utils/theme_utils.ts`):

```typescript
async function getThemePromptById(themeId: string | null): Promise<string>;
// Returns theme prompt for system message injection
```

---

## 5. VISUAL EDITING SYSTEM

### 5.1 Component Identification

**Component ID Format:** `<filePath>:<componentName>:<elementId>`

Example:

```
src/components/Button.tsx:Button:primary-button-1
```

### 5.2 Visual Editing Changes Pipeline

**File:** `src/pro/main/ipc/handlers/visual_editing_handlers.ts`

```
User Action (CSS change in preview)
        ↓
VisualEditingChange object:
  - componentId: string
  - relativePath: string
  - lineNumber: number
  - styles: { margin, padding, dimensions, border, etc. }
  - textContent: optional string
        ↓
Handler: applyChanges(appId, changes[])
        ↓
1. Fetch app from database
2. Group changes by file
3. Convert CSS to Tailwind classes (stylesToTailwind)
4. Transform file content at specific lines
5. Write file back
6. Git add + git commit (if repo exists)
```

### 5.3 Component Analysis

**Handler:** `analyzeComponent(appId, componentId)`
**Returns:** `{ isDynamic: boolean, hasStaticText: boolean }`

- `isDynamic`: Component uses state/props dynamically
- `hasStaticText`: Component has static text content

---

## 6. IPC ARCHITECTURE PATTERNS

### 6.1 Contract-Driven Flow

**File Structure:**

```
src/ipc/
├── types/
│   ├── app.ts              # App contracts + schemas + client
│   ├── templates.ts        # Template/Theme contracts + client
│   ├── visual-editing.ts   # Visual editing contracts
│   └── index.ts            # Re-exports all clients + ipc namespace
├── contracts/
│   └── core.ts             # defineContract(), createClient()
├── handlers/
│   ├── app_handlers.ts
│   ├── visual_editing_handlers.ts
│   └── themes_handlers.ts (in src/pro/main/ipc/handlers/)
└── preload.ts              # Auto-derived allowlist
```

### 6.2 Client Usage in React

```typescript
// Unified namespace approach
import { ipc } from "@/ipc/types";

const app = await ipc.app.getApp({ appId });
const themes = await ipc.template.getThemes();
await ipc.template.setAppTheme({ appId, themeId });

// Or domain-specific
import { appClient } from "@/ipc/types";
const app = await appClient.getApp({ appId });
```

### 6.3 React Query Integration

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { ipc } from "@/ipc/types";

// Reading
useQuery({
  queryKey: queryKeys.apps.detail({ appId }),
  queryFn: () => ipc.app.getApp({ appId }),
});

// Writing
useMutation({
  mutationFn: (params) => ipc.template.setAppTheme(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appTheme.all });
  },
});
```

---

## 7. COMPONENT REGISTRY & LIBRARY SYSTEM

### 7.1 No Traditional Component Registry

**Key Finding:** There is **NO centralized component registry** or component library system in the traditional sense.

**Instead:**

- Components are **part of the generated app code** (shadcn/ui base)
- Visual editing allows **live modification** of component styles
- Themes provide **design system rules** (not component definitions)

### 7.2 How Components Are Referenced

**During Visual Editing:**

- Components identified by: `filePath:componentName:elementId`
- Component analysis determines if it's dynamic or static
- Style changes applied at specific line numbers
- Changes committed to git immediately

**Template System:**

- Templates come with pre-configured component setups
- Examples: shadcn/ui (React), custom component scaffolds

---

## 8. KEY ARCHITECTURAL INSIGHTS

### 8.1 Apps → Templates → Themes → Visual Editing Pipeline

```
Templates (initial scaffold)
         ↓
Apps (user project)
         ↓
Themes (design rules injected into AI prompts)
         ↓
Visual Editing (human refinement of component styles)
```

### 8.2 Theme Prompt Injection Strategy

Themes work by **injecting system prompts** into the AI:

```
System Message includes:
- Template rules (never ship default shadcn)
- Theme rules (use these colors, spacing, shapes)
- Default theme rules (aesthetics, functionality balance)
```

This guides AI-generated code to follow design constraints.

### 8.3 App Metadata in Database

```
apps.themeId ← Links to custom theme
apps.displayName ← AI-generated ("Todo App")
apps.profileLearned ← Whether AI learned app structure
apps.chatContext ← Contextual data for AI (JSON)
apps.isFavorite ← User favorites
```

### 8.4 Visual Editing as Git-First

- **Every style change is a git commit**
- **Line-number tracking** for precise edits
- **Tailwind conversion** from CSS styles
- **Component identity** tied to file + line number

---

## 9. FILE LOCATIONS QUICK REFERENCE

| Purpose                  | Location                                               |
| ------------------------ | ------------------------------------------------------ |
| Database schema          | `src/db/schema.ts`                                     |
| App IPC contracts        | `src/ipc/types/app.ts`                                 |
| Template/Theme contracts | `src/ipc/types/templates.ts`                           |
| Visual editing contracts | `src/ipc/types/visual-editing.ts`                      |
| Built-in templates data  | `src/shared/templates.ts`                              |
| Built-in themes data     | `src/shared/themes.ts`                                 |
| App handlers             | `src/ipc/handlers/app_handlers.ts`                     |
| Theme handlers           | `src/pro/main/ipc/handlers/themes_handlers.ts`         |
| Visual editing handlers  | `src/pro/main/ipc/handlers/visual_editing_handlers.ts` |
| Theme utilities          | `src/ipc/utils/theme_utils.ts`                         |
| useAppTheme hook         | `src/hooks/useAppTheme.ts`                             |
| React Query keys         | `src/lib/queryKeys.ts`                                 |

---

## 10. EXTENSION POINTS & DEVELOPER NOTES

### To Add a New App Property:

1. Add column to `apps` table in `src/db/schema.ts`
2. Update `AppBaseSchema` in `src/ipc/types/app.ts`
3. Migrate database: `npm run db:generate`

### To Add a New Theme Feature:

1. Add fields to `Theme` interface in `src/shared/themes.ts`
2. Update theme generation prompts in `themes_handlers.ts`
3. Export updated type from `src/ipc/types/templates.ts`

### To Create Custom IPC Endpoints:

1. Define contract in relevant `src/ipc/types/*.ts`
2. Export client via `createClient()`
3. Re-export from `src/ipc/types/index.ts`
4. Handler auto-registered in `src/ipc/ipc_host.ts`
5. Preload allowlist auto-derived

---

## 11. SECURITY CONSIDERATIONS

### Theme Generation Security:

- **Prompt injection** protection (sanitize keywords, markdown escaping)
- **SSRF prevention** (block localhost, internal IPs)
- **Path traversal** protection (temp directory isolation)
- **Web crawl timeouts** (120s limit)
- **Image size limits** (10MB max)

### Visual Editing Security:

- **Path validation** (safeJoin, normalizePath)
- **Git operations** only in app directory
- **Line-number tracking** prevents arbitrary file modifications

---

## SUMMARY TABLE: Key Concepts

| Concept            | Definition                                            | Location                                         |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------ |
| **App**            | User's web project (Node.js app in filesystem)        | `apps` table                                     |
| **Template**       | Project starter (React, Next.js, community templates) | `src/shared/templates.ts`                        |
| **Theme**          | Design system rules (built-in or custom AI-generated) | `customThemes` table + `src/shared/themes.ts`    |
| **Theme Prompt**   | LLM system message with design constraints            | `customThemes.prompt`                            |
| **Visual Editing** | Live CSS → Tailwind conversion with git commits       | IPC contracts                                    |
| **Component**      | React component in app source code                    | Identified by `filePath:componentName:elementId` |
