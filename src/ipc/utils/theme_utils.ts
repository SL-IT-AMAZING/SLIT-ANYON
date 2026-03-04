import { getDesignSystemPrompt } from "../../shared/designSystemPrompts";
import { type Theme, themesData } from "../../shared/themes";

/**
 * Get a built-in theme by ID.
 */
export function getBuiltinThemeById(themeId: string | null): Theme | null {
  if (!themeId) return null;
  return themesData.find((t) => t.id === themeId) ?? null;
}

export async function getFullSystemPrompt(
  designSystemId: string | null,
  themeId: string | null,
): Promise<string> {
  const designSystemPrompt = designSystemId
    ? getDesignSystemPrompt(designSystemId)
    : "";
  const themePrompt = getThemePromptById(themeId);
  return [designSystemPrompt, themePrompt].filter(Boolean).join("\n\n");
}

export function getThemePromptById(themeId: string | null): string {
  if (!themeId) {
    return "";
  }

  // It's a built-in theme
  const builtinTheme = getBuiltinThemeById(themeId);
  return builtinTheme?.prompt ?? "";
}
