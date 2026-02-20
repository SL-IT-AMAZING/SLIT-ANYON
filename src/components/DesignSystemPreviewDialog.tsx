import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDesignSystemPreview } from "@/hooks/useDesignSystemPreview";
import { cn } from "@/lib/utils";
import { DESIGN_SYSTEMS } from "@/shared/designSystems";
import { Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useMemo } from "react";

interface DesignSystemPreviewDialogProps {
  designSystemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseDesignSystem: (designSystemId: string) => void;
}

interface ComponentGroup {
  category: string;
  items: { id: string; label: string }[];
}

function groupComponentsByCategory(
  components: { id: string; label: string; category?: string }[],
): ComponentGroup[] {
  const grouped = new Map<string, { id: string; label: string }[]>();

  for (const comp of components) {
    const cat = comp.category ?? "Other";
    const existing = grouped.get(cat);
    if (existing) {
      existing.push({ id: comp.id, label: comp.label });
    } else {
      grouped.set(cat, [{ id: comp.id, label: comp.label }]);
    }
  }

  return Array.from(grouped, ([category, items]) => ({ category, items }));
}

export function DesignSystemPreviewDialog({
  designSystemId,
  open,
  onOpenChange,
  onUseDesignSystem,
}: DesignSystemPreviewDialogProps) {
  const {
    previewUrl,
    isLoading,
    error,
    components,
    activeComponentId,
    navigateToComponent,
    iframeRef,
  } = useDesignSystemPreview(open ? designSystemId : null);

  const designSystem = useMemo(
    () => DESIGN_SYSTEMS.find((ds) => ds.id === designSystemId),
    [designSystemId],
  );

  const componentGroups = useMemo(
    () => groupComponentsByCategory(components),
    [components],
  );

  const handleUse = useCallback(() => {
    if (designSystemId) {
      onUseDesignSystem(designSystemId);
    }
  }, [designSystemId, onUseDesignSystem]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 !flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {designSystem?.displayName ?? "Design System"} Preview
        </DialogTitle>

        <div className="flex items-center justify-between border-b px-5 py-3.5 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
              {designSystem?.displayName ?? "Design System"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {[
                designSystem?.libraryName,
                designSystem
                  ? `${designSystem.componentCount} components`
                  : null,
                designSystem?.category
                  ? designSystem.category.charAt(0).toUpperCase() +
                    designSystem.category.slice(1)
                  : null,
              ]
                .filter(Boolean)
                .join(" \u00B7 ")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleUse}
              disabled={!designSystemId}
            >
              <Sparkles className="size-4" />
              Use This Design System
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="w-56 shrink-0 border-r bg-card flex flex-col min-h-0">
            <div className="px-4 py-3 shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Components
              </h3>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <nav className="px-2 pb-3">
                {isLoading ? (
                  <div className="space-y-2 px-2">
                    {Array.from({ length: 8 }, (_, i) => (
                      <Skeleton key={i} className="h-7 w-full rounded" />
                    ))}
                  </div>
                ) : components.length === 0 && !error ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    No components available
                  </p>
                ) : (
                  componentGroups.map((group) => (
                    <div key={group.category} className="mb-3">
                      {componentGroups.length > 1 && (
                        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          {group.category}
                        </p>
                      )}
                      <div className="space-y-0.5">
                        {group.items.map((comp) => (
                          <button
                            key={comp.id}
                            onClick={() => navigateToComponent(comp.id)}
                            className={cn(
                              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                              activeComponentId === comp.id
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                            )}
                          >
                            {comp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </nav>
            </ScrollArea>
          </aside>

          <div className="flex-1 min-w-0 relative bg-background">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <p className="text-sm font-medium text-destructive">
                  Failed to load preview
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {error.message}
                </p>
              </div>
            ) : isLoading && !previewUrl ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading preview...
                </p>
              </div>
            ) : previewUrl ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Connecting to preview...
                    </p>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-none"
                  title={`${designSystem?.displayName ?? "Design System"} preview`}
                />
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
