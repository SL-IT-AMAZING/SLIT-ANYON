# .github/ — CI, Release, Publish Workflows

**Generated:** 2026-03-10

## OVERVIEW

Root workflows now cover both the Electron app and the engine publish loop after the monorepo conversion.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| App CI | `workflows/ci.yml` | Build, test, e2e, artifact upload |
| App release | `workflows/release.yml` | Electron Forge publish |
| Engine publish | `workflows/engine-publish.yml` | npm + GitHub release for `engine/` |
| Engine platform publish | `workflows/engine-publish-platform.yml` | 11 platform packages |

## CONVENTIONS

- Root app workflows run from repo root.
- Engine workflows run with `working-directory: engine`.
- Engine package versioning is independent from app versioning.
- After monorepo conversion, don’t reintroduce workflow files under `engine/.github/workflows/`.

## ANTI-PATTERNS

- Don’t assume nested workflow files are loaded by GitHub Actions.
- Don’t publish engine packages from root without `working-directory: engine`.
- Don’t mix app release tags and engine release tags; engine uses its own publish loop.
