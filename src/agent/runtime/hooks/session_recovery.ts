/**
 * Session Recovery Hook — Handles API error recovery with backoff and retry.
 *
 * Detects common API errors (rate limits, overloaded, context too long,
 * server errors) and applies exponential backoff between steps to allow
 * graceful recovery rather than hard failure.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:session-recovery");

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

type RecoverableErrorType =
  | "rate_limit"
  | "overloaded"
  | "context_too_long"
  | "server_error"
  | null;

function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error.toLowerCase();
  if (error instanceof Error) return error.message.toLowerCase();
  try {
    return JSON.stringify(error).toLowerCase();
  } catch {
    return "";
  }
}

function classifyError(error: unknown): RecoverableErrorType {
  const message = getErrorMessage(error);

  if (
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("too many requests")
  ) {
    return "rate_limit";
  }
  if (
    message.includes("overloaded") ||
    message.includes("503") ||
    message.includes("service unavailable")
  ) {
    return "overloaded";
  }
  if (
    message.includes("context") &&
    (message.includes("too long") || message.includes("maximum"))
  ) {
    return "context_too_long";
  }
  if (
    message.includes("500") ||
    message.includes("internal server error") ||
    message.includes("bad gateway") ||
    message.includes("502")
  ) {
    return "server_error";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error state tracking
// ---------------------------------------------------------------------------

interface ErrorState {
  count: number;
  lastError: number;
  lastType: RecoverableErrorType;
}

const errorCounts = new Map<string, ErrorState>();

const MAX_CONSECUTIVE_ERRORS = 5;
/** Reset error count if no error seen within this window (ms). */
const ERROR_RESET_INTERVAL = 60_000; // 1 minute

function getBackoffMs(
  errorCount: number,
  errorType: RecoverableErrorType,
): number {
  const base =
    errorType === "rate_limit"
      ? 5_000
      : errorType === "overloaded"
        ? 3_000
        : 2_000;
  // Exponential backoff capped at 60 seconds
  return Math.min(base * Math.pow(2, errorCount - 1), 60_000);
}

function trackError(
  sessionId: string,
  errorType: RecoverableErrorType,
): number {
  const now = Date.now();
  const existing = errorCounts.get(sessionId);

  if (existing && now - existing.lastError < ERROR_RESET_INTERVAL) {
    existing.count++;
    existing.lastError = now;
    existing.lastType = errorType;
    return existing.count;
  }

  errorCounts.set(sessionId, { count: 1, lastError: now, lastType: errorType });
  return 1;
}

function resetErrors(sessionId: string): void {
  errorCounts.delete(sessionId);
}

// ---------------------------------------------------------------------------
// Input shape for step hooks
// ---------------------------------------------------------------------------

/** Typed view of the step input that may carry error info. */
interface StepInput {
  error?: unknown;
  errorMessage?: string;
  lastError?: unknown;
}

function extractError(input: unknown): unknown {
  const inp = input as StepInput;
  return inp.error ?? inp.lastError ?? inp.errorMessage ?? null;
}

// ---------------------------------------------------------------------------
// Hook registration
// ---------------------------------------------------------------------------

export function registerSessionRecoveryHook(registry: HookRegistry): void {
  // ---- agent.step.after: reset on success, track on error ------------------
  const trackHandler: HookHandler = async (input, _output, ctx) => {
    const rawError = extractError(input);

    if (!rawError) {
      // Successful step — reset consecutive error counter
      resetErrors(ctx.sessionId);
      return;
    }

    const errorType = classifyError(rawError);
    if (!errorType) {
      // Not a recoverable error type we recognise — still reset to avoid
      // stale backoff state accumulating on unrelated errors
      resetErrors(ctx.sessionId);
      return;
    }

    const count = trackError(ctx.sessionId, errorType);

    logger.warn(
      `[${ctx.sessionId}] Recoverable error detected (${errorType}), consecutive count: ${count}`,
    );

    if (count >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `[${ctx.sessionId}] ${MAX_CONSECUTIVE_ERRORS} consecutive ${errorType} errors — recovery ceiling reached`,
      );
    }
  };

  registry.register(
    "agent.step.after",
    "session-recovery:track",
    trackHandler,
    200, // Low priority — run after all other step.after hooks
    "session",
  );

  // ---- agent.step.before: apply backoff if previous errors recorded --------
  const backoffHandler: HookHandler = async (_input, _output, ctx) => {
    const errorState = errorCounts.get(ctx.sessionId);
    if (!errorState || errorState.count === 0) return;

    if (errorState.count >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `[${ctx.sessionId}] Recovery ceiling reached — skipping backoff, letting runtime decide`,
      );
      // Do not abort the hook chain; let the runtime surface the error
      return;
    }

    const backoffMs = getBackoffMs(errorState.count, errorState.lastType);
    logger.warn(
      `[${ctx.sessionId}] Applying ${backoffMs}ms backoff before next step ` +
        `(error type: ${errorState.lastType ?? "unknown"}, count: ${errorState.count})`,
    );

    await new Promise<void>((resolve) => setTimeout(resolve, backoffMs));
  };

  registry.register(
    "agent.step.before",
    "session-recovery:backoff",
    backoffHandler,
    5, // High priority — run before other step.before hooks
    "session",
  );

  logger.log("Session recovery hook registered (step.before + step.after)");
}
