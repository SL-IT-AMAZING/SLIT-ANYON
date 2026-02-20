# Untranslated Settings Strings - Quick Reference

## Executive Summary

- **Files Affected**: 9 components
- **Total Hardcoded Strings**: 64+
- **Total Words**: 500+ user-facing words
- **Recommended Phases**: 3

## Critical Issues (Implement First)

### 1. DefaultChatModeSelector.tsx

**12 hardcoded strings** across chat mode selection

- Build, Agent, Basic Agent mode names
- Descriptions for each mode
- Default chat mode label

### 2. MaxChatTurnsSelector.tsx

**12 hardcoded strings** for context window options

- Economy, Default, Plus, High, Max option labels
- Descriptions for each tier
- Main label and placeholder

### 3. OpenCodeConnectionModeSelector.tsx

**11+ hardcoded strings** for API connection setup

- Proxy vs Direct options
- API Key configuration labels
- Toast messages and buttons

### 4. ThinkingBudgetSelector.tsx

**8 hardcoded strings** for thinking budget levels

- Low, Medium, High option labels
- Descriptions for each level
- Main label and placeholder

## High Priority Issues

### 5. NodePathSelector.tsx

**11 hardcoded strings** for Node.js configuration

- Button texts (Browse, Reset, etc.)
- Status labels and help text
- Toast messages

### 6. DeleteConfirmationDialog.tsx

**6 hardcoded strings** (REUSABLE across app)

- Dialog title and description
- Cancel, Delete, Deleting button texts
- _Used by multiple components_

### 7. RuntimeModeSelector.tsx

**5 hardcoded strings** for runtime mode selection

- Local vs Docker options
- Warning message about experimental feature

## Low Priority Issues

### 8. ChatCompletionNotificationSwitch.tsx

**1 hardcoded string** - notification toggle label

### 9. LanguageSelector.tsx

**3 strings** - consistency issue, already partially translated

---

## File Locations for Quick Access

```
src/components/MaxChatTurnsSelector.tsx         (Lines 23, 25, 29-46, 77, 84)
src/components/ThinkingBudgetSelector.tsx       (Lines 22-35, 60, 67)
src/components/DefaultChatModeSelector.tsx      (Lines 39-101)
src/components/ChatCompletionNotificationSwitch.tsx (Line 32)
src/components/OpenCodeConnectionModeSelector.tsx (Lines 104-189)
src/components/RuntimeModeSelector.tsx          (Lines 35-57)
src/components/NodePathSelector.tsx             (Lines 30-177)
src/components/DeleteConfirmationDialog.tsx     (Lines 40-62)
src/components/LanguageSelector.tsx             (Lines 15-52)
```

---

## Implementation Strategy

### Namespace Structure

```
settings:
  ├── chat.maxTurns.{economy,default,plus,high,max}
  ├── thinking.budget.{low,medium,high}
  ├── chatMode.{build,buildMcp,agent,basicAgent}
  ├── workflow.chatNotificationLabel
  ├── openCode.{connectionLabel,proxyOption,directOption,...}
  ├── runtime.{modeLabel,localOption,dockerOption,...}
  └── nodejs.{pathConfigLabel,browseButton,resetButton,...}

common:
  └── deleteConfirmation.{title,description,cancelButton,...}
```

### Translation Effort Estimate

- **4 CRITICAL components**: ~2-3 hours
- **3 HIGH components**: ~1-2 hours
- **2 LOW components**: ~30 minutes
- **Total**: ~4 hours for full i18n migration

---

## Testing Checklist

After implementing translations:

- [ ] All selector options display correctly
- [ ] All button text translates properly
- [ ] Toast messages appear in correct language
- [ ] Help text and descriptions are readable
- [ ] Placeholder text is appropriate
- [ ] Dialog descriptions show correctly
- [ ] No overflow or layout issues with longer translations (e.g., Korean)

---

## Detailed Reports

For full details with line numbers and context:

- `UNTRANSLATED_STRINGS_SETTINGS.md` - Organized by component with i18n keys
- `UNTRANSLATED_STRINGS_DETAILED.txt` - Complete analysis with line references
