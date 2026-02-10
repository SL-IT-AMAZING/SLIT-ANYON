import { useSettings } from "@/hooks/useSettings";
import i18n, { type SupportedLanguage, supportedLanguages } from "@/i18n";
import type { Language } from "@/lib/schemas";
import { type ReactNode, createContext, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  supportedLanguages: readonly SupportedLanguage[];
  t: ReturnType<typeof useTranslation>["t"];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { t, i18n: i18nInstance } = useTranslation();

  const currentLanguage = (settings?.language as SupportedLanguage) ?? "en";

  useEffect(() => {
    if (settings?.language && i18nInstance.language !== settings.language) {
      i18nInstance.changeLanguage(settings.language);
    }
  }, [settings?.language, i18nInstance]);

  const setLanguage = async (lang: SupportedLanguage) => {
    await i18nInstance.changeLanguage(lang);
    await updateSettings({ language: lang as Language });
  };

  return (
    <I18nContext.Provider
      value={{
        language: currentLanguage,
        setLanguage,
        supportedLanguages,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export { i18n };
