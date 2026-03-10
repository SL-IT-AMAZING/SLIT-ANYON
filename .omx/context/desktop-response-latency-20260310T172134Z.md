Task statement: Improve ANYON desktop app to response latency and stream stability as much as possible without introducing errors.

Desired outcome:
- Faster first response and follow-up response startup
- No input lock or stream restart regressions
- Lower cold-start and per-submit overhead
- Keep behavior compatible with current app flows

Known facts / evidence:
- Lexical input lock after submit was fixed by syncing editability and restoring focus.
- CWD mismatch restarts in `src/ipc/utils/opencode_server.ts` were fixed via path normalization and resolved-path usage.
- Upstream opencode prewarms the sidecar during desktop startup and keeps a persistent global event stream.
- ANYON still lazily starts OpenCode in the submit path via `src/ipc/utils/opencode_provider.ts`.
- ANYON still performs repeated bootstrap work in renderer hooks like `useSettings`, plus proposal/token queries near the chat path.

Constraints:
- Minimal safe changes only; avoid broad refactors.
- Do not break current Electron + IPC contracts.
- Preserve app-scoped OpenCode config isolation.
- Verify with diagnostics and targeted tests/typecheck.

Unknowns / open questions:
- Whether eager OpenCode prewarm should be gated by settings or app readiness only.
- Which chat-page queries can be deferred without changing UX expectations.
- Whether a persistent OpenCode event stream is feasible as a low-risk patch in this session.

Likely codebase touchpoints:
- `src/main.ts`
- `src/ipc/utils/opencode_server.ts`
- `src/ipc/utils/opencode_api.ts`
- `src/ipc/utils/opencode_provider.ts`
- `src/hooks/useSettings.ts`
- `src/components/chat/ChatInput.tsx`
- `src/hooks/useProposal.ts`
- `src/hooks/useCountTokens.ts`
