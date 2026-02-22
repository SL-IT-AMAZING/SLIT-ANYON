# Design Systems Analysis - Complete Documentation Index

This directory now contains a comprehensive gap analysis for design systems selection in the Home '+' menu.

## 📋 Documents Included

### 1. **QUICK SUMMARY** (Start Here!)

📄 **File**: `DESIGN_SYSTEMS_QUICK_SUMMARY.md`

- **Best for**: Quick understanding, executive summary
- **Length**: ~400 lines
- **Contains**:
  - TL;DR status
  - File locations quick reference
  - Core issue explanation
  - Key constraints table
  - 3 actionable improvements
  - What's missing checklist

### 2. **DETAILED GAP ANALYSIS**

📄 **File**: `DESIGN_SYSTEMS_GAP_ANALYSIS.md`

- **Best for**: Comprehensive understanding, reference
- **Length**: ~600 lines
- **Contains**:
  - Full implementation breakdown
  - Theme vs Design Systems comparison table
  - Complete data flow explanation
  - 6 specific gaps identified with file refs
  - Root cause analysis
  - File reference map
  - Summary table: what's working vs not

### 3. **VISUAL TRACE DIAGRAM**

📄 **File**: `TRACE_DIAGRAM.txt`

- **Best for**: Understanding the complete flow visually
- **Length**: ASCII art diagram
- **Contains**:
  - 8-stage flow diagram from UI to template generation
  - Visual representation of all gaps
  - ASCII menu mockups showing issue vs solution
  - Key constraints highlighted

---

## 🎯 Quick Facts

| Aspect                          | Status                      |
| ------------------------------- | --------------------------- |
| Design systems in Home '+' menu | ✅ Exists                   |
| But they're discoverable        | ❌ Hidden in Themes submenu |
| Persisted to settings           | ✅ Yes                      |
| Passed to createApp             | ✅ Yes                      |
| Stored in database              | ✅ Yes                      |
| Can be changed later            | ❌ No                       |
| Has UI label                    | ❌ No                       |
| Has default value               | ❌ No                       |

---

## 🔍 Key Files to Know

### UI Layer

- `src/components/chat/AuxiliaryActionsMenu.tsx` - Design system selection UI (lines 21, 65, 74, 125-130, 220-250)
- `src/components/chat/HomeChatInput.tsx` - Renders menu
- `src/hooks/useDesignSystems.ts` - Fetches design systems

### Settings Layer

- `src/lib/schemas.ts` - UserSettingsSchema (line 295)
- `src/main/settings.ts` - Default values
- `src/ipc/types/settings.ts` - Settings IPC contract

### IPC Layer

- `src/ipc/types/app.ts` - CreateAppParamsSchema (lines 53-57)
- `src/ipc/handlers/app_handlers.ts` - createApp handler

### Home Page Flow

- `src/pages/home.tsx` - App creation (lines 134-137)
- `src/pages/home.tsx` - Theme application (lines 139-145)

---

## 📌 The 3 Main Issues

### 1. **Hidden UI** ❌

Design systems appear in the Themes submenu with no label:

- No "Design Systems" header
- Just listed after separator
- Users might not know they're there

### 2. **No Runtime Changes** ❌

`handleDesignSystemSelect()` returns early if `appId != null`

- Themes CAN be changed on existing apps
- Design systems CANNOT be changed
- Only applies at creation time

### 3. **No Default Value** ❌

Settings defaults to empty string `""`

- Should default to `"shadcn"` like themes do
- Creates undefined/inconsistent behavior

---

## 🛠️ Suggested Fixes (Complexity Order)

### 1. Add Menu Label (5 minutes)

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:220`

Add before design systems list:

```tsx
<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
  Design Systems
</div>
```

### 2. Set Default (2 minutes)

**File**: `src/main/settings.ts`

Change:

```ts
selectedDesignSystemId: "shadcn",  // Instead of ""
```

### 3. Allow Runtime Changes (Complex)

Would need:

- `setAppDesignSystem()` IPC handler
- Remove `if (appId != null) return;` check
- Update app record with new design system
- Consider if this makes sense post-creation

---

## 📊 Summary Statistics

- **Total files involved**: ~12
- **Key UI component**: 1 (AuxiliaryActionsMenu.tsx)
- **Lines of code affecting design systems**: ~50
- **Settings fields**: 1 (selectedDesignSystemId)
- **IPC handlers**: 1 (createApp)
- **Identifiable gaps**: 6

---

## ✅ What's Actually Working

The infrastructure is solid:

- [x] Design systems are fetched via hook
- [x] Selection is saved to settings
- [x] Value is persisted across app restarts
- [x] Passed to createApp IPC
- [x] Stored in app database
- [x] Applied during scaffold/template generation
- [x] Works perfectly at app creation time

---

## ❌ What's Missing

- [ ] UI discoverability (no menu label)
- [ ] Runtime mutability (can't change after creation)
- [ ] Sensible defaults (empty string vs actual choice)
- [ ] Parity with themes feature

---

## 🔗 Related Files

- Design system list: `src/shared/designSystems.ts`
- Design system prompts: `src/shared/designSystemPrompts.ts`
- Design system preview: `src/components/DesignSystemPreviewDialog.tsx`
- Design system gallery: `src/components/DesignSystemGallery.tsx`
- Create app dialog: `src/components/CreateAppDialog.tsx` (separate feature, also has design system UI)

---

## 📝 Notes

1. **Currently**, design systems ARE already selectable from Home '+' menu
2. **However**, they're not prominently displayed (hidden in Themes submenu)
3. **Additionally**, they can only be selected at app creation time, not changed later
4. **The infrastructure** is complete and working; the UX needs improvement

This is NOT a "missing feature" - it's a "poorly surfaced but functional feature."

---

## 🤔 Questions Answered

**Q: Where do users select design systems from Home menu?**
A: Inside the Themes submenu, lines 220-250 of AuxiliaryActionsMenu.tsx

**Q: Why can't they change design systems later?**
A: Handler has `if (appId != null) return;` - only works at creation time (appId = null)

**Q: Is the data persisted?**
A: Yes, in `settings.selectedDesignSystemId`

**Q: Is it passed to app creation?**
A: Yes, in `ipc.app.createApp({ designSystemId: ... })`

**Q: Is it stored in the database?**
A: Yes, in app record as `designSystemId` field

**Q: Why isn't it as obvious as themes?**
A: No menu label, hidden in submenu, no default value

---

## 📞 Contact

For questions about this analysis, refer to the detailed documents above or the file references included in each section.
