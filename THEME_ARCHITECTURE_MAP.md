# Theme & Design System Architecture Map

## Overview

This document maps the complete theme/design system architecture for the Anyon Electron app. The system uses a **contract-driven IPC architecture** combined with isolated preview apps that render via the `anyon-preview://` custom protocol.

---

## 1. Core Data Model: `src/shared/designSystems.ts`

### `DesignSystem` Interface

```typescript
interface DesignSystem {
  // Identity & Metadata
  id: string; // Unique identifier (e.g., "shadcn", "antd")
  displayName: string; // User-facing name (e.g., "Clean Minimalist")
  description: string; // Marketing description
  libraryName: string; // Library/brand name (e.g., "shadcn/ui")

  // Visual Presentation
  thumbnailPath: string; // Path to SVG thumbnail (e.g., "thumbnails/shadcn.svg")
  category: DesignSystemCategory; // Category: "minimal" | "material" | "enterprise" | "modern" | "accessible" | "playful"
  colorScheme: {
    // Preview colors (used in card gradients)
    primary: string; // Primary color hex (e.g., "#18181B")
    secondary: string; // Secondary color hex
    background: string; // Background color hex
  };

  // Indexing & Discovery
  tags: string[]; // Search tags (e.g., ["minimalist", "professional", "saas"])
  tier: 1 | 2 | 3 | 4; // Product tier (currently all are 1)
  componentCount: number; // Total available components (informational)

  // Technical Implementation
  scaffoldDir: string; // Directory in root for scaffolds (e.g., "scaffold-mui")
  previewDir: string; // Directory in preview-apps/ (e.g., "preview-mui")
  defaultPlatform: "react"; // Currently only React

  // Component Strategy
  componentStrategy: "code-copy" | "library-import"; // How to provide components
  importPattern: string; // Import path pattern (e.g., "@/components/ui/" or "@mui/material")

  // Availability
  isBuiltin: boolean; // Always true for current 6 design systems
  isAvailable: boolean; // Whether system is available/enabled
}

export type DesignSystemCategory =
  | "minimal"
  | "material"
  | "enterprise"
  | "modern"
  | "accessible"
  | "playful";
```

### Current Design Systems (6 built-in)

```
1. shadcn/ui       → "Clean Minimalist"       → scaffold/ + preview-shadcn/
2. Material UI     → "Material Modern"        → scaffold-mui/ + preview-mui/
3. Ant Design      → "Enterprise Data"        → scaffold-antd/ + preview-antd/
4. Mantine         → "Developer Friendly"     → scaffold-mantine/ + preview-mantine/
5. Chakra UI       → "Accessible Simple"      → scaffold-chakra/ + preview-chakra/
6. DaisyUI         → "Playful Tailwind"       → scaffold-daisyui/ + preview-daisyui/
```

### Helper Functions

```typescript
export const DESIGN_SYSTEMS: DesignSystem[]; // Array of all 6 built-in systems
export const DESIGN_SYSTEM_IDS: string[]; // ["shadcn", "mui", "antd", "mantine", "chakra", "daisyui"]
export function getDesignSystemById(id: string): DesignSystem | undefined;
```

---

## 2. IPC Contracts: `src/ipc/types/design_systems.ts`

### Contract Definitions

```typescript
export const designSystemContracts = {
  getDesignSystems: defineContract({
    channel: "get-design-systems",
    input: z.void(),
    output: z.array(DesignSystemSchema), // Returns all 6 design systems
  }),

  getPreviewUrl: defineContract({
    channel: "get-design-system-preview-url",
    input: z.object({
      designSystemId: z.string(), // e.g., "shadcn"
    }),
    output: z.object({
      url: z.string(), // e.g., "anyon-preview://shadcn/index.html?nonce=..."
      nonce: z.string(), // Security nonce for postMessage validation
    }),
  }),

  stopActivePreview: defineContract({
    channel: "stop-active-design-system-preview",
    input: z.void(),
    output: z.void(),
  }),
};

export const designSystemClient = createClient(designSystemContracts);
```

### Zod Schema

```typescript
export const DesignSystemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string(),
  libraryName: z.string(),
  thumbnailPath: z.string(),
  category: z.string(),
  tier: z.number(),
  scaffoldDir: z.string(),
  previewDir: z.string(),
  defaultPlatform: z.string(),
  tags: z.array(z.string()),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
  }),
  componentCount: z.number(),
  componentStrategy: z.enum(["code-copy", "library-import"]),
  importPattern: z.string(),
  isBuiltin: z.boolean(),
  isAvailable: z.boolean(),
});

export type DesignSystemType = z.infer<typeof DesignSystemSchema>;
```

---

## 3. IPC Handler: `src/ipc/handlers/design_system_handlers.ts`

```typescript
export function registerDesignSystemHandlers() {
  // List all available design systems
  createTypedHandler(designSystemContracts.getDesignSystems, async () => {
    return DESIGN_SYSTEMS;
  });

  // Generate preview URL and nonce for a specific design system
  createTypedHandler(
    designSystemContracts.getPreviewUrl,
    async (event, { designSystemId }) => {
      const senderUrl = event.sender.getURL();
      const senderOrigin = senderUrl ? new URL(senderUrl).origin : undefined;
      return getPreviewUrl(designSystemId, senderOrigin); // → preview_server_manager.ts
    },
  );

  // Stop/cleanup active preview
  createTypedHandler(designSystemContracts.stopActivePreview, async () => {
    await stopActivePreview(); // → preview_server_manager.ts
  });
}
```

**Called in:** `src/ipc/ipc_host.ts` during app startup

---

## 4. Preview Server Manager: `src/ipc/utils/preview_server_manager.ts`

Manages active preview lifecycle and generates secure URLs.

```typescript
let activeDesignSystemId: string | null = null;

// Generates a secure preview URL with nonce
export async function getPreviewUrl(
  designSystemId: string,
  senderOrigin?: string,
): Promise<{ url: string; nonce: string }> {
  // Validate design system exists
  if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
    throw new Error(`Unknown design system: ${designSystemId}`);
  }

  // Generate cryptographic nonce
  const nonce = crypto.randomUUID();

  // Stop previous preview if different
  if (activeDesignSystemId && activeDesignSystemId !== designSystemId) {
    await stopActivePreview();
  }

  // Update active preview
  activeDesignSystemId = designSystemId;

  // Build preview URL
  const parentOrigin = senderOrigin || "*";
  const url = `anyon-preview://${designSystemId}/index.html?nonce=${nonce}&parentOrigin=${encodeURIComponent(parentOrigin)}`;

  return { url, nonce };
}

export async function stopActivePreview(): Promise<void> {
  activeDesignSystemId = null;
}
```

**Security Features:**

- UUID nonce for cross-origin message validation
- senderOrigin tracking for CORS-like protection
- URL parameters: `nonce` and `parentOrigin` passed to preview app

---

## 5. Preview Protocol Handler: `src/main/preview-protocol.ts`

Registers the `anyon-preview://` custom protocol in Electron.

```typescript
export function registerPreviewProtocol(): void {
  protocol.handle("anyon-preview", (request) => {
    const url = new URL(request.url);
    const designSystemId = url.hostname; // e.g., "shadcn"

    // Validate design system ID against known IDs
    if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
      return new Response("Not Found", { status: 404 });
    }

    // Determine preview dist root
    const distRoot = path.join(
      getPreviewDistRoot(), // dev: ./preview-apps, prod: resourcesPath/preview-dists
      `preview-${designSystemId}`,
      "dist",
    );

    // Normalize requested path (e.g., "/" → "index.html")
    let requestedPath =
      url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    requestedPath = path.normalize(requestedPath);

    // Path traversal protection
    if (requestedPath.includes("..") || path.isAbsolute(requestedPath)) {
      return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.join(distRoot, requestedPath);
    const resolvedPath = path.resolve(filePath);

    // Ensure resolved path is within dist root
    if (!resolvedPath.startsWith(path.resolve(distRoot))) {
      return new Response("Forbidden", { status: 403 });
    }

    // Serve the file with correct MIME type
    if (fs.existsSync(resolvedPath)) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      return net.fetch(`file://${resolvedPath}`, {
        headers: { "Content-Type": mimeType },
      });
    }

    // Fallback to index.html for SPA routing
    const indexPath = path.join(distRoot, "index.html");
    if (fs.existsSync(indexPath)) {
      return net.fetch(`file://${indexPath}`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  });

  logger.info("Preview protocol handler registered");
}
```

**Called in:** `src/main.ts` after `app.whenReady()`

---

## 6. Preview App Structure: `preview-apps/preview-{id}/`

Each design system has an isolated preview app with this structure:

```
preview-apps/preview-shadcn/
├── package.json                           # React + UI framework deps
├── vite.config.ts                         # Build config
├── tsconfig.json
├── src/
│   ├── main.tsx                           # React entry point
│   ├── App.tsx                            # Main app component
│   ├── globals.css                        # CSS variables (Tailwind)
│   ├── previews/
│   │   ├── index.ts                       # Component registry
│   │   ├── OverviewPreview.tsx            # Component showcases
│   │   ├── ButtonPreview.tsx
│   │   ├── InputPreview.tsx
│   │   ├── CardPreview.tsx
│   │   ├── DialogPreview.tsx
│   │   ├── TablePreview.tsx
│   │   ├── NavigationPreview.tsx
│   │   └── FeedbackPreview.tsx
│   └── lib/
│       └── utils.ts                       # Helper utilities (cn(), etc)
├── dist/                                   # Build output (served by anyon-preview://)
│   ├── index.html
│   ├── assets/
│   │   ├── *.js
│   │   └── *.css
└── node_modules/
```

### Package.json Pattern

```json
{
  "name": "preview-shadcn",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build", // Builds to dist/
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    // UI Framework
    "@radix-ui/react-*": "^1.x",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.7.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.9.0",
    "typescript": "^5.5.3",
    "vite": "^6.3.4"
  }
}
```

### App Component (`App.tsx`)

**Security handshake:**

```typescript
function App() {
  const [activeComponent, setActiveComponent] = useState("overview");
  const handshakeCompleted = useRef(false);

  // Extract security parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const SESSION_NONCE = urlParams.get("nonce") ?? "";
  const ALLOWED_PARENT_ORIGIN = urlParams.get("parentOrigin") ?? "";

  // Listen for navigation messages from parent
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Validate origin
      if (ALLOWED_PARENT_ORIGIN && event.origin !== ALLOWED_PARENT_ORIGIN) return;
      // Validate nonce
      if (event.data?.nonce !== SESSION_NONCE) return;

      // Handle navigation commands
      if (event.data?.type === "NAVIGATE_COMPONENT") {
        setActiveComponent(event.data.componentId);
      }
      if (event.data?.type === "HANDSHAKE_ACK") {
        handshakeCompleted.current = true;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Notify parent that preview is ready
  useEffect(() => {
    if (window.parent !== window && ALLOWED_PARENT_ORIGIN) {
      window.parent.postMessage(
        {
          type: "PREVIEW_READY",
          nonce: SESSION_NONCE,
          components: componentRegistry.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
          })),
        },
        ALLOWED_PARENT_ORIGIN,
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <nav>{/* Component tabs */}</nav>
      <main>{/* Active component preview */}</main>
    </div>
  );
}
```

### Component Registry (`previews/index.ts`)

```typescript
export interface PreviewComponent {
  id: string; // e.g., "buttons"
  name: string; // e.g., "Buttons"
  category: string; // e.g., "actions"
  component: React.FC; // Component to render
}

export const componentRegistry: PreviewComponent[] = [
  {
    id: "overview",
    name: "Overview",
    category: "general",
    component: OverviewPreview,
  },
  {
    id: "buttons",
    name: "Buttons",
    category: "actions",
    component: ButtonPreview,
  },
  // ... 6 more components
];
```

### Theme Configuration

**shadcn/ui** - CSS variables in `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    /* ... 20+ CSS variables */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    /* ... dark theme variants */
  }
}
```

**Ant Design** - Theme config object in `theme.ts`:

```typescript
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
  },
};
```

**DaisyUI** - Tailwind plugin config in `tailwind.config.ts`:

```typescript
daisyui: {
  themes: [
    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
    "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
    "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black",
    "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade",
    "night", "coffee", "winter", "dim", "nord", "sunset",
  ],
}
```

---

## 7. React Integration: UI Components & Hooks

### Hook: `src/hooks/useDesignSystemPreview.ts`

Manages preview lifecycle and parent-iframe communication.

```typescript
export function useDesignSystemPreview(
  designSystemId: string | null,
): UseDesignSystemPreviewReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [components, setComponents] = useState<PreviewComponent[]>([]);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(
    null,
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Step 1: Fetch preview URL from main process
  useEffect(() => {
    if (!designSystemId) {
      // Reset all state when design system changes
      return;
    }

    setIsLoading(true);
    setError(null);

    ipc.designSystem
      .getPreviewUrl({ designSystemId })
      .then((result) => {
        setPreviewUrl(result.url);
        setNonce(result.nonce);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err : new Error("Failed to get preview URL"),
        );
        setIsLoading(false);
      });
  }, [designSystemId]);

  // Step 2: Listen for PREVIEW_READY message from iframe
  useEffect(() => {
    if (!nonce || !previewUrl) return;

    function handleMessage(event: MessageEvent) {
      // Validate message structure
      if (event.data?.type !== "PREVIEW_READY") return;
      // Validate nonce matches
      if (event.data?.nonce !== nonce) return;

      // Extract component list from preview
      setComponents(
        event.data.components.map((c) => ({
          id: c.id,
          label: c.label ?? c.name ?? c.id,
          category: c.category,
        })),
      );
      setIsLoading(false);

      // Send acknowledgement back to iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "HANDSHAKE_ACK", nonce },
          "*",
        );
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [nonce, previewUrl]);

  // Navigation: Send NAVIGATE_COMPONENT message to iframe
  const navigateToComponent = useCallback(
    (componentId: string) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !nonce) return;

      iframe.contentWindow.postMessage(
        { type: "NAVIGATE_COMPONENT", componentId, nonce },
        "*",
      );
      setActiveComponentId(componentId);
    },
    [nonce],
  );

  // Cleanup: Stop preview when hook unmounts
  useEffect(() => {
    return () => {
      ipc.designSystem.stopActivePreview().catch(() => {});
    };
  }, []);

  return {
    previewUrl,
    nonce,
    isLoading,
    error,
    components,
    activeComponentId,
    navigateToComponent,
    iframeRef,
  };
}
```

### Component: `src/components/DesignSystemPreviewDialog.tsx`

Renders a modal with preview iframe and component navigation.

**Key features:**

- Uses `useDesignSystemPreview()` hook
- Displays iframe at `previewUrl`
- Lists components with grouping by category
- Two-way communication via `postMessage()`:
  - Parent → iframe: `NAVIGATE_COMPONENT` messages
  - iframe → parent: `PREVIEW_READY` message
- "Use This Design System" button triggers app creation flow

### Component: `src/components/DesignSystemCard.tsx`

Renders a card in the gallery with:

- **Live preview thumbnail** (scaled-down iframe)
- **Design system metadata** (name, library, category)
- **Action buttons** (Preview, Use This)
- **Color scheme gradient** background

```typescript
const previewUrl = `anyon-preview://${designSystem.id}/index.html`;
const iframeHeight = scale > 0 ? Math.ceil(180 / scale) : 960;

// Renders iframe at 1280px width, then scales down to container width
<iframe
  src={previewUrl}
  style={{
    width: "1280px",
    height: `${iframeHeight}px`,
    transform: `scale(${scale})`,  // CSS transform to fit container
    transformOrigin: "top left",
  }}
/>
```

### Page: `src/pages/themes.tsx`

Main themes UI with two tabs:

1. **Design Systems** — Gallery of 6 built-in systems (DesignSystemGallery)
2. **Custom Themes** — User-created AI prompt themes

Coordinates:

- Design system preview dialog
- App creation flow
- Custom theme CRUD

---

## 8. Message Flow Diagram

### Flow 1: Getting Preview URL

```
User clicks "Preview" button
    ↓
onPreview(designSystemId)
    ↓
setPreviewDesignSystemId(id)
    ↓
<DesignSystemPreviewDialog open={true} designSystemId={id} />
    ↓
useDesignSystemPreview(id)
    ↓
ipc.designSystem.getPreviewUrl({ designSystemId })
    ↓
[Main Process]
getPreviewUrl(designSystemId, senderOrigin)
    ↓
Validate designSystemId against DESIGN_SYSTEM_IDS
    ↓
Generate nonce = crypto.randomUUID()
    ↓
Return { url: "anyon-preview://shadcn/index.html?nonce=...&parentOrigin=...", nonce }
```

### Flow 2: Loading Preview

```
setPreviewUrl(result.url)
    ↓
<iframe src="anyon-preview://shadcn/index.html?nonce=...&parentOrigin=..." />
    ↓
[anyon-preview:// protocol handler]
Validate hostname against DESIGN_SYSTEM_IDS
    ↓
Serve dist/index.html from preview-shadcn/dist/
    ↓
[Preview App - App.tsx]
Load componentRegistry
    ↓
Extract nonce and parentOrigin from URL search params
    ↓
window.parent.postMessage({
  type: "PREVIEW_READY",
  nonce: SESSION_NONCE,
  components: componentRegistry.map(...)
}, ALLOWED_PARENT_ORIGIN)
```

### Flow 3: Component Navigation

```
User clicks component button in sidebar
    ↓
navigateToComponent(componentId)
    ↓
iframe.contentWindow.postMessage({
  type: "NAVIGATE_COMPONENT",
  componentId: "buttons",
  nonce: SESSION_NONCE
}, "*")
    ↓
[Preview App - App.tsx]
Message handler checks nonce matches
    ↓
setActiveComponent("buttons")
    ↓
Renders ButtonPreview component
```

---

## 9. Adding 50+ New Themes - Integration Points

To add themes from tweakcn.com, you'll need to:

### 1. Update Core Data Model

**File:** `src/shared/designSystems.ts`

- Add new `DesignSystem` objects to `DESIGN_SYSTEMS` array
- Each needs: `id`, `displayName`, `description`, `category`, `colorScheme`, `previewDir`, etc.

### 2. Create Preview Apps

**Directory:** `preview-apps/preview-{newid}/`

- Copy structure from existing preview app (e.g., preview-shadcn/)
- Install UI framework dependencies
- Configure theming (CSS vars, Tailwind config, etc.)
- Import/render components from new library in `previews/*.tsx`
- Build with `npm run build` → generates `dist/`

### 3. Create Scaffolds

**Directory:** `scaffold-{newid}/` (optional, for code-copy strategy)

- Component templates users can copy into their projects
- Or use existing library-import strategy

### 4. Update Build Pipeline

**Files:** Build config files

- Ensure preview apps are built during app build
- Copy preview-dists to resources/ for packaged app

### 5. Update IPC (if needed)

**Files:** `src/ipc/types/design_systems.ts`, handlers

- DESIGN_SYSTEM_IDS will auto-update from DESIGN_SYSTEMS array
- Preload allowlist auto-derives from contracts ✓

### 6. Runtime Validation

The system auto-validates:

- Preview protocol handler checks `DESIGN_SYSTEM_IDS`
- `getPreviewUrl()` validates against `DESIGN_SYSTEM_IDS`
- No manual registration needed

---

## 10. CSS Variable System

### shadcn/ui (Tailwind CSS)

- **Location:** `preview-shadcn/src/globals.css`
- **Variables:** `--background`, `--foreground`, `--primary`, `--muted`, etc.
- **System:** HSL color space (e.g., `222.2 84% 4.9%`)
- **Variants:** `:root` (light) and `.dark` (dark mode)
- **Access:** `bg-background`, `text-foreground` (Tailwind classes)

### Ant Design

- **Location:** `preview-antd/src/theme.ts`
- **System:** Design tokens (TypeScript object)
- **Usage:** Passed to `<ConfigProvider theme={themeConfig}>`
- **Supports:** colorPrimary, borderRadius, fontSizes, shadows, etc.

### DaisyUI

- **Location:** `preview-daisyui/tailwind.config.ts`
- **System:** 30+ pre-built Tailwind CSS themes
- **Usage:** Selectable via `<html data-theme="cupcake">`
- **No code needed:** Themes bundled in daisyui plugin

---

## 11. File Organization Summary

```
src/
├── shared/
│   └── designSystems.ts                ← Core data model (DesignSystem interface, 6 systems)
├── ipc/
│   ├── types/
│   │   └── design_systems.ts          ← IPC contracts (Zod schemas, client)
│   ├── handlers/
│   │   └── design_system_handlers.ts  ← IPC request handlers
│   ├── utils/
│   │   └── preview_server_manager.ts  ← URL generation, state management
│   └── ipc_host.ts                    ← Registers all handlers
├── main/
│   └── preview-protocol.ts            ← anyon-preview:// protocol handler
├── hooks/
│   └── useDesignSystemPreview.ts      ← Parent-iframe communication
├── components/
│   ├── DesignSystemPreviewDialog.tsx  ← Modal with preview iframe
│   ├── DesignSystemCard.tsx           ← Gallery card with thumbnail
│   └── DesignSystemGallery.tsx        ← Gallery grid
├── pages/
│   └── themes.tsx                     ← Main themes page
└── routes/
    └── themes.ts                      ← TanStack Router route

preview-apps/
├── preview-shadcn/                    ← One per design system
│   ├── src/
│   │   ├── App.tsx                    ← Security handshake, component navigation
│   │   ├── globals.css                ← Theme CSS variables
│   │   └── previews/
│   │       ├── index.ts               ← Component registry
│   │       └── *.tsx                  ← Component previews
│   ├── vite.config.ts
│   └── dist/                          ← Build output (served by anyon-preview://)
├── preview-mui/
├── preview-antd/
├── preview-mantine/
├── preview-chakra/
└── preview-daisyui/

scaffold-{id}/                        ← Optional component templates
```

---

## 12. Key Takeaways for 50+ Theme Integration

✅ **Strengths to leverage:**

- **Contract-driven:** Automatic validation & type safety
- **Isolated preview apps:** No package conflicts, theme customization easy
- **Protocol-based:** Secure iframe delivery with nonce validation
- **Hot-reloadable:** Rebuild preview app → changes live

⚠️ **Challenges:**

- **50+ preview apps:** Build time, disk space, maintenance
- **Build orchestration:** Must build each preview app during app build
- **Testing:** Each design system needs component previews

💡 **Recommendations:**

1. Create a **template generator** for new preview apps
2. Consider **bundling themes** (e.g., "all Tailwind themes" as one preview)
3. Implement **lazy loading** of preview apps (load only on demand)
4. Create **config-driven themes** (if common UI framework underneath)
5. Document **component mapping** for each new system
