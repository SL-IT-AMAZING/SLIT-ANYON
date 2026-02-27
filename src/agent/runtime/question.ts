const QUESTION_TIMEOUT_MS = 60_000; // 60 seconds

const pendingQuestionResolvers = new Map<
  string,
  (answers: string[][] | null) => void
>();

export function waitForAgentQuestion(
  requestId: string,
): Promise<string[][] | null> {
  return new Promise((resolve) => {
    pendingQuestionResolvers.set(requestId, resolve);
    // Auto-timeout: resolve with null after 60s
    setTimeout(() => {
      if (pendingQuestionResolvers.has(requestId)) {
        pendingQuestionResolvers.delete(requestId);
        resolve(null);
      }
    }, QUESTION_TIMEOUT_MS);
  });
}

export function resolveAgentQuestion(
  requestId: string,
  answers: string[][] | null,
): void {
  const resolver = pendingQuestionResolvers.get(requestId);
  if (resolver) {
    pendingQuestionResolvers.delete(requestId);
    resolver(answers);
  }
}
