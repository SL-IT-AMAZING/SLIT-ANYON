# Chat UI Integration - Quick Reference Card

## 🎯 TL;DR - What You Need to Know

**The chat UI lives in `src/components/ChatPanel.tsx`.**

This one file imports 6 chat components that need to be replaced:

- ChatHeader
- MessagesList
- ChatInput
- VersionPane
- ChatError
- FreeAgentQuotaBanner

Change those 6 imports from `./chat/` to `./chat-v2/` and you're mostly done.

---

## 📍 The 9 Files to Update (In Order)

| #   | File                                             | Imports | Action                       |
| --- | ------------------------------------------------ | ------- | ---------------------------- |
| 1️⃣  | `src/components/ChatPanel.tsx`                   | 6       | Update lines 10-15           |
| 2️⃣  | `src/components/ChatMessage.tsx`                 | 1       | Update spinner import        |
| 3️⃣  | `src/components/ChatList.tsx`                    | 2       | Update lines 7-8             |
| 4️⃣  | `src/pages/home.tsx`                             | 1       | Update line 4                |
| 5️⃣  | `src/components/preview_panel/ActionHeader.tsx`  | 1       | Update ChatActivityButton    |
| 6️⃣  | `src/components/preview_panel/SecurityPanel.tsx` | 1       | Update VanillaMarkdownParser |
| 7️⃣  | `src/components/preview_panel/PlanPanel.tsx`     | 1       | Update VanillaMarkdownParser |

---

## 🔧 The 6 Core Component Changes

### 1. ChatHeader

```tsx
// OLD
import { ChatHeader } from "./chat/ChatHeader";
// NEW
import { ChatHeader } from "./chat-v2/ChatHeader";
```

**Must provide props:** `isVersionPaneOpen`, `isPreviewOpen`, `onTogglePreview`, `onVersionClick`

### 2. MessagesList

```tsx
// OLD
import { MessagesList } from "./chat/MessagesList";
// NEW
import { MessagesList } from "./chat-v2/MessagesList";
```

**Must provide props:** `messages`, `messagesEndRef`, `ref`, `onAtBottomChange`

### 3. ChatInput

```tsx
// OLD
import { ChatInput } from "./chat/ChatInput";
// NEW
import { ChatInput } from "./chat-v2/ChatInput";
```

**Must provide props:** `chatId` (optional)

### 4. VersionPane (Optional)

```tsx
// Can keep old or update
import { VersionPane } from "./chat/VersionPane";
// OR new
import { VersionPane } from "./chat-v2/VersionPane";
```

### 5. ChatError (Optional)

```tsx
// Can keep old or update
import { ChatError } from "./chat/ChatError";
// OR new
import { ChatError } from "./chat-v2/ChatError";
```

### 6. FreeAgentQuotaBanner (Optional)

```tsx
// Probably keep old
import { FreeAgentQuotaBanner } from "./chat/FreeAgentQuotaBanner";
```

---

## 🧪 What Must Stay the Same

### Props Contracts

```tsx
// ChatPanel props - NEVER CHANGE
<ChatPanel
  chatId={number | undefined}
  isPreviewOpen={boolean}
  onTogglePreview={() => void}
/>

// ChatHeader props - NEVER CHANGE
<ChatHeader
  isVersionPaneOpen={boolean}
  isPreviewOpen={boolean}
  onTogglePreview={() => void}
  onVersionClick={() => void}
/>

// MessagesList props - NEVER CHANGE
<MessagesList
  messages={Message[]}
  messagesEndRef={React.RefObject<HTMLDivElement>}
  ref={React.RefObject<HTMLDivElement>}
  onAtBottomChange={(atBottom: boolean) => void}
/>

// ChatInput props - NEVER CHANGE
<ChatInput chatId={number | undefined} />
```

### State Atoms (Use in new components)

```tsx
import {
  chatMessagesByIdAtom, // Messages by chat ID
  isStreamingByIdAtom, // Is currently streaming
  chatStreamCountByIdAtom, // Count of streams
  chatInputValueAtom, // Current input text
  isPreviewOpenAtom, // Preview panel state
  isChatPanelHiddenAtom, // Chat panel visibility
} from "@/atoms/chatAtoms";
```

### IPC Calls

```tsx
import { ipc } from "@/ipc/types";

// These all must still work:
await ipc.chat.getChat(chatId);
await ipc.chat.createChat(appId);
await ipc.chat.deleteChat(chatId);
streamMessage({ prompt, chatId, attachments });
```

---

## 📊 Component Architecture at a Glance

```
ChatPage
  ↓
ChatPanel ← UPDATE IMPORTS HERE (6 lines)
  ├─ ChatHeader ← new from chat-v2/ChatHeader
  ├─ MessagesList ← new from chat-v2/MessagesList
  │   └─ ChatMessage ← uses new spinner from chat-v2/
  ├─ ChatInput ← new from chat-v2/ChatInput
  │   └─ LexicalChatInput (reusable)
  ├─ ChatError ← keep or new from chat-v2/
  ├─ FreeAgentQuotaBanner ← keep from chat/
  └─ VersionPane ← keep or new from chat-v2/
```

---

## ⚡ 5-Minute Implementation

1. Create `src/components/chat-v2/ChatHeader.tsx` with same props
2. Create `src/components/chat-v2/MessagesList.tsx` with same props
3. Create `src/components/chat-v2/ChatInput.tsx` with same props
4. Update imports in ChatPanel.tsx (6 lines)
5. Test: `npm run build && npm run e2e`

---

## 🚨 Common Mistakes to Avoid

❌ **Wrong:** Changing the props that ChatPanel passes
✅ **Right:** Keep props identical, just change how they're rendered

❌ **Wrong:** Creating new atoms for state
✅ **Right:** Use existing atoms from `@/atoms/chatAtoms`

❌ **Wrong:** Changing how ChatInput integrates with IPC
✅ **Right:** Keep IPC calls the same, just update UI

❌ **Wrong:** Moving MessagesList virtualization logic
✅ **Right:** Maintain Virtuoso integration or similar

---

## 📁 File Locations

**Main file to update:**

```
src/components/ChatPanel.tsx (lines 10-15)
```

**New components location:**

```
src/components/chat-v2/
```

**Old components (being replaced):**

```
src/components/chat/
```

**State to use:**

```
src/atoms/chatAtoms.ts
```

**IPC integration:**

```
src/ipc/types/index.ts
```

---

## 🎪 Quick Test Checklist

After updating:

- [ ] Page loads without errors
- [ ] Chat messages render
- [ ] Input accepts text
- [ ] Send button works
- [ ] Spinner shows during streaming
- [ ] Messages appear in list
- [ ] Home page input works
- [ ] Dialogs open/close
- [ ] Preview panel toggles

---

## 📖 Need More Detail?

| Question                             | Document                 |
| ------------------------------------ | ------------------------ |
| "What's the full component tree?"    | VISUAL_STRUCTURE.md      |
| "Where exactly are all the imports?" | chat-imports-detailed.md |
| "What are all 80+ components?"       | chat-integration-map.md  |
| "What's my migration plan?"          | MIGRATION_PLAN.md        |
| "How does it all fit together?"      | CHAT_UI_INTEGRATION.md   |

---

## 💡 Pro Tips

1. **Start with ChatPanel** - It's the orchestrator. Get it right and everything else follows.

2. **Keep props identical** - The parent components expect specific props. Change behavior, not interface.

3. **Use existing state** - Don't create new atoms. Use `chatMessagesByIdAtom`, `isStreamingByIdAtom`, etc.

4. **IPC stays same** - Backend integration doesn't change. Just the UI rendering.

5. **Test incrementally** - Replace one component at a time, test, then move to next.

---

## 🔗 Related Files

- `src/components/ChatPanel.tsx` - Main integration point
- `src/components/ChatList.tsx` - Dialogs integration
- `src/pages/home.tsx` - Home input integration
- `src/pages/chat.tsx` - Route (no changes)
- `src/atoms/chatAtoms.ts` - State atoms
- `src/ipc/types/index.ts` - IPC integration

---

**Last Updated:** Feb 18, 2026  
**Status:** Ready for integration  
**Difficulty:** Medium (component replacement)  
**Time Estimate:** 4-6 hours for full integration
