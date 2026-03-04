import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadApps } from "@/hooks/useLoadApps";
import { ipc } from "@/ipc/types";
import type { ListedApp } from "@/ipc/types/app";
import { showError } from "@/lib/toast";
import { cn, getAppDisplayName } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  AppWindow,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

function AppCardThumbnail({ appId }: { appId: number }) {
  const [hasThumb, setHasThumb] = useState(true);

  const handleError = useCallback(() => setHasThumb(false), []);

  if (!hasThumb) {
    return (
      <div className="w-full aspect-[16/10] rounded-t-[11px] bg-muted/30 flex items-center justify-center">
        <AppWindow className="size-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={`app-thumbnail://app/${appId}`}
      alt=""
      draggable={false}
      onError={handleError}
      className="w-full aspect-[16/10] rounded-t-[11px] object-cover object-top"
    />
  );
}

function AppCard({
  app,
  onClick,
  onDelete,
  onRename,
}: {
  app: ListedApp;
  onClick: () => void;
  onDelete: (app: ListedApp) => void;
  onRename: (app: ListedApp) => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden",
        "border border-border",
        "bg-card/50 backdrop-blur-sm",
        "transition-all duration-200",
        "hover:bg-card hover:shadow-md hover:border-border/80",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col text-left cursor-pointer active:scale-[0.98] transition-transform"
      >
        <AppCardThumbnail appId={app.id} />
        <div className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-foreground truncate pr-6">
              {getAppDisplayName(app)}
            </span>
            {app.isFavorite && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(app.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-lg",
            "bg-black/40 backdrop-blur-sm",
            "text-white/70 hover:text-white hover:bg-black/60",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-150",
            "cursor-pointer",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename(app);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(app);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function AppsListPage() {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { apps, loading, refreshApps } = useLoadApps();

  const [deleteTarget, setDeleteTarget] = useState<ListedApp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ListedApp | null>(null);
  const [newDisplayName, setNewDisplayName] = useState("");

  const handleAppClick = (id: number) => {
    navigate({ to: "/apps/$appId", params: { appId: String(id) } });
  };

  const handleCreateClick = () => {
    navigate({ to: "/" });
  };

  const handleDeleteApp = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ipc.app.deleteApp({ appId: deleteTarget.id });
      await refreshApps();
    } catch (error) {
      showError(error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleOpenRename = (app: ListedApp) => {
    setRenameTarget(app);
    setNewDisplayName(getAppDisplayName(app));
  };

  const handleRenameApp = async () => {
    if (!renameTarget || !newDisplayName.trim()) return;
    try {
      await ipc.app.updateDisplayName({
        appId: renameTarget.id,
        displayName: newDisplayName.trim(),
      });
      await refreshApps();
      setRenameTarget(null);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 sm:px-8">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Your Apps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your projects in one place.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex flex-col rounded-xl border border-border overflow-hidden"
              >
                <Skeleton className="w-full aspect-[16/10]" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={handleCreateClick}
              className={cn(
                "group flex flex-col items-center justify-center gap-3",
                "p-8 rounded-xl",
                "border-2 border-dashed border-border",
                "bg-transparent",
                "text-muted-foreground",
                "transition-all duration-200",
                "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
                "active:scale-[0.98]",
                "cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-10 h-10 rounded-full",
                  "bg-muted/50",
                  "transition-colors duration-200",
                  "group-hover:bg-primary/10",
                )}
              >
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">
                {t("apps.createTitle")}
              </span>
            </button>

            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onClick={() => handleAppClick(app.id)}
                onDelete={setDeleteTarget}
                onRename={handleOpenRename}
              />
            ))}
          </div>
        )}

        {!loading && apps.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No apps yet. Create your first app to get started!
            </p>
          </div>
        )}

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete App</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;
                {deleteTarget ? getAppDisplayName(deleteTarget) : ""}&rdquo;?
                This will permanently remove the app and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteApp}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={renameTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename App</DialogTitle>
              <DialogDescription>
                Enter a new name for your app.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="App name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameApp();
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleRenameApp}
                disabled={!newDisplayName.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
