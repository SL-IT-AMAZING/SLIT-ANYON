# Dyad System Prompts Documentation

This directory contains documentation for all system prompts used in Dyad, an Electron-based AI code editor.

## Overview

Dyad uses multiple specialized system prompts to handle different interaction modes and features. Each prompt is designed for a specific purpose and includes instructions, constraints, and examples to guide the AI's behavior.

## Chat Modes

| Mode            | File                               | Description                                   |
| --------------- | ---------------------------------- | --------------------------------------------- |
| **Build**       | [build-mode.md](./build-mode.md)   | Main coding mode - creates and modifies files |
| **Ask**         | [ask-mode.md](./ask-mode.md)       | Explanation-only mode - NO code generation    |
| **Agent**       | [agent-mode.md](./agent-mode.md)   | Tool gathering phase before coding            |
| **Plan**        | [plan-mode.md](./plan-mode.md)     | Requirements gathering and planning           |
| **Local Agent** | [local-agent.md](./local-agent.md) | Tool-based agent (Pro/Basic/Ask variants)     |

## Additional Prompts

| Prompt           | File                                 | Description                                  |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| **Utilities**    | [utilities.md](./utilities.md)       | Thinking, Summarize, Security Review prompts |
| **Integrations** | [integrations.md](./integrations.md) | Supabase integration instructions            |
| **Themes**       | [themes.md](./themes.md)             | Theme system and default styling guidelines  |
| **Turbo Edits**  | [turbo-edits.md](./turbo-edits.md)   | Search/replace diff format                   |

## Architecture

### Prompt Construction

The main entry point is `constructSystemPrompt()` in `src/prompts/system_prompt.ts`:

```typescript
constructSystemPrompt({
  aiRules, // Project-specific rules from AI_RULES.md
  chatMode, // "build" | "ask" | "agent" | "local-agent" | "plan"
  enableTurboEditsV2,
  themePrompt, // Optional theme styling guidelines
  readOnly, // For local-agent ask mode
  basicAgentMode, // For free tier
});
```

### Configuration Placeholders

- **`[[AI_RULES]]`** - Replaced with project-specific rules from `AI_RULES.md` or default rules
- **`themePrompt`** - Appended for styling guidance when a theme is selected

### Default AI Rules

When no `AI_RULES.md` exists, the default rules specify:

- React + TypeScript
- React Router (routes in `src/App.tsx`)
- Tailwind CSS for styling
- shadcn/ui component library
- lucide-react for icons
- Standard folder structure (`src/pages/`, `src/components/`)

## Source Files

| File            | Location                                        |
| --------------- | ----------------------------------------------- |
| Main prompts    | `src/prompts/system_prompt.ts`                  |
| Plan mode       | `src/prompts/plan_mode_prompt.ts`               |
| Local agent     | `src/prompts/local_agent_prompt.ts`             |
| Supabase        | `src/prompts/supabase_prompt.ts`                |
| Chat summary    | `src/prompts/summarize_chat_system_prompt.ts`   |
| Security review | `src/prompts/security_review_prompt.ts`         |
| Turbo edits     | `src/pro/main/prompts/turbo_edits_v2_prompt.ts` |
| Themes          | `src/shared/themes.ts`                          |

## Custom Tags

Dyad uses custom XML-like tags for structured output:

| Tag                       | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `<dyad-write>`            | Create or update files                        |
| `<dyad-delete>`           | Remove files                                  |
| `<dyad-rename>`           | Rename files                                  |
| `<dyad-add-dependency>`   | Install npm packages                          |
| `<dyad-command>`          | Suggest UI commands (rebuild/restart/refresh) |
| `<dyad-chat-summary>`     | Set chat title                                |
| `<dyad-search-replace>`   | Surgical file edits                           |
| `<dyad-add-integration>`  | Add integrations (e.g., Supabase)             |
| `<dyad-security-finding>` | Security review findings                      |
