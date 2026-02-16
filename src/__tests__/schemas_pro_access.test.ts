import { type UserSettings, isAnyonProEnabled } from "@/lib/schemas";
import { describe, expect, it } from "vitest";

function makeSettings(enableAnyonPro?: boolean): UserSettings {
  return { enableAnyonPro } as UserSettings;
}

describe("isAnyonProEnabled", () => {
  it("returns true when enableAnyonPro is unset", () => {
    expect(isAnyonProEnabled(makeSettings())).toBe(true);
  });

  it("returns true when enableAnyonPro is true", () => {
    expect(isAnyonProEnabled(makeSettings(true))).toBe(true);
  });

  it("returns false when enableAnyonPro is false", () => {
    expect(isAnyonProEnabled(makeSettings(false))).toBe(false);
  });
});
