# src/ — Engine Plugin Source

**Generated:** 2026-03-10

## OVERVIEW

Root source directory for `@anyon-cli/anyon`. Entry point `index.ts` orchestrates config → managers → tools → hooks → plugin interface, and now no-ops unless `ANYON_ACTIVE=1`.

## KEY FILES

| File                  | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `index.ts`            | Plugin entry, exports `AnyonPlugin`                                        |
| `activation-gate.ts`  | App-only activation check (`ANYON_ACTIVE`)                                 |
| `plugin-config.ts`    | JSONC parse, multi-level merge (user → project → defaults), Zod validation |
| `create-managers.ts`  | TmuxSessionManager, BackgroundManager, SkillMcpManager, ConfigHandler      |
| `create-tools.ts`     | SkillContext + AvailableCategories + ToolRegistry                          |
| `create-hooks.ts`     | 3-tier hook composition: Core(37) + Continuation(7) + Skill(2)             |
| `plugin-interface.ts` | Assembles 8 OpenCode hook handlers into PluginInterface                    |

## CONFIG LOADING

```
loadPluginConfig(directory, ctx)
  1. User: ~/.config/opencode/anyon.jsonc
  2. Project: .opencode/anyon.jsonc
  3. mergeConfigs(user, project) → deepMerge for agents/categories, Set union for disabled_*
  4. Zod safeParse → defaults for omitted fields
  5. migrateConfigFile() → legacy key transformation
```

## ACTIVATION MODEL

Plain OpenCode should not automatically activate Anyon. App-launched sessions set:

```text
OPENCODE_CONFIG_DIR=<app-scoped-dir>
ANYON_ACTIVE=1
```

Without `ANYON_ACTIVE=1`, `index.ts` returns a no-op plugin interface.

## HOOK COMPOSITION

```
createHooks()
  ├─→ createCoreHooks()           # 37 hooks
  │   ├─ createSessionHooks()     # 23: contextWindowMonitor, thinkMode, persistLoop, modelFallback, runtimeFallback, noConductorGpt, noCraftsmanNonGpt, anthropicEffort...
  │   ├─ createToolGuardHooks()   # 10: commentChecker, rulesInjector, writeExistingFileGuard, jsonErrorRecovery, hashlineReadEnhancer...
  │   └─ createTransformHooks()   # 4: claudeCodeHooks, keywordDetector, contextInjector, thinkingBlockValidator
  ├─→ createContinuationHooks()   # 7: todoContinuationEnforcer, taskmaster, stopContinuationGuard...
  └─→ createSkillHooks()          # 2: categorySkillReminder, autoSlashCommand
```
