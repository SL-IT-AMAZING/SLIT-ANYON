import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import type { ListedApp } from "@/ipc/types/app";
import { getAppDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";

type AppItemProps = {
  app: ListedApp;
  handleAppClick: (id: number) => void;
  selectedAppId: number | null;
  handleToggleFavorite: (appId: number, e: React.MouseEvent) => void;
  isFavoriteLoading: boolean;
};

export function AppItem({
  app,
  handleAppClick,
  selectedAppId,
  handleToggleFavorite,
  isFavoriteLoading,
}: AppItemProps) {
  return (
    <SidebarMenuItem className="relative group">
      <div className="flex w-full items-center" title={getAppDisplayName(app)}>
        <Button
          variant="ghost"
          onClick={() => handleAppClick(app.id)}
          className={`justify-start w-full text-left h-9 px-3 py-2 text-sm hover:bg-sidebar-accent rounded-md ${
            selectedAppId === app.id
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : ""
          }`}
          data-testid={`app-list-item-${app.name}`}
        >
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate text-sm">{getAppDisplayName(app)}</span>
            <span className="text-xs text-muted-foreground truncate">
              {formatDistanceToNow(new Date(app.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => handleToggleFavorite(app.id, e)}
          disabled={isFavoriteLoading}
          className="absolute top-1/2 -translate-y-1/2 right-1 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          key={app.id}
          data-testid="favorite-button"
        >
          <Star
            size={12}
            className={
              app.isFavorite
                ? "fill-[#6c55dc] text-[#6c55dc]"
                : "text-muted-foreground hover:fill-[#6c55dc] hover:text-[#6c55dc]"
            }
          />
        </Button>
      </div>
    </SidebarMenuItem>
  );
}
