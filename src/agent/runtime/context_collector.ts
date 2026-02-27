/**
 * Context Collector — accumulates context injections from hooks.
 *
 * Hooks (like rules-injector, directory-agents-injector, keyword-detector)
 * push context into this collector. The collected context is then injected
 * into the system prompt or message array before API calls.
 *
 * Mirrors OMO's features/context-injector module.
 */
import log from "electron-log";

const logger = log.scope("context-collector");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextInjection {
  /** Unique key for this injection (used for deduplication). */
  key: string;
  /** The content to inject. */
  content: string;
  /** Lower number = higher priority (injected first). Default 100. */
  priority: number;
  /** Optional source tag for debugging. */
  source?: string;
  /** Timestamp of when this injection was added. */
  addedAt: number;
}

// ---------------------------------------------------------------------------
// ContextCollector
// ---------------------------------------------------------------------------

export class ContextCollector {
  private injections = new Map<string, ContextInjection>();

  /**
   * Add or update a context injection.
   * If a key already exists, it is replaced (updated).
   */
  addContext(
    key: string,
    content: string,
    options?: { priority?: number; source?: string },
  ): void {
    if (!content.trim()) return; // Skip empty content

    this.injections.set(key, {
      key,
      content,
      priority: options?.priority ?? 100,
      source: options?.source,
      addedAt: Date.now(),
    });
  }

  /** Remove a specific injection by key. */
  removeContext(key: string): void {
    this.injections.delete(key);
  }

  /** Check if a key already exists. */
  hasContext(key: string): boolean {
    return this.injections.has(key);
  }

  /** Get a specific injection by key. */
  getContext(key: string): ContextInjection | undefined {
    return this.injections.get(key);
  }

  // ---- Retrieval ----------------------------------------------------------

  /**
   * Get all injections sorted by priority (ascending — lower = first).
   */
  getInjections(): ContextInjection[] {
    return [...this.injections.values()].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  /**
   * Get injection contents as an array of strings, sorted by priority.
   * This is the most common usage — feed into system prompt or messages.
   */
  getContentStrings(): string[] {
    return this.getInjections().map((i) => i.content);
  }

  /**
   * Combine all injections into a single prompt string.
   * Each injection is separated by double newlines.
   */
  toPromptString(): string {
    const strings = this.getContentStrings();
    if (strings.length === 0) return "";
    return strings.join("\n\n");
  }

  /**
   * Combine all injections into a formatted XML-like block.
   * Useful for structured injection into messages.
   */
  toFormattedBlock(): string {
    const injections = this.getInjections();
    if (injections.length === 0) return "";

    const parts = injections.map((i) => {
      const tag = i.source ?? i.key;
      return `<${tag}>\n${i.content}\n</${tag}>`;
    });

    return parts.join("\n\n");
  }

  // ---- Lifecycle ----------------------------------------------------------

  /** Total number of active injections. */
  get size(): number {
    return this.injections.size;
  }

  /** Clear all injections. */
  clear(): void {
    this.injections.clear();
    logger.log("Context collector cleared");
  }

  /** Remove injections older than `maxAgeMs`. */
  pruneStale(maxAgeMs: number): number {
    const cutoff = Date.now() - maxAgeMs;
    let pruned = 0;
    for (const [key, injection] of this.injections) {
      if (injection.addedAt < cutoff) {
        this.injections.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _globalCollector: ContextCollector | null = null;

export function getGlobalContextCollector(): ContextCollector {
  if (!_globalCollector) {
    _globalCollector = new ContextCollector();
  }
  return _globalCollector;
}

/** Reset singleton (for testing). */
export function resetGlobalContextCollector(): void {
  _globalCollector?.clear();
  _globalCollector = null;
}
