# Theme & Design System - Complete File Inventory

## Core System Files (Must Understand)

### 1. Data Model

**`src/shared/designSystems.ts`** (184 lines)

- **What:** Defines `DesignSystem` interface and current 6 built-in design systems
- **Key exports:**
  - `interface DesignSystem` — Full data model with 20 fields
  - `type DesignSystemCategory` — Enum of 6 categories
  - `const DESIGN_SYSTEMS: DesignSystem[]` — Array of 6 systems
  - `const DESIGN_SYSTEM_IDS: string[]` — ["shadcn", "mui", "antd", "mantine", "chakra", "daisyui"]
  - `function getDesignSystemById(id)` — Lookup helper
- **To add 50+ themes:** Extend `DESIGN_SYSTEMS` array
- **Field breakdown:**
  - Identity: `id`, `displayName`, `description`, `libraryName`
  - Visual: `colorScheme`, `thumbnailPath`, `category`
  - Discovery: `tags`, `tier`, `componentCount`
  - Technical: `scaffoldDir`, `previewDir`, `defaultPlatform`, `componentStrategy`, `importPattern`
  - Availability: `isBuiltin`, `isAvailable`

---

### 2. IPC Contracts & Types

**`src/ipc/types/design_systems.ts`** (59 lines)

- **What:** Contract definitions for design system IPC endpoints
- **Key exports:**
  - `DesignSystemSchema` — Zod schema for validation
  - `type DesignSystemType` — TypeScript type (inferred from schema)
  - `designSystemContracts` — 3 IPC contracts
    - `getDesignSystems` — Returns all design systems
    - `getPreviewUrl` — Generates secure preview URL + nonce
    - `stopActivePreview` — Cleanup endpoint
  - `designSystemClient` — Auto-generated IPC client
- **Used by:** Frontend components, hooks
- **To add themes:** No changes needed (auto-validates against DESIGN_SYSTEM_IDS)

---

### 3. IPC Request Handlers

**`src/ipc/handlers/design_system_handlers.ts`** (26 lines)

- **What:** Main process request handlers
- **Key functions:**
  - `registerDesignSystemHandlers()` — Called at app startup
  - Handler 1: `getDesignSystems` — Returns `DESIGN_SYSTEMS` array
  - Handler 2: `getPreviewUrl` — Calls `getPreviewUrl()` from preview_server_manager.ts
  - Handler 3: `stopActivePreview` — Calls `stopActivePreview()` from preview_server_manager.ts
- **Registered in:** `src/ipc/ipc_host.ts`
- **To add themes:** No changes needed

---

### 4. Preview URL & Lifecycle Management

**`src/ipc/utils/preview_server_manager.ts`** (29 lines)

- **What:** Generates secure preview URLs and manages active preview state
- **Key functions:**
  - `getPreviewUrl(designSystemId, senderOrigin)` — Core function
    - Validates `designSystemId` against `DESIGN_SYSTEM_IDS` (throws if unknown)
    - Generates UUID nonce
    - Stops previous preview if different
    - Builds URL: `anyon-preview://{id}/index.html?nonce=...&parentOrigin=...`
    - Returns `{ url, nonce }`
  - `stopActivePreview()` — Resets active state
- **Security features:**
  - UUID nonce for message validation
  - senderOrigin tracking
  - Validates against whitelist before URL generation
- **To add themes:** No changes needed

---

### 5. Custom Protocol Handler

**`src/main/preview-protocol.ts`** (84 lines)

- **What:** Registers `anyon-preview://` custom protocol in Electron
- **Key function:**
  - `registerPreviewProtocol()` — Called in `src/main.ts` after `app.whenReady()`
- **Security checks:**
  - Validates hostname against `DESIGN_SYSTEM_IDS`
  - Path traversal protection (normalizes + checks for ".." and absolute paths)
  - Ensures resolved path stays within dist root
- **How it works:**
  1. Extract designSystemId from URL hostname
  2. Construct path: `./preview-apps/preview-{id}/dist/`
  3. Normalize + validate requested file path
  4. Serve with correct MIME type
  5. Fallback to index.html for SPA routing
- **File resolution:**
  - Dev: `./preview-apps/preview-{id}/dist/`
  - Prod: `resourcesPath/preview-dists/preview-{id}/dist/`
- **To add themes:** No changes needed (auto-validates)

---

## UI Integration Files

### 6. Preview Hook

**`src/hooks/useDesignSystemPreview.ts`** (148 lines)

- **What:** React hook managing preview lifecycle and parent-iframe communication
- **Key functions:**
  1. `useDesignSystemPreview(designSystemId)` — Main hook
- **What it does:**
  1. Calls `ipc.designSystem.getPreviewUrl()` when design system changes
  2. Sets `previewUrl` and `nonce` in state
  3. Listens for `PREVIEW_READY` message from iframe
  4. Extracts component list from message
  5. Validates nonce + origin
  6. Sends `HANDSHAKE_ACK` back to iframe
  7. Provides `navigateToComponent()` function
  8. Cleans up preview on unmount
- **Returns:**
  - `previewUrl` — iframe src attribute value
  - `nonce` — Session nonce for validation
  - `isLoading` — Boolean
  - `error` — Error object if failed
  - `components` — List of available components
  - `activeComponentId` — Currently displayed component
  - `navigateToComponent()` — Function to send messages to iframe
  - `iframeRef` — ref to attach to iframe element
- **Used by:** `DesignSystemPreviewDialog`

---

### 7. Preview Dialog Component

**`src/components/DesignSystemPreviewDialog.tsx`** (214 lines)

- **What:** Modal dialog with full preview + component navigation UI
- **Props:**
  - `designSystemId: string | null` — Design system to preview
  - `open: boolean` — Modal visibility
  - `onOpenChange: (open) => void` — Close handler
  - `onUseDesignSystem: (id) => void` — "Use This" button handler
- **Features:**
  - Header with design system metadata (name, library, category, component count)
  - Left sidebar with component list grouped by category
  - Main area with preview iframe
  - "Use This Design System" button (indigo-600)
  - Loading states and error handling
- **Uses:** `useDesignSystemPreview()` hook
- **Message flow:**
  - Sends `NAVIGATE_COMPONENT` messages to iframe
  - Listens for `PREVIEW_READY` from iframe
  - Groups components by category for UI display

---

### 8. Gallery Card Component

**`src/components/DesignSystemCard.tsx`** (112 lines)

- **What:** Card in the design system gallery with live preview thumbnail
- **Props:**
  - `designSystem: DesignSystemType` — Design system data
  - `onPreview: (id) => void` — "Preview" button handler
  - `onUse: (id) => void` — "Use This" button handler
- **Features:**
  - 180px preview thumbnail with scaled-down iframe
  - Design system name, library name, category badge
  - Component count
  - Gradient background using `colorScheme.primary` and `colorScheme.secondary`
  - Two action buttons
- **Technical:**
  - Uses ResizeObserver to scale iframe content
  - Renders iframe at 1280px, scales down to container width
  - Loads preview without full dialog

---

### 9. Main Themes Page

**`src/pages/themes.tsx`** (197 lines)

- **What:** Main UI for themes section with two tabs
- **Layout:**
  - Sidebar: LibraryList component
  - Main: Two tabs
    1. "Design Systems" → DesignSystemGallery
    2. "Custom Themes" → List of user-created themes (ThemeCard)
- **State management:**
  - `previewDesignSystemId` — Currently previewing design system
  - `createDialogOpen` — Show create dialog
  - `createWithDesignSystem` — Which design system to scaffold from
- **Dialogs:**
  - `DesignSystemPreviewDialog` — Full preview modal
  - `CreateAppDialog` — App creation flow
  - `CustomThemeDialog` — Create custom theme
  - `EditThemeDialog` — Edit custom theme
  - `DeleteConfirmationDialog` — Delete custom theme
- **Flow:**
  1. User clicks "Preview" on card → `setPreviewDesignSystemId(id)`
  2. Preview dialog opens with preview iframe
  3. User clicks "Use This" → `setCreateWithDesignSystem(id)` + close preview
  4. Create app dialog opens with design system pre-selected

---

### 10. Theme Route

**`src/routes/themes.ts`** (9 lines)

- **What:** TanStack Router route definition
- **Route:** `/themes`
- **Component:** `ThemesPage`
- **Parent:** `rootRoute`

---

## Preview App Files (Per Design System)

### 11. Preview App Template (6 instances: preview-shadcn, preview-mui, etc.)

**`preview-apps/preview-{id}/package.json`** (38 lines each)

- **Name:** `preview-{id}` (e.g., "preview-shadcn")
- **Scripts:**
  - `dev` — Local dev server
  - `build` — Builds to `dist/` folder
  - `preview` — Vite preview server
- **Dependencies vary by framework:**
  - shadcn: React + Tailwind + Radix UI
  - mui: React + Material UI
  - antd: React + Ant Design
  - mantine: React + Mantine
  - chakra: React + Chakra UI
  - daisyui: React + Tailwind + DaisyUI

---

**`preview-apps/preview-{id}/vite.config.ts`** (15 lines)

- **What:** Build configuration
- **Plugins:** `@vitejs/plugin-react-swc` for React
- **Alias:** `@` → `./src`
- **Output:** `outDir: "dist"`
- **To customize:** Usually no changes needed

---

**`preview-apps/preview-{id}/src/main.tsx`** (boilerplate)

- **What:** React entry point
- **Standard:** Renders App component into DOM root
- **To customize:** Usually no changes needed

---

**`preview-apps/preview-{id}/src/App.tsx`** (71 lines)

- **What:** Main component with security handshake
- **Key features:**
  1. Extract `nonce` and `parentOrigin` from URL search params
  2. Listen for `NAVIGATE_COMPONENT` messages from parent (validate nonce)
  3. Send `PREVIEW_READY` message to parent on mount
  4. Render nav with component buttons
  5. Render active component preview
- **Message protocol:**
  - Receives: `NAVIGATE_COMPONENT` (validate by nonce)
  - Sends: `PREVIEW_READY` (with nonce)
  - Receives: `HANDSHAKE_ACK` (acknowledge)
- **To customize:** Minimal changes (theme classes might differ)

---

**`preview-apps/preview-{id}/src/globals.css`** (varies)

- **What:** Theme configuration
- **shadcn/ui example:** CSS variables in HSL format
  ```css
  :root { --background: 0 0% 100%; --primary: 222.2 47.4% 11.2%; ... }
  .dark { --background: 222.2 84% 4.9%; ... }
  ```
- **Ant Design:** Minimal (uses JS config in theme.ts)
- **DaisyUI:** Minimal (uses Tailwind plugin config)
- **To customize:** Define theme colors/tokens for new design systems

---

**`preview-apps/preview-{id}/src/theme.ts`** (optional, varies)

- **What:** Theme configuration object
- **antd example:**
  ```typescript
  export const themeConfig: ThemeConfig = {
    token: { colorPrimary: "#1890ff", borderRadius: 6 },
  };
  ```
- **To customize:** Adjust design tokens for new design systems

---

**`preview-apps/preview-{id}/tailwind.config.ts`** (optional, varies)

- **What:** Tailwind CSS configuration
- **shadcn/ui example:** Minimal (uses CSS variables)
- **daisyui example:** Configures 30+ themes in plugin config
  ```typescript
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", ...],
  }
  ```
- **To customize:** Extend theme colors/spacing for new design systems

---

**`preview-apps/preview-{id}/src/previews/index.ts`** (66 lines)

- **What:** Component registry for preview
- **Key export:** `componentRegistry: PreviewComponent[]`
- **Each item:**
  ```typescript
  {
    id: "buttons",           // Unique ID for routing
    name: "Buttons",         // Display name
    category: "actions",     // Category for grouping
    component: ButtonPreview, // React component to render
  }
  ```
- **Standard 8 components:**
  1. Overview — All components showcase
  2. Buttons — Various button states
  3. Inputs — Form inputs, text fields
  4. Cards — Card components
  5. Dialogs — Modals, popovers
  6. Tables — Data tables
  7. Navigation — Nav bars, breadcrumbs
  8. Feedback — Toasts, alerts, spinners
- **To customize:** Add/modify components for new design systems

---

**`preview-apps/preview-{id}/src/previews/*.tsx`** (varies)

- **What:** Component showcase files (8 files per preview app)
- **Each file:** React functional component showing that component type
- **Example: ButtonPreview.tsx**
  - Primary button
  - Secondary button
  - Disabled state
  - Loading state
  - Size variants
- **To customize:** Implement for each new design system

---

**`preview-apps/preview-{id}/dist/`** (generated)

- **What:** Build output folder
- **Generated by:** `npm run build`
- **Contents:**
  - `index.html`
  - `assets/` folder with `.js` and `.css` bundles
- **Size:** ~1-3MB per design system
- **Served by:** `anyon-preview://` protocol handler
- **Deploy path:** `resources/preview-dists/` in packaged app

---

## Summary: Minimal Files to Add 50+ Themes

| File                                           | Action                      | Effort       | When      |
| ---------------------------------------------- | --------------------------- | ------------ | --------- |
| `src/shared/designSystems.ts`                  | Add 50 DesignSystem objects | 50 × 5 min   | Per theme |
| `preview-apps/preview-{id}/`                   | Create folder from template | 50 × 30 min  | Per theme |
| `preview-apps/preview-{id}/package.json`       | Copy + update deps          | 50 × 10 min  | Per theme |
| `preview-apps/preview-{id}/src/globals.css`    | Configure theme             | 50 × 15 min  | Per theme |
| `preview-apps/preview-{id}/src/previews/*.tsx` | Implement 8 components      | 50 × 2 hours | Per theme |
| Build pipeline                                 | Parallelize builds          | 1 × 4 hours  | One-time  |

**Total estimate:** ~200-300 hours for 50 themes (assuming automation + template)

---

## Relationship Between Files

```
User clicks "Preview" in themes.tsx
    ↓
useDesignSystemPreview hook uses ipc.designSystem.getPreviewUrl()
    ↓
IPC request → src/ipc/handlers/design_system_handlers.ts
    ↓
→ src/ipc/utils/preview_server_manager.ts (generates URL + nonce)
    ↓
Returns "anyon-preview://shadcn/index.html?nonce=...&parentOrigin=..."
    ↓
<iframe src={previewUrl} /> renders
    ↓
src/main/preview-protocol.ts serves preview-shadcn/dist/index.html
    ↓
preview-shadcn/src/App.tsx loads componentRegistry
    ↓
postMessage("PREVIEW_READY") → parent listens
    ↓
User clicks component in sidebar
    ↓
parent postMessage("NAVIGATE_COMPONENT") → iframe listens
    ↓
iframe renders selected component preview
```

---

## Files NOT to Modify When Adding Themes

These auto-validate or auto-derive from DESIGN_SYSTEMS:

✅ `src/ipc/types/design_systems.ts` — No changes
✅ `src/ipc/handlers/design_system_handlers.ts` — No changes
✅ `src/ipc/utils/preview_server_manager.ts` — No changes
✅ `src/main/preview-protocol.ts` — No changes
✅ `src/main.ts` — Already registers protocol handler
✅ `src/ipc/ipc_host.ts` — Already registers handlers
✅ `src/preload.ts` — Allowlist auto-derives from contracts

## Key Security Considerations

1. **Nonce validation:** Every message must include matching nonce
2. **Origin check:** Parent-origin stored in URL, iframe validates
3. **Path traversal:** Protocol handler normalizes paths, prevents `..`
4. **Allowlist:** Only known design systems can generate preview URLs
5. **Sandbox:** iframe has `sandbox="allow-scripts allow-same-origin"`
