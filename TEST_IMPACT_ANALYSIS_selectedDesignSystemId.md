# TEST FILES & FIXTURES IMPACT ANALYSIS

## selectedDesignSystemId Field Addition to UserSettings

**Analysis Date**: February 20, 2026  
**Context**: New `selectedDesignSystemId: string` field added to settings schema with default value of empty string  
**Scope**: Full codebase scan for implicit settings shape dependencies

---

## 🔴 CRITICAL ISSUES REQUIRING IMMEDIATE ACTION

### Issue 1: Unit Test Inline Snapshots (Will Fail)

**File**: `src/__tests__/readSettings.test.ts`  
**Type**: Inline snapshots that must match exact object shape  
**Severity**: CRITICAL - Tests will fail on next run

#### Snapshot 1: Line 54-78

**Test Case**: `describe("when settings file does not exist") > it("should create default settings file...")`  
**Current State**: Missing `selectedDesignSystemId` field  
**Location**: Between `selectedThemeId` and `telemetryConsent` (alphabetical order)

**Current snapshot structure**:

```typescript
expect(scrubSettings(result)).toMatchInlineSnapshot(`
  {
    "autoExpandPreviewPanel": true,
    "enableAnyonPro": true,
    "enableAutoFixProblems": false,
    "enableAutoUpdate": true,
    "enableNativeGit": true,
    "enableProLazyEditsMode": true,
    "enableProSmartFilesContextMode": true,
    "experiments": {},
    "hasRunBefore": false,
    "isRunning": false,
    "lastKnownPerformance": undefined,
    "providerSettings": {},
    "releaseChannel": "stable",
    "selectedModel": {
      "name": "claude-opus-4-6",
      "provider": "anthropic",
    },
    "selectedTemplateId": "react",
    "selectedThemeId": "default",           // <-- Currently ends here
    "telemetryConsent": "unset",
    "telemetryUserId": "[scrubbed]",
  }
`);
```

**Required Change**: Insert new field after `selectedThemeId`:

```typescript
"selectedDesignSystemId": "",   // <-- ADD THIS LINE
```

---

#### Snapshot 2: Line 310-334

**Test Case**: `describe("error handling") > it("should return default settings when file read fails")`  
**Current State**: Missing `selectedDesignSystemId` field  
**Location**: Between `selectedThemeId` and `telemetryConsent` (alphabetical order)

**Required Change**: Identical to Snapshot 1 - insert after line 330

---

### Issue 2: E2E Test Assertions (Partially Updated)

**File**: `e2e-tests/theme_selection.spec.ts`  
**Type**: Direct assertions on settings object properties  
**Severity**: MEDIUM - Some assertions present, some may be missing

#### Status Check:

- ✅ **Line 12**: `expect(initialSettings.selectedDesignSystemId ?? "").toBe("");` - PRESENT
- ✅ **Line 51**: `expect(po.recordSettings().selectedDesignSystemId).toBe("mui");` - PRESENT
- ✅ **Line 64**: `expect(po.recordSettings().selectedDesignSystemId).toBe("");` - PRESENT

**Conclusion**: theme_selection.spec.ts is ALREADY COMPLETE with selectedDesignSystemId assertions

---

## ✅ COMPLETE & VERIFIED (No Action Needed)

### 1. Default Settings Object

**File**: `src/main/settings.ts` (Lines 21-45)  
**Status**: ✅ Already updated  
**Evidence**: Line 39 contains `selectedDesignSystemId: "",`

### 2. Zod Schema Definition

**File**: `src/lib/schemas.ts`  
**Status**: ✅ Already updated  
**Evidence**: Schema includes `selectedDesignSystemId: z.string().optional(),`

### 3. Component Usages

**Files**:

- `src/components/chat/AuxiliaryActionsMenu.tsx`
- `src/pages/home.tsx`
  **Status**: ✅ Both already use optional chaining
  **Evidence**:
- `settings?.selectedDesignSystemId || null`
- `settings?.selectedDesignSystemId || undefined`

### 4. E2E Test Helpers

**File**: `e2e-tests/helpers/test_helper.ts`  
**Methods**:

- `recordSettings()` (Line 1274-1278)
- `snapshotSettingsDelta()` (Line 1284-1333)

**Status**: ✅ No changes needed
**Explanation**:

- `recordSettings()` reads raw JSON - automatically includes new fields
- `snapshotSettingsDelta()` compares all keys - automatically handles new fields
- No hardcoded field lists to update

### 5. Unit Test Mock Fixtures

**File**: `src/__tests__/schemas_pro_access.test.ts` (Lines 4-6)  
**Status**: ✅ No changes needed
**Explanation**: Uses type assertion `as UserSettings` which allows partial objects

---

## 📊 AFFECTED TEST FILES - SUMMARY TABLE

| File                                      | Type               | Test Count | Status         | Action           |
| ----------------------------------------- | ------------------ | ---------- | -------------- | ---------------- |
| `src/__tests__/readSettings.test.ts`      | Unit Snapshot      | 2          | ❌ CRITICAL    | Update snapshots |
| `e2e-tests/theme_selection.spec.ts`       | E2E Assertions     | 2          | ✅ Complete    | None             |
| `e2e-tests/telemetry.spec.ts`             | E2E Delta Snapshot | 3          | ⏳ Auto-update | Monitor          |
| `e2e-tests/thinking_budget.spec.ts`       | E2E Delta Snapshot | 3+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/smart_context_options.spec.ts` | E2E Delta Snapshot | 3+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/release_channel.spec.ts`       | E2E Delta Snapshot | 2+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/turbo_edits_options.spec.ts`   | E2E Delta Snapshot | 3+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/template-community.spec.ts`    | E2E Delta Snapshot | 2+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/auto_update.spec.ts`           | E2E Record         | 1+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/context_window.spec.ts`        | E2E Record         | 1+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/default_chat_mode.spec.ts`     | E2E Record         | 1+         | ⏳ Auto-update | Monitor          |
| `e2e-tests/github.spec.ts`                | E2E Record         | 1+         | ⏳ Auto-update | Monitor          |

---

## 🔧 DETAILED ACTION ITEMS

### ACTION 1: Fix readSettings.test.ts Snapshot 1

**File**: `src/__tests__/readSettings.test.ts`  
**Line Range**: 74-74 (insert after this line)  
**Type**: Insert single line

**Before**:

```typescript
          "selectedTemplateId": "react",
          "selectedThemeId": "default",
          "telemetryConsent": "unset",
```

**After**:

```typescript
          "selectedTemplateId": "react",
          "selectedThemeId": "default",
          "selectedDesignSystemId": "",
          "telemetryConsent": "unset",
```

---

### ACTION 2: Fix readSettings.test.ts Snapshot 2

**File**: `src/__tests__/readSettings.test.ts`  
**Line Range**: 330-330 (insert after this line)  
**Type**: Insert single line

**Before**:

```typescript
          "selectedTemplateId": "react",
          "selectedThemeId": "default",
          "telemetryConsent": "unset",
```

**After**:

```typescript
          "selectedTemplateId": "react",
          "selectedThemeId": "default",
          "selectedDesignSystemId": "",
          "telemetryConsent": "unset",
```

---

### ACTION 3: Monitor E2E Test Snapshots

**Affected Test Files** (Will Auto-Update):

- `e2e-tests/telemetry.spec.ts`
- `e2e-tests/thinking_budget.spec.ts`
- `e2e-tests/smart_context_options.spec.ts`
- `e2e-tests/release_channel.spec.ts`
- `e2e-tests/turbo_edits_options.spec.ts`
- `e2e-tests/template-community.spec.ts`

**What Will Happen**:

- When tests run, snapshots in `e2e-tests/snapshots/` will auto-regenerate
- New field `selectedDesignSystemId: ""` will appear in git diffs as `+ "selectedDesignSystemId": ""`
- Use `git diff e2e-tests/snapshots/` to review changes

**Action**: Accept auto-updated snapshots with `git add e2e-tests/snapshots/`

---

## 📋 VERIFICATION CHECKLIST

Before marking this work complete:

- [ ] Both inline snapshots in `readSettings.test.ts` updated with `"selectedDesignSystemId": ""`
- [ ] Local unit tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] E2E tests run and regenerate snapshots: `npm run e2e`
- [ ] Review git diff for `e2e-tests/snapshots/` to verify `selectedDesignSystemId: ""` appears
- [ ] No other files modified outside of intended scope
- [ ] All snapshot additions show field with empty string default value

---

## 📍 REFERENCE INFORMATION

### Snapshot Field Order

All snapshots use **alphabetical ordering**. The field `selectedDesignSystemId` should appear:

- **After**: `selectedThemeId`
- **Before**: `telemetryConsent`

### Default Value

The new field always defaults to an empty string in all snapshots:

```json
"selectedDesignSystemId": ""
```

### Why Only Two Snapshots?

- E2E tests use `snapshotSettingsDelta()` which auto-diffs all changes
- Only `readSettings.test.ts` has hardcoded `toMatchInlineSnapshot()` objects
- Other test snapshots are auto-generated and regenerate with test runs

---

## 🚀 NEXT STEPS

1. **Immediately**: Update the two inline snapshots in `readSettings.test.ts`
2. **Next**: Run `npm run test` to verify unit tests pass
3. **Then**: Run `npm run build && npm run e2e` to regenerate E2E snapshots
4. **Finally**: Review and commit all snapshot changes
