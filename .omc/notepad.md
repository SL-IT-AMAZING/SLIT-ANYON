# Notepad

<!-- Auto-managed by OMC. Manual edits preserved in MANUAL section. -->

## Priority Context

<!-- ALWAYS loaded. Keep under 500 chars. Critical discoveries only. -->

## Working Memory

<!-- Session notes. Auto-pruned after 7 days. -->

### 2026-03-02 10:04

Implemented OpenCode question/permission handling: added SSE branches for permission.asked (auto-allow via /permission/:id/reply) and question.asked (emit <opencode-question> JSON payload). Added chat:reply-question IPC contract + handler posting answers to /question/:requestID/reply. Added opencode-question tag support in markdown parser, turn summarization (question step), and SessionTurn rendering via QuestionPrompt + chatClient.replyToQuestion. TS passed; full lint still fails from pre-existing unrelated template/preview files.

### 2026-03-02 11:15

Chat step rendering overhaul: todoread must be skipped before active tool assignment, todowrite works best as a synthetic step rendered from agentTodos atom state (not tag JSON), and context grouping should use both toolName + statusToolName to catch opencode + anyon tags consistently. Added 2500ms throttled status text via timer/ref to avoid rapid flicker while preserving immediate update when idle.

### 2026-03-02 11:39

preview-themes: reused preview-shadcn scaffold; implemented APPLY_THEME with var-name normalization and light->root + dark->injected .dark style; avoided extra Tailwind plugins; build currently fails until dependencies are installed in preview-apps/preview-themes.

## 2026-03-02 10:04

Implemented OpenCode question/permission handling: added SSE branches for permission.asked (auto-allow via /permission/:id/reply) and question.asked (emit <opencode-question> JSON payload). Added chat:reply-question IPC contract + handler posting answers to /question/:requestID/reply. Added opencode-question tag support in markdown parser, turn summarization (question step), and SessionTurn rendering via QuestionPrompt + chatClient.replyToQuestion. TS passed; full lint still fails from pre-existing unrelated template/preview files.

### 2026-03-02 11:15

Chat step rendering overhaul: todoread must be skipped before active tool assignment, todowrite works best as a synthetic step rendered from agentTodos atom state (not tag JSON), and context grouping should use both toolName + statusToolName to catch opencode + anyon tags consistently. Added 2500ms throttled status text via timer/ref to avoid rapid flicker while preserving immediate update when idle.

## 2026-03-02 10:04

Implemented OpenCode question/permission handling: added SSE branches for permission.asked (auto-allow via /permission/:id/reply) and question.asked (emit <opencode-question> JSON payload). Added chat:reply-question IPC contract + handler posting answers to /question/:requestID/reply. Added opencode-question tag support in markdown parser, turn summarization (question step), and SessionTurn rendering via QuestionPrompt + chatClient.replyToQuestion. TS passed; full lint still fails from pre-existing unrelated template/preview files.

## MANUAL

<!-- User content. Never auto-pruned. -->
