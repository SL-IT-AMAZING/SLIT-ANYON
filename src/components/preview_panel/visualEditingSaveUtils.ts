import type { VisualEditingChange } from "@/ipc/types";

export const VISUAL_EDITING_RESPONSE_TIMEOUT_MS = 2000;

export function getVisualEditingResponseKey(
  change: Pick<VisualEditingChange, "componentId" | "runtimeId">,
): string {
  return change.runtimeId
    ? `${change.componentId}::${change.runtimeId}`
    : change.componentId;
}

export function shouldRefreshLiveTextContent(
  change: Pick<VisualEditingChange, "textContent">,
): boolean {
  return change.textContent !== undefined;
}

export function mergeVisualEditingTextContent(
  changes: VisualEditingChange[],
  textContentCache: Map<string, string>,
): VisualEditingChange[] {
  return changes.map((change) => {
    const cachedText = textContentCache.get(
      getVisualEditingResponseKey(change),
    );
    if (cachedText === undefined) {
      return change;
    }

    return {
      ...change,
      textContent: cachedText,
    };
  });
}

function hasDefinedNestedValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== "object") {
    return true;
  }

  return Object.values(value).some((nestedValue) =>
    hasDefinedNestedValue(nestedValue),
  );
}

export function hasVisualEditingStyleChanges(
  change: Pick<VisualEditingChange, "styles">,
): boolean {
  return hasDefinedNestedValue(change.styles);
}

interface ReconcileVisualEditingTextChangeParams {
  existingChange?: VisualEditingChange;
  componentId: string;
  componentName: string;
  runtimeId?: string;
  relativePath: string;
  lineNumber: number;
  text: string;
  originalText?: string;
}

export function reconcileVisualEditingTextChange({
  existingChange,
  componentId,
  componentName,
  runtimeId,
  relativePath,
  lineNumber,
  text,
  originalText,
}: ReconcileVisualEditingTextChangeParams): VisualEditingChange | null {
  const hasTextChange = originalText === undefined || text !== originalText;

  if (!hasTextChange) {
    if (!existingChange || !hasVisualEditingStyleChanges(existingChange)) {
      return null;
    }

    return {
      ...existingChange,
      componentName: existingChange.componentName || componentName,
      runtimeId: runtimeId ?? existingChange.runtimeId,
      relativePath,
      lineNumber,
      textContent: undefined,
    };
  }

  return {
    componentId,
    componentName: existingChange?.componentName || componentName,
    runtimeId: runtimeId ?? existingChange?.runtimeId,
    relativePath,
    lineNumber,
    styles: existingChange?.styles || {},
    textContent: text,
  };
}
