# ULTRAWORK + RALPH LOOP 3-Day Hardening Plan

## Goal

Stabilize the existing product by continuously executing reliability, UX, race-condition, and performance hardening tasks with strict verification after every batch.

## Execution Rules

- Never stop until all tasks in this plan are completed.
- Keep exactly one active execution task at a time.
- After each implementation batch, run: LSP diagnostics -> typecheck -> tests -> build.
- Do not add feature scope beyond hardening/fixing.
- If a task fails validation, immediately create a fix subtask and resolve before moving on.

## 72-Hour Structure

| Phase | Window | Focus |
| --- | --- | --- |
| Phase A | Hours 0-12 | Critical reliability and race-condition fixes |
| Phase B | Hours 12-36 | UX friction, error handling consistency, IPC contract consistency |
| Phase C | Hours 36-60 | Performance/query invalidation hardening and cache discipline |
| Phase D | Hours 60-72 | Regression tests, E2E stabilization, final verification sweep |

## 30-Task Backlog

1. Build consolidated risk register from completed audits.
2. Confirm top-10 crash/race/UX hotspots with file-level evidence.
3. Fix remaining async stale-response risks in import flows.
4. Fix remaining async stale-response risks in chat flows.
5. Standardize loading/disabled guards on all async submit actions in touched flows.
6. Eliminate residual raw query keys in renderer code.
7. Enforce query-key factory usage for newly touched query domains.
8. Remove redundant invalidateQueries calls in hot paths.
9. Replace broad invalidation with targeted invalidation where safe.
10. Normalize unknown error messages in remaining high-traffic renderer surfaces.
11. Ensure toast vs inline error surface usage is consistent in chat surfaces.
12. Harden branch-management error handling in chat header and related hooks.
13. Remove IPC result-union error patterns in prioritized handlers and switch to throw-on-failure.
14. Update corresponding IPC contracts/types after handler error-path hardening.
15. Align renderer callsites with hardened IPC throw semantics.
16. Add/extend unit tests for error normalization and wrapper stripping.
17. Add/extend unit tests for import validation and edge-case URL parsing.
18. Add/extend tests for async race suppression behavior in import checks.
19. Add/extend tests for query key drift prevention and key usage.
20. Stabilize failing GitHub import E2E setup assumptions.
21. Add GitHub import E2E coverage for invalid URL and whitespace edge cases.
22. Verify keyboard/accessibility semantics in edited interactive rows/buttons.
23. Address highest-impact accessibility regressions in modified files.
24. Re-run full diagnostics and test matrix after each major patch tranche.
25. Re-run build packaging validation after each major tranche.
26. Record every completed change and validation result in this plan file.
27. Run targeted grep/lsp sweeps to detect new regressions after each tranche.
28. Final full code-health sweep over touched modules only.
29. Final full verification run: lint scope, typecheck, tests, build, e2e target.
30. Produce completion report with residual risks and next hardening queue.

## Progress Log

- [x] Created 30-task execution backlog and phase structure.
- [x] Built and recorded top-10 risk register from completed audits.
- [x] Applied additional import-flow race guards for dialog open/reset and URL parse-fail cleanup.
- [x] Added lock-based serialization for `import-app` and `clone-repo-from-url` name collision windows.
- [x] Hardened chat proposal handlers against stale captured IDs and tightened disable-send gating by proposal chat match.
- [x] Reduced broad token-count invalidation by adding `queryKeys.tokenCount.byChat` and targeted invalidation paths.
- [x] Narrowed chat list invalidation from domain-wide to scoped app + global list targets.
- [x] Normalized remaining renderer error surfaces in import/create dialogs to `getErrorMessage`.
- [x] Stabilized GitHub import E2E behavioral assertions by aligning URL test inputs to mock-backed repositories and waiting for URL blur/check readiness before import submit.
- [x] Added GitHub import E2E edge-case coverage for invalid URL error handling and whitespace-trimmed URL success path.
- [x] Added deterministic E2E teardown fallback: timed `electronApp.close()` with process force-kill on timeout in `e2e-tests/helpers/test_helper.ts`.
- [x] Hardened runtime shutdown path by adding bounded timeout/connection-force-close behavior in `src/opencode/tool_gateway.ts` stop path.

## Verification Evidence (Latest Tranche)

- `npm run ts` ✅ pass
- `npx vitest run src/__tests__/error.test.ts src/__tests__/queryKeys.test.ts src/__tests__/import_validation.test.ts` ✅ pass (13 tests)
- `npm run test` ✅ pass (36 files / 631 tests)
- `npm run build` ✅ pass
- `PLAYWRIGHT_HTML_OPEN=never npm run e2e -- e2e-tests/github-import.spec.ts` ✅ pass (8/8 including invalid URL + whitespace URL; teardown uses timeout + force-kill fallback)

## Consolidated Top-10 Risk Register (Execution Baseline)

1. `src/components/ImportAppDialog.tsx` - residual import race windows (async name checks, tab transitions, submit timing).
2. `src/hooks/useStreamChat.ts` - stream-end invalidation cost and high-frequency cache churn.
3. `src/ipc/handlers/github_handlers.ts` - clone flow concurrency and failure-path robustness.
4. `src/ipc/types/github.ts` + renderer callsites - contract consistency for throw-on-failure semantics.
5. `src/components/chat/ChatInput.tsx` - mixed error channels and approval/reject feedback consistency.
6. `src/components/ChatList.tsx` - destructive action UX order and failure-state cleanup.
7. `src/components/chat/RenameChatDialog.tsx` - async save guard and duplicate submit prevention.
8. `src/components/AgentPicker.tsx` + `src/lib/queryKeys.ts` - query key drift and missing factory domains.
9. `src/lib/error.ts` + toast surfaces - wrapped IPC error noise and user-facing clarity.
10. `e2e-tests/github-import.spec.ts` setup path - environment-dependent nav timeout blocking import E2E confidence.

## Immediate Next Batch

- Continue import/chat race hardening in existing touched modules.
- Stabilize GitHub import E2E setup assumptions before adding new E2E cases.
- Re-verify each patch tranche with LSP + typecheck + tests + build.
