## What's New in Anyon v0.36.0

### Highlights

- **Planning Mode**: Scope and plan features with an AI-powered interactive questionnaire before building
- **Base UI Migration**: Migrated from Radix to Base UI for better performance and consistency
- **Chat Panel Toggle & Input History**: More control over your workspace and faster message recall

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

---

## Installation

| Platform                  | Download                       |
| ------------------------- | ------------------------------ |
| **macOS (Apple Silicon)** | `anyon-0.36.0-arm64.dmg`       |
| **macOS (Intel)**         | `anyon-0.36.0-x64.dmg`         |
| **Windows**               | `anyon-0.36.0.Setup.exe`       |
| **Linux (AppImage)**      | `anyon_0.36.0_x86_64.AppImage` |
| **Linux (Debian/Ubuntu)** | `anyon_0.36.0_amd64.deb`       |
| **Linux (Fedora/RHEL)**   | `anyon-0.36.0-1.x86_64.rpm`    |

## Auto-Update

Existing users will automatically receive this update. You can check for updates manually in **Settings > General > Check for Updates**.

## Full Changelog

See [CHANGELOG.md](https://github.com/SL-IT-AMAZING/SLIT-ANYON/blob/main/CHANGELOG.md) for the complete list of changes.
