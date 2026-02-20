# Quick Reference: Test Snapshot Updates for selectedDesignSystemId

## TL;DR - What to Do

Edit `src/__tests__/readSettings.test.ts` and add ONE LINE in TWO places:

```typescript
"selectedDesignSystemId": "",
```

## Location 1: Line 74-75
Insert between these lines:
```typescript
          "selectedThemeId": "default",
          "selectedDesignSystemId": "",  // ← ADD THIS
          "telemetryConsent": "unset",
```

## Location 2: Line 330-331  
Insert between these lines:
```typescript
          "selectedThemeId": "default",
          "selectedDesignSystemId": "",  // ← ADD THIS
          "telemetryConsent": "unset",
```

## Why?
The new `selectedDesignSystemId` field was added to `UserSettings`, but the hardcoded inline snapshots in `readSettings.test.ts` don't include it. Tests will fail if snapshots don't match the object shape.

## Test Commands to Verify
```bash
# Unit tests
npm run test

# Build (required before E2E)
npm run build

# E2E tests (will auto-regenerate snapshots)
npm run e2e

# Full pre-commit checks
npm run fmt && npm run lint && npm run ts && npm run test
```

## Field Details
- **Name**: `selectedDesignSystemId`
- **Type**: `string` (optional in schema)
- **Default**: `""` (empty string)
- **Order**: Alphabetically between `selectedThemeId` and `telemetryConsent`
- **Count**: 2 snapshots need updates

## Files Already Complete
✅ `src/main/settings.ts` - Default value already set  
✅ `src/lib/schemas.ts` - Schema already defined  
✅ Component usages - Already using optional chaining  
✅ `e2e-tests/theme_selection.spec.ts` - Already has assertions  
✅ E2E helpers - Auto-handle new fields  

## E2E Snapshots
E2E test snapshots in `e2e-tests/snapshots/` will auto-regenerate when you run tests. No manual updates needed - just accept the diffs.

---

**Est. Time to Complete**: 5 minutes  
**Risk Level**: Low  
**Files to Edit**: 1  
**Lines to Add**: 2
