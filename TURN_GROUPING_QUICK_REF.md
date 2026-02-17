# Turn Grouping Regression Hunt - QUICK REFERENCE

## 🔴 CRITICAL ISSUES (Fix First)

### 1. Undo/Retry Array Index Assumptions

- **Location:** `MessagesList.tsx` lines 245-247, 304-337
- **Problem:** Assumes `messages[length-1]` is last assistant and `messages[length-2]` is user
- **Failure:** Multi-assistant turns break this assumption
- **Test:** Undo on Turn 2 when Turn 1 has 2+ assistant messages

### 2. Streaming State Race Condition

- **Location:** `MessagesList.tsx` line 437: `const isTurnWorking = isStreaming && isLastTurn;`
- **Problem:** Race between grouping and streaming
- **Failure:** Wrong turn marked as streaming
- **Test:** Rapid consecutive messages with streaming

### 3. Orphan Assistant Messages

- **Location:** `groupMessagesIntoTurns()` lines 56-64
- **Problem:** No guard against assistant-first messages
- **Failure:** `turn-orphan-${id}` breaks turn ID stability
- **Test:** Call API that returns assistant before user

---

## 🟠 HIGH-RISK ISSUES (High Priority)

| Issue                    | Location      | Patch Effort                  |
| ------------------------ | ------------- | ----------------------------- |
| Orphan turn ID stability | Line 58, 399  | **Low** - change ID formula   |
| Expansion state cleanup  | Line 399      | **Low** - add useEffect       |
| Retry with orphan        | Lines 340-346 | **Low** - use turn structure  |
| Multi-message duration   | Lines 163-174 | **Low** - add sort()          |
| Footer context coupling  | Lines 185-202 | **Medium** - refactor context |

---

## 🟡 MEDIUM-RISK ISSUES

| Issue                 | Location           | Risk          |
| --------------------- | ------------------ | ------------- |
| Empty turn after undo | Lines 441, 466     | UI confusion  |
| Test/Virtuoso parity  | Lines 407, 545-609 | E2E flakiness |

---

## ✅ VERIFICATION CHECKLIST

Before shipping:

- [ ] Add unit test: `groupMessagesIntoTurns([assistant_only])` → orphan turn
- [ ] Add E2E test: Undo on Turn 2 with multiple assistants in Turn 1
- [ ] Add E2E test: Retry with orphaned assistant present
- [ ] Verify: `expandedTurnIds` cleanup on message removal
- [ ] Verify: Duration calculation sorts by createdAt
- [ ] Verify: Test mode and Virtuoso render identically

---

## 📍 CODE HOTSPOTS

```
MessagesList.tsx
├─ Lines 41-70: groupMessagesIntoTurns()  ← Orphan handling
├─ Lines 163-174: summarizeTurn() duration ← Multi-msg sorting
├─ Lines 237-288: Undo onClick  ← Array indices
├─ Lines 294-371: Retry onClick  ← Array indices + last user
├─ Lines 399: expandedTurnIds state  ← Cleanup missing
├─ Lines 437: isTurnWorking  ← Race condition
├─ Lines 441-466: itemContent render  ← Empty turn opacity
├─ Lines 545-589: Test mode render
└─ Lines 591-609: Virtuoso render
```

---

## 🎯 IMPACT ZONES

| Component  | Risk     | Why                                      |
| ---------- | -------- | ---------------------------------------- |
| Undo/Retry | CRITICAL | Array indices break with multi-msg turns |
| Streaming  | CRITICAL | State race with grouping timing          |
| Expansion  | HIGH     | State not synced to turn lifecycle       |
| Duration   | MEDIUM   | Assumes message order = creation order   |
| Test Mode  | MEDIUM   | Different render path than Virtuoso      |

---

## 📝 PATCH TEMPLATES

### Fix 1: Orphan Turn ID

```typescript
// Line 56-64: Replace turn-orphan-${message.id} with turn-orphan-${turns.length}
const orphanId = `turn-orphan-${turns.length}`;
console.warn(`[MessagesList] Orphaned assistant: ${message.id}`);
```

### Fix 2: Undo Index → Turn-Based

```typescript
// Line 245-247: Replace with
const lastTurn = turns[turns.length - 1];
const userMessage = lastTurn?.userMessage;
const currentMessage =
  lastTurn?.assistantMessages[lastTurn.assistantMessages.length - 1];
```

### Fix 3: Duration Sorting

```typescript
// Line 163-174: Add .sort() before computing
const assistantWithCreatedAt = turn.assistantMessages
  .filter((m) => m.createdAt)
  .sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
```

### Fix 4: Expansion State Cleanup

```typescript
// Line 399+: Add useEffect
useEffect(() => {
  setExpandedTurnIds((prev) => {
    const validIds = new Set(turns.map((t) => t.id));
    const next = new Set(prev);
    for (const id of prev) if (!validIds.has(id)) next.delete(id);
    return next;
  });
}, [turns]);
```

---

## 🧪 TEST TEMPLATES

### Unit Test: groupMessagesIntoTurns

```typescript
describe("groupMessagesIntoTurns", () => {
  it("handles orphaned assistant", () => {
    const messages: Message[] = [{ id: 1, role: "assistant", content: "Hi" }];
    const turns = groupMessagesIntoTurns(messages);
    expect(turns).toHaveLength(1);
    expect(turns[0].id).toMatch(/turn-orphan-/);
    expect(turns[0].userMessage).toBeNull();
    expect(turns[0].assistantMessages).toHaveLength(1);
  });
});
```

### E2E Test: Undo with Multi-Assistant Turn

```typescript
test("undo should work with multi-assistant turn", async ({ po }) => {
  await po.setUp({ autoApprove: true });
  await po.sendPrompt("tc=multi-response"); // Multiple chunks

  const iframe = po.getPreviewIframeElement();
  await expect(iframe.contentFrame().getByText("Expected")).toBeVisible();

  await po.clickUndo();
  await expect(iframe.contentFrame().getByText("Welcome")).toBeVisible();
});
```

---

## 🚨 CRITICAL UNKNOWNS

1. **Message order guarantee?** Check IPC contract
2. **`createdAt` nullable?** Check Message schema
3. **`revertVersion` preserves IDs?** Trace revertVersion()
4. **`sourceCommitHash` always present?** Check stream handler
5. **Out-of-order messages possible?** Check ChatResponseChunk
