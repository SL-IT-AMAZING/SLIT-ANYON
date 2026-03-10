import { queryKeys } from "@/lib/queryKeys";
import { describe, expect, it } from "vitest";

describe("queryKeys", () => {
  it("returns stable tokenCount scoped keys", () => {
    expect(queryKeys.tokenCount.all).toEqual(["tokenCount"]);
    expect(queryKeys.tokenCount.byChat({ chatId: 42 })).toEqual([
      "tokenCount",
      42,
    ]);
    expect(
      queryKeys.tokenCount.forChat({
        chatId: 42,
        input: "hello",
      }),
    ).toEqual(["tokenCount", 42, "hello"]);
  });

  it("returns stable opencode agent keys", () => {
    expect(queryKeys.openCodeAgents.all).toEqual(["opencode-agents"]);
    expect(queryKeys.openCodeAgents.byAppPath({ appPath: "/tmp/app" })).toEqual(
      ["opencode-agents", "/tmp/app"],
    );
    expect(queryKeys.openCodeAgents.byAppPath({ appPath: undefined })).toEqual([
      "opencode-agents",
      null,
    ]);
  });
});
