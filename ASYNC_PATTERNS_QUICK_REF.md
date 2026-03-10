# ASYNC PATTERNS - QUICK REFERENCE GUIDE
## Copy/paste templates for race-condition hardening

---

## 🚀 PATTERN 1: Prevent Duplicate Concurrent Streams

**When**: Multiple async operations on same entity (chat, app) can be triggered concurrently  
**Risk**: Double-submission, duplicate state updates, wasted resources

### Template
```typescript
// At module scope
const pendingOperations = new Set<string | number>();

// In handler/hook
const doAsyncWork = useCallback(async ({ id, ...params }) => {
  // Check if already in progress
  if (pendingOperations.has(id)) {
    console.warn(`Operation already in progress for ${id}`);
    onSettled?.();
    return;
  }

  // Mark as pending
  pendingOperations.add(id);

  try {
    await someAsyncCall({...params}, {
      onSuccess: () => {
        pendingOperations.delete(id);  // ← Clean up
        // handle success
      },
      onError: () => {
        pendingOperations.delete(id);  // ← Clean up
        // handle error
      },
    });
  } catch (error) {
    pendingOperations.delete(id);  // ← Clean up
    // handle exception
  }
}, []);
```

**Files**: `src/hooks/useStreamChat.ts`

---

## 🔐 PATTERN 2: Validate at IPC Boundary

**When**: Passing data between renderer and main process  
**Risk**: Type mismatches, malformed data, crashes in handlers

### Template
```typescript
// In src/ipc/types/myfeature.ts
import { z } from "zod";
import { defineContract } from "../contracts/core";

export const myFeatureSchema = z.object({
  userId: z.number(),
  action: z.enum(["create", "update", "delete"]),
  data: z.record(z.string()),
});

export const myFeatureContract = defineContract({
  channel: "myfeature:do-action",
  input: myFeatureSchema,
  output: z.object({ success: z.boolean(), id: z.number() }),
});

// In src/ipc/handlers/myfeature_handlers.ts
import { createTypedHandler } from "./base";

createTypedHandler(myFeatureContract, async (_event, params) => {
  // params is typed and validated ✓
  return { success: true, id: 123 };
});

// In renderer hook
const { data, error } = useQuery({
  queryKey: queryKeys.myFeature.all,
  queryFn: async () => {
    // Call is type-safe and validated ✓
    return ipc.myFeature.doAction({ userId: 1, action: "create", data: {} });
  },
});
```

**Files**: `src/ipc/handlers/base.ts`, `src/ipc/types/*.ts`

---

## 🔒 PATTERN 3: Serialize Operations on Shared Resources

**When**: Multiple handlers might mutate the same app/chat concurrently  
**Risk**: Race conditions, orphaned state, file corruption

### Template
```typescript
// In src/ipc/utils/lock_utils.ts (already exists)
import { withLock } from "@/ipc/utils/lock_utils";

// In handler
createTypedHandler(myContract, async (_event, params) => {
  // Serialize all mutations for this app
  return withLock(params.appId, async () => {
    // Only one operation at a time per appId
    const app = await db.query.apps.where({ id: params.appId });
    app.status = "processing";
    await db.update(apps).set(app);
    
    // Do expensive work...
    
    app.status = "done";
    await db.update(apps).set(app);
    return app;
  });
});
```

**Files**: `src/ipc/utils/lock_utils.ts`, `src/ipc/handlers/app_handlers.ts`

---

## 🎯 PATTERN 4: Capture Variables Before Async Boundaries

**When**: Passing mutable dependency values into setTimeout/Promise callbacks  
**Risk**: Stale closure bug, using wrong value, race with dependency updates

### ❌ DON'T DO THIS:
```typescript
useEffect(() => {
  setTimeout(() => {
    // ← This chatId might have changed before timeout fires!
    sendMessage({ chatId });
  }, 100);
}, [chatId]); // Missing from dependency array? Stale reference!
```

### ✅ DO THIS:
```typescript
useEffect(() => {
  const capturedChatId = chatId;  // ← Capture current value
  
  setTimeout(() => {
    // Use captured value, not dependency
    sendMessage({ chatId: capturedChatId });
  }, 100);
}, [chatId]); // Now correct
```

**Files**: `src/hooks/usePlanImplementation.ts`, `src/hooks/useStreamChat.ts`

---

## 🛑 PATTERN 5: Skip State Updates After Unmount

**When**: Component unmounts while async operation is pending  
**Risk**: "Cannot update unmounted component" warning, orphaned state updates

### Template
```typescript
// Option A: Boolean flag
useEffect(() => {
  let cancelled = false;
  
  ipc.getData()
    .then((data) => {
      if (cancelled) return;  // Skip if unmounted
      setState(data);
    })
    .catch((err) => {
      if (cancelled) return;  // Skip if unmounted
      setError(err);
    });
  
  return () => {
    cancelled = true;  // Signal unmount
  };
}, []);

// Option B: Ref for longer lifecycles
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

const onChunk = (data) => {
  if (!isMountedRef.current) return;  // Skip if unmounted
  setState(data);
};
```

**Files**: `src/hooks/useDesignSystemPreview.ts`, `src/hooks/usePlanImplementation.ts`

---

## 📊 PATTERN 6: Use TanStack Query for Deduplication & Caching

**When**: Fetching data that might be requested multiple times  
**Risk**: Duplicate requests, stale data, cache invalidation bugs

### Template
```typescript
// Step 1: Add query key in src/lib/queryKeys.ts
export const queryKeys = {
  myFeature: {
    all: ["myFeature"] as const,
    detail: ({ id }: { id: number }) => ["myFeature", "detail", id] as const,
  },
};

// Step 2: Create hook
export function useMyFeature(id: number | null) {
  const queryClient = useQueryClient();

  // Read
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.myFeature.detail({ id }),
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      return ipc.myFeature.getDetail({ id });
    },
    enabled: id !== null,  // ← Guard: don't fetch if no ID
  });

  // Write
  const updateMutation = useMutation({
    mutationFn: (updates: any) => ipc.myFeature.update({ id, ...updates }),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.myFeature.detail({ id }),
        data,
      );
      // Or invalidate entire feature:
      queryClient.invalidateQueries({
        queryKey: queryKeys.myFeature.all,
      });
    },
    onError: (error: Error) => showError(error),
  });

  return {
    data,
    isLoading,
    error,
    update: (updates) => updateMutation.mutateAsync(updates),
    isUpdating: updateMutation.isPending,
  };
}
```

**Files**: `src/lib/queryKeys.ts`, `src/hooks/useAuth.ts`, `src/hooks/useCheckProblems.ts`

---

## ⏱️ PATTERN 7: Clean Up Timeouts & Intervals

**When**: Using setTimeout/setInterval in hooks  
**Risk**: Multiple timeouts firing, memory leaks, state updates after unmount

### Template
```typescript
export function useDebounced(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cancel previous timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebounced(value);
      timeoutRef.current = null;
    }, ms);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, ms]);

  return debounced;
}
```

**Files**: `src/hooks/useRunApp.ts`, `src/hooks/useCopyToClipboard.ts`, `src/hooks/useCountTokens.ts`

---

## 🗺️ PATTERN 8: Use Maps for Per-Entity State

**When**: Managing state for many entities (chats, apps)  
**Risk**: Creating too many atoms, shared mutations, memory leaks

### Template
```typescript
// In src/atoms/myfeature.ts
export const dataByIdAtom = atom<Map<number, MyData>>(new Map());
export const errorByIdAtom = atom<Map<number, string | null>>(new Map());

// In hook - ALWAYS create new Map on update
const updateData = useCallback((id: number, data: MyData) => {
  setDataById((prev) => {
    const next = new Map(prev);  // ← Create copy
    next.set(id, data);
    return next;  // ← Return new reference for Jotai
  });
}, [setDataById]);

// In component - use .get() with default
const data = dataById.get(chatId) ?? null;
const error = errorById.get(chatId) ?? null;
```

**Files**: `src/atoms/chatAtoms.ts`, `src/atoms/appAtoms.ts`

---

## 🎬 PATTERN 9: Cancel Long-Running Streams

**When**: User cancels streaming operation (AI chat, upload)  
**Risk**: Wasted computation, hung resources, abandoned Promise chains

### Template
```typescript
// In main process handler
const activeStreams = new Map<string, AbortController>();

ipcMain.handle("stream:start", async (event, { id }) => {
  const controller = new AbortController();
  activeStreams.set(id, controller);

  try {
    // Pass signal to streaming library
    await streamingLibrary.stream({...}, { signal: controller.signal });
  } finally {
    activeStreams.delete(id);  // Cleanup
  }
});

ipcMain.handle("stream:cancel", async (event, { id }) => {
  const controller = activeStreams.get(id);
  if (controller) {
    controller.abort();
    activeStreams.delete(id);
  }
});

// In renderer
// User clicks "Cancel" button
ipc.stream.cancel({ id: chatId });
```

**Files**: `src/ipc/handlers/chat_stream_handlers.ts`

---

## 🔍 PATTERN 10: Guard Queries Behind Conditional Checks

**When**: Only some users should fetch certain data (Pro users, trial status)  
**Risk**: Wasted API calls, user frustration, quota overages

### Template
```typescript
export function useFreeQuota() {
  const { settings } = useSettings();
  const isPro = settings ? isAnyonProEnabled(settings) : false;

  const { data: quota } = useQuery({
    queryKey: queryKeys.quota.free,
    queryFn: () => ipc.quota.getFree(),
    enabled: !isPro && !!settings,  // ← Only fetch if needed
    staleTime: 5 * 60 * 1000,       // ← 5 min cache
    retry: false,                   // ← Fail fast
    refetchInterval: 30 * 60 * 1000, // ← Refresh every 30 min
  });

  return {
    quota,
    isQuotaExceeded: quota?.used >= quota?.limit,
  };
}
```

**Files**: `src/hooks/useFreeAgentQuota.ts`, `src/hooks/useCheckProblems.ts`

---

## 📋 CHECKLIST: Is Your Async Code Race-Safe?

- [ ] **Duplicate Prevention**: Use Set/Map to track in-flight operations
- [ ] **Input Validation**: All IPC calls validated with Zod at boundary
- [ ] **Serialization**: Shared resource mutations locked with `withLock()`
- [ ] **Closure Safety**: Variables captured before async boundaries
- [ ] **Unmount Safety**: Effect cleanup prevents state updates after unmount
- [ ] **Query Dedup**: TanStack Query handles caching & dedup
- [ ] **Timeout Cleanup**: All timeouts/intervals cleared in effect cleanup
- [ ] **State Immutability**: Map/atom updates create new references
- [ ] **Cancellation**: Long streams support cancellation signal
- [ ] **Conditional Fetch**: Queries only enabled when safe

---

## 🆘 DEBUGGING RACE CONDITIONS

### Symptom: "Cannot update unmounted component"
→ **Pattern 5**: Add `cancelled` flag or `isMountedRef`

### Symptom: Duplicate requests to same endpoint
→ **Pattern 6**: Add query key to `queryKeys.ts` and use TanStack Query

### Symptom: Stale variable in callback
→ **Pattern 4**: Capture variable before setTimeout/Promise

### Symptom: Multiple async operations corrupting same app state
→ **Pattern 3**: Wrap mutations in `withLock(appId, fn)`

### Symptom: User spam-clicks button, creates 10 streams
→ **Pattern 1**: Add Set<operationId> to prevent duplicates

