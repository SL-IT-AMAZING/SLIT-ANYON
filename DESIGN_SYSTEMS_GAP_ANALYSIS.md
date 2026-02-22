# DESIGN SYSTEMS SELECTION - DETAILED GAP ANALYSIS

## Status: Design Systems ARE Already Integrated in AuxiliaryActionsMenu!

---

## CRITICAL FINDING

The design systems selection UI **IS ALREADY IMPLEMENTED** in the Home '+' menu via `AuxiliaryActionsMenu.tsx`, but it has a KEY DIFFERENCE from themes in how it's presented and constrained.

---

## 1. DESIGN SYSTEMS UI IMPLEMENTATION ✅ (EXISTS)

### 1a. Hook Integration

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:21, 65`

```tsx
import { useDesignSystems } from "@/hooks/useDesignSystems";
const { designSystems } = useDesignSystems();
```

### 1b. Current Design System Tracking

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:74`

```tsx
const currentDesignSystemId = settings?.selectedDesignSystemId || null;
```

### 1c. Selection Handler

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:125-130`

```tsx
const handleDesignSystemSelect = async (designSystemId: string | null) => {
  if (appId != null) {
    return; // ⚠️ NOTE: Only works when appId is null (Home page)
  }
  await updateSettings({ selectedDesignSystemId: designSystemId ?? "" });
};
```

### 1d. Design Systems Menu UI

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:220-250`

- Shown WITHIN the Themes submenu (lines 220-250)
- Displayed AFTER themes section with separator
- Shows all design systems from `designSystems` array
- Uses `Blocks` icon (line 237)
- Renders displayName with selection indicator
- **CONDITIONAL**: Only shown when `appId == null` (Home page context)

```tsx
{
  appId == null && designSystems.length > 0 && (
    <>
      <DropdownMenuSeparator />
      {designSystems.map((designSystem) => {
        const isSelected = currentDesignSystemId === designSystem.id;
        return (
          <DropdownMenuItem
            key={`design-system-${designSystem.id}`}
            onClick={() => handleDesignSystemSelect(designSystem.id)}
            className={`py-2 px-3 ${isSelected ? "bg-primary/10" : ""}`}
            data-testid={`design-system-option-${designSystem.id}`}
            title={designSystem.description}
          >
            <div className="flex items-center w-full">
              <Blocks size={16} className="mr-2 text-muted-foreground" />
              <span className="flex-1">{designSystem.displayName}</span>
              {isSelected && <Check size={16} className="text-primary ml-2" />}
            </div>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
```

---

## 2. THEME vs DESIGN SYSTEM COMPARISON

| Aspect                         | Themes                           | Design Systems                        |
| ------------------------------ | -------------------------------- | ------------------------------------- |
| **Home Menu UI**               | ✅ Full Themes submenu           | ✅ Listed in Themes submenu           |
| **Visual Location**            | Lines 161-278 (separate submenu) | Lines 220-250 (inside Themes submenu) |
| **Settings Persistence**       | ✅ `selectedThemeId`             | ✅ `selectedDesignSystemId`           |
| **Selection Handler**          | ✅ `handleThemeSelect`           | ✅ `handleDesignSystemSelect`         |
| **Appid Constraint**           | Works in both contexts           | ⚠️ Only when `appId == null`          |
| **Hook**                       | `useThemes()`                    | `useDesignSystems()`                  |
| **Icon**                       | `Palette`                        | `Blocks`                              |
| **Can Apply to New Apps**      | ✅ Yes (AFTER creation via IPC)  | ✅ Yes (DURING creation via param)    |
| **Can Apply to Existing Apps** | ✅ Yes (via IPC)                 | ❌ No (only at creation)              |

---

## 3. COMPLETE DATA FLOW FOR DESIGN SYSTEMS

### 3a. Home Page: Initial App Creation

**File**: `src/pages/home.tsx:134-137`

```tsx
const result = await ipc.app.createApp({
  name: generateCuteAppName(),
  designSystemId: settings?.selectedDesignSystemId || undefined, // ✅ Passed
});
```

### 3b. IPC Contract

**File**: `src/ipc/types/app.ts:53-57`

```ts
export const CreateAppParamsSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().optional(),
  designSystemId: z.string().optional(), // ✅ Defined
});
```

### 3c. Handler: Store in Database

**File**: `src/ipc/handlers/app_handlers.ts` (grep output)

```ts
const [app] = await db
  .insert(apps)
  .values({
    name: params.name,
    path: appPath,
    designSystemId: params.designSystemId ?? null, // ✅ Stored
  })
  .returning();
```

### 3d. Handler: Apply to Template

**File**: `src/ipc/handlers/app_handlers.ts`

```ts
await createFromTemplate({
  fullAppPath,
  templateId: params.templateId,
  designSystemId: params.designSystemId, // ✅ Passed to template
});
```

### 3e. App Schema

**File**: `src/ipc/types/app.ts:34`

```ts
designSystemId: z.string().nullable().optional(),
```

---

## 4. THE ACTUAL GAPS & ISSUES ⚠️

### Gap 1: Design Systems Are Hidden in Theme Submenu UI

**Issue**: Design systems appear INSIDE the Themes submenu, making them less discoverable

- Themes have their own dedicated submenu label ("Themes")
- Design systems are listed with a separator but no dedicated label
- Users might not expect design systems to be grouped with themes
- No visual distinction in menu headers

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:161-278`

- Design systems show at lines 220-250, which is AFTER theme items but INSIDE DropdownMenuSubContent

### Gap 2: Design Systems Only Work When appId Is Null

**Issue**: Design system selection handler returns early if appId exists
**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:125-130`

```tsx
const handleDesignSystemSelect = async (designSystemId: string | null) => {
  if (appId != null) {
    return; // ❌ No-op for existing apps
  }
  // ...
};
```

**Comparison with Themes**:

- Themes CAN be changed on existing apps (via `ipc.template.setAppTheme`)
- Design systems CANNOT be changed on existing apps

### Gap 3: Design Systems Are Only Applied at Creation Time

**Process**:

1. User selects design system from Home menu
2. Design system saved to `settings.selectedDesignSystemId`
3. Design system passed to `createApp()` IPC
4. Applied during template generation
5. Cannot be changed after app creation

**Contrast with Themes**:

1. User selects theme from Home menu
2. Theme saved to `settings.selectedThemeId`
3. Theme applied AFTER app creation via separate `setAppTheme()` IPC call
4. Theme CAN be changed later via `setAppTheme()` IPC

**File References**:

- Design system: `src/pages/home.tsx:134-137` (passed to createApp)
- Theme: `src/pages/home.tsx:139-145` (applied AFTER via setAppTheme)

### Gap 4: No Visual Menu Hierarchy/Organization

**Issue**: Design systems appear with no label/header distinguishing them from themes

- Themes: Explicit "Themes" submenu trigger
- Design Systems: Just appear in the submenu content after themes
- No "Design Systems" label like there is "Themes"

### Gap 5: No Default Design System Preference

**File**: `src/main/settings.ts`

```ts
selectedThemeId: DEFAULT_THEME_ID,      // Has a default
selectedDesignSystemId: "",             // Empty string default
```

**Impact**: Users get a sensible theme default but no design system default, leading to undefined behavior

### Gap 6: Design System Selection Conditional on appId=null

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:220`

```tsx
{appId == null && designSystems.length > 0 && (
  // Design systems only shown when appId is null
)}
```

**Issue**: Design systems never appear in the chat menu when editing an existing app

---

## 5. FILE REFERENCE MAP

### Core Implementation

| File                                           | Line(s) | Purpose                                   |
| ---------------------------------------------- | ------- | ----------------------------------------- |
| `src/components/chat/AuxiliaryActionsMenu.tsx` | 21      | Import useDesignSystems                   |
| `src/components/chat/AuxiliaryActionsMenu.tsx` | 65      | Call useDesignSystems hook                |
| `src/components/chat/AuxiliaryActionsMenu.tsx` | 74      | Track currentDesignSystemId from settings |
| `src/components/chat/AuxiliaryActionsMenu.tsx` | 125-130 | Handler for design system selection       |
| `src/components/chat/AuxiliaryActionsMenu.tsx` | 220-250 | UI rendering design systems in submenu    |

### Settings & Persistence

| File                        | Line(s) | Purpose                                    |
| --------------------------- | ------- | ------------------------------------------ |
| `src/lib/schemas.ts`        | 295     | UserSettingsSchema: selectedDesignSystemId |
| `src/main/settings.ts`      | -       | Default: selectedDesignSystemId: ""        |
| `src/ipc/types/settings.ts` | 18-47   | Settings IPC contracts                     |

### IPC Contracts & Handlers

| File                               | Line(s) | Purpose                                       |
| ---------------------------------- | ------- | --------------------------------------------- |
| `src/ipc/types/app.ts`             | 53-57   | CreateAppParamsSchema includes designSystemId |
| `src/ipc/types/app.ts`             | 34      | App record schema has designSystemId field    |
| `src/ipc/handlers/app_handlers.ts` | ~12-30  | createApp handler stores designSystemId in DB |
| `src/ipc/handlers/app_handlers.ts` | ~20-24  | Passes designSystemId to createFromTemplate   |
| `src/ipc/types/design_systems.ts`  | 39-57   | Design system contracts                       |

### Home Page Flow

| File                                    | Line(s) | Purpose                                                |
| --------------------------------------- | ------- | ------------------------------------------------------ |
| `src/pages/home.tsx`                    | 134-137 | Creates app with selectedDesignSystemId                |
| `src/pages/home.tsx`                    | 139-145 | Applies selectedThemeId AFTER creation                 |
| `src/components/chat/HomeChatInput.tsx` | 153-156 | Renders AuxiliaryActionsMenu (includes design systems) |

### Hooks

| File                            | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `src/hooks/useDesignSystems.ts` | Fetches design systems via IPC                          |
| `src/hooks/useSettings.ts`      | Reads/updates settings including selectedDesignSystemId |
| `src/hooks/useThemes.ts`        | Fetches themes (for comparison)                         |

---

## 6. SUMMARY: WHAT'S WORKING vs WHAT'S NOT

### ✅ WORKING

- [x] Design systems ARE in Home '+' menu (via AuxiliaryActionsMenu)
- [x] Design systems ARE persisted to settings.selectedDesignSystemId
- [x] Design systems ARE passed to createApp() IPC
- [x] Design systems ARE stored in app database record
- [x] Design systems ARE applied during template creation
- [x] Hook integration (useDesignSystems) exists
- [x] Selection handler exists and updates settings

### ❌ NOT WORKING / MISSING

- [ ] Design systems have no dedicated menu label/header
- [ ] Design systems are hidden inside Themes submenu
- [ ] No default design system (empty string vs themed default)
- [ ] Design systems can't be changed on existing apps
- [ ] No visual distinction between themes and design systems in menu
- [ ] Design system changes only affect new apps, not current app

---

## 7. ROOT CAUSE ANALYSIS

### Why Design Systems Are Hard to Discover

1. **UI Hierarchy Issue**: Design systems are in the Themes submenu, not alongside it
2. **No Label**: No "Design Systems" header to draw attention
3. **Conditional Rendering**: Only show when `appId == null` (could be shown contextually)

### Why Design Systems Can't Be Changed Later

1. **Architectural Design Choice**: Design systems are creation-time config, not runtime setting
2. **Handler Blocks It**: `handleDesignSystemSelect` returns early if `appId != null`
3. **Database Storage**: Once stored in app record, no mechanism to change it

### Why It Works for Themes but Not Design Systems

1. **Theme Flow**: Select → Save to Settings → Apply AFTER app creation via IPC
2. **Design System Flow**: Select → Save to Settings → Apply DURING app creation as parameter
3. **Key Difference**: Themes have a separate IPC call (`setAppTheme`) that works on existing apps

---

## 8. NEXT STEPS FOR FIXING DISCOVERABILITY

### Quick Win: Add Menu Label

Change the separator + items to include a header:

```tsx
{appId == null && designSystems.length > 0 && (
  <>
    <DropdownMenuSeparator />
    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
      Design Systems
    </div>
    {designSystems.map(...)}
  </>
)}
```

### Medium Effort: Set Default Design System

In `src/main/settings.ts`:

```ts
selectedDesignSystemId: "shadcn",  // Match theme default pattern
```

### Higher Effort: Allow Runtime Design System Changes

- Add `setAppDesignSystem()` IPC handler
- Modify `handleDesignSystemSelect` to work when `appId != null`
- Update design system after app creation (if meaningful)
