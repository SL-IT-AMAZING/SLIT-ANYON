# ChatMessage Rendering System - Complete Analysis

## 1. MESSAGE TYPE DEFINITION

**File:** `src/ipc/types/chat.ts` (lines 16-30)

```typescript
export const MessageSchema = z.object({
  id: z.number(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  approvalState: z.enum(["approved", "rejected"]).nullable().optional(),
  commitHash: z.string().nullable().optional(),
  sourceCommitHash: z.string().nullable().optional(),
  dbTimestamp: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  requestId: z.string().nullable().optional(),
  totalTokens: z.number().nullable().optional(),
  model: z.string().nullable().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
```

### Message Fields:

- **id**: Unique message identifier (number)
- **role**: "user" | "assistant" — determines styling/alignment
- **content**: The actual message text (string) — can be empty during streaming
- **approvalState**: Optional approval status ("approved" | "rejected")
- **commitHash**: For assistant messages, the git commit hash of the code at message time
- **sourceCommitHash**: For undo/revert — the commit hash before the assistant made changes
- **dbTimestamp**: Database timestamp (legacy?)
- **createdAt**: Message creation timestamp (Date | string)
- **requestId**: Request tracking ID, shown on hover
- **totalTokens**: Token count for the message (last message only)
- **model**: LLM model name (e.g., "Claude 3.5 Sonnet")

**CRITICAL:** There are NO separate fields for "tool calls," "blocks," or "parts." All tool invocations are **embedded within `content` as custom XML tags**.

---

## 2. CHATMESSAGE COMPONENT RENDER LOGIC

**File:** `src/components/chat/ChatMessage.tsx`

### Render Flow (Lines 35-265):

```
ChatMessage({ message, isLastMessage })
  ↓
Check: role === "assistant" && !content && isStreaming && isLastMessage?
  ├─ YES → Show <StreamingLoadingAnimation variant="initial" />
  └─ NO → Render content
    ├─ For ASSISTANT messages:
    │   └─ <AnyonMarkdownParser content={message.content} />
    │   └─ If last message AND streaming → <StreamingLoadingAnimation variant="streaming" />
    └─ For USER messages:
        └─ <VanillaMarkdownParser content={message.content} />
  ↓
Show Footer (if conditions met):
  ├─ Copy button (assistant, has content, not streaming)
  ├─ Approval status badge
  └─ Model name badge
  ↓
Show Metadata (assistant messages only, on hover):
  ├─ Timestamp (formatted)
  ├─ Git commit info (if version found)
  ├─ Request ID (copyable)
  └─ Total tokens (last message only)
```

### Key Conditional Branches:

**Line 102-123: Content Rendering**

```typescript
if (message.role === "assistant" &&
    !message.content &&
    isStreaming &&
    isLastMessage) {
  // Show initial streaming animation (empty assistant message)
  <StreamingLoadingAnimation variant="initial" />
} else {
  // Render markdown content
  if (message.role === "assistant") {
    <AnyonMarkdownParser content={message.content} />
    {isLastMessage && isStreaming && <StreamingLoadingAnimation variant="streaming" />}
  } else {
    <VanillaMarkdownParser content={message.content} />
  }
}
```

**Line 124-183: Footer Section (Copy, Approval, Model)**

```typescript
if (
  (message.role === "assistant" && message.content && !isStreaming) ||
  message.approvalState
) {
  // Show copy button
  // Show approval badge (if approved/rejected)
  // Show model name
}
```

**Line 186-262: Metadata Section (Timestamp, Git, Request ID)**

```typescript
if (message.role === "assistant" && message.createdAt) {
  // Show timestamp
  // Show git commit message (if messageVersion found)
  // Show copyable request ID
  // Show token count (last message only)
}
```

### Key Styling Rules:

- **alignment**: `justify-start` (assistant) vs `justify-end` (user)
- **max-width**: `w-full max-w-3xl` (assistant) vs `max-w-[85%]` (user)
- **background**: No background (assistant) vs `bg-(--sidebar-accent)` (user)
- **prose classes**: Standard Markdown prose styling with `dark:prose-invert`

---

## 3. HOW TOOL CALLS ARE EMBEDDED IN CONTENT

**Tool calls are NOT separate Message fields. They're embedded as CUSTOM XML TAGS within the `content` string.**

### Custom XML Tags in Content:

The `AnyonMarkdownParser` extracts and renders these tags:

```
<anyon-write path="..." change="...">content</anyon-write>
<anyon-read path="...">content</anyon-read>
<anyon-edit filename="...">content</anyon-edit>
<anyon-grep query="...">content</anyon-grep>
<anyon-search-replace path="..." from="..." to="...">content</anyon-search-replace>
<anyon-mcp-tool-call serverName="..." toolName="...">{"json": "content"}</anyon-mcp-tool-call>
<anyon-mcp-tool-result serverName="..." toolName="...">{"json": "content"}</anyon-mcp-tool-result>
<anyon-web-search query="...">content</anyon-web-search>
<anyon-code-search query="...">content</anyon-code-search>
... and many more (78 tags total)
```

### Parsing Process (AnyonMarkdownParser.tsx):

1. **preprocessUnclosedTags()** (line 231-278):
   - Detects unclosed tags during streaming
   - Automatically closes them to prevent parsing errors
   - Marks them as "inProgress" state

2. **parseCustomTags()** (line 283-344):
   - Extracts all custom tags using regex: `<(tag)\s*([^>]*)>(.*?)<\/\1>`
   - Parses attributes as key="value" pairs
   - Unescapes XML content and attributes
   - Returns mixed array of `ContentPiece` (either markdown or custom-tag)

3. **renderCustomTag()** (line 362-?):
   - Maps each tag to its React component
   - Example for MCP tool call:
   ```typescript
   case "anyon-mcp-tool-call":
     return (
       <AnyonMcpToolCall
         node={{ properties: { serverName, toolName } }}
       >
         {content}
       </AnyonMcpToolCall>
     );
   ```

### Tool Call Display Components:

**AnyonMcpToolCall.tsx** (lines 1-75):

- Displays tool invocation with server/tool name badges
- Content is JSON (collapsed by default)
- Expandable on click to show full JSON parameters

**AnyonMcpToolResult.tsx** (lines 1-75):

- Displays tool result with similar UI
- Green checkmark instead of wrench icon
- JSON content expandable

---

## 4. STREAMING MESSAGE HANDLING

**Streaming vs. Completed Detection:**

```typescript
// From useStreamChat hook (not shown but inferred from ChatMessage usage)
const { isStreaming } = useStreamChat(); // Global streaming state
const isLastMessage = index === messages.length - 1;
```

**Special Cases During Streaming:**

1. **Empty Assistant Message (Just Started)**
   - `message.role === "assistant"`
   - `!message.content`
   - `isStreaming && isLastMessage`
   - → Show spinner animation

2. **Partial Content (Streaming)**
   - `message.role === "assistant"`
   - `message.content` (partial text)
   - `isStreaming && isLastMessage`
   - → Show AnyonMarkdownParser + streaming animation below

3. **Completed Message**
   - `message.role === "assistant"`
   - `message.content` (full text)
   - `!isStreaming`
   - → Show footer with copy button

**InProgress Tags During Streaming:**

- If a custom tag is unclosed (e.g., `<anyon-write...>` without closing tag):
  - `preprocessUnclosedTags()` auto-closes it
  - Marks it with `inProgress: true`
  - `getState()` computes: `"pending" if isStreaming else "aborted"`
  - Components show loading state or abort state

---

## 5. HOW CHATMESSAGE IS CALLED FROM MESSAGESLIST

**File:** `src/components/chat/MessagesList.tsx` (lines 237-407)

### Props Passed to ChatMessage:

```typescript
interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
}
```

### Message List Rendering:

**Virtualized Rendering (Lines 387-405):**

```typescript
return (
  <Virtuoso
    data={messages}
    itemContent={(index, message) => (
      <div className="px-4" key={message.id}>
        <MemoizedChatMessage
          message={message}
          isLastMessage={index === messages.length - 1}
        />
      </div>
    )}
  />
);
```

**Test Mode (Non-virtualized, Lines 367-385):**

```typescript
// In test mode, render all messages without virtualization
if (isTestMode) {
  return (
    messages.map((message, index) => (
      <ChatMessage
        message={message}
        isLastMessage={index === messages.length - 1}
      />
    ))
  );
}
```

**Key Props Derived in MessagesList:**

- `versions`: Lookup git version info for `messageVersion`
- `isStreaming`: From `useStreamChat()` hook
- `appId`: For version lookup
- Various handlers for Undo/Retry buttons in footer

---

## 6. SUMMARY: ARCHITECTURE

```
Message (IPC Type)
  ├─ role: "user" | "assistant"
  ├─ content: string (with embedded custom XML tags)
  ├─ model: string (for assistant)
  ├─ commitHash: string (for code state)
  └─ metadata: createdAt, requestId, totalTokens, approvalState

ChatMessage Component
  ├─ Receives: message, isLastMessage
  ├─ Determines: role, streaming state, approval state
  ├─ Renders:
  │   ├─ AnyonMarkdownParser (assistant) or VanillaMarkdownParser (user)
  │   │   └─ Extracts custom XML tags from content
  │   │   └─ Renders: <AnyonMcpToolCall>, <AnyonMcpToolResult>, etc.
  │   ├─ Footer: Copy, Approval, Model badges
  │   └─ Metadata: Timestamp, Git commit, Request ID, Tokens
  └─ Styling: Based on role (alignment, colors, width)

MessagesList
  ├─ Uses Virtuoso for performance
  ├─ Memoizes ChatMessage to prevent re-renders
  ├─ Passes: message, isLastMessage
  └─ Footer: Undo/Retry buttons, Setup banner

Streaming Flow:
  1. Empty message arrives → Show spinner
  2. Content chunks arrive → Parse + render tags as they appear
  3. Unclosed tags auto-closed and marked as "inProgress"
  4. Streaming complete → Hide spinner, show full footer
```

---

## 7. NO "PARTS" OR "BLOCKS" CONCEPT

Unlike assistant-ui or other frameworks, this app does NOT use:

- Content "parts" or "blocks" separate from text
- Separate arrays for text vs. tool calls
- Tool use/result objects with IDs

**Everything is inside `message.content` as XML tags.** This is simpler but means:

- Tool calls are NOT separately queryable
- No automatic linking of tool calls to results
- Must parse XML to extract individual tools
- Ideal for streaming (just append HTML tags to content)

---

## KEY TAKEAWAY FOR REPLACEMENT

To replace ChatMessage with UserMessage + AssistantMessage:

1. **Message type stays the same** — no need to change IPC
2. **Split rendering logic by role:**
   - `UserMessage`: Uses `VanillaMarkdownParser`
   - `AssistantMessage`: Uses `AnyonMarkdownParser` (handles tool tags)
3. **Tool calls already live in `message.content`** — no refactoring needed
4. **Streaming detection**: Pass `isStreaming && isLastMessage` to both components
5. **Metadata (footer/timestamp)**: Move to `AssistantMessage` only
6. **Memoization**: Keep `React.memo()` for performance
