# src/ — Electron App Source

**Generated:** 2026-03-10

## OVERVIEW

App-side source contains the Electron main process, renderer app, IPC layer, premium features, and local utilities.

## STRUCTURE

```text
src/
├── main.ts              # Electron bootstrap
├── routes/, pages/      # TanStack Router route defs + page components
├── components/          # UI domains (chat, settings, preview, auth, subscription)
├── ipc/                 # Contracts, handlers, utils, processors, preload
├── pro/                 # Premium-only architecture boundary
├── hooks/, atoms/       # Renderer state + data access
└── lib/, db/, paths/    # Shared helpers, schemas, database, filesystem paths
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| App bootstrap | `main.ts` | IPC, protocol registration, updater, OpenCode server setup |
| Renderer routing | `routes/`, `pages/` | TanStack Router, not Next.js routing |
| Chat/product-building UX | `components/chat/`, `components/chat-v2/` | Lexical input, artifacts, tool cards |
| Settings/provider UX | `components/settings/` | AI/provider setup, billing, connection mode |
| IPC implementation | `ipc/` | Highest-complexity app domain |
| Premium visual editing | `pro/` | Separate IPC/utility/UI boundary |

## CONVENTIONS

- TanStack Router route defs live in `routes/`; `pages/` are render components only.
- Global state is Jotai + React Query; avoid extra state layers.
- App-launched OpenCode sessions use app-scoped config isolation.
- Builder artifacts are part of normal app UX now; don’t hide them in filesystem-only flows.

## ANTI-PATTERNS

- Don’t treat `src/` as a generic React SPA; Electron main/preload/runtime boundaries matter.
- Don’t add business logic directly into renderer components if an IPC handler already owns it.
- Don’t duplicate app-side config parsing when `ipc/utils/` or `lib/schemas.ts` already defines the contract.

## CHILD GUIDES

- `ipc/AGENTS.md` — contract-driven IPC rules
- `components/chat/AGENTS.md` — chat/artifact/streaming rules
- `pro/AGENTS.md` — premium visual editing boundary
