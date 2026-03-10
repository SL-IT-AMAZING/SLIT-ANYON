import { describe, expect, test, vi } from "vitest";
import { isAnyonActivated } from "../../engine/src/activation-gate";

describe("isAnyonActivated", () => {
  test("returns false when activation env is missing", () => {
    vi.stubEnv("ANYON_ACTIVE", undefined);
    expect(isAnyonActivated()).toBe(false);
  });

  test("returns true when activation env is set to 1", () => {
    vi.stubEnv("ANYON_ACTIVE", "1");
    expect(isAnyonActivated()).toBe(true);
  });
});
