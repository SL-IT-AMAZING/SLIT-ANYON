import { ContextFilesPicker } from "@/components/ContextFilesPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useDesignSystems } from "@/hooks/useDesignSystems";
import { useSettings } from "@/hooks/useSettings";
import { useThemes } from "@/hooks/useThemes";
import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Blocks,
  ChartColumnIncreasing,
  Check,
  Palette,
  Paperclip,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { FileAttachmentDropdown } from "./FileAttachmentDropdown";

interface AuxiliaryActionsMenuProps {
  onFileSelect: (
    files: FileList,
    type: "chat-context" | "upload-to-codebase",
  ) => void;
  showTokenBar?: boolean;
  toggleShowTokenBar?: () => void;
  hideContextFilesPicker?: boolean;
  appId?: number;
}

export function AuxiliaryActionsMenu({
  onFileSelect,
  showTokenBar,
  toggleShowTokenBar,
  hideContextFilesPicker,
  appId,
}: AuxiliaryActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { themes } = useThemes();
  const { designSystems } = useDesignSystems();
  const { themeId: appThemeId } = useAppTheme(appId);
  const { settings, updateSettings } = useSettings();
  const queryClient = useQueryClient();

  // Determine current theme: use app theme if appId exists, otherwise use settings
  // Note: settings stores empty string for "no theme", convert to null
  const currentThemeId =
    appId != null ? appThemeId : settings?.selectedThemeId || null;
  const currentDesignSystemId = settings?.selectedDesignSystemId || null;

  const handleThemeSelect = async (themeId: string | null) => {
    if (appId != null) {
      // Update app-specific theme
      await ipc.template.setAppTheme({
        appId,
        themeId,
      });
      // Invalidate app theme query to refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.appTheme.byApp({ appId }),
      });
    } else {
      // Update default theme in settings (for new apps)
      // Store as string for settings (empty string for no theme)
      await updateSettings({ selectedThemeId: themeId ?? "" });
    }
  };

  const handleDesignSystemSelect = async (designSystemId: string | null) => {
    if (appId != null) {
      return;
    }
    await updateSettings({ selectedDesignSystemId: designSystemId ?? "" });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-full size-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer"
        data-testid="auxiliary-actions-menu"
      >
        <Plus
          size={20}
          className={`transition-transform duration-200 ${isOpen ? "rotate-45" : "rotate-0"}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Codebase Context */}
        {!hideContextFilesPicker && <ContextFilesPicker />}

        {/* Attach Files Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="py-2 px-3">
            <Paperclip size={16} className="mr-2" />
            Attach files
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <FileAttachmentDropdown
              onFileSelect={onFileSelect}
              closeMenu={() => setIsOpen(false)}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Themes Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="py-2 px-3">
            <Palette size={16} className="mr-2" />
            Themes
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleThemeSelect(null)}
              className={`py-2 px-3 ${currentThemeId === null ? "bg-primary/10" : ""}`}
              data-testid="theme-option-none"
            >
              <div className="flex items-center w-full">
                <Ban size={16} className="mr-2 text-muted-foreground" />
                <span className="flex-1">No Theme</span>
                {currentThemeId === null && (
                  <Check size={16} className="text-primary ml-2" />
                )}
              </div>
            </DropdownMenuItem>

            {/* Built-in themes from themesData */}
            {themes?.map((theme) => {
              const isSelected = currentThemeId === theme.id;
              return (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`py-2 px-3 ${isSelected ? "bg-primary/10" : ""}`}
                  data-testid={`theme-option-${theme.id}`}
                  title={theme.description}
                >
                  <div className="flex items-center w-full">
                    {theme.icon === "palette" && (
                      <Palette
                        size={16}
                        className="mr-2 text-muted-foreground"
                      />
                    )}
                    <span className="flex-1">{theme.name}</span>
                    {isSelected && (
                      <Check size={16} className="text-primary ml-2" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}

            {appId == null && designSystems.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDesignSystemSelect(null)}
                  className={`py-2 px-3 ${currentDesignSystemId === null ? "bg-primary/10" : ""}`}
                  data-testid="design-system-option-none"
                >
                  <div className="flex items-center w-full">
                    <Ban size={16} className="mr-2 text-muted-foreground" />
                    <span className="flex-1">No Design System</span>
                    {currentDesignSystemId === null && (
                      <Check size={16} className="text-primary ml-2" />
                    )}
                  </div>
                </DropdownMenuItem>
                {designSystems.map((designSystem) => {
                  const isSelected =
                    currentDesignSystemId === designSystem.id;
                  return (
                    <DropdownMenuItem
                      key={`design-system-${designSystem.id}`}
                      onClick={() =>
                        handleDesignSystemSelect(designSystem.id)
                      }
                      className={`py-2 px-3 ${isSelected ? "bg-primary/10" : ""}`}
                      data-testid={`design-system-option-${designSystem.id}`}
                      title={designSystem.description}
                    >
                      <div className="flex items-center w-full">
                        <Blocks
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        <span className="flex-1">
                          {designSystem.displayName}
                        </span>
                        {isSelected && (
                          <Check size={16} className="text-primary ml-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {toggleShowTokenBar && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={toggleShowTokenBar}
              className={`py-2 px-3 group ${showTokenBar ? "bg-primary/10 text-primary" : ""}`}
              data-testid="token-bar-toggle"
            >
              <ChartColumnIncreasing
                size={16}
                className={
                  showTokenBar
                    ? "text-primary group-hover:text-accent-foreground"
                    : ""
                }
              />
              <span className="flex-1">
                {showTokenBar ? "Hide" : "Show"} token usage
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
