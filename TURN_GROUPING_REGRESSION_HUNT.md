# DEEP REGRESSION HUNT: MessagesList Turn Grouping Behavior

## EXECUTIVE SUMMARY

The `MessagesList` component now groups `Message[]` into `MessageTurn` objects and renders them via `SessionTurn`. This analysis identifies **9 critical edge cases** and **concrete patch recommendations** that could cause regressions in undo/retry, streaming, state persistence, and test parity.

---

## 1. TURN GROUPING ALGORITHM ANALYSIS

### Current Implementation (Lines 41-70)

```typescript
function groupMessagesIntoTurns(messages: Message[]): MessageTurn[] {
  const turns: MessageTurn[] = [];
  let currentTurn: MessageTurn | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      currentTurn = {
        id: `turn-${message.id}`,
        userMessage: message,
        assistantMessages: [],
      };
      turns.push(currentTurn);
      continue;
    }

    if (!currentTurn) {
      currentTurn = {
        id: `turn-orphan-${message.id}`,
        userMessage: null,
        assistantMessages: [message],
      };
      turns.push(currentTurn);
      continue;
    }

    currentTurn.assistantMessages.push(message);
  }

  return turns;
}
```

### Edge Cases Identified

#### **EDGE CASE 1: Assistant-First Messages (Orphaned Assistant)**

**Risk Level:** HIGH

**Symptom:** When a message stream begins with an assistant response (no preceding user message), it creates an orphaned turn with `id: turn-orphan-${messageId}`.

**Problem:**

- Turn ID is based on assistant message ID, not user message ID
- In `expandedTurnIds` tracking (line 399), this orphan turn's expand state uses `turn-orphan-${assistantId}`
- If this state persists across chat sessions, future turns with normal IDs won't find matching expand states
- The orphan state is lost when messages reload (e.g., after undo/retry)

**Concrete Locations:**

- Line 58: `id: turn-orphan-${message.id}` generation
- Line 399: `useState<Set<string>>(new Set())` for tracking
- Line 442, 558: `expandedTurnIds.has(turn.id)` lookups

**Patch Recommendation:**

```typescript
// BEFORE (Line 56-64)
if (!currentTurn) {
  currentTurn = {
    id: `turn-orphan-${message.id}`,
    userMessage: null,
    assistantMessages: [message],
  };
  turns.push(currentTurn);
  continue;
}

// AFTER: Use a deterministic orphan ID or warn in dev
if (!currentTurn) {
  const orphanId = `turn-orphan-${turns.length}`; // Use turn index instead
  currentTurn = {
    id: orphanId,
    userMessage: null,
    assistantMessages: [message],
  };
  turns.push(currentTurn);
  console.warn(
    `[MessagesList] Assistant message appears without user message: id=${message.id}, orphanId=${orphanId}`,
  );
  continue;
}
```

---

#### **EDGE CASE 2: Undo/Retry Message Index Assumptions**

**Risk Level:** CRITICAL

**Symptom:** Undo/retry logic assumes fixed message array positions.

**Problem:**

- Line 245: `messages[messages.length - 1]` (current message)
- Line 247: `messages[messages.length - 2]` (user message)
- Line 304: `messages[messages.length - 1]` (last version)
- Line 311: `messages[messages.length - 3]` (previous assistant)

When grouped into turns, the message indices no longer correspond to position in the rendered UI. Consider this scenario:

```
Turn 1: User msg (id=1) + 2 assistant msgs (id=2, 3)
Turn 2: User msg (id=4) + 1 assistant msg (id=5)

messages array: [1, 2, 3, 4, 5]
Array indices:  [0, 1, 2, 3, 4]

If user clicks undo on Turn 2:
- messages[messages.length - 1] = message 5 ✓
- messages[messages.length - 2] = message 4 ✓
- messages[messages.length - 3] = message 3 ✗ (different turn!)
```

**Concrete Locations:**

- Line 245-247: Undo logic for user message lookup
- Line 304-337: Retry logic with previous assistant message

**Patch Recommendation:**

```typescript
// INSTEAD of hardcoded indices, find within current turn context
// Get the last turn from the grouped structure
const turns = groupMessagesIntoTurns(messages);
const lastTurn = turns[turns.length - 1];

// For undo: get user message from last turn
const userMessage = lastTurn?.userMessage;

// For retry: search for previous assistant message by turn, not index
const previousTurn = turns[turns.length - 2];
const previousAssistantMessage =
  previousTurn?.assistantMessages[previousTurn.assistantMessages.length - 1];

// This bounds the search to the correct logical turn
```

---

#### **EDGE CASE 3: Multi-Message Assistant Responses**

**Risk Level:** HIGH

**Symptom:** Assistant responses are streamed in multiple chunks, each creating a separate `Message` object.

**Problem:**

- Lines 163-174: `summarizeTurn()` computes duration across ALL assistant messages in a turn
- If streaming creates 10 assistant messages in one turn, duration calculation depends on first and last
- **But turn grouping doesn't guarantee message order matches creation order**

Example:

```
Turn 1: [User 1, Assistant 1.1, Assistant 1.2, Assistant 1.3]
        ^ messages from stream chunks, but might not have sequential createdAt
```

If message sorting is ever changed upstream, this breaks silently.

**Concrete Locations:**

- Line 163: `const assistantWithCreatedAt = turn.assistantMessages.filter(...)`
- Line 165-170: Duration computed from first and last createdAt

**Patch Recommendation:**

```typescript
// BEFORE (Lines 163-174)
let duration: string | undefined;
const assistantWithCreatedAt = turn.assistantMessages.filter(
  (m) => m.createdAt,
);
if (assistantWithCreatedAt.length > 0) {
  const start = new Date(assistantWithCreatedAt[0].createdAt as string | Date);
  const end = new Date(
    assistantWithCreatedAt[assistantWithCreatedAt.length - 1].createdAt as
      | string
      | Date,
  );
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    duration = formatDuration(start, end);
  }
}

// AFTER: Sort by createdAt before computing duration
let duration: string | undefined;
const assistantWithCreatedAt = turn.assistantMessages
  .filter((m) => m.createdAt)
  .sort(
    (a, b) =>
      new Date(a.createdAt as string | Date).getTime() -
      new Date(b.createdAt as string | Date).getTime(),
  );
if (assistantWithCreatedAt.length > 0) {
  const start = new Date(assistantWithCreatedAt[0].createdAt as string | Date);
  const end = new Date(
    assistantWithCreatedAt[assistantWithCreatedAt.length - 1].createdAt as
      | string
      | Date,
  );
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    duration = formatDuration(start, end);
  }
}
```

---

#### **EDGE CASE 4: Streaming State Race Condition**

**Risk Level:** CRITICAL

**Symptom:** `isStreaming` flag vs. turn grouping timing mismatch during rapid streams.

**Problem:**

- Line 437: `const isTurnWorking = isStreaming && isLastTurn;`
- This assumes the last turn is the one currently streaming
- **But `groupMessagesIntoTurns()` is called in `useMemo(() => groupMessagesIntoTurns(messages), [messages])`**
- The grouping happens at render time, not at stream time
- If stream creates a new turn before the previous turn's state is finalized:

```
Stream adds User Msg 2 → groupMessagesIntoTurns() called
  → NEW turn created → isLastTurn = true → isTurnWorking = true ✓

But then stream adds Assistant Msg 2.1 before state updates
  → Earlier render still has old grouping
  → Assistant msg appears in OLD turn → isLastTurn = false → isTurnWorking = false ✗
```

**Concrete Locations:**

- Line 437: Streaming detection per turn
- Line 554: Test mode also assumes last turn = current stream
- Line 431: `useMemo` dependency on `[messages]`

**Patch Recommendation:**

```typescript
// ENHANCEMENT: Add explicit streaming turn tracking
const isStreamingLastTurn = isStreaming && selectedChatId !== null;
// Then check: is this turn the one with messages from current stream?

// OR: Compare message creation times
const isTurnWorking =
  isStreaming &&
  isLastTurn &&
  lastTurnHasRecentMessages(turn, currentStreamStartTime);

function lastTurnHasRecentMessages(
  turn: MessageTurn,
  streamStartTime?: number,
): boolean {
  if (!streamStartTime) return true;
  const lastMsg = turn.assistantMessages[turn.assistantMessages.length - 1];
  return (
    !lastMsg?.createdAt ||
    new Date(lastMsg.createdAt).getTime() >= streamStartTime
  );
}
```

---

#### **EDGE CASE 5: Turn ID Stability & Expansion State**

**Risk Level:** HIGH

**Symptom:** `expandedTurnIds` state uses turn IDs, but turn IDs are keyed to message IDs.

**Problem:**

- When undo/retry removes and re-adds messages, their IDs don't change
- But if the grouping changes (e.g., a turn merges with another), the turn ID formula breaks
- For non-orphan turns: `id: turn-${message.id}` where `message` = user message

```
Initial state:
Turn A: turn-1 (user msg id=1)
Turn B: turn-5 (user msg id=5)
expandedTurnIds = { "turn-1", "turn-5" }

After undo removes turn B's user message:
messages = [1, 2, 3]  (5 is gone)
New grouping:
Turn A: turn-1 (user msg id=1)
expandedTurnIds still has "turn-5" → orphaned state!
```

**Concrete Locations:**

- Line 48: `id: turn-${message.id}` for non-orphan
- Line 399: `useState<Set<string>>(new Set())` - no cleanup on message removal
- Line 456-464, 571-579: `setExpandedTurnIds` updates

**Patch Recommendation:**

```typescript
// BEFORE: State is never cleaned up
const [expandedTurnIds, setExpandedTurnIds] = useState<Set<string>>(new Set());

// AFTER: Add effect to sync expansion state with actual turns
useEffect(() => {
  setExpandedTurnIds((prev) => {
    const validIds = new Set(turns.map((turn) => turn.id));
    // Keep only IDs that still exist in turns
    const next = new Set(prev);
    for (const id of prev) {
      if (!validIds.has(id)) {
        next.delete(id);
      }
    }
    return prev.size === next.size ? prev : next; // Return prev if unchanged
  });
}, [turns]); // NOT [turns.length]!
```

---

#### **EDGE CASE 6: Test Mode vs. Virtuoso Parity**

**Risk Level:** MEDIUM

**Symptom:** Test mode renders all turns without virtualization, but non-test mode uses Virtuoso.

**Problem:**

- Lines 545-589: Test mode renders `turns.map()`
- Lines 591-609: Non-test mode uses `<Virtuoso data={turns} ... />`
- Both use same `itemContent` callback and rendering logic
- **But Virtuoso's `initialTopMostItemIndex={turns.length - 1}` may not initialize the same way in non-test**

Additionally:

- Test mode: immediate DOM access for all turns
- Non-test mode: lazy virtualization with `increaseViewportBy={{ top: 1000, bottom: 500 }}`
- If E2E tests switch between modes, they see different behavior

**Concrete Locations:**

- Line 407: `const isTestMode = settings?.isTestMode;`
- Line 545-589: Test render path
- Line 591-609: Virtuoso render path
- Line 599: `initialTopMostItemIndex={turns.length - 1}`

**Patch Recommendation:**

```typescript
// ENHANCEMENT: Extract common render logic
const turnItems = useMemo(() =>
  turns.map((turn, index) => ({
    turn,
    isLastTurn: index === turns.length - 1,
    isTurnWorking: isStreaming && index === turns.length - 1,
    turnSummary: summarizeTurn(turn, isStreaming && index === turns.length - 1),
  })),
  [turns, isStreaming]
);

// Then use turnItems in BOTH test and non-test paths
// to ensure identical rendering

// Also: Add explicit isTestMode to Virtuoso conditionally
return (
  <Virtuoso
    data={turns}
    {...(isTestMode ? {
      // In test mode: disable virtualization features
      disableScrolling: true,
      // ... other test overrides
    } : {
      increaseViewportBy={{ top: 1000, bottom: 500 }},
      initialTopMostItemIndex: turns.length - 1,
    })}
    ...
  />
);
```

---

#### **EDGE CASE 7: Retry with Orphaned Assistant**

**Risk Level:** HIGH

**Symptom:** Retry logic searches for last user message with `[...messages].reverse().find(m => m.role === "user")`.

**Problem:**

- Lines 340-346: Retry finds last user message by role
- This is correct!
- **But if a previous stream created an orphaned assistant turn, the messages array has assistant messages WITHOUT a corresponding user message**

```
messages = [
  { id: 1, role: "user", ... },
  { id: 2, role: "assistant", ... },
  // Stream 2 fails before user message is added:
  { id: 3, role: "assistant", ... }  ← orphaned!
]

groupMessagesIntoTurns():
Turn 1: user=1, assistants=[2]
Turn 2: user=null, assistants=[3]

On retry:
lastUserMessage = 1 ✓ (found correctly)
But streamMessage uses lastUserMessage.content from turn 1!
Should it use turn 2's partial state?
```

**Concrete Locations:**

- Lines 340-346: Last user message search
- Line 351-355: `streamMessage()` call with found message

**Patch Recommendation:**

```typescript
// BEFORE: Simple reverse search
const lastUserMessage = [...messages]
  .reverse()
  .find((message) => message.role === "user");

// AFTER: Use turn structure for context
const lastUserTurn = turns.findLast((turn) => turn.userMessage !== null);
const lastUserMessage = lastUserTurn?.userMessage;
if (!lastUserMessage) {
  console.error(
    "[MessagesList] No user message found in any turn. Orphaned assistant messages: ",
    turns.filter((t) => !t.userMessage).length,
  );
  return;
}
```

---

#### **EDGE CASE 8: Footer Context Coupling**

**Risk Level:** MEDIUM

**Symptom:** `FooterComponent` receives raw `messages` array, not `turns`.

**Problem:**

- Lines 185-202: `FooterContext` passes `messages: Message[]`
- Lines 208-387: `FooterComponent` uses raw messages for undo/retry
- The footer doesn't know about the turn structure!
- If the undo/retry logic in footer differs from the message grouping:

```
MessagesList knows: messages = [1, 2, 3, 4, 5] → 2 turns
Footer uses: messages[messages.length - 1] = 5
But rendered last turn might be turn-index-1 based on Virtuoso!
```

**Concrete Locations:**

- Lines 208-387: FooterComponent implementation
- Line 245: `messages[messages.length - 1]` assumption
- Line 477: `messages` passed in context

**Patch Recommendation:**

```typescript
// BEFORE: Footer uses raw messages
interface FooterContext {
  messages: Message[];  // ← Raw array
  ...
}

// AFTER: Pass both messages and turns context
interface FooterContext {
  messages: Message[];
  turns: MessageTurn[];  // ← Add turn structure
  getLastTurn(): MessageTurn | null;
  ...
}

// Then in FooterComponent undo/retry:
const lastTurn = getLastTurn();
if (!lastTurn?.userMessage) {
  console.error("Last turn has no user message");
  return;
}
const userMessage = lastTurn.userMessage;
const previousAssistantMessage =
  lastTurn.assistantMessages[lastTurn.assistantMessages.length - 1];
```

---

#### **EDGE CASE 9: Empty Turn After Undo**

**Risk Level:** MEDIUM

**Symptom:** A turn with only a user message (no assistant responses) renders with `className="opacity-70"`.

**Problem:**

- Lines 441, 466, 581: `hasAssistantContent = turn.assistantMessages.length > 0`
- If undo removes assistant messages but leaves user message, the turn becomes faded
- **But the user message is still valuable context!**
- Additionally, faded turns still take up space and confuse users

```
User says: "Generate a component"
Assistant responds: "Sure! <start streaming...>"

User clicks undo mid-stream:
Turn now: User msg present, but assistantMessages = [] (reverted)
Result: Faded turn with user's request but no assistant response
```

**Concrete Locations:**

- Line 441: `const hasAssistantContent = turn.assistantMessages.length > 0;`
- Line 466: `className={!hasAssistantContent ? "opacity-70" : undefined}`
- Line 581: Same in test mode

**Patch Recommendation:**

```typescript
// BEFORE: Binary hasAssistantContent
const hasAssistantContent = turn.assistantMessages.length > 0;
return (
  <div className="px-4" key={turn.id}>
    <SessionTurn
      ...
      className={!hasAssistantContent ? "opacity-70" : undefined}
    />
  </div>
);

// AFTER: Distinguish between "never had" vs "had but lost"
const hasAssistantContent = turn.assistantMessages.length > 0;
const isIncomplete =
  turn.userMessage !== null &&
  !hasAssistantContent &&
  isTurnWorking;  // Only fade if it's actually processing

return (
  <div
    className="px-4"
    key={turn.id}
    data-testid={`turn-${turn.id}`}
    data-incomplete={isIncomplete}
  >
    <SessionTurn
      ...
      className={isIncomplete ? "opacity-50" : undefined}
      error={isIncomplete ? "Waiting for response..." : undefined}
    />
  </div>
);
```

---

## 2. UNDO/RETRY ASSUMPTIONS

### Current Undo Implementation (Lines 237-288)

```typescript
onClick={async () => {
  // ... setup ...
  const currentMessage = messages[messages.length - 1];
  const userMessage = messages[messages.length - 2];
  if (currentMessage?.sourceCommitHash) {
    await revertVersion({
      versionId: currentMessage.sourceCommitHash,
      currentChatMessageId: userMessage ? {
        chatId: selectedChatId,
        messageId: userMessage.id,
      } : undefined,
    });
    // ... update state ...
  }
}}
```

**Assumptions:**

1. Last message is the assistant response to undo
2. Second-to-last message is the user message that triggered it
3. Both exist and are in sequential positions

**Failures with turn grouping:**

- ✗ If turn 1 has multiple assistant responses: `messages[length-1]` might not be the one to revert
- ✗ If turn 2 user message exists: `messages[length-2]` might be turn 1's assistant, not turn 2's user

---

### Current Retry Implementation (Lines 294-371)

```typescript
onClick={async () => {
  // ... setup ...
  const lastVersion = versions[0];
  const lastMessage = messages[messages.length - 1];
  let shouldRedo = true;
  if (
    lastVersion.oid === lastMessage.commitHash &&
    lastMessage.role === "assistant"
  ) {
    // Try to find previous assistant
    const previousAssistantMessage = messages[messages.length - 3];
    if (previousAssistantMessage?.role === "assistant") {
      // Revert to previous
      await revertVersion({...});
      shouldRedo = false;
    }
  }
  // Find last user message
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  // Stream new response
  streamMessage({
    prompt: lastUserMessage.content,
    chatId: selectedChatId,
    redo,
  });
}}
```

**Assumptions:**

1. Last message role can be checked to detect if it's an assistant response
2. Previous assistant is 3 positions back (user, assistant, assistant pattern)
3. Last user message can always be found

**Failures with turn grouping:**

- ✗ Pattern assumes `[user, assistant, assistant]` but could be `[user, assistant_1, assistant_2, user_2, assistant_3]`
- ✗ Orphaned assistant messages break the position assumption

---

## 3. STREAMING STATE VERIFICATION

### Current Streaming Logic

**isStreaming Detection (Line 437):**

```typescript
const isTurnWorking = isStreaming && isLastTurn;
```

**Problem:** `isStreaming` is global to the chat, not per-turn. If:

1. Turn 1 finishes streaming
2. Turn 2 starts streaming
3. Turn 1 is still rendered: `isLastTurn = false`, so `isTurnWorking = false` ✓

**But if messy state:**

1. Turn 1 streaming marked complete
2. Turn 2 user message added
3. Turn 2 assistant response added BEFORE state settles
4. Grouping might show Turn 2 has 2 assistant messages
5. But `isLastTurn` check only looks at array index, not turn completion

### Expansion State During Streaming (Lines 442-443)

```typescript
const stepsExpanded =
  expandedTurnIds.has(turn.id) ||
  (isTurnWorking && turnSummary.steps.length > 0);
```

**Problem:** If a turn starts working, steps auto-expand. **But what if user manually closes steps?**

- User clicks "Hide steps" → `expandedTurnIds` updated
- Turn keeps streaming → steps auto-collapse when new chunk arrives
- User experience is flaky

---

## 4. FIRST-ASSISTANT-WITHOUT-USER EDGE CASE

### Scenario

```
Initial state: messages = []
User 1 sends message → messages = [msg_id=1, role=user]
Stream starts, gets first chunk → messages = [msg_id=1, msg_id=2, role=assistant]

At this point:
Turn 1: user=msg_1, assistants=[msg_2] ✓

But if stream creates messages out of order (network delays):
messages = [msg_id=2, role=assistant, msg_id=1, role=user]

Grouping:
Turn 1: user=null, assistants=[msg_2] ← orphan!
Turn 2: user=msg_1, assistants=[] ← now there's an incomplete turn!
```

**Concrete Risk:**

- No test covers: "Assistant message appears before user message in array"
- IPC contract guarantees order? **Not explicitly verified**

---

## 5. TEST MODE PARITY

### Differences Between Test and Non-Test Rendering

| Aspect            | Test Mode            | Non-Test                                     |
| ----------------- | -------------------- | -------------------------------------------- |
| Rendering         | `turns.map()` direct | `<Virtuoso>` with lazy rendering             |
| Initialization    | Immediate            | `initialTopMostItemIndex={turns.length - 1}` |
| DOM Size          | All turns visible    | Only viewport + buffer visible               |
| Scrolling         | Native browser       | Virtuoso managed                             |
| Footer Visibility | Part of renders      | Separate `<Footer>` component                |

### Potential Mismatches

1. **Turn ID calculation:** Both use same `groupMessagesIntoTurns()`, but if Virtuoso's index logic differs:
   - Test expects turn at index 2 = turn ID X
   - Non-test Virtuoso might render turn ID Y at same visual position

2. **Last turn detection:** Both use `isLastTurn = index === turns.length - 1`, but:
   - Test: reliable, all turns rendered
   - Non-test: might not have all turns in virtual DOM

3. **Expansion state sync:** Test mode doesn't lazy-load, so expansion state should persist across all turns, but non-test mode might lose state if user scrolls up then down

---

## 6. CONCRETE PATCH RECOMMENDATIONS SUMMARY

| Edge Case                          | File             | Lines            | Patch Priority | Implementation Effort |
| ---------------------------------- | ---------------- | ---------------- | -------------- | --------------------- |
| **Orphan turn ID stability**       | MessagesList.tsx | 56-64, 399       | HIGH           | Low                   |
| **Undo array index assumption**    | MessagesList.tsx | 245-247, 304-337 | CRITICAL       | Medium                |
| **Retry array index assumption**   | MessagesList.tsx | 311, 340-355     | CRITICAL       | Medium                |
| **Multi-message duration sorting** | MessagesList.tsx | 163-174          | MEDIUM         | Low                   |
| **Streaming state race condition** | MessagesList.tsx | 437, 554         | CRITICAL       | Medium                |
| **Expansion state cleanup**        | MessagesList.tsx | 399, 456-464     | HIGH           | Low                   |
| **Test/Virtuoso parity**           | MessagesList.tsx | 407, 545-609     | MEDIUM         | High                  |
| **Retry with orphan**              | MessagesList.tsx | 340-346          | HIGH           | Low                   |
| **Empty turn opacity**             | MessagesList.tsx | 441, 466         | MEDIUM         | Low                   |

---

## 7. RECOMMENDED TEST CASES

### Unit Tests

1. **`groupMessagesIntoTurns()` edge cases:**
   - `[]` → `[]`
   - `[assistant_1]` → `[orphan_turn_1]`
   - `[user_1, user_2]` → `[turn_1_empty_assistants, turn_2_empty_assistants]`
   - `[assistant_1, user_1, assistant_2]` → `[orphan_turn_1, turn_user_1_with_2]`

2. **Turn ID generation:**
   - Verify no duplicate turn IDs
   - Verify orphan turn IDs don't collide with normal turn IDs
   - Verify turn ID stability across grouping calls

3. **Undo assumptions:**
   - Test with multi-assistant turns
   - Test with orphan assistants present
   - Test with no user message

### E2E Tests (Already exist, verify parity)

1. `undo.spec.ts` - add case for orphaned assistant + undo
2. `retry.spec.ts` - add case for orphaned assistant + retry

---

## 8. CRITICAL UNKNOWNS

1. **Is message order guaranteed?** IPC contract doesn't explicitly sort messages
2. **Can `createdAt` be null/undefined?** If so, duration calculation breaks
3. **Does revertVersion preserve message IDs?** If IDs change, turn IDs break
4. **Is `sourceCommitHash` always present?** Code handles null, but what's the actual behavior?
5. **Can stream create assistant messages without preceding user?** This is the orphan scenario

---

## CONCLUSION

The turn grouping refactor in `MessagesList` is architecturally sound but has **9 distinct regression vectors**, with **3 marked CRITICAL**:

1. **Array index assumptions in undo/retry** will break with multi-message turns
2. **Streaming state race conditions** can cause wrong turn to be marked as working
3. **Orphan assistant messages** are unsupported and create invalid state

**Immediate action:** Add test cases for the CRITICAL items before merging any upstream changes to message handling.
