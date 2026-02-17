# Chat UI Integration Surface - Complete Documentation

## 📚 Documentation Index

This package contains **4 comprehensive documents** mapping the existing chat UI component integration:

### 1. **MIGRATION_PLAN.md** ⭐ START HERE

**Quick-start guide for replacing chat components**

- Executive summary of what needs to change
- 9 files that import chat components (prioritized)
- Exact line numbers for each import
- Migration steps checklist
- Props interfaces that MUST be maintained

**Best for:** Understanding scope and getting started

---

### 2. **chat-integration-map.md**

**Complete architectural breakdown**

- Full list of all 80+ chat components
- 3-layer component hierarchy
- ChatPanel as the main orchestrator
- State atom usage (Jotai)
- Loading spinner components
- Scroll/virtualization details
- Integration entry points

**Best for:** Understanding the full architecture

---

### 3. **chat-imports-detailed.md**

**Detailed import tracking**

- All direct imports organized by file
- File-by-file import references
- Component prop interfaces
- IPC integration points
- Route integration
- Quick import reference guide

**Best for:** Finding exactly where imports are

---

### 4. **VISUAL_STRUCTURE.md**

**Visual component diagrams**

- ASCII architecture diagrams
- Component tree visualization
- Layout structure drawings
- State flow diagrams
- Layout metrics and sizing
- Message rendering examples

**Best for:** Understanding visual hierarchy

---

## 🎯 Quick Start (5 Minutes)

1. **Read:** MIGRATION_PLAN.md (overview section)
2. **Find:** Files that need updating (table in MIGRATION_PLAN)
3. **Check:** Props interfaces that must match (MIGRATION_PLAN)
4. **Review:** Component hierarchy (VISUAL_STRUCTURE.md)
5. **Start:** Update ChatPanel.tsx imports

---

## 📍 The Core Integration Point

**Single point of change for core chat UI:**

```
src/components/ChatPanel.tsx (6 imports to update)
├─ ChatHeader
├─ MessagesList
├─ ChatInput
├─ VersionPane (optional)
├─ ChatError (optional)
└─ FreeAgentQuotaBanner (optional)
```

All other changes cascade from here.

---

## 📊 Summary Statistics

- **Total chat components:** 80+
- **Files with chat imports:** 9
- **Direct chat imports:** 9
- **Core components to replace:** 5 (ChatPanel, ChatHeader, MessagesList, ChatInput, ChatMessage)
- **Props interfaces:** 4 major ones
- **State atoms:** 6 core ones
- **Spinner components:** 2 main ones

---

## ✅ Must-Keep Contracts

### Props Signatures

```tsx
ChatPanel: { chatId?, isPreviewOpen, onTogglePreview }
ChatHeader: { isVersionPaneOpen, isPreviewOpen, onTogglePreview, onVersionClick }
MessagesList: { messages[], messagesEndRef, ref, onAtBottomChange }
ChatInput: { chatId? }
```

### State Atoms

```tsx
chatMessagesByIdAtom; // Map<chatId, Message[]>
isStreamingByIdAtom; // Map<chatId, boolean>
chatStreamCountByIdAtom; // Map<chatId, number>
chatInputValueAtom; // string
isPreviewOpenAtom; // boolean
isChatPanelHiddenAtom; // boolean
```

### IPC Calls

```tsx
ipc.chat.getChat(chatId);
ipc.chat.createChat(appId);
ipc.chat.deleteChat(chatId);
streamMessage({ prompt, chatId, attachments });
```

---

## 🗂️ File Organization

```
src/
├── components/
│   ├── ChatPanel.tsx                    ← UPDATE IMPORTS
│   ├── ChatList.tsx                     ← UPDATE IMPORTS (2 lines)
│   ├── chat/                            ← OLD COMPONENTS (being replaced)
│   │   ├── ChatHeader.tsx
│   │   ├── MessagesList.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── HomeChatInput.tsx
│   │   ├── DeleteChatDialog.tsx
│   │   ├── RenameChatDialog.tsx
│   │   ├── StreamingLoadingAnimation.tsx
│   │   └── [80+ other chat components]
│   ├── chat-v2/                         ← NEW COMPONENTS (to create/fill)
│   │   ├── Thread.tsx
│   │   ├── UserMessage.tsx
│   │   ├── AssistantMessage.tsx
│   │   ├── MarkdownContent.tsx
│   │   ├── Composer.tsx
│   │   ├── Spinner.tsx
│   │   ├── LogoSpinner.tsx
│   │   └── [more to add]
│   └── preview_panel/
│       ├── ActionHeader.tsx             ← UPDATE IMPORTS (1 line)
│       └── [PlanPanel, SecurityPanel]   ← UPDATE IMPORTS (2 lines)
├── pages/
│   ├── chat.tsx                         ← No changes
│   └── home.tsx                         ← UPDATE IMPORTS (1 line)
└── atoms/
    └── chatAtoms.ts                     ← Use in new components
```

---

## 🔄 Update Workflow

### Phase 1: Preparation

- [ ] Review MIGRATION_PLAN.md
- [ ] Review VISUAL_STRUCTURE.md
- [ ] Identify which chat-v2 components exist
- [ ] Identify which need to be created

### Phase 2: Create chat-v2 Components

- [ ] ChatPanel wrapper (orchestrator)
- [ ] ChatHeader (with same props)
- [ ] MessagesList (with same props)
- [ ] ChatMessage renderer
- [ ] ChatInput (with same props)
- [ ] Spinners (Spinner.tsx, LogoSpinner.tsx)
- [ ] Dialogs (DeleteChatDialog, RenameChatDialog)
- [ ] HomeChatInput
- [ ] Supporting utilities

### Phase 3: Update Imports

- [ ] ChatPanel.tsx (6 imports)
- [ ] ChatList.tsx (2 imports)
- [ ] home.tsx (1 import)
- [ ] preview_panel/\* (2 imports)

### Phase 4: Test

- [ ] Build: `npm run build`
- [ ] E2E Tests: `npm run e2e`
- [ ] Manual: Test chat page, home page, dialogs

---

## 📋 Checklist: Files to Update

| Priority | File              | Changes          | Lines |
| -------- | ----------------- | ---------------- | ----- |
| 🔴 High  | ChatPanel.tsx     | Update 6 imports | 10-15 |
| 🟠 Med   | ChatList.tsx      | Update 2 imports | 7-8   |
| 🟠 Med   | home.tsx          | Update 1 import  | 4     |
| 🟡 Low   | ActionHeader.tsx  | Update 1 import  | TBD   |
| 🟡 Low   | SecurityPanel.tsx | Update 1 import  | TBD   |
| 🟡 Low   | PlanPanel.tsx     | Update 1 import  | TBD   |

---

## 🚀 Next Steps

1. **Read documentation** (start with MIGRATION_PLAN.md)
2. **Create chat-v2 components** (start with ChatPanel)
3. **Update imports** (start with ChatPanel.tsx)
4. **Run tests** (`npm run build && npm run e2e`)
5. **Verify UI** (chat page, home page, dialogs)

---

## 💡 Key Insights

1. **ChatPanel is the main integration point** - If you replace it correctly, most other changes follow naturally

2. **Props interfaces are strict** - The chat-v2 components MUST accept the same props as the old ones to work with existing parent components

3. **State atoms are shared** - All chat-v2 components should use the same Jotai atoms for state (chatMessagesByIdAtom, etc.)

4. **IPC calls are unchanged** - The backend integration via `ipc.chat.*` stays the same

5. **Tool components can stay** - You can keep the old Anyon\* tool rendering components and just wrap them in new message renderers

---

## 📞 Questions?

- For architecture: See VISUAL_STRUCTURE.md
- For imports: See chat-imports-detailed.md
- For component details: See chat-integration-map.md
- For migration: See MIGRATION_PLAN.md

All documents cross-reference each other.
