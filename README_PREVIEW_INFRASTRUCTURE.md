# Preview Infrastructure Documentation

## 📚 Documentation Suite

Three comprehensive guides have been created to help you understand and extend the preview infrastructure:

### 1. **PREVIEW_INFRASTRUCTURE_GUIDE.md** ⭐ START HERE
   - **What it covers:** Architecture decisions, implementation options, best practices
   - **Best for:** Understanding the "why" and making design decisions
   - **Length:** Comprehensive reference
   - **Key sections:**
     - Executive summary of two preview systems
     - Three options for template previews with pros/cons
     - Recommended architecture (extend anyon-preview://)
     - Security model and path resolution
     - Migration path from srcDoc to protocol

### 2. **PREVIEW_CODE_REFERENCE.md** 📖 TECHNICAL DETAILS
   - **What it covers:** Full code listings, implementation details, snippets
   - **Best for:** Implementation and reference
   - **Length:** Code-focused with detailed comments
   - **Key sections:**
     - Full `src/main/preview-protocol.ts` source
     - All integration points (Renderer, Main, Protocol)
     - Error scenarios and handling
     - Design system URL examples

### 3. **PREVIEW_VISUAL_MAP.md** 🎨 VISUAL GUIDES
   - **What it covers:** ASCII diagrams, flow charts, decision trees
   - **Best for:** Understanding flow and relationships
   - **Length:** Visual heavy
   - **Key sections:**
     - System architecture diagram
     - Request flow for both preview approaches
     - File organization tree
     - URL parsing decision flow
     - Security checks diagram
     - Memory comparison charts

---

## 🎯 Quick Answer Guide

**Q: Where is the protocol handler?**
A: `src/main/preview-protocol.ts` (100 lines)

**Q: How does the design system preview work?**
A: Electron protocol handler intercepts `anyon-preview://` URLs and serves files from `preview-apps/preview-{id}/dist/`

**Q: What about template previews?**
A: Currently uses srcDoc + IPC approach. Recommended to migrate to extended anyon-preview:// protocol.

**Q: Where are preview files stored?**
A: Dev: `preview-apps/preview-{id}/dist/` | Prod: `{resourcesPath}/preview-dists/preview-{id}/dist/`

**Q: How is security handled?**
A: Path traversal protection, ID whitelist, MIME type validation, resolved path boundary checks

**Q: What are the 3 options for template preview?**
A: 1. Extend anyon-preview:// (RECOMMENDED), 2. Keep srcDoc (legacy), 3. New anyon-template:// (isolated)

---

## 🗂️ File Quick Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/main/preview-protocol.ts` | 100 | Core protocol handler |
| `src/main.ts` | ~10 | Protocol registration |
| `src/ipc/utils/preview_server_manager.ts` | 29 | URL generation |
| `src/components/preview_panel/PreviewIframe.tsx` | 1456+ | Dev app preview |
| `src/pages/template-detail.tsx` | 234 | Template preview (srcDoc) |
| `src/ipc/types/templates.ts` | 300 | IPC contracts |
| `src/ipc/handlers/template_handlers.ts` | 28 | Handlers |
| `src/shared/designSystems.ts` | 184 | Design system config |

---

## 🚀 Getting Started (if implementing template preview)

### Step 1: Understand Current State
- Read **PREVIEW_INFRASTRUCTURE_GUIDE.md** sections on "How srcDoc Template Preview Works"
- Read **PREVIEW_VISUAL_MAP.md** section 3 to see flow diagram

### Step 2: Understand Target Architecture
- Read **PREVIEW_INFRASTRUCTURE_GUIDE.md** sections on "Recommended Implementation for Templates"
- Read **PREVIEW_CODE_REFERENCE.md** section 1 to see protocol implementation
- Review **PREVIEW_VISUAL_MAP.md** section 5 for URL parsing details

### Step 3: Implementation Plan
1. Design template ID schema and directory structure
2. Modify `src/main/preview-protocol.ts` to handle template URLs
3. Add template ID validation
4. Update `src/pages/template-detail.tsx` to use protocol URLs
5. Add tests for security and functionality

### Step 4: Reference as Needed
- For protocol specifics: **PREVIEW_CODE_REFERENCE.md**
- For security checks: **PREVIEW_VISUAL_MAP.md** section 6
- For error handling: **PREVIEW_CODE_REFERENCE.md** "Error Scenarios"

---

## 📋 Key Concepts

### anyon-preview:// Protocol
- Custom Electron protocol for serving pre-built apps
- Two-phase registration: `registerPreviewScheme()` before app.ready, `registerPreviewProtocol()` after
- Security: Path traversal protection, ID whitelist, MIME type validation
- Performance: Streams files from disk (no memory overhead)

### Design Systems (6 total)
```
["shadcn", "mui", "antd", "chakra", "mantine", "daisyui"]
```
Each has: `preview-{id}/dist/` with built Vite app

### Template Preview Options
| Approach | Memory | Scalable | Code |
|----------|--------|----------|------|
| **srcDoc (current)** | 40MB for 10MB file | ❌ No | Simple |
| **Extend anyon-preview://** | 1MB for 10MB file | ✅ Yes | Moderate |
| **New anyon-template://** | 1MB for 10MB file | ✅ Yes | More |

---

## 🔒 Security Features

✅ **Path Traversal Protection**
- Rejects `..` sequences
- Rejects absolute paths
- Validates resolved path stays in distRoot

✅ **ID Validation**
- Whitelist check against DESIGN_SYSTEM_IDS or TEMPLATE_IDS
- Returns 404 for unknown IDs

✅ **MIME Type Safety**
- Explicit whitelist of allowed types
- Defaults to `application/octet-stream` for unknown

✅ **Protocol Privileges**
- CORS disabled (`corsEnabled: false`)
- No dangerous permissions
- Treated as secure protocol (`secure: true`)

---

## 📊 Architecture Decision Matrix

**Choosing between 3 template preview options:**

| Factor | Extend anyon-preview:// | New anyon-template:// | Keep srcDoc |
|--------|----------------------|----------------------|-----------|
| **Code reuse** | ✅ Maximum | ❌ None | ✅ Already done |
| **Maintenance** | ✅ Single code path | ❌ Duplicate | ⚠️ Legacy |
| **Performance** | ✅ Streaming | ✅ Streaming | ❌ Memory |
| **Scalability** | ✅ Unlimited size | ✅ Unlimited size | ❌ ~100MB max |
| **Separation** | ⚠️ Mixed concerns | ✅ Isolated | ✅ Isolated |
| **Implementation effort** | ⭐⭐☆☆☆ | ⭐⭐⭐☆☆ | ⭐☆☆☆☆ |

**RECOMMENDATION: Extend anyon-preview://** ← Best balance of simplicity and capability

---

## 🔄 Request Flow Comparison

### srcDoc (Current)
```
Component → IPC Call → Main FS → Read Full File → IPC Response → State → srcDoc
Time: [IPC overhead + memory serialization]
```

### Protocol (Recommended)
```
Component → URL → Protocol Handler → FS Stream → Direct to iframe
Time: [Minimal overhead + parallel streaming]
```

---

## 📝 Testing Checklist

- [ ] Protocol scheme registration before app.ready()
- [ ] Protocol handler registration after app.ready()
- [ ] Design system/template ID validation
- [ ] Path traversal protection (reject `..`)
- [ ] Absolute path rejection (`/etc/passwd`)
- [ ] MIME type detection for all asset types
- [ ] Index.html fallback for SPA routing
- [ ] File not found returns 404
- [ ] Packaged app mode (resources path)
- [ ] Dev mode (preview-apps path)
- [ ] Security boundary enforcement

---

## 🎓 Learning Path

1. **If new to preview system:**
   - Read PREVIEW_INFRASTRUCTURE_GUIDE.md sections 1-3
   - Skim PREVIEW_VISUAL_MAP.md sections 1, 2, 4

2. **If implementing template preview:**
   - Read PREVIEW_INFRASTRUCTURE_GUIDE.md sections 4-7
   - Study PREVIEW_CODE_REFERENCE.md sections 1-2
   - Reference PREVIEW_VISUAL_MAP.md sections 5-6

3. **If debugging protocol issues:**
   - Check PREVIEW_VISUAL_MAP.md section 6 (Security tree)
   - Review PREVIEW_CODE_REFERENCE.md "Error Scenarios"
   - Trace through PREVIEW_VISUAL_MAP.md section 5 (URL parsing)

4. **If adding new asset types:**
   - Find MIME_TYPES in PREVIEW_CODE_REFERENCE.md section 1
   - Add to map and test

---

## 🔗 Related Files (Not Documented Here)

These files exist but are not focused in this guide:
- `src/ipc/ipc_host.ts` - Handler registration
- `src/preload.ts` - Channel whitelist
- `src/components/preview_panel/PreviewPanel.tsx` - Panel wrapper
- `src/atoms/previewAtoms.ts` - State management
- `preview-apps/*/package.json` - Build configs

---

## ❓ FAQ

**Q: Can I use anyon-preview:// for both design systems and templates?**
A: Yes! That's the recommended approach. Use hostname prefix: `anyon-preview://template-{id}/` vs `anyon-preview://preview-{id}/`

**Q: What happens if a template is 1GB?**
A: With protocol: no problem, streams fine. With srcDoc: application will freeze/crash (memory limit).

**Q: Can I serve from outside preview-apps/?**
A: Not recommended. The distRoot is intentionally fixed for security. Move files into preview-apps structure.

**Q: How do I test the protocol locally?**
A: Open DevTools in iframe and check Network tab. Requests to `anyon-preview://` should show as 200 responses.

**Q: What if I have symbolic links in preview-apps/?**
A: `path.resolve()` follows symlinks, but the boundary check should still work as long as the target is in distRoot.

**Q: Why two-phase protocol registration?**
A: Electron requires scheme registration before app.ready(). Handler registration must wait for app.ready().

---

## 📞 Questions or Issues?

Refer to the three documentation files:
1. **For design decisions:** PREVIEW_INFRASTRUCTURE_GUIDE.md
2. **For code details:** PREVIEW_CODE_REFERENCE.md
3. **For visual understanding:** PREVIEW_VISUAL_MAP.md

---

**Last Updated:** February 2025
**Status:** Complete documentation of existing infrastructure

