import { Skeleton } from "@/components/ui/skeleton";
import { useLoadApps } from "@/hooks/useLoadApps";
import { cn, getAppDisplayName } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Plus, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AppsListPage() {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { apps, loading } = useLoadApps();

  const handleAppClick = (id: number) => {
    navigate({ to: "/apps/$appId", params: { appId: String(id) } });
  };

  const handleCreateClick = () => {
    // TODO(phase-2.2): implement create-new-app flow
    navigate({ to: "/" });
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
                className="flex flex-col p-5 rounded-xl border border-border"
              >
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2" />
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
              <button
                type="button"
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                className={cn(
                  "flex flex-col items-start p-5 rounded-xl",
                  "border border-border",
                  "bg-card/50 backdrop-blur-sm",
                  "text-left",
                  "transition-all duration-200",
                  "hover:bg-card hover:shadow-md hover:border-border/80",
                  "active:scale-[0.98]",
                  "cursor-pointer",
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium text-foreground truncate pr-2">
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
              </button>
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
      </div>
    </div>
  );
}
