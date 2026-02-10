import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enApp from "./locales/en/app.json";
import enChat from "./locales/en/chat.json";
import enCommon from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";

import koApp from "./locales/ko/app.json";
import koChat from "./locales/ko/chat.json";
import koCommon from "./locales/ko/common.json";
import koSettings from "./locales/ko/settings.json";

export const defaultNS = "common" as const;
export const supportedLanguages = ["en", "ko"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      app: enApp,
      settings: enSettings,
      chat: enChat,
    },
    ko: {
      common: koCommon,
      app: koApp,
      settings: koSettings,
      chat: koChat,
    },
  },

  lng: "en",
  fallbackLng: "en",
  defaultNS,
  ns: ["common", "app", "settings", "chat"],

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
});

export default i18n;
