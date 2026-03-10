# src/components/chat/ — Chat UX, Streaming, Artifacts

**Generated:** 2026-03-10

## OVERVIEW

Chat is a specialized domain: Lexical input, tool cards, Builder artifacts, streaming responses, and preview/build coordination all converge here.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Main input flow | `ChatInput.tsx`, `LexicalChatInput.tsx` | Builder/Craftsman input, mentions, send flow |
| Artifact visibility | `PlanningArtifactPanel.tsx` | Draft / brief / user flows / spec / wave plan |
| Planning interactions | `QuestionnaireInput.tsx`, `AnyonMarkdownParser.tsx`, `chat-v2/tools/*` | Questionnaire + Accept Plan flow |
| Message list | `MessagesList.tsx`, `chat-v2/` | Streaming + tool rendering |
| Input controls | `ChatInputControls.tsx`, `AgentPicker.tsx` | Agent selection and adjacent controls |

## CONVENTIONS

- Keep Builder as the visible main agent; Craftsman is the implementation/fixer specialist.
- Chat UI must stay founder-friendly; don’t leak Taskmaster/Strategist jargon into visible copy.
- `PlanningArtifactPanel` should remain compact and subordinate to the main input flow.
- Lexical requires keyboard-based clearing and careful Playwright handling.

## ANTI-PATTERNS

- Don’t use generic `fill("")` assumptions with Lexical.
- Don’t reintroduce searchable/complex agent-picker UI unless requested.
- Don’t hide Builder lifecycle artifacts once they are user-visible state.

## TESTING GOTCHAS

- Playwright must click visible text/labels for some Base UI controls.
- Lexical interactions need retry-aware helpers.
- Snapshot drift often comes from dynamic IDs, not visual changes.
