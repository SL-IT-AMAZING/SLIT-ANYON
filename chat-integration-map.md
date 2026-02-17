# Chat UI Components - Full Integration Surface Map

## EXECUTIVE SUMMARY

The existing chat UI is composed of **core chat components** used in **ChatPanel** (the main chat view container). The architecture follows a 3-layer pattern:

- **Page/Route Layer** → `ChatPage` (route handler)
- **Container Layer** → `ChatPanel` (layout orchestrator)
- **Component Layer** → `ChatHeader`, `MessagesList`, `ChatInput`, etc.

---

## 1. CORE CHAT COMPONENTS (`src/components/chat/`)

### Main Composition Components

| Component                | Purpose                                      | Used By                            |
| ------------------------ | -------------------------------------------- | ---------------------------------- |
| **ChatPanel.tsx**        | Main container & orchestrator                | `src/routes/chat.tsx` → `ChatPage` |
| **ChatHeader.tsx**       | Top nav bar (version toggle, preview toggle) | `ChatPanel`                        |
| **MessagesList.tsx**     | Virtualized message list                     | `ChatPanel`                        |
| **ChatInput.tsx**        | Input area + action buttons                  | `ChatPanel`                        |
| **ChatMessage.tsx**      | Individual message renderer                  | `MessagesList`                     |
| **LexicalChatInput.tsx** | Lexical editor (contenteditable input)       | `ChatInput`, `HomeChatInput`       |

### Specialized Tool/Message Components

| Component                    | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| **AnyonMarkdownParser.tsx**  | Markdown renderer (exports `VanillaMarkdownParser` variant) |
| **AnyonMcpToolCall.tsx**     | MCP tool invocation display                                 |
| **AnyonMcpToolResult.tsx**   | MCP tool result display                                     |
| **AnyonWebSearch.tsx**       | Web search tool UI                                          |
| **AnyonWebSearchResult.tsx** | Web search result display                                   |
| **AnyonExecuteSql.tsx**      | SQL execution UI                                            |
| **AnyonDatabaseSchema.tsx**  | Database schema display                                     |
| **AnyonCodeSearch.tsx**      | Code search results                                         |
| **AnyonGrep.tsx**            | Grep results display                                        |
| **AnyonEdit.tsx**            | File edit tool UI                                           |
| **AnyonWrite.tsx**           | File write tool UI                                          |
| **AnyonDelete.tsx**          | File delete tool UI                                         |
| **AnyonRead.tsx**            | File read tool UI                                           |
| **AnyonRename.tsx**          | File rename tool UI                                         |
| **AnyonSearchReplace.tsx**   | Search & replace UI                                         |
| **AnyonOutput.tsx**          | Command output display                                      |
| **AnyonStatus.tsx**          | Status message display                                      |
| **AnyonWebCrawl.tsx**        | Web crawl results                                           |
| **AnyonCodebaseContext.tsx** | Codebase context display                                    |
| **AnyonProblemSummary.tsx**  | Problem summary UI                                          |
| **AnyonTokenSavings.tsx**    | Token savings display                                       |
| **AnyonThink.tsx**           | Thinking display                                            |
| **AnyonAddDependency.tsx**   | Add dependency UI                                           |
| **AnyonAddIntegration.tsx**  | Add integration UI                                          |
| **AnyonListFiles.tsx**       | File list display                                           |
| **AnyonLogs.tsx**            | Log display                                                 |
| **AnyonExitPlan.tsx**        | Exit plan UI                                                |
| **AnyonWritePlan.tsx**       | Write plan UI                                               |

### UI Support Components

| Component                         | Purpose                       | Used By                   |
| --------------------------------- | ----------------------------- | ------------------------- |
| **StreamingLoadingAnimation.tsx** | Animated loading spinner      | `ChatMessage`             |
| **ChatError.tsx**                 | Error banner display          | `ChatPanel`               |
| **ChatErrorBox.tsx**              | Error box in messages         | `ChatMessage`             |
| **FreeAgentQuotaBanner.tsx**      | Quota exceeded banner         | `ChatPanel`               |
| **ContextLimitBanner.tsx**        | Context limit warning         | `ChatInput`               |
| **TokenBar.tsx**                  | Token usage indicator         | `ChatInput`               |
| **CodeHighlight.tsx**             | Code syntax highlighting      | Various message renderers |
| **TodoList.tsx**                  | Inline todo list              | `ChatInput`               |
| **UncommittedFilesBanner.tsx**    | Git status banner             | `ChatInput`               |
| **PromoMessage.tsx**              | Promotional message           | `ChatMessage`             |
| **SelectedComponentDisplay.tsx**  | Selected component preview    | `ChatInput`               |
| **AuxiliaryActionsMenu.tsx**      | Auxiliary action menu         | `ChatInput`               |
| **AttachmentsList.tsx**           | File attachments list         | `ChatInput`               |
| **DragDropOverlay.tsx**           | Drag-drop file upload overlay | `ChatInput`               |

### Dialog & Modal Components

| Component                        | Purpose                     | Used By        |
| -------------------------------- | --------------------------- | -------------- |
| **DeleteChatDialog.tsx**         | Delete chat confirmation    | `ChatList.tsx` |
| **RenameChatDialog.tsx**         | Rename chat dialog          | `ChatList.tsx` |
| **QuestionnaireInput.tsx**       | Questionnaire input modal   | `ChatInput`    |
| **SummarizeInNewChatButton.tsx** | Summarize & create new chat | `ChatInput`    |

### Specialized UI Components

| Component                        | Purpose                                                |
| -------------------------------- | ------------------------------------------------------ |
| **ChatActivity.tsx**             | Chat activity indicator (exports `ChatActivityButton`) |
| **HistoryNavigation.tsx**        | Chat history navigation                                |
| **VersionPane.tsx**              | Version/commit history panel                           |
| **OpenCodeTool.tsx**             | OpenCode tool integration                              |
| **FileAttachmentDropdown.tsx**   | File attachment picker                                 |
| **SelectedComponentDisplay.tsx** | Component selection display                            |
| **AnyonSupabaseProjectInfo.tsx** | Supabase project info                                  |
| **AnyonSupabaseTableSchema.tsx** | Supabase table schema                                  |
| **HomeChatInput.tsx**            | Home page chat input                                   |
| **FixAllErrorsButton.tsx**       | Error fixing button                                    |

### Types & Utilities

| File              | Purpose                   |
| ----------------- | ------------------------- |
| **types.d.ts**    | Type definitions for chat |
| **stateTypes.ts** | State machine types       |
| **monaco.ts**     | Monaco editor integration |

---

## 2. CHAT COMPOSITION HIERARCHY

```
ChatPage (src/pages/chat.tsx)
  └─> ChatPanel (src/components/ChatPanel.tsx)
       ├─> ChatHeader
       ├─> MessagesList
       │   └─> ChatMessage (per message)
       │       ├─> StreamingLoadingAnimation
       │       ├─> ChatErrorBox
       │       ├─> AnyonMarkdownParser
       │       ├─> [Tool-specific components]
       │       └─> [Action buttons]
       ├─> ChatError
       ├─> FreeAgentQuotaBanner
       ├─> VersionPane
       └─> ChatInput
           ├─> LexicalChatInput
           ├─> ChatInputControls
           ├─> AttachmentsList
           ├─> DragDropOverlay
           ├─> ContextLimitBanner
           ├─> TokenBar
           ├─> TodoList
           ├─> QuestionnaireInput
           ├─> AuxiliaryActionsMenu
           ├─> SelectedComponentDisplay
           ├─> VisualEditingChangesDialog
           └─> [Action buttons]
```

---

## 3. NON-CHAT COMPONENTS IMPORTING CHAT COMPONENTS

### Component Imports

| File                                               | Imports                                              | Purpose                        |
| -------------------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| **src/components/ChatList.tsx**                    | `DeleteChatDialog`, `RenameChatDialog`               | Sidebar chat list with dialogs |
| **src/components/preview_panel/ActionHeader.tsx**  | `ChatActivityButton` (from `ChatActivity`)           | Activity indicator in preview  |
| **src/components/preview_panel/SecurityPanel.tsx** | `VanillaMarkdownParser` (from `AnyonMarkdownParser`) | Security info display          |
| **src/components/preview_panel/PlanPanel.tsx**     | `VanillaMarkdownParser` (from `AnyonMarkdownParser`) | Plan display                   |

### Page Imports

| File                   | Imports         | Purpose                |
| ---------------------- | --------------- | ---------------------- |
| **src/pages/home.tsx** | `HomeChatInput` | Home page prompt input |

---

## 4. ROUTE/PAGE STRUCTURE

### Chat Route

```
src/routes/chat.tsx (route definition)
  └─> src/pages/chat.tsx (ChatPage)
       └─> src/components/ChatPanel.tsx (renders chat UI)
```

**Chat Route Path:** `/chat`  
**Search Params:** `{ id: number }` (chat ID)

### Home Route

```
src/routes/home.tsx (route definition)
  └─> src/pages/home.tsx (HomePage)
       └─> src/components/chat/HomeChatInput.tsx
```

**Home Route Path:** `/`  
**Search Params:** `{ appId?: number }`

---

## 5. LAYOUT CONTAINERS & PANELS

### ChatPanel Layout Structure

```tsx
<div className="flex flex-col h-full">
  <ChatHeader />
  <div className="flex flex-1 overflow-hidden">
    {!isVersionPaneOpen && (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 relative overflow-hidden">
          <MessagesList />
          {showScrollButton && <ScrollButton />}
        </div>
        <ChatError />
        <FreeAgentQuotaBanner (conditional) />
        <ChatInput />
      </div>
    )}
    <VersionPane isVisible={isVersionPaneOpen} />
  </div>
</div>
```

### Key Layout Features

- **Resizable panels** via `react-resizable-panels`
- **MessagesList is virtualized** (Virtuoso for performance)
- **Panel collapse/expand** for VersionPane
- **Scroll management** with custom scroll-to-bottom button

---

## 6. LOADING & SPINNER COMPONENTS

### Streaming/Loading States

| Component               | Spinner Used                      | State Atom            |
| ----------------------- | --------------------------------- | --------------------- |
| **ChatMessage**         | `StreamingLoadingAnimation`       | `isStreamingByIdAtom` |
| **ChatPanel**           | (indirectly via ChatMessage)      | `isStreamingByIdAtom` |
| **MessagesList**        | N/A                               | (renders ChatMessage) |
| **AnyonCodeSearch**     | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonEdit**           | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonExecuteSql**     | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonGrep**           | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonLogs**           | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonSearchReplace**  | `<Loader animate-spin>` (lucide)  | Internal              |
| **AnyonListFiles**      | `<Loader2 animate-spin>` (lucide) | Internal              |
| **AnyonDatabaseSchema** | `<Loader2 animate-spin>` (lucide) | Internal              |
| **AnyonStatus**         | `<Loader2 animate-spin>` (lucide) | Internal              |
| **HomePage**            | Custom spinner (inline)           | Local state           |

### Spinner Components

- `StreamingLoadingAnimation` - Main chat streaming spinner
- Lucide icons: `Loader`, `Loader2` with `animate-spin` class

---

## 7. STATE MANAGEMENT (JOTAI ATOMS)

### Chat Message State

- `chatMessagesByIdAtom` - Messages by chat ID (Map)
- `isStreamingByIdAtom` - Streaming state by chat ID (Map)
- `chatStreamCountByIdAtom` - Stream count by chat ID

### UI State

- `chatInputValueAtom` - Chat input text
- `isPreviewOpenAtom` - Preview panel open state
- `isChatPanelHiddenAtom` - Chat panel visibility
- `selectedChatIdAtom` - Currently selected chat

### Input State

- `homeChatInputValueAtom` - Home page input value

---

## 8. CHAT-V2 COMPONENTS (NEW)

**Location:** `src/components/chat-v2/`

### Existing Chat-V2 Components

| Component                | Purpose                    |
| ------------------------ | -------------------------- |
| **Thread.tsx**           | Message thread container   |
| **UserMessage.tsx**      | User message renderer      |
| **AssistantMessage.tsx** | Assistant message renderer |
| **MarkdownContent.tsx**  | Markdown content renderer  |
| **ToolCall.tsx**         | Tool call display          |
| **Composer.tsx**         | Message input composer     |
| **ActionBar.tsx**        | Action buttons bar         |
| **Spinner.tsx**          | Loading spinner            |
| **LogoSpinner.tsx**      | Logo-based spinner         |

### Story Files

- All components have `.stories.tsx` versions for Storybook

---

## 9. INTEGRATION ENTRY POINTS (WHERE TO REPLACE)

### Priority 1: Core Components to Replace

```
ChatPanel.tsx imports:
  - ChatHeader ❌
  - MessagesList ❌
  - ChatInput ❌
  - ChatMessage (via MessagesList) ❌
```

### Priority 2: Dialog/Modal Components

```
ChatList.tsx imports:
  - DeleteChatDialog ❌
  - RenameChatDialog ❌
```

### Priority 3: Supporting UI Components

```
Preview Panel imports:
  - ChatActivityButton ❌
  - VanillaMarkdownParser ❌

Home page imports:
  - HomeChatInput ❌
```

### Priority 4: Tool-Specific Renderers

```
ChatMessage renders:
  - AnyonMarkdownParser ❌
  - [All Anyon* tool components] ❌
  - StreamingLoadingAnimation ❌
```

---

## 10. KEY DEPENDENCIES & INTERFACES

### Main Props Contracts

#### ChatPanel

```tsx
interface ChatPanelProps {
  chatId?: number;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
}
```

#### ChatHeader

```tsx
// From ChatPanel.tsx:
<ChatHeader
  isVersionPaneOpen={boolean}
  isPreviewOpen={boolean}
  onTogglePreview={() => void}
  onVersionClick={() => void}
/>
```

#### MessagesList

```tsx
interface MessagesListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  ref: React.RefObject<HTMLDivElement>;
  onAtBottomChange: (atBottom: boolean) => void;
}
```

#### ChatInput

```tsx
interface ChatInputProps {
  chatId?: number;
}
```

#### ChatMessage

```tsx
// From MessagesList:
<ChatMessage message={Message} chatId={number} index={number} />
```

---

## 11. SCROLLING & VIRTUALIZATION

- **MessagesList uses Virtuoso** for virtual scrolling (production)
- **Test mode falls back to manual scroll handling**
- **Scroll-to-bottom button** appears when user scrolls up
- **Auto-scroll during streaming** when user is at bottom
- **Stream complete scroll** to show footer content

---

## 12. INTEGRATION TESTING POINTS

### Key Test Identifiers

```tsx
data-testid="chat-list-container"  // ChatList wrapper
data-testid="search-chats-button"   // Search button
```

### State to Monitor

- `isStreamingByIdAtom` - Toggle during message stream
- `chatMessagesByIdAtom` - Message list updates
- `chatInputValueAtom` - Input value changes

---

## SUMMARY: WHAT NEEDS TO CHANGE

When replacing with chat-v2:

1. **ChatPanel** - Replace core layout orchestration
2. **ChatHeader** - Replace header UI
3. **MessagesList** - Replace message list virtualization
4. **ChatMessage** - Replace individual message rendering
5. **ChatInput** - Replace input area
6. **HomeChatInput** - Replace home page input
7. **All Anyon\* components** - Replace tool-specific renderers
8. **Dialog components** - Replace delete/rename dialogs
9. **Spinner components** - Replace loading indicators
10. **Supporting components** - Replace errors, banners, utilities

**Interface contracts to maintain:**

- Props signatures
- Atom/state integration
- IPC communication paths
- Event handlers (onTogglePreview, etc.)
- Scroll handling mechanics
