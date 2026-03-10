# ASYNC VALIDATION & STATE-GUARD PATTERNS - INDEX

## 📚 Documentation Structure

This inventory provides **three complementary views** of async validation patterns found in the renderer codebase:

### 1. **ASYNC_PATTERNS_SUMMARY.txt** (Quick Overview - Start Here)
- **Purpose**: Executive summary, key findings, checklist
- **Best for**: Getting oriented, understanding risk areas, reviewing findings
- **Time to read**: 5-10 minutes
- **Key sections**:
  - 10 identified patterns (overview)
  - Best-in-repo files to copy from
  - Critical guard points checklist
  - Anti-patterns to avoid
  - Risk profile of codebase areas

### 2. **ASYNC_VALIDATION_PATTERNS.md** (Comprehensive Reference)
- **Purpose**: Exhaustive mapping with detailed explanations and code examples
- **Best for**: Learning the patterns deeply, understanding rationale, code review
- **Time to read**: 30-45 minutes
- **Key sections**:
  - Pattern 1: Module-level Set tracking
  - Pattern 2: Zod-validated IPC contracts
  - Pattern 3: Lock mechanisms
  - Pattern 4: Stale closure avoidance
  - Pattern 5: Mounted/cancelled flags
  - Pattern 6: TanStack Query integration
  - Pattern 7: Ref-based timing
  - Pattern 8: Jotai Map atoms
  - Pattern 9: Abort controllers
  - Pattern 10: Settings/entitlement guards
  - Summary table of all patterns
  - Recommendations for hardening

### 3. **ASYNC_PATTERNS_QUICK_REF.md** (Developer Templates)
- **Purpose**: Copy/paste code templates and debugging guide
- **Best for**: Writing new async code, debugging issues
- **Time to read**: 5 minutes (per pattern needed)
- **Key sections**:
  - 10 code templates (one per pattern)
  - Checklist: "Is Your Async Code Race-Safe?"
  - Debugging guide: symptoms → pattern mapping
  - File references for each pattern

---

## 🎯 How to Use This Inventory

### For New Features
1. Read relevant section in **ASYNC_PATTERNS_SUMMARY.txt**
2. Copy template from **ASYNC_PATTERNS_QUICK_REF.md**
3. Reference example in actual file (e.g., `src/hooks/useStreamChat.ts`)
4. Use **checklist** in Quick Ref before committing

### For Code Review
1. Check against **Critical Guard Points** in Summary
2. Verify all 10 items in **Hardening Checklist**
3. Reference **ASYNC_VALIDATION_PATTERNS.md** section for explanation
4. Use **Debugging** section if symptoms appear

### For Debugging Race Conditions
1. Note the symptom (e.g., "duplicate requests")
2. Go to **"🆘 DEBUGGING RACE CONDITIONS"** in Quick Ref
3. Find corresponding pattern
4. Read full explanation in Comprehensive Reference
5. Apply template from Quick Ref

### For Risk Assessment
1. Check **Risk Profile** section in Summary
2. Focus code review on HIGH RISK areas first
3. Ensure patterns are applied consistently
4. Plan ESLint rules and automation

---

## 📋 Pattern Lookup Table

| Pattern | Summary | Quick Ref | Full Details | Best Example |
|---------|---------|-----------|--------------|--------------|
| **1. Set Tracking** | Prevent duplicate streams | Template | Pattern 1 | `useStreamChat.ts` |
| **2. Zod Validation** | Type-safe IPC | Template | Pattern 2 | `base.ts` |
| **3. Locking** | Serialize operations | Template | Pattern 3 | `lock_utils.ts` |
| **4. Closure Capture** | Prevent stale variables | Template | Pattern 4 | `usePlanImplementation.ts` |
| **5. Unmount Safety** | Skip updates after unmount | Template | Pattern 5 | `useDesignSystemPreview.ts` |
| **6. TanStack Query** | Dedup & cache | Template | Pattern 6 | `useAuth.ts` |
| **7. Timeout Cleanup** | Prevent memory leaks | Template | Pattern 7 | `useRunApp.ts` |
| **8. Map State** | Scalable per-entity state | Template | Pattern 8 | `chatAtoms.ts` |
| **9. Abort Control** | Cancel streams | Template | Pattern 9 | `chat_stream_handlers.ts` |
| **10. Guards** | Conditional execution | Template | Pattern 10 | `useFreeAgentQuota.ts` |

---

## 🔍 Finding Examples in Code

Each pattern has a canonical example file in the codebase:

```
Pattern 1 (Set tracking):       src/hooks/useStreamChat.ts (lines 38-112)
Pattern 2 (Zod validation):     src/ipc/handlers/base.ts (lines 17-57)
Pattern 3 (Locking):            src/ipc/utils/lock_utils.ts (lines 1-50)
Pattern 4 (Closure capture):    src/hooks/usePlanImplementation.ts (lines 59-73)
Pattern 5 (Unmount safety):     src/hooks/useDesignSystemPreview.ts (lines 64-99)
Pattern 6 (TanStack Query):     src/hooks/useAuth.ts (lines 15-24)
Pattern 7 (Timeout cleanup):    src/hooks/useRunApp.ts (lines 63-69)
Pattern 8 (Map state):          src/atoms/chatAtoms.ts (lines 1-25)
Pattern 9 (Abort control):      src/ipc/handlers/chat_stream_handlers.ts (lines 60-66)
Pattern 10 (Guards):            src/hooks/useFreeAgentQuota.ts (lines 19-40)
```

---

## ✅ Implementation Checklist

Before submitting async code for review:

- [ ] Read relevant pattern section
- [ ] Copy template and customize
- [ ] Check item from hardening checklist
- [ ] Run debugging checklist if needed
- [ ] Verify against example file
- [ ] Add to code review focus points

---

## 🚀 Quick Start (5-minute guide)

**Goal**: Add a new async feature safely

1. **Is it a stream/chat message?**
   → Pattern 1: Use Set tracking
   → File: `useStreamChat.ts`

2. **Does it cross IPC boundary?**
   → Pattern 2: Use Zod validation
   → File: `base.ts`

3. **Does it modify shared resource (app/chat)?**
   → Pattern 3: Use `withLock(id, fn)`
   → File: `lock_utils.ts`

4. **Does it use setTimeout/Promise callbacks?**
   → Pattern 4: Capture variables first
   → File: `usePlanImplementation.ts`

5. **Does it update component state?**
   → Pattern 5: Add unmount safety check
   → File: `useDesignSystemPreview.ts`

6. **Is it a data fetch?**
   → Pattern 6: Use TanStack Query + queryKeys
   → File: `useAuth.ts`

7. **Does it use setTimeout/setInterval?**
   → Pattern 7: Store and cleanup ref
   → File: `useRunApp.ts`

8. **Does it manage many entities?**
   → Pattern 8: Use Map atoms
   → File: `chatAtoms.ts`

9. **Is it long-running?**
   → Pattern 9: Support AbortController
   → File: `chat_stream_handlers.ts`

10. **Should only some users access it?**
    → Pattern 10: Use enabled guard
    → File: `useFreeAgentQuota.ts`

---

## 📞 Support

- **Have a question?** → Check ASYNC_VALIDATION_PATTERNS.md
- **Need a template?** → Check ASYNC_PATTERNS_QUICK_REF.md
- **Getting an error?** → Check "🆘 DEBUGGING" in Quick Ref
- **Want to verify pattern?** → Check example file in table above

---

**Last Updated**: 2025-03-05  
**Scope**: `/src` renderer codebase (589 TypeScript files)  
**Status**: Complete inventory with high-confidence patterns
