function normalizeMessage(message: string): string {
  let normalized = message.trim();

  normalized = normalized.replace(
    /^Error invoking remote method '\S+':\s*/,
    "",
  );

  normalized = normalized.replace(/^\[[^\]]+\]\s*/, "");
  normalized = normalized.replace(/^Error:\s*/, "");

  return normalized.trim();
}

function readMessageFromObject(error: object): string | null {
  if (
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return null;
}

function readCause(error: Error): unknown {
  return (error as Error & { cause?: unknown }).cause;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return normalizeMessage(error);
  }

  if (error instanceof Error) {
    const message = normalizeMessage(error.message);
    const cause = readCause(error);
    if (
      cause &&
      (message.length === 0 || /^\[[^\]]+\]/.test(error.message))
    ) {
      return getErrorMessage(cause);
    }
    return message || "Unknown error";
  }

  if (typeof error === "object" && error !== null) {
    const objectMessage = readMessageFromObject(error);
    if (objectMessage) {
      return normalizeMessage(objectMessage);
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
