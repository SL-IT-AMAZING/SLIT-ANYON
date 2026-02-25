/**
 * First Message Variant — determines complexity of user's first message.
 * Used to gate which agent model to use for simple vs complex tasks.
 */

const COMPLEXITY_INDICATORS = [
  /\bimplement\b/i,
  /\brefactor\b/i,
  /\barchitect\b/i,
  /\bdesign\b/i,
  /\bmigrate\b/i,
  /\boptimize\b/i,
  /\bdebug\b/i,
  /\bfix.*bug/i,
  /\bcreate.*system\b/i,
  /\bbuild.*feature\b/i,
  /\bintegrat/i,
  /multiple\s+files/i,
  /across\s+the\s+codebase/i,
];

const SIMPLE_THRESHOLD = 50; // characters

export function getFirstMessageVariant(message: string): "simple" | "complex" {
  if (message.length < SIMPLE_THRESHOLD) return "simple";

  const complexityHits = COMPLEXITY_INDICATORS.filter((r) =>
    r.test(message),
  ).length;
  return complexityHits >= 2 ? "complex" : "simple";
}
