import { AutoApproveSwitch } from "@/components/AutoApproveSwitch";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { GitHubIntegration } from "@/components/GitHubIntegration";
import { MaxChatTurnsSelector } from "@/components/MaxChatTurnsSelector";
import { ProviderSettingsGrid } from "@/components/ProviderSettings";
import { SupabaseIntegration } from "@/components/SupabaseIntegration";
import { TelemetrySwitch } from "@/components/TelemetrySwitch";
import { ThinkingBudgetSelector } from "@/components/ThinkingBudgetSelector";
import { VercelIntegration } from "@/components/VercelIntegration";
import { Button } from "@/components/ui/button";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

import { activeSettingsSectionAtom } from "@/atoms/viewAtoms";
import { AutoExpandPreviewSwitch } from "@/components/AutoExpandPreviewSwitch";
import { AutoFixProblemsSwitch } from "@/components/AutoFixProblemsSwitch";
import { AutoUpdateSwitch } from "@/components/AutoUpdateSwitch";
import { ChatCompletionNotificationSwitch } from "@/components/ChatCompletionNotificationSwitch";
import { DefaultChatModeSelector } from "@/components/DefaultChatModeSelector";
import { NeonIntegration } from "@/components/NeonIntegration";
import { NodePathSelector } from "@/components/NodePathSelector";
import { ReleaseChannelSelector } from "@/components/ReleaseChannelSelector";
import { RuntimeModeSelector } from "@/components/RuntimeModeSelector";
import { ZoomSelector } from "@/components/ZoomSelector";

import { ToolsMcpSettings } from "@/components/settings/ToolsMcpSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SECTION_IDS, SETTING_IDS } from "@/lib/settingsSearchIndex";
import { useSetAtom } from "jotai";

export default function SettingsPage() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const appVersion = useAppVersion();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const setActiveSettingsSection = useSetAtom(activeSettingsSectionAtom);

  useEffect(() => {
    setActiveSettingsSection(SECTION_IDS.general);
  }, [setActiveSettingsSection]);

  const handleResetEverything = async () => {
    setIsResetting(true);
    try {
      await ipc.system.resetAll();
      showSuccess("Successfully reset everything. Restart the application.");
    } catch (error) {
      console.error("Error resetting:", error);
      showError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <div className="flex justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="space-y-6">
          <GeneralSettings appVersion={appVersion} />
          <WorkflowSettings />
          <AISettings />

          <div
            id={SECTION_IDS.providers}
            className="bg-card rounded-xl shadow-sm"
          >
            <ProviderSettingsGrid />
          </div>

          <div className="space-y-6">
            <div
              id={SECTION_IDS.telemetry}
              className="bg-card rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-medium text-foreground mb-4">
                Telemetry
              </h2>
              <div id={SETTING_IDS.telemetry} className="space-y-2">
                <TelemetrySwitch />
                <div className="text-sm text-muted-foreground">
                  This records anonymous usage data to improve the product.
                </div>
              </div>

              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <span className="mr-2 font-medium">Telemetry ID:</span>
                <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">
                  {settings ? settings.telemetryUserId : "n/a"}
                </span>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          <div
            id={SECTION_IDS.integrations}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              Integrations
            </h2>
            <div className="space-y-4">
              <div id={SETTING_IDS.github}>
                <GitHubIntegration />
              </div>
              <div id={SETTING_IDS.vercel}>
                <VercelIntegration />
              </div>
              <div id={SETTING_IDS.supabase}>
                <SupabaseIntegration />
              </div>
              <div id={SETTING_IDS.neon}>
                <NeonIntegration />
              </div>
            </div>
          </div>

          {/* Tools (MCP) */}
          <div
            id={SECTION_IDS.toolsMcp}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              Tools (MCP)
            </h2>
            <ToolsMcpSettings />
          </div>

          {/* Experiments Section */}
          <div
            id={SECTION_IDS.experiments}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              Experiments
            </h2>
            <div className="space-y-4">
              <div id={SETTING_IDS.nativeGit} className="space-y-1 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-native-git"
                    aria-label="Enable Native Git"
                    checked={!!settings?.enableNativeGit}
                    onCheckedChange={(checked) => {
                      updateSettings({
                        enableNativeGit: checked,
                      });
                    }}
                  />
                  <Label htmlFor="enable-native-git">Enable Native Git</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  This doesn't require any external Git installation and offers
                  a faster, native-Git performance experience.
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            id={SECTION_IDS.dangerZone}
            className="bg-card rounded-xl shadow-sm p-6 border border-red-200 dark:border-red-800"
          >
            <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h2>

            <div className="space-y-4">
              <div
                id={SETTING_IDS.reset}
                className="flex items-start justify-between flex-col sm:flex-row sm:items-center gap-4"
              >
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Reset Everything
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will delete all your apps, chats, and settings. This
                    action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setIsResetDialogOpen(true)}
                  disabled={isResetting}
                  className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? "Resetting..." : "Reset Everything"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Everything"
        message="Are you sure you want to reset everything? This will delete all your apps, chats, and settings. This action cannot be undone."
        confirmText="Reset Everything"
        cancelText="Cancel"
        onConfirm={handleResetEverything}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}

export function GeneralSettings({ appVersion }: { appVersion: string | null }) {
  const { theme, setTheme } = useTheme();

  return (
    <div id={SECTION_IDS.general} className="bg-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">
        General Settings
      </h2>

      <div className="space-y-4 mb-4">
        <div id={SETTING_IDS.theme} className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">
            Theme
          </label>

          <div className="relative bg-muted rounded-lg p-1 flex">
            {(["system", "light", "dark"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`
                px-4 py-1.5 text-sm font-medium rounded-md
                transition-all duration-200
                ${
                  theme === option
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id={SETTING_IDS.zoom} className="mt-4">
        <ZoomSelector />
      </div>

      <div id={SETTING_IDS.autoUpdate} className="space-y-1 mt-4">
        <AutoUpdateSwitch />
        <div className="text-sm text-muted-foreground">
          This will automatically update the app when new versions are
          available.
        </div>
      </div>

      <div id={SETTING_IDS.releaseChannel} className="mt-4">
        <ReleaseChannelSelector />
      </div>

      <div id={SETTING_IDS.runtimeMode} className="mt-4">
        <RuntimeModeSelector />
      </div>
      <div id={SETTING_IDS.nodePath} className="mt-4">
        <NodePathSelector />
      </div>

      <div className="flex items-center text-sm text-muted-foreground mt-4">
        <span className="mr-2 font-medium">App Version:</span>
        <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">
          {appVersion ? appVersion : "-"}
        </span>
      </div>
    </div>
  );
}

export function WorkflowSettings() {
  return (
    <div id={SECTION_IDS.workflow} className="bg-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">
        Workflow Settings
      </h2>

      <div id={SETTING_IDS.defaultChatMode} className="mt-4">
        <DefaultChatModeSelector />
      </div>

      <div id={SETTING_IDS.autoApprove} className="space-y-1 mt-4">
        <AutoApproveSwitch showToast={false} />
        <div className="text-sm text-muted-foreground">
          This will automatically approve code changes and run them.
        </div>
      </div>

      <div id={SETTING_IDS.autoFix} className="space-y-1 mt-4">
        <AutoFixProblemsSwitch />
        <div className="text-sm text-muted-foreground">
          This will automatically fix TypeScript errors.
        </div>
      </div>

      <div id={SETTING_IDS.autoExpandPreview} className="space-y-1 mt-4">
        <AutoExpandPreviewSwitch />
        <div className="text-sm text-muted-foreground">
          Automatically expand the preview panel when code changes are made.
        </div>
      </div>

      <div
        id={SETTING_IDS.chatCompletionNotification}
        className="space-y-1 mt-4"
      >
        <ChatCompletionNotificationSwitch />
        <div className="text-sm text-muted-foreground">
          Show a native notification when a chat response completes while the
          app is not focused.
        </div>
      </div>
    </div>
  );
}
export function AISettings() {
  return (
    <div id={SECTION_IDS.ai} className="bg-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">AI Settings</h2>

      <div id={SETTING_IDS.thinkingBudget} className="mt-4">
        <ThinkingBudgetSelector />
      </div>

      <div id={SETTING_IDS.maxChatTurns} className="mt-4">
        <MaxChatTurnsSelector />
      </div>
    </div>
  );
}
