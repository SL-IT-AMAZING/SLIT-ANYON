# ASYNC VALIDATION & STATE-GUARD PATTERNS INVENTORY
## Renderer Codebase Exhaustive Mapping

**Context**: Systematic hardening of race-prone user flows  
**Scope**: `/src` renderer codebase (589 TypeScript files)  
**Generated**: 2025-03-05

---

## EXECUTIVE SUMMARY

The codebase employs **5 distinct async patterns** across hooks, IPC, and state management:

1. **Module-level Set tracking** (concurrent operation prevention)
2. **Zod-validated IPC contracts** (input/output validation)
3. **Lock mechanisms** (per-resource serialization)
4. **Stale closure avoidance** (captured variable references)
5. **Mounted/cancelled flags** (cleanup & race prevention)

---

## PATTERN 1: MODULE-LEVEL SET TRACKING
### Prevents duplicate concurrent streams

**Rationale**: Avoids race conditions when user clicks rapidly before state updates  
**Pattern**: Synchronous `Set<>` at module scope tracks active operations

### Best-in-Repo Example
**File**: `src/hooks/useStreamChat.ts` (lines 38-112)

```typescript
// Module-level set to track chatIds with active/pending streams
const pendingStreamChatIds = new Set<number>();

const streamMessage = useCallback(async ({ chatId, ... }) => {
  // Check before processing
  if (pendingStreamChatIds.has(chatId)) {
    console.warn(`Ignoring duplicate stream request for chat ${chatId}`);
    onSettled?.();
    return;
  }

  // Mark as pending
  pendingStreamChatIds.add(chatId);

  try {
    ipc.chatStream.start({...}, {
      onEnd: () => {
        pendingStreamChatIds.delete(chatId);  // Clean up
        // ... other logic
      },
      onError: () => {
        pendingStreamChatIds.delete(chatId);
        // ... error handling
      },
    });
  } catch (error) {
    pendingStreamChatIds.delete(chatId);
    // ... exception handling
  }
}, [...deps]);
```

**Key Guard Points**:
- `pendingStreamChatIds.has(chatId)` → early return if already pending
- Add to set synchronously before any async operation
- Delete on all exit paths: `onEnd`, `onError`, `catch`

**Prevents**: Double-submission, duplicate state updates

---

## PATTERN 2: ZOD-VALIDATED IPC CONTRACTS
### Type-safe input/output validation at IPC boundary

**Rationale**: Runtime validation catches invalid data from main process before renderer processes it  
**Pattern**: Centralized Zod schemas with auto-generated typed handlers

### Contract Definition
**File**: `src/ipc/contracts/core.ts` (lines 63-72)

```typescript
export function defineContract<TChannel, TInput, TOutput>(contract: {
  channel: TChannel;
  input: TInput;
  output: TOutput;
}): IpcContract<TChannel, TInput, TOutput> {
  return contract;
}
```

### Handler with Validation
**File**: `src/ipc/handlers/base.ts` (lines 17-57)

```typescript
export function createTypedHandler<TChannel, TInput, TOutput>(
  contract: IpcContract<TChannel, TInput, TOutput>,
  handler: (event: IpcMainInvokeEvent, input: z.infer<TInput>) => Promise<z.infer<TOutput>>,
): void {
  ipcMain.handle(contract.channel, async (event, rawInput: unknown) => {
    // Runtime validation of input
    const parsed = contract.input.safeParse(rawInput);
    if (!parsed.success) {
      const errorMessage = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new Error(`[${contract.channel}] Invalid input: ${errorMessage}`);
    }

    const result = await handler(event, parsed.data);

    // Dev-mode output validation (catches handler bugs)
    if (process.env.NODE_ENV === "development") {
      const outputParsed = contract.output.safeParse(result);
      if (!outputParsed.success) {
        console.error(`[${contract.channel}] Output validation warning: ...`);
      }
    }

    return result;
  });
}
```

**Schema Example**: `src/ipc/types/chat.ts` (lines 83-91)

```typescript
export const ChatStreamParamsSchema = z.object({
  chatId: z.number(),
  prompt: z.string(),
  redo: z.boolean().optional(),
  attachments: z.array(ChatAttachmentSchema).optional(),
  selectedComponents: z.array(ComponentSelectionSchema).optional(),
});
```

**Validates**: 
- All renderer → main IPC calls (input schemas)
- All main → renderer responses (output schemas, dev-only)
- Custom field types (e.g., enum unions, nested objects)

**Prevents**: Invalid state propagation, type mismatches, malformed data structures

---

## PATTERN 3: LOCK MECHANISMS
### Per-resource serialization for concurrent operations

**Rationale**: Prevents race conditions on shared app/chat resources  
**Pattern**: Promise-based queue with `Map<lockId, Promise<void>>`

### Lock Implementation
**File**: `src/ipc/utils/lock_utils.ts` (lines 1-50)

```typescript
const locks = new Map<number | string, Promise<void>>();

export async function withLock<T>(
  lockId: number | string,
  fn: () => Promise<T>,
): Promise<T> {
  // Wait for any existing operation to complete
  const existingLock = locks.get(lockId);
  if (existingLock) {
    await existingLock;
  }

  // Acquire a new lock
  const { release } = acquireLock(lockId);

  try {
    const result = await fn();
    return result;
  } finally {
    release();  // Always clean up
  }
}
```

**Usage in Handlers**: `src/ipc/handlers/app_handlers.ts`

```typescript
// Lock per appId to prevent concurrent modifications
export async function runApp({ appId }) {
  return withLock(appId, async () => {
    // Only one modification per app at a time
    await ipc.app.runApp({ appId });
  });
}
```

**Protects**: App state mutations, file modifications, process spawning

**Prevents**: Concurrent modifications to same app/chat, orphaned resources

---

## PATTERN 4: STALE CLOSURE AVOIDANCE
### Capture mutable references before async boundaries

**Rationale**: Variables captured at setTimeout/Promise boundaries may stale if dependencies change  
**Pattern**: Assign to local const before entering async scope

### Example 1: Plan Implementation
**File**: `src/hooks/usePlanImplementation.ts` (lines 59-73)

```typescript
useEffect(() => {
  if (!pendingPlan) return;

  // Capture value BEFORE the timeout to avoid stale closure
  const planToImplement = pendingPlan;
  let hasTriggeredRef = useRef(false);

  timeoutId = setTimeout(() => {
    // Use captured constant, not stale pendingPlan
    const prompt = `/implement-plan=${planToImplement.planSlug}`;
    const chatId = planToImplement.chatId;
    
    ipc.chatStream.start({ chatId, prompt }, {
      // ...
    });
  }, 100);

  return () => { if (timeoutId) clearTimeout(timeoutId); };
}, [pendingPlan, isStreamingById, ...deps]);
```

### Example 2: Stream Count Increment
**File**: `src/hooks/useStreamChat.ts` (lines 154-173)

```typescript
let hasIncrementedStreamCount = false;

ipc.chatStream.start({...}, {
  onChunk: ({ messages: updatedMessages }) => {
    // Only increment once per stream
    if (!hasIncrementedStreamCount) {
      setStreamCountById((prev) => {
        const next = new Map(prev);
        next.set(chatId, (prev.get(chatId) ?? 0) + 1);
        return next;
      });
      hasIncrementedStreamCount = true;  // Prevent double-increment
    }
    setMessagesById((prev) => {
      const next = new Map(prev);
      next.set(chatId, updatedMessages);
      return next;
    });
  },
});
```

**Guard Points**:
- Assign dependency values to `const` before entering callback
- Use ref or local let for flags to prevent duplicate work
- Never access outer function's mutable state from callback

**Prevents**: Stale variable references, double operations, race conditions with dependency updates

---

## PATTERN 5: MOUNTED/CANCELLED FLAGS
### Cleanup checks for orphaned async operations

**Rationale**: Components unmount during async operations, causing state update warnings  
**Pattern**: Track mounted state with useEffect cleanup

### Example 1: Design System Preview
**File**: `src/hooks/useDesignSystemPreview.ts` (lines 64-99)

```typescript
useEffect(() => {
  if (!designSystemId) {
    setPreviewUrl(null);
    setNonce(null);
    setComponents([]);
    setActiveComponentId(null);
    setError(null);
    setIsLoading(false);
    return;
  }

  let cancelled = false;  // Track if effect was cancelled
  setIsLoading(true);
  setError(null);
  setComponents([]);
  setActiveComponentId(null);

  ipc.designSystem
    .getPreviewUrl({ designSystemId })
    .then((result) => {
      if (cancelled) return;  // Skip if unmounted
      setPreviewUrl(result.url);
      setNonce(result.nonce);
    })
    .catch((err: unknown) => {
      if (cancelled) return;  // Skip if unmounted
      setError(err instanceof Error ? err : new Error("Failed..."));
      setIsLoading(false);
    });

  return () => {
    cancelled = true;  // Signal cleanup
  };
}, [designSystemId]);
```

### Example 2: Plan Implementation with Mounted Ref
**File**: `src/hooks/usePlanImplementation.ts` (lines 25-36)

```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;  // Mark as unmounted
  };
}, []);

useEffect(() => {
  // ... later in stream callbacks:
  onChunk: ({ messages: updatedMessages }) => {
    if (!isMountedRef.current) return;  // Skip if unmounted
    setMessagesById((prev) => {
      const next = new Map(prev);
      next.set(chatId, updatedMessages);
      return next;
    });
  },
}, [dependencies]);
```

**Prevents**: "Cannot update unmounted component" warnings, orphaned state updates

---

## PATTERN 6: TANSTACK QUERY STATE GUARDS
### Built-in async state management with validation

**Rationale**: Centralized query key factory + automatic caching prevents duplicate requests  
**Pattern**: Type-safe query key factory in `src/lib/queryKeys.ts`

### Query Key Factory
**File**: `src/lib/queryKeys.ts` (lines 1-40)

```typescript
export const queryKeys = {
  auth: {
    state: ["auth", "state"] as const,
  },
  apps: {
    all: ["apps"] as const,
    detail: ({ appId }: { appId: number | null }) =>
      ["apps", "detail", appId] as const,
    search: ({ query }: { query: string }) =>
      ["apps", "search", query] as const,
  },
  chats: {
    all: ["chats"] as const,
    list: ({ appId }: { appId: number | null }) => ["chats", appId] as const,
    search: ({ appId, query }: { appId: number | null; query: string }) =>
      ["chats", "search", appId, query] as const,
  },
  // ... more domains
};
```

### Usage with Validation
**File**: `src/hooks/useCheckProblems.ts` (lines 6-31)

```typescript
export function useCheckProblems(appId: number | null) {
  const { settings } = useSettings();
  const { data: problemReport, isLoading, error, refetch } = useQuery<ProblemReport, Error>({
    queryKey: queryKeys.problems.byApp({ appId }),
    queryFn: async (): Promise<ProblemReport> => {
      // Validate inputs before call
      if (!appId) {
        throw new Error("App ID is required");
      }
      return ipc.misc.checkProblems({ appId });
    },
    // Guard: only enable when safe
    enabled: !!appId && settings?.enableAutoFixProblems,
  });

  return { problemReport, isChecking: isLoading, error, checkProblems: refetch };
}
```

### Mutation with Invalidation
**File**: `src/hooks/useAuth.ts` (lines 15-24)

```typescript
const loginGoogleMutation = useMutation({
  mutationFn: () => ipc.auth.loginWithGoogle(),
  onSuccess: () => {
    // Invalidate all auth-related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
  },
  onError: (error: Error) => {
    showError(error);  // Centralized error toast
  },
});
```

**Guards**:
- `enabled: !!appId` → conditional query execution
- Query keys hierarchical → granular invalidation
- `onError` automatic error display
- `keepPreviousData` option prevents UI flicker

**Prevents**: Duplicate requests, stale data, missed invalidation

---

## PATTERN 7: REF-BASED DEBOUNCING & TIMING
### Cleanup timeouts to prevent stale work

**Rationale**: setTimeout callbacks can fire after unmount or with stale values  
**Pattern**: Store timeout ref, clear in cleanup function

### Example: HMR Debounce
**File**: `src/hooks/useRunApp.ts` (lines 63-69)

```typescript
const hmrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const onHotModuleReload = useCallback(() => {
  if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);  // Cancel previous
  hmrDebounceRef.current = setTimeout(() => {
    setPreviewPanelKey((prevKey) => prevKey + 1);
  }, 300);  // Debounce: only fire if no more HMR events for 300ms
}, [setPreviewPanelKey]);

useEffect(() => {
  return () => {
    if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
  };
}, []);
```

### Example: Copy to Clipboard Timeout
**File**: `src/hooks/useCopyToClipboard.ts` (lines 20-46)

```typescript
const [copied, setCopied] = useState(false);
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

const copyMessageContent = async (messageContent: string) => {
  try {
    await navigator.clipboard.writeText(formattedContent);
    setCopied(true);

    // Clear existing timeout if any
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new timeout and store reference
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    return true;
  } catch (error) {
    console.error("Failed to copy content:", error);
    return false;
  }
};
```

**Guards**:
- Check and clear before setting new timeout
- Always clear in useEffect cleanup
- Store ref value, not timeout ID directly in state

**Prevents**: Multiple timeouts firing, memory leaks, state updates after unmount

---

## PATTERN 8: JOTAI ATOM-BASED STATE WITH MAPS
### Per-entity state tracking in scalable maps

**Rationale**: Support many chats/apps without individual atoms  
**Pattern**: `Map<entityId, value>` atoms instead of nested atoms

### Atom Definitions
**File**: `src/atoms/chatAtoms.ts` (lines 1-25)

```typescript
// Per-chat atoms implemented with maps keyed by chatId
export const chatMessagesByIdAtom = atom<Map<number, Message[]>>(new Map());
export const chatErrorByIdAtom = atom<Map<number, string | null>>(new Map());
export const isStreamingByIdAtom = atom<Map<number, boolean>>(new Map());
export const chatStreamCountByIdAtom = atom<Map<number, number>>(new Map());
export const recentStreamChatIdsAtom = atom<Set<number>>(new Set<number>());
```

### Immutable Update Pattern
**File**: `src/hooks/useStreamChat.ts` (lines 114-130)

```typescript
// Always create new Map to maintain immutability
setMessagesById((prev) => {
  const next = new Map(prev);
  next.set(chatId, updatedMessages);
  return next;
});

// Multiple updates can be batched safely
setIsStreamingById((prev) => {
  const next = new Map(prev);
  next.set(chatId, true);
  return next;
});

setErrorById((prev) => {
  const next = new Map(prev);
  next.set(chatId, null);
  return next;
});
```

**Guards**:
- Create new Map on every update (immutability)
- Use `.set()` on copy, return copy
- Query via `.get(id) ?? defaultValue`

**Prevents**: Shared state mutations, missed updates, memory leaks

---

## PATTERN 9: STREAMING WITH ABORT CONTROLLERS
### Signal-based cancellation for long-running streams

**Rationale**: HTTP streams and AI responses need graceful cancellation  
**Pattern**: AbortController + activeStreams map

### Active Streams Tracking
**File**: `src/ipc/handlers/chat_stream_handlers.ts` (lines 60-66)

```typescript
// Track active streams for cancellation
const activeStreams = new Map<number, AbortController>();

// Track partial responses for cancelled streams
const partialResponses = new Map<number, string>();
```

### Stream Cancellation Interface
**File**: `src/ipc/types/chat.ts` (lines ~200+)

```typescript
// Contract for cancelling a stream
export const cancelStreamContract = defineContract({
  channel: "chat:cancel-stream",
  input: z.object({ chatId: z.number() }),
  output: z.object({ success: z.boolean() }),
});
```

### UI Cancellation Call
**File**: `src/components/chat/ChatInput.tsx`

```typescript
// User clicks cancel button
ipc.chat.cancelStream(chatId);
```

**Guards**:
- Store AbortController per stream
- Signal abort on user cancel
- Clean up streams on unmount
- Track partial responses for recovery

**Prevents**: Resource leaks, hung streams, unnecessary computation

---

## PATTERN 10: SETTINGS/ENTITLEMENT CHECKS
### Conditional query execution based on user state

**Rationale**: Don't fetch/process if user state doesn't support operation  
**Pattern**: TanStack Query `enabled` + settings guard

### Example: Free Quota
**File**: `src/hooks/useFreeAgentQuota.ts` (lines 19-40)

```typescript
export function useFreeAgentQuota() {
  const { settings } = useSettings();
  const isPro = settings ? isAnyonProEnabled(settings) : false;
  const isTestMode = settings?.isTestMode ?? false;

  const { data: quotaStatus, isLoading, error } = useQuery<FreeAgentQuotaStatus>({
    queryKey: queryKeys.freeAgentQuota.status,
    queryFn: () => ipc.freeAgentQuota.getFreeAgentQuotaStatus(),
    // Only fetch for non-Pro users
    enabled: !isPro && !!settings,
    // Refetch periodically to check for quota reset
    refetchInterval: THIRTY_MINUTES_IN_MS,
    // Consider stale after 30 seconds (500ms in test mode)
    staleTime: isTestMode ? TEST_STALE_TIME_MS : STALE_TIME_MS,
    // Don't retry on error (e.g., if there's an issue with the DB)
    retry: false,
  });

  return {
    quotaStatus,
    isLoading,
    error,
    isQuotaExceeded: quotaStatus?.isQuotaExceeded ?? false,
    // ... computed properties
  };
}
```

**Guards**:
- `enabled: !isPro && !!settings` → don't fetch if unnecessary
- `retry: false` → fail fast instead of hammering server
- `staleTime` → balance freshness vs. request volume
- `refetchInterval` → periodic update without continuous polling

**Prevents**: Unnecessary API calls, wasted credits, user frustration

---

## ANTI-PATTERNS OBSERVED (& AVOIDED)

### ❌ Promise-less async (don't do this):
```typescript
ipc.app.runApp({ appId });  // Fire and forget - can't track completion
```

### ✅ Always chain or await:
```typescript
await ipc.app.runApp({ appId });  // Track completion
ipc.app.runApp({ appId }).catch(error => console.error(error));  // At minimum, catch
```

---

### ❌ Accessing stale closure variables:
```typescript
useEffect(() => {
  const { chatId } = props;  // ← This can be stale!
  setTimeout(() => {
    streamMessage({ chatId });  // Using stale chatId
  }, 100);
}, []);
```

### ✅ Capture before async boundary:
```typescript
useEffect(() => {
  const capturedChatId = chatId;  // Capture current value
  setTimeout(() => {
    streamMessage({ chatId: capturedChatId });  // Use captured value
  }, 100);
}, [chatId]);
```

---

### ❌ Forgetting to clean up refs:
```typescript
const timerRef = useRef(null);
timerRef.current = setTimeout(() => { ... }, 100);
// No cleanup → memory leak
```

### ✅ Clean up in effect return:
```typescript
const timerRef = useRef(null);
useEffect(() => {
  timerRef.current = setTimeout(() => { ... }, 100);
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [deps]);
```

---

## SUMMARY TABLE

| Pattern | File(s) | Risk | Guard Mechanism |
|---------|---------|------|-----------------|
| **Module-level Set tracking** | `useStreamChat.ts` | Duplicate streams | `Set<chatId>` with has/add/delete |
| **Zod validation** | `base.ts`, `*_types.ts` | Invalid data | `.safeParse()` at IPC boundary |
| **Locking** | `lock_utils.ts`, app handlers | Concurrent mutations | `withLock(appId, fn)` per resource |
| **Stale closure** | `usePlanImplementation.ts`, `useStreamChat.ts` | Wrong variable | Capture to `const` before async |
| **Mounted/cancelled flags** | `useDesignSystemPreview.ts` | State update on unmount | `cancelled` flag + `if (cancelled) return` |
| **TanStack Query** | `useAuth.ts`, `useCheckProblems.ts` | Duplicate requests | Hierarchical query keys + `enabled` |
| **Ref-based timing** | `useRunApp.ts`, `useCopyToClipboard.ts` | Multiple timeouts | Store ref, clear before setting |
| **Map atoms** | `chatAtoms.ts`, `useStreamChat.ts` | Shared mutations | Immutable Map copy on update |
| **Abort controllers** | `chat_stream_handlers.ts` | Hung streams | `AbortController` per stream |
| **Settings checks** | `useFreeAgentQuota.ts` | Unnecessary calls | `enabled: condition` in useQuery |

---

## RECOMMENDATIONS FOR HARDENING

1. **Standardize on one guard pattern per operation type**:
   - Streams: Module-level Set + cleanup on end/error/catch
   - Queries: TanStack Query enabled + query key validation
   - Operations: `withLock(appId, fn)` for mutations

2. **Always validate at IPC boundaries**:
   - Use `createTypedHandler` for all handlers
   - Use Zod schemas for all input/output

3. **Capture variables before async boundaries**:
   - Add ESLint rule to warn on mutable closure access
   - Prefer `const` over accessing dependencies in callbacks

4. **Explicit cleanup in all useEffect hooks**:
   - Return cleanup function from any effect with async work
   - Always clear timeouts/intervals

5. **Use Maps for per-entity state**:
   - Prefer `Map<entityId, value>` over individual atoms
   - Maintain immutability: create new Map on every update

