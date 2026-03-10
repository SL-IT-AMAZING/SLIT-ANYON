# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-10  
**Commit:** `60a52b2`  
**Branch:** `dev`

## OVERVIEW

ANYON is an Electron app for AI-assisted product/app building. The repo now contains both the desktop app and the tracked `engine/` plugin runtime in one git repo.

## STRUCTURE

```text
./
├── src/            # Electron app: main, renderer, IPC, pro features
├── engine/         # @anyon-cli/anyon plugin source + CLI + release workflows
├── e2e-tests/      # Playwright Electron tests, fixtures, snapshots
├── testing/        # Fake LLM + MCP servers
├── scaffold*/      # Import/generator templates
├── templates/      # Static design/template inventory
└── .github/        # Root app + engine publish workflows
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| App startup / Electron lifecycle | `src/main.ts` | Registers IPC, protocols, updater, app-scoped OpenCode config |
| App-side IPC contracts | `src/ipc/types/` | Single source of truth for channels and clients |
| App-side IPC handlers | `src/ipc/handlers/` | Main-process business logic, Zod validation via base handler |
| Chat UI / streaming UX | `src/components/chat/` | Lexical input, artifacts, tool rendering, streaming flows |
| App settings / provider setup | `src/components/settings/` | ANYON Pro, model, connection, billing surfaces |
| Plugin runtime / agents | `engine/src/` | Anyon plugin, hooks, tools, agents, CLI |
| Engine release loop | `.github/workflows/engine-publish*.yml` | Root-level workflows, run in `engine/` |
| App release loop | `.github/workflows/release.yml` | Electron Forge release |
| E2E infrastructure | `e2e-tests/`, `testing/` | Playwright + fake servers |

## ENTRY POINTS

- `src/main.ts` — Electron main process entry
- `src/renderer.tsx` + `src/router.ts` — renderer app entry
- `src/ipc/ipc_host.ts` — IPC handler registration hub
- `engine/src/index.ts` — Anyon plugin entry; now env-gated via `ANYON_ACTIVE`

## CONVENTIONS

- App side uses **Vitest**; engine uses **Bun test**.
- App side uses **Oxfmt** + **Oxlint**, not Prettier/ESLint.
- IPC is **contract-driven**: define in `src/ipc/types/*.ts`, implement in `src/ipc/handlers/*`, register in `src/ipc/ipc_host.ts`.
- React Query keys live in `src/lib/queryKeys.ts` only.
- Builder flow persists artifacts on disk: `.anyon/drafts`, `.anyon/briefs`, `.anyon/flows`, `.anyon/specs`, `.anyon/plans`.
- Plain OpenCode should stay user-controlled; Anyon is app-scoped via `OPENCODE_CONFIG_DIR` + `ANYON_ACTIVE=1` for app-launched sessions.

## ANTI-PATTERNS (THIS REPO)

- Don’t hand-write SQL migrations; use `npm run db:generate`.
- Don’t return `{ success: false }` from IPC handlers; throw errors.
- Don’t create ad-hoc React Query keys outside `src/lib/queryKeys.ts`.
- Don’t run E2E without `npm run build` first.
- Don’t assume `engine/` is still a submodule; it is tracked content now.
- Don’t make plain OpenCode depend on Anyon plugin activation; app-only activation is intentional.

## TESTING

- App: `npm run test`
- App typecheck: `npm run ts`
- Engine: `cd engine && bun test`
- Engine typecheck: `cd engine && bun run typecheck`
- E2E: `PLAYWRIGHT_HTML_OPEN=never npm run e2e` after `npm run build`

## BUILD / RELEASE

- App build: `npm run build`
- App publish: `.github/workflows/release.yml`
- Engine npm/platform publish: `.github/workflows/engine-publish.yml`, `.github/workflows/engine-publish-platform.yml`
- Engine package root remains `engine/package.json`

## NOTES

- Root repo is monorepo-style, but package management is still split (root npm, engine bun).
- `templates/` and most scaffold variants are content/example domains; avoid over-documenting them unless changing generator behavior.
- Use child `AGENTS.md` files for high-complexity domains (`src/ipc`, `src/components/chat`, `e2e-tests`, `engine/src`).
