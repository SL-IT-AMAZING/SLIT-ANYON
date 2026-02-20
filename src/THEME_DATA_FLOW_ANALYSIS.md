# THEME DATA FLOW TRACE - HOME PROMPT THEME PICKER

## EXECUTIVE SUMMARY

The theme picker in the Home page's '+' menu follows a **5-layer architecture**:

1. **Data Sources**: Built-in themes (`src/shared/themes.ts`) + Custom themes (SQLite DB)
2. **IPC Contracts**: Type-safe channel definitions in `src/ipc/types/templates.ts`
3. **IPC Handlers**: Main process handlers in `src/pro/main/ipc/handlers/themes_handlers.ts`
4. **React Query Hooks**: Client-side data fetching in `src/hooks/useThemes.ts` and `src/hooks/useCustomThemes.ts`
5. **UI Component**: Theme picker rendered in `src/components/chat/AuxiliaryActionsMenu.tsx`

The menu is mounted in `src/pages/home.tsx` → `src/components/chat/HomeChatInput.tsx` → `AuxiliaryActionsMenu`.

---

## DATA SOURCES

### 1. BUILT-IN THEMES
- **Location**: `src/shared/themes.ts`
- **Type**: `const themesData: Theme[]`
- **Contents**: Array with single default theme object
  ```typescript
  {
    id: "default",
    name: "Default Theme", 
    description: "Balanced design system emphasizing aesthetics, contrast, and functionality.",
    icon: "palette",
    prompt: "..." (50KB default theme prompt)
  }
  ```
- **Note**: This is a static export used as both a fallback and primary source for built-in themes.

### 2. CUSTOM THEMES (DATABASE)
- **Location**: SQLite database table `customThemes`
- **Schema**: 
  - `id` (number, PK)
  - `name` (string)
  - `description` (string | null)
  - `prompt` (string, required)
  - `createdAt` (Date)
  - `updatedAt` (Date)
- **Access**: Drizzle ORM via `db.query.customThemes.findMany()`
- **Ordering**: By `createdAt DESC` (newest first)

---

## IPC CONTRACTS (Single Source of Truth)

**File**: `src/ipc/types/templates.ts` (Lines 214-294)

### Built-in Themes Contract
```typescript
getThemes: defineContract({
  channel: "get-themes",
  input: z.void(),
  output: z.array(ThemeSchema),  // Array<Theme>
})
```

### Custom Themes Contract
```typescript
getCustomThemes: defineContract({
  channel: "get-custom-themes", 
  input: z.void(),
  output: z.array(CustomThemeSchema),
})
```

### Export Chain
```
templateContracts (object)
  ↓
templateClient = createClient(templateContracts)
  ↓
Re-exported from src/ipc/types/index.ts:74
  ↓
Available as ipc.template.getThemes() and ipc.template.getCustomThemes()
```

---

## IPC HANDLERS (Main Process)

**File**: `src/pro/main/ipc/handlers/themes_handlers.ts`

### Handler Registration Function
```typescript
export function registerThemesHandlers() {
  // Line 280: Built-in themes - Direct return from static data
  handle("get-themes", async (): Promise<Theme[]> => {
    return themesData;  // From src/shared/themes.ts
  });

  // Line 314: Custom themes - Query from SQLite database
  handle("get-custom-themes", async (): Promise<CustomTheme[]> => {
    const themes = await db.query.customThemes.findMany({
      orderBy: (themes, { desc }) => [desc(themes.createdAt)],
    });

    return themes.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      prompt: t.prompt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  });
}
```

### Handler Registration in IPC Host
**File**: `src/ipc/ipc_host.ts` (Line 1 and Line 74)
```typescript
import { registerThemesHandlers } from "../pro/main/ipc/handlers/themes_handlers";

export function initializeIPC() {
  // ... other handler registrations ...
  registerThemesHandlers();  // Line 74
}
```

---

## REACT QUERY HOOKS (Renderer Process)

### Hook 1: `useThemes()` - Built-in themes
**File**: `src/hooks/useThemes.ts`

```typescript
export function useThemes() {
  const query = useQuery({
    queryKey: queryKeys.themes.all,  // ["themes"]
    queryFn: async (): Promise<Theme[]> => {
      return ipc.template.getThemes();  // IPC call to main process
    },
    placeholderData: themesData,  // Static fallback while loading
    meta: {
      showErrorToast: true,  // Show error toast on failure
    },
  });

  return {
    themes: query.data,      // Theme[] | undefined
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

**Key Points**:
- `placeholderData: themesData` means even if IPC call fails, the built-in theme is shown
- Query key `["themes"]` is used for cache invalidation

### Hook 2: `useCustomThemes()` - Custom themes from DB
**File**: `src/hooks/useCustomThemes.ts` (Lines 16-33)

```typescript
export function useCustomThemes() {
  const query = useQuery({
    queryKey: queryKeys.customThemes.all,  // ["custom-themes"]
    queryFn: async (): Promise<CustomTheme[]> => {
      return ipc.template.getCustomThemes();  // IPC call to main process
    },
    meta: {
      showErrorToast: true,
    },
  });

  return {
    customThemes: query.data ?? [],  // Empty array if undefined
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

**Key Points**:
- **NO placeholder data** - empty array `[]` is the fallback if query fails
- Custom themes are optional; app works fine with empty list
- Query key `["custom-themes"]` is used for invalidation

---

## RENDERER COMPONENT - Theme Picker UI

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx` (Lines 40-355)

### Component Props
```typescript
interface AuxiliaryActionsMenuProps {
  onFileSelect: (files: FileList, type: "chat-context" | "upload-to-codebase") => void;
  showTokenBar?: boolean;
  toggleShowTokenBar?: () => void;
  hideContextFilesPicker?: boolean;
  appId?: number;  // If set, use app-specific theme; otherwise use settings default
}
```

### Data Binding (Lines 61-70)
```typescript
const { themes } = useThemes();              // Built-in themes
const { customThemes } = useCustomThemes();  // Custom themes from DB

// Determine current theme selection
// - If appId exists: use app's specific theme (from DB)
// - Otherwise: use default theme from user settings
const { themeId: appThemeId } = useAppTheme(appId);
const { settings, updateSettings } = useSettings();

const currentThemeId =
  appId != null ? appThemeId : settings?.selectedThemeId || null;
```

### Filtering Logic (Lines 73-94)
```typescript
const visibleCustomThemes = useMemo(() => {
  const MAX_VISIBLE = 4;  // Show max 4 custom themes in dropdown

  // Find selected custom theme if it exists
  const selectedCustomTheme = customThemes.find(
    (t) => `custom:${t.id}` === currentThemeId,
  );
  
  // Get unselected custom themes
  const otherCustomThemes = customThemes.filter(
    (t) => `custom:${t.id}` !== currentThemeId,
  );

  const result = [];
  
  // Prioritize: selected theme first
  if (selectedCustomTheme) {
    result.push(selectedCustomTheme);
  }

  // Then add up to 3 other custom themes
  const remaining = MAX_VISIBLE - result.length;
  result.push(...otherCustomThemes.slice(0, remaining));

  return result;
}, [customThemes, currentThemeId]);

const hasMoreCustomThemes = customThemes.length > visibleCustomThemes.length;
```

**Logic Summary**:
- Always prioritize currently selected custom theme
- Show up to 4 total custom themes
- If more exist, show "More themes" link that opens a dialog

### Rendering: Built-in Themes (Lines 183-207)
```typescript
{themes?.map((theme) => {
  const isSelected = currentThemeId === theme.id;
  return (
    <DropdownMenuItem
      key={theme.id}
      onClick={() => handleThemeSelect(theme.id)}
      className={`py-2 px-3 ${isSelected ? "bg-primary/10" : ""}`}
      data-testid={`theme-option-${theme.id}`}
      title={theme.description}
    >
      <div className="flex items-center w-full">
        {theme.icon === "palette" && (
          <Palette size={16} className="mr-2 text-muted-foreground" />
        )}
        <span className="flex-1">{theme.name}</span>
        {isSelected && (
          <Check size={16} className="text-primary ml-2" />
        )}
      </div>
    </DropdownMenuItem>
  );
})}
```

**Rendering Notes**:
- Iterates over `themes` array (typically just 1 default theme)
- Check mark indicates selected theme
- Icon is rendered based on theme.icon property

### Rendering: Custom Themes (Lines 213-236)
```typescript
{visibleCustomThemes.map((theme) => {
  const themeId = `custom:${theme.id}`;
  const isSelected = currentThemeId === themeId;
  return (
    <DropdownMenuItem
      key={themeId}
      onClick={() => handleThemeSelect(themeId)}
      className={`py-2 px-3 ${isSelected ? "bg-primary/10" : ""}`}
      data-testid={`theme-option-${themeId}`}
      title={theme.description || "Custom theme"}
    >
      <div className="flex items-center w-full">
        <Brush size={16} className="mr-2 text-muted-foreground" />
        <span className="flex-1">{theme.name}</span>
        {isSelected && (
          <Check size={16} className="text-primary ml-2" />
        )}
      </div>
    </DropdownMenuItem>
  );
})}
```

**Rendering Notes**:
- Iterates over `visibleCustomThemes` (filtered to show max 4)
- Theme ID is prefixed with `custom:` to distinguish from built-in
- Shows custom theme icon (Brush) instead of palette

### Theme Selection Handler (Lines 98-114)
```typescript
const handleThemeSelect = async (themeId: string | null) => {
  if (appId != null) {
    // For app-specific theme: update app in DB
    await ipc.template.setAppTheme({
      appId,
      themeId,  // Can be null for "no theme"
    });
    // Invalidate app theme query to refetch
    queryClient.invalidateQueries({
      queryKey: queryKeys.appTheme.byApp({ appId }),
    });
  } else {
    // For default theme: update user settings
    // Store as string (empty string for no theme)
    await updateSettings({ selectedThemeId: themeId ?? "" });
  }
};
```

---

## QUERY KEY FACTORY

**File**: `src/lib/queryKeys.ts` (Lines 160-169)

```typescript
themes: {
  all: ["themes"] as const,
},
customThemes: {
  all: ["custom-themes"] as const,
},
```

**Usage**:
- `queryKeys.themes.all` → Used as React Query key for built-in themes
- `queryKeys.customThemes.all` → Used as React Query key for custom themes
- `queryClient.invalidateQueries({ queryKey: queryKeys.customThemes.all })` → Refresh custom themes

---

## HOME PAGE INTEGRATION

**File**: `src/pages/home.tsx`

```typescript
// Line 216: HomeChatInput is rendered in home page
<HomeChatInput onSubmit={handleSubmit} />
```

**File**: `src/components/chat/HomeChatInput.tsx`

```typescript
// Line 153: AuxiliaryActionsMenu is rendered inside HomeChatInput
<div className="flex items-center gap-2">
  <AuxiliaryActionsMenu
    onFileSelect={handleFileSelect}
    hideContextFilesPicker
    // Note: No appId prop = uses default theme from settings
  />
</div>
```

**Theme Selection Flow**:
1. User clicks '+' button (opens dropdown menu)
2. User selects a theme
3. `handleThemeSelect()` is called
4. If no appId: `updateSettings({ selectedThemeId: ... })`
5. When user creates an app: `ipc.template.setAppTheme()` is called with the stored `selectedThemeId`

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│ src/shared/themes.ts        │  Database (customThemes)      │
│ themesData: Theme[]         │  -> via Drizzle ORM           │
│ (1 built-in theme)          │  (N custom themes)            │
└─────────────────────────────────────────────────────────────┘
           ↓                              ↓
┌─────────────────────────────────────────────────────────────┐
│           IPC HANDLERS (Main Process)                       │
├─────────────────────────────────────────────────────────────┤
│ src/pro/main/ipc/handlers/themes_handlers.ts                │
│                                                              │
│ registerThemesHandlers() {                                  │
│   handle("get-themes") → return themesData                  │
│   handle("get-custom-themes") → db.query.customThemes...   │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
           ↓ IPC Call via electron.ipcRenderer.invoke()
┌─────────────────────────────────────────────────────────────┐
│         IPC CONTRACTS (Type Definitions)                    │
├─────────────────────────────────────────────────────────────┤
│ src/ipc/types/templates.ts                                  │
│                                                              │
│ templateContracts = {                                       │
│   getThemes: { channel: "get-themes", ... }                 │
│   getCustomThemes: { channel: "get-custom-themes", ... }    │
│ }                                                            │
│                                                              │
│ templateClient = createClient(templateContracts)            │
│ → Exported as ipc.template.*                                │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│     REACT QUERY HOOKS (Data Fetching & Caching)             │
├─────────────────────────────────────────────────────────────┤
│ src/hooks/useThemes.ts                                      │
│   useQuery({                                                │
│     queryKey: ["themes"],                                   │
│     queryFn: () => ipc.template.getThemes(),                │
│     placeholderData: themesData  ← Static fallback         │
│   })                                                         │
│                                                              │
│ src/hooks/useCustomThemes.ts                                │
│   useQuery({                                                │
│     queryKey: ["custom-themes"],                            │
│     queryFn: () => ipc.template.getCustomThemes(),          │
│     // NO placeholder - default to []                       │
│   })                                                         │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│      RENDERER COMPONENT STATE & FILTERING                   │
├─────────────────────────────────────────────────────────────┤
│ src/components/chat/AuxiliaryActionsMenu.tsx                │
│                                                              │
│ Data Binding:                                               │
│   const { themes } = useThemes()                            │
│   const { customThemes } = useCustomThemes()                │
│   const currentThemeId = ...                                │
│                                                              │
│ Filtering:                                                   │
│   visibleCustomThemes = limit customThemes to 4            │
│   hasMoreCustomThemes = customThemes.length > 4            │
│                                                              │
│ Rendering:                                                   │
│   - "No Theme" option                                       │
│   - themes?.map() → Built-in theme dropdown items          │
│   - visibleCustomThemes.map() → Custom theme items         │
│   - "More themes" link (if hasMoreCustomThemes)           │
│   - "New Theme" option                                      │
└─────────────────────────────────────────────────────────────┘
           ↓ User selects theme
┌─────────────────────────────────────────────────────────────┐
│           UI DROPDOWN MENU IN HOME '+'                      │
│         (Part of HomeChatInput on home.tsx)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## FAILURE POINTS & DIAGNOSTICS

### 1. EMPTY BUILT-IN THEMES LIST
**Symptom**: Only "No Theme" option visible, no default theme

**Root Causes**:
- `useThemes()` returns `undefined` instead of theme array
- IPC call `ipc.template.getThemes()` fails/returns undefined
- Handler "get-themes" not registered (check `registerThemesHandlers()` is called)
- `themesData` in `src/shared/themes.ts` is empty

**Diagnosis**:
1. Check console for IPC errors
2. Verify `src/shared/themes.ts` has non-empty `themesData`
3. Open DevTools Console and run: `await ipc.template.getThemes()`
4. Check React Query DevTools for queryKey `["themes"]` - should have data
5. Verify in `src/ipc/ipc_host.ts` line 74: `registerThemesHandlers()` is called

### 2. EMPTY CUSTOM THEMES LIST
**Symptom**: Custom themes section missing from menu

**Root Causes**:
- `useCustomThemes()` returns `undefined` or `[]` (empty is OK unless data exists in DB)
- IPC call fails (database query error)
- Handler "get-custom-themes" not registered
- Database table `customThemes` is empty (normal if user never created any)
- Query result mapping error

**Diagnosis**:
1. Check console for IPC errors
2. Verify database has custom themes: In main process, query SQLite directly
3. Open DevTools Console and run: `await ipc.template.getCustomThemes()`
4. Check React Query DevTools for queryKey `["custom-themes"]`
5. Verify in `src/pro/main/ipc/handlers/themes_handlers.ts` line 314 handler exists

### 3. THEMES NOT VISIBLE IN DROPDOWN
**Symptom**: Menu opens but no theme options shown

**Root Causes**:
- `themes` or `customThemes` is `undefined` (not just empty)
- `visibleCustomThemes` computed incorrectly
- CSS/display issue (menu hidden by overflow, z-index, etc.)
- Error in `useMemo` computation

**Diagnosis**:
1. Inspect element: Right-click menu → Inspect → Check if `<DropdownMenuItem>` elements exist
2. Check browser console for errors in React
3. Add console.log in `useMemo` to verify computation
4. Verify `themes?.map()` - the `?.` means it only renders if themes exists

### 4. DROPDOWN MENU NEVER OPENS
**Symptom**: Click '+' button, menu doesn't appear

**Root Causes**:
- `AuxiliaryActionsMenu` not being rendered in `HomeChatInput`
- `isOpen` state not toggling
- Event listener not attached
- CSS display issue (hidden menu)

**Diagnosis**:
1. Inspect element: Is `<DropdownMenu>` rendered?
2. Is there a `<DropdownMenuTrigger>` with the '+' button?
3. Check React DevTools: Is `AuxiliaryActionsMenu` mounted?
4. Verify `onOpenChange={setIsOpen}` is wired correctly
5. Check CSS: Is menu display hidden?

### 5. THEME SELECTION NOT PERSISTED
**Symptom**: Select a theme, but it doesn't stay selected

**Root Causes**:
- `handleThemeSelect()` not being called
- Settings update fails (async error)
- App theme update fails (database error)
- Query invalidation not working

**Diagnosis**:
1. Add console.log in `handleThemeSelect()` to verify it's called
2. Check browser console for IPC errors when selecting
3. Check React Query DevTools: Does query invalidate after selection?
4. Verify `ipc.template.setAppTheme()` succeeds
5. Verify `updateSettings({ selectedThemeId })` succeeds

---

## CRITICAL INTEGRATION POINTS CHECKLIST

| Component | File | Line(s) | Purpose | Status |
|-----------|------|---------|---------|--------|
| **Data Source: Built-in** | `src/shared/themes.ts` | 63-71 | Export themesData array | ✓ PRESENT |
| **Data Source: Custom** | DB schema | - | customThemes table | ✓ PRESENT |
| **IPC Contracts** | `src/ipc/types/templates.ts` | 227-250 | defineContract for getThemes & getCustomThemes | ✓ PRESENT |
| **IPC Client Export** | `src/ipc/types/templates.ts` | 300 | templateClient creation | ✓ PRESENT |
| **IPC Namespace** | `src/ipc/types/index.ts` | 429 | ipc.template assignment | ✓ PRESENT |
| **Handler: Built-in** | `src/pro/main/ipc/handlers/themes_handlers.ts` | 280-282 | handle("get-themes") | ✓ PRESENT |
| **Handler: Custom** | `src/pro/main/ipc/handlers/themes_handlers.ts` | 314-327 | handle("get-custom-themes") | ✓ PRESENT |
| **Handler Registration** | `src/ipc/ipc_host.ts` | 1, 74 | registerThemesHandlers() | ✓ PRESENT |
| **Hook: Built-in** | `src/hooks/useThemes.ts` | 6-23 | useThemes() | ✓ PRESENT |
| **Hook: Custom** | `src/hooks/useCustomThemes.ts` | 16-33 | useCustomThemes() | ✓ PRESENT |
| **Query Keys** | `src/lib/queryKeys.ts` | 160-169 | queryKeys.themes & .customThemes | ✓ PRESENT |
| **UI Component** | `src/components/chat/AuxiliaryActionsMenu.tsx` | 61-62 | useThemes() & useCustomThemes() calls | ✓ PRESENT |
| **UI: Built-in Render** | `src/components/chat/AuxiliaryActionsMenu.tsx` | 183-207 | themes?.map() | ✓ PRESENT |
| **UI: Custom Render** | `src/components/chat/AuxiliaryActionsMenu.tsx` | 213-236 | visibleCustomThemes.map() | ✓ PRESENT |
| **Home Page Mount** | `src/pages/home.tsx` | 216 | `<HomeChatInput />` | ✓ PRESENT |
| **HomeChatInput Mount** | `src/components/chat/HomeChatInput.tsx` | 153 | `<AuxiliaryActionsMenu />` | ✓ PRESENT |

---

## MOST LIKELY FAILURE SCENARIOS

Given the recent commits (gallery/theme page changes), here are the most probable failure points:

### Scenario A: Handler Not Registered
**If custom themes are missing:**
- Check that `registerThemesHandlers()` wasn't removed from `src/ipc/ipc_host.ts`
- Verify import statement at top of file still exists

### Scenario B: IPC Contract Changed
**If neither themes nor custom themes show:**
- Check if `templateContracts` was renamed or moved
- Verify `templateClient` is still created and exported
- Confirm `ipc.template` is still available in namespace

### Scenario C: Component Not Rendered
**If menu doesn't appear at all:**
- Check if `AuxiliaryActionsMenu` is still imported in `HomeChatInput`
- Verify component is still rendered (not conditionally hidden)
- Check if `hideContextFilesPicker` prop is causing unintended behavior

### Scenario D: Database Migration Issue
**If custom themes are empty despite data existing:**
- Check if recent database migration added/altered `customThemes` table
- Verify Drizzle schema in `src/db/schema.ts` matches database
- Run `npm run db:generate` if schema was changed

### Scenario E: Type Mismatch
**If menu appears but themes render incorrectly:**
- Check if `Theme` or `CustomTheme` interface changed
- Verify schema in `src/ipc/types/templates.ts` lines 43-95 matches actual data
- Look for TypeScript errors in compiler output

---

## SUMMARY: WHERE TO FETCH, WHERE TO FILTER, LIKELY FAILURES

### WHERE CUSTOM THEMES ARE FETCHED
1. **Source**: SQLite `customThemes` table
2. **Fetch Point**: `src/pro/main/ipc/handlers/themes_handlers.ts` line 314-327
3. **How**: `db.query.customThemes.findMany({ orderBy: ... })`
4. **Delivery**: IPC channel "get-custom-themes"
5. **Renderer Receipt**: `src/hooks/useCustomThemes.ts` via React Query

### WHERE THEMES ARE FILTERED
1. **Visible Limit**: `src/components/chat/AuxiliaryActionsMenu.tsx` lines 73-94
2. **Logic**: Show max 4 custom themes (selected + 3 others)
3. **Selection Tracking**: `currentThemeId` computed from appId or settings
4. **Rendering**: Conditional map functions with optional chaining (`themes?.map()`)

### MOST LIKELY FAILURE POINTS (In Priority Order)
1. **Handler not registered** → No IPC call succeeds
2. **Empty themesData in `src/shared/themes.ts`** → Built-in theme missing
3. **useThemes() or useCustomThemes() not called** → No fetch initiated
4. **Component not rendered** → Menu never appears
5. **Database empty** → Custom themes legitimately don't exist (not a bug)
6. **Type mismatch** → Data fetched but doesn't render correctly
7. **CSS/z-index issue** → Data exists but hidden from view

