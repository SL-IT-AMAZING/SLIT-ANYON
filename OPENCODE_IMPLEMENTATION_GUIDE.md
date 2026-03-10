# OpenCode Implementation Priority Guide

## Quick Summary
You have **two architecture paths** for OpenCode chat parity:

### Path A: Minimal Integration (Recommended)
Wire new chat-v2 components into legacy streaming pipeline. All components are **already built**, just needs state plumbing.

### Path B: Full Migration
Replace legacy MessagesList with chat-v2 Thread architecture. More code changes but cleaner long-term.

---

## Implementation Sequence

### PHASE 1: Wire Streaming State (1-2 hours)
**Goal**: Get `working` + `statusText` flowing through the render tree

**Files to modify**:
1. `src/atoms/chatAtoms.ts` — Add per-turn state atoms
2. `src/hooks/useStreamChat.ts` — Parse reasoning/tools from streaming content
3. `src/components/chat/MessagesList.tsx` — Extract `working` state per turn, pass to SessionTurn

**Expected outcome**: SessionTurn receives `working`, `statusText`, `steps` props with real data

---

### PHASE 2: Component Integration (2-3 hours)
**Goal**: Render SessionTurn in production chat

**Files to modify**:
1. `src/components/chat/MessagesList.tsx` — Import SessionTurn, use instead of ChatMessage for assistant turns
2. `src/components/chat-v2/SessionTurn.tsx` — Ensure MarkdownContent import works
3. `src/components/chat/AnyonMarkdownParser.tsx` — Reuse markdownComponents from MarkdownContent

**Expected outcome**: New turns render with expanded/collapsed steps, streaming spinner, reasoning

---

### PHASE 3: Polish & Motion (1 hour)
**Goal**: Smooth animations and visual polish

**Files to modify**:
1. `src/components/chat-v2/SessionTurn.tsx` — Verify fade-in animations work
2. `src/components/chat-v2/BasicTool.tsx` — Verify accordion animations
3. `src/styles/globals.css` — Ensure animate-shimmer and motion CSS available

**Expected outcome**: Turns fade in, tools animate on expand, status text animates

---

## Critical Integration Points

### 1. Step Item Generation (useStreamChat.ts)
```typescript
// During onChunk, extract steps from message content
interface GeneratedSteps {
  reasoning: StepItem[];
  tools: StepItem[];
  text: StepItem[];
  questions: StepItem[];
}

// Parse message.content for:
// - <think>...</think> → reasoning steps
// - <anyon-*> tags → tool steps
// - Regular markdown → text steps
// - <opencode-question> → question steps
```

### 2. Streaming Status Map (chatAtoms.ts)
```typescript
// Per-turn tracking
export const turnStatusByIdAtom = atom<Map<string, {
  working: boolean;
  statusText: string;
  steps: StepItem[];
  duration?: string;
}>(new Map());
```

### 3. MessagesList Turn Rendering (MessagesList.tsx)
```typescript
// Current: Renders ChatMessage for assistant
// New: Check if assistant message has reasoning/tools
//      If yes: Render SessionTurn
//      If no:  Render ChatMessage (legacy fallback)

const hasTools = /* check message.content for Anyon tags */;
if (hasTools) {
  return <SessionTurn working={false} steps={extractedSteps} />;
}
return <ChatMessage message={message} />;
```

---

## Reasoning Display Strategy

### Current Behavior (ANYON)
- Reasoning visible only **during streaming** (`working=true`)
- Hidden after stream completes (`working=false`)
- Reason: Reasoning is intermediate model state, not final output

### Implementation
```typescript
// In SessionTurn.tsx (line 247-249)
const visibleSteps = working
  ? steps
  : steps.filter((s) => s.type !== "reasoning");  // Hide reasoning when done

// Parity: Must match this behavior
```

---

## Auto-Scroll Handling

### Current (ChatPanel.tsx)
1. **Stream starts** → Immediate scroll to bottom
2. **Streaming** → RAF-based instant scroll when user at bottom
3. **Stream ends** → Double RAF + smooth scroll to show footer

### For SessionTurn
- ChatPanel already handles this ✓
- Just ensure MessagesList passes correct `onAtBottomChange` callback
- No new code needed

---

## Tool Grouping

### Automatic Grouping Logic (MessagesList.tsx:78-151)
```typescript
// Context tools (read, grep, glob, list, search) → grouped
// Edit tools (edit, write, search-replace) → grouped
// Verify tools (lsp, diagnostics) → grouped
// Single tools → rendered as-is
```

### For OpenCode
- This logic already exists in MessagesList
- Just transfer it to SessionTurn when migrating
- Or keep in MessagesList and pass grouped steps to SessionTurn

---

## Markdown Rendering Decision

### Option A: Extend MarkdownContent (Recommended)
- Import AnyonMarkdownParser tag-parsing logic
- Create MarkdownWithTags component
- Pass to SessionTurn for content rendering
- **Pros**: Cleaner, no duplicate code
- **Cons**: Couples chat-v2 to Anyon tags

### Option B: Keep AnyonMarkdownParser
- Don't change MarkdownContent
- Use AnyonMarkdownParser in SessionTurn for assistant message content
- **Pros**: Minimal changes
- **Cons**: Two markdown renderers in play

### Recommendation
**Option B** (keep AnyonMarkdownParser) because:
1. SessionTurn is for steps/reasoning, not final content
2. Final content still goes through ChatMessage → AnyonMarkdownParser
3. Can migrate later without blocking OpenCode parity

---

## Testing Checklist

### Streaming Display
- [ ] LogoSpinner appears while streaming
- [ ] Status text updates every 2.5s max
- [ ] Spinner disappears on stream end
- [ ] No jank/flashing during updates

### Reasoning Display
- [ ] Think tags visible during `working=true`
- [ ] Think tags hidden when `working=false` (after stream)
- [ ] Reasoning can be expanded/collapsed
- [ ] Markdown in reasoning renders correctly

### Tool Display
- [ ] Tools grouped: context/edit/verify
- [ ] Tool icons correct
- [ ] Tool subtitles show file count
- [ ] Tools can be expanded/collapsed

### Auto-Scroll
- [ ] New stream triggers scroll to bottom
- [ ] Scroll button hidden when at bottom
- [ ] Scroll button appears when scrolled away
- [ ] Smooth scroll on stream end

### Markdown
- [ ] Code blocks have copy button
- [ ] Tables render correctly
- [ ] Links open with ipc.system.openExternalUrl
- [ ] GFM features work (strikethrough, task lists)

---

## Known Gotchas

1. **Reasoning ephemeral** — Must hide when `working=false`, not just collapse
2. **Status text throttling** — Only update every 2.5s during streaming (SessionTurn:210-237)
3. **Step grouping logic** — Complex, see MessagesList:78-151
4. **Sticky header** — User message sticky when `isActive=true` (SessionTurn:310-318)
5. **Diff rendering** — Only show after stream ends, not during
6. **Tool icons** — Must map tag names to correct Lucide icons (getToolIcon)

---

## Estimated Time Breakdown

| Phase | Files | Time | Difficulty |
|-------|-------|------|-----------|
| Phase 1: State | 3 | 1-2h | Medium |
| Phase 2: Components | 3 | 2-3h | Medium |
| Phase 3: Polish | 3 | 1h | Low |
| **Testing** | All | 1-2h | Medium |
| **Total** | | **5-9h** | **Medium** |

---

## Success Criteria for OpenCode Parity

✓ SessionTurn renders with streaming status + LogoSpinner  
✓ Reasoning hidden when stream ends  
✓ Tools grouped and collapsible  
✓ Status text throttled to 2.5s updates  
✓ Auto-scroll works (scroll to bottom on new stream)  
✓ Markdown renders with code copy buttons  
✓ No visual regressions vs legacy ChatMessage  
✓ Performance: no jank on 1000+ message chats  

