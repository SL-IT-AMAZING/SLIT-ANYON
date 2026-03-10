import { getErrorMessage } from "@/lib/error";
import { describe, expect, it } from "vitest";

describe("getErrorMessage", () => {
  it("returns plain string messages", () => {
    expect(getErrorMessage("Something failed")).toBe("Something failed");
  });

  it("strips Electron invoke prefix", () => {
    expect(
      getErrorMessage(
        "Error invoking remote method 'github:clone-repo-from-url': Invalid GitHub URL",
      ),
    ).toBe("Invalid GitHub URL");
  });

  it("strips channel and Error wrappers", () => {
    expect(getErrorMessage("[github:clone] Error: bad response")).toBe(
      "bad response",
    );
  });

  it("uses nested cause message when outer message is wrapped", () => {
    const rootCause = new Error("Repository not found");
    const wrapped = Object.assign(
      new Error("[github:clone-repo-from-url] Error"),
      { cause: rootCause },
    );
    expect(getErrorMessage(wrapped)).toBe("Repository not found");
  });

  it("extracts object message", () => {
    expect(getErrorMessage({ message: "[ipc] Error: unavailable" })).toBe(
      "unavailable",
    );
  });
});
