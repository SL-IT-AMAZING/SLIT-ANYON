import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { type Language, LanguageSchema } from "@/lib/schemas";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGE_LABELS: Record<
  Language,
  "general.languageOptions.en" | "general.languageOptions.ko"
> = {
  en: "general.languageOptions.en",
  ko: "general.languageOptions.ko",
};

const LANGUAGE_DESCRIPTIONS: Record<
  Language,
  | "general.languageOptionDescriptions.en"
  | "general.languageOptionDescriptions.ko"
> = {
  en: "general.languageOptionDescriptions.en",
  ko: "general.languageOptionDescriptions.ko",
};

const DEFAULT_LANGUAGE: Language = "en";
const LANGUAGE_ORDER: Language[] = ["en", "ko"];

export function LanguageSelector() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation("settings");

  const currentLanguage: Language = useMemo(() => {
    const value = settings?.language ?? DEFAULT_LANGUAGE;
    return LanguageSchema.safeParse(value).success
      ? (value as Language)
      : DEFAULT_LANGUAGE;
  }, [settings?.language]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="language">{t("general.language")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("general.languageDescription")}
        </p>
      </div>
      <Select
        value={currentLanguage}
        onValueChange={(value) =>
          updateSettings({ language: value as Language })
        }
      >
        <SelectTrigger id="language" className="w-[220px]">
          <SelectValue placeholder={t("general.languagePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_ORDER.map((value) => (
            <SelectItem key={value} value={value}>
              <div className="flex flex-col text-left">
                <span>{t(LANGUAGE_LABELS[value])}</span>
                <span className="text-xs text-muted-foreground">
                  {t(LANGUAGE_DESCRIPTIONS[value])}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
