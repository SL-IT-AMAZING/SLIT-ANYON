/**
 * RunHookRegistry — Per-run hook execution layer with scope filtering.
 *
 * Wraps the global HookRegistry catalog and filters hooks based on
 * the current RunContext. This ensures:
 *  - Run-scoped hooks (ralph-loop, todo-continuation) only fire for their run
 *  - Session-scoped hooks (context-injector, rules-injector) fire for all runs in session
 *  - Global hooks (telemetry) always fire
 *
 * Each AgentRuntime instance creates its own RunHookRegistry from the
 * global catalog + its RunContext.
 */
import log from "electron-log";

import type { HookContext, HookPoint, HookScope } from "./hook_system";
import type { HookRegistry } from "./hook_system";
import type { RunContext } from "./run_context";

const logger = log.scope("run-hook-registry");

/** Predicate that determines if a hook should execute for a given run. */
type ScopePredicate = (ctx: RunContext) => boolean;

/** Default scope predicates. */
const DEFAULT_PREDICATES: Record<HookScope, ScopePredicate> = {
  /** Global hooks always execute. */
  global: () => true,
  /** Session hooks execute for all runs in the same root chat session. */
  session: () => true,
  /** Run hooks execute only for the specific run they were registered with. */
  run: () => true,
};

/** Custom scope predicates for specific hooks (e.g., subagent-only). */
export interface ScopeOverride {
  hookName: string;
  predicate: ScopePredicate;
}

/** Configuration for creating a RunHookRegistry. */
export interface RunHookRegistryOptions {
  /** The global hook catalog. */
  catalog: HookRegistry;
  /** This run's identity context. */
  runContext: RunContext;
  /** Optional custom predicates for specific hooks. */
  overrides?: ScopeOverride[];
}

export class RunHookRegistry {
  private catalog: HookRegistry;
  private runContext: RunContext;
  private hookCtx: HookContext;
  private overrides = new Map<string, ScopePredicate>();

  constructor(opts: RunHookRegistryOptions) {
    this.catalog = opts.catalog;
    this.runContext = opts.runContext;

    // Build the HookContext from RunContext
    this.hookCtx = {
      sessionId: String(opts.runContext.rootChatId),
      chatId: opts.runContext.chatId,
      agent: opts.runContext.agentName,
      directory: "", // Populated per-execution from caller
      runId: opts.runContext.runId,
    };

    // Register custom overrides
    if (opts.overrides) {
      for (const o of opts.overrides) {
        this.overrides.set(o.hookName, o.predicate);
      }
    }
  }

  /**
   * Execute hooks for a specific hook point, filtering by scope.
   *
   * Only hooks whose scope predicate passes for this RunContext will execute.
   * The hookCtx.directory is merged from the caller-provided context.
   */
  async execute(
    point: HookPoint,
    input: unknown,
    output: unknown,
    callerCtx?: Partial<HookContext>,
  ): Promise<void> {
    const entries = this.catalog.getEntries(point);
    if (entries.length === 0) return;

    // Merge caller context with our run-derived context
    const ctx: HookContext = {
      ...this.hookCtx,
      ...callerCtx,
      // Always preserve runId from our RunContext
      runId: this.runContext.runId,
    };

    for (const entry of entries) {
      // Check if hook is disabled in the global catalog
      if (!this.catalog.isEnabled(entry.name)) continue;

      // Check scope predicate
      if (!this.shouldExecute(entry.name, entry.scope)) {
        continue;
      }

      try {
        const result = await entry.handler(input, output, ctx);
        if (result?.abort) {
          logger.log(
            `Hook "${entry.name}" on "${point}" returned abort (run ${this.runContext.runId})`,
          );
          break;
        }
      } catch (err) {
        logger.error(
          `Hook "${entry.name}" on "${point}" threw (run ${this.runContext.runId}):`,
          err instanceof Error ? err.message : err,
        );
        // Continue executing remaining hooks — error isolation
      }
    }
  }

  /** Get the HookContext for this run (for direct hook invocations). */
  getHookContext(): HookContext {
    return { ...this.hookCtx };
  }

  /** Get the RunContext. */
  getRunContext(): RunContext {
    return this.runContext;
  }

  /** Register a scope override for a specific hook name. */
  addOverride(hookName: string, predicate: ScopePredicate): void {
    this.overrides.set(hookName, predicate);
  }

  /** Check if a hook should execute based on scope + overrides. */
  private shouldExecute(hookName: string, scope: HookScope): boolean {
    // Check custom override first
    const override = this.overrides.get(hookName);
    if (override) {
      return override(this.runContext);
    }

    // Use default scope predicate
    const predicate = DEFAULT_PREDICATES[scope];
    return predicate(this.runContext);
  }
}

/**
 * Create a RunHookRegistry for an AgentRuntime.
 *
 * Common scope overrides:
 *  - "ralph-loop": only primary agents (not subagents)
 *  - "todo-continuation": only primary agents
 *  - "boulder-state": only primary agents
 */
export function createRunHookRegistry(
  catalog: HookRegistry,
  runContext: RunContext,
): RunHookRegistry {
  return new RunHookRegistry({
    catalog,
    runContext,
    overrides: [
      // Run-scoped hooks that should NOT fire for sub-agents
      {
        hookName: "ralph-loop",
        predicate: (ctx) => !ctx.isSubAgent,
      },
      {
        hookName: "todo-continuation",
        predicate: (ctx) => !ctx.isSubAgent,
      },
      {
        hookName: "boulder-state",
        predicate: (ctx) => !ctx.isSubAgent,
      },
      {
        hookName: "edit-error-recovery",
        predicate: (ctx) => !ctx.isSubAgent,
      },
    ],
  });
}
