# src/ipc/ — Contract-Driven IPC Boundary

**Generated:** 2026-03-10

## OVERVIEW

This is the app’s highest-complexity domain. Contracts in `types/` define channels and clients; handlers in `handlers/` implement the main-process behavior.

## STRUCTURE

```text
ipc/
├── contracts/      # defineContract / defineEvent / defineStream
├── types/          # per-domain contracts + generated clients
├── handlers/       # main-process implementations
├── utils/          # providers, git, OpenCode, file/process helpers
├── processors/     # response/dependency transforms
├── preload/        # allowlist and bridge
└── ipc_host.ts     # registration hub
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Add endpoint | `types/*.ts` → `handlers/*` → `ipc_host.ts` | Contract first |
| Stream behavior | `types/chat.ts`, `handlers/chat_stream_handlers.ts` | Chat/build pipeline |
| Artifact lifecycle | `handlers/planning_artifacts_handlers.ts`, `handlers/builder_wave_plan.ts` | Draft/brief/flow/spec/wave persistence |
| OpenCode session launch | `utils/opencode_server.ts` | App-scoped config + env injection |
| Config setup | `utils/opencode_config_setup.ts`, `utils/app_scoped_opencode_config.ts` | Plain OpenCode vs app-only Anyon |
| Validation base | `handlers/base.ts` | Zod validation + logging wrappers |

## CONVENTIONS

- Contracts are the source of truth; clients are generated from them.
- Handlers throw on failure; don’t invent `{ success: false }` payloads.
- `createTypedHandler()` is mandatory for runtime validation.
- Planning artifacts are separate from execution plans; `.anyon/plans` remains execution-facing.
- Anyon app sessions must not mutate the user’s plain OpenCode plugin setup.

## ANTI-PATTERNS

- Don’t bypass `types/` and manually add channels.
- Don’t hand-roll preload allowlists.
- Don’t mix founder-facing artifact files with mutable execution checkbox plans.
- Don’t reintroduce global Anyon activation into default OpenCode config.

## TESTING

- Heavy handler tests use Vitest with aggressive mocking.
- Mock `electron`, `fs`, and git/process utilities carefully.
- Prefer file-backed tests for artifact persistence and wave-plan generation.
