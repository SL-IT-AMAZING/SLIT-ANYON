import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import type { UserSettings, VertexProviderSetting } from "@/lib/schemas";
import { CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function VertexConfiguration() {
  const { t } = useTranslation(["settings", "common"]);
  const { settings, updateSettings } = useSettings();
  const existing =
    (settings?.providerSettings?.vertex as VertexProviderSetting) ?? {};

  const [projectId, setProjectId] = useState(existing.projectId || "");
  const [location, setLocation] = useState(existing.location || "");
  const [serviceAccountKey, setServiceAccountKey] = useState(
    existing.serviceAccountKey?.value || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProjectId(existing.projectId || "");
    setLocation(existing.location || "");
    setServiceAccountKey(existing.serviceAccountKey?.value || "");
  }, [settings?.providerSettings?.vertex]);

  const onSave = async () => {
    setError(null);
    setSaved(false);
    try {
      // If provided, ensure the service account JSON parses
      if (serviceAccountKey) {
        JSON.parse(serviceAccountKey);
      }
    } catch (e: any) {
      setError(t("providers.vertex.invalidJsonError", { error: e.message }));
      return;
    }

    setSaving(true);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          vertex: {
            ...existing,
            projectId: projectId.trim() || undefined,
            location: location || undefined,
            serviceAccountKey: serviceAccountKey
              ? { value: serviceAccountKey }
              : undefined,
          },
        },
      };
      await updateSettings(settingsUpdate);
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || t("providers.vertex.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = Boolean(
    (projectId.trim() && location && serviceAccountKey) ||
    (existing.projectId &&
      existing.location &&
      existing.serviceAccountKey?.value),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("providers.vertex.projectId")}
          </label>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t("providers.vertex.projectIdPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("providers.vertex.location")}
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("providers.vertex.locationPlaceholder")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("providers.vertex.locationDescription")}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("providers.vertex.serviceAccountKey")}
          </label>
          <Textarea
            value={serviceAccountKey}
            onChange={(e) => setServiceAccountKey(e.target.value)}
            placeholder={t("providers.vertex.serviceAccountKeyPlaceholder")}
            className="min-h-40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving
            ? t("buttons.saving", { ns: "common" })
            : t("buttons.save", { ns: "common" })}
        </Button>
        {saved && !error && (
          <span className="flex items-center text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
            {t("toasts.settingUpdated", { ns: "common" })}
          </span>
        )}
      </div>

      {!isConfigured && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("providers.vertex.configurationRequired")}</AlertTitle>
          <AlertDescription>
            {t("providers.vertex.configurationDescription")}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("providers.vertex.saveErrorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
