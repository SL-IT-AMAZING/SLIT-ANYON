import {
  createOpenCodeStartupError,
  getOpenCodeStartupErrorCode,
  isRetryableOpenCodeStartupError,
  resolveOpenCodeBinaryPath,
} from "@/ipc/utils/opencode_startup";
import { describe, expect, it } from "vitest";

describe("opencode startup helpers", () => {
  describe("resolveOpenCodeBinaryPath", () => {
    it("prioritizes options path first", () => {
      const result = resolveOpenCodeBinaryPath({
        optionsPath: "/opt/custom/opencode",
        envPath: "/env/opencode",
        bundledPath: "/bundled/opencode",
        isPackaged: true,
      });

      expect(result).toEqual({
        path: "/opt/custom/opencode",
        source: "options",
      });
    });

    it("falls back to env path then bundled path", () => {
      const fromEnv = resolveOpenCodeBinaryPath({
        envPath: "/env/opencode",
        bundledPath: "/bundled/opencode",
        isPackaged: true,
      });
      expect(fromEnv).toEqual({ path: "/env/opencode", source: "env" });

      const fromBundled = resolveOpenCodeBinaryPath({
        bundledPath: "/bundled/opencode",
        isPackaged: true,
      });
      expect(fromBundled).toEqual({
        path: "/bundled/opencode",
        source: "bundled",
      });
    });

    it("allows dev PATH fallback when unpackaged", () => {
      const result = resolveOpenCodeBinaryPath({
        isPackaged: false,
      });

      expect(result).toEqual({ path: "opencode", source: "dev-path" });
    });

    it("throws a structured error in packaged mode when binary is missing", () => {
      expect(() =>
        resolveOpenCodeBinaryPath({
          isPackaged: true,
        }),
      ).toThrowError(/\[OPENCODE_BINARY_NOT_FOUND\]/);
    });
  });

  describe("error classification helpers", () => {
    it("extracts error code from structured startup error", () => {
      const error = createOpenCodeStartupError(
        "OPENCODE_SPAWN_ENOENT",
        "binary not found",
      );

      expect(getOpenCodeStartupErrorCode(error)).toBe("OPENCODE_SPAWN_ENOENT");
    });

    it("returns null for unstructured errors", () => {
      expect(getOpenCodeStartupErrorCode(new Error("plain error"))).toBeNull();
      expect(getOpenCodeStartupErrorCode("plain error")).toBeNull();
    });

    it("marks deterministic startup errors as non-retryable", () => {
      const deterministic = createOpenCodeStartupError(
        "OPENCODE_CODE_SIGNATURE_INVALID",
        "killed by macOS",
      );
      expect(isRetryableOpenCodeStartupError(deterministic)).toBe(false);

      const transient = createOpenCodeStartupError(
        "OPENCODE_PROCESS_TERMINATED",
        "terminated unexpectedly",
      );
      expect(isRetryableOpenCodeStartupError(transient)).toBe(true);

      expect(isRetryableOpenCodeStartupError(new Error("unknown"))).toBe(true);
    });
  });
});
