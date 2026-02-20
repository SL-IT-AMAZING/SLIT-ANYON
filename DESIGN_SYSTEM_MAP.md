# ANYON Design System: Complete Component Map

## 📊 Overview

**Total Components Mapped:** 81 root-level + 64 chat-specific + 22 preview-panel + 7 settings + 4 auth + 2 subscription = **180+ domain-specific components**

**Tech Stack:**

- React 18 + TypeScript
- TanStack Router (not Next.js/React Router)
- Jotai (state management)
- Lucide React (icons)
- Base UI + Radix UI (unstyled primitives)
- Framer Motion (animations)
- Lexical (rich text editor)

---

## 🎯 CHAT INTERFACE (src/components/chat/)

### Core Chat Components

#### **ChatInput.tsx** (34KB)

- **Purpose:** Main message input with streaming, file attachments, proposals
- **Key Features:**
  - Lexical-based rich text editor (LexicalChatInput.tsx)
  - Token counting with TokenBar visualization
  - Drag-drop overlay for file attachments
  - Proposal acceptance/rejection (ActionProposal, SqlQuery, FileChange)
  - AutoApproveSwitch for auto-execution
  - VisualEditingChangesDialog integration
  - Chat mode toggle (basic/agent)
  - Error state with ChatErrorBox
- **Visual Style:**
  - Responsive height with collapsible sections
  - Token bar shows breakdown: message history (blue), codebase (green), apps (orange), system prompt (yellow), input (purple)
  - Color-coded control buttons (warning/info icons)

#### **ChatMessage.tsx** (10KB)

- **Purpose:** Renders individual message bubble (user vs AI)
- **Key Features:**
  - Message role differentiation (assistant left, user right)
  - Streaming indicator with LoadingBar animation
  - Copy-to-clipboard with visual feedback
  - Timestamp with distance-to-now formatting
  - Markdown rendering (AnyonMarkdownParser with special handling)
  - Version info badge (git commit hash)
  - Hover actions menu
  - Status icons: pending, success, error, partial
- **Visual Style:**
  - User messages: right-aligned, accent background, max 85% width
  - Assistant messages: left-aligned, full width, max 3xl container
  - Rounded corners, group hover effects
  - Icons: Clock (pending), Check (success), XCircle (error), Info (partial)

#### **MessagesList.tsx** (14KB)

- **Purpose:** Virtualized list of messages with retry/undo controls
- **Key Features:**
  - React Virtuoso for performance (large message histories)
  - Footer actions: Retry (RefreshCw), Undo (Undo), Revert to version
  - Setup banner for model configuration
  - Promo message for upgrade/limits
  - Footer context for streaming state
  - Memoized ChatMessage components
- **Visual Style:**
  - Max 3xl container centered
  - Gap-2 spacing between messages
  - Footer button group at bottom

#### **StreamingLoadingAnimation.tsx**

- **Purpose:** Animated loading indicator for streaming responses
- **Variants:**
  - `initial`: Waiting for first response (thinking → pondering → reasoning → etc.)
  - `streaming`: Active content streaming (brewing → conjuring → cooking → etc.)
- **Features:**
  - 30+ random verbs for variety
  - Scramble effect text animation (char-by-char reveal)
  - Framer Motion for smooth transitions
- **Visual Style:**
  - Text-based animation (no spinners)
  - Lowercase, humorous verbs
  - Gradual reveal with 60ms stagger

### Input Components

#### **LexicalChatInput.tsx** (15KB)

- **Purpose:** Lexical rich text editor wrapper for chat
- **Key Features:**
  - Multi-line text editing with history (ArrowUp = previous message)
  - Code block support
  - Mention/@ completion
  - Keyboard shortcuts (Ctrl/Cmd+Enter to send)
  - Placeholder text
- **Visual Style:**
  - Contenteditable appearance
  - Monospace in code blocks
  - Auto-growing height

#### **HomeChatInput.tsx** (6KB)

- **Purpose:** Simplified chat input for home page
- **Key Features:**
  - Basic text entry
  - Focus management
  - Questionnaire input fallback
- **Visual Style:**
  - Minimal styling

#### **QuestionnaireInput.tsx** (15KB)

- **Purpose:** Guided input with predefined questions
- **Features:**
  - Question templates
  - Multi-step flow
  - Conditional branching
- **Visual Style:**
  - Card-based layout

### Chat Metadata & Controls

#### **ChatHeader.tsx** (8KB)

- **Purpose:** Top bar with branch info, preview toggle, version history
- **Key Features:**
  - Current branch display (git integration)
  - Version/commit badge
  - Toggle preview panel button (PanelRightOpen/Close icons)
  - Uncommitted files banner
  - Branch management (rename, checkout)
  - Loading state (LoadingBar)
  - History dropdown (last 10 versions)
- **Visual Style:**
  - Compact header with icons
  - Loading bar below for async operations
  - Info tooltip on branch name

#### **ChatActivity.tsx**

- **Purpose:** Shows activity/progress indicators
- **Visual Style:**
  - Subtle status updates

#### **ChatError.tsx** (1KB)

- **Purpose:** Error message alert
- **Features:**
  - AlertTriangle icon
  - Dismiss button (XCircle)
  - Red styling (bg-red-100, border-red-500, text-red-600)
- **Visual Style:**
  - Inline banner with rounded corners
  - 3px padding, shadow-sm

#### **ChatErrorBox.tsx** (7KB)

- **Purpose:** Detailed error display with suggestions
- **Features:**
  - Stack trace/details
  - Action suggestions
  - Dismissible

### Chat History & Search

#### **ChatList.tsx** (14KB)

- **Purpose:** Sidebar list of chat sessions
- **Key Features:**
  - Favorite/unfavorite chat
  - Rename dialog
  - Delete confirmation
  - Chat search (ChatSearchDialog)
  - New chat button (+)
  - Last message preview
  - Quota exceeded warning
- **Visual Style:**
  - Sidebar group layout
  - Truncated title + preview
  - Hover actions menu (Edit, More, Trash)
  - Distance-to-now timestamps

#### **ChatSearchDialog.tsx**

- **Purpose:** Search chats by title/content
- **Features:**
  - Full-text search
  - Result highlighting
  - Quick select

#### **DeleteChatDialog.tsx**

- **Purpose:** Confirmation before deleting chat
- **Visual Style:**
  - Alert dialog with warning tone

#### **RenameChatDialog.tsx**

- **Purpose:** Edit chat title
- **Visual Style:**
  - Text input modal

### Message Content Handlers (src/components/chat/Anyon\*.tsx)

These 30+ components render specialized content types from AI responses:

- **AnyonMarkdownParser.tsx** - Renders markdown with custom handlers
- **AnyonOutput.tsx** - Generic output display
- **AnyonProblemSummary.tsx** - Error/issue summary with stack traces
- **AnyonCodeSearchResult.tsx** - Search result with code snippet
- **AnyonEdit.tsx**, **AnyonDelete.tsx**, **AnyonRead.tsx** - File operation displays
- **AnyonWrite.tsx**, **AnyonSearchReplace.tsx** - Code modification proposals
- **AnyonExecuteSql.tsx** - SQL query execution display
- **AnyonWebSearch.tsx**, **AnyonWebSearchResult.tsx** - Web search results
- **AnyonThink.tsx** - Thinking/reasoning step display
- **AnyonMcpToolCall.tsx**, **AnyonMcpToolResult.tsx** - Tool integration
- **AnyonStatus.tsx** - Status message
- **AnyonTokenSavings.tsx** - Token usage info

### File & Context Management

#### **AttachmentsList.tsx**

- **Purpose:** Shows attached files/context
- **Features:**
  - File preview
  - Remove button
  - Type badges

#### **ContextFilesPicker.tsx**

- **Purpose:** Dialog to select context files
- **Features:**
  - File tree selection
  - Multi-select
  - Size indicators

#### **FileAttachmentDropdown.tsx**

- **Purpose:** Quick file attach menu
- **Features:**
  - Upload option
  - Recent files
  - Codebase selection

#### **DragDropOverlay.tsx**

- **Purpose:** Visual feedback during drag-drop
- **Visual Style:**
  - Translucent overlay
  - Border highlight

### State & Utility Components

#### **FixAllErrorsButton.tsx**

- **Purpose:** Quick action to auto-fix all problems
- **Visual Style:**
  - Icon button

#### **HistoryNavigation.tsx**

- **Purpose:** Forward/back navigation in message history
- **Visual Style:**
  - Arrow buttons

#### **TodoList.tsx**

- **Purpose:** Renders AI-generated todos/checklist
- **Features:**
  - Checkbox interactions
  - Progress tracking
- **Visual Style:**
  - List with checkboxes

#### **VersionPane.tsx** (10KB)

- **Purpose:** Shows git history and version info
- **Features:**
  - Commit timeline
  - Revert button
  - Author info
  - Timestamps

#### **FreeAgentQuotaBanner.tsx**

- **Purpose:** Shows quota exceeded warning
- **Visual Style:**
  - Warning banner

#### **ContextLimitBanner.tsx**

- **Purpose:** Warns when approaching token limit
- **Visual Style:**
  - Alert banner

#### **UncommittedFilesBanner.tsx**

- **Purpose:** Shows pending changes
- **Visual Style:**
  - Info banner

#### **CodeHighlight.tsx**

- **Purpose:** Syntax highlighting for code blocks
- **Features:**
  - Language detection
  - Copy button
  - Line numbers (optional)

#### **PromoMessage.tsx**

- **Purpose:** Upgrade/feature promotion
- **Visual Style:**
  - Card-based message

#### **SummarizeInNewChatButton.tsx**

- **Purpose:** Quick action to create summary chat
- **Visual Style:**
  - Button with icon

#### **TokenBar.tsx** (7KB)

- **Purpose:** Visual token budget display
- **Key Features:**
  - Stacked bar chart (5 segments)
  - Tooltip breakdown
  - Percentage display
  - Context window indicator
- **Visual Style:**
  - Horizontal bar (1.5px height)
  - Color segments:
    - Message history: blue-400
    - Codebase: green-400
    - Mentioned apps: orange-400
    - System prompt: yellow-400
    - Input: purple-400
  - Background: muted (gray)

---

## 🎨 MAIN APP NAVIGATION

#### **app-sidebar.tsx** (AppSidebar)

- **Purpose:** Main navigation sidebar
- **Key Features:**
  - Logo header
  - Navigation items: Home, Chat, Settings, Library (Themes), Market (Hub), Connect
  - Chat list integration (ChatList)
  - Collapsible with offcanvas mode
  - Account menu (AccountMenu)
  - Help dialog button
  - Subscription banner
  - Login dialog for auth
- **Visual Style:**
  - Sidebar primitive with group/menu structure
  - Logo at top with 8px height
  - Icons from Lucide (Home, Inbox, Settings, BookOpen, Store, Plug)
  - Hover state on items
  - Active state indicator

#### **ChatPanel.tsx** (Main Chat View)

- **Purpose:** Container for chat interface
- **Key Features:**
  - ChatHeader (top)
  - MessagesList (center, virtualized)
  - ChatInput (bottom)
  - VersionPane (side panel)
  - Preview panel toggle
  - Scroll-to-bottom button
  - Error display
- **Visual Style:**
  - Flex column layout
  - Responsive panels with PanelGroup (resizable-panels)

#### **AppList.tsx** (Sidebar App List)

- **Purpose:** Sidebar app selector
- **Key Features:**
  - Favorite apps (starred)
  - All apps list
  - App search (AppSearchDialog)
  - New app button
  - Favorite toggle
  - Last used indicator
- **Visual Style:**
  - SidebarGroup layout
  - App items with icon/name
  - Hover actions

#### **appItem.tsx** (App List Item)

- **Purpose:** Single app entry
- **Features:**
  - Icon/avatar
  - App name
  - Favorite star toggle
  - Selection highlight
- **Visual Style:**
  - Compact horizontal layout

---

## ⚙️ SETTINGS & CONFIGURATION (src/components/settings/)

#### **ProviderSettingsPage.tsx** (11KB)

- **Purpose:** Model provider configuration UI
- **Key Features:**
  - Tabs: Models, Tools/MCP, API keys
  - Provider selection
  - Model listing with context window
  - Tool management
- **Visual Style:**
  - Tabbed interface
  - List with headers/separators

#### **ProviderSettingsHeader.tsx**

- **Purpose:** Header for provider section
- **Features:**
  - Provider icon/name
  - Connection status
  - Add/edit buttons

#### **ModelsSection.tsx** (10KB)

- **Purpose:** List/configure language models
- **Features:**
  - Model filtering
  - Edit custom models (EditCustomModelDialog)
  - Create custom model (CreateCustomModelDialog)
  - Pricing info
- **Visual Style:**
  - Cards or rows with details

#### **ApiKeyConfiguration.tsx** (8KB)

- **Purpose:** API key input/management
- **Features:**
  - Masked input
  - Show/hide toggle
  - Validation
  - Save button
- **Visual Style:**
  - Input field with icon button

#### **ToolsMcpSettings.tsx** (18KB)

- **Purpose:** MCP (Model Context Protocol) tool management
- **Features:**
  - Tool listing
  - Enable/disable toggle
  - Tool inspection
  - Output preview
  - Configuration
- **Visual Style:**
  - Checklist with expandable details

#### **VertexConfiguration.tsx**, **AzureConfiguration.tsx**

- **Purpose:** Provider-specific settings
- **Features:**
  - Custom environment variables
  - Connection testing
  - Region selection
- **Visual Style:**
  - Form layout

#### **SettingsList.tsx**

- **Purpose:** Main settings navigation
- **Features:**
  - Settings categories
  - Quick toggles
  - Links to detailed pages

---

## 🔌 CONNECTORS & INTEGRATIONS (src/components/)

#### **ProviderConnectDialog.tsx**

- **Purpose:** OAuth/API connection flow
- **Features:**
  - Connection steps
  - Status feedback
  - Error handling
- **Visual Style:**
  - Modal dialog with steps

#### **GitHubConnector.tsx**, **GitHubIntegration.tsx**

- **Purpose:** GitHub OAuth setup
- **Features:**
  - Login button
  - Scope approval
  - Token display

#### **VercelConnector.tsx**, **VercelIntegration.tsx**

- **Purpose:** Vercel deployment integration

#### **SupabaseConnector.tsx**, **SupabaseIntegration.tsx**

- **Purpose:** Supabase database integration

#### **NeonConnector.tsx**, **NeonIntegration.tsx**

- **Purpose:** Neon PostgreSQL integration

#### **GithubBranchManager.tsx**

- **Purpose:** Branch selection/management
- **Features:**
  - Branch list
  - Create/delete
  - Switch branch

#### **GithubCollaboratorManager.tsx**

- **Purpose:** Team member management

---

## 💬 DIALOGS & MODALS

#### **CreateAppDialog.tsx**

- **Purpose:** New app creation wizard
- **Features:**
  - App name input
  - Template selection
  - Optional git repo
- **Visual Style:**
  - Modal with form

#### **ImportAppDialog.tsx**

- **Purpose:** Import app from git/file
- **Features:**
  - Repository URL input
  - Local directory picker
  - Import progress
- **Visual Style:**
  - Modal with input validation

#### **ImportAppButton.tsx**

- **Purpose:** Trigger import dialog
- **Visual Style:**
  - Button with + icon

#### **AppSearchDialog.tsx**

- **Purpose:** Search apps
- **Features:**
  - Full-text search
  - Quick select

#### **AppUpgrades.tsx**

- **Purpose:** Feature/subscription upgrade dialog

#### **HelpDialog.tsx**

- **Purpose:** Help/documentation modal
- **Features:**
  - FAQ
  - Links to docs
  - Version info

#### **HelpBotDialog.tsx**

- **Purpose:** Chat with help bot

#### **ConfirmationDialog.tsx**

- **Purpose:** Generic confirmation
- **Features:**
  - Message
  - OK/Cancel buttons

#### **CreatePromptDialog.tsx**

- **Purpose:** Create system prompt
- **Features:**
  - Text editor
  - Variables
  - Test button

#### **CreateCustomModelDialog.tsx**

- **Purpose:** Define custom model
- **Features:**
  - Model name
  - API endpoint
  - Parameter config

#### **CreateCustomProviderDialog.tsx**

- **Purpose:** Add custom provider
- **Features:**
  - Provider details
  - Authentication

#### **EditCustomModelDialog.tsx**

- **Purpose:** Edit model config

#### **CustomThemeDialog.tsx**

- **Purpose:** Create/edit color theme
- **Features:**
  - Color picker (ColorPicker.tsx)
  - Preview
  - Save/cancel

#### **EditThemeDialog.tsx**

- **Purpose:** Update theme

#### **BugScreenshotDialog.tsx**

- **Purpose:** Report bug with screenshot
- **Features:**
  - Screenshot preview
  - Description
  - Auto-attach logs
- **Visual Style:**
  - Modal with image preview

#### **ScreenshotSuccessDialog.tsx**

- **Purpose:** Confirmation after bug report

#### **ForceCloseDialog.tsx**

- **Purpose:** Warn before force-closing app

#### **CommunityCodeConsentDialog.tsx**

- **Purpose:** Privacy notice for code sharing

#### **AnyonProTrialDialog.tsx**, **AnyonProSuccessDialog.tsx**

- **Purpose:** Premium trial/upgrade prompts
- **Visual Style:**
  - Marketing-style modals

---

## 🎯 PREVIEW & VISUAL EDITING (src/components/preview_panel/)

#### **PreviewPanel.tsx** (7KB)

- **Purpose:** Main preview container
- **Key Features:**
  - Tab system (Preview, Code, Console, Configure, Publish, Security)
  - Console with collapsible header
  - Panel resizing
  - Run/stop app buttons
- **Visual Style:**
  - PanelGroup with resize handles
  - Tab interface
  - Console header shows latest message preview

#### **PreviewIframe.tsx** (53KB - largest single component!)

- **Purpose:** App preview in iframe
- **Key Features:**
  - Sandbox iframe
  - Live reload
  - Visual editing overlay
  - Component inspection
  - Message passing
  - Error boundary
- **Visual Style:**
  - Full viewport iframe

#### **VisualEditingToolbar.tsx** (17KB)

- **Purpose:** Style editor for selected elements
- **Key Features:**
  - CSS property inputs
  - Color picker (ToolbarColorPicker)
  - Font/size selectors
  - Layout controls
  - Real-time preview
- **Visual Style:**
  - Horizontal toolbar
  - Icon buttons + input fields
  - Color swatches

#### **VisualEditingChangesDialog.tsx**

- **Purpose:** Review/apply visual changes
- **Features:**
  - Diff view
  - Accept/reject buttons
  - Preview toggle

#### **SelectedComponentDisplay.tsx**

- **Purpose:** Show selected component info
- **Features:**
  - Component tree
  - Properties
  - Hierarchy

#### **ConfigurePanel.tsx** (13KB)

- **Purpose:** App configuration UI
- **Features:**
  - Environment variables
  - Build settings
  - Runtime config
- **Visual Style:**
  - Form layout

#### **Console.tsx** (11KB)

- **Purpose:** Collapsible console output
- **Key Features:**
  - Log entries (ConsoleEntry)
  - Filtering (ConsoleFilters)
  - Scroll to latest
  - Clear button
  - Search
- **Visual Style:**
  - Terminal-like display
  - Color-coded levels (error=red, warn=yellow, info=blue, log=gray)

#### **ConsoleEntry.tsx**, **ConsoleFilters.tsx**

- **Purpose:** Individual log entry + filter controls

#### **CodeView.tsx**

- **Purpose:** Display source code
- **Features:**
  - Syntax highlighting
  - Line numbers
  - Copy button

#### **FileTree.tsx** (13KB)

- **Purpose:** Project file browser
- **Key Features:**
  - Hierarchical tree
  - Expand/collapse folders
  - File icons
  - Click to open in editor
- **Visual Style:**
  - Indented tree structure
  - Folder/file icons

#### **FileEditor.tsx** (8KB)

- **Purpose:** In-preview code editor
- **Features:**
  - Monaco editor integration
  - Save button
  - Syntax highlighting
- **Visual Style:**
  - Full editor interface

#### **Problems.tsx** (9KB)

- **Purpose:** Error/warning list
- **Key Features:**
  - Severity badges
  - File + line references
  - Quick fix suggestions
  - Filter by type
- **Visual Style:**
  - Scrollable list
  - Color-coded severity (error=red, warning=yellow)

#### **PublishPanel.tsx** (7KB)

- **Purpose:** Deploy/publish UI
- **Key Features:**
  - Deployment target selector
  - Deploy button
  - Status feedback
  - Logs
- **Visual Style:**
  - Form + status display

#### **SecurityPanel.tsx** (32KB)

- **Purpose:** Permissions & security audit
- **Key Features:**
  - Permission checklist
  - Vulnerability summary
  - Request review modal
  - CORS warnings
  - Sensitive data detection
- **Visual Style:**
  - Cards with warning colors
  - Nested sections

#### **NeonConfigure.tsx**

- **Purpose:** Neon database config
- **Features:**
  - Connection string input
  - Test button
  - Tables list

#### **ActionHeader.tsx**

- **Purpose:** Top bar for preview panel
- **Features:**
  - Title
  - Action buttons
  - Status indicator

#### **AnnotatorToolbar.tsx**

- **Purpose:** Annotation tools for preview
- **Features:**
  - Drawing tools
  - Color selection
  - Undo/redo

#### **PlanPanel.tsx**

- **Purpose:** Show AI plan/steps
- **Features:**
  - Step list
  - Progress indicator

---

## 🔐 AUTHENTICATION (src/components/auth/)

#### **AccountMenu.tsx** (4KB)

- **Purpose:** User account dropdown
- **Key Features:**
  - Profile info
  - Settings link
  - Logout button
  - Plan info
- **Visual Style:**
  - Dropdown menu
  - Avatar (SimpleAvatar)
  - Hover state

#### **LoginDialog.tsx** (5KB)

- **Purpose:** Login/signup modal
- **Key Features:**
  - Email input
  - OAuth buttons (GitHub)
  - Loading state
  - Error display
- **Visual Style:**
  - Centered modal
  - Social auth buttons

#### **SimpleAvatar.tsx** (ui/ primitive)

- **Purpose:** User avatar display
- **Features:**
  - Initials fallback
  - Image support

---

## 💳 SUBSCRIPTION (src/components/subscription/)

#### **SubscriptionBanner.tsx** (4KB)

- **Purpose:** Plan/trial info banner
- **Key Features:**
  - Current plan display
  - Upgrade button
  - Trial countdown
- **Visual Style:**
  - Compact info banner
  - Color-coded tiers

#### **CheckoutPlanDialog.tsx**

- **Purpose:** Purchase/upgrade flow
- **Features:**
  - Plan comparison
  - Payment form
  - Confirmation
- **Visual Style:**
  - Modal with plan cards

---

## 🎛️ SELECTOR & PICKER COMPONENTS

#### **ModelPicker.tsx** (Popover + Command)

- **Purpose:** LLM model selection
- **Key Features:**
  - Provider grouping
  - Search/filter
  - Context window badge
  - API name display
- **Visual Style:**
  - Searchable dropdown
  - Provider headers
  - Checkmark indicator

#### **AgentPicker.tsx**

- **Purpose:** Select AI agent type

#### **ChatModeSelector.tsx**, **DefaultChatModeSelector.tsx**

- **Purpose:** Basic vs Agent mode toggle
- **Visual Style:**
  - Radio group or toggle buttons

#### **LanguageSelector.tsx**

- **Purpose:** UI language selection

#### **ReleaseChannelSelector.tsx**

- **Purpose:** Stable/Beta/Dev channel

#### **RuntimeModeSelector.tsx**

- **Purpose:** Node/Browser runtime

#### **OpenCodeConnectionModeSelector.tsx**

- **Purpose:** Connection type selection

#### **ZoomSelector.tsx**

- **Purpose:** Preview zoom level

#### **ThinkingBudgetSelector.tsx**

- **Purpose:** AI reasoning token limit

#### **MaxChatTurnsSelector.tsx**

- **Purpose:** Conversation length limit

#### **NodePathSelector.tsx**

- **Purpose:** Node.js version

---

## 📋 FEATURE TOGGLES & SWITCHES

#### **AutoApproveSwitch.tsx**

- **Purpose:** Auto-execute proposals
- **Visual Style:**
  - Toggle switch (ui/switch)

#### **AutoExpandPreviewSwitch.tsx**

- **Purpose:** Auto-open preview on save

#### **ChatCompletionNotificationSwitch.tsx**

- **Purpose:** Toast on message completion

#### **AutoUpdateSwitch.tsx**

- **Purpose:** Auto-update app

#### **AutoFixProblemsSwitch.tsx**

- **Purpose:** Auto-fix code issues

#### **TelemetrySwitch.tsx**

- **Purpose:** Analytics opt-in

---

## 🎁 CARDS & DISPLAYS

#### **SetupBanner.tsx**

- **Purpose:** Configuration reminder
- **Features:**
  - Dismissible
  - Action link
- **Visual Style:**
  - Info banner

#### **SetupProviderCard.tsx**

- **Purpose:** Provider setup card
- **Features:**
  - Provider icon/name
  - Setup button
  - Status badge

#### **TemplateCard.tsx**

- **Purpose:** App template preview
- **Features:**
  - Thumbnail image
  - Description
  - Click to create

#### **PriceBadge.tsx**

- **Purpose:** Model cost indicator
- **Visual Style:**
  - Small badge with price

#### **AIGeneratorTab.tsx**

- **Purpose:** AI features showcase

---

## 📤 NOTIFICATIONS & TOASTS

#### **CustomErrorToast.tsx**

- **Purpose:** Error notification
- **Visual Style:**
  - Toast with close button
  - Error icon

#### **InputRequestToast.tsx**

- **Purpose:** Prompt for user input
- **Features:**
  - Text field
  - Submit button

#### **LocalAgentNewChatToast.tsx**

- **Purpose:** Notification for local agent chat

#### **McpConsentToast.tsx**

- **Purpose:** Tool execution approval
- **Features:**
  - Approve/reject buttons
  - Tool details

#### **TelemetryBanner.tsx**

- **Purpose:** Privacy/analytics notice
- **Features:**
  - Opt-in/out buttons

---

## 🎮 SPECIALIZED COMPONENTS

#### **ChatInputControls.tsx**

- **Purpose:** Toolbar above input
- **Features:**
  - Send button
  - Attachment button
  - More actions (AuxiliaryActionsMenu)

#### **AuxiliaryActionsMenu.tsx** (12KB)

- **Purpose:** Dropdown menu with theme/file/token options
- **Key Features:**
  - File attachment (FileAttachmentDropdown)
  - Context files picker
  - Theme selector (Dropdown sub-menu)
  - Token bar toggle
  - Nested menus
- **Visual Style:**
  - DropdownMenu with SubMenu
  - Icons: Paperclip, Palette, ChartColumnIncreasing

#### **CapacitorControls.tsx**

- **Purpose:** Mobile app controls

#### **ErrorBoundary.tsx**

- **Purpose:** Catch component errors
- **Features:**
  - Fallback UI
  - Error details (dev mode)

#### **DragDropOverlay.tsx**

- **Purpose:** Visual feedback during drag
- **Visual Style:**
  - Semi-transparent overlay

#### **OpenCodeTool.tsx**

- **Purpose:** Launch external code editor
- **Visual Style:**
  - Button or quick action

---

## 📊 UI PRIMITIVES (src/components/ui/)

Base components wrapped/styled from Base UI/Radix:

- **button.tsx** - Button with variants
- **card.tsx** - Card container
- **input.tsx**, **textarea.tsx** - Form inputs
- **label.tsx** - Form label
- **select.tsx** - Select dropdown
- **checkbox.tsx**, **radio-group.tsx** - Form controls
- **toggle.tsx**, **toggle-group.tsx** - Toggle buttons
- **switch.tsx** - Toggle switch
- **dialog.tsx**, **alert-dialog.tsx** - Modals
- **dropdown-menu.tsx** - Context menus
- **popover.tsx** - Popover container
- **tabs.tsx** - Tab interface
- **accordion.tsx** - Accordion sections
- **tooltip.tsx** - Hover tooltips
- **sheet.tsx** - Side panel
- **sidebar.tsx** - Sidebar container
- **command.tsx** - Command/search
- **scroll-area.tsx** - Scrollable container
- **badge.tsx** - Status badges
- **separator.tsx** - Visual divider
- **alert.tsx** - Alert box
- **skeleton.tsx** - Loading placeholder
- **NumberInput.tsx** - Numeric input
- **ColorPicker.tsx** - Color selection
- **LoadingBar.tsx** - Progress bar

---

## 🔑 KEY VISUAL PATTERNS

### Color Coding

- **Message History**: Blue-400
- **Codebase Context**: Green-400
- **Mentioned Apps**: Orange-400
- **System Prompt**: Yellow-400
- **User Input**: Purple-400
- **Error**: Red (100 bg, 500 border, 600 text)
- **Warning**: Amber/Yellow
- **Success**: Green

### States

- **Streaming**: Animated verb text + spinner icon
- **Loading**: LoadingBar or skeleton
- **Error**: ChatError box or banner
- **Empty**: EmptyState component (not yet seen but common pattern)
- **Success**: Check icon + toast

### Layouts

- **Chat**: Full viewport with sidebar
- **Panel**: Resizable PanelGroup
- **Sidebar**: SidebarGroup/Menu structure
- **Modal**: Dialog/AlertDialog
- **Dropdown**: DropdownMenu with SubMenu support
- **Tabs**: Tabs interface

### Typography

- **Headings**: DialogTitle, SidebarGroupLabel
- **Body**: Default text
- **Code**: Monospace in CodeHighlight
- **Timestamp**: Muted-foreground, small size
- **Error**: text-red-600

---

## 🚀 COMPONENT USAGE PATTERNS

### State Management

- **Global**: Jotai atoms (chatAtoms, appAtoms, viewAtoms, previewAtoms)
- **Local**: useState for UI state (dialogs, menus, inputs)
- **Server**: TanStack Query (useQuery, useMutation) + IPC calls

### IPC Integration

- Wrapped in hooks (useChats, useSettings, useStreamChat, etc.)
- Components call hooks, not IPC directly
- Error handling via onError toast

### Responsive Design

- Sidebar collapsible on mobile
- Chat input mobile-optimized (smaller font, full-width)
- Preview panel toggles on small screens
- Token bar hidden on very small screens

---

## 📦 MISSING/TODO COMPONENTS

Looking at the structure, these might be missing or in need of design:

1. **Empty State Component** - Reusable empty state UI
2. **Loading State Component** - Full-page loading skeleton
3. **Pagination** - If chat list grows
4. **Breadcrumb** - For deep navigation
5. **Notification Center** - Aggregated notifications
6. **Settings Search** - Search across all settings
7. **Command Palette** - Keyboard shortcuts/quick actions

---

## 🎯 DESIGN SYSTEM RECOMMENDATIONS

### For ANYON Design System Doc:

1. **Establish token naming** - Standardize color/size naming
2. **Create component variants** - Document all states of each component
3. **Define spacing scale** - Consistent gap/padding (gap-1, px-4, etc.)
4. **Typography hierarchy** - Heading sizes, line heights
5. **Dark/Light theme tokens** - CSS var documentation
6. **Icon system** - Lucide integration + sizing rules
7. **Animation specs** - Framer Motion defaults
8. **Accessibility guidelines** - ARIA, keyboard navigation
9. **Mobile breakpoints** - Responsive behavior
10. **Internationalization** - Multi-language support preparation
