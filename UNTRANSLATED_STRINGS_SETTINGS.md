# Untranslated User-Facing Strings in Settings Components

## Summary

Found **multiple hardcoded user-facing strings** across settings-related components that need i18n keys.

---

## 1. **MaxChatTurnsSelector.tsx**

### Location: `src/components/MaxChatTurnsSelector.tsx`

| Line | Hardcoded String                                                     | Type               | Suggested i18n Key                           |
| ---- | -------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| 23   | "Economy (2)"                                                        | Option label       | `settings:chat.maxTurns.economy.label`       |
| 25   | "Minimal context to reduce token usage and improve response times."  | Option description | `settings:chat.maxTurns.economy.description` |
| 29   | "Default (${MAX_CHAT_TURNS_IN_CONTEXT})"                             | Option label       | `settings:chat.maxTurns.default.label`       |
| 30   | "Balanced context size for most conversations."                      | Option description | `settings:chat.maxTurns.default.description` |
| 34   | "Plus (5)"                                                           | Option label       | `settings:chat.maxTurns.plus.label`          |
| 35   | "Slightly higher context size for detailed conversations."           | Option description | `settings:chat.maxTurns.plus.description`    |
| 39   | "High (10)"                                                          | Option label       | `settings:chat.maxTurns.high.label`          |
| 41   | "Extended context for complex conversations requiring more history." | Option description | `settings:chat.maxTurns.high.description`    |
| 45   | "Max (100)"                                                          | Option label       | `settings:chat.maxTurns.max.label`           |
| 46   | "Maximum context (not recommended due to cost and speed)."           | Option description | `settings:chat.maxTurns.max.description`     |
| 77   | "Maximum number of chat turns used in context"                       | Label              | `settings:chat.maxTurnsLabel`                |
| 84   | "Select turns"                                                       | Placeholder        | `settings:chat.maxTurnsPlaceholder`          |

---

## 2. **ThinkingBudgetSelector.tsx**

### Location: `src/components/ThinkingBudgetSelector.tsx`

| Line | Hardcoded String                                                  | Type               | Suggested i18n Key                            |
| ---- | ----------------------------------------------------------------- | ------------------ | --------------------------------------------- |
| 22   | "Low"                                                             | Option label       | `settings:thinking.budget.low.label`          |
| 24   | "Minimal thinking tokens for faster responses and lower costs."   | Option description | `settings:thinking.budget.low.description`    |
| 28   | "Medium (default)"                                                | Option label       | `settings:thinking.budget.medium.label`       |
| 29   | "Balanced thinking for most conversations."                       | Option description | `settings:thinking.budget.medium.description` |
| 33   | "High"                                                            | Option label       | `settings:thinking.budget.high.label`         |
| 35   | "Extended thinking for complex problems requiring deep analysis." | Option description | `settings:thinking.budget.high.description`   |
| 60   | "Thinking Budget"                                                 | Label              | `settings:thinking.budgetLabel`               |
| 67   | "Select budget"                                                   | Placeholder        | `settings:thinking.budgetPlaceholder`         |

---

## 3. **DefaultChatModeSelector.tsx**

### Location: `src/components/DefaultChatModeSelector.tsx`

| Line | Hardcoded String                              | Type                   | Suggested i18n Key                                         |
| ---- | --------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| 39   | "Build"                                       | Chat mode display name | `settings:chatMode.build`                                  |
| 41   | "Build (MCP)"                                 | Chat mode display name | `settings:chatMode.buildMcp`                               |
| 43   | "Agent" / "Basic Agent"                       | Chat mode display name | `settings:chatMode.agent` / `settings:chatMode.basicAgent` |
| 57   | "Default Chat Mode"                           | Label                  | `settings:chat.defaultModeLabel`                           |
| 71   | "Agent" / "Basic Agent"                       | Option display         | `settings:chatMode.agent` / `settings:chatMode.basicAgent` |
| 75   | "Better at bigger tasks"                      | Option description     | `settings:chatMode.agentDescription`                       |
| 76   | "Free tier (5 messages/day)"                  | Option description     | `settings:chatMode.basicAgentDescription`                  |
| 83   | "Build"                                       | Option display         | `settings:chatMode.build`                                  |
| 85   | "Generate and edit code"                      | Option description     | `settings:chatMode.buildDescription`                       |
| 91   | "Build with MCP"                              | Option display         | `settings:chatMode.buildMcp`                               |
| 93   | "Build with tools (MCP)"                      | Option description     | `settings:chatMode.buildMcpDescription`                    |
| 101  | "The chat mode used when creating new chats." | Help text              | `settings:chat.defaultModeDescription`                     |

---

## 4. **ChatCompletionNotificationSwitch.tsx**

### Location: `src/components/ChatCompletionNotificationSwitch.tsx`

| Line | Hardcoded String                        | Type  | Suggested i18n Key                        |
| ---- | --------------------------------------- | ----- | ----------------------------------------- |
| 32   | "Show notification when chat completes" | Label | `settings:workflow.chatNotificationLabel` |

---

## 5. **OpenCodeConnectionModeSelector.tsx**

### Location: `src/components/OpenCodeConnectionModeSelector.tsx`

| Line       | Hardcoded String                                                                 | Type           | Suggested i18n Key                                                                                               |
| ---------- | -------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| 104        | "OpenCode Connection"                                                            | Label          | `settings:openCode.connectionLabel`                                                                              |
| 114        | "ANYON Pro (Proxy Server)"                                                       | Option         | `settings:openCode.proxyOption`                                                                                  |
| 115        | "Direct (Your Subscription)"                                                     | Option         | `settings:openCode.directOption`                                                                                 |
| 121        | "Route AI requests through ANYON proxy server (requires ANYON Pro subscription)" | Help text      | `settings:openCode.proxyDescription`                                                                             |
| 122        | "Use your own OpenCode/Claude subscription directly (for development)"           | Help text      | `settings:openCode.directDescription`                                                                            |
| 128        | "ANYON Pro API Key"                                                              | Label          | `settings:openCode.apiKeyLabel`                                                                                  |
| 164        | "anyon\_..."                                                                     | Placeholder    | `settings:openCode.apiKeyPlaceholder`                                                                            |
| 175        | "Saving..." / "Save"                                                             | Button text    | `settings:openCode.savingButton` / `settings:openCode.saveButton`                                                |
| 61         | "ANYON Pro API key saved"                                                        | Toast message  | `settings:openCode.keySavedToast`                                                                                |
| 84         | "API key removed"                                                                | Toast message  | `settings:openCode.keyRemovedToast`                                                                              |
| 32, 64, 87 | Error messages                                                                   | Toast messages | `settings:openCode.updateErrorToast` / `settings:openCode.saveErrorToast` / `settings:openCode.removeErrorToast` |

---

## 6. **RuntimeModeSelector.tsx**

### Location: `src/components/RuntimeModeSelector.tsx`

| Line | Hardcoded String                                                                             | Type            | Suggested i18n Key                 |
| ---- | -------------------------------------------------------------------------------------------- | --------------- | ---------------------------------- |
| 35   | "Runtime Mode"                                                                               | Label           | `settings:runtime.modeLabel`       |
| 45   | "Local (default)"                                                                            | Option          | `settings:runtime.localOption`     |
| 46   | "Docker (experimental)"                                                                      | Option          | `settings:runtime.dockerOption`    |
| 51   | "Choose whether to run apps directly on the local machine or in Docker containers"           | Help text       | `settings:runtime.modeDescription` |
| 57   | "⚠️ Docker mode is **experimental** and requires Docker Desktop to be installed and running" | Warning message | `settings:runtime.dockerWarning`   |

---

## 7. **NodePathSelector.tsx**

### Location: `src/components/NodePathSelector.tsx`

| Line   | Hardcoded String                                                                | Type          | Suggested i18n Key                                                    |
| ------ | ------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| 107    | "Node.js Path Configuration"                                                    | Label         | `settings:nodejs.pathConfigLabel`                                     |
| 118    | "Selecting..." / "Browse for Node.js"                                           | Button text   | `settings:nodejs.selectingButton` / `settings:nodejs.browseButton`    |
| 129    | "Reset to Default"                                                              | Button text   | `settings:nodejs.resetButton`                                         |
| 138    | "Custom Path:" / "System PATH:"                                                 | Status label  | `settings:nodejs.customPathLabel` / `settings:nodejs.systemPathLabel` |
| 142    | "Custom"                                                                        | Badge text    | `settings:nodejs.customBadge`                                         |
| 163    | "Not found"                                                                     | Status text   | `settings:nodejs.notFoundStatus`                                      |
| 173    | "Node.js is properly configured and ready to use."                              | Help text     | `settings:nodejs.configuredHelp`                                      |
| 177    | "Select the folder where Node.js is installed if it's not in your system PATH." | Help text     | `settings:nodejs.selectFolderHelp`                                    |
| 70     | "Node.js path updated successfully"                                             | Toast         | `settings:nodejs.pathUpdatedToast`                                    |
| 91     | "Reset to system Node.js path"                                                  | Toast         | `settings:nodejs.resetToastSuccess`                                   |
| 30, 33 | "System PATH (not available)"                                                   | Fallback text | `settings:nodejs.systemPathNotAvailable`                              |

---

## 8. **DeleteConfirmationDialog.tsx**

### Location: `src/components/DeleteConfirmationDialog.tsx`

| Line | Hardcoded String                                                              | Type                  | Suggested i18n Key                         |
| ---- | ----------------------------------------------------------------------------- | --------------------- | ------------------------------------------ |
| 40   | "Delete ${itemType.toLowerCase()}"                                            | Title/aria-label      | `common:deleteConfirmation.title`          |
| 47   | "Delete {itemType}"                                                           | Dialog title          | `common:deleteConfirmation.dialogTitle`    |
| 49   | 'Are you sure you want to delete "{itemName}"? This action cannot be undone.' | Dialog description    | `common:deleteConfirmation.description`    |
| 54   | "Cancel"                                                                      | Button text           | `common:deleteConfirmation.cancelButton`   |
| 59   | "Deleting..."                                                                 | Button text (loading) | `common:deleteConfirmation.deletingButton` |
| 62   | "Delete"                                                                      | Button text           | `common:deleteConfirmation.deleteButton`   |

---

## 9. **LanguageSelector.tsx** (Minor - Already Mostly Translated)

### Location: `src/components/LanguageSelector.tsx`

| Line  | Issue                           | Note                                                            |
| ----- | ------------------------------- | --------------------------------------------------------------- |
| 15-16 | LANGUAGE_LABELS hardcoded       | Consider moving to i18n for consistency                         |
| 20-21 | LANGUAGE_DESCRIPTIONS hardcoded | Already has Korean, but should be in i18n structure             |
| 52    | "Select language"               | Placeholder should use `t("general.languageSelectPlaceholder")` |

---

## 10. **Additional Hardcoded Strings Found**

### Select Placeholders

- `"Select turns"` (MaxChatTurnsSelector.tsx:84)
- `"Select budget"` (ThinkingBudgetSelector.tsx:67)
- `"Select language"` (LanguageSelector.tsx:52)

### Error/Success Messages (Toast)

- Various error messages in OpenCodeConnectionModeSelector and NodePathSelector with dynamic text

---

## Recommended i18n Namespace Structure

```json
{
  "settings": {
    "chat": {
      "maxTurns": {
        "economy": { "label": "Economy (2)", "description": "..." },
        "default": { "label": "Default (...)", "description": "..." },
        "plus": { "label": "Plus (5)", "description": "..." },
        "high": { "label": "High (10)", "description": "..." },
        "max": { "label": "Max (100)", "description": "..." }
      },
      "maxTurnsLabel": "Maximum number of chat turns used in context",
      "maxTurnsPlaceholder": "Select turns",
      "defaultModeLabel": "Default Chat Mode",
      "defaultModeDescription": "The chat mode used when creating new chats."
    },
    "thinking": {
      "budget": {
        "low": { "label": "Low", "description": "..." },
        "medium": { "label": "Medium (default)", "description": "..." },
        "high": { "label": "High", "description": "..." }
      },
      "budgetLabel": "Thinking Budget",
      "budgetPlaceholder": "Select budget"
    },
    "chatMode": {
      "build": "Build",
      "buildMcp": "Build (MCP)",
      "agent": "Agent",
      "basicAgent": "Basic Agent",
      "agentDescription": "Better at bigger tasks",
      "basicAgentDescription": "Free tier (5 messages/day)",
      "buildDescription": "Generate and edit code",
      "buildMcpDescription": "Build with tools (MCP)"
    },
    "workflow": {
      "chatNotificationLabel": "Show notification when chat completes"
    },
    "openCode": {
      "connectionLabel": "OpenCode Connection",
      "proxyOption": "ANYON Pro (Proxy Server)",
      "directOption": "Direct (Your Subscription)",
      "proxyDescription": "Route AI requests through ANYON proxy server...",
      "directDescription": "Use your own OpenCode/Claude subscription...",
      "apiKeyLabel": "ANYON Pro API Key",
      "apiKeyPlaceholder": "anyon_...",
      "savingButton": "Saving...",
      "saveButton": "Save",
      "keySavedToast": "ANYON Pro API key saved",
      "keyRemovedToast": "API key removed"
    },
    "runtime": {
      "modeLabel": "Runtime Mode",
      "localOption": "Local (default)",
      "dockerOption": "Docker (experimental)",
      "modeDescription": "Choose whether to run apps...",
      "dockerWarning": "⚠️ Docker mode is experimental..."
    },
    "nodejs": {
      "pathConfigLabel": "Node.js Path Configuration",
      "selectingButton": "Selecting...",
      "browseButton": "Browse for Node.js",
      "resetButton": "Reset to Default",
      "customPathLabel": "Custom Path:",
      "systemPathLabel": "System PATH:",
      "customBadge": "Custom",
      "notFoundStatus": "Not found",
      "configuredHelp": "Node.js is properly configured...",
      "selectFolderHelp": "Select the folder where Node.js..."
    }
  },
  "common": {
    "deleteConfirmation": {
      "title": "Delete {itemType}",
      "dialogTitle": "Delete {itemType}",
      "description": "Are you sure you want to delete \"{itemName}\"?...",
      "cancelButton": "Cancel",
      "deletingButton": "Deleting...",
      "deleteButton": "Delete"
    }
  }
}
```

---

## Translation Impact Summary

| Component                            | Hardcoded Strings | Severity                      |
| ------------------------------------ | ----------------- | ----------------------------- |
| MaxChatTurnsSelector.tsx             | 12                | **HIGH** - 50+ words          |
| ThinkingBudgetSelector.tsx           | 8                 | **HIGH** - 40+ words          |
| DefaultChatModeSelector.tsx          | 12                | **HIGH** - 60+ words          |
| OpenCodeConnectionModeSelector.tsx   | 9+                | **HIGH** - 80+ words          |
| RuntimeModeSelector.tsx              | 5                 | **MEDIUM** - 30+ words        |
| NodePathSelector.tsx                 | 8+                | **MEDIUM** - 50+ words        |
| ChatCompletionNotificationSwitch.tsx | 1                 | **LOW** - 6 words             |
| DeleteConfirmationDialog.tsx         | 6                 | **MEDIUM** - 25+ words        |
| LanguageSelector.tsx                 | 3                 | **LOW** - Already mostly done |

**Total: 64+ hardcoded user-facing strings requiring i18n keys**
