import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/useSettings";
import { useSupabase } from "@/hooks/useSupabase";
import { isSupabaseConnected } from "@/lib/schemas";
import { showError, showSuccess } from "@/lib/toast";
// We might need a Supabase icon here, but for now, let's use a generic one or text.
// import { Supabase } from "lucide-react"; // Placeholder
import { DatabaseZap, Trash2 } from "lucide-react"; // Using DatabaseZap as a placeholder
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function SupabaseIntegration() {
  const { t } = useTranslation(["app", "common"]);
  const { settings, updateSettings } = useSettings();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check if there are any connected organizations
  const isConnected = isSupabaseConnected(settings);

  const { organizations, refetchOrganizations, deleteOrganization } =
    useSupabase();

  const handleDisconnectAllFromSupabase = async () => {
    setIsDisconnecting(true);
    try {
      // Clear the entire supabase object in settings (including all organizations)
      const result = await updateSettings({
        supabase: undefined,
        // Also disable the migration setting on disconnect
        enableSupabaseWriteSqlMigration: false,
      });
      if (result) {
        showSuccess(t("connect.supabase.allOrgsDisconnected"));
        await refetchOrganizations();
      } else {
        showError(t("connect.supabase.disconnectFailed"));
      }
    } catch (err: any) {
      showError(err.message || t("connect.supabase.disconnectError"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDeleteOrganization = async (organizationSlug: string) => {
    try {
      await deleteOrganization({ organizationSlug });
      showSuccess(t("connect.supabase.orgDisconnected"));
    } catch (err: any) {
      showError(
        err.message ||
          t("connect.supabase.orgDisconnectFailed", { message: "" }),
      );
    }
  };

  const handleMigrationSettingChange = async (enabled: boolean) => {
    try {
      await updateSettings({
        enableSupabaseWriteSqlMigration: enabled,
      });
      showSuccess(t("connect.supabase.settingUpdated"));
    } catch (err: any) {
      showError(err.message || t("connect.supabase.settingUpdateFailed"));
    }
  };

  const handleSkipPruneSettingChange = async (enabled: boolean) => {
    try {
      await updateSettings({
        skipPruneEdgeFunctions: enabled,
      });
      showSuccess(t("connect.supabase.settingUpdated"));
    } catch (err: any) {
      showError(err.message || t("connect.supabase.settingUpdateFailed"));
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("connect.supabase.integrationTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("connect.supabase.orgCount", { count: organizations.length })}
          </p>
        </div>
        <Button
          onClick={handleDisconnectAllFromSupabase}
          variant="destructive"
          size="sm"
          disabled={isDisconnecting}
          className="flex items-center gap-2"
        >
          {isDisconnecting
            ? t("connect.supabase.disconnecting")
            : t("connect.supabase.disconnectAll")}
          <DatabaseZap className="h-4 w-4" />
        </Button>
      </div>

      {/* Connected organizations list */}
      <div className="mt-3 space-y-1">
        {organizations.map((org) => (
          <div
            key={org.organizationSlug}
            className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm gap-2"
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-muted-foreground font-medium truncate">
                {org.name || `Organization ${org.organizationSlug.slice(0, 8)}`}
              </span>
              {org.ownerEmail && (
                <span className="text-xs text-muted-foreground truncate">
                  {org.ownerEmail}
                </span>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() =>
                      handleDeleteOrganization(org.organizationSlug)
                    }
                  />
                }
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">
                  {t("connect.supabase.disconnect")}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("connect.supabase.disconnectOrg")}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center space-x-3">
          <Switch
            id="supabase-migrations"
            aria-label={t("connect.supabase.writeSqlMigrations")}
            checked={!!settings?.enableSupabaseWriteSqlMigration}
            onCheckedChange={handleMigrationSettingChange}
          />
          <div className="space-y-1">
            <Label
              htmlFor="supabase-migrations"
              className="text-sm font-medium"
            >
              {t("connect.supabase.writeSqlMigrations")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("connect.supabase.writeSqlMigrationsDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center space-x-3">
          <Switch
            id="skip-prune-edge-functions"
            aria-label={t("connect.supabase.keepEdgeFunctions")}
            checked={!!settings?.skipPruneEdgeFunctions}
            onCheckedChange={handleSkipPruneSettingChange}
          />
          <div className="space-y-1">
            <Label
              htmlFor="skip-prune-edge-functions"
              className="text-sm font-medium"
            >
              {t("connect.supabase.keepEdgeFunctions")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("connect.supabase.keepEdgeFunctionsDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
