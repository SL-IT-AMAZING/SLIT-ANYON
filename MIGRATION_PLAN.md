# Chat UI v2 Migration Plan - Quick Start Guide

## 📋 Overview

You need to replace existing chat components with new chat-v2 components. This document shows you **exactly which files import what** so you know where to update imports.

---

## 🎯 The Integration Surface (At a Glance)

### **Entry Point: ChatPanel**

```
ChatPanel (src/components/ChatPanel.tsx)
├── Currently imports from src/components/chat/
└── Needs to import from src/components/chat-v2/ instead
```

**Single point of change** for the core chat UI!

---

## 📍 Files to Update (Ranked by Priority)

### **PRIORITY 1: Core Chat Panel (1 file - 6 imports)**

```
src/components/ChatPanel.tsx
  ├─ ChatHeader              → Replace with chat-v2 version
  ├─ MessagesList            → Replace with chat-v2 version
  ├─ ChatInput               → Replace with chat-v2 version
  ├─ VersionPane             → Keep or replace?
  ├─ ChatError               → Replace with chat-v2 version
  └─ FreeAgentQuotaBanner    → Replace or keep?
```

**Action:** Update 6 import statements in ChatPanel.tsx

---

### **PRIORITY 2: Message Rendering (3 files)**

```
src/components/chat/MessagesList.tsx
  └─ ChatMessage  → Will be replaced when ChatPanel updated

src/components/chat/ChatMessage.tsx
  └─ StreamingLoadingAnimation  → Replace with chat-v2/Spinner or LogoSpinner

src/components/chat/ChatInput.tsx
  └─ 11 supporting components → Many can be kept, some replaced
```

**Action:** Update ChatMessage to use new spinner

---

### **PRIORITY 3: Chat List Dialogs (1 file - 2 imports)**

```
src/components/ChatList.tsx
  ├─ DeleteChatDialog    → Keep or move to chat-v2?
  └─ RenameChatDialog    → Keep or move to chat-v2?
```

**Action:** Update 2 imports if dialogs move

---

### **PRIORITY 4: Home Page Input (1 file - 1 import)**

```
src/pages/home.tsx
  └─ HomeChatInput  → Replace with chat-v2 version
```

**Action:** Update 1 import

---

### **PRIORITY 5: Preview Panel Utilities (2 files - 2 imports)**

```
src/components/preview_panel/ActionHeader.tsx
  └─ ChatActivityButton         → Replace or keep?

src/components/preview_panel/SecurityPanel.tsx
  └─ VanillaMarkdownParser      → Replace with chat-v2 version
```

**Action:** Update imports if components move

---

## 🗂️ Complete File List with Line Numbers

### Direct imports (will need updating)

| File          | Line | Import               | Component                                |
| ------------- | ---- | -------------------- | ---------------------------------------- |
| ChatPanel.tsx | 10   | ChatHeader           | src/components/chat/ChatHeader           |
| ChatPanel.tsx | 11   | MessagesList         | src/components/chat/MessagesList         |
| ChatPanel.tsx | 12   | ChatInput            | src/components/chat/ChatInput            |
| ChatPanel.tsx | 13   | VersionPane          | src/components/chat/VersionPane          |
| ChatPanel.tsx | 14   | ChatError            | src/components/chat/ChatError            |
| ChatPanel.tsx | 15   | FreeAgentQuotaBanner | src/components/chat/FreeAgentQuotaBanner |
| ChatList.tsx  | 7    | DeleteChatDialog     | src/components/chat/DeleteChatDialog     |
| ChatList.tsx  | 8    | RenameChatDialog     | src/components/chat/RenameChatDialog     |
| home.tsx      | 4    | HomeChatInput        | src/components/chat/HomeChatInput        |

---

## 🔄 Component Dependency Chain

```
ChatPage (src/pages/chat.tsx) [Read-only]
  ↓
ChatPanel (UPDATE IMPORTS HERE) ← Main integration point
  ├─ ChatHeader (UPDATE)
  ├─ MessagesList (UPDATE)
  │  └─ ChatMessage (UPDATE spinner)
  ├─ ChatInput (UPDATE)
  ├─ ChatError (UPDATE)
  └─ FreeAgentQuotaBanner (UPDATE OR KEEP)
```

---

## ✅ What Needs to Stay the Same

### Props Interfaces (MUST match)

```tsx
// ChatPanel - MUST keep these props
interface ChatPanelProps {
  chatId?: number;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
}

// ChatInput - MUST keep these props
interface ChatInputProps {
  chatId?: number;
}

// ChatHeader - MUST keep these props
<ChatHeader
  isVersionPaneOpen={boolean}
  isPreviewOpen={boolean}
  onTogglePreview={() => void}
  onVersionClick={() => void}
/>

// MessagesList - MUST keep these props
<MessagesList
  messages={Message[]}
  messagesEndRef={React.RefObject<HTMLDivElement>}
  ref={React.RefObject<HTMLDivElement>}
  onAtBottomChange={(atBottom: boolean) => void}
/>
```

### State Management

```tsx
// These atoms MUST be used by chat-v2 components
import {
  chatMessagesByIdAtom, // Map<chatId, Message[]>
  isStreamingByIdAtom, // Map<chatId, boolean>
  chatStreamCountByIdAtom, // Map<chatId, number>
  chatInputValueAtom, // string
  isPreviewOpenAtom, // boolean
  isChatPanelHiddenAtom, // boolean
} from "@/atoms/chatAtoms";
```

### IPC Calls

```tsx
// These IPC calls MUST still work
import { ipc } from "@/ipc/types";

// Examples:
await ipc.chat.getChat(chatId);
await ipc.chat.createChat(appId);
await ipc.chat.deleteChat(chatId);
streamMessage({ prompt, chatId, attachments });
```

---

## 📊 Summary of Changes

| Category                     | Count | Priority  |
| ---------------------------- | ----- | --------- |
| Files to update imports      | 9     | 🔴 High   |
| Direct chat imports          | 9     | 🔴 High   |
| Props interfaces to maintain | 4     | 🟠 Medium |
| State atoms to use           | 6     | 🟠 Medium |
| IPC calls to support         | 4+    | 🟠 Medium |

---

## 🚀 Migration Steps

### Step 1: Create chat-v2 replacement components

- [ ] ChatPanel component
- [ ] ChatHeader component
- [ ] MessagesList component
- [ ] ChatMessage component
- [ ] ChatInput component
- [ ] Spinner/Loading component
- [ ] Dialog components
- [ ] HomeChatInput component

### Step 2: Update imports in ChatPanel.tsx (MAIN CHANGE)

```tsx
// OLD
import { ChatHeader } from "./chat/ChatHeader";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { VersionPane } from "./chat/VersionPane";
import { ChatError } from "./chat/ChatError";
import { FreeAgentQuotaBanner } from "./chat/FreeAgentQuotaBanner";

// NEW
import { ChatHeader } from "./chat-v2/ChatHeader";
import { MessagesList } from "./chat-v2/MessagesList";
import { ChatInput } from "./chat-v2/ChatInput";
import { VersionPane } from "./chat-v2/VersionPane"; // or keep from chat/
import { ChatError } from "./chat-v2/ChatError"; // or keep from chat/
import { FreeAgentQuotaBanner } from "./chat/FreeAgentQuotaBanner"; // keep?
```

### Step 3: Update ChatList.tsx (2 imports)

```tsx
// Update dialog imports if moved to chat-v2
import { DeleteChatDialog } from "@/components/chat-v2/DeleteChatDialog";
import { RenameChatDialog } from "@/components/chat-v2/RenameChatDialog";
```

### Step 4: Update home.tsx (1 import)

```tsx
import { HomeChatInput } from "@/components/chat-v2/HomeChatInput";
```

### Step 5: Update preview panels (2 imports)

```tsx
// ActionHeader.tsx
import { ChatActivityButton } from "@/components/chat-v2/ChatActivity";

// SecurityPanel.tsx + PlanPanel.tsx
import { VanillaMarkdownParser } from "@/components/chat-v2/MarkdownContent";
```

### Step 6: Test

- [ ] Chat page loads
- [ ] Messages render
- [ ] Input works
- [ ] Spinner shows during streaming
- [ ] Dialogs open/close
- [ ] Home page input works

---

## 🎯 Quick Checklist

### Must Update (Core)

- [x] Identify all chat imports
- [ ] Create chat-v2/ChatPanel
- [ ] Create chat-v2/ChatHeader
- [ ] Create chat-v2/MessagesList
- [ ] Create chat-v2/ChatMessage
- [ ] Create chat-v2/ChatInput
- [ ] Create chat-v2 spinners
- [ ] Update ChatPanel.tsx imports (6 lines)
- [ ] Test chat page

### Should Update (Supporting)

- [ ] Create chat-v2 dialogs
- [ ] Update ChatList.tsx imports (2 lines)
- [ ] Update home.tsx import (1 line)
- [ ] Update preview panel imports (2 lines)

### Optional (Can Keep Old)

- [ ] VersionPane (might keep from old chat/)
- [ ] FreeAgentQuotaBanner (might keep from old chat/)
- [ ] Tool-specific components (Anyon\*)

---

## 📌 Key Files to Know

```
src/pages/chat.tsx              ← Route page (no changes needed)
src/components/ChatPanel.tsx    ← MAIN FILE TO UPDATE (6 imports)
src/components/ChatList.tsx     ← Update if dialogs move (2 imports)
src/pages/home.tsx              ← Update input import (1 import)
src/components/chat/            ← OLD components (being replaced)
src/components/chat-v2/         ← NEW components (to create)
src/atoms/chatAtoms.ts          ← State atoms (use in new components)
src/ipc/types/index.ts          ← IPC calls (use in new components)
```

---

## 🔗 Related Documentation

- See `chat-integration-map.md` for complete component hierarchy
- See `chat-imports-detailed.md` for all import locations
- Test with `npm run build && npm run e2e` after changes
