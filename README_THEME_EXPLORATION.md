# Theme & Design System Architecture - Complete Exploration

## 📋 Overview

This directory contains comprehensive documentation for the Anyon Electron app's theme and design system architecture. These documents were created to help plan the integration of 50+ new themes from tweakcn.com.

## 📁 Documentation Files

### Start Here 👇

#### 1. **`THEME_EXPLORATION_SUMMARY.txt`** ⭐ **START HERE**

- **Type:** Text summary (80 KB)
- **Purpose:** Executive overview of the entire architecture
- **Time to read:** 15 minutes
- **Contains:**
  - Architecture layers (3-tier diagram)
  - Data model breakdown
  - Communication flow
  - Security model
  - Quick checklist for adding themes
  - Time estimates for 50+ themes

#### 2. **`THEME_QUICK_REFERENCE.md`**

- **Type:** Technical reference (12 KB)
- **Purpose:** One-page planning guide
- **Time to read:** 10 minutes
- **Contains:**
  - 3-layer architecture diagram
  - Data flow for preview button
  - DesignSystem data model reference
  - Preview app template checklist
  - Message protocol (parent ↔ iframe)
  - Build & deployment strategy
  - Sizing estimates for 50+ themes
  - Timeline estimates

#### 3. **`THEME_ARCHITECTURE_MAP.md`**

- **Type:** Complete technical spec (25 KB)
- **Purpose:** Deep dive into all components
- **Time to read:** 30 minutes
- **Contains:**
  - Detailed breakdown of all 5 core layers
  - DesignSystem interface (20 fields)
  - IPC contracts with Zod schemas
  - Handler implementations
  - Preview server manager logic
  - Protocol handler implementation
  - React hooks and components
  - Message flow diagrams
  - Integration points for new themes
  - CSS variable systems
  - Complete file organization

#### 4. **`THEME_FILES_INVENTORY.md`**

- **Type:** File-by-file reference (14 KB)
- **Purpose:** Detailed breakdown of every file
- **Time to read:** 20 minutes
- **Contains:**
  - 11 core system files documented
  - 10 UI integration files documented
  - Preview app template structure
  - Summary table of files to modify
  - Security considerations
  - Files that auto-update

---

## 🎯 Quick Start Paths

### Path 1: I have 15 minutes

1. Read `THEME_EXPLORATION_SUMMARY.txt` (sections 1-5)
2. Check "Quick checklist" (section 10)

### Path 2: I have 1 hour

1. Read `THEME_QUICK_REFERENCE.md` (entire)
2. Skim `THEME_ARCHITECTURE_MAP.md` (sections 1-4)
3. Review `THEME_FILES_INVENTORY.md` (section: "Files to modify")

### Path 3: I'm implementing themes

1. Read `THEME_ARCHITECTURE_MAP.md` (entire)
2. Review `THEME_FILES_INVENTORY.md` (entire)
3. Use as reference while coding

### Path 4: I'm planning the project

1. Read `THEME_EXPLORATION_SUMMARY.txt` (entire)
2. Study `THEME_QUICK_REFERENCE.md` (sections 7-9)
3. Reference `THEME_FILES_INVENTORY.md` (time estimates section)

---

## 🏗️ Architecture Summary (30 seconds)

```
┌─────────────────────────────────────────────────────┐
│         Themes Gallery (React UI)                   │
│  src/pages/themes.tsx                              │
└─────────────────┬───────────────────────────────────┘
                  │ IPC Request
                  ↓
┌─────────────────────────────────────────────────────┐
│    Main Process (Validation + URL Generation)      │
│  src/ipc/handlers/design_system_handlers.ts         │
│  src/ipc/utils/preview_server_manager.ts            │
│  Returns: anyon-preview://shadcn/index.html?nonce=  │
└─────────────────┬───────────────────────────────────┘
                  │ Custom Protocol
                  ↓
┌─────────────────────────────────────────────────────┐
│   anyon-preview:// Protocol Handler                │
│  src/main/preview-protocol.ts                       │
│  Serves: preview-{id}/dist/index.html              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│   Isolated Preview App (React/Vite)                │
│  preview-apps/preview-{id}/src/App.tsx             │
│  - Validates nonce                                  │
│  - Shows component registry                        │
│  - Handles navigation via postMessage              │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Data Model (20 fields)

Every design system needs:

```typescript
{
  // Identity (4)
  id, displayName, description, libraryName,

  // Visual (3)
  colorScheme: { primary, secondary, background },
  thumbnailPath, category,

  // Discovery (3)
  tags, tier, componentCount,

  // Technical (5)
  scaffoldDir, previewDir, defaultPlatform,
  componentStrategy, importPattern,

  // Availability (2)
  isBuiltin, isAvailable
}
```

---

## 🔧 To Add a New Theme

### 1. Create Preview App

```bash
cp -r preview-apps/preview-shadcn preview-apps/preview-{newid}
cd preview-apps/preview-{newid}
npm install
# Edit package.json, globals.css, previews/*.tsx
npm run build
```

### 2. Register Design System

```typescript
// In src/shared/designSystems.ts
DESIGN_SYSTEMS.push({
  id: "newid",
  displayName: "...",
  previewDir: "preview-newid", // ⚠️ MUST match folder name
  // ... 18 more fields
});
```

### 3. Test

```bash
npm run build
npm run dev
# Visit /themes page
```

---

## ⏱️ Time Estimates

| Task                          | Time       |
| ----------------------------- | ---------- |
| Add 1 theme manually          | 2-3 hours  |
| With template generator       | 30 minutes |
| Add 5 themes                  | 3 hours    |
| Add 50 themes with automation | 8-12 hours |

---

## 📌 Key Files You'll Touch

### Every Theme Needs:

- `preview-apps/preview-{id}/` — Entire folder (can be templated)
- `src/shared/designSystems.ts` — Add 1 DesignSystem object

### Auto-Updates (No Changes Needed):

- ✅ IPC contracts
- ✅ Protocol handler
- ✅ Handlers registry
- ✅ Preload allowlist

---

## 🔐 Security Features

1. **Nonce validation** — UUID per session, validates all messages
2. **Origin checking** — CORS-like protection for postMessage
3. **Path traversal protection** — Normalizes paths, prevents `..`
4. **Allowlist validation** — Only known themes can be previewed
5. **Iframe sandboxing** — Restricts preview app capabilities

---

## 💡 Scaling Recommendations

### Phase 1 (Foundation)

- Template generator script
- Config-driven registry (JSON/YAML)
- Parallel build system

### Phase 2 (Scaling)

- Lazy-load previews
- Bundle similar frameworks
- CDN delivery

### Phase 3 (Polish)

- Auto-component mapping
- Theme variations
- A/B testing

---

## ❌ Common Mistakes

- ❌ Forgetting `previewDir` must match folder name
- ❌ Building main app before rebuilding preview
- ❌ Not validating nonce in preview (security issue)
- ❌ Missing components in registry
- ❌ Not running `npm install` in new theme

---

## 📖 How to Read These Docs

**If you want to understand the architecture:**
→ Read `THEME_ARCHITECTURE_MAP.md` (sections 1-7)

**If you want to plan a 50+ theme project:**
→ Read `THEME_EXPLORATION_SUMMARY.txt` (sections 1-9)

**If you want to add a single theme:**
→ Read `THEME_QUICK_REFERENCE.md` + `THEME_FILES_INVENTORY.md`

**If you need file-by-file details:**
→ Read `THEME_FILES_INVENTORY.md` (entire)

---

## 🚀 Next Steps

1. ✅ Read one of the docs above
2. ✅ Review `src/shared/designSystems.ts` (6 examples)
3. ✅ Copy `preview-apps/preview-shadcn` as template
4. ✅ Create first new theme
5. ✅ Test at `/themes` page
6. ✅ Create template generator for automation

---

## 📞 Questions?

Refer to the corresponding section in the documentation:

- **What fields does DesignSystem need?** → `THEME_ARCHITECTURE_MAP.md` section 1
- **How does preview loading work?** → `THEME_QUICK_REFERENCE.md` section 2
- **What files should I modify?** → `THEME_FILES_INVENTORY.md`
- **How long will 50 themes take?** → `THEME_EXPLORATION_SUMMARY.txt` section 12
- **What security features exist?** → `THEME_EXPLORATION_SUMMARY.txt` section 6

---

Generated: March 2, 2026  
Project: Anyon Electron App  
Goal: 50+ theme integration from tweakcn.com
