# Test Impact Analysis - Documentation Index

## Overview
Complete analysis of test files and fixtures that depend on the `UserSettings` shape, specifically for the new `selectedDesignSystemId` field addition.

## Documents Created

### 1. **Quick Reference** (5-minute read)
📄 **File**: `SNAPSHOT_UPDATES_QUICK_REFERENCE.md`  
**Use this when**: You need the fastest path to action  
**Contains**: 
- TL;DR of what to do
- Exact line numbers for edits
- Copy-paste ready field definition
- Test command cheat sheet

### 2. **Comprehensive Impact Report** (15-minute read)
📄 **File**: `TEST_IMPACT_ANALYSIS_selectedDesignSystemId.md`  
**Use this when**: You need detailed context and evidence  
**Contains**:
- Full analysis of 2 critical issues
- Evidence of what's already complete
- Table of all affected test files
- Detailed action items with before/after code
- Verification checklist

### 3. **Text Summary** (10-minute read)
📄 **File**: `TEST_IMPACT_SUMMARY.txt`  
**Use this when**: You want a clean structured overview  
**Contains**:
- Critical findings section
- Alphabetical list of what's complete
- Auto-updated snapshots list
- Actionable items breakdown
- Reference file locations
- Field ordering diagram

---

## Quick Navigation

### "I just need to know what to fix"
→ Read: `SNAPSHOT_UPDATES_QUICK_REFERENCE.md`

### "I need to understand the impact fully"
→ Read: `TEST_IMPACT_ANALYSIS_selectedDesignSystemId.md`

### "I want a structured summary"
→ Read: `TEST_IMPACT_SUMMARY.txt`

---

## Key Findings Summary

### 🔴 Critical Issues (Requires Action)
1. **Unit test snapshots** in `src/__tests__/readSettings.test.ts`
   - 2 inline snapshots missing `selectedDesignSystemId` field
   - Tests WILL FAIL if not updated
   - Fix: Add 1 line in 2 locations

2. **E2E test assertions** in `e2e-tests/theme_selection.spec.ts`
   - Status: ✅ ALREADY COMPLETE
   - Already has proper assertions

### ✅ Already Complete (No Action Needed)
- Default settings object (`src/main/settings.ts`)
- Zod schema definition (`src/lib/schemas.ts`)
- Component usages (with optional chaining)
- E2E test helpers (auto-handle new fields)
- Unit test mock fixtures

### ⏳ Auto-Updated (Monitor Only)
- E2E snapshots in `e2e-tests/snapshots/`
- Will regenerate automatically on test run

---

## Critical Files to Know

| File | Type | Status | Note |
|------|------|--------|------|
| `src/__tests__/readSettings.test.ts` | Unit Test | ❌ Needs Update | 2 inline snapshots |
| `e2e-tests/theme_selection.spec.ts` | E2E Test | ✅ Complete | Already updated |
| `src/main/settings.ts` | Config | ✅ Complete | Default value set |
| `src/lib/schemas.ts` | Schema | ✅ Complete | Field defined |
| `e2e-tests/helpers/test_helper.ts` | Helper | ✅ Complete | No changes needed |

---

## Exact Changes Needed

### File: `src/__tests__/readSettings.test.ts`

**Location 1**: Line 74-75  
**Location 2**: Line 330-331

**Change in both locations**:
```typescript
// Add this line:
          "selectedDesignSystemId": "",
```

**Must go between**:
- `"selectedThemeId": "default",` (before)
- `"telemetryConsent": "unset",` (after)

---

## Execution Path

1. ⏱️ **2 minutes** - Edit `src/__tests__/readSettings.test.ts` (add 2 lines)
2. ⏱️ **3 minutes** - Run `npm run test` (verify snapshots)
3. ⏱️ **5 minutes** - Run `npm run build && npm run e2e` (regenerate E2E snapshots)
4. ⏱️ **2 minutes** - Review git diff and commit

**Total time: ~12-15 minutes**

---

## Documentation Status

- ✅ Comprehensive analysis complete
- ✅ Critical issues identified
- ✅ All complete items verified
- ✅ Auto-update items documented
- ✅ Exact code locations provided
- ✅ Verification checklist created
- ✅ Multiple documentation formats provided

---

## Last Updated

February 20, 2026 - 18:30 UTC

## Analysis Scope

- Total files scanned: 50+
- Test files analyzed: 12 E2E tests, 2 unit test suites
- Helper methods reviewed: 2 core methods
- Schema definitions: 1 main schema
- Component usages: 2 files
- Snapshot patterns: 3 types (inline, delta, auto-generated)

---

## Questions to Ask Yourself

**Before editing**:
- [ ] Have I read which file to edit? (`src/__tests__/readSettings.test.ts`)
- [ ] Do I know how many lines to add? (2 lines in 2 locations)
- [ ] Do I understand field ordering? (Alphabetical between selectedThemeId and telemetryConsent)

**After editing**:
- [ ] Did I run `npm run test`?
- [ ] Did tests pass?
- [ ] Did I run `npm run build && npm run e2e`?
- [ ] Did I review the snapshot diffs?

---

## Support

If snapshots don't update correctly:
1. Check field spelling: `selectedDesignSystemId` (exact case)
2. Check field positioning: Must be between `selectedThemeId` and `telemetryConsent`
3. Check default value: Must be empty string `""`
4. Check JSON format: Must have comma after the field
5. Run tests with: `npm run test -- --reporter=verbose`

