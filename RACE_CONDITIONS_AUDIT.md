# EXHAUSTIVE RACE CONDITIONS & STALE-STATE BUG ANALYSIS
## Chat Flow - Production Stability Audit

**Scope**: Create chat, send stream, approve/reject proposal, cancel stream, refresh, chat switch
**Date**: 2026-03-05
**Files Analyzed**: 15+ core files across IPC handlers, hooks, atoms, and components

---

## CRITICAL FINDINGS (Ranked by Impact)

### 🔴 CRITICAL #1: Stream Abortion → Stale Message State
**Severity**: CRITICAL | **Impact**: Data loss + UI inconsistency | **Frequency**: High (cancellation race)

#### Triggering Sequence
1. User sends message → `streamMessage()` starts stream, marks `isStreaming=true`
2. Chat stream handler writes placeholder assistant message to DB
3. User clicks cancel immediately → `handleCancel()` calls `ipc.chat.cancelStream(chatId)` 
4. Meanwhile, stream chunks are arriving in OpenCode path
5. Cancellation handler sets `abortController.abort()` and `activeStreams.delete(chatId)` (line 896)
6. **Race condition**: If chunk arrives between abort signal check (line 291) and DB update (line 768-770)

#### File References
- **Handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/chat_stream_handlers.ts:762-776`
- **Abort check**: line 291 in `processStreamChunks()`
- **Partial response storage**: line 667 `partialResponses.set(req.chatId, fullResponse)`
- **Cancel handler**: line 890-912

#### The Bug
```typescript
// chat_stream_handlers.ts:762-776
if (abortController.signal.aborted) {
  const partialResponse = partialResponses.get(req.chatId);
  if (partialResponse) {
    // ❌ RACE: This update may conflict with concurrent chunk updates
    await db.update(messages)
      .set({ content: `${partialResponse}\n\n[Response cancelled by user]` })
      .where(eq(messages.id, placeholderAssistantMessage.id));
    partialResponses.delete(req.chatId);
  }
  return req.chatId;
}
```

The `partialResponse` saved at line 667 may be stale by the time cancellation is processed. Meanwhile:
- Line 286: `fullResponse = await processResponseChunkUpdate({ fullResponse })`
- Line 670-674: Separate DB update happens on timer every 150ms

**Two concurrent DB update paths** with no synchronization:
1. Periodic saves during streaming (150ms intervals)
2. Cancellation save on abort signal

#### Fix Direction
- Wrap both periodic saves and cancel DB operations in a per-chat write lock
- Use advisory lock on `messages.id` during stream lifetime
- Save final state atomically with abort status

---

### 🔴 CRITICAL #2: Atom State Lost on Fast Chat Switch
**Severity**: CRITICAL | **Impact**: UI shows wrong messages | **Frequency**: Medium (power users)

#### Triggering Sequence
1. User in Chat A (chatId=5) with streaming active
2. Click Chat B (chatId=7) rapidly → route change triggers `useEffect` in ChatPanel
3. `fetchChatMessages()` called for Chat B (line 80-95 in ChatPanel.tsx)
4. Meanwhile, Chat A stream completes, calls `onEnd` callback
5. Callback updates `chatMessagesByIdAtom` map (line 175-179 in useStreamChat.ts)
6. **Race condition**: Which update wins - Chat A's stream end or Chat B's fetch?

#### File References
- **Atoms**: `/Users/cosmos/Documents/an/ANYON-b2c/src/atoms/chatAtoms.ts:5-11`
- **ChatPanel effect**: `/Users/cosmos/Documents/an/ANYON-b2c/src/pages/chat.tsx:44-51`
- **Message fetch**: `/Users/cosmos/Documents/an/ANYON-b2c/src/components/ChatPanel.tsx:80-95`
- **Stream onEnd callback**: `/Users/cosmos/Documents/an/ANYON-b2c/src/hooks/useStreamChat.ts:175-180`

#### The Bug
```typescript
// chatAtoms.ts
export const chatMessagesByIdAtom = atom<Map<number, Message[]>>(new Map());

// ChatPanel.tsx:80-95 - Fetch for new chat
const fetchChatMessages = useCallback(async () => {
  if (!chatId) return;
  const chat = await ipc.chat.getChat(chatId); // ← Async call
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, chat.messages); // ← Update at time T2
    return next;
  });
}, [chatId, setMessagesById]);

// useStreamChat.ts:175-180 - Stream end callback
onChunk: ({ messages: updatedMessages }) => {
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, updatedMessages); // ← Update at time T1 or T3?
    return next;
  });
},
```

**Timeline**:
- T0: User switches from Chat 5→7, `fetchChatMessages(7)` starts
- T1: Chat 5's stream ends, `onEnd` callback queues update: `set(5, [...messages])`
- T2: `ipc.chat.getChat(7)` completes, queues update: `set(7, [...])`
- ❌ **Problem**: If T1 and T2 updates execute out of order, or the `prev` map captured in closure is stale

The Jotai atom setter uses functional updates, BUT:
- The `prev` map reference could be stale if multiple setState calls queue in React
- No transactional guarantee across multiple atom updates

#### Fix Direction
- Debounce `fetchChatMessages()` to avoid fetching while a stream for a different chat is settling
- Track which chatId each pending update is for
- Cancel in-flight IPC requests when chatId changes

---

### 🔴 CRITICAL #3: Proposal Approval → Message State Mismatch
**Severity**: CRITICAL | **Impact**: Approved code not applied + UI inconsistency | **Frequency**: Medium

#### Triggering Sequence
1. User in Chat A, receives proposal (assistant message with code tags)
2. User clicks "Approve" → `handleApprove()` calls `ipc.proposal.approveProposal(chatId, messageId)`
3. Meanwhile, another message arrives or user switches chat
4. Approval handler locks with `withLock("get-proposal:" + chatId, ...)` (line 128)
5. But `refreshProposal()` and `fetchChatMessages()` both fire at onSuccess (line 334-335)
6. **Race condition**: If approval is slow, these fetches run with stale DB state

#### File References
- **Approval handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/proposal_handlers.ts:326-376`
- **Lock**: line 128
- **Component handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/components/chat/ChatInput.tsx:300-337`
- **Refreshes**: line 334-335

#### The Bug
```typescript
// proposal_handlers.ts:326-376
const approveProposalHandler = async (
  _event: IpcMainInvokeEvent,
  { chatId, messageId }: { chatId: number; messageId: number },
): Promise<ApproveProposalResult> => {
  // ❌ Lock only protects proposal calculation, not action execution
  // processFullResponseActions() may take 0-5s (file I/O, git ops)
  const processResult = await processFullResponseActions(
    messageToApprove.content,
    chatId,
    { chatSummary, messageId },
  );
  // ❌ No DB update to set approvalState='approved' before returning
  return { success: true, ... };
};

// ChatInput.tsx:334-335 - Post-approval
finally {
  refreshProposal(); // Queries latest assistant message
  fetchChatMessages(); // Fetches full chat
}
```

**The problem**:
1. DB is updated by `processFullResponseActions()` (files written, commits made)
2. But the message's `approvalState` column is never set to `'approved'`
3. Next proposal fetch sees same message again (line 146: `!latestAssistantMessage?.approvalState`)
4. User sees proposal UI again even though it was approved

#### Fix Direction
- After `processFullResponseActions()` succeeds, atomically update message: `approvalState='approved'`
- Add constraint: prevent approval if message already approved
- Use transaction for approval + state update

---

### 🟠 HIGH #4: Stream Client Map Cleanup on Early Disconnection
**Severity**: HIGH | **Impact**: Memory leak + stale callbacks | **Frequency**: Low (disconnects)

#### Triggering Sequence
1. User starts stream for Chat 5
2. Stream handler calls `setupListeners()` in `createStreamClient` (line 340)
3. Listeners registered globally: `ipcRenderer.on(chunk.channel, ...)` (line 293)
4. User force-closes window or Electron process crashes
5. Chat 5's stream entry remains in `streams` Map (line 276-283)
6. Next session, new Chat 5 stream starts
7. **Race condition**: Old listeners may still fire and update wrong stream entry

#### File References
- **Stream client**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/contracts/core.ts:260-381`
- **Listener setup**: line 287-326
- **Streams map**: line 276-283
- **Key extraction**: line 296-298, 306-308, 317-319

#### The Bug
```typescript
// core.ts:276-283
const streams = new Map<
  KeyValue,
  { onChunk, onEnd, onError }
>();

let listenersSetUp = false;

const setupListeners = () => {
  if (listenersSetUp) return; // ❌ Global flag prevents re-setup
  // Register listeners ONCE per IPC connection
  ipcRenderer.on(contract.events.chunk.channel, (data) => {
    const key = data[contract.keyField];
    streams.get(key)?.onChunk(data); // ❌ If key was re-used, calls old callback
  });
  listenersSetUp = true;
};
```

**The issue**:
- `listenersSetUp` is module-scope, set to true once
- If Chat 5 crashes and restarts, the old `streams.get(5)` callback still exists
- New Chat 5 stream replaces it at line 356: `streams.set(key, callbacks)`
- But if overlap occurs (old listener fires before new callback registered), data goes to wrong place

#### Fix Direction
- Track listener unsubscribe functions
- Call them when stream client is destroyed or on IPC reconnect
- Use weakmaps for listener storage to auto-cleanup

---

### 🟠 HIGH #5: Proposal Cache Invalidation During Rapid Approval/Rejection
**Severity**: HIGH | **Impact**: Stale token counts + poor UX | **Frequency**: Medium (power users)

#### Triggering Sequence
1. User gets proposal in Chat 5
2. User clicks Approve → `approveProposal` IPC call starts (async)
3. Before approval completes, user clicks Cancel Stream for same chat
4. Stream cancellation calls `safeSend(event.sender, "chat:response:end", ...)` (line 903)
5. Renderer calls `invalidateChats()` and other query invalidations
6. Meanwhile, approval is still running, will overwrite codebase token cache

#### File References
- **Token cache**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/proposal_handlers.ts:41-73`
- **Cache invalidation**: line 57-73 (cleanup)
- **Get cached tokens**: line 76-122
- **Cancellation sends**: line 903-909

#### The Bug
```typescript
// proposal_handlers.ts:41-73
const codebaseTokenCache = new Map<number, CodebaseTokenCache>();

function cleanupExpiredCacheEntries() {
  const now = Date.now();
  codebaseTokenCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_EXPIRATION_MS) {
      codebaseTokenCache.delete(key); // ❌ No lock protection
    }
  });
}

async function getCodebaseTokenCount(...) {
  cleanupExpiredCacheEntries(); // Called at line 84
  const cacheEntry = codebaseTokenCache.get(chatId);
  // ❌ Entry could be deleted between check and use
  if (cacheEntry && /* validation */) {
    return cacheEntry.tokenCount;
  }
  // Calculate and cache - takes 1-5s
  codebaseTokenCache.set(chatId, { ... }); // ❌ Race: another approval might overwrite
}
```

**The race**:
- T0: Approval 1 starts, gets to `getCodebaseTokenCount(chatId=5)`
- T1: `cleanupExpiredCacheEntries()` runs, no locks
- T2: Approval 2 starts for same chat
- T3: Approval 1's caching completes, writes stale data
- T4: Approval 2's token count is now corrupted

#### Fix Direction
- Wrap cache operations in a per-chatId lock
- Use expiration timestamp instead of polling cleanup
- Make cache entry immutable after write

---

### 🟠 HIGH #6: Cancel Stream Lost in Fast Submission
**Severity**: HIGH | **Impact**: Orphaned stream + double messages | **Frequency**: Low (user error)

#### Triggering Sequence
1. User submits message → `handleSubmit()` → `streamMessage()` sets `isStreaming=true`
2. Stream starts: `chatStreamClient.start()` at line 156 in useStreamChat.ts
3. User immediately clicks Cancel (before stream even reaches main process)
4. `handleCancel()` calls `ipc.chat.cancelStream(chatId)` (line 271 in ChatInput.tsx)
5. Cancel IPC message and Stream start IPC message both race to main process
6. **Race condition**: Cancel handler fires on non-existent stream entry

#### File References
- **Handle cancel**: `/Users/cosmos/Documents/an/ANYON-b2c/src/components/chat/ChatInput.tsx:269-274`
- **Stream start**: `/Users/cosmos/Documents/an/ANYON-b2c/src/hooks/useStreamChat.ts:156-163`
- **Cancel handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/chat_stream_handlers.ts:890-912`
- **Pending set**: line 40, 102, 112

#### The Bug
```typescript
// ChatInput.tsx:269-274
const handleCancel = () => {
  if (chatId) {
    ipc.chat.cancelStream(chatId); // ❌ Fires async, no guarantee stream started
  }
  setIsStreaming(false); // ❌ Updates UI immediately, may be out of sync
};

// chat_stream_handlers.ts:890-912
createTypedHandler(chatContracts.cancelStream, async (event, chatId) => {
  const abortController = activeStreams.get(chatId);
  if (abortController) {
    abortController.abort();
    activeStreams.delete(chatId);
  } else {
    logger.warn(`No active stream found for chat ${chatId}`); // ← Silent failure
  }
  safeSend(event.sender, "chat:response:end", { chatId, updatedFiles: false });
});
```

**The issue**:
1. `handleCancel()` immediately sets `isStreaming=false` (line 273)
2. But stream might not have registered in `activeStreams` yet
3. Cancel handler does nothing silently
4. Stream continues in background, updates UI 5 seconds later
5. User sees messages appearing after they cancelled

#### Fix Direction
- Don't set `isStreaming=false` until cancel IPC completes
- Return error from cancel handler if stream not found
- Use `pendingStreamChatIds` set to track streams in flight

---

### 🟡 MEDIUM #7: Multiple Proposals Fetching Simultaneously
**Severity**: MEDIUM | **Impact**: Duplicate work + stale data | **Frequency**: Medium

#### Triggering Sequence
1. Chat 5 receives message, user opens proposal panel
2. `useProposal(chatId)` triggers `getProposal` IPC call (async)
3. User approves a different proposal in Chat 7
4. Callback invalidates all proposal queries: `queryClient.invalidateQueries({ queryKey: ["proposal", ...] })`
5. Chat 5's proposal fetches again, but old fetch still in flight
6. **Race condition**: Two parallel `getProposal` calls for same chat

#### File References
- **useProposal hook**: `/Users/cosmos/Documents/an/ANYON-b2c/src/hooks/useProposal.ts` (not shown, but referenced at line 172 in ChatInput.tsx)
- **Invalidation**: `/Users/cosmos/Documents/an/ANYON-b2c/src/hooks/useStreamChat.ts:239`
- **getProposal handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/proposal_handlers.ts:124-323`
- **Lock**: line 128

#### The Bug
The handler IS locked:
```typescript
const getProposalHandler = async (
  _event: IpcMainInvokeEvent,
  { chatId }: { chatId: number },
): Promise<ProposalResult | null> => {
  return withLock("get-proposal:" + chatId, async () => { // ✓ Has lock
    // ... complex processing including codebase extraction
  });
};
```

**However**, the lock is only per-chatId. If:
- Chat 5 proposal fetch takes 3s (complex codebase)
- User modifies proposal and invalidates
- New fetch starts while lock still held
- React Query will deduplicate at client level BUT not at server level

The `withLock` ensures sequential execution per chat, but there's no deduplication of in-flight requests.

#### Fix Direction
- Ensure React Query's `staleTime` is set appropriately
- Use request deduplication middleware
- Cache proposals with tag-based invalidation

---

### 🟡 MEDIUM #8: `isStreaming` Atom Desynchronization
**Severity**: MEDIUM | **Impact**: UI shows wrong state, buttons disabled | **Frequency**: Medium

#### Triggering Sequence
1. Stream starts: `setIsStreamingById((prev) => { next.set(chatId, true); return next; })` (line 125)
2. First chunk arrives: `onChunk` callback (line 165)
3. Meanwhile, component unmounts (chat switch or tab close)
4. Cleanup doesn't run for pending stream
5. Stream completes, `onEnd` sets `isStreaming=false` (line 249-253)
6. But if chat is already gone from UI, this update is orphaned
7. **Race condition**: New Chat 5 (different instance) thinks it's streaming

#### File References
- **Stream init**: `/Users/cosmos/Documents/an/ANYON-b2c/src/hooks/useStreamChat.ts:125-129`
- **onEnd**: line 249-253
- **Atom**: `/Users/cosmos/Documents/an/ANYON-b2c/src/atoms/chatAtoms.ts:11`

#### The Bug
```typescript
// useStreamChat.ts
const setIsStreamingById = useSetAtom(isStreamingByIdAtom);

// Stream starts
setIsStreamingById((prev) => {
  const next = new Map(prev);
  next.set(chatId, true);
  return next;
});

// Stream ends (in onEnd callback)
setIsStreamingById((prev) => {
  const next = new Map(prev);
  next.set(chatId, false); // ❌ chatId could be undefined if hook unmounted
  return next;
});
```

If `useStreamChat` unmounts before `onEnd` fires:
- The `chatId` from `useSearch()` at line 67-75 becomes stale
- The `setIsStreamingById` setter is captured in the closure
- `onEnd` still fires and updates the atom with old/wrong chatId
- New instance of same chat sees `isStreaming=true` forever

#### Fix Direction
- Create cleanup effect that removes the chatId entry when component unmounts
- Use abort controller tied to component lifecycle
- Validate that chatId still matches URL before updating atoms in callbacks

---

### 🟡 MEDIUM #9: Attachment Cleanup Race with Stream Cancellation
**Severity**: MEDIUM | **Impact**: Temp files not cleaned + disk space leak | **Frequency**: Low

#### Triggering Sequence
1. User uploads attachment → stored in `TEMP_DIR` (line 69)
2. Stream starts, processes attachment in message (line 388-389)
3. User cancels stream before completion
4. Cancellation doesn't trigger cleanup (line 863-883 only runs on finally block of main handler)
5. **Race condition**: If cancellation abort happens mid-attachment-processing

#### File References
- **Attachment writes**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/chat_stream_handlers.ts:388-427`
- **Cleanup**: line 863-883
- **Finally block**: line 856

#### The Bug
```typescript
// chat_stream_handlers.ts:301-884
ipcMain.handle("chat:stream", async (event, req: ChatStreamParams) => {
  void (async () => { // ❌ Fire-and-forget async IIFE
    const attachmentPaths: string[] = [];
    try {
      // ... stream processing
    } finally {
      // Cleanup at line 863-883
      if (attachmentPaths.length > 0) {
        for (const filePath of attachmentPaths) {
          setTimeout(async () => { // ❌ Cleanup scheduled after 30min
            if (fs.existsSync(filePath)) {
              await unlink(filePath);
            }
          }, 30 * 60 * 1000);
        }
      }
    }
  })();
  return req.chatId; // Returns immediately, async continues
});
```

**The issues**:
1. Handler returns immediately, doesn't wait for stream completion
2. If process crashes within 30 minutes, temp files leak
3. No cleanup on explicit cancellation (abort doesn't trigger file deletion)
4. `attachmentPaths` array updated at runtime, could miss paths if error occurs early

#### Fix Direction
- Move attachment writing and cleanup outside the fire-and-forget async function
- Clean up attachments immediately after stream ends (success or cancellation)
- Use a manifest file to track temp files and clean on startup

---

### 🟡 MEDIUM #10: Proposal Rejection Does Not Clear Approval UI
**Severity**: MEDIUM | **Impact**: UI shows phantom approve button | **Frequency**: Low

#### Triggering Sequence
1. User gets proposal, rejects it
2. `rejectProposal` IPC sets `approvalState='rejected'` (line 406)
3. `refreshProposal()` called (line 358 in ChatInput.tsx)
4. But `useProposal` hook's `useQuery` may have cached result with `staleTime`
5. **Race condition**: Query still returns old proposal in UI

#### File References
- **Rejection handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/proposal_handlers.ts:379-410`
- **Component refresh**: `/Users/cosmos/Documents/an/ANYON-b2c/src/components/chat/ChatInput.tsx:358`
- **useProposal invocation**: line 172-177

#### The Bug
```typescript
// proposal_handlers.ts:403-407
await db
  .update(messages)
  .set({ approvalState: "rejected" }) // ✓ Sets column correctly
  .where(eq(messages.id, messageId));

// ChatInput.tsx:358
refreshProposal(); // Calls refetch(), should work

// BUT: If useProposal has staleTime > 0, immediate refetch might use cache
```

The issue is not in the handler but in the hook's caching strategy. If `useProposal` uses React Query with `staleTime: 60000`, the rejection might not reflect immediately.

#### Fix Direction
- Set `staleTime: 0` for proposal queries
- Or manually invalidate with `queryClient.invalidateQueries()`
- Add optimistic update to immediately clear proposal from UI

---

### 🟡 MEDIUM #11: Chat Context May Be Stale During Proposal Processing
**Severity**: MEDIUM | **Impact**: Wrong file edits + security risk | **Frequency**: Medium

#### Triggering Sequence
1. User makes changes to repo between message and approval
2. `approveProposal` retrieves message content (line 337-351)
3. Message content may reference files that no longer exist
4. `processFullResponseActions` tries to apply changes (line 356)
5. **Race condition**: File system state changed since message generated

#### File References
- **Approval handler**: `/Users/cosmos/Documents/an/ANYON-b2c/src/ipc/handlers/proposal_handlers.ts:326-376`
- **Message retrieval**: line 337-351
- **Processing**: line 356

#### The Bug
```typescript
const messageToApprove = await db.query.messages.findFirst({
  where: and(
    eq(messages.id, messageId),
    eq(messages.chatId, chatId),
    eq(messages.role, "assistant"),
  ),
  columns: { content: true }, // ❌ No timestamp or commit hash
});

if (!messageToApprove?.content) {
  throw new Error(`Assistant message not found...`);
}

// Content might reference: "Write to src/User.tsx at line 45"
// But src/User.tsx was deleted or refactored since message generated
const processResult = await processFullResponseActions(
  messageToApprove.content, // ❌ May be stale relative to current repo state
  chatId,
  { chatSummary, messageId },
);
```

No validation that file paths, line numbers, or content hashes match current state.

#### Fix Direction
- Store source commit hash with message (already in DB)
- Validate or warn if approving a message from old commit
- Add file existence checks before applying edits

---

## SUMMARY TABLE

| # | Title | Severity | Type | Root Cause | Impact |
|---|-------|----------|------|------------|--------|
| 1 | Stream Abortion → Stale Message | CRITICAL | Race Condition | Concurrent DB writes during abort | Data loss |
| 2 | Fast Chat Switch → Wrong Messages | CRITICAL | Stale Closure | Atom updates out-of-order | UI inconsistency |
| 3 | Proposal Approval → No State Update | CRITICAL | Missing Update | DB state not persisted | Code not applied |
| 4 | Stream Client Map Cleanup | HIGH | Memory Leak | Module-scope listeners | Callbacks to wrong stream |
| 5 | Token Cache Race | HIGH | Race Condition | Unprotected cache cleanup | Stale token counts |
| 6 | Cancel Lost in Submission | HIGH | Timing | No sync before cancel | Orphaned stream |
| 7 | Multiple Proposal Fetches | MEDIUM | Inefficiency | No request deduplication | Stale data |
| 8 | isStreaming Desynchronization | MEDIUM | Stale Closure | chatId undefined in onEnd | UI frozen |
| 9 | Attachment Cleanup Race | MEDIUM | Resource Leak | 30min cleanup delay | Disk space leak |
| 10 | Rejection UI Not Updated | MEDIUM | Cache Mismatch | staleTime not zero | Phantom UI |
| 11 | Stale Chat Context | MEDIUM | Validation | No commit hash check | Wrong edits |

---

## IMMEDIATE ACTION ITEMS (Priority Order)

### P0 (This Sprint)
- [ ] **#1**: Add write lock around both periodic saves and cancellation abort
- [ ] **#2**: Debounce message fetches on chat switch with cleanup
- [ ] **#3**: Atomically update message approval state after action processing

### P1 (Next Sprint)
- [ ] **#4**: Implement stream listener unsubscribe/cleanup on IPC reconnect
- [ ] **#6**: Synchronize cancel operation before returning from handleCancel
- [ ] **#8**: Clear atom entries on component unmount

### P2 (Hardening)
- [ ] **#5**: Add per-chatId locks to cache operations
- [ ] **#7**: Implement request deduplication for proposal fetches
- [ ] **#9**: Move attachment cleanup to synchronous path
- [ ] **#10**: Set proposal query staleTime to 0
- [ ] **#11**: Add commit hash validation on approval

---

## NOTES FOR DEVELOPERS

1. **Jotai Atom Updates**: Functional setState is NOT atomic across multiple atoms. Use transactions or explicit ordering.
2. **IPC Fire-and-Forget**: The `void (async () => { })()` pattern at line 302 creates liability. Consider returning promise.
3. **Per-Chat Locking**: `withLock("get-proposal:" + chatId, ...)` pattern is good. Extend to token cache, file operations.
4. **Stream Client**: Global listener setup is elegant but creates cleanup challenges. Consider per-instance setup.
5. **Cancellation**: The `pendingStreamChatIds` Set (line 40) is a good pattern for deduplication but needs expansion to other race conditions.

