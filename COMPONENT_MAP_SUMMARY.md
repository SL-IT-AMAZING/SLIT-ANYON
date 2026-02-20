# ANYON Component Map - Quick Reference

## 🎯 What You Have

A fully-featured **Electron + React AI IDE** with:

- **180+ domain-specific components**
- **55+ primitive UI components** (Base UI/Radix)
- **Rich chat interface** with streaming, proposals, code handling
- **Visual app builder** with live preview & editing
- **Advanced settings & integrations** (GitHub, Vercel, Supabase, Neon)
- **Multi-provider LLM support** (OpenAI, Claude, custom models)
- **Git-integrated workflow** (branch management, version history)

---

## 📊 COMPONENT BREAKDOWN BY CATEGORY

### 1. CHAT CORE (11 components)

- **ChatInput** - Main message input box
- **ChatMessage** - Individual message bubble
- **MessagesList** - Virtualized message history
- **ChatHeader** - Top controls (branch, preview toggle)
- **ChatError** - Error alerts
- **StreamingLoadingAnimation** - Loading indicator
- **LexicalChatInput** - Rich text editor
- **TokenBar** - Token budget visualization
- **ChatList** - Sidebar chat history
- **ChatPanel** - Main chat container
- **QuestionnaireInput** - Guided input

### 2. FILE & CONTEXT MANAGEMENT (4 components)

- **AttachmentsList** - Attached files display
- **ContextFilesPicker** - File selection dialog
- **FileAttachmentDropdown** - Quick attach menu
- **DragDropOverlay** - Drag feedback

### 3. BANNERS & STATE (5 components)

- **FreeAgentQuotaBanner** - Quota warning
- **ContextLimitBanner** - Token limit warning
- **UncommittedFilesBanner** - Pending changes
- **SetupBanner** - Configuration reminder
- **SubscriptionBanner** - Plan/trial info

### 4. NAVIGATION (4 components)

- **app-sidebar** - Main app sidebar
- **AppList** - App selector
- **appItem** - Single app entry
- **ChatList** - Chat history

### 5. PREVIEW & VISUAL EDITING (13 components)

- **PreviewPanel** - Main preview container
- **PreviewIframe** - App preview (53KB - massive!)
- **VisualEditingToolbar** - CSS property editor
- **Console** - Console output
- **FileTree** - Project browser
- **FileEditor** - Code editor
- **Problems** - Error list
- **SecurityPanel** - Security audit
- **ConfigurePanel** - App config
- **PublishPanel** - Deploy UI
- **CodeView** - Code display
- **VisualEditingChangesDialog** - Changes review
- **ActionHeader** - Panel header

### 6. SETTINGS & CONFIGURATION (7 components)

- **ProviderSettingsPage** - Model provider config
- **ModelsSection** - Language models list
- **ApiKeyConfiguration** - API key input
- **ToolsMcpSettings** - Tool management
- **VertexConfiguration** - Vertex AI config
- **AzureConfiguration** - Azure config
- **SettingsList** - Settings navigation

### 7. DIALOGS & MODALS (15+ components)

- **CreateAppDialog** - Create app wizard
- **ImportAppDialog** - Import app
- **AppSearchDialog** - Search apps
- **CreatePromptDialog** - Create prompt
- **CreateCustomModelDialog** - Define model
- **CustomThemeDialog** - Theme editor
- **BugScreenshotDialog** - Bug report
- **HelpDialog** - Help/docs
- **ConfirmationDialog** - Generic confirm
- **DeleteChatDialog** - Delete confirmation
- **RenameChatDialog** - Rename dialog
- **AnyonProTrialDialog** - Trial prompt
- And 5+ more...

### 8. AUTHENTICATION (2 components)

- **AccountMenu** - User account dropdown
- **LoginDialog** - Login/signup modal

### 9. SELECTORS & PICKERS (10 components)

- **ModelPicker** - LLM selection
- **AgentPicker** - Agent type
- **ChatModeSelector** - Basic vs Agent
- **LanguageSelector** - UI language
- **ZoomSelector** - Preview zoom
- **ThinkingBudgetSelector** - Token limit
- **MaxChatTurnsSelector** - Conversation length
- **ReleaseChannelSelector** - Channel selection
- **RuntimeModeSelector** - Node/Browser
- **NodePathSelector** - Node.js version

### 10. FEATURE TOGGLES (5 components)

- **AutoApproveSwitch** - Auto-execute
- **AutoExpandPreviewSwitch** - Auto-open preview
- **ChatCompletionNotificationSwitch** - Toast notification
- **AutoUpdateSwitch** - Auto-update
- **TelemetrySwitch** - Analytics opt-in

### 11. MESSAGE HANDLERS (30+ components)

Specialized renderers for AI response content:

- **AnyonMarkdownParser** - Markdown rendering
- **AnyonProblemSummary** - Error summaries
- **AnyonCodeSearchResult** - Search results
- **AnyonWrite** - Code modifications
- **AnyonExecuteSql** - SQL queries
- **AnyonWebSearch** - Web results
- **AnyonMcpToolCall** - Tool calls
- **AnyonThink** - Reasoning steps
- And 20+ more specialized handlers...

### 12. NOTIFICATIONS & TOASTS (5 components)

- **CustomErrorToast** - Error notification
- **InputRequestToast** - User input prompt
- **McpConsentToast** - Tool approval
- **LocalAgentNewChatToast** - New chat notification
- **TelemetryBanner** - Privacy notice

### 13. CONNECTORS & INTEGRATIONS (8+ components)

- **GitHubConnector/Integration** - GitHub OAuth
- **VercelConnector/Integration** - Vercel deploy
- **SupabaseConnector/Integration** - Supabase DB
- **NeonConnector/Integration** - Neon PostgreSQL
- **ProviderConnectDialog** - Generic OAuth flow
- **GithubBranchManager** - Branch management
- **GithubCollaboratorManager** - Team management

### 14. UTILITY COMPONENTS (6 components)

- **ErrorBoundary** - Error catching
- **CodeHighlight** - Syntax highlighting
- **TodoList** - Checklist rendering
- **VersionPane** - Git history
- **PromoMessage** - Feature promotion
- **OpenCodeTool** - External editor

### 15. UI PRIMITIVES (30+ components)

Base styled components from Base UI/Radix:

- Buttons, Cards, Inputs
- Modals, Dropdowns, Popovers
- Tabs, Accordions, Sidebars
- Tooltips, Badges, Separators
- Checkboxes, Radios, Switches
- Custom: ColorPicker, NumberInput, LoadingBar, SimpleAvatar

---

## 🎨 KEY VISUAL CHARACTERISTICS

### Color System

```
Token Budget (Stacked Bar):
├─ Message History → Blue-400
├─ Codebase Context → Green-400
├─ Mentioned Apps → Orange-400
├─ System Prompt → Yellow-400
└─ User Input → Purple-400

Status Colors:
├─ Error → Red (bg-100, border-500, text-600)
├─ Warning → Amber/Yellow
├─ Success → Green
└─ Info → Blue/Cyan
```

### Layout Patterns

```
Main App:
├─ Sidebar (collapsible, offcanvas on mobile)
│  ├─ Logo header
│  ├─ Navigation items
│  ├─ Chat list (with favorites)
│  ├─ Account menu
│  └─ Subscription banner
├─ Chat Panel (flex-col, full height)
│  ├─ ChatHeader (with branch/preview toggle)
│  ├─ MessagesList (virtualized, max-3xl, centered)
│  ├─ Scroll-to-bottom button
│  └─ ChatInput (responsive height)
└─ Preview Panel (resizable, PanelGroup)
   ├─ PreviewIframe (main)
   ├─ Console (collapsible)
   ├─ Code/File/Problems tabs
   └─ Resize handle
```

### Animation Patterns

- **Streaming**: Verb-based text animation + scramble effect
- **Loading**: Skeleton shimmer + LoadingBar progress
- **Transitions**: Framer Motion for smooth state changes
- **Hover**: Group hover effects on message cards
- **Collapse**: Smooth expand/collapse with transitions

---

## 💡 DESIGN SYSTEM QUICK WINS

### 1. TokenBar is a Masterclass

- Horizontal stacked bar chart (5 segments)
- Tooltip on hover shows breakdown
- Real-time updates with useAtom
- Color-coded for understanding context

### 2. Streaming Loading Animation is Delightful

- 30+ random action verbs
- Scramble effect (char-by-char reveal)
- No spinner icons—text-based
- Makes waiting feel less annoying

### 3. Message Bubbles Have Good UX

- Left/right layout clearly shows role
- Copy button appears on hover
- Timestamps intelligently formatted
- Status indicators (pending, success, error)
- Version hash on AI messages

### 4. Sidebar is Smart

- Offcanvas mode on mobile
- App/chat list with favorites
- Hover previews of chat titles
- Clean icon system

### 5. Error Handling is Comprehensive

- ChatError for inline alerts
- ChatErrorBox for detailed info
- Toast notifications for global errors
- Banner-based warnings (quota, token limit)

---

## 🚀 HIGHEST-VALUE COMPONENTS FOR DESIGN SYSTEM

### Must Document First:

1. **TokenBar** - Complex visualization pattern
2. **ChatMessage** - Core message UI with states
3. **StreamingLoadingAnimation** - Delightful UX
4. **ModelPicker** - Advanced searchable selector
5. **PreviewPanel** - Complex layout with tabs
6. **VisualEditingToolbar** - Property editor pattern
7. **Console** - Terminal-like UI with filtering
8. **AuxiliaryActionsMenu** - Nested menu complexity

### Most Complex:

- **PreviewIframe.tsx** (53KB) - Sandbox app preview
- **SecurityPanel.tsx** (32KB) - Permissions audit
- **AnyonMarkdownParser.tsx** (20KB) - Custom markdown
- **ToolsMcpSettings.tsx** (18KB) - Tool management
- **VisualEditingToolbar.tsx** (17KB) - CSS editor

---

## 📦 DESIGN TOKENS YOU'LL NEED

### Colors

- Primary action colors
- Error/warning/success/info
- Semantic colors (border, background variants)
- Token chart colors (blue, green, orange, yellow, purple)

### Spacing

- Gap scale (gap-1, gap-2, gap-4, etc.)
- Padding scale (px-2, px-4, px-8, etc.)
- Common: px-4, py-2, gap-2, gap-4

### Typography

- Monospace for code (CodeHighlight)
- Default body for text
- Heading sizes (h1-h6 for dialog titles, section headers)
- Timestamp: muted-foreground, small size
- Error: text-red-600

### Components Sizing

- Icons: Mostly 16px, some 24px (larger actions)
- Buttons: Standard height ~36px
- Input: Standard height ~32px
- TokenBar: Height 1.5px (line)
- Message bubbles: max-85% width for user, max-3xl for assistant

---

## 🔄 STATE MANAGEMENT PATTERNS

### Global State (Jotai Atoms)

```typescript
// Chat atoms
chatInputValueAtom;
chatMessagesByIdAtom;
selectedChatIdAtom;
isStreamingByIdAtom;

// App atoms
selectedAppIdAtom;
appConsoleEntriesAtom;
previewModeAtom;

// UI atoms
dropdownOpenAtom;
previewPanelKeyAtom;
isAnyCheckoutVersionInProgressAtom;
```

### Local Component State

- Dialog open/close states
- Menu open/close
- Hover states
- Form input values
- Collapse/expand states

### Server State (TanStack Query)

- `useChats(appId)` - Chat list
- `useSettings()` - User settings
- `useStreamChat()` - Message streaming
- `useVersions(appId)` - Git history
- `useLanguageModelsByProviders()` - Model list

---

## 🎯 COMPONENT USAGE GUIDELINES

### DO:

- Use hooks for IPC calls (e.g., `useChats`, `useSettings`)
- Handle errors with toast notifications
- Use Jotai atoms for UI state
- Wrap in error boundaries
- Keep components focused and composable

### DON'T:

- Call IPC directly (use hooks)
- Return `{ success: false }` — throw errors instead
- Put server state in Jotai
- Forget `useAtomValue` vs `useAtom` distinctions
- Leave loading states unlabeled

---

## 📋 IMPLEMENTATION CHECKLIST FOR DESIGN SYSTEM

- [ ] Document color tokens (with examples)
- [ ] Document typography hierarchy
- [ ] Create TokenBar component spec
- [ ] Create ChatMessage variants (user, ai, error, streaming)
- [ ] Document spacing scale
- [ ] Create animation specifications
- [ ] Document icon sizes and usage
- [ ] Create form input guidelines
- [ ] Document modal/dialog patterns
- [ ] Create accessibility guidelines
- [ ] Document responsive breakpoints
- [ ] Create theme switching guide
- [ ] Document Jotai atom naming
- [ ] Create error state patterns
- [ ] Document loading state patterns

---

## 📌 FILES PROVIDED

1. **DESIGN_SYSTEM_MAP.md** - Detailed component documentation (this file's source)
2. **COMPONENT_INVENTORY.csv** - Quick reference table (97 components listed)
3. **This file** - Quick reference summary

Use these files to build your design system documentation!
