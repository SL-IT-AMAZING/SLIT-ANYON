# Theme Architecture - Quick Reference

## 1-Page Overview for Planning 50+ Theme Integration

### Core Architecture (3 layers)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER (Renderer Process)                      │
│  src/pages/themes.tsx → Design System Gallery                   │
│  User clicks "Preview" or "Use This Design System"              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    IPC Request (Contract)
                    "get-design-system-preview-url"
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   MAIN PROCESS (Node.js)                        │
│  src/ipc/handlers/design_system_handlers.ts                     │
│  → Validates designSystemId against DESIGN_SYSTEM_IDS           │
│  → Generates nonce + secure URL                                 │
│  → Returns: "anyon-preview://shadcn/index.html?nonce=..."       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     Custom Protocol
                   "anyon-preview://"
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              ISOLATED PREVIEW APP (React/Vite)                  │
│  preview-apps/preview-shadcn/dist/index.html                   │
│  → App.tsx extracts nonce from URL params                       │
│  → Loads componentRegistry (8 component previews)               │
│  → Sends PREVIEW_READY message to parent                        │
│  → Listens for NAVIGATE_COMPONENT from parent                   │
│  → Renders selected component on demand                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files (Minimal Set)

| File                                              | Purpose                                | When to Add New Theme            |
| ------------------------------------------------- | -------------------------------------- | -------------------------------- |
| `src/shared/designSystems.ts`                     | Data model + array of all 6 systems    | ✅ Add new `DesignSystem` object |
| `src/ipc/types/design_systems.ts`                 | IPC contracts (auto-derives allowlist) | ⏸️ No changes needed             |
| `src/ipc/handlers/design_system_handlers.ts`      | Request handlers                       | ⏸️ No changes needed             |
| `preview-apps/preview-{id}/`                      | Isolated React app per theme           | ✅ Create new folder             |
| `preview-apps/preview-{id}/src/App.tsx`           | Security + navigation                  | ✅ Copy template                 |
| `preview-apps/preview-{id}/src/previews/index.ts` | Component registry                     | ✅ Define 8 components           |
| `src/main/preview-protocol.ts`                    | Serves `anyon-preview://`              | ⏸️ No changes needed             |

---

## 2. Data Flow for "Preview" Button

```
User clicks "Preview" (DesignSystemCard)
    ↓
setPreviewDesignSystemId("shadcn")
    ↓
<DesignSystemPreviewDialog designSystemId="shadcn" />
    ↓
useDesignSystemPreview("shadcn")
    ↓
ipc.designSystem.getPreviewUrl({ designSystemId: "shadcn" })
    ↓ [IPC to Main Process]
DESIGN_SYSTEM_IDS.includes("shadcn") ✓
Generate nonce = "abc-123-def"
Return { url: "anyon-preview://shadcn/index.html?nonce=abc-123-def&parentOrigin=...", nonce }
    ↓
setPreviewUrl(url)
    ↓
<iframe src="anyon-preview://shadcn/..." />
    ↓ [Custom Protocol Handler]
Serve /preview-shadcn/dist/index.html
    ↓ [Preview App loads]
Extract nonce from URL params
Load componentRegistry
Send "PREVIEW_READY" message with components list
    ↓
Render component nav + active component
User can click components → navigates via postMessage
```

---

## 3. DesignSystem Data Model

```typescript
interface DesignSystem {
  // ✅ Update for each new theme
  id: string; // "tailwindui", "bootstrap5", etc.
  displayName: string; // "Tailwind UI", "Bootstrap 5"
  description: string; // Marketing copy
  libraryName: string; // Brand name
  category:
    | "minimal"
    | "material"
    | "enterprise"
    | "modern"
    | "accessible"
    | "playful";

  // UI Presentation
  colorScheme: { primary: string; secondary: string; background: string };
  thumbnailPath: string; // e.g., "thumbnails/tailwindui.svg"

  // Discovery
  tags: string[]; // Search keywords
  componentCount: number; // How many components in preview

  // Technical
  previewDir: string; // "preview-tailwindui" (matches folder name!)
  scaffoldDir?: string; // Optional "scaffold-tailwindui"
  componentStrategy: "code-copy" | "library-import";
  importPattern: string; // "@/components/ui/" or "@tailwindui/react"

  // Metadata
  tier: 1 | 2 | 3 | 4; // Product tier
  isBuiltin: boolean; // true for pre-packaged
  isAvailable: boolean; // User can enable/disable
}
```

**When adding a theme, you MUST provide all fields above.**

---

## 4. Preview App Template Checklist

```bash
preview-apps/preview-newtheme/
├── [ ] package.json               # Update "name": "preview-newtheme"
│                                  # Install UI framework + React deps
├── [ ] vite.config.ts             # Standard config (can copy from shadcn)
├── [ ] tsconfig.json              # Can copy as-is
├── [ ] src/
│   ├── [ ] main.tsx               # Entry point (can copy as-is)
│   ├── [ ] App.tsx                # Security handshake (can copy as-is)
│   ├── [ ] globals.css            # Theme config (CUSTOMIZE!)
│   │                              # CSS variables OR Tailwind config OR theme object
│   └── [ ] previews/
│       ├── [ ] index.ts           # Component registry (8 components)
│       │                          # Must match: id, name, category, component
│       ├── [ ] OverviewPreview.tsx    # Overview of all components
│       ├── [ ] ButtonPreview.tsx      # Buttons showcase
│       ├── [ ] InputPreview.tsx       # Form inputs
│       ├── [ ] CardPreview.tsx        # Card component
│       ├── [ ] DialogPreview.tsx      # Modal/dialog
│       ├── [ ] TablePreview.tsx       # Data table
│       ├── [ ] NavigationPreview.tsx  # Nav bars, breadcrumbs
│       └── [ ] FeedbackPreview.tsx    # Toast, alerts, spinners
└── [ ] npm run build              # Creates dist/ folder

Then add to src/shared/designSystems.ts:
├── [ ] Add DesignSystem object with id="newtheme"
├── [ ] previewDir: "preview-newtheme" MUST match folder
└── [ ] DESIGN_SYSTEMS.push(...)
```

---

## 5. Message Protocol (Parent ↔ iframe)

### Parent → iframe

```typescript
// Navigate to component
iframe.contentWindow.postMessage(
  {
    type: "NAVIGATE_COMPONENT",
    componentId: "buttons",
    nonce: SESSION_NONCE,
  },
  "*",
);

// Acknowledge handshake
iframe.contentWindow.postMessage(
  {
    type: "HANDSHAKE_ACK",
    nonce: SESSION_NONCE,
  },
  "*",
);
```

### iframe → Parent

```typescript
// Signal preview is ready
window.parent.postMessage(
  {
    type: "PREVIEW_READY",
    nonce: SESSION_NONCE,
    components: [
      { id: "buttons", name: "Buttons", category: "actions" },
      { id: "inputs", name: "Inputs", category: "forms" },
      // ... more components
    ],
  },
  ALLOWED_PARENT_ORIGIN,
);
```

**Security:** All messages validated by `nonce` + `parentOrigin` check.

---

## 6. Build & Deployment

### Development

```bash
# Build one preview app
cd preview-apps/preview-newtheme
npm run build
# → dist/ folder created

# Test in app
npm run dev  # Main app runs on localhost
# → Preview accessible at anyon-preview://newtheme/...
```

### Production

```
When building Electron app (npm run build):
1. Build each preview-apps/preview-{id}/
2. Copy all dist/ folders to resources/preview-dists/
3. Protocol handler serves from resources/preview-dists/{id}/dist/
4. File size: ~2MB per theme (React + UI framework bundles)
```

---

## 7. Sizing 50+ Themes

### Storage Impact

- **Per theme:** ~1-3MB (after build, with deps)
- **50 themes:** ~50-150MB
- **App size:** Currently ~200MB → could reach ~400MB

### Build Time Impact

- **Current (6 themes):** ~10-15 seconds
- **50 themes:** ~100-200 seconds (linear growth)
- **Recommendation:** Parallel builds or lazy-load themes

### Maintenance

- **Per theme:** Copy template, customize preview components, test
- **Automation:** Script to generate preview apps from config
- **Testing:** Each theme needs E2E tests for component rendering

---

## 8. Implementation Strategy for 50+ Themes

### Phase 1: Foundation (Recommended)

1. **Create template generator** script
   - Input: Theme config (name, colors, library)
   - Output: Preview app folder with all boilerplate
2. **Parallel build system**
   - Split preview apps build across CPU cores
   - Cache layer for unchanged themes

3. **Config-driven registry**
   - Move DESIGN_SYSTEMS array to JSON/YAML
   - Auto-load from file instead of hardcoding
   - Examples: `themes.json` contains 50+ entries

### Phase 2: Scaling

1. **Lazy-load previews** (on-demand, not at startup)
2. **Bundle by framework** (all Tailwind themes → one app, etc)
3. **CDN delivery** (for packaged app updates)

### Phase 3: Polish

1. **Component mapping** (auto-generate from library exports)
2. **Theme variations** (dark mode, custom colors)
3. **A/B testing** (which themes are most used)

---

## 9. Timeline Estimates

| Task                       | Time       | Difficulty     |
| -------------------------- | ---------- | -------------- |
| Add 1 theme manually       | 30 mins    | Easy           |
| Add 5 themes               | 3 hours    | Medium         |
| Template generator script  | 2-4 hours  | Medium         |
| Add 50 themes with script  | 8-12 hours | Hard (testing) |
| Optimize build performance | 4-6 hours  | Hard           |
| Set up CI/CD               | 2-3 hours  | Medium         |

---

## 10. Files You'll Modify (50+ themes)

### Every time you add a theme:

- `src/shared/designSystems.ts` — Add 1 DesignSystem object

### One-time setup:

- `src/ipc/types/design_systems.ts` — Usually no changes
- `src/ipc/handlers/design_system_handlers.ts` — Usually no changes
- `src/main/preview-protocol.ts` — Usually no changes
- `src/main.ts` — Usually no changes
- Build config files — May need parallelization

### Create for each theme:

- `preview-apps/preview-{id}/` — Entire folder (can be templated)

---

## 11. Commands Reference

```bash
# Add a new theme (manual process)
1. npm run build                  # Build main app first
2. cp -r preview-apps/preview-shadcn preview-apps/preview-newthing
3. cd preview-apps/preview-newthing
4. npm install
5. Edit App.tsx, globals.css, previews/*.tsx
6. npm run build
7. Go back, edit src/shared/designSystems.ts
8. Add to DESIGN_SYSTEMS array
9. npm run build                  # Rebuild main app
10. npm run dev                   # Test it

# Or with template script (future)
npm run generate:preview --name=newthing --framework=tailwind
```

---

## 12. Gotchas & Lessons Learned

⚠️ **Common Mistakes:**

- ❌ Forgetting `previewDir: "preview-something"` must match folder name
- ❌ Building main app before rebuilding preview app → stale UI
- ❌ Not updating `DESIGN_SYSTEM_IDS` → 404 errors in preview protocol
- ❌ Missing `componentRegistry` export → preview shows no components
- ❌ Not validating `nonce` in preview app → security issue

✅ **Best Practices:**

- Always use template generator for new themes
- Test `npm run dev` after each new theme
- Run `npm run build` on both main and preview apps
- Use parallel builds to save time
- Document component mapping for each framework
