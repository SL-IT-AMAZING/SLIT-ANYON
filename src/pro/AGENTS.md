# src/pro/ — Premium Visual Editing Boundary

**Generated:** 2026-03-10

## OVERVIEW

`src/pro/` is not a simple feature flag folder. It is a premium architecture boundary with its own main-process IPC handlers, shared parsing utilities, and renderer-side UI.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Main-process premium handlers | `main/ipc/handlers/` | Visual editing and premium IPC behavior |
| Shared premium parsing | `shared/` | Search/replace parser, markers, shared prompt utilities |
| Premium UI | `ui/components/` | Annotator and premium visual editing surfaces |

## CONVENTIONS

- Keep premium logic isolated from general app-side IPC unless the boundary is intentionally crossed.
- Shared parsing/helpers in `shared/` should stay usable from both main and renderer contexts.
- Treat visual editing as a safety-sensitive path: parsing, selection, and DOM targeting must remain deterministic.

## ANTI-PATTERNS

- Don’t move premium-only logic into generic `src/ipc/` without a clear reason.
- Don’t duplicate parser behavior between `pro/shared/` and app-side utilities.
- Don’t make visual editing depend on unstable UI copy or transient DOM structure.
