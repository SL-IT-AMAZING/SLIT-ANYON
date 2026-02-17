# Turn Grouping Regression Hunt - Complete Analysis Index

## 📋 DOCUMENT ROADMAP

This regression hunt consists of three complementary documents:

### 1. 📄 TURN_GROUPING_SUMMARY.md (8.2 KB) - START HERE
**Best for:** Quick understanding, executive summary, action planning
- 🎯 Findings at a glance (9 edge cases, 3 CRITICAL)
- 🔴 Critical issues with examples
- 🟠 High-risk findings with impact
- 🛠️ Phased action plan (Phase 1-3)
- 📋 Verification checklist

**Read Time:** 5-10 minutes

---

### 2. ⚡ TURN_GROUPING_QUICK_REF.md (5.3 KB) - DEVELOPER GUIDE
**Best for:** Implementation, quick lookup, patch templates
- 🔴 Critical issues checklist
- 🟠 High-risk issues table
- 📍 Code hotspots map
- 🎯 Impact zones matrix
- 📝 Patch templates (4 quick fixes)
- 🧪 Test templates (unit + E2E)
- 🚨 Critical unknowns checklist

**Read Time:** 3-5 minutes
**Use During:** Implementing fixes

---

### 3. 📖 TURN_GROUPING_REGRESSION_HUNT.md (24 KB) - DEEP DIVE
**Best for:** Detailed analysis, understanding architecture, comprehensive review
- 🏗️ Full algorithm analysis
- 📚 Detailed explanation of each edge case (1-9)
  - Risk level & symptom
  - Problem explanation with code examples
  - Concrete file locations
  - Patch recommendations with full code
- ✅ Undo/Retry assumptions detailed
- 🌊 Streaming state verification
- 🎭 First-assistant-without-user scenarios
- 🧪 Test case templates
- 🚨 Critical unknowns with guidance

**Read Time:** 20-30 minutes
**Use During:** Code review, design discussion

---

## 🎯 QUICK NAVIGATION BY TASK

### **"I need to understand what's wrong" (5-10 min)**
→ Read `TURN_GROUPING_SUMMARY.md`
→ Focus on: Findings at a Glance + Critical Findings

### **"I need to fix the CRITICAL issues" (2-4 hours)**
→ Start with `TURN_GROUPING_QUICK_REF.md` lines: Code Hotspots
→ Reference `TURN_GROUPING_REGRESSION_HUNT.md` Edge Cases 1, 2, 3
→ Use patch templates from Quick Ref

### **"I need to do a full code review" (1-2 hours)**
→ Read entire `TURN_GROUPING_REGRESSION_HUNT.md`
→ Verify against actual code in `src/components/chat/MessagesList.tsx`
→ Check Critical Unknowns section

### **"I need to write tests" (1-2 hours)**
→ Use test templates from `TURN_GROUPING_QUICK_REF.md`
→ See detailed scenarios in `TURN_GROUPING_REGRESSION_HUNT.md` section 7

### **"I need to present findings" (10-15 min)**
→ Show `TURN_GROUPING_SUMMARY.md` slides
→ Use impact matrix from Quick Ref
→ Back up with deep dive examples

---

## 🗺️ EDGE CASES AT A GLANCE

| # | Edge Case | Risk | Lines | Fix Effort |
|---|-----------|------|-------|-----------|
| 1 | Orphaned assistant turn ID | HIGH | 56-64, 399 | Low |
| 2 | Undo/retry array indices | **CRITICAL** | 245-247, 304-337 | Medium |
| 3 | Multi-msg duration calc | HIGH | 163-174 | Low |
| 4 | Streaming race condition | **CRITICAL** | 437, 554 | Medium |
| 5 | Turn ID stability/cleanup | HIGH | 48, 399, 456-464 | Low |
| 6 | Test/Virtuoso parity | MEDIUM | 407, 545-609 | High |
| 7 | Retry with orphan | HIGH | 340-346 | Low |
| 8 | Footer context coupling | MEDIUM | 185-202, 245, 477 | Medium |
| 9 | Empty turn opacity | MEDIUM | 441, 466 | Low |

---

## ✅ IMPLEMENTATION CHECKLIST

### CRITICAL FIXES (Do First - 6-8 hours)
- [ ] Edge Case 2: Refactor undo/retry to use turn structure
  - Location: `MessagesList.tsx` lines 245-247, 304-337
  - Document: TURN_GROUPING_REGRESSION_HUNT.md, Edge Case 2
  - Quick Ref: "Fix 2: Undo Index → Turn-Based"

- [ ] Edge Case 4: Add explicit streaming turn detection
  - Location: `MessagesList.tsx` line 437
  - Document: TURN_GROUPING_REGRESSION_HUNT.md, Edge Case 4
  - Quick Ref: Code Hotspots section

- [ ] Edge Case 1: Fix orphan turn ID generation
  - Location: `MessagesList.tsx` lines 56-64
  - Document: TURN_GROUPING_REGRESSION_HUNT.md, Edge Case 1
  - Quick Ref: "Fix 1: Orphan Turn ID"

### HIGH-PRIORITY FIXES (Next - 3-4 hours)
- [ ] Edge Case 5: Add expansion state cleanup
  - Quick Ref: "Fix 4: Expansion State Cleanup"
  - Add: `useEffect` on `expandedTurnIds`

- [ ] Edge Case 3: Sort multi-message duration
  - Quick Ref: "Fix 3: Duration Sorting"
  - Add: `.sort()` before date calculation

- [ ] Edge Case 7: Use turn structure for retry
  - Location: Lines 340-346
  - Replace array reverse search with turn-based lookup

- [ ] Edge Case 8: Pass turns to FooterComponent
  - Add `turns` to `FooterContext` interface
  - Update undo/retry logic in `FooterComponent`

- [ ] Edge Case 9: Smart empty turn opacity
  - Only fade if `isTurnWorking`

### MEDIUM-PRIORITY POLISH (Later - 4-6 hours)
- [ ] Edge Case 6: Test/Virtuoso parity
  - Extract common rendering logic
  - Add test-mode config to Virtuoso

---

## 🧪 TEST REQUIREMENTS

### Unit Tests
- `groupMessagesIntoTurns([])` → `[]`
- `groupMessagesIntoTurns([assistant])` → orphan turn
- Orphan turn ID stability
- No duplicate turn IDs

See: TURN_GROUPING_QUICK_REF.md "Test Templates"

### E2E Tests
- **Existing:** `undo.spec.ts`, `retry.spec.ts` - verify still pass
- **New:** Undo with multi-assistant turn
- **New:** Retry with orphaned assistant
- **New:** Rapid streaming with turn boundaries

See: TURN_GROUPING_REGRESSION_HUNT.md Section 7

---

## 🔍 KEY FILES TO REVIEW

### Production Code
- `src/components/chat/MessagesList.tsx` - Main file
  - Lines 41-70: `groupMessagesIntoTurns()`
  - Lines 82-182: `summarizeTurn()`
  - Lines 237-288: Undo logic
  - Lines 294-371: Retry logic
  - Lines 437: Streaming detection
  - Lines 545-589: Test mode render
  - Lines 591-609: Virtuoso render

### Existing Tests
- `e2e-tests/undo.spec.ts` - Undo behavior
- `e2e-tests/retry.spec.ts` - Retry behavior
- `src/__tests__/ai_messages_cleanup.test.ts` - Message handling

### Related Code
- `src/hooks/useStreamChat.ts` - Streaming implementation
- `src/ipc/types/chat.ts` - Message/Chat types
- `src/components/chat-v2/SessionTurn.tsx` - Rendering component

---

## 🚨 CRITICAL UNKNOWNS TO VERIFY

Before finalizing patches, verify these assumptions:

1. **Message order guarantee**
   - Check: `src/ipc/types/chat.ts` ChatResponseChunkSchema
   - Question: Are messages always in chronological order?

2. **createdAt nullability**
   - Check: Message type definition
   - Question: Can `createdAt` be null/undefined?

3. **ID preservation**
   - Check: `revertVersion()` implementation
   - Question: Do message IDs change after undo?

4. **Stream ordering**
   - Check: `useStreamChat.ts` onChunk handler
   - Question: Can assistant messages arrive before user messages?

5. **sourceCommitHash presence**
   - Check: Chat stream handler
   - Question: Is `sourceCommitHash` guaranteed?

See: TURN_GROUPING_SUMMARY.md "Critical Unknowns"

---

## 📞 QUESTIONS & ANSWERS

**Q: Should I fix all 9 edge cases before shipping?**  
A: No. Fix the 3 CRITICAL first (Edge Cases 1, 2, 4). HIGH-priority next. MEDIUM can be deferred.

**Q: Which edge case is most urgent?**  
A: Edge Case 2 (Undo/retry indices). Users will hit this immediately on multi-turn conversations.

**Q: How much time to implement all fixes?**  
A: Phase 1 (CRITICAL): 6-8h, Phase 2 (HIGH): 3-4h, Phase 3 (MEDIUM): 4-6h = **13-18 hours total**

**Q: Do I need to read all three documents?**  
A: Start with SUMMARY (5 min). If fixing, use QUICK_REF + REGRESSION_HUNT as needed. For review, read all three.

**Q: What's the risk if I ignore these findings?**  
A: Undo/retry will fail on multi-turn chats, streaming UI bugs, flaky E2E tests, expansion state loss.

---

## 📊 DOCUMENT STATISTICS

| Document | Size | Content | Read Time |
|----------|------|---------|-----------|
| SUMMARY | 8.2 KB | Findings, action plan | 5-10 min |
| QUICK_REF | 5.3 KB | Checklists, templates | 3-5 min |
| REGRESSION_HUNT | 24 KB | Deep analysis | 20-30 min |
| **TOTAL** | **37.5 KB** | **Complete analysis** | **30-45 min** |

**Analysis Scope:**
- 9 edge cases identified
- 3 CRITICAL, 5 HIGH, 1 MEDIUM
- 612+ LOC reviewed
- 9 patch templates provided
- 6 test templates included
- 5 critical unknowns documented

---

## ✨ NEXT STEPS

1. **Read:** Start with TURN_GROUPING_SUMMARY.md (5-10 min)
2. **Discuss:** Review findings with team
3. **Plan:** Assign CRITICAL fixes for next sprint
4. **Implement:** Use QUICK_REF patch templates
5. **Test:** Use test templates from both documents
6. **Review:** Reference REGRESSION_HUNT for code review
7. **Verify:** Check off verification checklist

---

**Generated:** 2026-02-18  
**Status:** ✅ Complete  
**Ready for:** Engineering implementation
