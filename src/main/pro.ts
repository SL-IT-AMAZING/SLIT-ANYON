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
    selectedModel: {
      name: "auto",
      provider: "auto",
    },
  });
}
