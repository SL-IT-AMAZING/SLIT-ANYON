# src/hooks/persist-loop/ — Self-Referential Dev Loop

**Generated:** 2026-03-02

## OVERVIEW

14 files (~1687 LOC). The `persistLoop` Session Tier hook — powers the `/persist-loop` command. Iterates a development loop until the agent emits `<promise>DONE</promise>` or max iterations reached.

## LOOP LIFECYCLE

```
/persist-loop → startLoop(sessionID, prompt, options)
  → loopState.startLoop() → persists state to .anyon/persist-loop.local.md
  → session.idle events → createPersistLoopEventHandler()
    → completionPromiseDetector: scan output for <promise>DONE</promise>
    → if not done: inject continuation prompt → loop
    → if done or maxIterations: cancelLoop()
```

## KEY FILES

| File                              | Purpose                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| `persist-loop-hook.ts`            | `createPersistLoopHook()` — composes controller + recovery + event handler |
| `persist-loop-event-handler.ts`   | `createPersistLoopEventHandler()` — handles session.idle, drives loop      |
| `loop-state-controller.ts`        | State CRUD: startLoop, cancelLoop, getState, persist to disk               |
| `loop-session-recovery.ts`        | Recover from crashed/interrupted loop sessions                             |
| `completion-promise-detector.ts`  | Scan session transcript for `<promise>DONE</promise>`                      |
| `continuation-prompt-builder.ts`  | Build continuation message for next iteration                              |
| `continuation-prompt-injector.ts` | Inject built prompt into active session                                    |
| `storage.ts`                      | Read/write `.anyon/persist-loop.local.md` state file                       |
| `message-storage-directory.ts`    | Temp dir for prompt injection                                              |
| `with-timeout.ts`                 | API call wrapper with timeout (default 5000ms)                             |
| `types.ts`                        | `PersistLoopState`, `PersistLoopOptions`, loop iteration types             |

## STATE FILE

```
.anyon/persist-loop.local.md  (gitignored)
  → sessionID, prompt, iteration count, maxIterations, completionPromise, turbo flag
```

## OPTIONS

```typescript
startLoop(sessionID, prompt, {
  maxIterations?: number  // Default from config (default: 100)
  completionPromise?: string  // Custom "done" signal (default: "<promise>DONE</promise>")
  turbo?: boolean  // Enable turbo mode for iterations
})
```

## EXPORTED INTERFACE

```typescript
interface PersistLoopHook {
  event: (input) => Promise<void>; // session.idle handler
  startLoop: (sessionID, prompt, options?) => boolean;
  cancelLoop: (sessionID) => boolean;
  getState: () => PersistLoopState | null;
}
```
