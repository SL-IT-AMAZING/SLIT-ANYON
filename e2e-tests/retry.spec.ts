import { test, testSkipIfWindows } from "./helpers/test_helper";

test("retry - should work", async ({ po }) => {
  await po.setUp();
  await po.sendPrompt("[increment]");
  await po.snapshotMessages();

  await po.dismissAllToasts();
  await po.clickRetry();
  await po.expectNoToast();
  // The counter should be incremented in the snapshotted messages.
  await po.snapshotMessages();
});

testSkipIfWindows("retry - local-agent multi tool turn should work", async ({
  po,
}) => {
  await po.setUpAnyonPro({ localAgent: true });
  await po.importApp("minimal");
  await po.selectLocalAgentMode();

  await po.sendPrompt("tc=local-agent/parallel-tools");
  await po.snapshotMessages();
  await po.snapshotAppFiles({
    name: "before-retry-local-agent-parallel-tools",
    files: ["src/utils/math.ts", "src/utils/string.ts"],
  });

  await po.dismissAllToasts();
  await po.clickRetry();
  await po.expectNoToast();

  await po.snapshotMessages();
  await po.snapshotAppFiles({
    name: "after-retry-local-agent-parallel-tools",
    files: ["src/utils/math.ts", "src/utils/string.ts"],
  });
});
