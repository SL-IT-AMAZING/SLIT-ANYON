import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import type { OpenCodeConnectionMode, UserSettings } from "@/lib/schemas";
import { showError, showSuccess } from "@/lib/toast";
import { CheckCircle, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function OpenCodeConnectionModeSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!settings) {
    return null;
  }

  const handleChange = async (value: OpenCodeConnectionMode) => {
    try {
      await updateSettings({ openCodeConnectionMode: value });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("ai.openCodeConnection.updateModeFailed", { message }));
    }
  };

  const savedApiKey = settings.providerSettings?.auto?.apiKey?.value;
  const hasSavedKey =
    !!savedApiKey &&
    !savedApiKey.startsWith("Invalid Key") &&
    savedApiKey !== "Not Set";

  const handleSaveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings.providerSettings,
          auto: {
            ...settings.providerSettings?.auto,
            apiKey: { value: trimmed },
          },
        },
        enableAnyonPro: true,
      };
      await updateSettings(settingsUpdate);
      setApiKeyInput("");
      showSuccess(t("ai.openCodeConnection.savedSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("ai.openCodeConnection.saveFailed", { message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        providerSettings: {
          ...settings.providerSettings,
          auto: {
            ...settings.providerSettings?.auto,
            apiKey: undefined,
          },
        },
        enableAnyonPro: false,
      });
      showSuccess(t("ai.openCodeConnection.deleteSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("ai.openCodeConnection.deleteFailed", { message }));
    } finally {
      setIsSaving(false);
    }
  };

  const currentMode = settings.openCodeConnectionMode ?? "proxy";
  const maskedKey = savedApiKey
    ? `${savedApiKey.slice(0, 8)}${"•".repeat(12)}${savedApiKey.slice(-4)}`
    : "";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium" htmlFor="opencode-connection">
            {t("ai.openCodeConnection.label")}
          </Label>
          <Select
            value={currentMode}
            onValueChange={(v) => v && handleChange(v)}
          >
            <SelectTrigger className="w-64" id="opencode-connection">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proxy">
                {t("ai.openCodeConnection.options.proxy")}
              </SelectItem>
              <SelectItem value="direct">
                {t("ai.openCodeConnection.options.direct")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentMode === "proxy"
            ? t("ai.openCodeConnection.descriptions.proxy")
            : t("ai.openCodeConnection.descriptions.direct")}
        </div>
      </div>

      {currentMode === "proxy" && (
        <div className="space-y-2 rounded-lg border p-3">
          <Label className="text-sm font-medium">
            {t("ai.openCodeConnection.apiKeyLabel")}
          </Label>

          {hasSavedKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span className="truncate">
                  {showKey ? savedApiKey : maskedKey}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteKey}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder={t("ai.openCodeConnection.apiKeyPlaceholder")}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleSaveKey}
                disabled={isSaving || !apiKeyInput.trim()}
                size="sm"
              >
                {isSaving
                  ? t("ai.openCodeConnection.saving")
                  : t("ai.openCodeConnection.save")}
              </Button>
            </div>
          )}
        </div>
      )}

      {currentMode === "direct" && (
        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          {t("ai.openCodeConnection.directWarning")}
        </div>
      )}
    </div>
  );
}
