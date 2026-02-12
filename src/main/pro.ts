import { readSettings, writeSettings } from "./settings";

export function handleAnyonProReturn({ apiKey }: { apiKey: string }) {
  const settings = readSettings();
  writeSettings({
    providerSettings: {
      ...settings.providerSettings,
      auto: {
        ...settings.providerSettings.auto,
        apiKey: {
          value: apiKey,
        },
      },
    },
    enableAnyonPro: true,
    // Switch to local-agent mode and auto model for a good default experience
    selectedChatMode: "local-agent",
    selectedModel: {
      name: "auto",
      provider: "auto",
    },
  });
}
