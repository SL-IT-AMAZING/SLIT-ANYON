# Anyon Preview Infrastructure Guide

## Quick Navigation

This guide documents the **complete preview serving infrastructure** in the Electron app, helping you understand how to build a pre-built HTML preview system for Next.js/Vite templates.

### Documents
1. **PREVIEW_INFRASTRUCTURE_GUIDE.md** (this file) - Architecture overview & decisions
2. **PREVIEW_CODE_REFERENCE.md** - Code snippets & implementation details

---

## Executive Summary

The Anyon app has **two separate preview systems**:

### 1. Design System Previews (anyon-preview:// protocol)
- **Location:** `src/main/preview-protocol.ts`
- **Serving:** Pre-built Vite apps from `preview-apps/preview-{id}/dist/`
- **URL:** `anyon-preview://shadcn/index.html`
- **Status:** Production-ready, security-hardened
- **Best for:** Static single-page app distribution

### 2. Template Previews (srcDoc approach)
- **Location:** `src/pages/template-detail.tsx`
- **Serving:** Raw HTML strings via IPC
- **Method:** `<iframe srcDoc={htmlString} />`
- **Status:** Working but memory-intensive
- **Best for:** Simple templates, small HTML files

---

## Architecture Decisions

### For Pre-built Template HTML Previews

You have **three options**:

| Option | Approach | Pros | Cons | Recommendation |
|--------|----------|------|------|-----------------|
| **1. Extend anyon-preview://** | Reuse design system protocol | Secure, tested, performant | Slight design system coupling | ✅ BEST |
| **2. Keep srcDoc** | Current template approach | Simple, working | Memory overhead | ❌ Legacy |
| **3. New anyon-template://** | Create isolated protocol | Clean separation | Code duplication | ⚠️ If isolated control needed |

### Recommendation: Extend anyon-preview://

**Why:**
- Protocol handler already optimized for file serving
- Security validations proven in production
- No memory overhead (streams from disk)
- Can validate template IDs like design system IDs
- Single code path for both preview types

**Changes needed:**
1. Modify `src/main/preview-protocol.ts` to accept template IDs
2. Add validation for template paths
3. Update URL pattern: `anyon-preview://template-{id}/index.html`
4. Store templates in: `preview-apps/templates-{id}/dist/`

---

## File Locations Reference

### Core Protocol Implementation
```
src/main/
├── preview-protocol.ts              # Electron protocol handler (100 lines)
│   ├── registerPreviewScheme()      # Before app.ready()
│   ├── registerPreviewProtocol()    # After app.ready()
│   ├── getPreviewDistRoot()         # Resolves dist path
│   └── MIME_TYPES                   # File type mapping

└── ... other main process files
```

### IPC Integration
```
src/ipc/
├── utils/
│   └── preview_server_manager.ts    # URL generation with nonce (29 lines)
│
├── types/
│   └── templates.ts                 # Template IPC contracts (300 lines)
│
└── handlers/
    └── template_handlers.ts         # Main process handlers (28 lines)
```

### React Components
```
src/components/preview_panel/
├── PreviewIframe.tsx                # Dev app preview (1456+ lines)
│   └── Uses appUrl from dev server
│
└── ... other preview components

src/pages/
└── template-detail.tsx              # Template marketplace (234 lines)
    └── Uses srcDoc + IPC pattern
```

### Configuration
```
src/shared/
└── designSystems.ts                 # Design system registry (184 lines)
    ├── DESIGN_SYSTEMS[]
    └── DESIGN_SYSTEM_IDS             # Used for protocol validation
```

### Entry Points
```
src/
└── main.ts
    ├── registerPreviewScheme()       # Line 60 (BEFORE ready)
    └── registerPreviewProtocol()     # Line 140 (AFTER ready)
```

---

## How anyon-preview:// Protocol Works

### Request Flow
```
Browser (iframe src)
  ↓
<iframe src="anyon-preview://shadcn/assets/style.css" />
  ↓
Electron Protocol Handler
  ↓
protocol.handle("anyon-preview", (request) => {
  const url = new URL(request.url);
  const designSystemId = url.hostname;           // "shadcn"
  const requestedPath = url.pathname.slice(1);  // "assets/style.css"
  
  // Validate ID
  if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) return 404;
  
  // Resolve path safely
  const distRoot = "preview-apps/preview-shadcn/dist";
  const filePath = path.join(distRoot, requestedPath);
  const resolvedPath = path.resolve(filePath);
  
  // Security: ensure resolved path stays in distRoot
  if (!resolvedPath.startsWith(path.resolve(distRoot))) return 403;
  
  // Serve file
  if (fs.existsSync(resolvedPath)) {
    return net.fetch(`file://${resolvedPath}`, headers);
  }
  
  // Fallback to index.html (SPA routing)
  return net.fetch(`file://${distRoot}/index.html`, headers);
})
  ↓
File served to iframe
```

### Key Security Features
- ✅ Path traversal protection (`..` rejection)
- ✅ Design system ID whitelist
- ✅ Resolved path boundary check
- ✅ Explicit MIME type handling
- ✅ File existence validation

---

## How srcDoc Template Preview Works

### Request Flow
```
Template Detail Page (React)
  ↓
useEffect([template], () => {
  ipc.template.getTemplateContent({ templatePath: "..." })
})
  ↓
IPC Renderer → Main
  ↓
template_handlers.ts
  └─ fetchTemplateContent(path)
       └─ fs.readFile() → entire HTML as string
  ↓
Returns to React
  ↓
setPreviewHtml(htmlString)
  ↓
<iframe srcDoc={previewHtml} />
  ↓
Browser renders HTML inline
```

### Constraints
- Entire HTML must fit in memory
- No streaming or chunking
- Browser security: can't access external resources
- Sandbox attribute limits functionality
- No navigation history support

---

## Directory Structure

### Preview Apps (for design systems)
```
preview-apps/
├── preview-shadcn/
│   ├── dist/                        # ← Served by anyon-preview://
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   ├── package.json                 # Vite + React + Tailwind
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── preview-mui/
├── preview-antd/
├── preview-chakra/
├── preview-mantine/
└── preview-daisyui/
```

### Production Path
In packaged Electron app: `{resourcesPath}/preview-dists/`

---

## Recommended Implementation for Templates

### Option A: Extend anyon-preview:// (RECOMMENDED)

**1. Directory structure:**
```
preview-apps/
├── templates-nextjs/
│   ├── dist/
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   └── package.json
│
└── templates-vite-react/
    └── ...
```

**2. Protocol modification:**
```typescript
// src/main/preview-protocol.ts
const hostnames = url.hostname.split('-');
const type = hostnames[0];  // "template" or "preview"
const id = hostnames.slice(1).join('-');  // "nextjs", "vite-react"

if (type === "template") {
  const distRoot = path.join(getPreviewDistRoot(), `templates-${id}`, "dist");
  // Serve from templates directory
} else if (type === "preview") {
  const distRoot = path.join(getPreviewDistRoot(), `preview-${id}`, "dist");
  // Serve from preview directory (existing logic)
}

// URLs would be:
// anyon-preview://template-nextjs/index.html
// anyon-preview://template-vite-react/index.html
// anyon-preview://preview-shadcn/index.html
```

**3. Validation:**
```typescript
const TEMPLATE_IDS = ["nextjs", "vite-react", "svelte", ...];
const validIds = [...DESIGN_SYSTEM_IDS, ...TEMPLATE_IDS];

if (!validIds.includes(id)) {
  return new Response("Not Found", { status: 404 });
}
```

**4. React component:**
```typescript
<iframe src={`anyon-preview://template-${templateId}/index.html`} />
// No IPC needed, no srcDoc, just direct protocol
```

### Option B: New anyon-template:// Protocol

Similar implementation but completely isolated:
```typescript
protocol.registerSchemesAsPrivileged([{
  scheme: "anyon-template",
  // ... same privileges as anyon-preview
}]);

protocol.handle("anyon-template", (request) => {
  // Similar logic but only for templates
  const templateId = url.hostname;
  const distRoot = path.join(getPreviewDistRoot(), `templates-${templateId}`, "dist");
  // ... serve files
});
```

---

## Security Model

### Path Traversal Protection
```typescript
const requestedPath = url.pathname.slice(1);  // Remove leading /
const normalized = path.normalize(requestedPath);

// Reject traversal attempts
if (normalized.includes("..") || path.isAbsolute(normalized)) {
  return new Response("Forbidden", { status: 403 });
}

// Verify resolved path stays in dist root
const resolved = path.resolve(path.join(distRoot, normalized));
if (!resolved.startsWith(path.resolve(distRoot))) {
  return new Response("Forbidden", { status: 403 });
}
```

### ID Validation
```typescript
const whitelist = [...DESIGN_SYSTEM_IDS, ...TEMPLATE_IDS];
if (!whitelist.includes(id)) {
  return new Response("Not Found", { status: 404 });
}
```

### Privileges Configuration
```javascript
{
  scheme: "anyon-preview",
  privileges: {
    standard: true,        // Standard URL scheme
    secure: true,          // Treated as https
    supportFetchAPI: true, // Allow fetch() in iframe
    corsEnabled: false,    // No CORS headers
  },
}
```

---

## Testing Checklist

- [ ] Protocol scheme registration before app.ready()
- [ ] Protocol handler registration after app.ready()
- [ ] Design system ID validation works
- [ ] Path traversal protection rejects `..`
- [ ] Absolute path attempts rejected (`/etc/passwd`)
- [ ] MIME type detection for all asset types
- [ ] Index.html fallback for SPA routing
- [ ] File not found returns 404
- [ ] Non-existent design system returns 404
- [ ] Protocol works in both dev and packaged modes
- [ ] Security boundary enforced (path stays in distRoot)

---

## Migration Path (if changing from srcDoc)

### Current State
```
template-detail.tsx
  ↓ ipc.template.getTemplateContent()
  ↓ reads full HTML to memory
  ↓ <iframe srcDoc={htmlString} />
```

### Target State
```
template-detail.tsx
  ↓ Direct URL: anyon-preview://template-{id}/index.html
  ↓ <iframe src="anyon-preview://template-{id}/index.html" />
  ↓ Protocol serves from disk
```

### Steps
1. Build templates into `preview-apps/templates-{id}/dist/`
2. Modify `src/main/preview-protocol.ts` to handle template URLs
3. Update `src/pages/template-detail.tsx` to use protocol URL
4. Remove IPC call to `ipc.template.getTemplateContent()`
5. Update state management (remove previewHtml, previewScale)
6. Add tests for new protocol paths

---

## File Summary Table

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/main/preview-protocol.ts` | 100 | Electron protocol handler | ✅ Production |
| `src/ipc/utils/preview_server_manager.ts` | 29 | URL generation with nonce | ✅ Production |
| `src/components/preview_panel/PreviewIframe.tsx` | 1456+ | Dev app preview | ✅ Production |
| `src/pages/template-detail.tsx` | 234 | Template marketplace | ✅ Production |
| `src/ipc/types/templates.ts` | 300 | Template IPC contracts | ✅ Production |
| `src/ipc/handlers/template_handlers.ts` | 28 | Template handlers | ✅ Production |
| `src/shared/designSystems.ts` | 184 | Design system config | ✅ Production |

---

## Next Steps

1. **Decide:** Which implementation option (extend protocol vs new protocol vs keep srcDoc)
2. **Design:** Template directory structure and ID schema
3. **Implement:** Modify protocol handler for templates
4. **Test:** Security and functionality tests
5. **Migrate:** Update React component to use new approach
6. **Document:** Add comments explaining template-specific logic

---

## References

- Electron Protocol API: https://www.electronjs.org/docs/api/protocol
- URL API: https://nodejs.org/api/url.html
- Path Module: https://nodejs.org/api/path.html
- iframe Security: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe

