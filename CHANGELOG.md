# Changelog

All notable changes to [Anyon](https://github.com/SL-IT-AMAZING/SLIT-ANYON) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.36.0] - 2026-02-07

### Added

- **Planning Mode**: New AI-powered planning mode that helps you scope and plan features with an interactive questionnaire before building (#2370)
- **Storybook Integration**: Set up Storybook for component development and visual testing (#2503)
- **Chat Panel Toggle**: Show or hide the chat panel for more screen real estate (#2345)
- **Chat Input History**: Recall previous messages using the Up Arrow key in chat input (#2343)
- **Fuzzy Search in Settings**: Quickly find settings with a new fuzzy search sidebar (#2449)
- **Native Notifications**: Get notified when a chat stream completes, even when Anyon is in the background (#2413)
- **Streaming Loading Animation**: Delightful new animation while AI responses are loading (#2425)
- **Preview Panel Auto-Expand Control**: New setting to disable automatic expansion of the preview panel (#2352)
- **"Start New Chat" on Errors**: Anyon Pro users can now start a fresh chat directly from error messages (#2494)
- **Kimi K2.5 Model**: Added Moonshot AI's Kimi K2.5 model to OpenRouter options (#2495)

### Changed

- **Radix to Base UI Migration**: Migrated UI component library from Radix to Base UI for improved performance and consistency (#2432)
- **Migrated to Zod v4**: Upgraded schema validation library to Zod v4 (#2415)
- **Updated AI SDK**: Updated AI SDK dependencies to latest versions (#2431)
- **Ask Mode Improvements**: Ask mode now always uses the local agent handler for better reliability (#2434)
- **Tooltips Upgrade**: Replaced plain title attributes on buttons with accessible shadcn Tooltip components (#2470)
- **Context Limit Banner Relocated**: Moved the context limit warning from the messages list to a more visible position in the chat input area (#2461)
- **Improved Supabase Prompts**: Replaced custom XML tags with standard markdown in Supabase prompts for better compatibility (#2424)

### Fixed

- **Chat Auto-Scroll**: Replaced unreliable timeout-based scroll tracking with a position-based approach for smoother auto-scrolling (#2448)
- **Stale AI Message References**: Stripped OpenAI itemId from persisted messages to prevent stale reference errors (#2468)
- **Component Selector Initialization**: Added MutationObserver retry logic to handle race conditions in component selector startup (#2408)
- **Branch Handling**: New chats now correctly use the current branch instead of always defaulting to main (#2411)
- **Attachment Upload Instructions**: Fixed incorrect file upload instructions shown in local agent mode (#2412)
- **Preserved URL Clearing**: Fixed an issue where the preserved URL was not cleared when navigating to root or restarting the app (#2422)
- **Missing Anyon Logo**: Restored the Anyon logo that was missing from certain views (#2404)

### Performance

- **Windows Code Signing**: Switched to Azure Trusted Signing for faster and more reliable Windows builds (#2429)

## [0.35.0] - 2026-01-29

### Added

- **Basic Agent Mode for Free Users**: Free users can now access Agent mode with a 5-message daily quota (#2355)
- **Pro Trial Models**: Added model options specifically for Pro trial users (#2387)
- **Git Pull UI**: New user interface for pulling remote changes into your project (#2342)
- **MCP HTTP Header Support**: Custom HTTP headers can now be passed to MCP servers (#2365)
- **Application Menu**: Added an application menu with standard keyboard shortcuts like Ctrl+C and Ctrl+Z (#2335)
- **Device Toggle**: Switch between device views for responsive preview (#2327)
- **GFM Support**: Enabled GitHub Flavored Markdown rendering in chat messages (#2353)
- **Search & Replace Tool**: Added a stringent search-and-replace tool for the local agent (#2367)
- **Skip Edge Function Pruning**: New setting to control whether edge functions are pruned during deployment (#2228)
- **Custom Theme Generator**: Generate custom themes with integrated web crawling for design inspiration (#2182)
- **Uncommitted Files Banner**: Visual indicator when you have uncommitted changes, with a review and commit dialog (#2257)
- **Default Chat Mode Setting**: Choose your preferred default chat mode in settings (#2244)
- **AppImage Support**: Linux users can now use the AppImage format (#2068)

### Changed

- **IPC Contracts**: Introduced a contract-driven architecture for IPC communication between main and renderer processes (#2276)
- **React Compiler Enabled**: Turned on the React Compiler for automatic performance optimizations (#2259)
- **Upgraded to React v19**: Default project template now uses React v19 (#2216)
- **Upgraded Electron**: Updated Electron and Electron Forge to latest versions (#2258)
- **Replaced Prettier with oxfmt**: Switched to oxfmt for significantly faster code formatting (#2313)
- **Upgraded oxlint**: Upgraded oxlint linter and enabled additional recommended rules (#2270)
- **Centralized React Query Keys**: Refactored query keys to use a centralized factory pattern for better cache management (#2268)
- **Read-Only Local Agent in Ask Mode**: Pro ask mode now uses a read-only local agent for safer code exploration (#2260)

### Fixed

- **Preview Navigation**: Fixed forward and back button navigation in the app preview (#2372)
- **WSL PATH Issues**: Fixed PATH contamination from WSL causing git command failures on Windows (#2282)
- **Windows Path Handling**: Fixed backslash path issues in component taggers and visual editing on Windows (#2280)
- **Git Dubious Ownership**: Fixed the 'dubious ownership' error that occurred on Windows when renaming apps (#2322)
- **Vercel Live URL**: Fixed the Live URL not updating after new Vercel deployments (#2283)
- **Duplicate Server Logs**: Fixed duplicate log messages appearing in the developer console (#2359)
- **Route Preservation on Refresh**: Refreshing the app now preserves your current route (#2336)
- **HTML Escaping in Tags**: Fixed attribute and content escaping for anyon-tags (#2266)
- **Summarize to New Chat**: Fixed the "summarize to new chat" feature when using local agent mode (#2294)
- **Uncommitted Banner During Streaming**: Hidden the uncommitted files banner while AI is actively streaming (#2289)
- **Dark Mode Supabase Button**: Fixed visibility of the Supabase continue button in dark mode (#2241)
- **Duplicate Chat Streams**: Prevented multiple chat streams from starting simultaneously (#2243)

### Security

- **Iframe Sandbox**: Enhanced preview iframe security with stricter sandboxing

## [0.34.0] - 2026-01-19

### Changed

- **Supabase Prompt Refactoring**: Refactored the Supabase system prompt to use dynamic code injection for better maintainability (#2222)
- **Agent Mode Badge**: Updated the Agent Mode badge styling and positioning (#2223)

## [0.33.0] - 2026-01-16

### Added

- **Local Agent (Graduated from Experiment)**: The local AI agent is now a stable, first-class feature with code search, grep, type checking, TODOs, and database tools (#1967, #2173)
- **Web Crawl & Clone**: Clone websites by crawling their content for rapid prototyping (#2101)
- **Web Search Tool**: AI can now search the web for up-to-date information during conversations (#2099)
- **Code View Search & Fullscreen**: Search within the code view and expand it to fullscreen (#1988)
- **Turbo Edit File Tool**: New high-speed file editing tool for the AI agent (#2094)
- **Git Collaboration Tools**: Branch management and collaboration features for team workflows (#2139)
- **Auto-Read Logs**: The AI agent now automatically reads application logs as a tool call (#2012)
- **Clear Logs Button**: Easily clear the logs panel with a single click (#2118)
- **Type Check Tool**: AI agent can now run TypeScript type checks on your project (#2137)
- **Import App In-Place**: Import existing projects without moving them to a new directory (#2189)
- **Supabase Refresh Button**: Added a refresh button for the Supabase projects list (#2180)
- **UI Theming**: Initial support for custom UI themes (#2145)

### Changed

- **Native Git Enabled by Default**: Switched from JS-based git to native git for better performance and reliability (#2095)
- **Upgraded to AI SDK v6**: Updated to the latest AI SDK for improved model support (#2102)
- **Home Page Refinement**: Improved the home page experience with better layout and interactions (#2110)
- **Configurable App Storage Location**: Changed the default location for storing Anyon apps (#2000)

### Fixed

- **Git Safe Directory**: Automatically initializes git safe directory on startup to prevent permission errors (#2152)
- **Rate Limit Handling**: Added retry logic for Supabase API rate limit errors (#2148)
- **Image Attachments**: Fixed issues with uploading and displaying image attachments (#2124)
- **Plus Button During Streaming**: Plus button now stays enabled while AI is streaming (#2117)
- **File Upload in Local Agent**: Fixed file upload functionality in local agent mode (#2210)
- **Build Logs Consolidation**: Consolidated build-time logs into server logs for a cleaner experience (#2214)

### Performance

- **Faster TypeScript Checks**: Optimized TypeScript type checking speed (#2111)

## [0.32.0] - 2026-01-05

### Added

- **Model Display on Messages**: Chat messages now show which AI model generated them (#2003)

### Changed

- **Improved Chat Scrolling**: Fixed scrolling behavior in the chat panel for a smoother experience (#2040)

### Fixed

- **Stale UI States**: Fixed stale UI rendering issues (#2027)
- **Model Invalidation**: Fixed model selection not properly invalidating cached state (#2024)

## [0.31.0] - 2025-12-24

### Added

- **Visual Editor (Pro)**: New visual editing mode for Pro users to directly manipulate UI components (#1828)
- **Annotator Tool**: Visual annotation tool for marking up and discussing UI elements (#1861)
- **GPT 5.2 Support**: Added support for OpenAI's GPT 5.2 model (#1932)
- **Opus 4.5 Support**: Added Anthropic's Opus 4.5 model and cleaned up legacy model options (#1892)
- **Summarize Chat**: New button to quickly summarize long chat conversations (#1890)
- **Fix All Errors Button**: One-click button to attempt fixing all reported errors (#1785)
- **Copy Error Messages**: Easily copy error messages to clipboard for sharing (#1882)
- **Animated Placeholder Prompts**: Home chat input now shows animated prompt suggestions (#1706)
- **CPU/Memory Monitoring**: Application logs CPU and memory usage when force-closed (#1894)
- **Monaco Editor from CDN**: Code editor now loads from CDN for faster startup (#1939)

### Changed

- **Replaced Native Git with Dugite**: Users no longer need Git installed separately; Dugite is bundled with the app (#1760)
- **Deep Context as Default**: Deep context mode is now the default for smarter AI responses (#1891)
- **Dynamic Port Assignment**: The dev server no longer hardcodes port 32100 (#1969)

### Fixed

- **Vercel API Compatibility**: Fixed issues caused by a breaking change in the Vercel API (#1883)
- **Anyon Pro Error Messages**: Improved error messaging for Anyon Pro subscription issues (#1884)
- **Invalid App Names**: Prevented invalid characters in app names (#1839)
- **Chat Input Clearing**: Fixed chat input not clearing when switching between apps (#1791)
- **Import Dialog Responsiveness**: Fixed responsive layout issues in the import app dialog (#1786)
- **Enter Key During Approval**: Disabled enter key submission while approval is pending (#1776)
- **Setup Banner Visibility**: Fixed the setup banner incorrectly showing when custom providers are configured (#1756)
- **Custom Model Updates**: Fixed custom models not updating properly in the settings (#1840)
- **Scrollbar Flickering**: Fixed scrollbar flickering in annotator mode (#1968)

### Security

- **Bug Report Screenshots**: Users can now capture screenshots to attach to bug reports (#1678)

## [0.28.0] - 2025-11-18

### Added

- **Gemini 3 Support**: Added Google's Gemini 3 model family (#1819)
- **GPT 5.1 Support**: Added OpenAI's GPT-5.1 model (#1783)
- **Multi-Component Selector**: Select and manipulate multiple UI components simultaneously (#1728)

### Fixed

- **Supabase Edge Function Revert**: Re-deploying all edge functions now works correctly when reverting a version (#1787)

## [0.27.0] - 2025-11-13

### Added

- **Security Panel**: New dedicated panel for reviewing and managing security concerns in your app (#1660)
- **Smart Context: Deep Mode**: Advanced context gathering that deeply analyzes your codebase for more relevant AI responses (#1527)
- **Web Crawl for Replication (Pro)**: Crawl and replicate website designs for rapid prototyping (#1683)
- **File Referencing**: Reference specific files in your chat messages for targeted AI assistance (#1648)
- **Screen Size Toggle**: Preview your app at different screen sizes (#1582)
- **Manual Node.js Path**: Configure a custom Node.js installation path (#1577)
- **Deep Linking with Prompts**: Open Anyon with pre-filled prompts via deep links (#1669)
- **Text Size Accessibility**: Adjust text size throughout the app for better readability (#1624)

### Changed

- **Turbo Edits v2**: Improved turbo editing with fuzzy matching for more reliable code modifications (#1653, #1700)
- **Problem Selection**: Users can now select specific problems to focus on (#1568)
- **Supabase Branches**: Added support for Supabase database branching (#1394)
- **Component Selection Engine**: Improved the engine for selecting UI components (#1562)

### Fixed

- **Auto-Scroll**: Fixed auto-scroll to only trigger during AI streaming (#1593)
- **Settings Alignment**: Fixed misaligned elements on the settings page (#1618)
- **Timestamps**: Corrected created and updated timestamps (#1703)
- **Upgrade Banner**: Hidden the upgrade banner for non-AI streaming errors (#1667, #1680)

### Security

- **Security Review**: Fixed multiple security issues identified during review (#1699)

## [0.24.0] - 2025-10-13

### Added

- **MCP Support**: Added Model Context Protocol (MCP) support for extensible AI tool integrations (#1028)
- **Deep Linking for MCP**: Install MCP servers via deep links (#1550)
- **GitHub Import**: Import existing repositories and projects directly from GitHub (#1454)
- **Inline Code Editor**: Edit code directly within the chat interface (#1235)
- **App Search**: Search across all your Anyon apps quickly (#1302)
- **Chat Search**: Search through your chat history (#1224)
- **Concurrent Chats**: Run multiple chat sessions simultaneously (#1478)
- **Favorite Apps**: Star your most-used apps for quick access (#1410)
- **Web Search**: AI can search the web for current information (#1370)
- **Hotkey for Chat Modes**: Toggle between chat modes using keyboard shortcuts (#1284)
- **Context Menu**: Right-click copy, paste, and other standard actions (#1492)
- **Scroll to Bottom Button**: Quickly scroll to the bottom of long chat conversations (#1484)
- **Spell Check**: Spell check suggestions in the context menu (#1509)
- **Copy AI Responses**: Copy AI responses with proper Anyon tag formatting (#1315)

### Changed

- **Electron 38**: Upgraded to Electron 38 for improved performance and security (#1526)
- **Custom AI Provider Editing**: Edit and delete custom AI providers directly from settings (#1250)
- **Model Dropdown Scrolling**: Long model lists now scroll properly in the dropdown (#1323)

### Fixed

- **MCP & Title Bar**: Fixed issues with MCP integration and title bar rendering (#1348)
- **Supabase Prompt**: Fixed Supabase-related prompt issues (#1435)
- **AnyonThink Hook**: Fixed React hook usage in AnyonThink component (#1467)
- **Send Button During Approval**: Disabled send button while code approval is pending (#1368)
- **App Width**: Fixed app sidebar width to consistent 190px (#1465)

## [0.20.0] - 2025-09-08

### Added

- **xAI (Grok) Provider**: Added xAI's Grok as an AI provider option (#1209)
- **Amazon Bedrock Provider**: Added Amazon Bedrock as an AI provider (#1185)
- **Google Vertex AI Provider**: Added Google Vertex AI as an AI provider (#1163)
- **Azure OpenAI Integration**: Added Azure OpenAI custom model integration (#1001)
- **OpenRouter Support**: Added OpenRouter to the AI provider setup flow (#1242)
- **Turbo Models**: Added support for turbo-speed model variants (#1249)
- **More Free Models**: Expanded the selection of free AI models (#1244)
- **1M Token Support**: Support for 1M token context windows with Anthropic models (#1233)
- **PHP Support**: Added PHP file support (#1234)

### Changed

- **Balanced Smart Context Default**: Made balanced smart context the default mode for better results (#1186)
- **Improved Model Picker**: Enhanced the model selection UI with better grouping and UX (#1180)
- **Minimum Window Size**: Set a minimum window size to prevent UI breakage (#1195)

### Fixed

- **Component Selection Shortcut**: Fixed keyboard shortcut for component selection (#1139)
- **Turbo Edit Click Behavior**: Prevented content clicks from toggling the turbo edit accordion (#1201)
- **Anyon Command Tags**: Fixed display of anyon-command tags in generated text (#1162)

### Security

- **Iframe Sandbox**: Enabled iframe sandbox for improved preview security (#1178)
- **Security Policy**: Added security policy for supported versions and vulnerability reporting (#1166)

## [0.18.0] - 2025-08-20

### Added

- **Smart Context v3**: Third-generation context gathering with significantly improved relevance (#1022)
- **Help Chat**: Built-in help chat for getting assistance with Anyon itself (#1007)
- **Prompt Gallery**: Browse and use pre-made prompts to get started quickly (#957)
- **Custom Install Commands**: Specify custom install and start commands for non-standard projects (#892)
- **Copy Code Blocks**: One-click copy for code blocks in AI responses (#934)
- **Docker Support**: Run Anyon apps in Docker containers (#674)
- **Next.js Route Support**: Proper handling of Next.js routes in the preview (#958)
- **Timestamp in Prompts**: Added message timestamps for better context in AI conversations (#959)

### Changed

- **Upgraded AI SDK**: Updated AI SDK with official codemod for smooth migration (#1000)
- **Parameterized System Prompt**: System prompt is now configurable for advanced users (#1082)

### Fixed

- **Text Overflow**: Fixed text overflow in chat messages (#1073)
- **Setup Banner Clipping**: Fixed the setup banner being cut off (#1078)
- **Rate Limit Errors**: Added helpful links for rate limit error messages (#956)

## [0.17.0] - 2025-08-14

### Added

- **GPT 5 Support**: Added OpenAI's GPT-5 model (#902)
- **Custom Models**: Add and manage custom AI models (#794)
- **Cross-App References**: Reference other Anyon apps in your prompts (#692)

### Fixed

- **Code Block UX**: Prevented content clicks from toggling accordion and added cursor-text in code blocks (#930)

## [0.16.0] - 2025-08-05

### Added

- **Neon / Portal Templates**: New project templates for Neon database and portal apps (#713)
- **Qwen3 Coder Model**: Added Qwen3 Coder to available models (#808)

## [0.15.0] - 2025-08-04

### Added

- **Vercel Deployment Improvements**: Auto-sync GitHub after connecting, better deployment URL handling (#756, #758)
- **Fix Problems with Code Snippets**: Problems panel now shows code snippets for easier debugging (#745)

### Changed

- **Improved System Prompt**: Refined the AI system prompt to reduce laziness and improve output quality (#751)
- **Supabase Security Best Practices**: Updated Supabase prompts to follow security best practices (#760)

### Fixed

- **Ctrl/Cmd+R for Refresh**: Intercept refresh shortcut to properly refresh the app preview (#759)
- **Proxy Server URL Params**: Fixed proxy server removing URL parameters that interfered with Next.js (#753)

## [0.14.0] - 2025-07-24

### Added

- **Community Templates**: Browse and use community-contributed project templates (#691)
- **Image Upload via Chat**: Upload images directly in the chat for visual context (#686)
- **Rename Chat**: Rename chat sessions for better organization (#673)

## [0.13.0] - 2025-07-18

### Added

- **Publish Panel**: Streamlined panel for pushing to GitHub and deploying to Vercel (#655)
- **Kimi K2 Model**: Added Kimi K2 model support (#662)
- **Environment Variables Panel**: Configure environment variables directly in the UI (#626)

### Changed

- **Increased File Size Limit**: Bumped maximum supported file size to 1MB (#633)
- **Improved Title Bar**: Extracted panel header to the title bar for a cleaner layout (#625)

### Fixed

- **Vercel URL**: Fixed issues with the Vercel deployment URL (#661)

## [0.12.0] - 2025-07-10

### Added

- **Beta Release Channel**: Opt-in to receive beta updates for early access to new features (#591)
- **Automatic Backups**: Anyon now backs up your projects when updating to a new version (#595)
- **File Editing (Graduated)**: File editing is now a stable feature, no longer experimental (#599)
- **Disable Auto-Update Setting**: Option to disable automatic updates (#590)

### Changed

- **Improved Error Checking**: Off-loaded TypeScript checking to worker thread with incremental compilation (#575)
- **Problems UX**: Polished the problems panel user experience (#593)

### Fixed

- **OLLAMA_HOST Support**: Fixed support for custom Ollama host configuration (#598)

## [0.11.0] - 2025-07-02

### Added

- **Auto-Fix Problems**: Automatic problem detection and AI-powered fixing with a dedicated problems panel (#541)
- **Type While Streaming**: Chat input now allows typing and attaching files while AI is streaming (#544)
- **YAML Support**: Added support for YAML/YML file editing (#535)

### Changed

- **Undo Renamed to Restore**: The "Undo" button in the version pane is now called "Restore" for clarity (#536)

## [0.10.0] - 2025-06-24

### Added

- **Capacitor Support**: Build mobile apps with Capacitor integration (#483)
- **Smart Auto Mode**: AI automatically selects the best context and approach (#476)
- **Paste Images**: Paste images directly from clipboard into chat (#472)
- **Configurable Thinking Budget**: Adjust the AI thinking budget with a default of medium (#494)
- **Astro Support**: Added support for Astro and other common frontend file extensions (#489)

## [0.9.0] - 2025-06-19

### Added

- **Ask Mode**: New chat mode for asking questions without making changes (#444)
- **DeepSeek R1 Model**: Added DeepSeek R1 model (#436)

### Changed

- **Engine for All Models**: All models now use the Anyon engine for consistent behavior (#434)

### Fixed

- **Nested Anyon Tags**: Fixed parsing of anyon tags containing nested angle brackets (#445)

## [0.8.0] - 2025-06-10

### Added

- **Click to Edit UI**: Click on any element in the preview to edit it (#385)
- **Manual Context Management**: Manually select which files to include in AI context (#376)
- **Next.js Template & Template Hub**: New Next.js starter template and browsable template hub (#241)
- **Copy App**: Duplicate existing apps as a starting point (#349)
- **Drag & Drop Images**: Drag and drop image files into the chat (#304)
- **Comprehensive E2E Tests**: Added extensive end-to-end testing coverage for core features (#277-#317)

### Changed

- **Removed Budget Saver Mode**: Simplified the interface by removing budget saver (#378)
- **Finetuned Model Picker**: Improved the model picker UI for easier selection (#375)

### Fixed

- **Copy App Bug**: Fixed issues with the copy app feature (#371)
- **Delete Provider Freeze**: Fixed UI freezing when deleting an AI provider (#468)

## [0.7.0] - 2025-05-23

### Added

- **Claude Sonnet 4 & o4-mini**: Added Claude Sonnet 4 and OpenAI o4-mini models (#237)
- **Clear Session Data**: Button to clear all session data for a fresh start (#231)
- **Turbo Edits & Smart Context Default**: Turbo edits and smart context are now enabled by default (#227)
- **Staging Engine**: Added staging engine support with logging (#225)

### Changed

- **Improved Loading Experience**: Show a loading bar during version checkout (#249)

### Fixed

- **Anyon Tags in Thinking Blocks**: Fixed escaped anyon tags inside thinking blocks (#229)
- **Git Checkout**: Removed force flag and properly handle checkout failures (#248)

---

_For versions prior to 0.7.0, see the [commit history](https://github.com/SL-IT-AMAZING/SLIT-ANYON/commits/main)._

[Unreleased]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.36.0...HEAD
[0.36.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.33.0...v0.35.0
[0.34.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.33.0...v0.34.0
[0.33.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.28.0...v0.31.0
[0.28.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.24.0...v0.27.0
[0.24.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.20.0...v0.24.0
[0.20.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.18.0...v0.20.0
[0.18.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/SL-IT-AMAZING/SLIT-ANYON/releases/tag/v0.7.0
