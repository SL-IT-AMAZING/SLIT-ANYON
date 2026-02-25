/**
 * Concurrency Manager — provider-scoped semaphore for sub-agent execution.
 *
 * Handles queued acquires with timeout and keeps a bounded number of active
 * tasks per provider plus a global fallback limit.
 */
import log from "electron-log";

const logger = log.scope("concurrency-manager");

const ACQUIRE_TIMEOUT_MS = 30_000;
const DEFAULT_PROVIDER_LIMITS: Record<string, number> = {
  anthropic: 3,
  openai: 5,
  google: 3,
  xai: 3,
};

export interface ConcurrencyConfig {
  defaultConcurrency?: number;
  providerConcurrency?: Record<string, number>;
  modelConcurrency?: Record<string, number>;
  staleTimeoutMs?: number;
}

export interface ConcurrencyStatus {
  active: Record<string, number>;
  limits: Record<string, number>;
  queued: number;
}

export class ConcurrencyManager {
  private limits: Map<string, number>;
  private active: Map<string, number>;
  private waiters: Map<string, Array<() => void>>;

  constructor(config: ConcurrencyConfig) {
    this.limits = new Map();
    this.active = new Map();
    this.waiters = new Map();

    const providerLimits =
      config.providerConcurrency ?? DEFAULT_PROVIDER_LIMITS;
    for (const [provider, limit] of Object.entries(providerLimits)) {
      this.limits.set(provider, limit);
    }

    if (config.modelConcurrency) {
      for (const [model, limit] of Object.entries(config.modelConcurrency)) {
        this.limits.set(`model:${model}`, limit);
      }
    }

    this.limits.set("__default__", config.defaultConcurrency ?? 8);
  }

  async acquire(provider: string): Promise<void> {
    if (this.canAcquire(provider)) {
      this.incrementActive(provider);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        this.removeWaiter(provider, waiter);
        reject(
          new Error(
            `Timed out acquiring concurrency slot for provider "${provider}" after ${ACQUIRE_TIMEOUT_MS}ms`,
          ),
        );
      }, ACQUIRE_TIMEOUT_MS);

      const waiter = () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.incrementActive(provider);
        resolve();
      };

      const queue = this.waiters.get(provider) ?? [];
      queue.push(waiter);
      this.waiters.set(provider, queue);
    });
  }

  release(provider: string): void {
    const current = this.active.get(provider) ?? 0;
    if (current <= 0) {
      logger.warn(
        `release() called with no active slots for provider "${provider}"`,
      );
      return;
    }

    if (current === 1) {
      this.active.delete(provider);
    } else {
      this.active.set(provider, current - 1);
    }

    this.drainQueues();
  }

  getStatus(): ConcurrencyStatus {
    const active: Record<string, number> = Object.fromEntries(
      this.active.entries(),
    );
    active.__total__ = this.getTotalActive();

    return {
      active,
      limits: Object.fromEntries(this.limits.entries()),
      queued: [...this.waiters.values()].reduce(
        (acc, queue) => acc + queue.length,
        0,
      ),
    };
  }

  getLimit(provider: string): number {
    return this.limits.get(provider) ?? this.limits.get("__default__") ?? 8;
  }

  destroy(): void {
    this.waiters.clear();
    this.active.clear();
    this.limits.clear();
  }

  private getTotalActive(): number {
    let total = 0;
    for (const value of this.active.values()) {
      total += value;
    }
    return total;
  }

  private canAcquire(provider: string): boolean {
    const providerActive = this.active.get(provider) ?? 0;
    const providerLimit = this.getLimit(provider);
    const globalLimit = this.limits.get("__default__") ?? 8;
    return (
      providerActive < providerLimit && this.getTotalActive() < globalLimit
    );
  }

  private incrementActive(provider: string): void {
    const current = this.active.get(provider) ?? 0;
    this.active.set(provider, current + 1);
  }

  private removeWaiter(provider: string, waiter: () => void): void {
    const queue = this.waiters.get(provider);
    if (!queue) {
      return;
    }

    const index = queue.indexOf(waiter);
    if (index >= 0) {
      queue.splice(index, 1);
    }

    if (queue.length === 0) {
      this.waiters.delete(provider);
    }
  }

  private drainQueues(): void {
    let progressed = true;

    while (progressed) {
      progressed = false;

      for (const [provider, queue] of this.waiters) {
        if (queue.length === 0 || !this.canAcquire(provider)) {
          continue;
        }

        const waiter = queue.shift();
        if (queue.length === 0) {
          this.waiters.delete(provider);
        }

        waiter?.();
        progressed = true;

        if ((this.limits.get("__default__") ?? 8) <= this.getTotalActive()) {
          return;
        }
      }
    }
  }
}
