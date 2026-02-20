# Preview Infrastructure - Code Reference

## Core Implementation Files

### 1. Electron Protocol Handler: `src/main/preview-protocol.ts`

```typescript
// FULL FILE CONTENT
import fs from "node:fs";
import path from "node:path";
import { net, app, protocol } from "electron";
import log from "electron-log";
import { DESIGN_SYSTEM_IDS } from "../shared/designSystems";

const logger = log.scope("preview-protocol");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getPreviewDistRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "preview-dists");
  }
  return path.join(process.cwd(), "preview-apps");
}

// FIX #D: Must be called BEFORE app.whenReady()
export function registerPreviewScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "anyon-preview",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: false,
      },
    },
  ]);
}

// Called AFTER app.whenReady()
export function registerPreviewProtocol(): void {
  protocol.handle("anyon-preview", (request) => {
    const url = new URL(request.url);
    const designSystemId = url.hostname;

    if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
      logger.warn(`Rejected preview request for unknown ID: ${designSystemId}`);
      return new Response("Not Found", { status: 404 });
    }

    const distRoot = path.join(
      getPreviewDistRoot(),
      `preview-${designSystemId}`,
      "dist",
    );

    let requestedPath =
      url.pathname === "/" ? "index.html" : url.pathname.slice(1);

    // Path traversal protection
    requestedPath = path.normalize(requestedPath);
    if (requestedPath.includes("..") || path.isAbsolute(requestedPath)) {
      logger.warn(`Rejected path traversal attempt: ${requestedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.join(distRoot, requestedPath);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(distRoot))) {
      logger.warn(`Resolved path outside dist root: ${resolvedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    if (fs.existsSync(resolvedPath)) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      return net.fetch(`file://${resolvedPath}`, {
        headers: { "Content-Type": mimeType },
      });
    }

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

**Key Takeaways:**
- Validates hostname against DESIGN_SYSTEM_IDS list
- Builds path: `preview-apps/preview-{id}/dist/{file}`
- Path traversal protection with normalization check
- Falls back to index.html if requested file not found
- Explicit MIME type handling for security

---

### 2. Preview URL Manager: `src/ipc/utils/preview_server_manager.ts`

```typescript
import crypto from "node:crypto";
import { DESIGN_SYSTEM_IDS } from "@/shared/designSystems";

let activeDesignSystemId: string | null = null;

export async function getPreviewUrl(
  designSystemId: string,
  senderOrigin?: string,
): Promise<{ url: string; nonce: string }> {
  if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
    throw new Error(`Unknown design system: ${designSystemId}`);
  }

  const nonce = crypto.randomUUID();

  if (activeDesignSystemId && activeDesignSystemId !== designSystemId) {
    await stopActivePreview();
  }

  activeDesignSystemId = designSystemId;

  const parentOrigin = senderOrigin || "*";
  const url = `anyon-preview://${designSystemId}/index.html?nonce=${nonce}&parentOrigin=${encodeURIComponent(parentOrigin)}`;
  return { url, nonce };
}

export async function stopActivePreview(): Promise<void> {
  activeDesignSystemId = null;
}
```

**Key Takeaways:**
- Simple state machine: tracks active design system
- Generates UUID nonce for request tracking
- Encodes parentOrigin as query param
- Can be called from renderer via IPC

---

### 3. Template Detail Page: `src/pages/template-detail.tsx` (excerpt)

```typescript
const TemplateDetailPage: React.FC<TemplateDetailPageProps> = ({
  templateId,
}) => {
  const { templates } = useTemplates();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const template = templates?.find((t) => t.id === templateId);

  // Fetch HTML from main process
  useEffect(() => {
    if (!template) return;
    ipc.template
      .getTemplateContent({ templatePath: template.path })
      .then((result) => setPreviewHtml(result.html))
      .catch(() => setPreviewHtml(""));
  }, [template]);

  // Dynamic scaling
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setPreviewScale(width / 1280);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render with srcDoc
  return (
    <div
      ref={previewContainerRef}
      className="relative overflow-hidden bg-white"
      style={{ aspectRatio: "16 / 9" }}
    >
      {previewHtml && previewHtml.length > 0 ? (
        <iframe
          srcDoc={previewHtml}
          title={template.title}
          sandbox="allow-scripts"
          className="absolute top-0 left-0 border-none"
          style={{
            width: "1280px",
            height: "3000px",
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
```

**Key Takeaways:**
- Fetches HTML string via IPC on mount
- Stores in simple state: `previewHtml`
- Uses srcDoc with sandbox
- Dynamic scaling with ResizeObserver (1280px base)
- Fallback to loading spinner

---

### 4. Template IPC Handler: `src/ipc/handlers/template_handlers.ts`

```typescript
import log from "electron-log";
import { templateContracts } from "../types/templates";
import {
  fetchTemplateContent,
  fetchTemplateRegistry,
} from "../utils/template_utils";
import { createTypedHandler } from "./base";

const logger = log.scope("template_handlers");

export function registerTemplateHandlers() {
  createTypedHandler(templateContracts.getTemplates, async () => {
    try {
      return await fetchTemplateRegistry();
    } catch (error) {
      logger.error("Error fetching template registry:", error);
      return { version: 1, categories: [], templates: [] };
    }
  });

  createTypedHandler(
    templateContracts.getTemplateContent,
    async (_, { templatePath }) => {
      const html = await fetchTemplateContent(templatePath);
      return { html };
    },
  );
}
```

**Key Takeaways:**
- `fetchTemplateContent()` reads entire HTML file
- Returns as single string in response
- Error handling with fallback

---

### 5. IPC Contracts: `src/ipc/types/templates.ts` (excerpt)

```typescript
export const GetTemplateContentParamsSchema = z.object({
  templatePath: z.string(),
});

export type GetTemplateContentParams = z.infer<
  typeof GetTemplateContentParamsSchema
>;

export const GetTemplateContentResultSchema = z.object({
  html: z.string(),
});

export type GetTemplateContentResult = z.infer<
  typeof GetTemplateContentResultSchema
>;

export const templateContracts = {
  getTemplateContent: defineContract({
    channel: "get-template-content",
    input: GetTemplateContentParamsSchema,
    output: GetTemplateContentResultSchema,
  }),
  // ... other contracts
} as const;

export const templateClient = createClient(templateContracts);
```

**Key Takeaways:**
- Input: path to template file
- Output: raw HTML string
- Zod schemas for validation
- Auto-generated typed client

---

### 6. Design Systems Config: `src/shared/designSystems.ts` (excerpt)

```typescript
export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: "shadcn",
    displayName: "Clean Minimalist",
    description: "...",
    libraryName: "shadcn/ui",
    thumbnailPath: "thumbnails/shadcn.svg",
    category: "minimal",
    tier: 1,
    scaffoldDir: "scaffold",
    previewDir: "preview-shadcn",  // <-- Maps to preview-apps/preview-shadcn/dist/
    defaultPlatform: "react",
    tags: ["minimalist", "professional", "saas", "tailwind"],
    colorScheme: {
      primary: "#18181B",
      secondary: "#F4F4F5",
      background: "#FFFFFF",
    },
    componentCount: 49,
    componentStrategy: "code-copy",
    importPattern: "@/components/ui/",
    isBuiltin: true,
    isAvailable: true,
  },
  // ... more design systems
];

export const DESIGN_SYSTEM_IDS = DESIGN_SYSTEMS.map((ds) => ds.id);
// Result: ["shadcn", "mui", "antd", "mantine", "chakra", "daisyui"]

export function getDesignSystemById(id: string): DesignSystem | undefined {
  return DESIGN_SYSTEMS.find((ds) => ds.id === id);
}
```

**Key Takeaways:**
- 6 design systems total
- Each has `id` used in protocol: `anyon-preview://{id}/`
- `previewDir` matches `preview-{id}` folder name

---

### 7. Main Process Registration: `src/main.ts` (excerpt)

```typescript
import {
  registerPreviewProtocol,
  registerPreviewScheme,
} from "./main/preview-protocol";

// Line ~60: BEFORE app.whenReady()
registerPreviewScheme();

// ... other setup ...

app.whenReady().then(() => {
  // Line ~140: AFTER app.whenReady()
  registerPreviewProtocol();
  
  // ... rest of setup
});
```

**Key Takeaways:**
- `registerPreviewScheme()` MUST be before ready
- `registerPreviewProtocol()` MUST be after ready
- Two-phase protocol registration is critical

---

## PreviewIframe Component: `src/components/preview_panel/PreviewIframe.tsx`

### Key State Management

```typescript
const [reloadKey, setReloadKey] = useState(0);           // Force iframe reload
const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
const [currentHistoryPosition, setCurrentHistoryPosition] = useState(0);
const iframeRef = useRef<HTMLIFrameElement>(null);
const currentIframeUrlRef = useRef<string | null>(appUrl);
const [preservedUrls, setPreservedUrls] = useAtom(previewCurrentUrlAtom);
```

### Iframe Rendering

```typescript
const iframeSrc = currentIframeUrlRef.current ?? appUrl ?? undefined;

return (
  <div className="relative flex-grow overflow-hidden">
    <iframe
      key={reloadKey}  // Force remount/reload on change
      ref={iframeRef}
      src={iframeSrc}  // Development server URL or preserved URL
      // No srcDoc - uses actual src attribute
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full border-none"
    />
  </div>
);
```

### Message Handling (postMessage API)

```typescript
// Listen for messages FROM iframe
const handleMessage = (event: MessageEvent) => {
  if (event.source !== iframeRef.current?.contentWindow) {
    return;  // Ignore messages not from our iframe
  }

  // Console logs
  if (event.data?.type === "console-log") {
    const { level, args } = event.data;
    // Process and store
  }

  // Navigation
  if (event.data?.type === "pushState" || "replaceState") {
    // Update navigation history
  }

  // Component selection
  if (event.data?.type === "anyon-component-selected") {
    // Handle component selection
  }
};

window.addEventListener("message", handleMessage);
```

### Sending Messages TO iframe

```typescript
// Navigate programmatically
iframeRef.current?.contentWindow.postMessage(
  {
    type: "navigate",
    payload: { direction: "backward", url: targetUrl },
  },
  "*",
);

// Request component analysis
iframeRef.current?.contentWindow.postMessage(
  {
    type: "enable-anyon-text-editing",
    data: {
      componentId: componentId,
      runtimeId: runtimeId,
    },
  },
  "*",
);
```

---

## Design System Preview URLs

```
anyon-preview://shadcn/index.html
anyon-preview://mui/index.html
anyon-preview://antd/index.html
anyon-preview://chakra/index.html
anyon-preview://mantine/index.html
anyon-preview://daisyui/index.html

// With query params
anyon-preview://shadcn/index.html?nonce=12345&parentOrigin=http%3A%2F%2Flocalhost%3A5173
```

---

## File Serving Examples

**Request:** `anyon-preview://shadcn/assets/style.css`

**Resolution Path:**
```
1. URL hostname: "shadcn"
2. Validate in DESIGN_SYSTEM_IDS: ✓
3. Build distRoot: "preview-apps/preview-shadcn/dist"
4. Requested path: "assets/style.css"
5. Full path: "preview-apps/preview-shadcn/dist/assets/style.css"
6. Check if exists: ✓
7. Get MIME type: "text/css"
8. Use net.fetch(file://{path})
```

---

## Error Scenarios

### Invalid Design System ID
```
Request: anyon-preview://invalid-id/index.html
Response: 404 Not Found
Log: "Rejected preview request for unknown ID: invalid-id"
```

### Path Traversal Attempt
```
Request: anyon-preview://shadcn/../../../etc/passwd
Response: 403 Forbidden
Log: "Rejected path traversal attempt: ../../etc/passwd"
```

### File Not Found (with fallback)
```
Request: anyon-preview://shadcn/nonexistent.js
1. Check for nonexistent.js: not found
2. Check for index.html: found
3. Serve index.html (SPA routing fallback)
```

### Absolute Path Attempt
```
Request: anyon-preview://shadcn//etc/passwd
Response: 403 Forbidden
Log: "Rejected path traversal attempt: /etc/passwd"
```

---

## Integration Points

### 1. Renderer → Main (IPC)
```typescript
// In React component
import { ipc } from "@/ipc/types";

const html = await ipc.template.getTemplateContent({
  templatePath: "/path/to/template.html"
});
```

### 2. Main → Renderer (Protocol)
```typescript
// In iframe src
<iframe src="anyon-preview://shadcn/index.html" />
```

### 3. Iframe ↔ Parent (postMessage)
```typescript
// Iframe sends message
window.parent.postMessage(
  { type: "console-log", level: "info", args: ["Hello"] },
  "*"
);

// Parent receives and handles
window.addEventListener("message", (event) => {
  if (event.data?.type === "console-log") {
    // Process
  }
});
```

---

