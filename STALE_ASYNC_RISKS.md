# STALE ASYNC WRITE RISKS IN RENDERER STATE UPDATES
## Comprehensive Detection Report

### HIGH RISK PATTERNS IDENTIFIED

---

## 1. **STREAMING RESPONSE WITH RAPID CHAT SWITCHING** ⚠️ CRITICAL
**File:** `src/hooks/useStreamChat.ts` (lines 78-316)

**Risk:** Multiple concurrent streams to same chatId; older response chunks can overwrite newer ones if user rapidly clicks between chats.

**Vulnerable Pattern:**
```typescript
// Line 156: ipc.chatStream.start() registers callbacks
onChunk: ({ messages: updatedMessages }) => {
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, updatedMessages);  // ← chatId is from outer closure
    return next;
  });
}
```

**Race Condition Scenario:**
1. User sends message A to chat 1 (stream starts with `chatId=1`)
2. User switches to chat 2 and sends message B (stream starts with `chatId=2`)
3. Response for A arrives (old) and updates chat 2's messages
4. Response for B arrives (new) but gets overwritten by old A response

**Impact:** User sees outdated chat content; incorrect messages displayed.

**Mitigation Pattern:**
```typescript
// Capture chatId at call time to ensure closure safety
const messagesChatId = chatId;
onChunk: ({ messages: updatedMessages }) => {
  setMessagesById((prev) => {
    const next = new Map(prev);
    // Only update if this chunk is still for the current chat
    if (messagesChatId === currentChatIdRef.current) {
      next.set(messagesChatId, updatedMessages);
    }
    return next;
  });
}
```

---

## 2. **ASYNC FILE LOAD WITH PARAMETER CHANGES** ⚠️ HIGH
**File:** `src/hooks/useLoadAppFile.ts` (lines 9-36)

**Risk:** Multiple file load requests in flight; when `filePath` changes rapidly, older response for path B can overwrite newer response for path C.

**Vulnerable Pattern:**
```typescript
useEffect(() => {
  const loadFile = async () => {
    const fileContent = await ipc.app.readAppFile({ appId, filePath });
    setContent(fileContent);  // ← No check if filePath changed during await
  };
  loadFile();
}, [appId, filePath]);
```

**Race Condition Scenario:**
1. User clicks file1.js (filePath changes, load starts)
2. Before response, user clicks file2.js (filePath changes, second load starts)
3. file2 response arrives first (fast file)
4. file1 response arrives last, overwrites file2 content in UI
5. User sees wrong file content

**Impact:** Incorrect file displayed in editor.

**Mitigation Pattern:**
```typescript
useEffect(() => {
  let isMounted = true;
  const currentFilePath = filePath;  // Capture at effect time
  
  const loadFile = async () => {
    const fileContent = await ipc.app.readAppFile({ appId, filePath });
    // Only update if this response is still relevant
    if (isMounted && currentFilePath === filePath) {
      setContent(fileContent);
    }
  };
  loadFile();
  
  return () => {
    isMounted = false;
  };
}, [appId, filePath]);
```

---

## 3. **PLAN IMPLEMENTATION STREAMING WITH STATE RACE** ⚠️ HIGH
**File:** `src/hooks/usePlanImplementation.ts` (lines 72-140)

**Risk:** Async timeout + stream callbacks; if user rapid-clicks "accept plan" multiple times, older implementation stream can update messages/errors after newer one completes.

**Vulnerable Pattern:**
```typescript
// Line 69: Closure captures `planToImplement` but callbacks execute async
const planToImplement = pendingPlan;
timeoutId = setTimeout(() => {
  ipc.chatStream.start({...}, {
    onChunk: ({ messages }) => {
      if (!isMountedRef.current) return;
      setMessagesById((prev) => {
        const next = new Map(prev);
        next.set(chatId, messages);  // ← chatId from older plan's closure
        return next;
      });
    }
  });
  setPendingPlan(null);
}, 100);
```

**Race Condition Scenario:**
1. User accepts plan A (chatId=10, implementation starts with 100ms delay)
2. User accepts plan B (chatId=11, implementation starts with 100ms delay)
3. Plan B's stream completes and calls `onChunk`
4. Plan A's stream's `onChunk` fires later, uses `chatId=10` but actually updates `chatId=11` because closure captured wrong value

**Impact:** Messages get written to wrong chat; UI shows confused state.

**Mitigation Pattern:**
```typescript
// Capture chatId at stream-start time
const planChatId = planToImplement.chatId;
ipc.chatStream.start({...}, {
  onChunk: ({ messages }) => {
    if (!isMountedRef.current) return;
    setMessagesById((prev) => {
      const next = new Map(prev);
      next.set(planChatId, messages);  // Use captured value
      return next;
    });
  }
});
```

---

## 4. **DEPLOY STREAMING WITH PHASE OVERWRITES** ⚠️ MEDIUM
**File:** `src/hooks/useDirectDeploy.ts` (lines 45-98)

**Risk:** Multiple concurrent deployments per appId; `onChunk` callbacks from older deploy can overwrite phase/progress of newer deploy.

**Vulnerable Pattern:**
```typescript
// Line 56: ipc.vercelDeployStream.start() called without cancellation
ipc.vercelDeployStream.start(
  { appId, production: true },
  {
    onChunk: (chunk) => {
      setState((prev) => ({
        ...prev,
        phase: chunk.phase,
        message: chunk.message,  // ← Old chunk can overwrite new
        progress: chunk.progress,
      }));
    }
  }
);
```

**Race Condition Scenario:**
1. User clicks "Deploy" (first stream starts)
2. Before completion, user clicks "Deploy" again (second stream starts, first not cancelled)
3. First stream's later `onChunk` fires with "building" phase
4. Second stream's `onChunk` fires with "uploading" phase
5. First stream's final `onChunk` overwrites second's progress

**Impact:** Deployment progress shows incorrect phase; UI misleads user about deploy state.

**Mitigation Pattern:**
```typescript
const startDeploy = useCallback(async () => {
  if (!appId || isDeployingRef.current) return;  // ← Guards against concurrent starts
  
  isDeployingRef.current = true;
  const deployId = Math.random();  // Unique ID for this deploy
  
  ipc.vercelDeployStream.start({ appId, production: true }, {
    onChunk: (chunk) => {
      setState((prev) => {
        // Only update if this chunk is from current deploy
        if (prev.deployId !== deployId) return prev;
        return { ...prev, phase: chunk.phase, ... };
      });
    }
  });
}, [appId]);
```

---

## 5. **MUTATION SUCCESS CALLBACKS WITH STALE QUERY KEY** ⚠️ MEDIUM
**File:** `src/hooks/useMcp.ts` (lines 61-85)

**Risk:** Multiple rapid mutations (create, update, delete); `onSuccess` invalidates queries but if appId changed between mutation start and completion, wrong query is invalidated.

**Vulnerable Pattern:**
```typescript
const createServerMutation = useMutation({
  mutationFn: async (params) => ipc.mcp.createServer(params),
  onSuccess: async () => {
    // These invalidations use closure-captured serverIds
    await queryClient.invalidateQueries({ queryKey: queryKeys.mcp.servers });
  }
});
```

**Edge Case:** While not strictly a stale write, the invalidation happens asynchronously, and if TanStack Query is still processing a prior invalidation, the cache state can be inconsistent.

**Impact:** Cache inconsistency; UI may show old MCP server list.

**Mitigation Pattern:**
```typescript
const createServerMutation = useMutation({
  mutationFn: async (params) => ipc.mcp.createServer(params),
  onSuccess: async (result, variables) => {
    // Explicitly use result to ensure we're invalidating the right query
    await queryClient.invalidateQueries({ queryKey: queryKeys.mcp.servers });
    // Refetch immediately to ensure fresh data
    await queryClient.refetchQueries({ queryKey: queryKeys.mcp.servers });
  }
});
```

---

## 6. **COMPONENT FETCH WITH CHATID CHANGE** ⚠️ MEDIUM
**File:** `src/components/ChatPanel.tsx` (lines 80-95)

**Risk:** `fetchChatMessages` uses `chatId` from closure; if user rapidly switches chats, older chat's response can update newer chat's state.

**Vulnerable Pattern:**
```typescript
const fetchChatMessages = useCallback(async () => {
  if (!chatId) return;
  const chat = await ipc.chat.getChat(chatId);  // Async wait here
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, chat.messages);  // ← Stale chatId closure
    return next;
  });
}, [chatId, setMessagesById]);

useEffect(() => {
  fetchChatMessages();  // Fires on chatId change
}, [fetchChatMessages]);
```

**Race Condition Scenario:**
1. User navigates to chat 5 (`fetchChatMessages` fires for chat 5)
2. Before response, user navigates to chat 6 (`fetchChatMessages` fires for chat 6)
3. Response for chat 6 arrives first (fast)
4. Response for chat 5 arrives after, overwrites chat 6's messages in the Map

**Impact:** User sees wrong messages for selected chat.

**Mitigation Pattern:**
```typescript
const fetchChatMessages = useCallback(async () => {
  if (!chatId) return;
  const currentChatId = chatId;  // Capture at call time
  const chat = await ipc.chat.getChat(currentChatId);
  setMessagesById((prev) => {
    const next = new Map(prev);
    // Only set if still relevant
    if (currentChatId === chatId) {  // Closure-safe reference
      next.set(currentChatId, chat.messages);
    }
    return next;
  });
}, [chatId, setMessagesById]);
```

---

## 7. **APP OUTPUT EVENT SUBSCRIPTION WITH APPID CHANGE** ⚠️ MEDIUM
**File:** `src/hooks/useRunApp.ts` (lines 157-177)

**Risk:** Event subscription in `useAppOutputSubscription` filters by `appId`, but if appId changes while events are in flight, older app's events can be processed.

**Vulnerable Pattern:**
```typescript
useEffect(() => {
  const unsubscribe = ipc.events.misc.onAppOutput((output) => {
    if (appId !== null && output.appId === appId) {  // ← appId from outer scope
      processAppOutput(output);  // Can update state with old appId's data
    }
  });
  return () => {
    unsubscribe();
    if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
  };
}, [appId, processAppOutput, onHotModuleReload]);
```

**Race Condition Scenario:**
1. User selects app 1 (subscription sets appId=1, events start flowing)
2. User rapidly selects app 2 (appId=2, new subscription created but old still active)
3. Old subscription's event handler still has `appId=1` in closure
4. If events queue, old handler might process app 1's output after appId=2 is set
5. `setConsoleEntries` called with old app's log entries

**Impact:** Console shows mixed logs from different apps.

**Mitigation Pattern:**
```typescript
useEffect(() => {
  const currentAppId = appId;  // Capture at effect time
  const unsubscribe = ipc.events.misc.onAppOutput((output) => {
    // Only process if still for the same app
    if (currentAppId !== null && output.appId === currentAppId) {
      processAppOutput(output);
    }
  });
  return () => {
    unsubscribe();
  };
}, [appId, processAppOutput]);
```

---

## 8. **DEBOUNCED TOKEN COUNT WITH RAPID INPUT** ⚠️ MEDIUM-LOW
**File:** `src/hooks/useCountTokens.ts` (lines 16-46)

**Risk:** Debounce + query; if user types very fast then changes chatId, old input's token count response can update after new chatId is set.

**Vulnerable Pattern:**
```typescript
useEffect(() => {
  if (chatId === null) {
    setDebouncedInput(input);
    return;
  }
  const handle = setTimeout(() => {
    setDebouncedInput(input);  // ← Delayed write, chatId may change before this
  }, 1_000);
  return () => clearTimeout(handle);
}, [chatId, input]);

// Query uses debouncedInput
const { data: result } = useQuery({
  queryKey: queryKeys.tokenCount.forChat({ chatId, input: debouncedInput }),
  queryFn: async () => {
    if (chatId === null) return null;
    return ipc.chat.countTokens({ chatId, input: debouncedInput });
  }
});
```

**Race Condition Scenario:**
1. User in chat 5, types "hello" (debounce starts, 1s timer)
2. After 500ms, user switches to chat 6
3. After another 600ms, debounce timer fires, sets `debouncedInput="hello"` with `chatId=6`
4. Query fires with `chatId=6, input="hello"` (user never typed "hello" in chat 6!)
5. Wrong token count shown

**Impact:** Token count doesn't match user's actual input; misleading feedback.

**Mitigation Pattern:**
```typescript
useEffect(() => {
  const currentChatId = chatId;
  const currentInput = input;
  
  if (currentChatId === null) {
    setDebouncedInput(currentInput);
    return;
  }
  
  const handle = setTimeout(() => {
    // Only apply if still relevant
    setDebouncedInput((prev) => {
      if (chatId === currentChatId) {
        return currentInput;
      }
      return prev;  // Discard if chatId changed
    });
  }, 1_000);
  
  return () => clearTimeout(handle);
}, [chatId, input]);
```

---

## 9. **POLLING WITH APP CHANGE (UNCOMMITTED FILES)** ⚠️ LOW
**File:** `src/hooks/useUncommittedFiles.ts` (lines 7-23)

**Risk:** 5-second polling interval; if appId changes, the stale polling query might still be in flight and update the new app's state.

**Vulnerable Pattern:**
```typescript
export function useUncommittedFiles(appId: number | null) {
  const { data: uncommittedFiles } = useQuery({
    queryKey: queryKeys.uncommittedFiles.byApp({ appId }),
    queryFn: async () => {
      if (appId === null) throw new Error("appId is null");
      return ipc.git.getUncommittedFiles({ appId });  // ← Async call
    },
    enabled: appId !== null,
    refetchInterval: 5000,  // ← Polling every 5s
  });
}
```

**Risk is LOW because:** TanStack Query automatically manages query key changes; when `appId` changes, the old query is cancelled and new one starts. However, if a poll response is already in flight when appId changes, it could briefly update cache with wrong appId's data before query key invalidation.

**Mitigation:** Already partially handled by TanStack Query, but explicit request cancellation on appId change is safer.

---

## 10. **PLAN WITH RAPID STREAMING UPDATES** ⚠️ MEDIUM
**File:** `src/hooks/usePlan.ts` & `src/hooks/useProposal.ts` (implied pattern)

**Risk:** Multiple rapid proposals/plans being fetched; if user rapidly clicks "show plan" for different chats, older plan's data can overwrite newer plan in cache.

**Note:** Both files use standard `useQuery` which handles this well, but worth monitoring if custom cache handling is added.

---

## SUMMARY TABLE

| File | Risk Level | Pattern | Quick Fix |
|------|-----------|---------|-----------|
| `useStreamChat.ts` (lines 156-179) | CRITICAL | Stream callbacks with closure chatId | Capture chatId at stream start |
| `useLoadAppFile.ts` (lines 9-36) | HIGH | Async file load without mounted check | Add isMounted + currentFilePath check |
| `usePlanImplementation.ts` (lines 72-140) | HIGH | Timeout + stream with stale closure | Capture planChatId at timeout setup |
| `useDirectDeploy.ts` (lines 56-98) | MEDIUM | Concurrent deploy streams | Add deployId and state guard |
| `useMcp.ts` (lines 61-85) | MEDIUM | Async mutation success invalidation | Add refetchQueries for consistency |
| `ChatPanel.tsx` (lines 80-95) | MEDIUM | FetchChatMessages with chatId closure | Capture currentChatId before async |
| `useRunApp.ts` (lines 157-177) | MEDIUM | Event subscription with appId change | Capture currentAppId at effect time |
| `useCountTokens.ts` (lines 16-46) | MEDIUM-LOW | Debounce crossing appId boundaries | Guard debouncedInput setter with chatId check |
| `useUncommittedFiles.ts` | LOW | Polling query key invalidation | TanStack Query handles (monitor) |

---

## GENERAL MITIGATION PATTERNS

### Pattern 1: Capture at Call Time
```typescript
const asyncHandler = useCallback(async (param) => {
  const capturedParam = param;  // Capture immediately
  const result = await ipc.call(capturedParam);
  setState(prev => {
    // Use captured value
    if (capturedParam === currentParam) {
      return { ...prev, data: result };
    }
    return prev;
  });
}, [currentParam]);
```

### Pattern 2: Mounted Flag with Closure Capture
```typescript
const asyncEffect = useCallback(async () => {
  const currentId = idRef.current;
  let isMounted = true;
  
  const result = await ipc.fetch(currentId);
  if (isMounted && currentId === idRef.current) {
    setState(result);
  }
  
  return () => { isMounted = false; };
}, []);
```

### Pattern 3: Guard State Updates with Versioning
```typescript
const versionRef = useRef(0);

const trigger = useCallback(() => {
  const version = ++versionRef.current;
  ipc.stream.start(param, {
    onChunk: (data) => {
      setState(prev => {
        if (prev.version !== version) return prev;
        return { ...prev, data };
      });
    }
  });
}, []);
```

---

## TESTING RECOMMENDATIONS

1. **Rapid navigation tests** - Switch chats/apps 5-10 times rapidly in succession
2. **Concurrent mutation tests** - Trigger multiple mutations simultaneously
3. **Async cancellation tests** - Change params while async call is in flight
4. **Event queue tests** - Monitor event timestamps to detect reordering
