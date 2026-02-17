# TURN GROUPING REGRESSION HUNT - EXECUTIVE SUMMARY

**Date:** 2026-02-18  
**Scope:** MessagesList turn grouping architecture  
**Status:** 9 edge cases identified, 3 CRITICAL  
**Recommendation:** Fix critical items before shipping

---

## 🎯 FINDINGS AT A GLANCE

The MessagesList component now groups Message[] into turns and renders via SessionTurn. This refactor is architecturally sound but introduces **9 distinct regression vectors**:

| Severity    | Count | Impact                                          |
| ----------- | ----- | ----------------------------------------------- |
| 🔴 CRITICAL | 3     | Undo/retry, streaming, orphan handling          |
| 🟠 HIGH     | 5     | Turn ID stability, state cleanup, duration calc |
| 🟡 MEDIUM   | 1     | Test mode parity                                |

---

## 🔴 CRITICAL FINDINGS

### 1️⃣ UNDO/RETRY ARRAY INDEX ASSUMPTIONS

**Lines:** 245-247, 304-337  
**Problem:** Hardcoded `messages[length-1]` and `messages[length-3]` assumptions break with multi-assistant turns  
**Example:**

```
Turn 1: user_msg + 3 assistant_msgs
Turn 2: user_msg + 1 assistant_msg

When user clicks undo on Turn 2:
messages[length-1] = correct (Turn 2's assistant)
messages[length-2] = correct (Turn 2's user)
messages[length-3] = WRONG (Turn 1's assistant, not Turn 2's user!)
```

**Fix Effort:** Medium | **Patch Type:** Use turn structure instead of array indices

---

### 2️⃣ STREAMING STATE RACE CONDITION

**Line:** 437  
**Problem:** `isTurnWorking = isStreaming && isLastTurn` races with grouping timing  
**Scenario:** Stream adds user message → new turn created → `isLastTurn=true`. But before state settles, stream adds assistant to previous turn → old render still active → assistant in wrong turn marked as working  
**Fix Effort:** Medium | **Patch Type:** Add stream timestamp or explicit turn tracking

---

### 3️⃣ ORPHAN ASSISTANT MESSAGE HANDLING

**Lines:** 56-64  
**Problem:** No guard against assistant-first messages; creates `turn-orphan-${id}` IDs that break state persistence  
**Scenario:** If stream or IPC sends assistant message before user message, turns grouping creates orphan turn with unstable ID  
**Fix Effort:** Low | **Patch Type:** Use turn index instead of message ID; add dev warning

---

## 🟠 HIGH-RISK FINDINGS

### Turn ID Stability

- **Location:** Line 58, 399
- **Issue:** `expandedTurnIds` state uses turn IDs, but IDs change if grouping changes
- **Example:** After undo removes a turn, expanded state for that turn persists as orphaned state
- **Fix:** Add useEffect to sync expansion state with actual turns

### Multi-Message Duration

- **Location:** Lines 163-174
- **Issue:** `summarizeTurn()` assumes first and last assistant messages have correct createdAt order
- **Fix:** Sort by createdAt before computing duration

### Retry with Orphaned Assistant

- **Location:** Lines 340-346
- **Issue:** Retry finds last user message by array reverse search, but doesn't account for orphaned assistants
- **Fix:** Use turn structure to find last user message

### Footer Context Coupling

- **Location:** Lines 185-202, 245, 477
- **Issue:** FooterComponent uses raw messages array, not turn structure; undo/retry logic diverges
- **Fix:** Pass turns structure to footer context

### Empty Turn After Undo

- **Location:** Lines 441, 466
- **Issue:** Turn with only user message (no assistant response) renders with opacity-70, confusing UX
- **Fix:** Only fade if turn is actually streaming

---

## 🟡 MEDIUM-RISK FINDINGS

### Test Mode vs. Virtuoso Parity

- **Location:** Lines 407, 545-609
- **Issue:** Test mode renders all turns directly; non-test uses Virtuoso with lazy virtualization
- **Risk:** E2E test behavior differs from production
- **Fix:** Extract common rendering logic; conditionally disable Virtuoso in test mode

---

## 📊 IMPACT ANALYSIS

```
┌─────────────────────────────────────────────────────────┐
│ COMPONENT IMPACT MATRIX                                 │
├──────────────────┬─────────────┬────────────────────────┤
│ Component        │ Risk Level  │ Why                    │
├──────────────────┼─────────────┼────────────────────────┤
│ Undo/Retry       │ CRITICAL    │ Array indices fail     │
│ Streaming        │ CRITICAL    │ Race with grouping     │
│ Turn Stability   │ CRITICAL    │ Orphan ID mismatch     │
│ Expansion State  │ HIGH        │ No lifecycle sync      │
│ Duration Display │ MEDIUM      │ Order assumption       │
│ Test Mode        │ MEDIUM      │ Path divergence        │
└──────────────────┴─────────────┴────────────────────────┘
```

---

## 🛠️ RECOMMENDED ACTIONS

### Phase 1: CRITICAL FIX (Do This First)

- [ ] Refactor undo/retry to use turn structure instead of array indices
- [ ] Add explicit streaming turn detection (not just `isLastTurn`)
- [ ] Add orphan guard with deterministic ID formula and dev warning

**Effort:** 6-8 hours  
**Testing:** 3 new E2E tests  
**Risk Mitigation:** Blocks shipping

### Phase 2: HIGH-PRIORITY FIX

- [ ] Add `useEffect` to clean up orphaned expansion state
- [ ] Sort assistant messages by createdAt in duration calculation
- [ ] Pass turn structure to FooterComponent
- [ ] Only fade turns that are actively streaming, not just empty

**Effort:** 3-4 hours  
**Testing:** 2-3 unit tests  
**Risk Mitigation:** Improves reliability

### Phase 3: MEDIUM-PRIORITY POLISH

- [ ] Extract common turn rendering logic
- [ ] Verify test mode and Virtuoso parity
- [ ] Add test-specific Virtuoso config

**Effort:** 4-6 hours  
**Testing:** E2E regression suite  
**Risk Mitigation:** Improves test flakiness

---

## 📋 VERIFICATION CHECKLIST

Before declaring regression hunt complete:

- [ ] **Code Review:** All 9 edge cases documented and understood
- [ ] **Unit Tests:** Added for groupMessagesIntoTurns() orphan cases
- [ ] **E2E Tests:** Undo/retry with multi-assistant turns pass
- [ ] **Streaming:** Tested with rapid consecutive messages
- [ ] **Expansion:** Verified state persists/cleans correctly
- [ ] **Test Mode:** Verified parity with production rendering
- [ ] **Duration:** Verified sort order doesn't affect calculation

---

## 🚨 CRITICAL UNKNOWNS REQUIRING VERIFICATION

1. **Is message order guaranteed by IPC contract?**  
   Check: `/src/ipc/types/chat.ts` ChatResponseChunkSchema

2. **Can `createdAt` be null/undefined?**  
   Check: Message schema definition

3. **Does `revertVersion()` preserve message IDs?**  
   Check: Trace revertVersion() implementation

4. **Is `sourceCommitHash` always present?**  
   Check: Stream handler message creation

5. **Can stream create messages out of order?**  
   Check: useStreamChat.ts onChunk handler

---

## 📚 DELIVERABLES

Generated:

1. **TURN_GROUPING_REGRESSION_HUNT.md** (24KB)
   - Detailed analysis of all 9 edge cases
   - Concrete patch recommendations with code examples
   - Test templates and scenarios

2. **TURN_GROUPING_QUICK_REF.md** (5.3KB)
   - Executive summary of issues
   - Quick patch templates
   - Verification checklist

3. **This document**
   - High-level findings and recommendations
   - Impact analysis and action plan

---

## 🎓 CONCLUSION

The turn grouping refactor represents **sound architectural evolution** of the message rendering pipeline. However, **3 critical issues** must be addressed before shipping:

1. **Array index assumptions in undo/retry**
2. **Streaming state race conditions**
3. **Orphan assistant message handling**

Additionally, **5 high-priority issues** should be fixed to improve reliability and maintainability.

**Estimated Total Fix Time:** 10-16 hours  
**Risk of Ignoring:** Undo/retry failures, streaming UI bugs, flaky E2E tests  
**Recommended Timeline:** Fix CRITICAL issues within 2 sprint days, complete all by end of sprint

---

**Report Generated:** 2026-02-18  
**Analysis Depth:** 9 edge cases, 3 files analyzed, 612+ LOC reviewed  
**Status:** ✅ Ready for engineering action
