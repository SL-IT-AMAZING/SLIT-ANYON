# Stale Async Write Risks Detection - Complete Analysis

This directory contains exhaustive documentation of stale async write vulnerabilities detected in the renderer state update layer.

## Quick Links

### For Implementers
- **Start here:** [`STALE_ASYNC_FIXES_CHECKLIST.md`](./STALE_ASYNC_FIXES_CHECKLIST.md)
  - Priority-ordered action items [C1, H1, H2, M1-M5, L1]
  - Effort estimates and implementation order
  - Testing checklist for validation

### For Reviewers / Architects
- **Full Analysis:** [`STALE_ASYNC_RISKS.md`](./STALE_ASYNC_RISKS.md)
  - Complete technical details for all 10 findings
  - Race condition scenarios with step-by-step examples
  - General mitigation patterns (3 reusable approaches)
  - Testing recommendations

## Summary

**Total Vulnerabilities Detected:** 10  
**Risk Levels:** 1 CRITICAL | 2 HIGH | 5 MEDIUM | 1 MEDIUM-LOW | 1 LOW  
**Files Affected:** 8 files (hooks, components, contexts)  
**Total Estimated Fix Time:** ~2 hours

### What Was Analyzed

Exhaustively searched `src/components/`, `src/hooks/`, and `src/contexts/` for:
- ✅ Async handlers with closure-captured parameters
- ✅ Stream callbacks (onChunk, onEnd, onError)
- ✅ useEffect hooks with async operations
- ✅ useCallback with deferred execution
- ✅ setTimeout/setInterval patterns
- ✅ Event subscriptions with parameter changes
- ✅ Debounced state updates
- ✅ Polling queries with parameter transitions

### Key Vulnerability Pattern

```
ASYNC OPERATION STARTS (param = chatId)
         ↓
    PARAMETER CHANGES (chatId = different value)
         ↓
    RESPONSE ARRIVES (from old chatId)
         ↓
    STATE UPDATE USES NEW chatId AS KEY
         ↓
    WRONG ENTITY'S STATE UPDATED WITH OLD DATA ❌
```

## Critical Finding (Must Fix)

**[C1] useStreamChat.ts - Streaming Response Race**
- Location: `src/hooks/useStreamChat.ts:156-179, 181-293`
- Problem: Chat stream callbacks don't validate chatId hasn't changed
- Impact: Users see wrong chat messages after rapid switching
- Fix Time: 15 minutes
- Pattern: Capture chatId at stream start, validate in all callbacks

## Implementation Roadmap

### Week 1
- [C1] useStreamChat.ts (critical chat feature)
- [H1] useLoadAppFile.ts (editor data integrity)
- [H2] usePlanImplementation.ts (agent feature)

### Week 2
- [M1] useDirectDeploy.ts
- [M2] ChatPanel.tsx
- [M3] useRunApp.ts
- [M4] useMcp.ts
- [M5] useCountTokens.ts

### Ongoing
- [L1] useUncommittedFiles.ts (monitor only)

## Reusable Mitigation Patterns

### Pattern 1: Capture at Call Time
Best for: Simple async calls with parameter-dependent keys
```typescript
const handler = useCallback(async (param) => {
  const captured = param;
  const result = await ipc.call(captured);
  if (captured === param) setState(result); // Validate
}, [param]);
```

### Pattern 2: Mounted Flag with Capture
Best for: Effects with cleanup needs
```typescript
useEffect(() => {
  let isMounted = true;
  const current = value;
  const load = async () => {
    const data = await fetch(current);
    if (isMounted && current === value) setState(data);
  };
  load();
  return () => { isMounted = false; };
}, [value]);
```

### Pattern 3: Versioning for Streams
Best for: Multiple onChunk callbacks from single stream
```typescript
const version = useRef(0);
const start = useCallback(() => {
  const v = ++version.current;
  stream.start({
    onChunk: (data) => setState(prev => 
      prev.version !== v ? prev : { ...prev, data }
    )
  });
}, []);
```

## Files Modified by This Analysis

| File | Lines | Risk | Pattern |
|------|-------|------|---------|
| useStreamChat.ts | 78-316 | CRITICAL | Stream callbacks |
| useLoadAppFile.ts | 9-36 | HIGH | Async + parameter change |
| usePlanImplementation.ts | 72-140 | HIGH | Timeout + stream |
| useDirectDeploy.ts | 45-98 | MEDIUM | Concurrent streams |
| ChatPanel.tsx | 80-95 | MEDIUM | Closure fetch |
| useRunApp.ts | 157-177 | MEDIUM | Event subscription |
| useMcp.ts | 61-85 | MEDIUM | Mutation invalidation |
| useCountTokens.ts | 16-46 | MEDIUM-LOW | Debounce transition |
| useUncommittedFiles.ts | 7-23 | LOW | Polling |

## Testing Validation

Each fix includes a testing scenario checklist:
- Rapid parameter changes while async in flight
- Concurrent operation triggering
- Parameter validation at state write time
- Event queue reordering scenarios

See `STALE_ASYNC_FIXES_CHECKLIST.md` for detailed test cases.

## Context

This analysis was performed as part of **hardening UX reliability under rapid user interactions**. The focus is on race conditions that manifest when users:
- Rapidly switch between chats
- Quickly click navigation items
- Trigger concurrent mutations
- Switch apps while streams are active

These patterns are realistic in production and should be fixed to ensure data integrity.

## Questions?

Refer to:
1. **Implementation details:** STALE_ASYNC_FIXES_CHECKLIST.md
2. **Technical deep-dive:** STALE_ASYNC_RISKS.md
3. **Patterns & examples:** See "GENERAL MITIGATION PATTERNS" in STALE_ASYNC_RISKS.md

---

**Generated:** 2026-03-05  
**Scope:** Complete src/components, src/hooks, src/contexts scan  
**No code modifications made** - analysis only
