# Theme Submenu Rendering Branches - Complete Map

## EXECUTIVE SUMMARY

This document maps **every conditional guard** that determines visibility of menu options in the Themes submenu across Home and Chat plus-menu contexts.

---

## COMPONENT STRUCTURE

### Primary Rendering Locations

1. **Home Page**: `src/pages/home.tsx` (lines 43-313)
   - Uses `HomeChatInput` (line 217)
2. **Chat Page**: `src/pages/chat.tsx` (lines 20-144)
   - Renders `ChatPanel` → `ChatInput` (line 188)

3. **Menu Components**:
   - `HomeChatInput.tsx` (lines 1-163) - renders `AuxiliaryActionsMenu` (line 153)
   - `ChatInput.tsx` (lines 1-1035) - renders `AuxiliaryActionsMenu` (line 492)
   - **`AuxiliaryActionsMenu.tsx` (lines 42-412)** - THE PRIMARY LOGIC

---

## DATA LOADING FLOW & HYDRATION TIMING

### Settings Hydration (useSettings hook)

**File**: `src/hooks/useSettings.ts` (lines 22-93)

| Aspect             | Details                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Initial Load**   | Lines 29-56: `loadInitialData()` runs on mount via `useEffect`                     |
| **Loading State**  | `loading: true` during fetch (line 30)                                             |
| **Fetch Target**   | `ipc.settings.getUserSettings()` (line 34)                                         |
| **Atom Update**    | `setSettingsAtom(userSettings)` (line 47)                                          |
| **Key Fields**     | `selectedThemeId` (optional string) and `selectedDesignSystemId` (optional string) |
| **Default Values** | Both default to `undefined` if not in settings (lines 294-295 in schemas.ts)       |
| **Store Format**   | Empty string `""` stored in DB for "no theme" (line 116 in AuxiliaryActionsMenu)   |

**Critical Timing**: Settings can be `null/undefined` during initial mount until `useSettings()` completes hydration.

### Theme Data Hydration (useThemes hook)

**File**: `src/hooks/useThemes.ts` (lines 6-23)

| Aspect          | Details                                                       |
| --------------- | ------------------------------------------------------------- |
| **Query Key**   | `queryKeys.themes.all`                                        |
| **Fetch**       | `ipc.template.getThemes()` (line 10)                          |
| **Placeholder** | `themesData` (builtin themes) - RETURNS IMMEDIATELY (line 12) |
| **Return**      | `themes: query.data` (builtin theme objects)                  |
| **Default**     | Non-null on first render (placeholder data available)         |

### Custom Themes Hydration (useCustomThemes hook)

**File**: `src/hooks/useCustomThemes.ts` (lines 16-33)

| Aspect          | Details                                                              |
| --------------- | -------------------------------------------------------------------- |
| **Query Key**   | `queryKeys.customThemes.all`                                         |
| **Fetch**       | `ipc.template.getCustomThemes()` (line 20)                           |
| **Placeholder** | None - waits for IPC response                                        |
| **Return**      | `customThemes: query.data ?? []` (line 28) - defaults to empty array |
| **Default**     | Empty array `[]` until first response                                |

### Design Systems Hydration (useDesignSystems hook)

**File**: `src/hooks/useDesignSystems.ts` (lines 5-21)

| Aspect          | Details                                                               |
| --------------- | --------------------------------------------------------------------- |
| **Query Key**   | `queryKeys.designSystems.all`                                         |
| **Fetch**       | `ipc.designSystem.getDesignSystems()` (line 9)                        |
| **Placeholder** | None - waits for IPC response                                         |
| **Return**      | `designSystems: query.data ?? []` (line 17) - defaults to empty array |
| **Default**     | Empty array `[]` until first response                                 |

### App Theme Hydration (useAppTheme hook)

**File**: `src/hooks/useAppTheme.ts` (lines 5-27)

| Aspect        | Details                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Query Key** | `queryKeys.appTheme.byApp({ appId })`                                |
| **Fetch**     | `ipc.template.getAppTheme({ appId: appId! })` (line 11)              |
| **Enabled**   | `enabled: !!appId` - ONLY runs if appId is truthy (line 13)          |
| **Default**   | `themeId: query.data ?? null` (line 23) - null when disabled/loading |
| **Timing**    | Does NOT fetch when `appId` is `undefined` or `null`                 |

---

## RENDERING CONTEXT: appId Branch

### Context 1: HOME PAGE (no appId)

**File**: `src/pages/home.tsx` (line 217)

```
HomeChatInput
  └── AuxiliaryActionsMenu
      └── appId = undefined (not passed)
```

**AuxiliaryActionsMenu.tsx line 58**: `appId` is destructured parameter
**No appId passed from home.tsx**, so `appId === undefined`

### Context 2: CHAT PAGE (with appId)

**File**: `src/pages/chat.tsx` → `ChatPanel` → `ChatInput`

**Flow**:

1. `ChatInput.tsx` line 96: `const appId = useAtomValue(selectedAppIdAtom);`
2. `ChatInput.tsx` line 496: `appId={appId ?? undefined}` passed to `AuxiliaryActionsMenu`
3. `AuxiliaryActionsMenu.tsx` line 58: receives `appId` parameter

**appId Value**:

- Set in atoms when app is selected (line 116-117 in home.tsx)
- Read from `selectedAppIdAtom` in chat context
- Can be `number` (when app selected) or `null` (before selection)

---

## COMPLETE RENDERING GUARD CHECKLIST

### SECTION A: "No Theme" Option

**File**: `AuxiliaryActionsMenu.tsx` lines 179-191
**Rendered**: ALWAYS

| Condition          | Status             | Notes                          |
| ------------------ | ------------------ | ------------------------------ |
| Visible            | ✅ Always          | No guards                      |
| Selected Highlight | Lines 181, 187-189 | When `currentThemeId === null` |
| Data Dependency    | None               | No query dependency            |

---

### SECTION B: Built-in Themes

**File**: `AuxiliaryActionsMenu.tsx` lines 193-218
**Rendered**: CONDITIONAL

| Line | Condition                     | Status                      | Explanation                                           |
| ---- | ----------------------------- | --------------------------- | ----------------------------------------------------- |
| 194  | `themes?.map()`               | Rendered if `themes` truthy | Uses `useThemes()` hook (line 63)                     |
|      | Default Value                 | ✅ Safe                     | Placeholder `themesData` = builtin themes, never null |
|      | Query Loading                 | N/A                         | Has immediate placeholder                             |
| 195  | `currentThemeId === theme.id` | Selection comparison        | Works in both home & chat contexts                    |
| 201  | `data-testid`                 | Always set                  | Uses stable `theme.id`                                |

**Guard Summary**:

- ✅ **Always renders** (placeholder ensures `themes` is never null)
- Builtin themes available immediately on first render
- Selection state works correctly in both appId contexts

---

### SECTION C: Design System "None" Option

**File**: `AuxiliaryActionsMenu.tsx` lines 220-235
**Rendered**: CONDITIONAL ON appId

| Line | Condition                  | Status        | Guards                             |
| ---- | -------------------------- | ------------- | ---------------------------------- |
| 220  | `appId == null &&`         | ✅ HOME only  | Explicitly checks `appId == null`  |
| 220  | `designSystems.length > 0` | ✅ Data guard | Only shows if design systems exist |
| 225  | Selection highlight        | Lines 231-233 | `currentDesignSystemId === null`   |

**Guard Summary**:

- ✅ **HOME ONLY** (appId must be `null` or `undefined`)
- ✅ **DATA GUARD**: `designSystems.length > 0` prevents rendering empty section
- ❌ **HIDDEN IN CHAT** (appId is a number, line 126-129 prevents updates)

---

### SECTION D: Design System Options (Builtin)

**File**: `AuxiliaryActionsMenu.tsx` lines 236-261
**Rendered**: CONDITIONAL ON appId

| Line | Condition                                              | Status          | Guards                                      |
| ---- | ------------------------------------------------------ | --------------- | ------------------------------------------- |
| 220  | Parent: `appId == null &&`                             | ✅ HOME only    | Inherits parent guard                       |
| 220  | Parent: `designSystems.length > 0`                     | ✅ Data guard   | Inherits parent guard                       |
| 236  | `designSystems.map()`                                  | Nested map      | Iterates when conditions true               |
| 238  | Selection: `currentDesignSystemId === designSystem.id` | Works correctly | Compares `settings?.selectedDesignSystemId` |

**Guard Summary**:

- ✅ **HOME ONLY** (inherits `appId == null` check from line 220)
- ✅ **DATA GUARD**: Only renders if `designSystems.length > 0`
- ❌ **HIDDEN IN CHAT** (appId prevents entire section)
- Selection works correctly via `settings?.selectedDesignSystemId`

---

### SECTION E: Custom Themes Section (Limited, up to 4 visible)

**File**: `AuxiliaryActionsMenu.tsx` lines 265-294
**Rendered**: CONDITIONAL

| Line  | Condition                                                                | Status               | Explanation                                 |
| ----- | ------------------------------------------------------------------------ | -------------------- | ------------------------------------------- |
| 77-98 | Visibility compute                                                       | useMemo              | Lines 77-98 calculate `visibleCustomThemes` |
| 77-98 | Logic                                                                    | See subsection below | MAX_VISIBLE = 4 (selected + 3 others)       |
| 100   | `hasMoreCustomThemes = customThemes.length > visibleCustomThemes.length` | Line 100             | Computed for "More themes" option           |
| 266   | `visibleCustomThemes.length > 0`                                         | ✅ Guard             | Only render section if custom themes exist  |
| 269   | `visibleCustomThemes.map()`                                              | Iterates             | Maps up to 4 custom themes                  |
| 271   | Theme ID format                                                          | `custom:${theme.id}` | Prefixed custom ID                          |
| 271   | Selection: `currentThemeId === themeId`                                  | Works both contexts  | Compares string format                      |

**Guard Summary**:

- ✅ **VISIBILITY GUARD**: Entire section hidden if `visibleCustomThemes.length === 0`
- ✅ **WORKS IN BOTH CONTEXTS** (home & chat)
- ⚠️ **MAX 4 VISIBLE**: Limited to selected custom theme + 3 others
- ✅ **SELECTION WORKS**: String format `custom:${id}` stored and compared

#### Custom Themes Visibility Computation (useMemo, lines 77-98)

| Step | Logic                                                                             | Line  | Result                                                      |
| ---- | --------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------- |
| 1    | `selectedCustomTheme = customThemes.find(t => custom:${t.id} === currentThemeId)` | 81-83 | Found if currently selected custom theme                    |
| 2    | `otherCustomThemes = customThemes.filter(t => custom:${t.id} !== currentThemeId)` | 84-86 | All custom themes except selected                           |
| 3    | Result array starts empty                                                         | 88    | `const result = []`                                         |
| 4    | Add selected theme first                                                          | 89-91 | `if (selectedCustomTheme) result.push(selectedCustomTheme)` |
| 5    | Add up to N others                                                                | 94-95 | `remaining = MAX_VISIBLE - result.length` = up to 3         |
|      |                                                                                   | 95    | `result.push(...otherCustomThemes.slice(0, remaining))`     |
| 6    | Return array                                                                      | 97    | Max 4 custom themes                                         |

**Dependency**: `[customThemes, currentThemeId]` (line 98)

- Recomputes when custom themes list changes
- Recomputes when selected theme changes

---

### SECTION F: "More Themes" Option

**File**: `AuxiliaryActionsMenu.tsx` lines 297-314
**Rendered**: CONDITIONAL

| Line | Condition                      | Status                 | Explanation                                                              |
| ---- | ------------------------------ | ---------------------- | ------------------------------------------------------------------------ |
| 297  | `hasMoreCustomThemes`          | ✅ Guard               | Computed at line 100: `customThemes.length > visibleCustomThemes.length` |
|      | Meaning                        | 4 visible + more exist | Only show if MORE custom themes exist beyond the 4 visible               |
| 300  | `setIsOpen(false)`             | Action                 | Closes dropdown menu                                                     |
| 301  | `setAllThemesDialogOpen(true)` | Action                 | Opens full custom themes dialog                                          |

**Guard Summary**:

- ✅ **GUARD**: Only shown if `customThemes.length > 4`
- ✅ **WORKS BOTH CONTEXTS** (home & chat)
- Opens dedicated "All Custom Themes" dialog

---

### SECTION G: Create Custom Theme Option

**File**: `AuxiliaryActionsMenu.tsx` lines 316-332
**Rendered**: ALWAYS

| Line    | Condition                   | Status        | Notes                                          |
| ------- | --------------------------- | ------------- | ---------------------------------------------- |
| 317-332 | No conditions               | ✅ Always     | Always visible, wrapped in empty fragment `<>` |
| 320     | `handleCreateCustomTheme()` | Action        | Opens `CustomThemeDialog`                      |
|         | Dialog Control              | Lines 362-369 | Opens when `customThemeDialogOpen` is true     |

**Guard Summary**:

- ✅ **ALWAYS VISIBLE** in both contexts
- Works in both home & chat
- Auto-selects newly created theme

---

## THEME SELECTION LOGIC (Render Impact)

### Current Theme ID Determination

**File**: `AuxiliaryActionsMenu.tsx` lines 70-74

```typescript
// Line 70-73: Core Logic
const currentThemeId =
  appId != null ? appThemeId : settings?.selectedThemeId || null;
const currentDesignSystemId = settings?.selectedDesignSystemId || null;
```

| Scenario                     | appId       | Behavior      | Value Source                          |
| ---------------------------- | ----------- | ------------- | ------------------------------------- |
| **HOME page**                | `undefined` | Use settings  | `settings?.selectedThemeId \|\| null` |
| **CHAT page (no app)**       | `null`      | Use settings  | `settings?.selectedThemeId \|\| null` |
| **CHAT page (app selected)** | `number`    | Use app theme | `appThemeId` from hook                |
| **Fallback**                 | N/A         | No theme      | `null`                                |

### appThemeId Loading (useAppTheme hook)

**File**: `useAppTheme.ts` lines 5-27

| appId       | enabled? | Fetches? | Value                         |
| ----------- | -------- | -------- | ----------------------------- |
| `undefined` | ❌ No    | ❌ No    | `null` (from line 23 default) |
| `null`      | ❌ No    | ❌ No    | `null`                        |
| `number`    | ✅ Yes   | ✅ Yes   | IPC result or `null`          |

**Critical**: When appId is falsy, hook never fetches, `appThemeId = null`

---

## DESIGN SYSTEM SELECTION LOGIC

### Current Design System ID Determination

**File**: `AuxiliaryActionsMenu.tsx` line 74

```typescript
const currentDesignSystemId = settings?.selectedDesignSystemId || null;
```

| Condition                                        | Value                 |
| ------------------------------------------------ | --------------------- |
| `settings` exists + has `selectedDesignSystemId` | Returns the ID string |
| `settings` exists + no `selectedDesignSystemId`  | Returns `null`        |
| `settings` is `null`/`undefined`                 | Returns `null`        |

**Note**: Design system is ALWAYS read from settings, never from app-specific data.

---

## HOME PAGE CONTEXT: App Creation with Theme/Design System

**File**: `src/pages/home.tsx` lines 126-169

### Flow When User Submits From Home

1. **Line 134-137**: `ipc.app.createApp()` called with:
   - `designSystemId: settings?.selectedDesignSystemId || undefined`
   - From menu selection via `handleDesignSystemSelect` (line 125-129)

2. **Line 140-145**: If `settings?.selectedThemeId` exists:
   - Calls `ipc.template.setAppTheme()`
   - Applies selected theme to newly created app

3. **Timeline**:
   - Settings must be hydrated before creation
   - If `useSettings()` still loading, `settings = null` → defaults to `undefined`
   - Theme/design system only applied if settings loaded + selected

---

## CHAT PAGE CONTEXT: App Theme Per-App

**File**: `ChatInput.tsx` line 96, line 496

### Flow When User Changes Theme in Chat

1. **Line 96**: `appId` from `selectedAppIdAtom` (number or null)
2. **Line 496**: Passed to `AuxiliaryActionsMenu` as `appId` prop
3. **AuxiliaryActionsMenu lines 103-112**:
   - If `appId != null`: Updates app-specific theme via `ipc.template.setAppTheme()`
   - Invalidates query: `queryKeys.appTheme.byApp({ appId })`

---

## COMPLETE OPTION VISIBILITY TABLE

### Summary of All Menu Options by Context

| Option Type                 | Home Context | Chat Context | Notes                               |
| --------------------------- | ------------ | ------------ | ----------------------------------- |
| **No Theme**                | ✅ Visible   | ✅ Visible   | Always shown                        |
| **Builtin Themes**          | ✅ Visible   | ✅ Visible   | Placeholder data = always available |
| **Design System - None**    | ✅ Visible\* | ❌ Hidden    | Guarded by `appId == null`          |
| **Design System - Options** | ✅ Visible\* | ❌ Hidden    | Guarded by `appId == null`          |
| **Custom Themes (visible)** | ✅ Visible\* | ✅ Visible\* | If `customThemes.length > 0`        |
| **More Themes**             | ✅ Visible\* | ✅ Visible\* | If `customThemes.length > 4`        |
| **Create Custom Theme**     | ✅ Visible   | ✅ Visible   | Always shown                        |

\*Requires data loaded and non-empty

---

## CRITICAL GUARD CONDITIONS

### Guard 1: appId Branch (LINE 220)

```typescript
{appId == null && designSystems.length > 0 && (
  // Design System Options ONLY render here
)}
```

**Impact**: Design system options completely invisible in chat when appId is a number

### Guard 2: Custom Themes Visibility (LINE 266)

```typescript
{visibleCustomThemes.length > 0 && (
  // Custom themes section renders
)}
```

**Impact**: Entire custom themes section hidden if no custom themes exist

### Guard 3: More Themes (LINE 297)

```typescript
{hasMoreCustomThemes && (
  // More Themes option renders
)}
```

**Impact**: Hidden if ≤4 custom themes exist (all visible in limited list)

### Guard 4: AppTheme Hook Enable (useAppTheme.ts LINE 13)

```typescript
enabled: !!appId;
```

**Impact**: App-specific theme query never runs on home page; appId determines app-theme vs settings-theme

---

## DATA DEPENDENCIES & TIMING ISSUES

| Data               | Hook             | Loading Default | Placeholder   | Risk                                |
| ------------------ | ---------------- | --------------- | ------------- | ----------------------------------- |
| **Builtin Themes** | useThemes        | null            | ✅ themesData | Low - immediate                     |
| **Custom Themes**  | useCustomThemes  | null            | ❌ None       | Medium - empty array until response |
| **Design Systems** | useDesignSystems | null            | ❌ None       | Medium - empty array until response |
| **Settings**       | useSettings      | null            | ❌ None       | High - settings null during load    |
| **App Theme**      | useAppTheme      | null            | ❌ None       | Low - only in chat, appId triggers  |

### Hydration Order on Page Load

1. **Immediate**: Builtin themes (placeholder)
2. **< 100ms typically**: useSettings response
3. **< 500ms typically**: Custom themes + design systems
4. **Per-app (chat only)**: App theme for selected appId

---

## SELECTION PERSISTENCE & STATE MANAGEMENT

| Setting                   | Stored In               | Type         | Key                      | Default                      |
| ------------------------- | ----------------------- | ------------ | ------------------------ | ---------------------------- |
| **Default Theme (Home)**  | Settings (Jotai atom)   | string       | `selectedThemeId`        | `undefined` → stored as `""` |
| **Default Design System** | Settings (Jotai atom)   | string       | `selectedDesignSystemId` | `undefined` → stored as `""` |
| **App Theme (Chat)**      | Per-app in DB           | string\|null | `appId` key              | `null` (no theme)            |
| **Selected Custom Theme** | Memory (currentThemeId) | string       | `custom:${id}`           | Computed dynamically         |

---

## TEST IDS (For QA/Testing)

```typescript
// No Theme option
data-testid="theme-option-none"

// Built-in theme
data-testid="theme-option-${theme.id}"

// Design System - No Design System
data-testid="design-system-option-none"

// Design System option
data-testid="design-system-option-${designSystem.id}"

// Custom theme
data-testid="theme-option-custom:${theme.id}"

// More themes
data-testid="all-custom-themes-option"

// Create custom theme
data-testid="create-custom-theme"

// Token bar toggle
data-testid="token-bar-toggle"

// Menu trigger
data-testid="auxiliary-actions-menu"
```

---

## CONCLUSION: DESIGN-SYSTEM OPTION VISIBILITY CHECKLIST

### ✅ ALWAYS VISIBLE

- [ ] No Theme option
- [ ] Built-in themes (1+ themes)
- [ ] Create Custom Theme
- [ ] Custom themes section (if custom themes exist)

### ⚠️ CONDITIONALLY VISIBLE

- [ ] Design System options **ONLY IN HOME** (`appId == null`)
- [ ] Design System options **HIDDEN IN CHAT** (appId is number)
- [ ] More Themes (if > 4 custom themes)

### 🎯 DESIGN-SYSTEM SPECIFIC

- [x] Guarded by: `appId == null` (line 220)
- [x] Also guarded by: `designSystems.length > 0` (line 220)
- [x] Separator before section (line 222)
- [x] "No Design System" option with checkmark (lines 223-235)
- [x] Individual design system options with icon (lines 236-261)
- [x] Selection via settings only (line 129)
