# Theme Menu Rendering & Design System Options - Documentation Index

**Generated**: 2026-02-20  
**Scope**: Complete rendering branch mapping for Home & Chat plus-menu Themes submenu  
**Status**: ✅ No edits made, read-only analysis complete

---

## 📋 Document Guide

### 1. **THEME_RENDERING_MAP.md** (COMPREHENSIVE)

**Purpose**: Exhaustive technical reference with every line number, condition, and guard  
**Use When**:

- Debugging rendering issues
- Code review
- Understanding data flow
- Adding new theme features

**Key Sections**:

- Complete rendering guard checklist (A-G)
- Data loading flow & hydration timing
- appId branch behavior
- Custom themes visibility computation
- Selection persistence & state management
- Test IDs for QA

**Length**: ~900 lines of detailed tables and explanations

---

### 2. **THEME_MENU_QUICK_REFERENCE.md** (PRACTICAL)

**Purpose**: Fast lookup for common questions and debugging  
**Use When**:

- Quick validation during testing
- Debugging why something isn't visible
- Looking up specific test IDs
- Checking edge cases

**Key Sections**:

- Guard quick lookup table
- Data hydration timeline
- Design system visibility matrix
- Common issues & debugging
- Edge cases
- Performance considerations
- Code review checklist

**Length**: ~400 lines, highly scannable

---

## 🎯 Quick Navigation by Question

### "Where does X render?"

→ See **THEME_MENU_QUICK_REFERENCE.md** → "Guard Quick Lookup" table

### "Why isn't Design System visible in Chat?"

→ See **THEME_MENU_QUICK_REFERENCE.md** → "Design System Visibility Matrix"  
→ Line 220: `appId == null &&` guards prevent chat visibility

### "How does custom theme visibility work?"

→ See **THEME_RENDERING_MAP.md** → "SECTION E: Custom Themes Section"  
→ Or **THEME_MENU_QUICK_REFERENCE.md** → "Custom Themes Visibility Logic"

### "What's the data loading order?"

→ See **THEME_MENU_QUICK_REFERENCE.md** → "Data Hydration Timeline"

### "Where's the appId branch logic?"

→ See **THEME_RENDERING_MAP.md** → "RENDERING CONTEXT: appId Branch"  
→ Or **THEME_MENU_QUICK_REFERENCE.md** → "Design System Visibility Matrix"

### "How do I test if Design Systems work?"

→ See **THEME_MENU_QUICK_REFERENCE.md** → "Common Issues & Debugging"  
→ Or **THEME_RENDERING_MAP.md** → "TEST IDS (For QA/Testing)"

---

## 🔍 Core Findings Summary

### Design System Options Rendering Rules

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx`  
**Critical Line**: **220**

```typescript
{appId == null && designSystems.length > 0 && (
  // Design System section renders ONLY here
)}
```

### Visibility Decision Tree

```
PAGE TYPE
├─ HOME PAGE (appId = undefined)
│  ├─ Design Systems exist? (designSystems.length > 0)
│  │  ├─ YES → Design System options VISIBLE ✅
│  │  └─ NO → Design System section hidden
│  └─ Theme options → ALWAYS visible
│
└─ CHAT PAGE (appId = number)
   ├─ Design System options → HIDDEN ❌
   └─ Theme options → VISIBLE ✅
```

### Option Visibility Summary

| Component                 | Home     | Chat   | Guard                     |
| ------------------------- | -------- | ------ | ------------------------- |
| No Theme                  | ✅       | ✅     | None                      |
| Builtin Themes            | ✅       | ✅     | themes?.map()             |
| **Design System Section** | **✅\*** | **❌** | **appId==null && len>0**  |
| **Design System Options** | **✅\*** | **❌** | **appId==null && len>0**  |
| Custom Themes             | ✅\*     | ✅\*   | visibleCustomThemes.len>0 |
| More Themes               | ✅\*     | ✅\*   | customThemes.len>4        |
| Create Custom Theme       | ✅       | ✅     | None                      |

**Legend**: `*` = requires data loaded and non-empty

---

## 📊 Data Dependencies

### Query Loading Order (Timeline)

```
T+0ms:     ├─ Builtin themes (placeholder loaded immediately)
           │
T+20ms:    ├─ Settings hydrated (selectedThemeId, selectedDesignSystemId)
           │
T+100ms:   ├─ Custom themes fetched
           ├─ Design systems fetched
           │
T+chat:    └─ App theme fetched (only if appId exists, enabled: !!appId)
```

### Hook Defaults & Risks

| Hook             | Default | Placeholder   | Risk   | Impact                 |
| ---------------- | ------- | ------------- | ------ | ---------------------- |
| useThemes        | —       | ✅ themesData | Low    | Renders immediately    |
| useCustomThemes  | []      | ❌ None       | Medium | Hidden until loaded    |
| useDesignSystems | []      | ❌ None       | Medium | Hidden until loaded    |
| useAppTheme      | null    | ❌ None       | Low    | Only in chat           |
| useSettings      | null    | ❌ None       | High   | Affects all selections |

---

## 🎛️ State Management

### Where Selections Are Stored

| Setting                | Storage     | Type         | Key                    | Update Method              |
| ---------------------- | ----------- | ------------ | ---------------------- | -------------------------- |
| Default Theme (Home)   | Settings DB | string       | selectedThemeId        | updateSettings()           |
| Default Design System  | Settings DB | string       | selectedDesignSystemId | updateSettings()           |
| App Theme (Chat)       | App record  | string\|null | —                      | ipc.template.setAppTheme() |
| Current Selection (UI) | Memory      | computed     | currentThemeId         | User interaction           |

### Key Variables

**currentThemeId** (Line 72-73 in AuxiliaryActionsMenu)

```typescript
const currentThemeId =
  appId != null ? appThemeId : settings?.selectedThemeId || null;
```

- Home: Uses settings theme
- Chat: Uses app-specific theme

**currentDesignSystemId** (Line 74)

```typescript
const currentDesignSystemId = settings?.selectedDesignSystemId || null;
```

- Always from settings (never app-specific)

---

## 🧪 Testing & QA

### Test ID Naming Convention

```
theme-option-${id}                      # Built-in: theme-option-builtin-light
theme-option-custom:${id}               # Custom: theme-option-custom:5
design-system-option-${id}              # Design System: design-system-option-xyz
design-system-option-none               # No Design System option
all-custom-themes-option                # More Themes button
create-custom-theme                     # Create Custom Theme button
theme-option-none                       # No Theme option
```

### Critical Test Scenarios

1. **Design System Visibility**
   - ✅ Visible on Home page
   - ❌ Hidden on Chat page
   - ✅ Hidden if no design systems exist

2. **Custom Themes Limiting**
   - Max 4 visible (selected + 3 others)
   - "More Themes" appears if > 4 total
   - Selected theme always included

3. **Selection Persistence**
   - Home: Settings saved, restored on reload
   - Chat: Per-app, restored with app
   - Custom: Format `custom:${id}` preserved

---

## 🚨 Critical Code Sections

### Must-Watch Lines

| File                 | Line(s) | What                        | Why                                          |
| -------------------- | ------- | --------------------------- | -------------------------------------------- |
| AuxiliaryActionsMenu | 220     | `appId == null &&` guard    | Controls Design System visibility            |
| AuxiliaryActionsMenu | 72-74   | currentThemeId logic        | Determines what's selected                   |
| AuxiliaryActionsMenu | 77-98   | visibleCustomThemes useMemo | Custom theme limiting logic                  |
| AuxiliaryActionsMenu | 103-112 | Theme selection handler     | Branches on appId                            |
| ChatInput            | 496     | appId prop pass             | Enables app-specific behavior                |
| home.tsx             | 136     | designSystemId on create    | Applies design system to new app             |
| useSettings          | 34-47   | Settings hydration          | Loads selectedThemeId/selectedDesignSystemId |
| useAppTheme          | 13      | enabled: !!appId            | Query guard                                  |

---

## ✅ Confidence Checklist: Design System Features

- [x] Guards prevent chat visibility (`appId == null`)
- [x] Guards require design systems exist (`designSystems.length > 0`)
- [x] Selection stored in settings (`selectedDesignSystemId`)
- [x] Selection applied only on home
- [x] Applied to new apps on creation (home.tsx line 136)
- [x] No app-specific design system (only theme)
- [x] Separator renders before section
- [x] Icons render correctly (`<Blocks>`)
- [x] Test IDs present for QA (`design-system-option-*`)
- [x] Data loads after settings hydration

---

## 🎓 How to Use These Docs

### For Understanding

1. Start with **THEME_MENU_QUICK_REFERENCE.md**
2. Drill into **THEME_RENDERING_MAP.md** sections as needed
3. Cross-reference specific line numbers in source

### For Debugging

1. Go to **THEME_MENU_QUICK_REFERENCE.md** → "Common Issues & Debugging"
2. Find your symptom
3. Follow the troubleshooting steps
4. Reference source lines from main map if needed

### For Testing

1. Use test ID table in **THEME_RENDERING_MAP.md**
2. Reference visibility matrix in **THEME_MENU_QUICK_REFERENCE.md**
3. Run edge cases listed in "Edge Cases" section

### For Code Review

1. Check **THEME_MENU_QUICK_REFERENCE.md** → "Code Review Checklist"
2. Verify all lines in "Lines to Watch" table
3. Ensure guards are correct and data flows properly

---

## 📝 Notes & Known Issues

### Known Behaviors (Not Bugs)

1. **Custom Themes Limited to 4 Visible**
   - Design: Show selected + 3 others
   - Reason: UI space constraints
   - Solution: "More Themes" opens full list

2. **Design Systems Hidden in Chat**
   - Design: Chat uses per-app themes only
   - Reason: Design systems are account defaults for NEW apps
   - Impact: Can't change design system of existing app

3. **Settings Hydration Delay**
   - Design: useSettings loads asynchronously
   - Impact: Selection may not show immediately
   - Mitigated by: Placeholder data for themes

### Areas for Future Enhancement

- Loading skeleton for design systems section
- Search/filter for many custom themes
- Design system per-app customization
- Theme inheritance system

---

## 📞 Questions?

Refer to the appropriate document:

- **Quick answer needed?** → THEME_MENU_QUICK_REFERENCE.md
- **Need all details?** → THEME_RENDERING_MAP.md
- **Debugging issue?** → THEME_MENU_QUICK_REFERENCE.md → "Common Issues"

---

**Last Updated**: 2026-02-20  
**Scope**: `src/components/chat/AuxiliaryActionsMenu.tsx`, `src/pages/home.tsx`, `src/pages/chat.tsx`, and related hooks  
**Status**: Complete - No modifications made, analysis only
