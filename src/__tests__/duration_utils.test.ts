import { describe, expect, it } from "vitest";
import { resolveTurnDuration } from "../components/chat/durationUtils";

describe("resolveTurnDuration", () => {
  it("uses cached duration when finished summary collapses to 1s", () => {
    expect(
      resolveTurnDuration({
        isTurnWorking: false,
        currentDuration: "1s",
        fallbackDuration: "2m 14s",
      }),
    ).toBe("2m 14s");
  });

  it("keeps live duration while turn is working", () => {
    expect(
      resolveTurnDuration({
        isTurnWorking: true,
        currentDuration: "1s",
        fallbackDuration: "39s",
      }),
    ).toBe("1s");
  });

  it("keeps current duration when no fallback exists", () => {
    expect(
      resolveTurnDuration({
        isTurnWorking: false,
        currentDuration: "1s",
        fallbackDuration: undefined,
      }),
    ).toBe("1s");
  });
});
