# Preview Infrastructure Quick Reference

## 🎯 What Exists

| Component              | Location                             | Status                   |
| ---------------------- | ------------------------------------ | ------------------------ |
| **Template Registry**  | `templates/registry.json`            | ✅ 100+ templates        |
| **Preview Generator**  | `scripts/build-template-previews.ts` | ✅ Next.js only          |
| **Custom Protocol**    | `src/main/preview-protocol.ts`       | ✅ anyon-preview://      |
| **Template Utils**     | `src/ipc/utils/template_utils.ts`    | ✅ GitHub+Local fallback |
| **IPC Contracts**      | `src/ipc/types/templates.ts`         | ✅ Typed handlers        |
| **Design System Apps** | `preview-apps/preview-*/`            | ✅ 6 systems             |

---

## 📊 Current Image Strategy

**Template Cards Use**:

- `template.imageUrl` → External GitHub URL
- No dynamic generation (static images stored remotely)
- Fallback: First letter of title in background

**Design Systems Use**:

- SVG thumbnails (bundled)
- Served via `anyon-preview://` protocol

---

## 🔧 How to Add Preview Generation

### Step 1: Extend Registry Type

```typescript
// src/shared/templates.ts
interface Template {
  // ... existing fields
  screenshotUrl?: string; // ← ADD
  previewWidth?: number; // ← ADD
  previewHeight?: number; // ← ADD
}
```

### Step 2: Add Build-Time Generation

```typescript
// Modify: scripts/build-template-previews.ts
// Add after "Step 3/4":

log("Step 3.5/4: Generating screenshot");
// Use playwright/puppeteer to screenshot preview/index.html
// Save to: templates/{id}/screenshot.png
// Update registry with screenshotUrl
```

### Step 3: Update Registry Path (Optional)

```json
{
  "id": "nextjs-template",
  "imageUrl": "https://...",
  "screenshotUrl": "templates/nextjs-template/screenshot.png",
  "screenshots": ["..."]
}
```

### Step 4: Update UI Component

```typescript
// src/components/TemplateCard.tsx
<img
  src={template.screenshotUrl || template.imageUrl}
  alt={template.title}
/>
```

---

## 🏗️ Architecture Patterns

### Fetch Strategy Pattern

```
Try 1: GitHub raw URL
  ↓ (fail)
Try 2: Local filesystem
  ↓ (fail)
Return fallback/empty
```

**Used by**: `template_utils.ts` for HTML, registry, etc.

### Registry-Driven Pattern

```
Load single JSON source
  ↓
Validate entries against schemas
  ↓
Cache in memory (production only)
  ↓
Serve via IPC to renderer
```

**Used by**: `fetchTemplateRegistry()`

### IPC Handler Pattern

```typescript
defineContract({
  channel: "command-name",
  input: InputSchema,
  output: OutputSchema
})
→ createTypedHandler(contract, handlerFn)
→ Auto-registered via registerTemplateHandlers()
```

---

## 📁 Key Files to Know

| File                                 | Change Type | Purpose                        |
| ------------------------------------ | ----------- | ------------------------------ |
| `templates/registry.json`            | Extend      | Add new fields                 |
| `scripts/build-template-previews.ts` | Extend      | Add screenshot generation      |
| `src/shared/templates.ts`            | Extend      | Add new type fields            |
| `src/ipc/types/templates.ts`         | Maybe       | Add new contracts if on-demand |
| `src/components/TemplateCard.tsx`    | Update      | Use new image URLs             |

---

## 🚀 Implementation Paths

### Path A: Static Pre-Generated (Recommended)

1. Add screenshot generation to build script
2. Save PNG to `templates/{id}/screenshot.png`
3. Reference in registry JSON
4. Update TemplateCard component
5. **Pros**: Zero runtime cost, CDN-friendly
6. **Cons**: Build-time only, requires rebuild to refresh

### Path B: On-Demand Generation

1. Create new IPC handler: `generateTemplatePreview`
2. Use BrowserView/webContents to render HTML → PNG
3. Cache in userData directory
4. Expose via IPC to renderer
5. **Pros**: Dynamic, can regenerate without rebuild
6. **Cons**: Slower (first load), RAM/CPU during rendering

### Path C: Hybrid (Best of Both)

1. Pre-generate during build (Path A)
2. Add fallback to on-demand generation (Path B)
3. Check userData cache first
4. **Pros**: Fast for built templates, flexible for custom

---

## 🔐 Security Notes

**Custom Protocol** (`anyon-preview://`):

- ✅ Validates designSystemId against whitelist
- ✅ Path traversal protection
- ✅ CORS disabled
- ✅ Nonce validation (check `preview_server_manager.ts`)

**Template HTML**:

- Loaded from GitHub or local
- Served via IPC (string, no execution)
- Display-only (no postMessage integration)

---

## 🧪 Testing Points

If you add preview generation, test:

- [ ] Registry loads with new fields
- [ ] TemplateCard renders image
- [ ] Fallback shows when image missing
- [ ] GitHub CDN works (external URL)
- [ ] Local fallback works (offline)
- [ ] Cached images don't refetch
- [ ] Nonce changes on each preview open (security)

---

## 📚 Related Code References

**Template Flow**:

- Fetch registry: `src/ipc/handlers/template_handlers.ts:12`
- Render cards: `src/components/TemplateCard.tsx:27`
- Navigate detail: `src/routes/template-detail.tsx`

**Preview Apps**:

- Register protocol: `src/main/preview-protocol.ts:47`
- Get preview URL: `src/ipc/utils/preview_server_manager.ts:6`
- Use in component: `src/components/DesignSystemPreviewDialog.tsx`

**Caching**:

- Template content cache: `src/ipc/utils/template_utils.ts:16`
- Registry cache: `src/ipc/utils/template_utils.ts:14`

---

## ❌ What Does NOT Exist

- No automatic screenshot generation tool installed
- No image processing library (sharp, imagemagick)
- No puppeteer/playwright in dependencies
- No screenshotting API via electron

**If you need automatic generation**, you'll need to add:

```bash
npm install --save-dev playwright  # or puppeteer
# Update scripts/build-template-previews.ts to use it
```

---

## 🎓 Architecture Diagram

```
User sees Template Card
         ↓
   TemplateCard.tsx
         ↓
   template.screenshotUrl (or imageUrl fallback)
         ↓
   GitHub CDN or Local File
         ↓
   Browser displays image

------ IF ON-DEMAND ------
User clicks "Generate Preview"
         ↓
   generateTemplatePreview IPC
         ↓
   Main process: BrowserView renders HTML
         ↓
   Captures screenshot
         ↓
   Cache in userData/
         ↓
   Return to renderer
```
