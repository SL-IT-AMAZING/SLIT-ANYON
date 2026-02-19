import { canSubmitCreateApp } from "@/components/CreateAppDialog";
import { describe, expect, it } from "vitest";

describe("canSubmitCreateApp", () => {
  it("returns false when app name is empty", () => {
    expect(canSubmitCreateApp("", false, false)).toBe(false);
    expect(canSubmitCreateApp("   ", false, false)).toBe(false);
  });

  it("returns false when name already exists", () => {
    expect(canSubmitCreateApp("demo-app", true, false)).toBe(false);
  });

  it("returns false while submitting", () => {
    expect(canSubmitCreateApp("demo-app", false, true)).toBe(false);
  });

  it("returns true for valid non-duplicate name when idle", () => {
    expect(canSubmitCreateApp("demo-app", false, false)).toBe(true);
  });
});
