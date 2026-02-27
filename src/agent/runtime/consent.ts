import { waitForConsent } from "@/ipc/utils/mcp_consent";
import { db } from "@/db";
import { nativeToolConsents } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { IpcMainInvokeEvent } from "electron";
import crypto from "node:crypto";

const CONSENT_TIMEOUT_MS = 60_000; // 60 seconds

type ConsentDecision = "accept-once" | "accept-always" | "decline";

/**
 * Wrap waitForConsent with timeout — auto-decline after 60s.
 */
export async function waitForConsentWithTimeout(
  requestId: string,
  timeoutMs = CONSENT_TIMEOUT_MS,
): Promise<ConsentDecision> {
  return Promise.race([
    waitForConsent(requestId),
    new Promise<ConsentDecision>((_, reject) =>
      setTimeout(() => reject(new Error("Consent timed out")), timeoutMs),
    ),
  ]);
}

export interface NativeToolConsentParams {
  toolName: string;
  riskLevel: "safe" | "moderate" | "dangerous";
  inputPreview?: string | null;
  chatId: number;
  event: IpcMainInvokeEvent;
}

/**
 * Full consent flow for native tools:
 * 1. Check DB for "accept-always" → skip if stored
 * 2. Send request to renderer, block until response or timeout
 * 3. Persist "accept-always" if chosen
 */
export async function requestNativeToolConsent({
  toolName,
  riskLevel,
  inputPreview,
  chatId,
  event,
}: NativeToolConsentParams): Promise<ConsentDecision> {
  // 1. Check DB for "accept-always"
  const stored = await db
    .select()
    .from(nativeToolConsents)
    .where(eq(nativeToolConsents.toolName, toolName))
    .get();
  if (stored?.consent === "accept-always") return "accept-once"; // auto-approve

  // 2. Send to renderer, block until response or timeout
  const requestId = crypto.randomUUID();
  (event.sender as Electron.WebContents).send("tool:consent-request", {
    requestId,
    toolName,
    riskLevel,
    inputPreview: inputPreview ?? null,
    chatId,
  });

  let decision: ConsentDecision;
  try {
    decision = await waitForConsentWithTimeout(requestId);
  } catch {
    // Timeout → auto-decline
    return "decline";
  }

  // 3. Persist "accept-always" if chosen
  if (decision === "accept-always") {
    await db
      .insert(nativeToolConsents)
      .values({ toolName, consent: "accept-always" })
      .onConflictDoUpdate({
        target: nativeToolConsents.toolName,
        set: { consent: "accept-always" },
      });
  }

  return decision;
}
