# Preview Apps Documentation Index

## 📖 Start Here

**New to preview apps?** Follow this reading order:

1. **[README.md](./README.md)** ← Start here (2 min read)
   - What preview apps are
   - Quick start guide
   - Component showcase
   - Theme examples

2. **[PREVIEW_APPS_QUICK_REF.md](./PREVIEW_APPS_QUICK_REF.md)** (5 min read)
   - File paths and structure
   - Theme configuration for each framework
   - Build and development commands
   - Troubleshooting checklist

3. **[PREVIEW_APPS_ARCHITECTURE.md](./PREVIEW_APPS_ARCHITECTURE.md)** (10 min read)
   - Full system architecture
   - How themes flow into apps
   - Component registry pattern
   - PostMessage security protocol
   - Build process details

4. **[PREVIEW_APPS_MANIFEST.md](./PREVIEW_APPS_MANIFEST.md)** (10 min read)
   - Complete file structure with paths
   - Each file's purpose and size
   - Concrete code examples
   - Implementation patterns

---

## 🎯 Find What You Need

### Theme Configuration

- **shadcn/ui (CSS Variables)** → [QUICK_REF.md §2](./PREVIEW_APPS_QUICK_REF.md#2-theme-configuration-quick-start)
- **Ant Design (JS Config)** → [QUICK_REF.md §2](./PREVIEW_APPS_QUICK_REF.md#2-theme-configuration-quick-start)
- **Chakra/MUI/Mantine (JS Theme)** → [QUICK_REF.md §2](./PREVIEW_APPS_QUICK_REF.md#2-theme-configuration-quick-start)
- **DaisyUI (Tailwind Plugin)** → [QUICK_REF.md §2](./PREVIEW_APPS_QUICK_REF.md#2-theme-configuration-quick-start)

### Build & Deployment

- **How to develop** → [QUICK_REF.md §5](./PREVIEW_APPS_QUICK_REF.md#5-build--development)
- **How to build** → [QUICK_REF.md §5](./PREVIEW_APPS_QUICK_REF.md#5-build--development)
- **Complete build process** → [ARCHITECTURE.md §5](./PREVIEW_APPS_ARCHITECTURE.md#5-build-process)

### Component Registry

- **What it is** → [ARCHITECTURE.md §2](./PREVIEW_APPS_ARCHITECTURE.md#2-component-registry--composition-pattern)
- **How to add components** → [QUICK_REF.md §8](./PREVIEW_APPS_QUICK_REF.md#8-adding-a-new-preview-component)
- **Code example** → [MANIFEST.md §4](./PREVIEW_APPS_MANIFEST.md#4-key-file-roles)

### PostMessage Communication

- **Full protocol** → [ARCHITECTURE.md §8](./PREVIEW_APPS_ARCHITECTURE.md#8-postmessage-communication-protocol)
- **Quick reference** → [QUICK_REF.md §4](./PREVIEW_APPS_QUICK_REF.md#4-postmessage-api)

### Integration with 50+ Themes

- **Strategy** → [README.md](./README.md#-integration-with-50-themes)
- **Detailed plan** → [ARCHITECTURE.md §12](./PREVIEW_APPS_ARCHITECTURE.md#12-integration-with-50-themes-your-use-case)
- **Example code** → [README.md](./README.md#example-dynamic-theme-loading)

### File Paths & Structure

- **Quick lookup** → [QUICK_REF.md §1](./PREVIEW_APPS_QUICK_REF.md#1-file-paths--structure)
- **Complete structure** → [MANIFEST.md §1](./PREVIEW_APPS_MANIFEST.md#1-directory-structure-with-concrete-paths)
- **All actual paths** → [MANIFEST.md §9](./PREVIEW_APPS_MANIFEST.md#9-actual-file-paths-quick-copy-paste-reference)

### Dark Mode

- **Implementation** → [README.md §Dark Mode](./README.md#-dark-mode)
- **Per-framework** → [QUICK_REF.md §9](./PREVIEW_APPS_QUICK_REF.md#9-theme-switching-at-runtime)

### Troubleshooting

- **Common issues** → [README.md §Troubleshooting](./README.md#-troubleshooting)
- **Quick fixes** → [QUICK_REF.md §10](./PREVIEW_APPS_QUICK_REF.md#10-troubleshooting)

---

## 📊 Quick Facts

### Apps & Frameworks

- 6 independent preview applications
- All use Vite + React 18
- Build time: ~2 seconds each
- Bundle size: 150-300 KB JS, 30-50 KB CSS

### Theme Systems

- **CSS Variables:** shadcn/ui, DaisyUI
- **JS Theme Objects:** Ant Design, Chakra, MUI, Mantine

### Components Showcased

1. Overview (gallery)
2. Buttons (variants, sizes, states)
3. Inputs (forms, fields)
4. Cards (containers)
5. Dialogs (modals)
6. Tables (data)
7. Navigation (tabs, menus)
8. Feedback (badges, alerts)

### Security

- PostMessage with origin validation
- Nonce verification
- Works across iframe boundaries

---

## 🚀 Common Tasks

### "I want to develop a preview app locally"

→ [QUICK_REF.md §5](./PREVIEW_APPS_QUICK_REF.md#5-build--development)

```bash
cd preview-apps/preview-shadcn
npm install
npm run dev
```

### "I want to understand how themes work"

→ [ARCHITECTURE.md §6](./PREVIEW_APPS_ARCHITECTURE.md#6-how-themes-flow-into-preview-apps)

### "I want to add a new component to showcase"

→ [QUICK_REF.md §8](./PREVIEW_APPS_QUICK_REF.md#8-adding-a-new-preview-component)

### "I want to change the theme colors"

→ [README.md §Theme Configuration Examples](./README.md#-theme-configuration-examples)

### "I want to integrate 50+ themes"

→ [ARCHITECTURE.md §12](./PREVIEW_APPS_ARCHITECTURE.md#12-integration-with-50-themes-your-use-case)

### "I need to find a specific file"

→ [MANIFEST.md §9](./PREVIEW_APPS_MANIFEST.md#9-actual-file-paths-quick-copy-paste-reference)

### "Something is broken, help!"

→ [README.md §Troubleshooting](./README.md#-troubleshooting)

---

## 📚 Document Sizes & Reading Time

| Document        | Size   | Time   | Best For               |
| --------------- | ------ | ------ | ---------------------- |
| README.md       | 8.5 KB | 2 min  | Overview, quick start  |
| QUICK_REF.md    | 11 KB  | 5 min  | Fast lookups, commands |
| ARCHITECTURE.md | 17 KB  | 10 min | Understanding systems  |
| MANIFEST.md     | 18 KB  | 10 min | File reference, code   |

**Total reading time: ~27 minutes** for complete understanding

---

## 🔑 Key Concepts

### Component Registry Pattern

```typescript
// File: src/previews/index.ts
export const componentRegistry: PreviewComponent[] = [
  {
    id: "buttons",
    name: "Buttons",
    category: "actions",
    component: ButtonPreview,
  },
  // ... 7 more
];
```

### Theme Flow (Example: shadcn/ui)

```
CSS Variables (--primary: 222.2 47.4% 11.2%)
  ↓
Tailwind Config (hsl(var(--primary)))
  ↓
Component Classes (bg-primary)
  ↓
Compiled CSS
  ↓
Browser Renders
```

### PostMessage Pattern

```javascript
// Parent sends
iframe.postMessage({ type: "NAVIGATE_COMPONENT", componentId: "buttons" })

// App sends back
window.parent.postMessage({ type: "PREVIEW_READY", components: [...] })
```

---

## 💡 Tips

1. **Start simple** — Read README.md first, don't skip ahead
2. **Use Quick Ref** — It's organized by task, not concept
3. **Check MANIFEST** — When you need exact file paths
4. **Search within docs** — Ctrl+F for specific topics
5. **Keep Architecture open** — For deep understanding when needed

---

## ✅ Verification Checklist

After reading documentation, you should understand:

- [ ] What are the 6 preview apps and their frameworks
- [ ] How to run a preview app in development (`npm run dev`)
- [ ] How to build a preview app (`npm run build`)
- [ ] Where theme configuration is stored (framework-specific)
- [ ] How components are registered and displayed
- [ ] How PostMessage security works
- [ ] How to add a new component to showcase
- [ ] How CSS variables/JS themes flow into components
- [ ] How dark mode is implemented per framework
- [ ] Strategy for integrating 50+ themes

If you can answer all of these, you're ready to work with preview apps! 🎯

---

## 📞 Still Have Questions?

1. Check the [Troubleshooting](./README.md#-troubleshooting) section
2. Search documentation using Ctrl+F
3. Look up specific framework docs (see Additional Resources in README.md)
4. Check the code files directly (they're well-commented)

---

Last updated: March 2, 2025
Documentation version: 1.0
