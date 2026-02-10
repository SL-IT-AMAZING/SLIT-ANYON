import "i18next";

import type enApp from "./locales/en/app.json";
import type enChat from "./locales/en/chat.json";
import type enCommon from "./locales/en/common.json";
import type enSettings from "./locales/en/settings.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof enCommon;
      app: typeof enApp;
      settings: typeof enSettings;
      chat: typeof enChat;
    };
  }
}
