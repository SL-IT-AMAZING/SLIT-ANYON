# Query Invalidation Hotspots - Detailed Deep Dive

**Purpose:** Identify where query invalidations happen most frequently and with highest impact.

---

## 🔴 CRITICAL HOTSPOT #1: useStreamChat onEnd Handler

**File:** `src/hooks/useStreamChat.ts:181-260`  
**Frequency:** Once per message (40-50+ times in typical session)  
**Impact:** Every chat interaction  

### Current Code
```typescript
onEnd: (response: ChatResponseEnd) => {
  // ... state updates ...
  
  // Line 194-197: Invalidate app detail (may have changed display name)
  if (response.appDisplayName && selectedAppId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.apps.detail({ appId: selectedAppId }),
    });
    
    // Line 200: OVER-BROAD - Also invalidates all apps
    queryClient.invalidateQueries({
      queryKey: queryKeys.apps.all,
    });
  }
  
  // Line 229: HARDCODED - Should use queryKeys.proposals.detail
  queryClient.invalidateQueries({ queryKey: ["proposal", chatId] });
  
  // Line 232-236: Invalidate real proposal detail query
  queryClient.invalidateQueries({
    queryKey: queryKeys.proposals.detail({ chatId }),
  });
  
  // Line 239-242: Invalidate quota (always - user consumed tokens)
  queryClient.invalidateQueries({
    queryKey: queryKeys.freeAgentQuota.status,
  });
},
```

### Issues
1. **apps.all invalidation is over-broad** - Only one app's name changed, why invalidate all?
2. **Hardcoded key on line 229** - Duplicates line 236, uses magic string instead of factory
3. **No coordination** - 5 separate invalidateQueries, not parallel
4. **No error path** - onError handler also invalidates but differently (see below)

### Error Handler (lines 247-253)
```typescript
onError: () => {
  // Remove from pending set
  pendingStreamChatIds.delete(chatId);
  
  // Line 248: Only invalidate quota (server may have refunded)
  queryClient.invalidateQueries({
    queryKey: queryKeys.freeAgentQuota.status,
  });
},
```

### Asymmetry Problem
- **onSuccess:** Invalidates 5 queries (apps, proposals, quota)
- **onError:** Invalidates 1 query (quota only)
- **Impact:** After error, users don't see stale proposals or app info

### Recommended Fix
```typescript
// Extract into helper function
const invalidatePostStreamData = async (
  success: boolean,
  response?: ChatResponseEnd
) => {
  const promises = [];
  
  if (success && response) {
    // Always invalidate proposal (definitely changed)
    promises.push(
      queryClient.invalidateQueries({
        queryKey: queryKeys.proposals.detail({ chatId }),
      })
    );
    
    // Conditionally invalidate app (only if name changed)
    if (response.appDisplayName && selectedAppId) {
      promises.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.apps.detail({ appId: selectedAppId }),
        })
      );
    }
  }
  
  // Always invalidate quota (success or error)
  promises.push(
    queryClient.invalidateQueries({
      queryKey: queryKeys.freeAgentQuota.status,
    })
  );
  
  return Promise.all(promises);
};

// Usage
onEnd: (response) => {
  // ... state updates ...
  invalidatePostStreamData(true, response);
},
onError: () => {
  invalidatePostStreamData(false);
},
```

**Changes:** 
- Remove `apps.all` invalidation (unnecessary)
- Remove hardcoded `["proposal", chatId]` (use factory)
- Coordinate with `Promise.all()`
- Handle error case correctly

**Risk:** ⚠️ **MEDIUM** - Requires E2E testing for regression

---

## ⚠️ HOTSPOT #2: Token Count Invalidations

**Files:** `src/hooks/useCountTokens.ts`, `src/components/ChatInput.tsx`, `src/components/ModelPicker.tsx`  
**Frequency:** Multiple per interaction (every model selection, every toggle)  
**Impact:** Chat input area UX

### Location A: useCountTokens.ts:49-51
```typescript
const invalidateTokenCount = useCallback(() => {
  // OVER-BROAD: Invalidates ALL token counts across all chats
  queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
}, [queryClient]);

export function useCountTokens(chatId: number | null, input: string = "") {
  // ...
  return {
    result,
    loading,
    error,
    refetch,
    invalidateTokenCount, // ← Exported for callers to use
  };
}
```

### Location B: ChatInput.tsx:17
```typescript
setAutoExpand((prev) => {
  const next = !prev;
  if (next) {
    // When enabling auto-expand, invalidate token count
    queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
  }
  return next;
});
```

### Location C: ModelPicker.tsx:50
```typescript
onSuccess: (_, { modelId }) => {
  // After selecting model, invalidate token count
  queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
  setOpen(false);
  setSearch("");
},
```

### Why It's Over-Broad
```
Current behavior:
  User types in chat A → Invalidate ALL token counts
  User switches models → Invalidate ALL token counts
  User switches to chat B → Still has old chat A's token count? 
                           (no - because userEffect re-runs with new chatId)
  
Better behavior:
  User types in chat A → Invalidate token count for chat A only
  User switches models → Invalidate token count for current chat only
  User switches to chat B → Only chat B's token count is relevant
```

### The Query Key Structure
```typescript
// From queryKeys.ts
tokenCount: {
  all: ["tokenCount"] as const,
  forChat: ({ chatId, input }: { chatId: number | null; input: string }) =>
    ["tokenCount", chatId, input] as const,
}
```

**Observation:** Factory already supports parameterized keys! Using `.all` is choice, not necessity.

### Recommended Fix

#### Step 1: Export scoped invalidation from useCountTokens
```typescript
// src/hooks/useCountTokens.ts

export const createInvalidateTokenCountForChat = (queryClient: QueryClient) => {
  return (chatId: number | null) => {
    if (chatId === null) return;
    queryClient.invalidateQueries({
      queryKey: queryKeys.tokenCount.forChat({ chatId, input: "" })
    });
  };
};

export function useCountTokens(chatId: number | null, input: string = "") {
  const queryClient = useQueryClient();
  
  // ... existing code ...
  
  const invalidateTokenCountForCurrentChat = useCallback(() => {
    createInvalidateTokenCountForChat(queryClient)(chatId);
  }, [queryClient, chatId]);
  
  return {
    result,
    loading,
    error,
    refetch,
    invalidateTokenCountForCurrentChat, // ← Renamed for clarity
    invalidateTokenCount: invalidateTokenCountForCurrentChat, // ← Backwards compat
  };
}
```

#### Step 2: Update ChatInput.tsx
```typescript
// Get current chat ID
const chatId = /* derive from context/route */;
const { invalidateTokenCountForCurrentChat } = useCountTokens(chatId, "");

setAutoExpand((prev) => {
  const next = !prev;
  if (next) {
    invalidateTokenCountForCurrentChat();
  }
  return next;
});
```

#### Step 3: Update ModelPicker.tsx
```typescript
// Get current chat ID
const chatId = /* derive from context/route */;
const queryClient = useQueryClient();
const invalidateTokenCountForChat = createInvalidateTokenCountForChat(queryClient);

// In mutation onSuccess:
onSuccess: (_, { modelId }) => {
  invalidateTokenCountForChat(chatId);
  setOpen(false);
  setSearch("");
},
```

**Changes:**
- Export scoped invalidation helper
- Update 3 call sites to use scoped version
- Keep backward-compat export

**Risk:** ✅ **LOW** - Refactoring with clear intent

---

## 🟡 HOTSPOT #3: Auth State Invalidations

**File:** `src/hooks/useAuth.ts:15-68`  
**Frequency:** Once per login/logout, rarely during session  
**Impact:** Global auth state

### Current Code
```typescript
const loginGoogleMutation = useMutation({
  mutationFn: () => ipc.auth.loginWithGoogle(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
  },
  onError: (error: Error) => {
    showError(error);
  },
});

const loginEmailMutation = useMutation({
  mutationFn: (params: { email: string; password: string }) =>
    ipc.auth.loginWithEmail(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
  },
  // ... (duplicate pattern for signup, logout, refresh)
});
```

### Issues
1. **Boilerplate repetition** - Same two invalidations in 4 mutations
2. **Maintenance burden** - Change one → need to update 4 locations
3. **Inconsistency risk** - Developer might forget to update one

### Current Pattern Count
```
loginGoogleMutation:   auth.state + entitlement.all
loginEmailMutation:    auth.state + entitlement.all
signUpEmailMutation:   auth.state (missing entitlement?)
logoutMutation:        auth.state + entitlement.all
refreshMutation:       auth.state (missing entitlement?)
```

**Observation:** Not even consistent! Some have entitlement, some don't.

### Recommended Fix

```typescript
// Add helper at top of file
const invalidateAuthState = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state }),
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all }),
  ]);

// Simplify mutations
const loginGoogleMutation = useMutation({
  mutationFn: () => ipc.auth.loginWithGoogle(),
  onSuccess: () => invalidateAuthState(),
  onError: (error: Error) => {
    showError(error);
  },
});

const loginEmailMutation = useMutation({
  mutationFn: (params: { email: string; password: string }) =>
    ipc.auth.loginWithEmail(params),
  onSuccess: () => invalidateAuthState(),
  onError: (error: Error) => {
    showError(error);
  },
});

// ... etc for all 4 mutations
```

**Changes:**
- Add 1 helper function (5 lines)
- Remove duplicate code (10+ lines)
- Fix inconsistency (all now have both invalidations)

**Risk:** ✅ **NONE** - Pure refactoring

---

## 🟡 HOTSPOT #4: useStreamChat Token Count Invalidation

**File:** `src/hooks/useStreamChat.ts:76, 252`  
**Frequency:** Once per message  
**Impact:** Token count display refresh

### Current Code
```typescript
// Line 76: Get token count hook
const { invalidateTokenCount } = useCountTokens(chatId ?? null, "");

// Line 252: Called after message streams
if (response.tokensUsed) {
  invalidateTokenCount(); // ← Calls tokenCount.all invalidation
}
```

### Problem
```
useStreamChat calls invalidateTokenCount() 
  → which calls queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all })
  → which invalidates ALL token counts across ALL chats
  
But we could pass the chatId to invalidate only current chat's token count!
```

### Recommended Fix
When fixing hotspot #2 (Token Count), also update this call:

```typescript
// Use the new scoped version
const { invalidateTokenCountForCurrentChat } = useCountTokens(chatId ?? null, "");

// In onEnd:
if (response.tokensUsed) {
  invalidateTokenCountForCurrentChat();
}
```

**Changes:** 1 line change (after hotspot #2 refactor)

**Risk:** ✅ **LOW** - Flows from hotspot #2 refactor

---

## 📊 Invalidation Frequency Matrix

```
Invalidation Key           | Frequency Per Session | Hot Path?
───────────────────────────┼──────────────────────┼──────────
tokenCount.all             | 100+ (per chat)       | 🔥 YES
proposals.detail            | 40+ (per message)     | 🔥 YES
freeAgentQuota.status       | 40+ (per message)     | 🔥 YES
apps.detail                 | 5-10 (per session)    | 🟠 MAYBE
auth.state                  | 1-3 (per session)     | ⚪ NO
entitlement.all             | 1-3 (per session)     | ⚪ NO
versions.list               | 2-5 (per session)     | ⚪ NO
appUpgrades.byApp           | 1-3 (per session)     | ⚪ NO
mcp.servers                 | < 1 (per session)     | ⚪ NO
```

---

## 🎯 Priority Matrix

```
Impact  | Frequency | Fix Time | Priority
────────┼───────────┼──────────┼──────────
HIGH    | HIGH      | SHORT    | P0 ⚡ DO FIRST
HIGH    | LOW       | SHORT    | P1 ✅ DO SECOND
LOW     | HIGH      | SHORT    | P2 📈 OPTIONAL
LOW     | LOW       | ANY      | P3 🚀 DEFER
```

### Our Hotspots Mapped
```
Hotspot #1 (Stream-end)    → P0 (High impact, high frequency, short fix)
Hotspot #2 (Token count)   → P0 (High impact, high frequency, short fix)
Hotspot #3 (Auth)          → P2 (Low impact, low frequency, short fix)
Hotspot #4 (useStreamChat) → Dependency of P0

Recommendation: Fix #1, #2, #4 together (related)
               Then fix #3 (code cleanup)
```

---

## 🚨 Error Paths Worth Checking

### useStreamChat Error Path
```typescript
onError: () => {
  pendingStreamChatIds.delete(chatId);
  // ASYMMETRIC: Only invalidates quota, not proposals
  queryClient.invalidateQueries({
    queryKey: queryKeys.freeAgentQuota.status,
  });
},
```

**Issue:** After error, proposals might be stale
**Fix:** Align with onEnd, also invalidate proposals

### Auth Error Path
```typescript
onError: (error: Error) => {
  showError(error);
  // No invalidation - assumes IPC already handles state
},
```

**Status:** ✅ OK - Auth errors are typically network-level

---

## 💡 Lessons & Patterns

### Pattern 1: Parameterized Keys > Parent Keys
```
❌ queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all })
✅ queryClient.invalidateQueries({ 
     queryKey: queryKeys.tokenCount.forChat({ chatId, input: "" }) 
   })
```

### Pattern 2: Promise.all > Sequential Await
```
❌ await queryClient.invalidateQueries(...);
   await queryClient.invalidateQueries(...);
   
✅ await Promise.all([
     queryClient.invalidateQueries(...),
     queryClient.invalidateQueries(...),
   ]);
```

### Pattern 3: Extract Repeated Patterns
```
❌ onSuccess: () => {
     queryClient.invalidateQueries({ ... });
     queryClient.invalidateQueries({ ... });
   },
   
✅ const invalidateX = () => Promise.all([...]);
   onSuccess: () => invalidateX(),
```

### Pattern 4: Comment Why, Not What
```
❌ // Invalidate entitlement
   queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
   
✅ // User permissions changed, need fresh entitlement data
   queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
```

