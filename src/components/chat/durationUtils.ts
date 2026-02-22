export function resolveTurnDuration({
  isTurnWorking,
  currentDuration,
  fallbackDuration,
}: {
  isTurnWorking: boolean;
  currentDuration: string | undefined;
  fallbackDuration: string | undefined;
}): string | undefined {
  if (!isTurnWorking && currentDuration === "1s" && fallbackDuration) {
    return fallbackDuration;
  }
  return currentDuration;
}
