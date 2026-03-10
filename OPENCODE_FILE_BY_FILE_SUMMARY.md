# OpenCode Chat Rendering: File-by-File Impact Summary

## Quick Lookup Table

### MUST CHANGE (Required for parity)
| File | Lines | Change | Impact | Complexity |
|------|-------|--------|--------|-----------|
| `src/hooks/useStreamChat.ts` | 355 | Parse reasoning + tools from stream | Core streaming data | 🔴 High |
| `src/atoms/chatAtoms.ts` | 25 | Add turn status atoms | Per-turn state | 🟡 Medium |
| `src/components/chat/MessagesList.tsx` | 891 | Render SessionTurn | Component swap | 🟡 Medium |

### SHOULD USE (Already built, just wire)
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/components/chat-v2/SessionTurn.tsx` | 424 | Turn container + steps | ✅ Ready |
| `src/components/chat-v2/MarkdownContent.tsx` | 179 | Markdown rendering | ✅ Ready |
| `src/components/chat-v2/LogoSpinner.tsx` | 452 | Streaming animation | ✅ Ready |
| `src/components/chat-v2/BasicTool.tsx` | 162 | Collapsible tool | ✅ Ready |
| `src/components/chat-v2/Composer.tsx` | 100 | Text input | ✅ Ready |
| `src/components/chat-v2/UserMessage.tsx` | 35 | User bubble | ✅ Ready |
| `src/components/chat-v2/Thread.tsx` | 103 | Layout container | ✅ Ready |
| `src/components/chat-v2/ActionBar.tsx` | 93 | Copy/reload buttons | ✅ Ready |

### CAN DEPRECATE (Legacy, replaced by chat-v2)
| File | Status | Reason |
|------|--------|--------|
| `src/components/chat/ChatMessage.tsx` | 287 lines | SessionTurn + MarkdownContent replace |
| `src/components/chat/StreamingLoadingAnimation.tsx` | 262 lines | LogoSpinner replaces |
| `src/components/chat-v2/ScrambleText.tsx` | 129 lines | Nice-to-have, can keep |

### WORKS AS-IS (No changes needed)
| File | Purpose |
|------|---------|
| `src/components/ChatPanel.tsx` | Auto-scroll already supports SessionTurn |
| `src/components/chat/AnyonMarkdownParser.tsx` | Keep for tag parsing (final content) |
| `src/styles/globals.css` | Animations available |

---

## Detailed File Impact

### 🔴 CRITICAL: useStreamChat.ts (355 lines)

**Current**: Updates `chatMessagesByIdAtom` with raw streaming messages

**Need**: Extract reasoning steps + tools during `onChunk`

**Change Location**: Lines 156-180 (onChunk handler)

```typescript
// Current:
onChunk: ({ messages: updatedMessages }) => {
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, updatedMessages);
    return next;
  });
}

// Change: Also generate + update steps
onChunk: ({ messages: updatedMessages }) => {
  const steps = extractStepsFromMessages(updatedMessages);
  setStepsById((prev) => {
    const next = new Map(prev);
    next.set(chatId, steps);
    return next;
  });
  
  setMessagesById((prev) => {
    const next = new Map(prev);
    next.set(chatId, updatedMessages);
    return next;
  });
}
```

**Complexity**: 🔴 High (requires step parsing logic)

---

### 🟡 MEDIUM: chatAtoms.ts (25 lines)

**Current**: Only streaming + message atoms

**Need**: Add per-turn step state

```typescript
// ADD these atoms:
export const turnStatusByIdAtom = atom<Map<number, {
  working: boolean;
  statusText: string;
  steps: StepItem[];
  duration?: string;
}>>(new Map());

export const activeTurnIdAtom = atom<number | null>(null);
```

**Complexity**: 🟢 Low (just add atoms)

---

### 🟡 MEDIUM: MessagesList.tsx (891 lines)

**Current**: Parses steps, renders ChatMessage

**Need**: Render SessionTurn instead (for new chat-v2 flow)

**Change Locations**:
- Import SessionTurn, LogoSpinner from chat-v2
- Around line ~850 (render function)

```typescript
// Current:
return <ChatMessage message={assistantMessage} isLastMessage={isLast} />;

// Change:
if (hasComplexContent) {
  return (
    <SessionTurn
      userMessage={userMessage?.content ?? ""}
      steps={extractedSteps}
      working={isStreaming && isLast}
      statusText={statusText}
      stepsExpanded={expandedTurns.has(turnId)}
      onToggleSteps={() => toggleTurnExpanded(turnId)}
      duration={duration}
    />
  );
}

// Fallback for simple messages:
return <ChatMessage message={assistantMessage} isLastMessage={isLast} />;
```

**Complexity**: 🟡 Medium (lots of prop threading)

---

### ✅ SessionTurn.tsx (424 lines) — READY TO USE

**Already has**:
- ✅ Reasoning display (line 124-131)
- ✅ Tool grouping (line 152-181)
- ✅ Step accordion (line 358-370)
- ✅ Status text throttling (line 216-237)
- ✅ LogoSpinner integration (line 333)
- ✅ Duration display (line 347-349)

**What you need**:
- Pass `working`, `statusText`, `steps` from MessagesList
- Ensure `MarkdownContent` imported (line 14)

---

### ✅ MarkdownContent.tsx (179 lines) — READY TO USE

**Already has**:
- ✅ Code blocks with copy button (line 43-52)
- ✅ Custom link handler (line 54-66)
- ✅ GFM support (remark-gfm)
- ✅ Code highlighting

**Exported**: `markdownComponents` for reuse in old AnyonMarkdownParser

**What you need**:
- Import in SessionTurn for reasoning/text step rendering
- Already imported at line 14

---

### ✅ LogoSpinner.tsx (452 lines) — READY TO USE

**Features**:
- 7 animation variants
- Used variant in SessionTurn: `strokeLoop` (line 333)

**What you need**:
- Import in SessionTurn (already done, line 13)
- Pass `size={16}` when `working=true`

---

### ✅ BasicTool.tsx (162 lines) — READY TO USE

**Features**:
- Collapsible wrapper for steps
- Used by SessionTurn for tool/reasoning display (line 138-148, 155-181)

**What you need**:
- SessionTurn already imports it (line 12)

---

### ✅ Thread.tsx (103 lines) — READY TO USE

**Layout components**:
- `ThreadViewport`: Scroll container with `scroll-smooth`
- `ThreadFooter`: Sticky footer
- `ThreadMessages`: Message container

**Note**: Not used in current MessagesList, but available if you want to migrate to full chat-v2 architecture

---

### ✅ Composer.tsx (100 lines) — READY TO USE

**Features**:
- Send/Stop button toggle based on `isStreaming`
- Auto-resize textarea
- Enter-to-send

**Note**: Would replace ChatInput in full migration

---

### ⚠️ ChatPanel.tsx (198 lines) — WORKS AS-IS

**Already supports**:
- ✅ Virtuoso integration
- ✅ Auto-scroll on stream start
- ✅ RFC-based scroll during streaming
- ✅ Scroll button on scroll-away

**No changes needed** — just ensure MessagesList passes `onAtBottomChange`

---

### ⚠️ AnyonMarkdownParser.tsx (629 lines) — KEEP FOR NOW

**Reason**: Parses 30+ Anyon custom tags (think, edit, read, grep, etc.)

**Plan**: 
- Short term: Keep as-is, use for final message content
- Long term: Could migrate tag rendering to SessionTurn

**Current usage**: Old ChatMessage component (line 124)

---

### 🗑️ DEPRECATE: ChatMessage.tsx (287 lines)

**Replaced by**: SessionTurn + MarkdownContent

**Timeline**: Can deprecate after SessionTurn wired in

---

### 🗑️ DEPRECATE: StreamingLoadingAnimation.tsx (262 lines)

**Replaced by**: LogoSpinner

**Timeline**: Can deprecate after MessagesList uses LogoSpinner

---

## Implementation Checklist

### PHASE 1: Add State (chatAtoms.ts)
- [ ] Add `turnStatusByIdAtom`
- [ ] Add `activeTurnIdAtom`
- [ ] Add `stepsById` atom (or store in turnStatus)

### PHASE 2: Extract Steps (useStreamChat.ts)
- [ ] Add `extractStepsFromMessages()` function
- [ ] Parse think tags → reasoning steps
- [ ] Parse anyon-* tags → tool steps
- [ ] Update setStepsById on onChunk
- [ ] Update setStatusById on stream start
- [ ] Clear working flag on onEnd/onError

### PHASE 3: Render SessionTurn (MessagesList.tsx)
- [ ] Import SessionTurn, LogoSpinner
- [ ] Check if message has reasoning/tools
- [ ] If yes: Render SessionTurn with steps
- [ ] If no: Render ChatMessage (fallback)
- [ ] Wire expandedTurns state for accordion
- [ ] Wire isStreaming + statusText

### PHASE 4: Polish
- [ ] Test streaming display
- [ ] Test reasoning ephemeral behavior
- [ ] Test tool grouping
- [ ] Test auto-scroll
- [ ] Visual regression test vs legacy

---

## Props Flow Diagram

```
useStreamChat()
├─ onChunk() → Extract steps → setStepsById()
├─ onEnd() → Set working=false
└─ onError() → Set error, working=false

chatAtoms
├─ isStreamingByIdAtom
├─ chatMessagesByIdAtom
├─ turnStatusByIdAtom (NEW)
└─ activeTurnIdAtom (NEW)

ChatPanel (auto-scroll)
└─ MessagesList (turn rendering)
    └─ SessionTurn (per-turn UI)
        ├─ StepItem[] (reasoning/tools/text)
        ├─ working: boolean
        ├─ statusText: string
        └─ LogoSpinner (spinner animation)
```

---

## Quick Commands

```bash
# View full impact map
cat OPENCODE_PARITY_IMPACT_MAP.md

# View implementation guide
cat OPENCODE_IMPLEMENTATION_GUIDE.md

# Check current imports in MessagesList
grep "import.*SessionTurn\|import.*LogoSpinner" src/components/chat/MessagesList.tsx

# Find all StreamItem extractions
grep -n "extractStepsFromMessages\|StepItem\[" src/components/chat/MessagesList.tsx
```

---

## Success Signal

When you see this in your chat:

1. ✅ New turn rendered with user message in sticky bubble
2. ✅ Assistant turn shows "Thinking..." with spinner animation
3. ✅ Step accordion appears with collapsible tools
4. ✅ Reasoning section expands/collapses
5. ✅ Spinner disappears when stream ends
6. ✅ Auto-scroll keeps viewport at bottom

**You have OpenCode parity!**

