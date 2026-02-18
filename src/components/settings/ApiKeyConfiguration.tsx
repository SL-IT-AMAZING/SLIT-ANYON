import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserSettings } from "@/lib/schemas";
import { showError } from "@/lib/toast";
import { Clipboard, Info, KeyRound, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AzureConfiguration } from "./AzureConfiguration";
import { VertexConfiguration } from "./VertexConfiguration";

// Helper function to mask ENV API keys (move or duplicate if needed elsewhere)
const maskEnvApiKey = (key: string | undefined): string => {
  if (!key) return "Not Set";
  if (key.length < 8) return "****";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

interface ApiKeyConfigurationProps {
  provider: string;
  providerDisplayName: string;
  settings: UserSettings | null | undefined;
  envVars: Record<string, string | undefined>;
  envVarName?: string;
  isSaving: boolean;
  saveError: string | null;
  apiKeyInput: string;
  onApiKeyInputChange: (value: string) => void;
  onSaveKey: (value: string) => Promise<void>;
  onDeleteKey: () => Promise<void>;
  isAnyon: boolean;
  updateSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
}

export function ApiKeyConfiguration({
  provider,
  providerDisplayName,
  settings,
  envVars,
  envVarName,
  isSaving,
  saveError,
  apiKeyInput,
  onApiKeyInputChange,
  onSaveKey,
  onDeleteKey,
  isAnyon,
  updateSettings,
}: ApiKeyConfigurationProps) {
  const { t } = useTranslation(["settings", "common"]);

  // Special handling for Azure OpenAI which requires environment variables
  if (provider === "azure") {
    return (
      <AzureConfiguration
        settings={settings}
        envVars={envVars}
        updateSettings={updateSettings}
      />
    );
  }
  // Special handling for Google Vertex AI which uses service account credentials
  if (provider === "vertex") {
    return <VertexConfiguration />;
  }

  const envApiKey = envVarName ? envVars[envVarName] : undefined;
  const userApiKey = settings?.providerSettings?.[provider]?.apiKey?.value;

  const isValidUserKey =
    !!userApiKey &&
    !userApiKey.startsWith("Invalid Key") &&
    userApiKey !== "Not Set";
  const hasEnvKey = !!envApiKey;

  const activeKeySource = isValidUserKey
    ? "settings"
    : hasEnvKey
      ? "env"
      : "none";

  const defaultAccordionValue = [];
  if (isValidUserKey || !hasEnvKey) {
    defaultAccordionValue.push("settings-key");
  }
  if (!isAnyon && hasEnvKey) {
    defaultAccordionValue.push("env-key");
  }

  return (
    <Accordion
      multiple
      className="w-full space-y-4"
      defaultValue={defaultAccordionValue}
    >
      <AccordionItem
        value="settings-key"
        className="border rounded-lg px-4 bg-(--background-lightest)"
      >
        <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
          {t("providers.apiKeyFromSettings", { ns: "settings" })}
        </AccordionTrigger>
        <AccordionContent className="pt-4 ">
          {isValidUserKey && (
            <Alert variant="default" className="mb-4">
              <KeyRound className="h-4 w-4" />
              <AlertTitle className="flex justify-between items-center">
                <span>{t("providers.currentKey", { ns: "settings" })}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteKey}
                  disabled={isSaving}
                  className="flex items-center gap-1 h-7 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isSaving
                    ? `${t("buttons.delete", { ns: "common" })}...`
                    : t("buttons.delete", { ns: "common" })}
                </Button>
              </AlertTitle>
              <AlertDescription>
                <p className="font-mono text-sm">{userApiKey}</p>
                {activeKeySource === "settings" && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {t("providers.keyIsActive", { ns: "settings" })}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label
              htmlFor="apiKeyInput"
              className="block text-sm font-medium text-muted-foreground"
            >
              {isValidUserKey
                ? t("buttons.update", { ns: "common" })
                : t("buttons.save", { ns: "common" })}{" "}
              {providerDisplayName} API Key
            </label>
            <div className="flex items-start space-x-2">
              <Input
                id="apiKeyInput"
                value={apiKeyInput}
                onChange={(e) => onApiKeyInputChange(e.target.value)}
                placeholder={t("providers.enterApiKeyPlaceholder", {
                  ns: "settings",
                  provider: providerDisplayName,
                })}
                className={`flex-grow ${saveError ? "border-red-500" : ""}`}
              />
              <Button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      onSaveKey(text);
                    }
                  } catch (error) {
                    showError(t("toasts.pasteFailed", { ns: "common" }));
                    console.error("Failed to paste from clipboard", error);
                  }
                }}
                disabled={isSaving}
                variant="outline"
                size="icon"
                title={t("aria.pasteAndSave", { ns: "common" })}
                aria-label={t("aria.pasteAndSave", { ns: "common" })}
              >
                <Clipboard className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => onSaveKey(apiKeyInput)}
                disabled={isSaving || !apiKeyInput}
              >
                {isSaving ? "Saving..." : "Save Key"}
              </Button>
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <p className="text-xs text-muted-foreground">
              Setting a key here will override the environment variable (if
              set).
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {!isAnyon && envVarName && (
        <AccordionItem
          value="env-key"
          className="border rounded-lg px-4 bg-(--background-lightest)"
        >
          <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
            API Key from Environment Variable
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            {hasEnvKey ? (
              <Alert variant="default">
                <KeyRound className="h-4 w-4" />
                <AlertTitle>Environment Variable Key ({envVarName})</AlertTitle>
                <AlertDescription>
                  <p className="font-mono text-sm">
                    {maskEnvApiKey(envApiKey)}
                  </p>
                  {activeKeySource === "env" && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      This key is currently active (no settings key set).
                    </p>
                  )}
                  {activeKeySource === "settings" && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      This key is currently being overridden by the key set in
                      Settings.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Environment Variable Not Set</AlertTitle>
                <AlertDescription>
                  The{" "}
                  <code className="font-mono bg-muted px-1 rounded text-xs">
                    {envVarName}
                  </code>{" "}
                  environment variable is not set.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              This key is set outside the application. If present, it will be
              used only if no key is configured in the Settings section above.
              Requires app restart to detect changes.
            </p>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
