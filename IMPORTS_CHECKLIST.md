# Chat Components - Imports Checklist

## Status: Ready to Update ✅

This checklist tracks every file that imports chat components and what needs to be updated.

---

## PRIORITY 1: Core Chat Panel (Line Changes = 6)

### ✏️ src/components/ChatPanel.tsx

**File location:** `src/components/ChatPanel.tsx`

**Current imports (lines 10-15):**

```tsx
import { ChatHeader } from "./chat/ChatHeader"; // Line 10
import { MessagesList } from "./chat/MessagesList"; // Line 11
import { ChatInput } from "./chat/ChatInput"; // Line 12
import { VersionPane } from "./chat/VersionPane"; // Line 13
import { ChatError } from "./chat/ChatError"; // Line 14
import { FreeAgentQuotaBanner } from "./chat/FreeAgentQuotaBanner"; // Line 15
```

**Update to:**

```tsx
import { ChatHeader } from "./chat-v2/ChatHeader"; // Line 10
import { MessagesList } from "./chat-v2/MessagesList"; // Line 11
import { ChatInput } from "./chat-v2/ChatInput"; // Line 12
import { VersionPane } from "./chat-v2/VersionPane"; // Line 13 (or keep from ./chat/)
import { ChatError } from "./chat-v2/ChatError"; // Line 14 (or keep from ./chat/)
import { FreeAgentQuotaBanner } from "./chat/FreeAgentQuotaBanner"; // Line 15 (keep)
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟠 MEDIUM (6 lines, but critical)  
**Impact:** CORE - All chat UI depends on this

---

## PRIORITY 2: Message Rendering (Line Changes = 1)

### ✏️ src/components/chat/ChatMessage.tsx

**File location:** `src/components/chat/ChatMessage.tsx`

**Current import:**

```tsx
import { StreamingLoadingAnimation } from "./StreamingLoadingAnimation";
```

**Update to:**

```tsx
import { Spinner } from "../chat-v2/Spinner"; // or LogoSpinner
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (1 line)  
**Impact:** MEDIUM - Shows loading state

---

## PRIORITY 3: Chat List Dialogs (Line Changes = 2)

### ✏️ src/components/ChatList.tsx

**File location:** `src/components/ChatList.tsx`

**Current imports (lines 7-8):**

```tsx
import { DeleteChatDialog } from "@/components/chat/DeleteChatDialog"; // Line 7
import { RenameChatDialog } from "@/components/chat/RenameChatDialog"; // Line 8
```

**Update to:**

```tsx
import { DeleteChatDialog } from "@/components/chat-v2/DeleteChatDialog"; // Line 7
import { RenameChatDialog } from "@/components/chat-v2/RenameChatDialog"; // Line 8
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (2 lines)  
**Impact:** MEDIUM - Chat management dialogs

---

## PRIORITY 4: Home Page (Line Changes = 1)

### ✏️ src/pages/home.tsx

**File location:** `src/pages/home.tsx`

**Current import (line 4):**

```tsx
import { HomeChatInput } from "@/components/chat/HomeChatInput";
```

**Update to:**

```tsx
import { HomeChatInput } from "@/components/chat-v2/HomeChatInput";
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (1 line)  
**Impact:** LOW - Home page only

---

## PRIORITY 5: Preview Panel - Part 1 (Line Changes = 1)

### ✏️ src/components/preview_panel/ActionHeader.tsx

**File location:** `src/components/preview_panel/ActionHeader.tsx`

**Current import:**

```tsx
import { ChatActivityButton } from "@/components/chat/ChatActivity";
```

**Update to:**

```tsx
import { ChatActivityButton } from "@/components/chat-v2/ChatActivity";
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (1 line)  
**Impact:** LOW - Preview panel only

---

## PRIORITY 5: Preview Panel - Part 2 (Line Changes = 1)

### ✏️ src/components/preview_panel/SecurityPanel.tsx

**File location:** `src/components/preview_panel/SecurityPanel.tsx`

**Current import:**

```tsx
import { VanillaMarkdownParser } from "@/components/chat/AnyonMarkdownParser";
```

**Update to:**

```tsx
import { VanillaMarkdownParser } from "@/components/chat-v2/MarkdownContent";
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (1 line)  
**Impact:** LOW - Security display only

---

## PRIORITY 5: Preview Panel - Part 3 (Line Changes = 1)

### ✏️ src/components/preview_panel/PlanPanel.tsx

**File location:** `src/components/preview_panel/PlanPanel.tsx`

**Current import:**

```tsx
import { VanillaMarkdownParser } from "@/components/chat/AnyonMarkdownParser";
```

**Update to:**

```tsx
import { VanillaMarkdownParser } from "@/components/chat-v2/MarkdownContent";
```

**Status:** 🔴 NOT STARTED  
**Complexity:** 🟡 LOW (1 line)  
**Impact:** LOW - Plan display only

---

## SUMMARY TABLE

| Priority | File              | Lines  | Status | Complexity | Impact   |
| -------- | ----------------- | ------ | ------ | ---------- | -------- |
| 1        | ChatPanel.tsx     | 6      | 🔴     | 🟠 MEDIUM  | CRITICAL |
| 2        | ChatMessage.tsx   | 1      | 🔴     | 🟡 LOW     | MEDIUM   |
| 3        | ChatList.tsx      | 2      | 🔴     | 🟡 LOW     | MEDIUM   |
| 4        | home.tsx          | 1      | 🔴     | 🟡 LOW     | LOW      |
| 5a       | ActionHeader.tsx  | 1      | 🔴     | 🟡 LOW     | LOW      |
| 5b       | SecurityPanel.tsx | 1      | 🔴     | 🟡 LOW     | LOW      |
| 5c       | PlanPanel.tsx     | 1      | 🔴     | 🟡 LOW     | LOW      |
|          | **TOTAL**         | **13** |        |            |          |

---

## INTERNAL CHAT COMPONENT IMPORTS

These are imports within `src/components/chat/` that may need updating if restructuring:

### MessagesList.tsx → ChatMessage

```tsx
import ChatMessage from "./ChatMessage";
```

### ChatMessage.tsx → StreamingLoadingAnimation

```tsx
import { StreamingLoadingAnimation } from "./StreamingLoadingAnimation";
```

(Change to new spinner from chat-v2)

### ChatInput.tsx → Multiple Chat Components

```tsx
import { ChatInputControls } from "../ChatInputControls";
import { AttachmentsList } from "./AttachmentsList";
import { AuxiliaryActionsMenu } from "./AuxiliaryActionsMenu";
import { ChatErrorBox } from "./ChatErrorBox";
import { ContextLimitBanner } from "./ContextLimitBanner";
import { DragDropOverlay } from "./DragDropOverlay";
import { LexicalChatInput } from "./LexicalChatInput";
import { QuestionnaireInput } from "./QuestionnaireInput";
import { SelectedComponentsDisplay } from "./SelectedComponentDisplay";
import { TodoList } from "./TodoList";
```

(These may stay in chat/ or move to chat-v2/)

### HomeChatInput.tsx → Reusable Components

```tsx
import { ChatInputControls } from "../ChatInputControls";
import { LexicalChatInput } from "./LexicalChatInput";
```

(These are reusable across locations)

---

## CHECKLIST

### Phase 1: Planning ✅

- [x] Identify all imports
- [x] Map out dependencies
- [x] Document required props
- [x] Document state atoms

### Phase 2: Implementation 🔄

- [ ] Create chat-v2/ChatPanel
- [ ] Create chat-v2/ChatHeader
- [ ] Create chat-v2/MessagesList
- [ ] Create chat-v2/ChatMessage
- [ ] Create chat-v2/ChatInput
- [ ] Create chat-v2 spinners
- [ ] Create chat-v2 dialogs
- [ ] Create chat-v2/HomeChatInput

### Phase 3: Updates 🔄

- [ ] Update ChatPanel.tsx (6 lines)
- [ ] Update ChatMessage.tsx (1 line)
- [ ] Update ChatList.tsx (2 lines)
- [ ] Update home.tsx (1 line)
- [ ] Update ActionHeader.tsx (1 line)
- [ ] Update SecurityPanel.tsx (1 line)
- [ ] Update PlanPanel.tsx (1 line)

### Phase 4: Testing 🔄

- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run e2e`
- [ ] Chat page loads
- [ ] Messages render
- [ ] Input works
- [ ] Spinner displays
- [ ] Dialogs work
- [ ] Preview panel works
- [ ] Home page works

---

## NOTES

1. **ChatPanel is critical** - It's the main orchestrator. Do this first.

2. **Props must match exactly** - Don't change what ChatPanel passes to children.

3. **State atoms unchanged** - Continue using `chatMessagesByIdAtom`, `isStreamingByIdAtom`, etc.

4. **IPC calls unchanged** - The backend integration is the same.

5. **Some components optional** - VersionPane, ChatError, FreeAgentQuotaBanner can be kept from old chat/ folder if not ready.

---

**Created:** Feb 18, 2026  
**Last Updated:** Feb 18, 2026  
**Status:** Ready for implementation
