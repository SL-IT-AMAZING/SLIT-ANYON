import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { ZapIcon } from "lucide-react";

export function BoosterToggle() {
  const { settings, updateSettings } = useSettings();
  const enabled = settings?.enableBooster ?? false;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1 px-2 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground",
              enabled &&
                "text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300",
            )}
            onClick={() => updateSettings({ enableBooster: !enabled })}
            data-testid="booster-toggle"
          />
        }
      >
        <ZapIcon className={cn("h-3.5 w-3.5", enabled && "fill-current")} />
        <span>Boost</span>
      </TooltipTrigger>
      <TooltipContent>
        {enabled ? "Booster enabled" : "Enable booster"}
      </TooltipContent>
    </Tooltip>
  );
}
