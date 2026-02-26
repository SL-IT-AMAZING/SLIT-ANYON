import * as fs from "node:fs";
import * as path from "node:path";

import log from "electron-log";

const logger = log.scope("transcript-recorder");

export interface TranscriptEntry {
  timestamp: number;
  sessionId: string;
  chatId: number;
  runId?: string;
  agentName?: string;
  type: "tool_call" | "tool_result" | "tool_error" | "message" | "continuation";
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
  output?: string;
  error?: string;
  durationMs?: number;
}

// In-memory buffer with periodic flush
const buffer: TranscriptEntry[] = [];
const MAX_BUFFER_SIZE = 50;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getTranscriptDir(): string {
  try {
    // Dynamic import to avoid issues when electron app is not ready
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require("electron") as typeof import("electron");
    return path.join(app.getPath("userData"), "transcripts");
  } catch {
    // Fallback for when app is not ready (testing)
    return path.join(process.cwd(), ".anyon-transcripts");
  }
}

function getTranscriptPath(sessionId: string): string {
  const dir = getTranscriptDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${sessionId}.jsonl`);
}

/**
 * Record a transcript entry.
 */
export function recordTranscript(entry: TranscriptEntry): void {
  buffer.push(entry);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flushTranscripts();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushTranscripts, 5000); // Flush every 5s
  }
}

/**
 * Flush buffered entries to disk.
 */
export function flushTranscripts(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (buffer.length === 0) return;

  // Group by session
  const bySession = new Map<string, TranscriptEntry[]>();
  for (const entry of buffer) {
    const entries = bySession.get(entry.sessionId) ?? [];
    entries.push(entry);
    bySession.set(entry.sessionId, entries);
  }

  buffer.length = 0; // Clear buffer

  for (const [sessionId, entries] of bySession) {
    try {
      const filePath = getTranscriptPath(sessionId);
      const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      fs.appendFileSync(filePath, lines);
    } catch (err) {
      logger.error(
        `Failed to flush transcripts for session ${sessionId}:`,
        err,
      );
    }
  }
}

/**
 * Read transcript entries for a session.
 */
export function readTranscript(sessionId: string): TranscriptEntry[] {
  try {
    const filePath = getTranscriptPath(sessionId);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, "utf-8");
    const entries: TranscriptEntry[] = [];

    for (const line of content.split("\n")) {
      if (line.trim()) {
        try {
          entries.push(JSON.parse(line) as TranscriptEntry);
        } catch {
          // Skip malformed lines
        }
      }
    }

    return entries;
  } catch (err) {
    logger.error(`Failed to read transcript for session ${sessionId}:`, err);
    return [];
  }
}

/**
 * Get transcript statistics for a session.
 */
export function getTranscriptStats(sessionId: string): {
  totalEntries: number;
  toolCalls: number;
  errors: number;
  continuations: number;
} {
  const entries = readTranscript(sessionId);
  return {
    totalEntries: entries.length,
    toolCalls: entries.filter((e) => e.type === "tool_call").length,
    errors: entries.filter((e) => e.type === "tool_error").length,
    continuations: entries.filter((e) => e.type === "continuation").length,
  };
}

/**
 * Clean up old transcripts (older than N days).
 */
export function cleanupOldTranscripts(maxAgeDays = 7): void {
  try {
    const dir = getTranscriptDir();
    if (!fs.existsSync(dir)) return;

    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        logger.log(`Cleaned up old transcript: ${file}`);
      }
    }
  } catch (err) {
    logger.error("Failed to cleanup old transcripts:", err);
  }
}
