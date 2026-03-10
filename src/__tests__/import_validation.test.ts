import {
  areImportCommandsValid,
  extractRepoNameFromUrl,
} from "@/lib/importValidation";
import { describe, expect, it } from "vitest";

describe("importValidation", () => {
  describe("extractRepoNameFromUrl", () => {
    it("extracts repository from standard https URL", () => {
      expect(
        extractRepoNameFromUrl("https://github.com/owner/my-repo.git"),
      ).toBe("my-repo");
    });

    it("supports URLs with whitespace around them", () => {
      expect(
        extractRepoNameFromUrl("  https://github.com/owner/my-repo.git  "),
      ).toBe("my-repo");
    });

    it("returns null for invalid GitHub URL", () => {
      expect(extractRepoNameFromUrl("not-a-url")).toBeNull();
      expect(extractRepoNameFromUrl("https://gitlab.com/owner/repo"))
        .toBeNull();
    });
  });

  describe("areImportCommandsValid", () => {
    it("accepts both commands filled", () => {
      expect(areImportCommandsValid("npm install", "npm start")).toBe(true);
    });

    it("accepts both commands empty or whitespace", () => {
      expect(areImportCommandsValid("", "")).toBe(true);
      expect(areImportCommandsValid("   ", "   ")).toBe(true);
    });

    it("rejects partial command customization", () => {
      expect(areImportCommandsValid("npm install", "")).toBe(false);
      expect(areImportCommandsValid("", "npm start")).toBe(false);
      expect(areImportCommandsValid("npm install", "   ")).toBe(false);
    });
  });
});
