const ANALYSIS_MARKERS = /\[(?:search-mode|analyze-mode)\]/gi;
const PROMPT_HOOK_BLOCK =
  /<user-prompt-submit-hook[^>]*>[\s\S]*?<\/user-prompt-submit-hook>/gi;

function stripTodoDirectiveBlocks(text: string): string {
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;

  const isDirectiveLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return (
      /^\[SYSTEM DIRECTIVE:/i.test(trimmed) ||
      /^\[Status:/i.test(trimmed) ||
      /^Remaining tasks:/i.test(trimmed) ||
      /^Incomplete tasks remain in your todo list\./i.test(trimmed) ||
      /^-?\s*Proceed without asking for permission/i.test(trimmed) ||
      /^-?\s*Mark each task complete when finished/i.test(trimmed) ||
      /^-?\s*Do not stop until all tasks are done/i.test(trimmed) ||
      /^- \[(?:in_progress|pending|completed|cancelled)\]/i.test(trimmed)
    );
  };

  for (const line of lines) {
    if (!skipping && /^\s*\[SYSTEM DIRECTIVE:/i.test(line)) {
      skipping = true;
      continue;
    }

    if (skipping) {
      if (isDirectiveLine(line)) {
        continue;
      }
      skipping = false;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

export function sanitizeVisibleOutput(text: string): string {
  if (!text) return text;

  const withoutHooks = text
    .replace(PROMPT_HOOK_BLOCK, "")
    .replace(ANALYSIS_MARKERS, "")
    .replace(/\r\n/g, "\n");

  const withoutDirectives = stripTodoDirectiveBlocks(withoutHooks);

  return withoutDirectives.replace(/\n{3,}/g, "\n\n").replace(/^\s+\n/gm, "\n");
}
