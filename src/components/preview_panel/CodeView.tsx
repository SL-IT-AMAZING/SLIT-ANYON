import { selectedFileAtom } from "@/atoms/viewAtoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useAtomValue } from "jotai";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { FileEditor } from "./FileEditor";
import { FileTree } from "./FileTree";

interface App {
  id?: number;
  files?: string[];
}

export interface CodeViewProps {
  loading: boolean;
  app: App | null;
}

// Code view component that displays app files or status messages
export const CodeView = ({ loading, app }: CodeViewProps) => {
  const selectedFile = useAtomValue(selectedFileAtom);
  const { refreshApp } = useLoadApp(app?.id ?? null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  if (loading) {
    return <div className="text-center py-4">Loading files...</div>;
  }

  if (!app) {
    return (
      <div className="text-center py-4 text-muted-foreground">No app selected</div>
    );
  }

  if (app.files && app.files.length > 0) {
    return (
      <div
        className={`flex flex-col bg-background ${isFullscreen ? "fixed inset-0 z-50 h-screen w-screen shadow-2xl" : "h-full"}`}
      >
        {/* Toolbar */}
        <div className="flex items-center p-2 border-b space-x-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => refreshApp()}
                  className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !app.id}
                />
              }
            >
              <RefreshCw size={16} />
            </TooltipTrigger>
            <TooltipContent>Refresh Files</TooltipContent>
          </Tooltip>
          <div className="text-sm text-muted-foreground">{app.files.length} files</div>
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => setIsFullscreen((value) => !value)}
                  className="p-1 rounded hover:bg-accent"
                />
              }
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "Exit full screen" : "Enter full screen"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r overflow-hidden flex flex-col min-h-0">
            <FileTree appId={app.id ?? null} files={app.files} />
          </div>
          <div className="w-2/3">
            {selectedFile ? (
              <FileEditor
                appId={app.id ?? null}
                filePath={selectedFile.path}
                initialLine={selectedFile.line ?? null}
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Select a file to view
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center py-4 text-muted-foreground">No files found</div>;
};
