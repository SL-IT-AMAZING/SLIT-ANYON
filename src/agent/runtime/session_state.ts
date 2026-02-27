/**
 * Session State Manager — tracks sessions across agent delegations.
 *
 * Mirrors OMO's claude-code-session-state feature:
 *  - Main session tracking (the top-level user chat)
 *  - Per-session agent tracking (which agent is active in each session)
 *  - Metadata store for arbitrary session-scoped data
 */
import log from "electron-log";

const logger = log.scope("session-state");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionInfo {
  /** Agent currently active in this session. */
  agent?: string;
  /** When the session was created. */
  createdAt: number;
  /** Arbitrary metadata attached to the session. */
  metadata: Map<string, unknown>;
  /** Parent session ID (for subagent sessions). */
  parentSessionId?: string;
}

export type StateScope = "global" | "session" | "run";

// ---------------------------------------------------------------------------
// SessionStateManager
// ---------------------------------------------------------------------------

export class SessionStateManager {
  private mainSessionId: string | undefined;
  private sessions = new Map<string, SessionInfo>();
  private globalStore = new Map<string, unknown>();
  private sessionStores = new Map<string, Map<string, unknown>>();
  private runStores = new Map<string, Map<string, unknown>>();

  // ---- Main session -------------------------------------------------------

  /** Set the main (top-level) session ID. */
  setMainSession(id: string | undefined): void {
    this.mainSessionId = id;
    if (id) {
      logger.log(`Main session set: ${id}`);
      // Ensure the session entry exists
      if (!this.sessions.has(id)) {
        this.sessions.set(id, {
          createdAt: Date.now(),
          metadata: new Map(),
        });
      }
    }
  }

  /** Get the main session ID. */
  getMainSessionId(): string | undefined {
    return this.mainSessionId;
  }

  // ---- Session agent tracking ---------------------------------------------

  /** Set the agent for a specific session. */
  setSessionAgent(sessionId: string, agent: string): void {
    const info = this.getOrCreate(sessionId);
    info.agent = agent;
  }

  /** Update the session agent (only if session exists). */
  updateSessionAgent(sessionId: string, agent: string): void {
    const info = this.sessions.get(sessionId);
    if (info) {
      info.agent = agent;
    } else {
      // Auto-create if not found (mirrors OMO behavior)
      this.setSessionAgent(sessionId, agent);
    }
  }

  /** Get the agent for a session. */
  getSessionAgent(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.agent;
  }

  /** Clear agent and metadata for a session. */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.sessionStores.delete(sessionId);
    logger.log(`Session cleared: ${sessionId}`);
  }

  // ---- Subagent sessions --------------------------------------------------

  /** Create a subagent session linked to a parent. */
  createSubagentSession(
    sessionId: string,
    parentSessionId: string,
    agent: string,
  ): void {
    this.sessions.set(sessionId, {
      agent,
      createdAt: Date.now(),
      metadata: new Map(),
      parentSessionId,
    });
    logger.log(
      `Subagent session created: ${sessionId} (parent: ${parentSessionId}, agent: ${agent})`,
    );
  }

  /** Get the parent session ID for a subagent session. */
  getParentSessionId(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.parentSessionId;
  }

  // ---- Metadata -----------------------------------------------------------

  /** Set a metadata value for a session. */
  setMetadata(sessionId: string, key: string, value: unknown): void {
    this.setState(key, value, "session", sessionId);
  }

  /** Get a metadata value from a session. */
  getMetadata<T = unknown>(sessionId: string, key: string): T | undefined {
    return this.getState<T>(key, "session", sessionId);
  }

  /** Delete a metadata key from a session. */
  deleteMetadata(sessionId: string, key: string): void {
    this.deleteState(key, "session", sessionId);
  }

  getState<T = unknown>(
    key: string,
    scope: StateScope,
    scopeId?: string,
  ): T | undefined {
    return this.getStore(scope, scopeId).get(key) as T | undefined;
  }

  setState(
    key: string,
    value: unknown,
    scope: StateScope,
    scopeId?: string,
  ): void {
    this.getStore(scope, scopeId).set(key, value);
  }

  deleteState(key: string, scope: StateScope, scopeId?: string): void {
    this.getStore(scope, scopeId).delete(key);
  }

  getNamespaced<T = unknown>(
    namespace: string,
    key: string,
    scope: StateScope,
    scopeId?: string,
  ): T | undefined {
    return this.getState<T>(
      this.toNamespacedKey(namespace, key),
      scope,
      scopeId,
    );
  }

  setNamespaced(
    namespace: string,
    key: string,
    value: unknown,
    scope: StateScope,
    scopeId?: string,
  ): void {
    this.setState(this.toNamespacedKey(namespace, key), value, scope, scopeId);
  }

  deleteNamespaced(
    namespace: string,
    key: string,
    scope: StateScope,
    scopeId?: string,
  ): void {
    this.deleteState(this.toNamespacedKey(namespace, key), scope, scopeId);
  }

  clearRunStore(runId: string): void {
    this.runStores.delete(runId);
  }

  // ---- Introspection ------------------------------------------------------

  /** Check if a session exists. */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /** Get session info (for debugging / testing). */
  getSessionInfo(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /** List all active session IDs. */
  listSessions(): string[] {
    return [...this.sessions.keys()];
  }

  /** Total number of tracked sessions. */
  get size(): number {
    return this.sessions.size;
  }

  // ---- Cleanup ------------------------------------------------------------

  /** Remove stale sessions older than `maxAgeMs`. */
  pruneStale(maxAgeMs: number): number {
    const cutoff = Date.now() - maxAgeMs;
    let pruned = 0;
    for (const [id, info] of this.sessions) {
      if (info.createdAt < cutoff && id !== this.mainSessionId) {
        this.sessions.delete(id);
        this.sessionStores.delete(id);
        pruned++;
      }
    }
    if (pruned > 0) {
      logger.log(`Pruned ${pruned} stale sessions`);
    }
    return pruned;
  }

  /** Clear all session state (for testing). */
  clear(): void {
    this.sessions.clear();
    this.globalStore.clear();
    this.sessionStores.clear();
    this.runStores.clear();
    this.mainSessionId = undefined;
  }

  // ---- Internal -----------------------------------------------------------

  private getOrCreate(sessionId: string): SessionInfo {
    let info = this.sessions.get(sessionId);
    if (!info) {
      info = { createdAt: Date.now(), metadata: new Map() };
      this.sessions.set(sessionId, info);
    }
    return info;
  }

  private getStore(scope: StateScope, scopeId?: string): Map<string, unknown> {
    if (scope === "global") {
      return this.globalStore;
    }

    if (!scopeId) {
      throw new Error("scopeId required for session/run scope");
    }

    if (scope === "session") {
      this.getOrCreate(scopeId);
      let sessionStore = this.sessionStores.get(scopeId);
      if (!sessionStore) {
        sessionStore = new Map<string, unknown>();
        this.sessionStores.set(scopeId, sessionStore);
      }
      return sessionStore;
    }

    let runStore = this.runStores.get(scopeId);
    if (!runStore) {
      runStore = new Map<string, unknown>();
      this.runStores.set(scopeId, runStore);
    }
    return runStore;
  }

  private toNamespacedKey(namespace: string, key: string): string {
    return `${namespace}::${key}`;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _globalManager: SessionStateManager | null = null;

export function getGlobalSessionState(): SessionStateManager {
  if (!_globalManager) {
    _globalManager = new SessionStateManager();
  }
  return _globalManager;
}

/** Reset singleton (for testing). */
export function resetGlobalSessionState(): void {
  _globalManager?.clear();
  _globalManager = null;
}
