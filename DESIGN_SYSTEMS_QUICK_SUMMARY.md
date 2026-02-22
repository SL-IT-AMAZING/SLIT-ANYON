# Design Systems in Home '+' Menu - Quick Summary

## TL;DR: Design Systems ARE Integrated (But Hidden)

✅ **Design systems ARE selectable from Home '+' menu**
❌ **BUT they're hidden inside the Themes submenu without a label**
❌ **AND they can't be changed on existing apps**

---

## File Locations (Quick Reference)

### The Home '+' Menu Implementation

📍 **`src/components/chat/AuxiliaryActionsMenu.tsx`**

- Line 21: `import { useDesignSystems }`
- Line 65: `const { designSystems } = useDesignSystems()`
- Line 74: `const currentDesignSystemId = settings?.selectedDesignSystemId || null`
- Line 125-130: `handleDesignSystemSelect()` handler
- **Line 220-250**: UI rendering (design systems listed INSIDE Themes submenu)

### Settings & Persistence

📍 **`src/lib/schemas.ts:295`** - `selectedDesignSystemId` field
📍 **`src/main/settings.ts`** - Default value: `""`

### App Creation Flow

📍 **`src/pages/home.tsx:134-137`** - Passes `designSystemId` to `createApp()`
📍 **`src/ipc/types/app.ts:53-57`** - IPC contract includes `designSystemId`
📍 **`src/ipc/handlers/app_handlers.ts`** - Stores & applies design system

---

## The Core Issue: Discoverability

### Theme Selection (Full Feature)

```
1. User opens Home '+' menu
2. Sees "Themes" submenu
3. Selects theme → stored in settings
4. Theme applied to new app
✅ Clear, intuitive
```

### Design System Selection (Hidden Feature)

```
1. User opens Home '+' menu
2. Sees "Themes" submenu (no mention of design systems)
3. Opens Themes submenu
4. Design systems listed AFTER themes with just a separator
5. Selects design system → stored in settings
6. Design system applied to new app
❌ Hidden, confusing, no label
```

---

## Key Constraints

| Feature               | Works? | Details                                  |
| --------------------- | ------ | ---------------------------------------- |
| Select on Home page   | ✅ Yes | Only when creating new apps              |
| Change existing app   | ❌ No  | Handler returns early if `appId != null` |
| Shows in Themes menu  | ✅ Yes | At lines 220-250                         |
| Has menu label        | ❌ No  | Just appears after separator             |
| Has default value     | ❌ No  | Defaults to empty string                 |
| Persisted to settings | ✅ Yes | `selectedDesignSystemId`                 |
| Passed to createApp   | ✅ Yes | Lines 134-137 in home.tsx                |

---

## 3 Things That Would Improve It

### 1. Add a Menu Label (Easiest)

**File**: `src/components/chat/AuxiliaryActionsMenu.tsx:220`

Add before the design systems list:

```tsx
<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
  Design Systems
</div>
```

### 2. Set a Default (Easy)

**File**: `src/main/settings.ts`

Change from:

```ts
selectedDesignSystemId: "",
```

To:

```ts
selectedDesignSystemId: "shadcn",
```

### 3. Allow Changing Existing Apps (Harder)

Would require:

- Removing the `if (appId != null) return;` check
- Adding `setAppDesignSystem()` IPC handler
- Updating the design system on app record
- Determining if design system changes are meaningful after creation

---

## What's Currently Missing

- [ ] Visual separation: Design systems should have their own submenu, not be hidden in Themes
- [ ] Menu label: "Design Systems" header in the dropdown
- [ ] Default value: Currently empty string, should be "shadcn"
- [ ] Runtime changes: Can't change design system on existing apps
- [ ] UX clarity: Users might not realize design systems are available

---

## Files You Need to Know

```
Design System Selection:
  ├─ UI Component: src/components/chat/AuxiliaryActionsMenu.tsx
  ├─ Hook: src/hooks/useDesignSystems.ts
  ├─ Settings: src/lib/schemas.ts + src/main/settings.ts
  └─ Home Flow: src/pages/home.tsx

IPC Contract:
  ├─ App: src/ipc/types/app.ts (CreateAppParamsSchema)
  ├─ Handler: src/ipc/handlers/app_handlers.ts
  └─ Design Systems: src/ipc/types/design_systems.ts
```

---

## Status

✅ Feature is **implemented and working**
❌ But **discoverability is poor** due to hidden UI placement
❌ And **can't be changed after app creation**

The infrastructure is solid; the UX needs polish.
