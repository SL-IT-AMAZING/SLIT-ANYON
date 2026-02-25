/**
 * Hook System — OMO-compatible lifecycle hook registry.
 *
 * Mirrors the opencode plugin API hook points:
 *   chat.message, messages.transform, event,
 *   tool.execute.before, tool.execute.after
 *
 * Plus two ANYON-specific points:
 *   agent.step.before, agent.step.after
 */
import log from "electron-log";

const logger = log.scope("hook-system");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HookPoint =
  | "chat.message"
  | "messages.transform"
  | "event"
  | "tool.execute.before"
  | "tool.execute.after"
  | "agent.step.before"
  | "agent.step.after";

export const ALL_HOOK_POINTS: HookPoint[] = [
  "chat.message",
  "messages.transform",
  "event",
  "tool.execute.before",
  "tool.execute.after",
  "agent.step.before",
  "agent.step.after",
];

/** Shared context passed to every hook invocation. */
export interface HookContext {
  sessionId: string;
  chatId: number;
  agent: string;
  directory: string;
  /** Run ID for the current agent execution. */
  runId?: string;
}

/**
 * A hook handler receives `input` and a mutable `output` object.
 * Returning a truthy `{ abort: true }` will short-circuit remaining handlers
 * for that hook point.
 */
export type HookHandler = (
  input: unknown,
  output: unknown,
  ctx: HookContext,
) => Promise<{ abort?: boolean } | void>;

/** Hook scope classification for per-run filtering. */
export type HookScope = "run" | "session" | "global";

/** Internal representation of a registered hook. */
interface HookEntry {
  name: string;
  point: HookPoint;
  handler: HookHandler;
  /** Lower number = higher priority (executed first). Default 100. */
  priority: number;
  /** Scope for per-run filtering. Default "global" (always executes). */
  scope: HookScope;
}

// ---------------------------------------------------------------------------
// HookRegistry
// ---------------------------------------------------------------------------

export class HookRegistry {
  private hooks = new Map<HookPoint, HookEntry[]>();
  private disabledHooks = new Set<string>();

  constructor() {
    // Pre-populate map entries for each hook point
    for (const point of ALL_HOOK_POINTS) {
      this.hooks.set(point, []);
    }
  }

  // ---- Registration -------------------------------------------------------

  /**
   * Register a handler for the given hook point.
   * Lower `priority` values execute first. Default priority is 100.
   */
  register(
    point: HookPoint,
    name: string,
    handler: HookHandler,
    priority = 100,
    scope: HookScope = "global",
  ): void {
    const list = this.hooks.get(point);
    if (!list) {
      logger.warn(`Unknown hook point: ${point}`);
      return;
    }

    // Prevent duplicate name within the same point
    const existing = list.findIndex((e) => e.name === name);
    if (existing !== -1) {
      list.splice(existing, 1);
    }

    list.push({ name, point, handler, priority, scope });
    // Re-sort after insertion (stable sort by priority ascending)
    list.sort((a, b) => a.priority - b.priority);

    logger.log(
      `Registered hook "${name}" on "${point}" (priority ${priority}, scope ${scope})`,
    );
  }

  /** Unregister a handler by name from a specific hook point. */
  unregister(point: HookPoint, name: string): void {
    const list = this.hooks.get(point);
    if (!list) return;
    const idx = list.findIndex((e) => e.name === name);
    if (idx !== -1) {
      list.splice(idx, 1);
      logger.log(`Unregistered hook "${name}" from "${point}"`);
    }
  }

  /** Unregister ALL hooks with the given name across all hook points. */
  unregisterAll(name: string): void {
    for (const point of ALL_HOOK_POINTS) {
      this.unregister(point, name);
    }
  }

  // ---- Enable / Disable ---------------------------------------------------

  disable(name: string): void {
    this.disabledHooks.add(name);
  }

  enable(name: string): void {
    this.disabledHooks.delete(name);
  }

  isEnabled(name: string): boolean {
    return !this.disabledHooks.has(name);
  }

  /** Bulk-disable from a list (e.g. from config `disabled_hooks`). */
  disableMultiple(names: string[]): void {
    for (const n of names) {
      this.disabledHooks.add(n);
    }
  }

  // ---- Execution ----------------------------------------------------------

  /**
   * Execute all handlers for the given hook point, in priority order.
   *
   * Each handler runs inside try-catch — one failing handler will NOT
   * prevent subsequent handlers from executing.
   *
   * If a handler returns `{ abort: true }`, remaining handlers are skipped.
   */
  async execute(
    point: HookPoint,
    input: unknown,
    output: unknown,
    ctx: HookContext,
  ): Promise<void> {
    const list = this.hooks.get(point);
    if (!list || list.length === 0) return;

    for (const entry of list) {
      if (this.disabledHooks.has(entry.name)) continue;

      try {
        const result = await entry.handler(input, output, ctx);
        if (result?.abort) {
          logger.log(
            `Hook "${entry.name}" on "${point}" returned abort — skipping remaining hooks`,
          );
          break;
        }
      } catch (err) {
        logger.error(
          `Hook "${entry.name}" on "${point}" threw:`,
          err instanceof Error ? err.message : err,
        );
        // Continue executing remaining hooks — error isolation
      }
    }
  }

  // ---- Introspection ------------------------------------------------------

  /** List all registered hook names for a given point. */
  listForPoint(point: HookPoint): string[] {
    return (this.hooks.get(point) ?? []).map((e) => e.name);
  }

  /** Total number of registered hooks across all points. */
  get size(): number {
    let total = 0;
    for (const list of this.hooks.values()) {
      total += list.length;
    }
    return total;
  }

  /** Get all registered hook entries for a point (for testing). */
  getEntries(point: HookPoint): readonly HookEntry[] {
    return this.hooks.get(point) ?? [];
  }

  /** Clear all hooks (mainly for testing). */
  clear(): void {
    for (const point of ALL_HOOK_POINTS) {
      this.hooks.set(point, []);
    }
    this.disabledHooks.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _globalRegistry: HookRegistry | null = null;

export function getGlobalHookRegistry(): HookRegistry {
  if (!_globalRegistry) {
    _globalRegistry = new HookRegistry();
  }
  return _globalRegistry;
}

/** Reset singleton (for testing). */
export function resetGlobalHookRegistry(): void {
  _globalRegistry?.clear();
  _globalRegistry = null;
}
