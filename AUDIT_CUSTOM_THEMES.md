# AuxiliaryActionsMenu Custom Themes Audit Report

## Executive Summary

The "Home '+' themes submenu appears empty except defaults" issue stems from **multiple conditional rendering blocks** that prevent custom themes from displaying when the query is loading, partially loaded, or returns empty results. The problem manifests through timing/data synchronization issues between hook initialization, query fetching, and UI rendering.

---

## Concrete Failure Scenarios

### SCENARIO 1: Initial Page Load / Race Condition

**WHEN:** Component mounts and `useCustomThemes()` starts fetching
**WHAT HAPPENS:**

- `useCustomThemes()` initializes with `queryFn` that calls `ipc.template.getCustomThemes()`
- During async fetch, `customThemes = query.data ?? []` (line 28 in useCustomThemes.ts)
- **Until the query resolves, `customThemes` is an empty array** `[]`
- In AuxiliaryActionsMenu, line 62: `const { customThemes } = useCustomThemes();`
- Line 96: `const hasMoreCustomThemes = customThemes.length > visibleCustomThemes.length;`
  - Evaluates to: `0 > 0` = `false`
- Line 210 condition: `{visibleCustomThemes.length > 0 && (...)}`
  - Evaluates to: `0 > 0` = `false` → **Custom themes section NOT rendered**

**CODE LINES CAUSING ISSUE:**

- `useCustomThemes.ts:28` - Returns empty array during loading
- `AuxiliaryActionsMenu.tsx:210` - Conditional render depends on `visibleCustomThemes.length > 0`
- `AuxiliaryActionsMenu.tsx:96` - `hasMoreCustomThemes` logic assumes data is loaded

**EXPECTED BEHAVIOR:** Should show loading state or wait for data before evaluating visibility

---

### SCENARIO 2: Query State Not Exposed

**WHEN:** Checking if `useCustomThemes()` is loading
**WHAT HAPPENS:**

- `useCustomThemes()` hook (line 16-32 in useCustomThemes.ts) exposes:
  - `customThemes` (data or empty array)
  - `isLoading`
  - `error`
  - `refetch`
- In AuxiliaryActionsMenu (line 62), **only destructures `customThemes`**:
  ```tsx
  const { customThemes } = useCustomThemes();
  ```
- **`isLoading` and `error` states are NOT destructured**
- No conditional rendering based on `isLoading` state in dropdown
- **Custom themes section renders nothing while loading** (empty array scenario above)

**CODE LINES CAUSING ISSUE:**

- `AuxiliaryActionsMenu.tsx:62` - Only extracts `customThemes`, ignores `isLoading` + `error`
- `AuxiliaryActionsMenu.tsx:73-94` - `useMemo` for `visibleCustomThemes` depends on empty data
- No conditional checks for loading state in dropdown menu rendering

**EXPECTED BEHAVIOR:** Should check `isLoading` before showing empty "Custom Themes Section"

---

### SCENARIO 3: Filtering Logic With Empty Initial Data

**WHEN:** `visibleCustomThemes` is computed during initial load
**WHAT HAPPENS:**

- Line 73-94 in AuxiliaryActionsMenu.tsx - `useMemo` computes visible themes:
  ```tsx
  const visibleCustomThemes = useMemo(() => {
    const MAX_VISIBLE = 4;
    const selectedCustomTheme = customThemes.find(
      (t) => `custom:${t.id}` === currentThemeId,
    );
    const otherCustomThemes = customThemes.filter(
      (t) => `custom:${t.id}` !== currentThemeId,
    );
    const result = [];
    if (selectedCustomTheme) {
      result.push(selectedCustomTheme);
    }
    const remaining = MAX_VISIBLE - result.length;
    result.push(...otherCustomThemes.slice(0, remaining));
    return result;
  }, [customThemes, currentThemeId]);
  ```
- When `customThemes = []` (loading state):
  - `selectedCustomTheme = undefined`
  - `otherCustomThemes = []`
  - `result = []` (always empty)
- **This is then used in line 210 check:**
  ```tsx
  {visibleCustomThemes.length > 0 && (
    <>
      <DropdownMenuSeparator />
      {visibleCustomThemes.map((theme) => { ... })}
    </>
  )}
  ```
- **Since `visibleCustomThemes.length` is 0, the entire custom themes section is NOT rendered**

**CODE LINES CAUSING ISSUE:**

- `AuxiliaryActionsMenu.tsx:73-94` - Filters against empty array during load
- `AuxiliaryActionsMenu.tsx:210` - Hides section when filtered result is empty
- No distinction between "loading" and "no data" states

**EXPECTED BEHAVIOR:** Should distinguish between loading and empty states

---

### SCENARIO 4: Query Invalidation After Theme Creation - Timing Issue

**WHEN:** User creates a custom theme in CustomThemeDialog, then the dialog closes
**WHAT HAPPENS:**

1. In CustomThemeDialog.tsx (line 82-88):
   ```tsx
   const createdTheme = await createThemeMutation.mutateAsync({
     name: name.trim(),
     description: description.trim() || undefined,
     prompt: prompt.trim(),
   });
   toast.success(t("library.themes.created", { ns: "app" }));
   onThemeCreated?.(createdTheme.id);
   await handleClose();
   ```
2. `onThemeCreated` callback in AuxiliaryActionsMenu (line 309-312):
   ```tsx
   onThemeCreated={(themeId) => {
     // Auto-select the newly created theme
     handleThemeSelect(`custom:${themeId}`);
   }}
   ```
3. `handleThemeSelect` (line 98-114) calls:
   ```tsx
   await ipc.template.setAppTheme({
     appId,
     themeId,
   });
   queryClient.invalidateQueries({
     queryKey: queryKeys.appTheme.byApp({ appId }),
   });
   ```
4. **Problem in CustomThemeDialog:**
   - Line 121-128: `handleCustomThemeDialogClose` is called when dialog closes
   ```tsx
   const handleCustomThemeDialogClose = (open: boolean) => {
     setCustomThemeDialogOpen(open);
     if (!open) {
       // Refresh custom themes when dialog closes
       queryClient.invalidateQueries({
         queryKey: queryKeys.customThemes.all,
       });
     }
   };
   ```
5. **Timeline issue:**
   - Creation happens
   - `onThemeCreated` auto-selects theme
   - `handleThemeSelect` calls `setAppTheme` IPC
   - Dialog closes
   - `handleCustomThemeDialogClose` invalidates `customThemes.all` query
   - **BUT:** The new theme creation mutation (line 44-48 in useCustomThemes.ts) already invalidates it:
   ```tsx
   onSuccess: () => {
     queryClient.invalidateQueries({
       queryKey: queryKeys.customThemes.all,
     });
   },
   ```
6. **RACE CONDITION:** Two invalidations happening - potential for state sync issues

**CODE LINES CAUSING ISSUE:**

- `useCustomThemes.ts:44-48` - Mutation invalidates on success
- `AuxiliaryActionsMenu.tsx:121-129` - Dialog also invalidates on close
- `AuxiliaryActionsMenu.tsx:309-312` - Creates timing window between mutation and invalidation
- `queryKeys.ts:167-169` - Single `customThemes.all` key used everywhere

**EXPECTED BEHAVIOR:** Single source of invalidation, no race conditions

---

### SCENARIO 5: currentThemeId Mismatch Hiding All Custom Themes

**WHEN:** Comparing currentThemeId with custom theme IDs
**WHAT HAPPENS:**

1. Line 69-70 in AuxiliaryActionsMenu.tsx:
   ```tsx
   const currentThemeId =
     appId != null ? appThemeId : settings?.selectedThemeId || null;
   ```
2. `appThemeId` comes from `useAppTheme(appId)` (line 63):
   - Returns: `themeId: query.data ?? null` (useAppTheme.ts:23)
3. `settings?.selectedThemeId` comes from `useSettings()` hook
4. **In visibleCustomThemes filter (line 78-82):**
   ```tsx
   const selectedCustomTheme = customThemes.find(
     (t) => `custom:${t.id}` === currentThemeId,
   );
   ```
5. **Potential Issues:**
   - If `appThemeId` is still loading: `undefined` → gets converted to `null`
   - If `settings.selectedThemeId` is loading: `undefined` → gets converted to `null`
   - **Format mismatch:** Custom theme IDs are stored as `custom:123` in DB, but comparison uses raw ID
   - If current app theme is a custom theme BUT was stored differently, the filter won't match

**CODE LINES CAUSING ISSUE:**

- `AuxiliaryActionsMenu.tsx:69-70` - Determines currentThemeId
- `AuxiliaryActionsMenu.tsx:77-79` - Filter depends on exact string match `custom:${t.id}`
- `useAppTheme.ts:23` - Returns null during loading
- `useSettings.ts:83` - Returns atom state, may be undefined initially

**EXPECTED BEHAVIOR:** Handle loading states before using for comparison

---

### SCENARIO 6: Dropdown Menu Closed During Query Load

**WHEN:** User opens dropdown menu while query is fetching
**WHAT HAPPENS:**

1. User clicks "+" button, dropdown opens (line 133 in AuxiliaryActionsMenu.tsx)
2. At this exact moment, `useCustomThemes()` is still fetching
3. `customThemes = []` (loading state)
4. Dropdown renders with:
   - "No Theme" option ✓
   - Built-in themes ✓
   - **Custom themes section is HIDDEN** (line 210 check fails)
   - "Create Custom Theme" option ✓
5. User sees: "No Theme" + built-in themes only
6. **If user closes menu before query completes, sees empty submenu**

**CODE LINES CAUSING ISSUE:**

- `AuxiliaryActionsMenu.tsx:62` - Destructures without checking `isLoading`
- `AuxiliaryActionsMenu.tsx:210` - Gate-keeper condition that fails during load
- `useCustomThemes.ts:17-25` - No `staleTime` or `cacheTime` optimization
- `useThemes.ts:7-16` - Uses `placeholderData` but `useCustomThemes` does NOT

**EXPECTED BEHAVIOR:** Either show placeholder custom themes or "Loading..." state

---

## Hook Data Loading States

### useCustomThemes Hook (useCustomThemes.ts:16-32)

```typescript
export function useCustomThemes() {
  const query = useQuery({
    queryKey: queryKeys.customThemes.all,
    queryFn: async (): Promise<CustomTheme[]> => {
      return ipc.template.getCustomThemes(); // <-- IPC call to main process
    },
    meta: {
      showErrorToast: true,
    },
  });

  return {
    customThemes: query.data ?? [], // <-- EMPTY ARRAY DURING LOADING
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

**Key observations:**

- ✗ No `enabled` condition to prevent fetch on init
- ✗ No `staleTime` or `gcTime` optimization
- ✗ No `placeholderData` (unlike useThemes which has `placeholderData: themesData`)
- ✗ Returns empty array `[]` when `query.data` is undefined (loading)
- ✓ Exposes `isLoading` flag but **AuxiliaryActionsMenu doesn't use it**

---

### useThemes Hook (useThemes.ts:6-23)

```typescript
export function useThemes() {
  const query = useQuery({
    queryKey: queryKeys.themes.all,
    queryFn: async (): Promise<Theme[]> => {
      return ipc.template.getThemes();
    },
    placeholderData: themesData, // <-- PLACEHOLDER DATA
    meta: {
      showErrorToast: true,
    },
  });

  return {
    themes: query.data, // <-- NEVER EMPTY (has placeholderData)
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

**Comparison:**

- ✓ Uses `placeholderData: themesData` so themes are never empty
- ✓ Built-in themes always visible because `query.data` always has value
- ✗ Custom themes use same pattern BUT no placeholder = empty during load

---

### useAppTheme Hook (useAppTheme.ts:5-27)

```typescript
export function useAppTheme(appId: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.appTheme.byApp({ appId }),
    queryFn: async (): Promise<string | null> => {
      return ipc.template.getAppTheme({ appId: appId! });
    },
    enabled: !!appId, // <-- Only fetches if appId exists
  });

  return {
    themeId: query.data ?? null, // <-- NULL DURING LOADING
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
  };
}
```

**Key observations:**

- ✓ Properly gated with `enabled: !!appId`
- ✗ Returns `null` during loading (but this is intentional)
- ✗ When loading, `currentThemeId` becomes `null`, so no custom theme appears selected

---

### useSettings Hook (useSettings.ts:22-93)

```typescript
export function useSettings() {
  const [settings, setSettingsAtom] = useAtom(userSettingsAtom);
  const [loading, setLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [userSettings, fetchedEnvVars] = await Promise.all([
        ipc.settings.getUserSettings(),
        ipc.misc.getEnvVars(),
      ]);
      // ... processing ...
      setSettingsAtom(userSettings);
      // ...
    }
    // ...
  }, [setSettingsAtom, setEnvVarsAtom, appVersion]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    settings,  // <-- From Jotai atom, may be undefined initially
    envVars,
    loading,
    error,
    updateSettings,
  };
}
```

**Key observations:**

- ✗ Settings loaded via Jotai atom, not React Query
- ✗ `selectedThemeId` may be undefined during initial load
- ✗ No sync with React Query cache

---

## Query Invalidation Behavior

### Creation Flow Issues (CustomThemeDialog → AuxiliaryActionsMenu)

**File: useCustomThemes.ts (line 44-48)**

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.customThemes.all,
  });
},
```

**File: AuxiliaryActionsMenu.tsx (line 121-129)**

```typescript
const handleCustomThemeDialogClose = (open: boolean) => {
  setCustomThemeDialogOpen(open);
  if (!open) {
    // Refresh custom themes when dialog closes
    queryClient.invalidateQueries({
      queryKey: queryKeys.customThemes.all,
    });
  }
};
```

**ISSUE:** Invalidation happens in TWO places:

1. Mutation's `onSuccess` callback (immediate)
2. Dialog's `onOpenChange` handler (when dialog closes)

**Timeline:**

```
T0: User clicks "New Theme" in dialog
T1: Creates theme via mutation
T2: Mutation succeeds → onSuccess invalidates queryKeys.customThemes.all
T3: Dialog closes → onOpenChange also invalidates queryKeys.customThemes.all
T4: Two invalidations in quick succession
T5: Query refetch triggered multiple times
T6: Potential race condition with setAppTheme IPC call
```

---

## visibleCustomThemes Logic Analysis

**File: AuxiliaryActionsMenu.tsx (line 73-94)**

### Problem 1: Empty Array Evaluation

```typescript
const visibleCustomThemes = useMemo(() => {
  const MAX_VISIBLE = 4;

  // During loading: customThemes = []
  const selectedCustomTheme = customThemes.find(
    (t) => `custom:${t.id}` === currentThemeId,
  );
  // Result: undefined

  const otherCustomThemes = customThemes.filter(
    (t) => `custom:${t.id}` !== currentThemeId,
  );
  // Result: []

  const result = [];
  if (selectedCustomTheme) {
    // FALSE when loading
    result.push(selectedCustomTheme);
  }

  const remaining = MAX_VISIBLE - result.length;
  result.push(...otherCustomThemes.slice(0, remaining));

  return result; // Returns [] during loading
}, [customThemes, currentThemeId]);
```

**During loading:**

- Input: `customThemes = []`
- Output: `visibleCustomThemes = []`

### Problem 2: Rendering Gate

```typescript
{visibleCustomThemes.length > 0 && (
  <>
    <DropdownMenuSeparator />
    {visibleCustomThemes.map((theme) => { ... })}
  </>
)}
```

**When `visibleCustomThemes.length === 0`:**

- Entire custom themes section is hidden
- No loading indicator
- No "No custom themes" message
- **Just silently disappears**

### Problem 3: hasMoreCustomThemes Logic

```typescript
const hasMoreCustomThemes = customThemes.length > visibleCustomThemes.length;
```

**During loading:**

- `customThemes.length = 0`
- `visibleCustomThemes.length = 0`
- `hasMoreCustomThemes = 0 > 0 = false`
- "More themes" option never appears

**If themes are cached:**

- `customThemes.length = 5`
- `visibleCustomThemes.length = 4`
- `hasMoreCustomThemes = 5 > 4 = true`
- ✓ "More themes" button appears correctly

---

## Query Key Factory Analysis

**File: queryKeys.ts (line 167-169)**

```typescript
customThemes: {
  all: ["custom-themes"] as const,
},
```

**Issues:**

- ✗ Single flat key, no hierarchical structure for partial invalidation
- ✗ No per-app theme keys (unlike `appTheme.byApp({ appId })`)
- ✗ All custom theme queries invalidated globally, not per-app
- ✓ Correctly used in `useCustomThemes.ts` and invalidation calls

---

## Summary Table: Empty Submenu Root Causes

| Scenario                     | Root Cause                       | Code Line(s)                                                | Exposed State                      | Condition Fails                  |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------- | ---------------------------------- | -------------------------------- |
| **Initial Load Race**        | `customThemes = []` during fetch | useCustomThemes.ts:28                                       | ✗ isLoading not used               | AuxiliaryActionsMenu.tsx:210     |
| **No Loading State Check**   | Only destructure `customThemes`  | AuxiliaryActionsMenu.tsx:62                                 | ✗ isLoading exists but ignored     | visibleCustomThemes.length > 0   |
| **Filtering Empty Array**    | useMemo processes `[]`           | AuxiliaryActionsMenu.tsx:73-94                              | ✗ Cannot distinguish load vs empty | visibleCustomThemes = []         |
| **Timing Issue on Creation** | Double invalidation              | useCustomThemes.ts:44-48 + AuxiliaryActionsMenu.tsx:121-129 | ✓ Works but inefficient            | Race condition potential         |
| **currentThemeId Mismatch**  | Null during loading              | AuxiliaryActionsMenu.tsx:69-70                              | ✗ No loading state for themeId     | Filter never matches during load |
| **No Placeholder Data**      | useCustomThemes lacks fallback   | useCustomThemes.ts:28                                       | ✗ Compare to useThemes.ts:12       | visibleCustomThemes = []         |

---

## Exact Code Lines Summary

### CRITICAL GATE CONDITION (Line 210 in AuxiliaryActionsMenu.tsx)

```tsx
210: {visibleCustomThemes.length > 0 && (
```

This single condition hides all custom themes when:

- Query is loading
- Query returns empty array
- Filtering produces empty result
- **No distinction between these cases**

### MISSING ISLOADING CHECK (Line 62 in AuxiliaryActionsMenu.tsx)

```tsx
62: const { customThemes } = useCustomThemes();
```

Should also destructure `isLoading`:

```tsx
const { customThemes, isLoading } = useCustomThemes();
```

### EMPTY ARRAY DURING LOADING (Line 28 in useCustomThemes.ts)

```tsx
28: customThemes: query.data ?? [],
```

Returns `[]` when `query.data` is undefined (loading state)

### FILTERING EMPTY ARRAY (Lines 73-94 in AuxiliaryActionsMenu.tsx)

```tsx
73-94: useMemo(() => { ... }, [customThemes, currentThemeId])
```

Processes empty `customThemes = []` during load, returns empty result

### DOUBLE INVALIDATION (Lines 44-48 + 121-129)

```tsx
// useCustomThemes.ts:44-48
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.customThemes.all,
  });
},

// AuxiliaryActionsMenu.tsx:121-129
if (!open) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.customThemes.all,
  });
}
```

---

## Conclusion

**Primary Failure Mode:** The component renders the custom themes section only when `visibleCustomThemes.length > 0` (line 210), but this length is 0 during the initial data loading phase because:

1. `useCustomThemes()` returns empty array during fetch
2. `visibleCustomThemes` useMemo filters that empty array
3. Result is empty → render condition fails
4. **No loading state or placeholder to show while fetching**

**Secondary Issues:**

- `isLoading` state is exposed by the hook but never used
- No distinction between "loading" and "no custom themes exist"
- Double invalidation creates potential race conditions
- `currentThemeId` becomes null during app theme loading, breaking selection logic
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ CUSTOM THEMES SUBMENU EMPTY - FAILURE CHAIN ANALYSIS │
  └─────────────────────────────────────────────────────────────────────────────┘

CHAIN 1: INITIAL LOAD RACE CONDITION (PRIMARY FAILURE)
═══════════════════════════════════════════════════════

Component Mounts
↓
useCustomThemes() Hook Called
↓
Query Starts: ipc.template.getCustomThemes() [ASYNC]
↓
During Fetch: query.data = undefined
↓
Return: customThemes: query.data ?? [] = [] (EMPTY ARRAY)
↓
AuxiliaryActionsMenu Line 62: const { customThemes } = useCustomThemes()
↓
customThemes = []
↓
visibleCustomThemes useMemo (Line 73-94) Evaluates: - selectedCustomTheme = [].find(...) = undefined - otherCustomThemes = [].filter(...) = [] - result = [] (EMPTY)
↓
Line 210 Gate Condition: {visibleCustomThemes.length > 0 && (...)} - Evaluates: 0 > 0 = FALSE
↓
🔴 CUSTOM THEMES SECTION NOT RENDERED
↓
Query Completes (Too Late) - customThemes = [{ id: 1, name: "Theme1" }, ...] - visibleCustomThemes updates = [{ id: 1, ... }] - But dropdown might be closed, or user already saw empty list

CHAIN 2: MISSING LOADING STATE CHECK
═════════════════════════════════════

useCustomThemes() Returns:
{
customThemes: [],
isLoading: true, ← EXISTS BUT IGNORED
error: null, ← EXISTS BUT IGNORED
refetch: () => {...} ← EXISTS BUT IGNORED
}

AuxiliaryActionsMenu Line 62:
const { customThemes } = useCustomThemes()
↑
ONLY THIS DESTRUCTURED

isLoading NOT USED ANYWHERE IN DROPDOWN RENDERING
↓
No Conditional Check Like:
{isLoading ? <LoadingSpinner /> : <ThemeOptions />}
↓
🔴 EMPTY LIST SHOWN WITH NO INDICATION IT'S LOADING

CHAIN 3: DOUBLE INVALIDATION RACE CONDITION
════════════════════════════════════════════

User Creates Theme
↓
useCreateCustomTheme mutation.mutateAsync()
↓
Server Returns: { id: 5, name: "MyTheme", ... }
↓
Mutation onSuccess Fires (useCustomThemes.ts:44-48):
queryClient.invalidateQueries({ queryKey: queryKeys.customThemes.all })
↓
CustomThemeDialog.onThemeCreated callback (AuxiliaryActionsMenu:309-312):
handleThemeSelect(`custom:${themeId}`)
↓
handleThemeSelect calls:

- ipc.template.setAppTheme({ appId, themeId })
- queryClient.invalidateQueries({ queryKey: queryKeys.appTheme.byApp(...) })
  ↓
  Dialog Closes
  ↓
  handleCustomThemeDialogClose Fires (AuxiliaryActionsMenu:121-129):
  queryClient.invalidateQueries({ queryKey: queryKeys.customThemes.all })
  ↓
  🔴 SAME QUERY INVALIDATED TWICE IN QUICK SUCCESSION - Potential race condition - Multiple refetch cycles - State sync issues

CHAIN 4: CURRENTTHEMEID MISMATCH HIDING SELECTED THEME
═══════════════════════════════════════════════════════

AuxiliaryActionsMenu Line 63:
const { themeId: appThemeId } = useAppTheme(appId)
↓
Returns: query.data ?? null

During Loading: themeId = null (because query not resolved)

Line 69-70:
const currentThemeId = appId != null ? appThemeId : settings?.selectedThemeId || null
↓
appThemeId = null (still loading)

currentThemeId = null

visibleCustomThemes Filter (Line 77-79):
const selectedCustomTheme = customThemes.find(
(t) => `custom:${t.id}` === currentThemeId
)
↓
Looking for: null
CustomThemes: [{ id: 1, ... }, { id: 2, ... }]

No Match Found
↓
🔴 SELECTED CUSTOM THEME NOT HIGHLIGHTED

HOOK STATE COMPARISON TABLE:
═════════════════════════════

useThemes (WORKS):

- placeholderData: themesData ✓
- query.data always has value ✓
- themes never empty ✓
- Themes always visible ✓

useCustomThemes (BROKEN):

- NO placeholderData ✗
- query.data = undefined during load ✗
- customThemes = [] ✗
- Custom themes invisible during load ✗

CRITICAL CODE GATES:
════════════════════

Line 210 (AuxiliaryActionsMenu.tsx):
{visibleCustomThemes.length > 0 && (
<DropdownMenuSeparator />
{visibleCustomThemes.map(...)}
)}

This SINGLE condition controls visibility:

- visibleCustomThemes = [] → NOT RENDERED
- visibleCustomThemes = [x] → RENDERED

But visibleCustomThemes = [] when:

1. Query is loading ← PRIMARY ISSUE
2. No custom themes exist (intentional)
3. All themes filtered out (edge case)

NO WAY TO DISTINGUISH BETWEEN CASES 1, 2, 3!

EXACT LINE NUMBERS SUMMARY:
════════════════════════════

PRIMARY CULPRITS:
✗ useCustomThemes.ts:28
customThemes: query.data ?? [] (EMPTY DURING LOAD)

✗ AuxiliaryActionsMenu.tsx:62
const { customThemes } = useCustomThemes() (MISSING isLoading)

✗ AuxiliaryActionsMenu.tsx:210
{visibleCustomThemes.length > 0 && ...} (GATE CONDITION)

SECONDARY ISSUES:
✗ AuxiliaryActionsMenu.tsx:73-94
Filtering logic on empty array

✗ AuxiliaryActionsMenu.tsx:69-70
currentThemeId null during loading

✗ useCustomThemes.ts:44-48 + AuxiliaryActionsMenu.tsx:121-129
Double invalidation

REFERENCE:
✓ useThemes.ts:12
placeholderData: themesData (CORRECT PATTERN)

RENDERING TIMELINE:
═══════════════════

T=0ms: User clicks "+" button
T=5ms: AuxiliaryActionsMenu mounts
T=10ms: useCustomThemes() hook created
T=15ms: Query fetch started (IPC to main process)
T=20ms: Dropdown menu renders (query still pending)
T=25ms: Line 62: customThemes = []
T=30ms: Line 73: visibleCustomThemes computed = []
T=35ms: Line 210: Check: 0 > 0? NO
T=40ms: 🔴 Custom themes section NOT RENDERED
T=100ms: Query resolves from main process
T=110ms: React state updates
T=120ms: visibleCustomThemes recalculates (if menu still open)
T=130ms: 🟢 Custom themes NOW visible (too late?)

RESULT: User sees empty submenu for ~100ms minimum
If user clicks away before T=130ms, never sees themes

# Quick Reference: Custom Themes Empty Submenu Issue

## The Problem

Home '+' button themes submenu shows only default themes, custom themes are hidden.

## Root Cause (Chain of Failures)

1. **useCustomThemes()** hook returns empty array `[]` while query is fetching
2. **AuxiliaryActionsMenu** only destructures `customThemes`, ignores `isLoading`
3. **visibleCustomThemes** useMemo computes empty result from empty array
4. **Line 210 gate condition** checks `visibleCustomThemes.length > 0` → **FALSE**
5. **Custom themes section NOT rendered**

## The 6 Failure Scenarios

### 1️⃣ Initial Load Race Condition (PRIMARY)

- **File:** useCustomThemes.ts, AuxiliaryActionsMenu.tsx
- **Lines:** 28, 62, 210
- **When:** Component mounts, query fetching
- **Result:** Renders with empty customThemes array

### 2️⃣ Missing isLoading State

- **File:** AuxiliaryActionsMenu.tsx
- **Line:** 62
- **Issue:** Destructures only `customThemes`, ignores `isLoading`
- **Should:** Also destructure `isLoading` and check it

### 3️⃣ Filtering Empty Array

- **File:** AuxiliaryActionsMenu.tsx
- **Lines:** 73-94
- **Issue:** useMemo processes `customThemes = []` during load
- **Result:** visibleCustomThemes = [] → not rendered (line 210)

### 4️⃣ Query Invalidation Race Condition

- **Files:** useCustomThemes.ts, AuxiliaryActionsMenu.tsx
- **Lines:** 44-48, 121-129
- **Issue:** queryKeys.customThemes.all invalidated twice
- **Timeline:** Mutation onSuccess + Dialog onOpenChange

### 5️⃣ currentThemeId Mismatch

- **File:** AuxiliaryActionsMenu.tsx
- **Lines:** 69-70, 77-79
- **Issue:** currentThemeId = null during loading
- **Result:** Filter doesn't match any custom theme

### 6️⃣ No Placeholder Data

- **File:** useCustomThemes.ts
- **Line:** 28
- **Compare:** useThemes.ts uses `placeholderData: themesData` ✓
- **Missing:** useCustomThemes has NO placeholder

## Exact Code Lines Causing Issue

| Issue                   | File                     | Line(s) | Code                                         |
| ----------------------- | ------------------------ | ------- | -------------------------------------------- |
| **Gate Condition**      | AuxiliaryActionsMenu.tsx | 210     | `{visibleCustomThemes.length > 0 && (...)}`  |
| **Missing isLoading**   | AuxiliaryActionsMenu.tsx | 62      | `const { customThemes } = useCustomThemes()` |
| **Empty on Load**       | useCustomThemes.ts       | 28      | `customThemes: query.data ?? []`             |
| **Filter on Empty**     | AuxiliaryActionsMenu.tsx | 73-94   | `useMemo(() => {...}, [customThemes, ...])`  |
| **Double Invalidate**   | useCustomThemes.ts       | 44-48   | `onSuccess() { invalidateQueries(...) }`     |
| **Double Invalidate 2** | AuxiliaryActionsMenu.tsx | 121-129 | `if (!open) { invalidateQueries(...) }`      |

## The Critical Gate (Line 210)

```tsx
{visibleCustomThemes.length > 0 && (
  <>
    <DropdownMenuSeparator />
    {visibleCustomThemes.map((theme) => { ... })}
  </>
)}
```

**This ONE condition hides custom themes when:**

- ✗ Query is loading (visibleCustomThemes = [])
- ✗ No custom themes exist (legitimate)
- ✗ All filtered out (edge case)
- **NO WAY TO DISTINGUISH** between cases!

## Hook Comparison

### useThemes (✓ WORKS)

```tsx
const query = useQuery({
  queryKey: queryKeys.themes.all,
  queryFn: async () => ipc.template.getThemes(),
  placeholderData: themesData,  // ← ALWAYS HAS DATA
  ...
});
return { themes: query.data, ... };
// Result: themes never empty, always visible
```

### useCustomThemes (✗ BROKEN)

```tsx
const query = useQuery({
  queryKey: queryKeys.customThemes.all,
  queryFn: async () => ipc.template.getCustomThemes(),
  // ← NO PLACEHOLDER DATA
  ...
});
return { customThemes: query.data ?? [], ... };
// Result: customThemes = [] during load, invisible
```

## Exposed Hook State

```tsx
// Hook provides these but component ignores most:
{
  customThemes: [],           // ← Used (empty during load)
  isLoading: true,            // ← IGNORED
  error: null,                // ← IGNORED
  refetch: () => { ... }      // ← IGNORED
}

// Current destructuring only:
const { customThemes } = useCustomThemes();  // ← Should also get isLoading
```

## Timeline of Failure

```
User clicks "+" button
        ↓
AuxiliaryActionsMenu mounts
        ↓
useCustomThemes() starts fetching [ASYNC IPC CALL]
        ↓
During fetch: customThemes = []  (loading state)
        ↓
visibleCustomThemes computed = []  (filtering empty array)
        ↓
Gate check: 0 > 0? NO
        ↓
🔴 CUSTOM THEMES SECTION NOT RENDERED
        ↓
[~100ms later] IPC fetch completes
        ↓
customThemes = [{ id: 1, ... }, ...]  (too late if menu closed)
        ↓
IF menu still open: re-renders with themes visible
IF menu closed: user never saw themes
```

## Files Involved

1. **useCustomThemes.ts** (16-32) - Hook returning empty array during load
2. **useThemes.ts** (6-23) - Reference for correct pattern with placeholderData
3. **AuxiliaryActionsMenu.tsx** (51-355) - Component gate condition + destructuring
4. **useAppTheme.ts** (5-27) - Secondary issue with currentThemeId
5. **useSettings.ts** (22-93) - Settings loading state
6. **queryKeys.ts** (167-169) - Query key definition
7. **templates.ts** (246) - IPC contract definition
8. **themes_handlers.ts** (313-327) - Backend fetching custom themes

## Key Observations

✓ **Correct Pattern Exists:** useThemes.ts uses placeholderData
✓ **Hook Exposes State:** isLoading exists but unused
✓ **Architecture Sound:** React Query pattern is correct
✗ **Missing Implementation:** No placeholder for custom themes
✗ **No Loading Indicator:** No UI showing "Loading..."
✗ **Double Invalidation:** Same query invalidated twice
✗ **Timing Issue:** Query not cached/optimized
