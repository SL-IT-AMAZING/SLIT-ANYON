# Anyon Engine — OpenCode Plugin Runtime

**Generated:** 2026-03-10 | **Commit:** 60a52b2 | **Branch:** dev

## OVERVIEW

Tracked engine package (npm: `@anyon-cli/anyon`) that powers the Anyon plugin runtime, agents, hooks, tools, CLI, and platform binaries. It now lives inside the root repo as normal tracked content, not a submodule.

## STRUCTURE

```
engine/
├── src/
│   ├── index.ts              # Plugin entry: loadConfig → createManagers → createTools → createHooks → createPluginInterface
│   ├── plugin-config.ts      # JSONC multi-level config: user → project → defaults (Zod v4)
│   ├── agents/               # 11 agents (Conductor, Craftsman, Advisor, Researcher, Scout, Taskmaster, Strategist, Analyst, Critic, Inspector, Worker)
│   ├── hooks/                # 46 hooks across 45 directories + 11 standalone files
│   ├── tools/                # 26 tools across 15 directories
│   ├── features/             # 19 feature modules (background-agent, skill-loader, tmux, MCP-OAuth, etc.)
│   ├── shared/               # 95+ utility files in 13 categories
│   ├── config/               # Zod v4 schema system (24 files)
│   ├── cli/                  # CLI: install, run, doctor, mcp-oauth (Commander.js)
│   ├── mcp/                  # 3 built-in remote MCPs (websearch, context7, grep_app)
│   ├── plugin/               # 8 OpenCode hook handlers + 46 hook composition
│   └── plugin-handlers/      # 6-phase config loading pipeline
├── packages/                 # Monorepo: cli-runner, 12 platform binaries
└── local-ignore/             # Dev-only test fixtures
```

## INITIALIZATION FLOW

```
AnyonPlugin(ctx)
  ├─→ loadPluginConfig()         # JSONC parse → project/user merge → Zod validate → migrate
  ├─→ createManagers()           # TmuxSessionManager, BackgroundManager, SkillMcpManager, ConfigHandler
  ├─→ createTools()              # SkillContext + AvailableCategories + ToolRegistry (26 tools)
  ├─→ createHooks()              # 3-tier: Core(37) + Continuation(7) + Skill(2) = 46 hooks
  └─→ createPluginInterface()    # 8 OpenCode hook handlers → PluginInterface
```

## 8 OPENCODE HOOK HANDLERS

| Handler | Purpose |
|---------|---------|
| `config` | 6-phase: provider → plugin-components → agents → tools → MCPs → commands |
| `tool` | 26 registered tools |
| `chat.message` | First-message variant, session setup, keyword detection |
| `chat.params` | Anthropic effort level adjustment |
| `event` | Session lifecycle (created, deleted, idle, error) |
| `tool.execute.before` | Pre-tool hooks (file guard, label truncator, rules injector) |
| `tool.execute.after` | Post-tool hooks (output truncation, metadata store) |
| `experimental.chat.messages.transform` | Context injection, thinking block validation |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent | `src/agents/` + `src/agents/builtin-agents/` | Follow createXXXAgent factory pattern |
| Add new hook | `src/hooks/{name}/` + register in `src/plugin/hooks/create-*-hooks.ts` | Match event type to tier |
| Add new tool | `src/tools/{name}/` + register in `src/plugin/tool-registry.ts` | Follow createXXXTool factory |
| Add new feature module | `src/features/{name}/` | Standalone module, wire in plugin/ |
| Add new MCP | `src/mcp/` + register in `createBuiltinMcps()` | Remote HTTP only |
| Add new skill | `src/features/builtin-skills/skills/` | Implement BuiltinSkill interface |
| Add new command | `src/features/builtin-commands/` | Template in templates/ |
| Add new CLI command | `src/cli/cli-program.ts` | Commander.js subcommand |
| Add new doctor check | `src/cli/doctor/checks/` | Register in checks/index.ts |
| Modify config schema | `src/config/schema/` + update root schema | Zod v4, add to Anyon config root schema |
| Add new category | `src/tools/delegate-task/constants.ts` | DEFAULT_CATEGORIES + CATEGORY_MODEL_REQUIREMENTS |
| Publish engine package | `../.github/workflows/engine-publish.yml` | Root-level workflow, runs in `engine/` |

## MULTI-LEVEL CONFIG

```
Project (.opencode/anyon.jsonc)  →  User (~/.config/opencode/anyon.jsonc)  →  Defaults
```

Fields: agents (14 overridable, 21 fields each), categories (8 built-in + custom), disabled_* arrays (agents, hooks, mcps, skills, commands, tools), 19 feature-specific configs.

## THREE-TIER MCP SYSTEM

| Tier | Source | Mechanism |
|------|--------|-----------|
| Built-in | `src/mcp/` | 3 remote HTTP: websearch (Exa/Tavily), context7, grep_app |
| Claude Code | `.mcp.json` | `${VAR}` env expansion via claude-code-mcp-loader |
| Skill-embedded | SKILL.md YAML | Managed by SkillMcpManager (stdio + HTTP) |

## CONVENTIONS

- **Test pattern**: Bun test (`bun:test`), co-located `*.test.ts`, given/when/then style (nested describe with `#given`/`#when`/`#then` prefixes)
- **Factory pattern**: `createXXX()` for all tools, hooks, agents
- **Hook tiers**: Session (23) → Tool-Guard (10) → Transform (4) → Continuation (7) → Skill (2)
- **Agent modes**: `primary` (respects UI model) vs `subagent` (own fallback chain) vs `all`
- **Model resolution**: 3-step: override → category-default → provider-fallback → system-default
- **Config format**: JSONC with comments, Zod v4 validation, snake_case keys
- **File naming**: kebab-case for all files/directories
- **Module structure**: index.ts barrel exports, no catch-all files (utils.ts, helpers.ts banned), 200 LOC soft limit
- **Imports**: relative within module, barrel imports across modules (`import { log } from "./shared"`)

## ANTI-PATTERNS

- Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- Never suppress lint/type errors
- Never add emojis to code/comments unless user explicitly asks
- Never commit unless explicitly requested
- Test: given/when/then — never use Arrange-Act-Assert comments
- Comments: avoid AI-generated comment patterns (enforced by comment-checker hook)
- Never create catch-all files (`utils.ts`, `helpers.ts`, `service.ts`)
- Empty catch blocks `catch(e) {}` — always handle errors

## COMMANDS

```bash
bun test
bun run build
bun run typecheck
bunx anyon install
bunx anyon doctor
bunx anyon run
```

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ../.github/workflows/engine-publish.yml | manual | Engine npm publish + release |
| ../.github/workflows/engine-publish-platform.yml | called | 11 platform binaries via bun compile |

## NOTES

- Logger writes to `/tmp/anyon.log`
- Background tasks: 5 concurrent per model/provider (configurable)
- Plugin load timeout: 10s for Claude Code plugins
- Model fallback priority: Claude > OpenAI > Gemini > Copilot > OpenCode Zen > Z.ai > Kimi
- Config migration runs automatically on legacy keys (agent names, hook names, model versions)
- Build: bun build (ESM) + tsc --emitDeclarationOnly, externals: @ast-grep/napi
- Test setup: `test-setup.ts` preloaded via bunfig.toml, mock-heavy tests run in isolation in CI
- App-only activation: plain OpenCode should stay user-controlled; Anyon activation for app-launched sessions is gated via `ANYON_ACTIVE` + app-scoped `OPENCODE_CONFIG_DIR`
