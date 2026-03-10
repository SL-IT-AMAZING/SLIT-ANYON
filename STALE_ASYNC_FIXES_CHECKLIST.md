# STALE ASYNC WRITE FIXES - PRIORITY CHECKLIST

## CRITICAL (Fix immediately - blocking UX reliability)

### [C1] useStreamChat.ts - Stream callback closure safety
- **File:** `src/hooks/useStreamChat.ts` (lines 156-179, 181-293)
- **Problem:** `onChunk` and `onEnd` callbacks reference `chatId` from closure; can update wrong chat if user switches rapidly
- **Symptoms:** Wrong messages appear in chat after rapid switching
- **Fix:** Capture `chatId` at stream start, use captured value in callbacks + validate against current
- **Effort:** 15 min
- **Priority:** P0 - affects core chat UX

---

## HIGH (Fix this sprint)

### [H1] useLoadAppFile.ts - File load race condition
- **File:** `src/hooks/useLoadAppFile.ts` (lines 9-36)
- **Problem:** Multiple file load requests; older response overwrites newer file content
- **Symptoms:** Wrong file content displayed in editor
- **Fix:** Add `isMounted` flag + capture `currentFilePath`, check before setState
- **Effort:** 10 min
- **Priority:** P1 - editor data corruption

### [H2] usePlanImplementation.ts - Plan stream closure safety
- **File:** `src/hooks/usePlanImplementation.ts` (lines 72-140)
- **Problem:** Timeout + stream callbacks with stale chatId closure
- **Symptoms:** Plan messages appear in wrong chat
- **Fix:** Capture `planChatId` from `planToImplement` at timeout setup, validate in callbacks
- **Effort:** 15 min
- **Priority:** P1 - agent feature data integrity

---

## MEDIUM (Fix next sprint or as part of UX hardening pass)

### [M1] useDirectDeploy.ts - Concurrent deploy overwrites
- **File:** `src/hooks/useDirectDeploy.ts` (lines 45-98)
- **Problem:** Multiple concurrent deployments; older stream phases overwrite newer
- **Symptoms:** Deploy progress shows wrong phase; misleads user
- **Fix:** Guard `isDeployingRef.current` (already present but improve), add `deployId` versioning
- **Effort:** 10 min
- **Priority:** P2 - deploy UX clarity

### [M2] ChatPanel.tsx - fetchChatMessages closure safety
- **File:** `src/components/ChatPanel.tsx` (lines 80-95)
- **Problem:** `fetchChatMessages` uses chatId from closure; older response overwrites newer
- **Symptoms:** Wrong chat messages displayed after rapid navigation
- **Fix:** Capture `currentChatId` before async call, validate before setState
- **Effort:** 10 min
- **Priority:** P2 - chat view correctness

### [M3] useRunApp.ts - Event subscription appId safety
- **File:** `src/hooks/useRunApp.ts` (lines 157-177)
- **Problem:** Event subscription with appId from outer scope; old app's events processed after switch
- **Symptoms:** Mixed console logs from different apps
- **Fix:** Capture `currentAppId` at effect setup, validate in event handler
- **Effort:** 10 min
- **Priority:** P2 - console correctness

### [M4] useMcp.ts - Mutation invalidation consistency
- **File:** `src/hooks/useMcp.ts` (lines 61-85)
- **Problem:** `onSuccess` invalidates but doesn't refetch; potential cache inconsistency
- **Symptoms:** Old MCP server list shown after create/update
- **Fix:** Add `refetchQueries` after invalidate in all mutation `onSuccess` handlers
- **Effort:** 15 min
- **Priority:** P2 - data consistency

### [M5] useCountTokens.ts - Debounce chatId boundary crossing
- **File:** `src/hooks/useCountTokens.ts` (lines 16-46)
- **Problem:** Debounce delay allows chatId to change before debounced value applies
- **Symptoms:** Token count for wrong chat shown
- **Fix:** Guard debounce setState with chatId check, discard if changed
- **Effort:** 10 min
- **Priority:** P2 - input feedback accuracy

---

## LOW (Monitor, fix if user reports issues)

### [L1] useUncommittedFiles.ts - Polling query race
- **File:** `src/hooks/useUncommittedFiles.ts` (lines 7-23)
- **Problem:** Polling might complete after appId changes
- **Symptoms:** Stale uncommitted files list briefly shown
- **Status:** Already mostly handled by TanStack Query key invalidation
- **Fix:** Monitor, consider explicit cancellation on appId change if needed
- **Priority:** P3 - unlikely to surface in practice

---

## IMPLEMENTATION ORDER (Recommended)

1. **Week 1 (P0 - Critical):**
   - [C1] useStreamChat.ts - 15 min
   
2. **Week 1 (P1 - High):**
   - [H1] useLoadAppFile.ts - 10 min
   - [H2] usePlanImplementation.ts - 15 min

3. **Week 2 (P2 - Medium):**
   - [M1] useDirectDeploy.ts - 10 min
   - [M2] ChatPanel.tsx - 10 min
   - [M3] useRunApp.ts - 10 min
   - [M4] useMcp.ts - 15 min
   - [M5] useCountTokens.ts - 10 min

4. **Ongoing (P3 - Low):**
   - [L1] useUncommittedFiles.ts - Monitor

---

## TESTING CHECKLIST AFTER FIXES

For each fix, run these scenario tests:

```
[C1] useStreamChat test:
☐ Send message in chat 1 (stream starts)
☐ While receiving, switch to chat 2
☐ Send message in chat 2 (second stream starts)
☐ Verify chat 1 and chat 2 have correct messages
☐ Repeat 5x rapidly to trigger race condition window

[H1] useLoadAppFile test:
☐ Open file1.js (load starts)
☐ Immediately click file2.js (before response)
☐ Verify file2.js content is shown (not file1)
☐ Repeat with 3-4 file switches

[H2] usePlanImplementation test:
☐ Click "accept plan" in chat 10
☐ Immediately click "accept plan" in chat 11
☐ Verify messages appear in correct chats
☐ Test with different plan slugs

[M1] useDirectDeploy test:
☐ Click "Deploy" (progress shows "collecting")
☐ Click "Deploy" again before first finishes
☐ Verify phase progresses correctly (not jumping backward)

[M2] ChatPanel test:
☐ Navigate: chat 1 → chat 2 → chat 3 (rapid clicks)
☐ Verify each chat shows its own messages
☐ No cross-contamination

[M3] useRunApp test:
☐ Select app 1 (console fills with logs)
☐ Rapidly select app 2, app 3, app 1
☐ Verify console shows correct app's logs only
☐ No mixed logs from different apps

[M4] useMcp test:
☐ Create MCP server
☐ Verify new server appears in list
☐ Update server settings
☐ Verify updates reflected immediately

[M5] useCountTokens test:
☐ Type in chat 5: "hello world" (debounce starts)
☐ Before 1s debounce, switch to chat 6
☐ Token count should not appear for chat 6
☐ Or should be 0 if displayed
```

---

## DOCUMENTATION REFERENCES

- Full analysis: `STALE_ASYNC_RISKS.md`
- General patterns: See "GENERAL MITIGATION PATTERNS" section
- React Query best practices: See AGENTS.md section on "React + IPC integration pattern"

