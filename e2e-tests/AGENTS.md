# e2e-tests/ — Playwright Electron Flows

**Generated:** 2026-03-10

## OVERVIEW

E2E tests exercise the built Electron app with Playwright, fake servers, fixtures, and text-based snapshots.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Core helper flow | `helpers/test_helper.ts` | Shared page object + setup paths |
| Main scenarios | `*.spec.ts` | High-level behavior tests |
| Fixtures | `fixtures/` | Import apps, local-agent prompts, backups |
| Snapshots | `snapshots/` | Text/ARIA snapshots, not just images |
| Fake servers | `../testing/` | Fake LLM + MCP support |

## CONVENTIONS

- Build first: `npm run build` before E2E.
- Tests target the compiled app, not source hot state.
- Prefer a few broad scenarios over many tiny E2E cases.
- Reuse `test_helper.ts` instead of custom navigation/setup where possible.

## ANTI-PATTERNS

- Don’t assume old UI selectors survive after product UX changes.
- Don’t run E2E for trivial copy-only work unless requested.
- Don’t use screenshots as the only source of truth; text snapshots and file assertions matter here.
