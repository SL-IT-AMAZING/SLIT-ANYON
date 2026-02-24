import fs from "node:fs";
import path from "node:path";
import { testSkipIfWindows } from "./helpers/test_helper";

testSkipIfWindows(
  "native-agent - read tool with streamed response",
  async ({ po }) => {
    await po.setUp();
    await po.importApp("minimal");

    // Enable native agent mode by writing to settings file directly
    // (no UI toggle exists yet for this feature flag)
    const settingsPath = path.join(po.userDataDir, "user-settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    settings.useNativeAgent = true;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    await po.sendPrompt("tc=local-agent/native-read");

    await po.snapshotMessages();
  },
);
