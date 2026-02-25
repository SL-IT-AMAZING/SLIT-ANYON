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

// ---------------------------------------------------------------------------
// SessionStateManager
// ---------------------------------------------------------------------------

export class SessionStateManager {
  private mainSessionId: string | undefined;
  private sessions = new Map<string, SessionInfo>();

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
    const info = this.getOrCreate(sessionId);
    info.metadata.set(key, value);
  }

  /** Get a metadata value from a session. */
  getMetadata<T = unknown>(sessionId: string, key: string): T | undefined {
    return this.sessions.get(sessionId)?.metadata.get(key) as T | undefined;
  }

  /** Delete a metadata key from a session. */
  deleteMetadata(sessionId: string, key: string): void {
    this.sessions.get(sessionId)?.metadata.delete(key);
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
