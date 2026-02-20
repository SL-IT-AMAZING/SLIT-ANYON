# Theme Menu Rendering - Quick Reference

## Guard Quick Lookup

### Where Do Things Render?

| Item | File:Line | Guard | Home | Chat |
|------|-----------|-------|------|------|
| No Theme | AAM:179 | None | ✅ | ✅ |
| Builtin Themes | AAM:193 | themes?.map() | ✅ | ✅ |
| **Design Sys - None** | **AAM:223** | **appId==null && len>0** | ✅ | ❌ |
| **Design Sys - Items** | **AAM:236** | **appId==null && len>0** | ✅ | ❌ |
| Custom Themes | AAM:269 | visibleCustomThemes.len>0 | ✅* | ✅* |
| More Themes | AAM:298 | customThemes.len>4 | ✅* | ✅* |
| Create Theme | AAM:319 | None | ✅ | ✅ |

**Key**: `*` = requires data loaded

---

## Data Hydration Timeline

### On Page Load

```
T+0ms:   Builtin themes rendered (placeholder loaded)
T+20ms:  Settings loaded → selectedThemeId available
T+100ms: Custom themes loaded → customThemes array ready
T+100ms: Design systems loaded → designSystems array ready
T+chat:  App theme loaded IF appId exists (enabled: !!appId)
```

### Hook Defaults

| Hook | Returns | Default | Timing |
|------|---------|---------|--------|
| useThemes | themes | ✅ themesData | Immediate |
| useCustomThemes | [] | ❌ Empty array | After IPC |
| useDesignSystems | [] | ❌ Empty array | After IPC |
| useAppTheme (enabled) | null | ❌ null | Per appId |

---

## Design System Visibility Matrix

### Most Critical: appId Branch

**Location**: `AuxiliaryActionsMenu.tsx` **line 220**

```typescript
{appId == null && designSystems.length > 0 && (
```

#### Decision Tree

```
Is appId truthy?
├─ YES (appId = number, Chat context)
│  └─ Design Systems → HIDDEN ❌
├─ NO (appId = undefined/null, Home context)
│  └─ Has design systems?
│     ├─ YES → Show Design System section ✅
│     └─ NO → Hidden (empty state)
```

### Why Hidden in Chat?

- Chat uses **app-specific theme** (not settings theme)
- Design systems are **account-level defaults** for new apps only
- Once app created, theme is per-app
- Line 103-112: Chat only calls `setAppTheme()`, not `setDesignSystem()`

---

## Critical State Variables

### currentThemeId (Line 72-73)

```typescript
const currentThemeId = appId != null ? appThemeId : settings?.selectedThemeId || null;
```

| Context | appId | Source | Value |
|---------|-------|--------|-------|
| Home | undefined | settings | "builtin-light" or "custom:5" or null |
| Chat (no app) | null | settings | "builtin-light" or "custom:5" or null |
| Chat (with app) | number | hook | IPC response (app-specific) |

### currentDesignSystemId (Line 74)

```typescript
const currentDesignSystemId = settings?.selectedDesignSystemId || null;
```

| Always | Source | Notes |
|--------|--------|-------|
| ✅ Same everywhere | settings only | Never app-specific |

---

## Custom Themes Visibility Logic

**File**: Lines 77-98 (useMemo)

### Input: customThemes array

Example: `[{id:1,name:"Dark"}, {id:2,name:"Light"}, {id:3,name:"Blue"}, {id:4,name:"Green"}, {id:5,name:"Pink"}]`

### Algorithm

1. **Find selected**: Is any custom theme currently selected?
   - Match: `custom:${theme.id} === currentThemeId`
   - If yes, add to result first (always visible if selected)

2. **Collect others**: Get remaining themes (non-selected)

3. **Limit to 4**: Add up to 3 others
   - Selected (if exists): 1
   - Others: up to 3
   - Total: max 4

### Output: visibleCustomThemes

Example with 5 total, "Dark" selected:
```
[{id:1,name:"Dark"}, {id:2,name:"Light"}, {id:3,name:"Blue"}, {id:4,name:"Green"}]
```

Example with 5 total, none selected:
```
[{id:1,name:"Dark"}, {id:2,name:"Light"}, {id:3,name:"Blue"}, {id:4,name:"Green"}]
```

### More Themes Visibility

**Line 100**: `hasMoreCustomThemes = customThemes.length > visibleCustomThemes.length`

- 5 total, 4 visible → 5 > 4 = TRUE → Show "More Themes" ✅
- 4 total, 4 visible → 4 > 4 = FALSE → Hidden ❌
- 3 total, 3 visible → 3 > 3 = FALSE → Hidden ❌

---

## Selection Persistence

### Settings (Home Context)

```
User selects Design System A
→ handleDesignSystemSelect(id)
→ updateSettings({selectedDesignSystemId: id})
→ Saved to DB
→ On next load, settings hydration restores it
→ When creating app: designSystemId passed to ipc.app.createApp()
```

### App Theme (Chat Context)

```
User selects Builtin Theme X
→ handleThemeSelect("builtin-id")
→ ipc.template.setAppTheme({appId, themeId})
→ Saved to app record
→ On next load, useAppTheme({appId}) fetches it
→ currentThemeId reads from appThemeId hook
```

### Custom Theme

```
User selects Custom Theme Y
→ handleThemeSelect("custom:5")
→ IF appId: setAppTheme({appId, "custom:5"})
→ IF !appId: updateSettings({selectedThemeId: "custom:5"})
→ String format "custom:${id}" is KEY to differentiation
```

---

## Test IDs Reference

### Critical for Testing Design Systems

```javascript
// Design System section exists check
cy.get('[data-testid="design-system-option-none"]').should('exist');

// Design System option selection
cy.get('[data-testid="design-system-option-${id}"]').click();

// Hidden in chat (should not exist)
cy.get('[data-testid="design-system-option-"]').should('not.exist');

// Custom theme rendering
cy.get('[data-testid="theme-option-custom:5"]').should('exist');
```

---

## Common Issues & Debugging

### Design System Options Invisible

**Symptom**: Design system section doesn't appear in home page menu

**Check**:
1. Are you on HOME page? (not chat)
   - Test: `appId` should be `undefined`
   - Debug: Open DevTools → Check `selectedAppIdAtom` value
   
2. Is `designSystems.length > 0`?
   - Test: Pull up network tab → find `getDesignSystems` response
   - Debug: Check if IPC returned empty array `[]`
   
3. Is condition true? `appId == null && designSystems.length > 0`
   - Both must be true

**Solution**: 
- Verify design systems exist in backend
- Verify on home page (no appId)
- Clear browser cache + reload

### Custom Themes Not Appearing

**Symptom**: Only 4 custom themes visible, but more exist

**Check**:
- This is **by design**: limited to 4 visible
- Click "More Themes" to see full list
- If "More Themes" missing: probably ≤4 total custom themes

### Theme Selection Not Persisting

**Symptom**: Selected theme resets on reload

**Check**:
1. **Home Page**: Did settings save?
   - Look for `selectedThemeId` in settings DB
   - Check `updateSettings()` call succeeded
   
2. **Chat Page**: Did app theme save?
   - Look for app record with themeId field
   - Check `setAppTheme()` call succeeded

---

## Edge Cases

### appId Transitions

**Scenario**: User on home (appId=undefined) → Creates app → Chat (appId=123)

- **Before create**: uses `settings?.selectedThemeId`
- **After create**: applies theme from settings **once** at app creation
- **In chat**: switches to `appThemeId` (per-app query)
- Design system section **disappears** when appId becomes a number

### Settings Not Yet Loaded

**Scenario**: Page loads, user immediately opens menu before settings hydration

- **Builtin themes**: ✅ Already rendered (placeholder)
- **Design systems**: ❌ May not appear (waiting for IPC)
- **Selected status**: ❌ Can't show (settings not loaded)
- Fix: Wait for `useSettings()` loading to complete

### No Custom Themes

**Scenario**: No custom themes created yet

- **Custom themes section**: Hidden (guard: `visibleCustomThemes.length > 0`)
- **"More Themes" button**: Hidden (guard: `hasMoreCustomThemes`)
- **"Create Custom Theme"**: ✅ Still visible (no guard)

---

## Performance Considerations

### Rendering Efficiency

| Component | Re-renders When | Frequency |
|-----------|-----------------|-----------|
| Menu trigger | isOpen changes | User click |
| All options | currentThemeId changes | Theme selection |
| Design systems | designSystems array changes | New system created |
| Custom themes | visibleCustomThemes changes | Custom theme CRUD |
| "More Themes" | hasMoreCustomThemes changes | When 5th custom theme added |

### Memoization

```typescript
// Line 77: visibleCustomThemes computed with useMemo
const visibleCustomThemes = useMemo(() => {
  // ... expensive computation
}, [customThemes, currentThemeId]); // Re-compute only if these change
```

**Impact**: Limits re-renders when unrelated state changes

---

## Summary for Code Review

### Lines to Watch

| Line(s) | What | Why Critical |
|---------|------|--------------|
| 72-74 | currentThemeId logic | Determines what's selected |
| 103-112 | appId != null check | Updates app theme only in chat |
| 220 | `appId == null &&` | Controls design system visibility |
| 266 | `visibleCustomThemes.length > 0` | Controls custom themes visibility |
| 297 | `hasMoreCustomThemes` | Controls "More Themes" visibility |

### Design System Additions: Confidence Checklist

- [x] Guard at line 220 prevents chat visibility
- [x] Guard at line 220 requires `designSystems.length > 0`
- [x] Selection stored in `settings?.selectedDesignSystemId`
- [x] Selection applied only on home (appId == null)
- [x] Design system used when creating app (home.tsx line 136)
- [x] No app-specific design system (only theme)
- [x] Separator renders before section (line 222)
- [x] Icons render correctly (line 250: `<Blocks>`)
- [x] Test IDs present for QA (line 246: `design-system-option-`)

