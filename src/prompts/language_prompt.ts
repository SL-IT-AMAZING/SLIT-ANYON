/**
 * Language-specific instructions injected into the AI system prompt.
 *
 * When the user's language setting is "ko", the AI is explicitly instructed
 * to think and respond in Korean — including the reasoning inside <think> tags.
 * This ensures the entire AI experience (thinking + output) matches the
 * user's preferred language.
 */

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  ko: `## Language Requirement — NON-NEGOTIABLE
You MUST use **Korean (한국어)** for ALL of your output without exception:
- ALL thinking and reasoning inside <think></think> tags MUST be written in Korean.
- ALL responses and explanations to the user MUST be in Korean.
- ALL chat summaries (<anyon-chat-summary>) MUST be in Korean.
- ALL app names (<anyon-app-name>) SHOULD be in Korean when appropriate.
- Code, variable names, file paths, and technical identifiers remain in English.
- This overrides any other language instruction in this prompt.`,

  en: `## Language Requirement
You MUST use **English** for ALL of your output:
- ALL thinking and reasoning inside <think></think> tags MUST be written in English.
- ALL responses and explanations to the user MUST be in English.
- ALL chat summaries (<anyon-chat-summary>) MUST be in English.
- ALL app names (<anyon-app-name>) MUST be in English.
- Code, variable names, file paths, and technical identifiers remain in English.`,
};

/**
 * Return the language instruction block for the given language code.
 * Falls back to English when the language is unset or unrecognized.
 */
export function getLanguageInstruction(language?: string): string {
  if (!language) return "";
  return LANGUAGE_INSTRUCTIONS[language] ?? "";
}
