# OpenCode Parity Impact Map - Chat Rendering & Streaming

## Overview
This document maps all files that affect chat turn rendering, reasoning display, markdown rendering, auto-scroll, and stream-status indicators. It identifies exact surfaces where OpenCode diverges from current ANYON implementation.

---

## TIER 1: CORE RENDERING SURFACES (Critical for parity)

### chat-v2 Architecture
These files form the new, modern chat-v2 architecture currently unused in production:

#### `src/components/chat-v2/SessionTurn.tsx` (424 lines)
- **Role**: Turn container with step/reasoning/tool display
- **Current Impact**: Core chat turn rendering component (not yet integrated)
- **Key Features**:
  - `SessionTurnProps`: Controls `working`, `statusText`, `steps`, `diffs`, `stepsExpanded`
  - `computeStatus()`: Maps tool names to human-readable status ("Gathering context", "Making edits", etc.)
  - Reasoning display: Steps with `type="reasoning"` only visible while `working=true`
  - Step grouping: Context tools, edit tools, verify tools auto-grouped via `groupToolSteps()`
  - Sticky header support: User message sticky when `isActive=true`
  - Throttled status text: Updates max every 2.5s during streaming
- **OpenCode Gap**: Requires `working` + `statusText` state management from external streaming hook
- **Must Support**: Ephemeral reasoning (hidden when `working=false`), collapsible tool steps

#### `src/components/chat-v2/AssistantMessage.tsx` (44 lines)
- **Role**: Minimal message container with optional streaming indicator
- **Key Features**: `isStreaming` prop shows blinking cursor, fade-in animation
- **OpenCode Gap**: No markdown rendering (delegates to parent), no tool support
- **Parity Requirement**: Must be compatible with streaming state from hook

#### `src/components/chat-v2/Thread.tsx` (103 lines)
- **Role**: Layout container (viewport + messages + footer)
- **Key Features**: 
  - `ThreadViewport`: `scroll-smooth` CSS, `overflow-y-auto`
  - `ThreadFooter`: `sticky bottom-0`, auto-expands to prevent content hiding
- **Parity Requirement**: Auto-scroll behavior must work with Virtuoso in legacy path

#### `src/components/chat-v2/MarkdownContent.tsx` (179 lines)
- **Role**: React Markdown renderer with copy buttons and custom link handling
- **Key Features**:
  - `markdownComponents` exported for reuse in old ChatMessage
  - Code blocks with copy button + language tag
  - Custom link handler: `ipc.system.openExternalUrl()` (external links)
  - GFM support (tables, strikethrough, task lists)
- **OpenCode Gap**: No tool/reasoning rendering (used only for plain markdown)
- **Parity Requirement**: Must be drop-in replacement for old AnyonMarkdownParser

#### `src/components/chat-v2/Composer.tsx` (100 lines)
- **Role**: Text input with auto-resize and send/stop buttons
- **Key Features**: `isStreaming` prop toggles send↔stop button, `onStop` handler
- **Parity Requirement**: Streaming state must be synchronized with chat

#### `src/components/chat-v2/UserMessage.tsx` (35 lines)
- **Role**: Simple user message bubble
- **Parity Requirement**: Basic alignment, no formatting changes needed

#### `src/components/chat-v2/ActionBar.tsx` (93 lines)
- **Role**: Copy + Regenerate buttons (hover-triggered)
- **Parity Requirement**: Works with both chat-v2 and legacy components

#### `src/components/chat-v2/BasicTool.tsx` (162 lines)
- **Role**: Collapsible tool/step container
- **Key Features**:
  - `open`, `forceOpen`, `locked` state management
  - useEffect to sync `forceOpen` → `open` state
  - Accordion panel with animation
- **Parity Requirement**: Used by SessionTurn for reasoning/tool display

---

## TIER 2: STREAMING & STATE MANAGEMENT (Critical hooks)

### `src/hooks/useStreamChat.ts` (355 lines)
- **Role**: IPC streaming orchestration + atom updates
- **Current Impact**: PRODUCTION - all chat streaming goes through this
- **Key State Updates**:
  - `isStreamingByIdAtom`: Map<chatId, boolean>
  - `chatMessagesByIdAtom`: Map<chatId, Message[]>
  - `chatStreamCountByIdAtom`: Map<chatId, number> (triggers auto-scroll)
  - `chatErrorByIdAtom`: Map<chatId, error>
- **Stream Lifecycle**:
  - `onChunk`: Updates messages, increments stream count
  - `onEnd`: Clears streaming flag, invalidates related queries
  - `onError`: Sets error, clears streaming flag
- **OpenCode Parity**: Must inject reasoning/tool steps into message stream during `onChunk`
- **Parity Gap**: No reasoning steps generation, no tool tracking

### `src/atoms/chatAtoms.ts` (25 lines)
- **Role**: Per-chat atomic state
- **Key Atoms**:
  - `isStreamingByIdAtom`: Streaming status per chat
  - `chatMessagesByIdAtom`: Messages per chat
  - `chatStreamCountByIdAtom`: Triggers auto-scroll on new stream
  - `recentStreamChatIdsAtom`: Tracks active streams
- **OpenCode Requirement**: Must extend to include reasoning/tool step atoms

---

## TIER 3: AUTO-SCROLL & VIRTUALIZATION (Platform-specific)

### `src/components/ChatPanel.tsx` (198 lines)
- **Role**: Legacy chat container with Virtuoso integration
- **Current Implementation**:
  - `isAtBottomRef`: Tracks user scroll position
  - `streamCountById`: Dependency for scroll-to-bottom trigger
  - `handleAtBottomChange()`: Called by Virtuoso's `atBottomStateChange`
  - Auto-scroll strategy:
    - New stream starts → scroll to bottom (`scrollToBottom("instant")`)
    - Streaming active → RAF-based instant scroll when at bottom
    - Stream ends → Double RAF + smooth scroll to ensure footer visible
  - Test mode fallback: Manual scroll tracking + instant RAF scroll
- **OpenCode Gap**: Uses old MessagesList with SessionTurn imports
- **Parity Requirement**: Must work with new streaming turn rendering

### `src/components/chat/MessagesList.tsx` (891 lines)
- **Role**: Virtuoso container + turn/message conversion
- **Current Implementation**:
  - Converts `Message[]` to `MessageTurn[]` (grouping user + assistant)
  - Renders old `ChatMessage` OR new `SessionTurn` depending on content
  - Tool grouping: Context/Edit/Verify tools auto-grouped
  - Status tool mapping: Maps custom tags to human-readable status
  - Ref forwarding for Virtuoso integration
- **Step Extraction**: Parses Anyon custom tags into `StepItem[]`
  - Tool steps: `type="tool"`, `toolName`, `toolIcon`, `subtitle`
  - Text steps: `type="text"`, markdown content
  - Reasoning steps: From think tags, `type="reasoning"`
  - Question steps: `type="question"`, form data
- **OpenCode Gap**: Extracts steps but doesn't track `working` state per turn
- **Parity Requirement**: Must provide `working` + `statusText` to SessionTurn

---

## TIER 4: ANIMATION & VISUAL INDICATORS (Status display)

### `src/components/chat-v2/LogoSpinner.tsx` (452 lines)
- **Role**: Animated loading indicator with 7 variants
- **Current Impact**: Used in SessionTurn when `working=true` and old ChatMessage during stream
- **Variants**:
  - `strokeLoop`: Primary (2s draw + 0.8s fill in/out, used in SessionTurn)
  - `dotChase`: Alternate (1.6s cycle)
  - `pulseWave`: Distance-based pulse (2s)
  - `combined`: Rotating + chasing (10s rotation)
  - `strokeDraw`, `strokeTrace`, `strokeFill`: Path-based animations
- **OpenCode Impact**: Required for streaming status display
- **Parity Requirement**: Must be visible during streaming turns

### `src/components/chat-v2/ScrambleText.tsx` (129 lines)
- **Role**: Animated verb scrambling (used in old ChatMessage stream indicator)
- **Key Components**:
  - `INITIAL_VERBS`: Initial thinking states
  - `STREAMING_VERBS`: Active streaming states
  - `useScrambleText()`: Character-level scrambling animation (RAFs)
  - `useRotatingVerb()`: 5s rotation between verb list
- **OpenCode Gap**: Not used in SessionTurn, only in legacy ChatMessage
- **Parity Requirement**: May want similar effect for new flow

### `src/components/chat/StreamingLoadingAnimation.tsx` (262 lines)
- **Role**: Legacy streaming animation (bouncing orbs + scramble verb)
- **Variants**:
  - "initial": Orb wave animation when waiting for response
  - "streaming": Equalizer bar animation during streaming
- **OpenCode Impact**: Can be replaced by LogoSpinner
- **Parity Requirement**: Maintain visual continuity

### `src/styles/globals.css`
- **Key Animations**:
  - `.animate-shimmer`: Gradient shift (used in ScrambleVerb)
  - `.animate-marquee`: 2s linear scroll
  - `tw-animate-css`: Imported custom animations
- **OpenCode Parity**: Animations must remain compatible

---

## TIER 5: MARKDOWN RENDERING (Content display)

### Old Implementation:
- `src/components/chat/AnyonMarkdownParser.tsx` (629 lines)
  - Parses Anyon custom tags: 30+ tag types (think, edit, read, grep, etc.)
  - Renders custom UI for each tag type
  - Uses old MarkdownContent export from chat-v2
  - Complex state tracking per tag

### New Implementation:
- `src/components/chat-v2/MarkdownContent.tsx` (179 lines)
  - Pure React Markdown with copy buttons
  - Custom link handler
  - No Anyon-specific tags (delegates to old AnyonMarkdownParser)

### OpenCode Gap:
- **New chat-v2 flow doesn't render Anyon tags** → Falls back to plain markdown
- **Old ChatMessage mixes both**: Uses AnyonMarkdownParser for assistant messages
- **Parity Requirement**: Must support either:
  - Option A: Extend MarkdownContent to handle Anyon tags
  - Option B: Keep AnyonMarkdownParser and reuse in new flow

---

## TIER 6: MESSAGE FETCHING & IPC (Data layer)

### `src/hooks/useStreamChat.ts`
- **IPC Calls**:
  - `ipc.chatStream.start()`: Streaming request with onChunk/onEnd/onError
  - Payload: `{ chatId, prompt, redo?, attachments?, selectedComponents? }`
  - Response chunks: `{ messages: Message[] }` (full message list)

### `src/components/ChatPanel.tsx`
- **IPC Calls**:
  - `ipc.chat.getChat(chatId)`: Fetch messages on mount
  
### OpenCode Gap:
- Streaming must provide **reasoning steps + tool tracking** in message content
- Current: Only provides final `Message[]` with content + custom tags
- Required: Separate reasoning/tool metadata

---

## PARITY CHECKLIST: What OpenCode Must Support

### Turn Rendering
- ✗ Turn container (SessionTurn) with header + content sections
- ✗ User message sticky header
- ✗ Step accordion with reasoning/tool/text content
- ✗ Diff display (optional, post-stream)
- ✗ Permission prompts

### Reasoning Display
- ✗ Ephemeral reasoning (hidden when `working=false`)
- ✗ Markdown content in reasoning (used by `<MarkdownContent>`)
- ✗ Think tags parsed to reasoning steps

### Streaming Status
- ✗ LogoSpinner "strokeLoop" variant in header
- ✗ Throttled status text (max update every 2.5s)
- ✗ Animated spinner during `working=true`

### Markdown Rendering
- ✗ Code blocks with copy button
- ✗ Tables, blockquotes, lists
- ✗ Custom link handling (ipc.system.openExternalUrl)
- ✗ GFM support (remark-gfm)

### Auto-Scroll
- ✗ Scroll to bottom when new stream starts
- ✗ Instant scroll during streaming when at bottom
- ✗ Smooth scroll when stream ends + at bottom
- ✗ Scroll button when user scrolls away

### Tool/Tag Support
- ✗ Parse 30+ Anyon custom tags (think, edit, read, etc.)
- ✗ Tool grouping: context/edit/verify auto-grouped
- ✗ Status text mapping: Tag names → human-readable status
- ✗ Tool icons + subtitles

### Composer
- ✗ Send button when not streaming
- ✗ Stop button when streaming
- ✗ Auto-resize textarea
- ✗ isStreaming prop sync

---

## Integration Points Summary

### Files that MUST be updated for OpenCode parity:

1. **useStreamChat.ts** — Add reasoning/tool step generation during streaming
2. **SessionTurn.tsx** — Already complete, just needs wiring
3. **MarkdownContent.tsx** — Already complete, import + use in SessionTurn
4. **LogoSpinner.tsx** — Already complete, use in SessionTurn
5. **BasicTool.tsx** — Already complete, used by SessionTurn
6. **Thread.tsx** — Already complete, layout container
7. **Composer.tsx** — Already complete, wiring needed
8. **AnyonMarkdownParser.tsx** — Decide: extend or replace
9. **MessagesList.tsx** — Needs `working` state injection to SessionTurn
10. **ChatPanel.tsx** — Auto-scroll already supports SessionTurn

### New Atoms Potentially Needed:
- `reasoningStepsByTurnIdAtom`: Map<turnId, ReasoningStep[]>
- `toolStepsByTurnIdAtom`: Map<turnId, ToolStep[]>
- `turnStatusByIdAtom`: Map<turnId, statusText>
- `activeTurnIdAtom`: number | null (for sticky header)

---

## File Impact Summary Table

| File | Lines | Type | Status | Gap for OpenCode |
|------|-------|------|--------|------------------|
| SessionTurn.tsx | 424 | Component | Ready | None - core component |
| AssistantMessage.tsx | 44 | Component | Ready | None - minimal container |
| Thread.tsx | 103 | Layout | Ready | None - viewport layout |
| MarkdownContent.tsx | 179 | Component | Ready | Needs Anyon tag support? |
| Composer.tsx | 100 | Component | Ready | None - input handler |
| UserMessage.tsx | 35 | Component | Ready | None - minimal |
| ActionBar.tsx | 93 | Component | Ready | None - button group |
| BasicTool.tsx | 162 | Component | Ready | None - collapsible |
| LogoSpinner.tsx | 452 | Animation | Ready | None - spinner |
| ScrambleText.tsx | 129 | Animation | Ready | Optional - legacy |
| useStreamChat.ts | 355 | Hook | ⚠️ Needs Work | Must generate reasoning/tools |
| ChatPanel.tsx | 198 | Container | ⚠️ Works | Auto-scroll ready |
| MessagesList.tsx | 891 | Container | ⚠️ Works | Step extraction ready |
| AnyonMarkdownParser.tsx | 629 | Parser | ⚠️ Works | Decision: extend or replace |
| ChatMessage.tsx | 287 | Component | ✓ Legacy | Can deprecate |
| StreamingLoadingAnimation.tsx | 262 | Animation | ✓ Legacy | Can deprecate |
| chatAtoms.ts | 25 | State | ⚠️ Works | Consider extending |

**Status**: ✓ = Legacy, ⚠️ = Hybrid, Ready = New chat-v2 ready

