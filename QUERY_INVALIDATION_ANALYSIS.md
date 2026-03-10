# Query Key Usage & Invalidation Pattern Analysis

**Date:** 2025-03-05  
**Scope:** Renderer React Query hooks and components  
**Total Files Analyzed:** 51  
**Total Query Operations:** 207 lines of useQuery/useMutation/invalidateQueries calls

---

## Executive Summary

This analysis maps **all query key usage patterns** and identifies **over-broad vs. precise invalidations** across the ANYON renderer. The goal is to find **low-risk performance wins** without introducing stale-data regressions.

### Key Findings:
- **5 hot-path invalidations** in streaming/mutation-heavy code
- **3 over-broad invalidations** that invalidate parent keys unnecessarily
- **2 repeated invalidation patterns** in critical paths (auth, MCP)
- **Multiple opportunities** for parent-key memoization and invalidation scoping

---

## 1. Query Key Factory Structure (`src/lib/queryKeys.ts`)

### Domains & Hierarchy:
```
auth.state
entitlement.{all, state, usage}
apps.{all, detail(appId), search(query)}
chats.{all, list(appId), search(appId, query)}
plans.{all, forChat(appId, chatId)}
proposals.{all, detail(chatId)}
versions.{all, list(appId)}
branches.{all, current(appId)}
uncommittedFiles.{all, byApp(appId)}
problems.{all, byApp(appId)}
contextPaths.{all, byApp(appId)}
tokenCount.{all, forChat(chatId, input)}
files.{search(appId, query)}
appName.{check(name)}
securityReview.{byApp(appId)}
appTheme.{all, byApp(appId)}
themes.{all, liked}
templates.{all}
languageModels.{providers, byProviders, forProvider}
userBudget.{info}
freeAgentQuota.{status}
vercel.{all, deployments(appId)}
appUpgrades.{byApp(appId), isCapacitor(appId)}
mcp.{all, servers, toolsByServer.{all, list(serverIds)}, consents}
supabase.{all, organizations, projects, branches(projectId, organizationSlug)}
designSystems.{all, previewUrl(designSystemId)}
tweakcnThemes.{all}
system.{all, nodeStatus()}
```

**Observation:** Well-structured hierarchy with `.all` parents and parameterized detail keys.

---

## 2. Invalidation Pattern Audit

### 2.1 OVER-BROAD INVALIDATIONS (Performance Risk)

#### **Pattern A: `tokenCount.all` invalidated on every input change**

**Location:** `src/components/chat/ChatInput.tsx` (line 17), `src/components/ModelPicker.tsx` (line 50)

```typescript
// OVER-BROAD: Invalidates ALL token counts when user enables/disables feature
queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
```

**Analysis:**
- Triggered on **simple UI toggles** (model changes, feature flags)
- Invalidates ALL token counts across all chats
- The query key structure uses `tokenCount.forChat({ chatId, input })` parameterized
- **Actual affected data:** Only the current chat's token count

**Risk Level:** ⚠️ **MEDIUM** - Not in streaming critical path, but frequent toggle operations

**Safer Alternative:**
```typescript
// PRECISE: Invalidate only the specific chat's token count
queryClient.invalidateQueries({ 
  queryKey: queryKeys.tokenCount.forChat({ chatId: currentChatId, input: "" })
});
```

---

#### **Pattern B: `chats.all` invalidated on any chat mutation**

**Location:** `src/hooks/useChats.ts` (line 19)

```typescript
// OVER-BROAD: Parent key invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
```

**Analysis:**
- Called from `invalidateChats()` in `useChats`
- Used by all chat mutations (delete, rename, etc.)
- Invalidates **both** app-specific and global chat lists
- Comment acknowledges the intent: "Invalidate all chat queries (any appId)"

**Risk Level:** ⚠️ **MEDIUM** - Affects multiple views, but necessary for correctness

**Current Pattern is Actually JUSTIFIED:**
```typescript
// This is CORRECT because mutations affect multiple views:
// 1. App-specific chat list (appId !== null)
// 2. Global chat list (appId === null) 
// TanStack Query wildcard matching ensures both are invalidated
queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
```

**No Change Needed** - Parent key invalidation is appropriate here.

---

#### **Pattern C: `auth.state` + `entitlement.all` repeated 4x**

**Location:** `src/hooks/useAuth.ts` (lines 18, 30, 42, 52, 63)

```typescript
// Pattern repeats in: loginGoogleMutation, loginEmailMutation, logoutMutation, refreshMutation
queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
```

**Analysis:**
- **4 separate mutations** each invalidate the same two queries
- Happens on: login (Google), login (email), signup, logout, refresh
- These are **NOT hot-path** but **boilerplate repetition**

**Risk Level:** ✅ **LOW** - Not a performance issue, code smell only

**Opportunity:** Extract into a helper function
```typescript
const invalidateAuthState = () => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state }),
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all }),
  ]);
};

// Usage in each mutation onSuccess:
onSuccess: () => invalidateAuthState(),
```

---

### 2.2 PRECISE INVALIDATIONS (Already Optimized)

#### **Pattern D: MCP mutation invalidations (Well-Scoped)**

**Location:** `src/hooks/useMcp.ts` (lines 66-69, 79-82, 92-95, 109)

```typescript
// PRECISE: Invalidates only affected queries
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.mcp.servers });
  await queryClient.invalidateQueries({ queryKey: queryKeys.mcp.toolsByServer.all });
},
```

**Analysis:**
- Uses parent keys `.servers` and `.toolsByServer.all` appropriately
- Avoids invalidating unrelated queries (consents, other domains)
- `refetchAll()` function properly coordinates multiple related queries
- Sets up watchers correctly with `enabled: serverIds.length > 0`

**Risk Level:** ✅ **LOW** - Pattern is correct

---

#### **Pattern E: App-specific invalidations (Parameterized Keys)**

**Location:** `src/hooks/useVersions.ts` (lines 72-88)

```typescript
// PRECISE: Scope invalidations to specific appId
await queryClient.invalidateQueries({
  queryKey: queryKeys.versions.list({ appId }),
});
await queryClient.invalidateQueries({
  queryKey: queryKeys.branches.current({ appId }),
});
```

**Analysis:**
- Only invalidates the current app's queries
- Doesn't affect other apps' version/branch data
- Cascading effect is intentional (version change → check problems)

**Risk Level:** ✅ **LOW** - Scoped correctly

---

### 2.3 CRITICAL PATH INVALIDATIONS (Streaming)

#### **Pattern F: useStreamChat invalidations (Multiple cascades)**

**Location:** `src/hooks/useStreamChat.ts` (lines 194-213, 229-236, 247-253)

```typescript
// ON STREAM END - 5+ invalidations in sequence
queryClient.invalidateQueries({
  queryKey: queryKeys.apps.detail({ appId: selectedAppId }),
});
queryClient.invalidateQueries({
  queryKey: queryKeys.apps.all,
});
queryClient.invalidateQueries({ queryKey: ["proposal", chatId] });
queryClient.invalidateQueries({
  queryKey: queryKeys.freeAgentQuota.status,
});
queryClient.invalidateQueries({
  queryKey: queryKeys.proposals.detail({ chatId }),
});
```

**Analysis:**
- Triggered **after every streaming response**
- Multiple invalidations without coordination
- `queryKeys.proposals.all` is missing—using hardcoded `["proposal", chatId]`

**Risk Level:** 🔴 **HIGH** - Happens frequently in chat flow

**Observation:** Line 229 uses hardcoded `["proposal", chatId]` instead of `queryKeys.proposals.detail({ chatId })`

**Issue:** Line 229 is redundant with line 236 (same key format issue)

**Suggested Optimization:**
```typescript
// Group related invalidations
const invalidatePostStreamQueries = async () => {
  // Only re-fetch data that actually changed
  await Promise.all([
    // App display name changed
    queryClient.invalidateQueries({
      queryKey: queryKeys.apps.detail({ appId: selectedAppId }),
    }),
    // Proposals/plan changed
    queryClient.invalidateQueries({
      queryKey: queryKeys.proposals.detail({ chatId }),
    }),
    // Quota changed (for free tier)
    queryClient.invalidateQueries({
      queryKey: queryKeys.freeAgentQuota.status,
    }),
  ]);
};

// Avoid invalidating apps.all unless necessary
// Only invalidate if the app name actually changed
```

---

#### **Pattern G: Hard-coded query key on line 229**

**Location:** `src/hooks/useStreamChat.ts` (line 229)

```typescript
queryClient.invalidateQueries({ queryKey: ["proposal", chatId] });
```

**Issue:** Uses hardcoded key instead of factory function

**Should Be:**
```typescript
queryClient.invalidateQueries({
  queryKey: queryKeys.proposals.detail({ chatId }),
});
```

**Risk Level:** ⚠️ **MEDIUM** - Maintainability risk, could diverge from factory

---

### 2.4 REPEATED HOT-PATH PATTERNS

#### **Pattern H: Token count invalidation (Two locations)**

**Locations:**
- `src/hooks/useCountTokens.ts` (line 50) - `invalidateTokenCount()` function
- `src/components/chat/ChatInput.tsx` (line 17)  
- `src/components/ModelPicker.tsx` (line 50)

```typescript
// Used when:
// 1. Model changes (ModelPicker)
// 2. Auto-expand feature toggles (ChatInput)
// 3. Streaming completes (useStreamChat calls invalidateTokenCount)

queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
```

**Analysis:**
- Token count depends on **model + input**
- Each change should only invalidate that model+input combo
- Current approach invalidates **all models + all chats**

**Risk Level:** ⚠️ **MEDIUM** - Happens frequently but low cost per invalidation

**Optimization Opportunity:**
```typescript
// Instead of invalidating ALL token counts:
const invalidateTokenCountForChat = (chatId: number) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.tokenCount.forChat({ chatId, input: "" }),
  });
};

// Call this when model changes (pass currentChatId)
invalidateTokenCountForChat(currentChatId);
```

---

## 3. Summary: Over-Broad vs. Precise Invalidations

### Over-Broad Invalidations (Optimization Candidates)

| Location | Pattern | Current | Risk | Suggestion |
|----------|---------|---------|------|-----------|
| `ChatInput.tsx:17` | Token count toggle | `tokenCount.all` | ⚠️ MEDIUM | `tokenCount.forChat({ chatId, input: "" })` |
| `ModelPicker.tsx:50` | Model change | `tokenCount.all` | ⚠️ MEDIUM | `tokenCount.forChat({ chatId, input: "" })` |
| `useStreamChat.ts:194-253` | Stream end cascade | 5+ invalidations | 🔴 HIGH | Coordinate + conditionally invalidate |
| `useStreamChat.ts:229` | Hardcoded proposal key | `["proposal", chatId]` | ⚠️ MEDIUM | Use `queryKeys.proposals.detail({ chatId })` |
| `useAuth.ts` (4 places) | Auth mutations | Repeated pattern | ✅ LOW | Extract helper function |

### Precise Invalidations (No Changes Needed)

| Location | Pattern | Risk | Status |
|----------|---------|------|--------|
| `useChats.ts:19` | Chat mutations | Parent key | ✅ JUSTIFIED |
| `useMcp.ts` (all) | MCP mutations | Scoped properly | ✅ OPTIMAL |
| `useVersions.ts` | Version mutations | Parameterized | ✅ OPTIMAL |
| `useCheckoutVersion.ts` | Checkout mutations | Parameterized | ✅ OPTIMAL |
| `useContextPaths.ts` | Path mutations | Parameterized | ✅ OPTIMAL |

---

## 4. Invalidation Hotness Map

### Highest Frequency Invalidations (Rendering/UX Impact)

1. **Token Count** (user types → model changes) - Multiple times per interaction
2. **Free Agent Quota** (after each chat message) - Once per message
3. **Proposals** (after each chat message) - Once per message
4. **Chat Messages** (atom-based, not query) - Per stream chunk
5. **App Details** (display name changes during chat) - Occasionally

---

## 5. Stale Data Regression Checklist

Before optimizing any invalidation, verify:

- [ ] Does the mutation produce new data for this query?
- [ ] Can users see the old data in the UI?
- [ ] Will multiple invalidations race and cause flickering?
- [ ] Is the query parameterized? If so, invalidate parameters only.
- [ ] Are there dependent queries that should also be invalidated?

---

## 6. Recommended Safe Optimizations

### Priority 1: Extract Auth Invalidation Helper (⚡ No Risk)
```typescript
// src/hooks/useAuth.ts
const invalidateAuthState = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.state }),
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all }),
  ]);

// Usage: onSuccess: () => invalidateAuthState(),
```

### Priority 2: Fix Hardcoded Query Key (⚡ No Risk)
```typescript
// src/hooks/useStreamChat.ts line 229
// Change from:
queryClient.invalidateQueries({ queryKey: ["proposal", chatId] });
// To:
queryClient.invalidateQueries({
  queryKey: queryKeys.proposals.detail({ chatId }),
});
```

### Priority 3: Scope Token Count to Chat (⚠️ Low Risk, Requires Testing)
```typescript
// src/hooks/useCountTokens.ts - Add scoped invalidation
const invalidateTokenCountForChat = (chatId: number | null) => {
  if (chatId === null) return;
  queryClient.invalidateQueries({
    queryKey: queryKeys.tokenCount.forChat({ chatId, input: "" }),
  });
};

// Update callers:
// - ModelPicker: pass currentChatId
// - ChatInput: pass currentChatId
// - useStreamChat: pass chatId from stream
```

### Priority 4: Coordinate Stream-End Invalidations (⚠️ Medium Risk, Requires Testing)
```typescript
// src/hooks/useStreamChat.ts - onEnd handler
// Instead of individual invalidations, conditionally invalidate:
if (response.appDisplayName && selectedAppId) {
  // Only invalidate app if name actually changed
  await queryClient.invalidateQueries({
    queryKey: queryKeys.apps.detail({ appId: selectedAppId }),
  });
}

// Always invalidate related to the proposal/response
await queryClient.invalidateQueries({
  queryKey: queryKeys.proposals.detail({ chatId }),
});

// Quota changes are server-side only
await queryClient.invalidateQueries({
  queryKey: queryKeys.freeAgentQuota.status,
});
```

---

## 7. Testing Strategy for Optimization

### Before Implementing Any Change:
1. Run `npm run build` to compile
2. Run `npm run e2e` with current code (baseline)
3. Note any timing or stale-data issues
4. Implement optimization
5. Run `npm run build` again
6. Run `npm run e2e` with optimized code
7. Compare: No new failures, same or faster response times

### Specific E2E Test Cases:
- **Chat streaming:** Verify messages arrive and proposals update
- **Model switching:** Token counts refresh correctly
- **Token display:** No flickering or delays
- **App rename:** Display name updates across UI

---

## 8. Files Requiring No Changes

These hooks follow the optimal pattern:
- `useChats.ts` - Parent key invalidation is correct
- `useMcp.ts` - Multiple mutations coordinated properly  
- `useVersions.ts` - Parameterized invalidation
- `useCheckoutVersion.ts` - Parameterized invalidation
- `useContextPaths.ts` - Parameterized invalidation
- `useAppTheme.ts` - Parameterized invalidation

---

## 9. Files Requiring Minor Changes

| File | Issue | Type | Effort |
|------|-------|------|--------|
| `useAuth.ts` | Repeated invalidation pattern | Refactor | 5 min |
| `useStreamChat.ts` | Hardcoded query key + cascade | Fix + Optimize | 15 min |
| `ChatInput.tsx` | Over-broad invalidation | Optimize | 10 min |
| `ModelPicker.tsx` | Over-broad invalidation | Optimize | 10 min |

---

## Appendix A: Complete Invalidation List

```
AUTH & ENTITLEMENT:
├─ queryKeys.auth.state (5 locations: useAuth.ts mutations)
├─ queryKeys.entitlement.all (3 locations: useAuth.ts, DeepLinkContext, useEntitlement)
└─ queryKeys.entitlement.all (DeepLinkContext)

APPS:
├─ queryKeys.apps.all (2 locations: useCreateApp, useStreamChat)
└─ queryKeys.apps.detail({ appId }) (1 location: useStreamChat)

CHATS:
├─ queryKeys.chats.all (1 location: useChats.invalidateChats)

VERSIONS & BRANCHES:
├─ queryKeys.versions.list({ appId }) (4 locations: useVersions, useCheckoutVersion, FileEditor, SecurityPanel, AppUpgrades)
├─ queryKeys.branches.current({ appId }) (3 locations: useVersions, useCheckoutVersion, useRenameBranch)

PROPOSALS:
├─ queryKeys.proposals.detail({ chatId }) (1 location: useStreamChat)
├─ ["proposal", chatId] (HARDCODED at useStreamChat:229)

PROBLEMS:
├─ queryKeys.problems.byApp({ appId }) (1 location: useVersions)

CONTEXT PATHS:
├─ queryKeys.contextPaths.byApp({ appId }) (1 location: useContextPaths)

TOKEN COUNT:
├─ queryKeys.tokenCount.all (3 locations: ChatInput, ModelPicker, useCountTokens)

THEMES:
├─ queryKeys.themes.liked (1 location: useLikedThemes)

SUPABASE:
├─ queryKeys.supabase.organizations (1 location: useSupabase)
├─ queryKeys.supabase.projects (1 location: useSupabase)

VERCEL:
├─ queryKeys.vercel.deployments({ appId }) (1 location: useDirectDeploy)

APP UPGRADES:
├─ queryKeys.appUpgrades.byApp({ appId }) (1 location: AppUpgrades)
├─ queryKeys.appUpgrades.isCapacitor({ appId }) (1 location: AppUpgrades)

MCP:
├─ queryKeys.mcp.servers (4 locations: useMcp mutations + refetchAll)
├─ queryKeys.mcp.toolsByServer.all (4 locations: useMcp mutations + refetchAll)
├─ queryKeys.mcp.consents (2 locations: useMcp + refetchAll)

FREE AGENT QUOTA:
├─ queryKeys.freeAgentQuota.status (2 locations: useStreamChat, useFreeAgentQuota)

USER BUDGET:
├─ (None - read-only, uses refetch function)

APP THEME:
├─ queryKeys.appTheme.byApp({ appId }) (2 locations: AuxiliaryActionsMenu, useAppTheme)

UNCOMMITTED FILES:
├─ queryKeys.uncommittedFiles.byApp({ appId }) (1 location: useCommitChanges)
```

---

## Appendix B: Query Key Hierarchy Reference

Use this when planning invalidations:

```
Level 0: queryKeys.*.all (universal parent)
  ↓
Level 1: queryKeys.*.<type>.all (domain parent)
  ↓
Level 2: queryKeys.*.<type>.specific({ param }) (parameterized child)
```

**Rule:** Invalidate the lowest level that matches the change scope.

---

## Conclusion

**Key Takeaways:**
1. ✅ Overall pattern is **well-architected** with good hierarchy
2. ⚠️ **3-4 over-broad invalidations** in non-critical paths (low risk optimization)
3. 🔴 **Stream-end cascade** worth coordinating for better UX
4. ⚡ **4 quick wins:** Helper functions, hardcoded key fix, token count scoping, cascade coordination
5. 📊 **No major stale-data risks** detected

**Performance Impact if All Optimizations Implemented:**
- Fewer refetches during streaming (5+ → 2-3 per message)
- Token count queries only for active chat (not all chats)
- Cleaner dependency tracking for future maintenance

