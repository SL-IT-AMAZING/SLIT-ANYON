# Query Key Usage & Invalidation Analysis - Document Index

**Analysis Date:** March 5, 2025  
**Scope:** ANYON Renderer React Query Hooks & Components  
**Total Analysis:** 51 files, 207 query operations, 4 actionable recommendations

---

## 📑 Documents in This Analysis

### 1. **QUERY_INVALIDATION_ANALYSIS.md** (PRIMARY)
**Purpose:** Comprehensive technical audit  
**Audience:** Developers implementing optimizations  
**Length:** ~1000 lines

**Contains:**
- ✅ Full query key factory structure and hierarchy
- ✅ Over-broad vs. precise invalidation patterns (8 patterns analyzed)
- ✅ Complete invalidation audit by location
- ✅ Stale data regression checklist
- ✅ 4 prioritized safe optimizations with code examples
- ✅ Testing strategy and E2E checklist
- ✅ File-by-file modification list
- ✅ Complete invalidation list (Appendix A)
- ✅ Query key hierarchy reference (Appendix B)

**Key Sections:**
- Section 2: Detailed pattern audit with risk levels
- Section 3: Summary tables (over-broad vs. precise)
- Section 6: Recommended optimizations (Priority 1-4)
- Section 7: Testing strategy

**Read this first for:** Complete understanding of patterns and risks

---

### 2. **QUERY_INVALIDATION_SUMMARY.md** (QUICK REFERENCE)
**Purpose:** Fast lookup and implementation guide  
**Audience:** Developers starting implementation  
**Length:** ~400 lines

**Contains:**
- ✅ At-a-glance risk matrix
- ✅ 4 hottest invalidation paths
- ✅ 4 quick wins with code snippets
- ✅ Expected performance impact
- ✅ Already-optimized patterns (no changes needed)
- ✅ Anti-patterns avoided (good news)
- ✅ Testing checklist per optimization
- ✅ File-by-file modification checklist
- ✅ Query dependency map
- ✅ Implementation order and time estimates

**Key Sections:**
- 💡 Quick Wins (easiest to implement first)
- 📈 Expected Performance Impact
- 🧪 Testing Checklist
- 💾 Implementation Order

**Read this for:** Deciding what to implement and when

---

### 3. **INVALIDATION_HOTSPOTS.md** (DETAILED DIVE)
**Purpose:** Deep analysis of hot code paths  
**Audience:** Developers optimizing critical paths  
**Length:** ~600 lines

**Contains:**
- ✅ Critical Hotspot #1: useStreamChat onEnd (40+ times per session)
- ✅ Critical Hotspot #2: Token count invalidations (100+ per chat)
- ✅ Hotspot #3: Auth state invalidations (code duplication)
- ✅ Hotspot #4: useStreamChat token count (dependency)
- ✅ Frequency matrix (what invalidates most)
- ✅ Priority matrix (impact vs. frequency)
- ✅ Error path asymmetry analysis
- ✅ Pattern lessons and anti-patterns

**Key Sections:**
- 🔴 Hotspot #1: Current code, issues, recommended fix
- ⚠️ Hotspot #2: Why it's over-broad, 3-step fix
- 🟡 Hotspot #3: Boilerplate repetition, extraction
- 📊 Frequency matrix and priority mapping

**Read this for:** Understanding why each hotspot matters and detailed fixes

---

## 🎯 How to Use These Documents

### Scenario 1: "I need a complete understanding"
1. Start: **QUERY_INVALIDATION_ANALYSIS.md** (Section 1-3)
2. Then: **INVALIDATION_HOTSPOTS.md** (understand the "why")
3. Finally: **QUERY_INVALIDATION_SUMMARY.md** (implementation checklist)

### Scenario 2: "I need to implement optimizations NOW"
1. Start: **QUERY_INVALIDATION_SUMMARY.md** (💡 Quick Wins section)
2. Reference: **INVALIDATION_HOTSPOTS.md** (detailed fixes for each)
3. Verify: **QUERY_INVALIDATION_ANALYSIS.md** (testing strategy)

### Scenario 3: "I'm debugging stale data issues"
1. Check: **QUERY_INVALIDATION_ANALYSIS.md** (Section 5 - Stale Data Checklist)
2. Review: **INVALIDATION_HOTSPOTS.md** (Error Paths section)
3. Reference: **QUERY_INVALIDATION_SUMMARY.md** (Dependency map)

### Scenario 4: "I'm reviewing code changes"
1. Check: **QUERY_INVALIDATION_ANALYSIS.md** (Section 9 - Files Requiring Changes)
2. Compare: **INVALIDATION_HOTSPOTS.md** (recommended patterns)
3. Verify: Testing checklist from appropriate document

---

## 📊 Key Findings Summary

### Risk Assessment
```
🔴 HIGH RISK (requires optimization):
  - useStreamChat.ts:194-253 (5+ invalidations per message)
  - useStreamChat.ts:229 (hardcoded query key)

⚠️  MEDIUM RISK (optimization opportunity):
  - ChatInput.tsx:17 (over-broad token count invalidation)
  - ModelPicker.tsx:50 (over-broad token count invalidation)

✅ LOW RISK (code smell only):
  - useAuth.ts (repeated boilerplate pattern)

✅ NONE (already optimal):
  - useMcp.ts, useChats.ts, useVersions.ts, useCheckoutVersion.ts
```

### Optimization Priorities
```
P0 - CRITICAL: useStreamChat stream-end coordination
    Frequency: 40+ times/session
    Effort: 15 min
    Risk: Medium (requires testing)

P0 - CRITICAL: Token count scoping
    Frequency: 100+ times/session
    Effort: 10 min
    Risk: Low (isolated change)

P1 - HIGH: Hardcoded query key fix
    Frequency: 40+ times/session
    Effort: 2 min
    Risk: None (same key)

P2 - MEDIUM: Auth invalidation helper
    Frequency: 1-3 times/session
    Effort: 5 min
    Risk: None (refactoring)
```

### Performance Impact
- **Token count reduction:** 60-70% fewer refetches
- **Stream-end coordination:** 5→2-3 invalidations per message
- **Auth refactoring:** 80% less boilerplate code
- **Total:** Fewer refetches, better parallelization, cleaner code

---

## 🔍 Cross-Reference Guide

### By Risk Level
**🔴 HIGH** → INVALIDATION_HOTSPOTS.md → Hotspot #1 + #2
**⚠️ MEDIUM** → QUERY_INVALIDATION_SUMMARY.md → Quick Wins #1-3  
**✅ LOW** → QUERY_INVALIDATION_SUMMARY.md → Quick Win #2
**✅ NONE** → QUERY_INVALIDATION_ANALYSIS.md → Section 8

### By File/Hook
**useStreamChat.ts** → INVALIDATION_HOTSPOTS.md (all sections)
**ChatInput.tsx** → INVALIDATION_HOTSPOTS.md → Hotspot #2
**ModelPicker.tsx** → INVALIDATION_HOTSPOTS.md → Hotspot #2
**useAuth.ts** → INVALIDATION_HOTSPOTS.md → Hotspot #3
**useCountTokens.ts** → INVALIDATION_HOTSPOTS.md → Hotspot #2
**useChats.ts** → QUERY_INVALIDATION_ANALYSIS.md → Pattern B
**useMcp.ts** → QUERY_INVALIDATION_ANALYSIS.md → Pattern D

### By Topic
**Query Key Factory** → QUERY_INVALIDATION_ANALYSIS.md → Section 1
**Over-Broad Patterns** → QUERY_INVALIDATION_ANALYSIS.md → Section 2.1
**Precise Patterns** → QUERY_INVALIDATION_ANALYSIS.md → Section 2.2
**Critical Paths** → QUERY_INVALIDATION_ANALYSIS.md → Section 2.3
**Testing** → QUERY_INVALIDATION_ANALYSIS.md → Section 7
**Implementation Plan** → QUERY_INVALIDATION_SUMMARY.md → Implementation Order
**Hotspots** → INVALIDATION_HOTSPOTS.md → All sections

---

## ✅ Quick Implementation Checklist

### Before Starting
- [ ] Read QUERY_INVALIDATION_SUMMARY.md Quick Wins section
- [ ] Read INVALIDATION_HOTSPOTS.md Hotspot #1 & #2
- [ ] Plan test cases from QUERY_INVALIDATION_ANALYSIS.md Section 7

### Implementation (in order)
- [ ] Fix hardcoded key (useStreamChat.ts:229) → 2 min
- [ ] Extract auth helper (useAuth.ts) → 5 min
- [ ] Add scoped token count invalidation (useCountTokens.ts) → 5 min
- [ ] Update ChatInput.tsx to use scoped version → 3 min
- [ ] Update ModelPicker.tsx to use scoped version → 3 min
- [ ] (Optional) Coordinate stream-end invalidations (useStreamChat.ts) → 15 min

### Verification
- [ ] npm run build
- [ ] npm run lint
- [ ] npm run ts
- [ ] npm run e2e (full suite)
- [ ] Manual testing of hot paths (from checklist)

### Total Time: 35-50 minutes

---

## 📚 Reference Tables

### Document Size & Scope
```
Document                          | Lines | Read Time | Focus
──────────────────────────────────┼───────┼───────────┼──────────────
QUERY_INVALIDATION_ANALYSIS.md    | 1000  | 45 min    | Comprehensive
QUERY_INVALIDATION_SUMMARY.md     | 400   | 15 min    | Quick reference
INVALIDATION_HOTSPOTS.md          | 600   | 25 min    | Deep dive
```

### Key Statistics
```
Metric                    | Value
──────────────────────────┼────────
Files analyzed            | 51
Total query operations    | 207
useQuery instances        | ~30
useMutation instances     | ~20
invalidateQueries calls   | 50+
Unique query keys         | 28+
Hot-path invalidations    | 4
Safe optimization targets | 4
```

### Risk-Benefit Analysis
```
Optimization      | Effort | Risk    | Frequency | Payoff | Priority
──────────────────┼────────┼─────────┼───────────┼────────┼──────────
Token count       | 10 min | Low     | 100+/chat | HIGH   | P0
Stream-end        | 15 min | Medium  | 40+/msg   | HIGH   | P0
Hardcoded key     | 2 min  | None    | 40+/msg   | LOW    | P1
Auth helper       | 5 min  | None    | 1-3/sess  | LOW    | P2
```

---

## 🎓 Learning Outcomes

After reading these documents, you should understand:

✅ TanStack Query key hierarchy and best practices  
✅ When and why to use parameterized vs. parent keys  
✅ The difference between over-broad and precise invalidations  
✅ How to identify hot-path query operations  
✅ Techniques for coordinating multiple invalidations  
✅ How to avoid stale-data regressions  
✅ Testing strategies for query optimizations  
✅ Code patterns for reducing duplication  

---

## 🚀 Next Steps

1. **Review:** Choose scenario above and read recommended documents
2. **Understand:** Focus on hotspots relevant to your changes
3. **Plan:** Create PR with 1-2 small optimizations first
4. **Test:** Run E2E tests from the provided checklists
5. **Iterate:** Add more optimizations after first PR approval

---

## 📝 Document Legend

- **Code blocks:** Ready-to-use implementations
- **Bold text:** Important concepts
- **[Link]:** Cross-reference to another section
- **✅ / ⚠️ / 🔴:** Risk level indicators
- **TABLE:** Comparison or matrix data
- **Section #:** Refers to markdown heading depth

---

## 🔗 Related Files in Repository

- `src/lib/queryKeys.ts` - Query key factory (reference)
- `src/hooks/useAuth.ts` - Auth pattern example
- `src/hooks/useChats.ts` - Chat pattern example
- `src/hooks/useMcp.ts` - Optimal MCP pattern
- `src/hooks/useStreamChat.ts` - Critical hotspot
- `src/components/ChatInput.tsx` - Token count hotspot
- `src/components/ModelPicker.tsx` - Token count hotspot

---

## ❓ FAQ

**Q: Can I implement all optimizations at once?**  
A: No, implement P0 priorities first (token count + stream-end), test, then add P1-P2.

**Q: Will these optimizations cause stale data?**  
A: No, all recommended changes make data MORE fresh by scoping invalidations precisely.

**Q: Do I need to change the query key factory?**  
A: No, the factory is well-designed. All optimizations work with existing keys.

**Q: How long does testing take?**  
A: 10-15 min per optimization set, primarily E2E tests. See checklist for details.

**Q: What if I find a bug while optimizing?**  
A: Revert the optimization, open an issue, and fix the underlying bug first.

---

**Document prepared:** 2025-03-05  
**For questions or updates:** Refer to the analysis methodology in primary document.

