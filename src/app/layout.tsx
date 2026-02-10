import {
  appConsoleEntriesAtom,
  previewModeAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { chatInputValueAtom } from "@/atoms/chatAtoms";
import { selectedComponentsPreviewAtom } from "@/atoms/previewAtoms";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePlanEvents } from "@/hooks/usePlanEvents";
import { useAppOutputSubscription, useRunApp } from "@/hooks/useRunApp";
import { useSettings } from "@/hooks/useSettings";
import i18n from "@/i18n";
import type { ZoomLevel } from "@/lib/schemas";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TitleBar } from "./TitleBar";

const DEFAULT_ZOOM_LEVEL: ZoomLevel = "100";

export default function RootLayout({ children }: { children: ReactNode }) {
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
  const setConsoleEntries = useSetAtom(appConsoleEntriesAtom);

  // Initialize plan events listener
  usePlanEvents();

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
              className="flex h-screenish w-full overflow-x-hidden mt-12 mb-4 mr-4 border-t border-l border-border rounded-lg bg-background"
            >
              {children}
            </div>
            <Toaster richColors />
          </SidebarProvider>
        </DeepLinkProvider>
      </ThemeProvider>
    </>
  );
}
