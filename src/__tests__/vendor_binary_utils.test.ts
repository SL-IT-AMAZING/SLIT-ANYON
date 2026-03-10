import { afterEach, describe, expect, it, vi } from "vitest";

const accessSync = vi.fn();
const existsSync = vi.fn();
const execFileSync = vi.fn();

vi.mock("node:fs", () => ({
  default: {
    existsSync,
    accessSync,
    constants: {
      W_OK: 2,
      X_OK: 1,
    },
  },
}));

vi.mock("node:child_process", () => ({
  default: {
    execFileSync,
  },
  execFileSync,
}));

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => "/repo",
  },
}));

describe("vendor binary utils", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    existsSync.mockReset();
    accessSync.mockReset();
    execFileSync.mockReset();
    Object.defineProperty(process, "platform", {
      value: originalPlatform,
    });
  });

  it("prepares a writable darwin binary by clearing xattrs and re-signing", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    existsSync.mockReturnValue(true);

    const { prepareBundledOpenCodeBinaryForLaunch } = await import(
      "@/ipc/utils/vendor_binary_utils"
    );

    const result = prepareBundledOpenCodeBinaryForLaunch("/tmp/opencode-a", {
      force: true,
    });

    expect(result).toBe(true);
    expect(execFileSync).toHaveBeenNthCalledWith(
      1,
      "xattr",
      ["-d", "com.apple.quarantine", "/tmp/opencode-a"],
      { stdio: "ignore" },
    );
    expect(execFileSync).toHaveBeenNthCalledWith(
      2,
      "xattr",
      ["-d", "com.apple.provenance", "/tmp/opencode-a"],
      { stdio: "ignore" },
    );
    expect(execFileSync).toHaveBeenNthCalledWith(
      3,
      "codesign",
      ["--force", "--sign", "-", "/tmp/opencode-a"],
      { stdio: "pipe" },
    );
  });

  it("prepares the resolved dev bundled binary path before returning it", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    existsSync.mockReturnValue(true);

    const { getOpenCodeBinaryPath } = await import(
      "@/ipc/utils/vendor_binary_utils"
    );

    const result = getOpenCodeBinaryPath();

    expect(result).toBe("/repo/vendor/opencode/bin/opencode");
    expect(execFileSync).toHaveBeenCalledWith(
      "codesign",
      ["--force", "--sign", "-", "/repo/vendor/opencode/bin/opencode"],
      { stdio: "pipe" },
    );
  });
});
