# Template Preview Infrastructure - Findings Report

## Executive Summary

This Electron marketplace **DOES have existing preview infrastructure** with multiple layers:

1. **Template Preview System** - Pre-built HTML previews for Next.js templates
2. **Design System Preview Apps** - Full React apps for design system component showcasing
3. **Custom Protocol Handler** - `anyon-preview://` scheme for secure in-app rendering
4. **Registry-based Template Management** - Centralized JSON manifest with GitHub CDN fallback

**Good news**: You can likely leverage existing patterns without building from scratch.

---

## 1. Template Storage & Registry System

### Template Registry (`templates/registry.json`)

- **Location**: `/templates/registry.json` (100+ entries)
- **Structure**: JSON with metadata for 100+ templates
- **Key fields**:
  - `id`: Unique identifier
  - `title`, `description`: Display metadata
  - `imageUrl`: **Points to GitHub raw URL** (external image source)
  - `path`: Relative path to template directory
  - `type`: `"html"` or `"nextjs"`
  - `techStack`, `tags`, `features`, `screenshots`: Extended metadata

### Template Types

#### HTML Templates (0001-0100)

- Simple static HTML/CSS/JS templates
- Located in `templates/{id}/` directories
- Source: GitHub repository (SL-IT-AMAZING/SLIT-ANYON)
- **Currently use external image URLs** from GitHub

#### Next.js Templates

- Built and optimized production builds
- `brillance-saas-landing-page`
- `brutalist-ai-saas-landing-page`
- `pointer-ai-landing-page`

---

## 2. Preview Generation Infrastructure

### Build-Time Preview Generation (`scripts/build-template-previews.ts`)

**Purpose**: Pre-generate HTML previews for Next.js templates during build

**Process**:

```
1. Parse templates/registry.json (filters for type: "nextjs")
2. For each template:
   a. npm install (with retries for EAGAIN)
   b. npm run build with CI=1 flag
   c. Inline CSS/JS into preview/index.html
   d. Replace unresolvable asset URLs with embedded SVG placeholders
   e. Clean up build artifacts (out/, node_modules/)
```

**Key Features**:

- **Asset Inlining**: Converts external CSS/JS to inline `<style>` and `<script>` tags
- **Font Handling**: Converts font URLs to base64 data URIs
- **Self-contained**: Output is a single HTML file with no external dependencies
- **Error Handling**: Graceful degradation for missing assets
- **Caching**: Built-in retry logic for transient network errors

**Output Location**: `templates/{templateId}/preview/index.html`

**Example Cheerio transformations**:

```typescript
// Replace stylesheet links with inline styles
// Replace script tags with inline scripts
// Remove preload links
// Fix placeholder.svg references
```

---

## 3. Preview Serving Infrastructure

### Custom Protocol Handler (`src/main/preview-protocol.ts`)

**Scheme**: `anyon-preview://`

**Purpose**: Serve design system preview apps securely without exposing filesystem paths

**Implementation**:

```typescript
protocol.registerSchemesAsPrivileged({
  scheme: "anyon-preview",
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: false, // ← Important: no CORS for security
  },
});
```

**Request Handling**:

```
URL: anyon-preview://{designSystemId}/index.html?nonce=...&parentOrigin=...
├─ Hostname = designSystemId (validated against DESIGN_SYSTEM_IDS)
├─ Path = route within preview dist
├─ MIME type routing (PNG, SVG, CSS, JS, fonts, etc.)
└─ Fallback to index.html for SPAs

Security:
├─ Path traversal protection (rejects "..")
├─ Absolute path rejection
├─ File existence validation
└─ dist root containment check
```

**File Locations**:

- Development: `preview-apps/preview-{designSystemId}/dist/`
- Production: `process.resourcesPath/preview-dists/`

---

## 4. Design System Previews

### Design System Data (`src/shared/designSystems.ts`)

Each design system includes:

```typescript
interface DesignSystem {
  id: string; // "shadcn", "mui", "antd", etc.
  displayName: string; // User-facing name
  thumbnailPath: string; // SVG thumbnail
  previewDir: string; // "preview-shadcn", etc.
  // ... other config
}
```

### Preview Apps Directory

Located in: `preview-apps/preview-{id}/`

**Apps included**:

- `preview-shadcn` - shadcn/ui components
- `preview-mui` - Material UI components
- `preview-antd` - Ant Design components
- `preview-chakra` - Chakra UI components
- `preview-mantine` - Mantine components
- `preview-daisyui` - DaisyUI components

**Structure** (each app is a React Vite project):

```
preview-{id}/
├─ src/
│  ├─ App.tsx
│  └─ previews/OverviewPreview.tsx
├─ package.json
├─ vite.config.ts
└─ dist/  (built output for production)
```

---

## 5. Template Content Fetching (`src/ipc/utils/template_utils.ts`)

### Fetch Strategy

**For Template HTML Content**:

```
1. Try preview/index.html from GitHub (for pre-built Next.js)
2. Fallback: Try local preview/index.html
3. Fallback: Try index.html from GitHub
4. Fallback: Try local index.html
5. Return empty string if all fail
```

**Caching**:

- Enabled in production (`app.isPackaged`)
- Map-based cache: `templateContentCache<templatePath, html>`
- Per-template caching

**Template Registry Fetching**:

```
1. Try GitHub raw URL: https://raw.githubusercontent.com/...
2. Fallback: Local registry at app.getAppPath()/templates/registry.json
3. Return empty registry if all fail
4. Single promise-based deduplication (no duplicate fetches)
```

---

## 6. IPC Architecture for Templates

### Contracts (`src/ipc/types/templates.ts`)

```typescript
templateContracts = {
  getTemplates: {          // Returns full registry
    channel: "get-templates"
    input: void
    output: TemplateRegistrySchema
  },

  getTemplateContent: {    // Returns HTML for display
    channel: "get-template-content"
    input: { templatePath: string }
    output: { html: string }
  }
}
```

### Handlers (`src/ipc/handlers/template_handlers.ts`)

Minimal wrapper around utility functions:

```typescript
createTypedHandler(templateContracts.getTemplates, async () => {
  return await fetchTemplateRegistry();
});

createTypedHandler(
  templateContracts.getTemplateContent,
  async (_, { templatePath }) => {
    const html = await fetchTemplateContent(templatePath);
    return { html };
  },
);
```

### Renderer Usage

**Hook** (`src/hooks/useTemplates.ts`):

```typescript
const { data: registry } = useQuery({
  queryKey: queryKeys.templates.all,
  queryFn: () => templateClient.getTemplates(),
});
```

**Component** (`src/components/TemplateCard.tsx`):

- Displays template card with `imageUrl`
- Navigation to detail page on click
- Fallback to first letter if no image

---

## 7. Current Image/Thumbnail Approach

### Template Cards

- **Source**: `template.imageUrl` field in registry
- **Current Implementation**: External GitHub URLs
  ```
  https://raw.githubusercontent.com/SL-IT-AMAZING/SLIT-ANYON/main/templates/{id}/thumbnail.jpg
  ```
- **Fallback**: First letter of template title in background

### Design System Thumbnails

- **Source**: `designSystem.thumbnailPath`
- **Type**: SVG icons
- **Storage**: Likely bundled assets (not confirmed in search)

---

## 8. Key Infrastructure Files

| File                                      | Purpose                                      | Status    |
| ----------------------------------------- | -------------------------------------------- | --------- |
| `src/main/preview-protocol.ts`            | Custom protocol handler for anyon-preview:// | ✅ Active |
| `src/ipc/utils/preview_server_manager.ts` | Manage active preview nonce/URL              | ✅ Active |
| `src/ipc/utils/template_utils.ts`         | Fetch/cache template HTML                    | ✅ Active |
| `scripts/build-template-previews.ts`      | Generate Next.js template previews           | ✅ Active |
| `src/ipc/types/templates.ts`              | IPC contracts for templates                  | ✅ Active |
| `templates/registry.json`                 | Central template manifest                    | ✅ Active |
| `src/shared/templates.ts`                 | TypeScript template types                    | ✅ Active |
| `src/shared/designSystems.ts`             | Design system configurations                 | ✅ Active |
| `preview-apps/preview-*/`                 | Design system showcase apps                  | ✅ Active |

---

## 9. NO Image Generation Tools Found

✗ **No puppeteer/playwright** for automatic screenshot generation
✗ **No html-to-image** library
✗ **No canvas-based rendering**
✗ **No sharp** for image processing
✗ **No ImageMagick** integration

**Current strategy**: Use pre-built/pre-generated static images

---

## 10. Architectural Patterns to Leverage

### For Template Previews

1. **Registry-driven approach**: Already using centralized JSON manifest
2. **Build-time generation**: `build-template-previews.ts` shows how to pre-process
3. **Asset inlining**: Pattern for embedding resources into single HTML file
4. **Fallback strategy**: GitHub → Local filesystem
5. **Caching**: Built-in map-based caching in production

### For Design System Previews

1. **Custom protocol**: `anyon-preview://` provides secure in-app rendering
2. **Nonce-based isolation**: `preview_server_manager.ts` shows state management
3. **Static dist serving**: Pre-built React apps served via protocol handler
4. **CORS disabled**: Security-first approach

---

## 11. Recommendations for New Preview Generation

### Option 1: Pre-Built Static Approach (Recommended)

- **Use**: `build-template-previews.ts` as template
- **Add**: Screenshot generation during build (external tool)
- **Store**: In `templates/{id}/screenshot.png`
- **Reference**: In registry JSON as `screenshotUrl` field
- **Advantage**: Zero runtime overhead, CDN-friendly

### Option 2: On-Demand Rendering (If needed)

- **Use**: BrowserView or webContents (already in Electron)
- **Render**: Template HTML → PNG on user request
- **Cache**: In userData directory
- **IPC Handler**: New `generateTemplatePreview` contract
- **Limitation**: Slower, requires headless browser context

### Option 3: Hybrid Approach

- **Pre-built**: Primary source from registry
- **Fallback**: Generate on-demand if missing
- **Cache**: userData/template-previews/

---

## 12. Next Steps for Implementation

1. **Extend registry.json** with new preview fields:

   ```json
   {
     "id": "...",
     "imageUrl": "...",
     "previewUrl": "...",        // NEW: Full preview screen
     "thumbnailUrl": "...",      // NEW: Small thumbnail
     "screenshots": [...]        // Already exists
   }
   ```

2. **Add build-time generation script** (modify `build-template-previews.ts`):
   - Generate screenshot during Next.js build
   - Save to `templates/{id}/screenshot.png`
   - Encode to base64 or reference file path

3. **Create IPC handler** (optional, if on-demand needed):

   ```typescript
   generateTemplatePreview: defineContract({
     channel: "generate-template-preview",
     input: { templatePath: string },
     output: { previewUrl: string, width: number, height: number },
   });
   ```

4. **Update TemplateCard component** to use new fields:
   ```typescript
   <img src={template.previewUrl || template.imageUrl} />
   ```

---

## Conclusion

The app has a **mature template infrastructure** with:

- ✅ Registry-based management
- ✅ GitHub CDN integration with local fallback
- ✅ Pre-built HTML preview generation (Next.js)
- ✅ Secure protocol handler for in-app rendering
- ✅ IPC abstraction layer
- ✅ Caching strategy

**You don't need to build from scratch** - extend the existing `build-template-previews.ts` script to generate preview images/thumbnails during the build process, then reference them in the registry and UI components.
