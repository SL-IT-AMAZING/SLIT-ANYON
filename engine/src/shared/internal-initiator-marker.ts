export const ANYON_INTERNAL_INITIATOR_MARKER =
  "<!-- ANYON_INTERNAL_INITIATOR -->";

export function createInternalAgentTextPart(text: string): {
  type: "text";
  text: string;
} {
  return {
    type: "text",
    text: `${text}\n${ANYON_INTERNAL_INITIATOR_MARKER}`,
  };
}
