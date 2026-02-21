# Custom Themes Audit - Complete Documentation Index

## 📄 Main Audit Document

**File:** `AUDIT_CUSTOM_THEMES.md` (940 lines, 31KB)

### Contents

1. **Executive Summary** (570 lines)
   - Overview of the problem and root causes
   - 6 concrete failure scenarios with detailed analysis
   - Hook data loading state examination
   - Query invalidation behavior analysis
   - visibleCustomThemes logic breakdown
   - Query key factory analysis
   - Summary table of failure modes

2. **Failure Chain Analysis** (205 lines)
   - Visual ASCII diagrams of each failure chain
   - Timeline of events
   - Exact line numbers for each issue
   - Hook comparison table
   - Critical code gates explanation
   - Rendering timeline

3. **Quick Reference Guide** (165 lines)
   - Problem statement
   - Root cause summary
   - 6 scenario quick overview
   - Code lines causing issues table
   - Hook comparison
   - Exposed hook state
   - Timeline of failure
   - Key observations

---

## 🎯 The Problem in 30 Seconds

**Issue:** Home '+' button themes submenu shows only default themes

**Root Cause:** Line 210 gate condition in AuxiliaryActionsMenu.tsx checks `visibleCustomThemes.length > 0` but this is 0 while the query is fetching

**Why:** useCustomThemes hook returns empty array `[]` during async IPC fetch, which causes filtering to produce empty result

**Timeline:** ~100ms race condition where user sees empty submenu before query completes

---

## 📊 Failure Scenarios at a Glance

### 1️⃣ Initial Load Race Condition (PRIMARY)

- **Files:** useCustomThemes.ts:28, AuxiliaryActionsMenu.tsx:62, 210
- **When:** Component mounts, query fetching
- **Effect:** customThemes = [] → gate check fails → not rendered

### 2️⃣ Query State Not Exposed

- **File:** AuxiliaryActionsMenu.tsx:62
- **Issue:** Only destructures customThemes, ignores isLoading
- **Effect:** No conditional rendering based on loading state

### 3️⃣ Filtering Empty Array

- **Files:** AuxiliaryActionsMenu.tsx:73-94, 210
- **Issue:** useMemo processes empty array during load
- **Effect:** visibleCustomThemes = [] → not rendered

### 4️⃣ Query Invalidation Race Condition

- **Files:** useCustomThemes.ts:44-48, AuxiliaryActionsMenu.tsx:121-129
- **Issue:** Same query key invalidated twice in succession
- **Effect:** Race conditions, multiple refetch cycles

### 5️⃣ currentThemeId Mismatch

- **Files:** AuxiliaryActionsMenu.tsx:69-70, 77-79
- **Issue:** currentThemeId = null during app theme loading
- **Effect:** Selected custom theme not highlighted

### 6️⃣ No Placeholder Data

- **File:** useCustomThemes.ts:28
- **Compare:** useThemes.ts:12 has placeholderData ✓
- **Issue:** Missing fallback data during load
- **Effect:** Empty array causes visibility gate to fail

---

## 🔴 Critical Code Lines

| Issue                   | File                     | Line(s) | Problem                                                      |
| ----------------------- | ------------------------ | ------- | ------------------------------------------------------------ |
| **GATE CONDITION**      | AuxiliaryActionsMenu.tsx | 210     | `{visibleCustomThemes.length > 0 && ...}` - blocks rendering |
| **Missing isLoading**   | AuxiliaryActionsMenu.tsx | 62      | Only destructures customThemes, ignores isLoading            |
| **Empty on Load**       | useCustomThemes.ts       | 28      | Returns `[]` during fetch instead of data                    |
| **Filter on Empty**     | AuxiliaryActionsMenu.tsx | 73-94   | useMemo processes empty array during load                    |
| **Double Invalidate 1** | useCustomThemes.ts       | 44-48   | Mutation onSuccess invalidates query                         |
| **Double Invalidate 2** | AuxiliaryActionsMenu.tsx | 121-129 | Dialog onOpenChange also invalidates query                   |

---

## 📁 Files Analyzed

1. **src/components/chat/AuxiliaryActionsMenu.tsx** (355 lines)
   - Line 62: Missing isLoading destructure
   - Lines 69-70: currentThemeId determination
   - Lines 73-94: visibleCustomThemes filter logic
   - Line 96: hasMoreCustomThemes calculation
   - **Line 210: CRITICAL GATE CONDITION**
   - Lines 121-129: Query invalidation on dialog close
   - Lines 309-312: Auto-select on theme creation

2. **src/hooks/useCustomThemes.ts** (105 lines)
   - Line 28: Returns empty array during loading
   - Lines 44-48: Mutation onSuccess invalidation
   - Missing: placeholderData option

3. **src/hooks/useThemes.ts** (24 lines)
   - Line 12: placeholderData: themesData ← **CORRECT PATTERN**
   - Lines 7-16: useQuery configuration

4. **src/hooks/useAppTheme.ts** (28 lines)
   - Line 13: enabled gate
   - Line 23: Returns null during loading

5. **src/hooks/useSettings.ts** (112 lines)
   - Settings loaded via Jotai atom
   - selectedThemeId may be undefined initially

6. **src/lib/queryKeys.ts** (323 lines)
   - Lines 167-169: Single flat customThemes.all key

7. **src/ipc/types/templates.ts** (300 lines)
   - Line 246: getCustomThemes contract definition

8. **src/pro/main/ipc/handlers/themes_handlers.ts** (884 lines)
   - Lines 313-327: Backend getCustomThemes handler

---

## 🔍 How to Read This Audit

### For a Quick Overview

Start with the **Quick Reference Guide** section at the end of AUDIT_CUSTOM_THEMES.md

### For Understanding the Failure Chain

Read the **Failure Chain Analysis** section with ASCII diagrams

### For Implementation Understanding

Read the **Executive Summary** section covering each scenario

### For Code Line Details

Refer to the **Exact Code Lines Summary** table

### For Hook Behavior

Review the **Hook Data Loading States** section

---

## 🎓 Key Learning Points

1. **Race Condition Pattern**
   - Async data fetching returns empty/null during load
   - Gate conditions fail when checking empty states
   - Must distinguish between "loading" and "no data"

2. **Hook State Management**
   - useThemes correctly uses `placeholderData: themesData`
   - useCustomThemes missing this pattern
   - Exposed states (isLoading, error) not being used

3. **Query Invalidation**
   - Same query key invalidated from two different locations
   - Creates potential race condition on creation flow
   - Should have single source of invalidation

4. **Component Design**
   - Gate condition too simplistic (length > 0)
   - No loading indicator for data in-flight
   - No error state handling in dropdown

---

## 📋 Checklist for Issue Resolution

- [ ] Review AUDIT_CUSTOM_THEMES.md to understand all 6 scenarios
- [ ] Identify which scenario(s) match your symptoms
- [ ] Find exact code lines causing the issue
- [ ] Review hook comparison between useThemes ✓ and useCustomThemes ✗
- [ ] Plan fixes addressing:
  - [ ] Gate condition logic
  - [ ] isLoading state check
  - [ ] Placeholder data pattern
  - [ ] Double invalidation race condition
  - [ ] currentThemeId null handling

---

## 📞 Questions This Audit Answers

✅ Why are custom themes empty in the submenu?
✅ What code lines cause the issue?
✅ How does the race condition happen?
✅ Why does built-in themes work but custom themes don't?
✅ What is the correct pattern for data loading?
✅ Where are queries being invalidated twice?
✅ What is currentThemeId mismatch?
✅ How long is the timing window for the race condition?

---

## 📌 Critical Gate Condition Explained

```tsx
// Line 210 in AuxiliaryActionsMenu.tsx
{visibleCustomThemes.length > 0 && (
  <>
    <DropdownMenuSeparator />
    {visibleCustomThemes.map((theme) => { ... })}
  </>
)}
```

This condition blocks rendering when:

- ✗ Query is loading (visibleCustomThemes = []) ← PRIMARY ISSUE
- ✓ No custom themes exist (legitimate)
- ✓ All filtered out (edge case)

**Problem:** Cannot distinguish between cases 1, 2, 3!

---

## 🚀 Next Steps

1. **Read** AUDIT_CUSTOM_THEMES.md completely
2. **Understand** the primary failure chain (Scenario 1)
3. **Identify** which other scenarios apply to your symptoms
4. **Plan** fixes addressing root causes:
   - Add placeholder data to useCustomThemes
   - Check isLoading state before rendering
   - Remove double invalidation
   - Add loading indicator to UI
5. **Test** the fixes with:
   - Initial load race condition
   - Creating new custom themes
   - Switching between themes
   - Selecting custom theme while menu is open

---

**Generated:** February 20, 2026  
**Analysis Depth:** 6 failure scenarios, 8 files, 3 hooks  
**Deliverable:** Comprehensive audit without code changes
