import {
  appConsoleEntriesAtom,
  previewModeAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { chatInputValueAtom } from "@/atoms/chatAtoms";
import { selectedComponentsPreviewAtom } from "@/atoms/previewAtoms";
import { SidebarToggle } from "@/components/SidebarToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAppOutputSubscription, useRunApp } from "@/hooks/useRunApp";
import { useSettings } from "@/hooks/useSettings";
import i18n from "@/i18n";
import { ipc } from "@/ipc/types";
import type { ZoomLevel } from "@/lib/schemas";
import { showError } from "@/lib/toast";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Toaster } from "sonner";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TitleBar } from "./TitleBar";

const DEFAULT_ZOOM_LEVEL: ZoomLevel = "100";

export default function RootLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshAppIframe } = useRunApp();
  // Subscribe to app output events once at the root level to avoid duplicates
  useAppOutputSubscription();
  const previewMode = useAtomValue(previewModeAtom);
  const { settings } = useSettings();
  const setSelectedComponentsPreview = useSetAtom(
    selectedComponentsPreviewAtom,
  );
  const setChatInput = useSetAtom(chatInputValueAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const setConsoleEntries = useSetAtom(appConsoleEntriesAtom);
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);

  const appDetailAppId = useMemo(() => {
    const pathname = location.pathname;
    if (!pathname.startsWith("/apps/") || pathname === "/apps") {
      return null;
    }

    const rawAppId = pathname.split("/")[2];
    if (!rawAppId) {
      return null;
    }

    const parsed = Number(rawAppId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [location.pathname]);

  const handleOpenEditor = useCallback(async () => {
    if (appDetailAppId === null) return;

    setIsOpeningEditor(true);
    setSelectedAppId(appDetailAppId);

    try {
      const chats = await ipc.chat.getChats(appDetailAppId);
      const targetChatId =
        chats[0]?.id ?? (await ipc.chat.createChat(appDetailAppId));

      await navigate({ to: "/chat", search: { id: targetChatId } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Failed to open editor: ${message}`);
    } finally {
      setIsOpeningEditor(false);
    }
  }, [appDetailAppId, navigate, setSelectedAppId]);

  useEffect(() => {
    const zoomLevel = settings?.zoomLevel ?? DEFAULT_ZOOM_LEVEL;
    const zoomFactor = Number(zoomLevel) / 100;

    const electronApi = (
      window as Window & {
        electron?: {
          webFrame?: {
            setZoomFactor: (factor: number) => void;
          };
        };
      }
    ).electron;

    if (electronApi?.webFrame?.setZoomFactor) {
      electronApi.webFrame.setZoomFactor(zoomFactor);

      return () => {
        electronApi.webFrame?.setZoomFactor(Number(DEFAULT_ZOOM_LEVEL) / 100);
      };
    }

    return () => {};
  }, [settings?.zoomLevel]);

  useEffect(() => {
    const language = settings?.language ?? "en";
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [settings?.language]);
  // Global keyboard listener for refresh events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+R (Windows/Linux) or Cmd+R (macOS)
      if (event.key === "r" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault(); // Prevent default browser refresh
        if (previewMode === "preview") {
          refreshAppIframe(); // Use our custom refresh function instead
        }
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [refreshAppIframe, previewMode]);

  useEffect(() => {
    setChatInput("");
    setSelectedComponentsPreview([]);
    setConsoleEntries([]);
  }, [selectedAppId]);

  return (
    <>
      <ThemeProvider>
        <DeepLinkProvider>
          <SidebarProvider>
            <TitleBar />
            <AppSidebar />
            <div
              id="layout-main-content-container"
              className="flex flex-col h-screenish w-full overflow-x-hidden mt-12 mb-4 mx-4 border border-border rounded-xl bg-background shadow-sm"
            >
              {location.pathname !== "/chat" && (
                <div className="flex items-center h-10 px-2 shrink-0">
                  <SidebarToggle />
                  {appDetailAppId !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEditor}
                      disabled={isOpeningEditor}
                      className="ml-2 h-8"
                    >
                      {isOpeningEditor ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Edit"
                      )}
                    </Button>
                  )}
                </div>
              )}
              <div className="flex flex-1 min-h-0 overflow-auto">
                {children}
              </div>
            </div>
            <Toaster richColors />
          </SidebarProvider>
        </DeepLinkProvider>
      </ThemeProvider>
    </>
  );
}
