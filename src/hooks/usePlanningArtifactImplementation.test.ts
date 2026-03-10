import { describe, expect, test } from "vitest";
import { buildArtifactImplementationPrompt } from "./usePlanningArtifactImplementation";

describe("buildArtifactImplementationPrompt", () => {
  test("maps founder brief to implement-brief command", () => {
    expect(
      buildArtifactImplementationPrompt({
        artifactId: "chat-1-brief-1",
        artifactType: "founder_brief",
      }),
    ).toBe("/implement-brief=chat-1-brief-1");
  });

  test("maps internal build spec to implement-spec command", () => {
    expect(
      buildArtifactImplementationPrompt({
        artifactId: "chat-1-spec-1",
        artifactType: "internal_build_spec",
      }),
    ).toBe("/implement-spec=chat-1-spec-1");
  });
});
