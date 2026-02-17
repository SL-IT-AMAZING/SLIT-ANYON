import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { type ZoomLevel, ZoomLevelSchema } from "@/lib/schemas";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const ZOOM_LEVEL_LABELS: Record<ZoomLevel, string> = {
  "90": "90%",
  "100": "100%",
  "110": "110%",
  "125": "125%",
  "150": "150%",
};

const ZOOM_LEVEL_DESCRIPTION_KEYS: Record<
  ZoomLevel,
  | "general.zoomLevelDescriptions.90"
  | "general.zoomLevelDescriptions.100"
  | "general.zoomLevelDescriptions.110"
  | "general.zoomLevelDescriptions.125"
  | "general.zoomLevelDescriptions.150"
> = {
  "90": "general.zoomLevelDescriptions.90",
  "100": "general.zoomLevelDescriptions.100",
  "110": "general.zoomLevelDescriptions.110",
  "125": "general.zoomLevelDescriptions.125",
  "150": "general.zoomLevelDescriptions.150",
};

const DEFAULT_ZOOM_LEVEL: ZoomLevel = "100";

export function ZoomSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  const currentZoomLevel: ZoomLevel = useMemo(() => {
    const value = settings?.zoomLevel ?? DEFAULT_ZOOM_LEVEL;
    return ZoomLevelSchema.safeParse(value).success
      ? (value as ZoomLevel)
      : DEFAULT_ZOOM_LEVEL;
  }, [settings?.zoomLevel]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="zoom-level">{t("general.zoom")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("general.zoomDescription")}
        </p>
      </div>
      <Select
        value={currentZoomLevel}
        onValueChange={(value) =>
          updateSettings({ zoomLevel: value as ZoomLevel })
        }
      >
        <SelectTrigger id="zoom-level" className="w-[220px]">
          <SelectValue placeholder={t("general.zoomPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ZOOM_LEVEL_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <div className="flex flex-col text-left">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">
                  {t(ZOOM_LEVEL_DESCRIPTION_KEYS[value as ZoomLevel])}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
